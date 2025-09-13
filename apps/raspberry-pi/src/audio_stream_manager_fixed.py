#!/usr/bin/env python3
"""
BlueALSA-optimized Audio Stream Manager for Pommai Raspberry Pi Client
Backward compatible with existing client code while fixing audio issues
"""

import asyncio
import collections
import logging
import time
import struct
from typing import Optional, AsyncGenerator, Callable, Dict, Any, List
from dataclasses import dataclass
from enum import Enum
import numpy as np

import pyaudio


class AudioState(Enum):
    """Audio streaming state machine"""
    IDLE = "idle"
    RECORDING = "recording"
    STREAMING = "streaming"
    PROCESSING = "processing"
    RECEIVING = "receiving"
    PLAYING = "playing"
    ERROR = "error"


@dataclass
class AudioConfig:
    """Audio configuration parameters"""
    sample_rate: int = 16000
    channels: int = 1
    format: int = pyaudio.paInt16
    chunk_size: int = 1024
    frame_size: int = 320  # 20ms at 16kHz
    
    # Buffer configuration - OPTIMIZED FOR BLUEALSA
    recording_buffer_size: int = 50  # ~3 seconds
    playback_buffer_size: int = 100   # More buffer for BlueALSA
    min_playback_buffer: int = 25     # Wait for MORE chunks before starting (was 3)
    
    # Network configuration
    frames_per_packet: int = 3       # 60ms per network packet
    network_chunk_size: int = 960    # 60ms of audio
    
    # Performance limits
    max_recording_buffer: int = 100  # ~6 seconds
    max_playback_buffer: int = 200   # More buffer for stability


class CircularAudioBuffer:
    """Thread-safe circular buffer for audio data"""
    
    def __init__(self, maxsize: int):
        self.buffer = collections.deque(maxlen=maxsize)
        self.lock = asyncio.Lock()
        
    async def add(self, chunk: bytes):
        """Add audio chunk to buffer"""
        async with self.lock:
            self.buffer.append(chunk)
    
    async def get(self) -> Optional[bytes]:
        """Get oldest chunk from buffer"""
        async with self.lock:
            return self.buffer.popleft() if self.buffer else None
    
    async def get_all(self) -> bytes:
        """Get all buffered audio as single bytes object"""
        async with self.lock:
            return b''.join(self.buffer)
    
    async def clear(self):
        """Clear buffer"""
        async with self.lock:
            self.buffer.clear()
    
    def __len__(self) -> int:
        return len(self.buffer)


class AudioStreamManager:
    """BlueALSA-optimized audio streaming manager with backward compatibility"""
    
    def __init__(self, hardware_controller, config: AudioConfig):
        self.hardware = hardware_controller
        self.config = config
        self.state = AudioState.IDLE
        
        # Audio streams from hardware controller
        self.input_stream = hardware_controller.input_stream
        self.output_stream = hardware_controller.output_stream
        
        # Buffers
        self.recording_buffer = CircularAudioBuffer(config.recording_buffer_size)
        self.playback_buffer = CircularAudioBuffer(config.playback_buffer_size)
        
        # CRITICAL: Single playback lock to prevent race conditions
        self.playback_lock = asyncio.Lock()
        self.is_playing = False
        self.is_recording = False
        self.is_streaming = False
        
        # Callbacks
        self.on_audio_chunk: Optional[Callable] = None
        self.on_silence_detected: Optional[Callable] = None
        
        # Performance monitoring
        self.stats = {
            'chunks_recorded': 0,
            'chunks_played': 0,
            'underruns': 0,
            'overruns': 0,
            'average_latency': 0,
            'playback_starts': 0,
            'concurrent_attempts': 0
        }
        
        # Silence detection
        self.silence_threshold = 500  # RMS threshold
        self.silence_duration = 0
        self.max_silence_duration = 2.0  # 2 seconds
        
        logging.info("BlueALSA-optimized Audio Stream Manager initialized")
    
    async def start_recording(self, streaming: bool = True) -> None:
        """Start audio recording from microphone"""
        if self.is_recording:
            logging.warning("Already recording")
            return
        
        self.is_recording = True
        self.is_streaming = streaming
        self.state = AudioState.RECORDING
        
        # Clear buffers
        await self.recording_buffer.clear()
        
        # Start recording task
        asyncio.create_task(self._recording_loop())
        
        logging.info("Started audio recording")
    
    async def stop_recording(self) -> bytes:
        """Stop recording and return all recorded audio"""
        self.is_recording = False
        self.is_streaming = False
        
        # Wait a bit for recording to finish
        await asyncio.sleep(0.1)
        
        # Get all recorded audio
        all_audio = await self.recording_buffer.get_all()
        
        self.state = AudioState.IDLE
        logging.info(f"Stopped recording. Total size: {len(all_audio)} bytes")
        
        return all_audio
    
    async def _recording_loop(self):
        """Main recording loop"""
        sequence = 0
        
        try:
            while self.is_recording:
                # Read audio chunk
                try:
                    audio_data = self.input_stream.read(
                        self.config.chunk_size,
                        exception_on_overflow=False
                    )
                except Exception as e:
                    if "overflow" in str(e).lower():
                        self.stats['overruns'] += 1
                        # Clear buffer and continue
                        available = self.input_stream.get_read_available()
                        if available > 0:
                            self.input_stream.read(available, exception_on_overflow=False)
                        continue
                    else:
                        logging.error(f"Recording error: {e}")
                        await asyncio.sleep(0.01)
                        continue
                
                # Add to buffer
                await self.recording_buffer.add(audio_data)
                self.stats['chunks_recorded'] += 1
                
                # Check for silence
                if self._is_silence(audio_data):
                    self.silence_duration += self.config.chunk_size / self.config.sample_rate
                    if self.silence_duration >= self.max_silence_duration:
                        if self.on_silence_detected:
                            await self.on_silence_detected()
                else:
                    self.silence_duration = 0
                
                # Stream if enabled
                if self.is_streaming and self.on_audio_chunk:
                    await self.on_audio_chunk(audio_data, sequence)
                    sequence += 1
                
                # Small yield to prevent blocking
                await asyncio.sleep(0)
                
        except Exception as e:
            logging.error(f"Recording loop error: {e}")
            self.state = AudioState.ERROR
        finally:
            self.is_recording = False
    
    def _is_silence(self, audio_data: bytes) -> bool:
        """Detect if audio chunk is silence"""
        # Convert to numpy array
        audio_array = np.frombuffer(audio_data, dtype=np.int16)
        
        # Calculate RMS (Root Mean Square)
        rms = np.sqrt(np.mean(audio_array ** 2))
        
        return rms < self.silence_threshold
    
    async def play_audio_stream(self, audio_chunks: AsyncGenerator[Dict[str, Any], None]):
        """MAIN PLAYBACK METHOD - BlueALSA optimized with backward compatibility"""
        
        # CRITICAL: Prevent concurrent playback
        if self.playback_lock.locked():
            self.stats['concurrent_attempts'] += 1
            logging.warning("Playback already in progress - preventing concurrent execution")
            return
        
        async with self.playback_lock:
            if self.is_playing:
                logging.warning("Already playing audio - resetting state")
                self.is_playing = False
                await asyncio.sleep(0.1)

            self.is_playing = True
            self.state = AudioState.RECEIVING
            self.stats['playback_starts'] += 1
            
            # Clear playback buffer
            await self.playback_buffer.clear()
            
            total_chunks = 0
            playback_started = False
            playback_task = None
            
            try:
                logging.info(f"PLAYBACK: Starting audio stream processing")
                
                # PHASE 1: Accumulate chunks until minimum buffer is reached
                async for chunk in audio_chunks:
                    if not self.is_playing:
                        break
                    
                    audio_data = chunk.get('data', b'')
                    is_final = chunk.get('is_final', False)
                    
                    if audio_data:
                        await self.playback_buffer.add(audio_data)
                        total_chunks += 1
                        
                        # Log progress every 10 chunks
                        if total_chunks % 10 == 0:
                            logging.debug(f"Buffered {total_chunks} chunks, queue size: {len(self.playback_buffer)}")
                    
                    # START PLAYBACK when we have sufficient buffer (BlueALSA optimization)
                    if not playback_started and len(self.playback_buffer) >= self.config.min_playback_buffer:
                        playback_started = True
                        self.state = AudioState.PLAYING
                        logging.info(f"Starting playback with {len(self.playback_buffer)} chunks buffered (BlueALSA optimized)")
                        
                        # Small delay to let BlueALSA prepare for streaming
                        await asyncio.sleep(0.1)
                        
                        # Start the optimized playback loop
                        playback_task = asyncio.create_task(self._bluealsa_optimized_playback_loop())
                    
                    if is_final:
                        logging.info(f"Final marker received after {total_chunks} total chunks")
                        break
                
                # Handle case where we never reached min buffer but have data
                if not playback_started and len(self.playback_buffer) > 0:
                    playback_started = True
                    self.state = AudioState.PLAYING
                    logging.info(f"Starting playback with {len(self.playback_buffer)} chunks (below min threshold)")
                    await asyncio.sleep(0.1)
                    playback_task = asyncio.create_task(self._bluealsa_optimized_playback_loop())
                
                # PHASE 2: Wait for playback to complete all chunks
                if playback_task:
                    max_wait = 30.0  # 30 second timeout
                    start_wait = time.time()
                    
                    while self.is_playing and (time.time() - start_wait) < max_wait:
                        # Check if playback is done
                        if len(self.playback_buffer) == 0 and playback_task.done():
                            break
                        await asyncio.sleep(0.1)
                    
                    # Ensure playback task is complete
                    if not playback_task.done():
                        logging.warning("Playback task timeout - cancelling")
                        playback_task.cancel()
                        try:
                            await playback_task
                        except asyncio.CancelledError:
                            pass
                
                logging.info(f"Audio stream complete. Total chunks processed: {total_chunks}")
                
            except Exception as e:
                logging.error(f"Audio stream error: {e}", exc_info=True)
                self.state = AudioState.ERROR
            finally:
                # Always clean up state
                self.is_playing = False
                self.state = AudioState.IDLE
    
    async def _bluealsa_optimized_playback_loop(self):
        """BlueALSA-optimized playback loop with chunk aggregation"""
        try:
            logging.info("PLAYBACK LOOP: Starting BlueALSA-optimized playback...")
            chunks_played = 0
            empty_reads = 0
            
            # BlueALSA optimization: Aggregate small chunks into larger writes
            aggregation_buffer = bytearray()
            min_write_size = 8192  # 8KB writes for BlueALSA stability
            
            while self.is_playing:
                # Collect chunks until we have enough for a good write
                while len(aggregation_buffer) < min_write_size and self.is_playing:
                    audio_data = await self.playback_buffer.get()
                    
                    if audio_data:
                        aggregation_buffer.extend(audio_data)
                        empty_reads = 0
                    else:
                        empty_reads += 1
                        if empty_reads > 20:  # 0.2 seconds of no data
                            break
                        await asyncio.sleep(0.01)
                
                # Write aggregated chunk to BlueALSA
                if len(aggregation_buffer) > 0:
                    try:
                        # Write optimal-sized chunk for BlueALSA
                        write_size = min(min_write_size, len(aggregation_buffer))
                        chunk_to_write = bytes(aggregation_buffer[:write_size])
                        
                        self.output_stream.write(chunk_to_write)
                        
                        # Remove written data
                        del aggregation_buffer[:write_size]
                        chunks_played += 1
                        self.stats['chunks_played'] = chunks_played
                        
                        if chunks_played == 1:
                            logging.info("First aggregated chunk written to output stream")
                        elif chunks_played % 10 == 0:
                            logging.debug(f"Played {chunks_played} aggregated chunks")
                        
                        # Small delay to prevent overwhelming BlueALSA
                        await asyncio.sleep(0.002)
                        
                    except Exception as e:
                        self.stats['underruns'] += 1
                        logging.warning(f"PLAYBACK: Write error: {e}")
                        # Clear aggregation buffer on error
                        aggregation_buffer.clear()
                        await asyncio.sleep(0.01)
                else:
                    # No data available - check if we should stop
                    if empty_reads > 100:  # 1 second of no data
                        if self.state != AudioState.RECEIVING:
                            logging.info(f"Playback complete - played {chunks_played} aggregated chunks")
                            break
                    await asyncio.sleep(0.01)
            
            # Write any remaining data in aggregation buffer
            if len(aggregation_buffer) > 0:
                try:
                    self.output_stream.write(bytes(aggregation_buffer))
                    chunks_played += 1
                    logging.info(f"Final chunk written - total {chunks_played} chunks")
                except Exception as e:
                    logging.warning(f"Final chunk write error: {e}")
            
        except Exception as e:
            logging.error(f"Playback loop error: {e}", exc_info=True)
            self.state = AudioState.ERROR
        finally:
            logging.info(f"PLAYBACK LOOP: Finished - {self.stats.get('chunks_played', 0)} chunks played")
    
    async def play_audio_data(self, audio_data: bytes):
        """Play pre-loaded audio data - backward compatibility method"""
        if self.is_playing:
            logging.warning("Already playing audio")
            return
        
        async with self.playback_lock:
            self.is_playing = True
            self.state = AudioState.PLAYING
            
            try:
                # Split into chunks and write with BlueALSA optimization
                chunk_size = 8192  # Larger chunks for BlueALSA
                chunks = [audio_data[i:i + chunk_size] for i in range(0, len(audio_data), chunk_size)]
                
                logging.info(f"Playing {len(chunks)} pre-loaded chunks")
                
                for i, chunk in enumerate(chunks):
                    if not self.is_playing:
                        break
                        
                    try:
                        self.output_stream.write(chunk)
                        self.stats['chunks_played'] += 1
                        if i == 0:
                            logging.info("First pre-loaded chunk written")
                    except Exception as e:
                        logging.error(f"Pre-loaded playback error: {e}")
                    
                    # Small delay between chunks
                    await asyncio.sleep(0.005)
                    
            except Exception as e:
                logging.error(f"Audio playback error: {e}")
                self.state = AudioState.ERROR
            finally:
                self.is_playing = False
                self.state = AudioState.IDLE
    
    def stop_playback(self):
        """Stop audio playback"""
        self.is_playing = False
        logging.info("Stopped audio playback")
    
    def set_volume(self, volume: float):
        """Set output volume (0.0 to 1.0)"""
        logging.info(f"Volume set to {volume * 100:.0f}%")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        return {
            **self.stats,
            'recording_buffer_size': len(self.recording_buffer),
            'playback_buffer_size': len(self.playback_buffer),
            'state': self.state.value
        }
    
    async def test_audio_levels(self, duration: float = 5.0):
        """Monitor audio input levels for testing"""
        logging.info(f"Testing audio levels for {duration} seconds...")
        
        start_time = time.time()
        max_level = 0
        
        while time.time() - start_time < duration:
            try:
                audio_data = self.input_stream.read(self.config.chunk_size, exception_on_overflow=False)
                audio_array = np.frombuffer(audio_data, dtype=np.int16)
                
                # Calculate RMS
                rms = np.sqrt(np.mean(audio_array ** 2))
                level = min(100, int(rms / 32768 * 200))
                
                if level > max_level:
                    max_level = level
                
                # Log every second
                if int(time.time() - start_time) % 1 == 0:
                    logging.info(f"Audio level: {level}% (Max: {max_level}%)")
                    
            except Exception as e:
                logging.error(f"Level test error: {e}")
                
            await asyncio.sleep(0.1)
        
        logging.info(f"Audio level test complete. Max level: {max_level}%")
        return max_level

    # Backward compatibility methods
    async def initialize(self) -> None:
        """No-op initializer for API compatibility."""
        return None

    async def read_chunk(self):
        """Read one input chunk and return as numpy int16 array."""
        try:
            data = self.input_stream.read(self.config.chunk_size, exception_on_overflow=False)
            return np.frombuffer(data, dtype=np.int16)
        except Exception as e:
            logging.error(f"read_chunk error: {e}")
            return None

    async def play_audio(self, pcm_bytes: bytes):
        """Play a single PCM buffer (bytes)."""
        try:
            await self.play_audio_data(pcm_bytes)
        except Exception as e:
            logging.error(f"play_audio error: {e}")

    async def cleanup(self) -> None:
        """Cleanup hook; streams are owned by hardware controller."""
        self.is_playing = False
        self.is_recording = False
        return None
