#!/usr/bin/env python3
"""
Opus Audio Codec Implementation for Pommai Smart Toy
Handles audio compression/decompression for network transmission
"""

import asyncio
import logging
import struct
import time
import collections
from typing import Optional, Dict, Any, AsyncGenerator, Tuple
from dataclasses import dataclass
from enum import Enum

try:
    import opuslib
except ImportError:
    try:
        # Fallback to pyopus if opuslib not available
        import pyopus as opuslib
    except ImportError:
        # Neither library available - we'll handle this in __init__
        opuslib = None

import numpy as np


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class OpusConfig:
    """Opus codec configuration"""
    sample_rate: int = 16000
    channels: int = 1
    bitrate: int = 24000  # 24 kbps for good quality/size balance
    complexity: int = 5   # Balanced for Pi Zero 2W
    frame_size_ms: int = 20  # 20ms frames recommended
    packet_loss_perc: int = 10  # Expected packet loss %
    enable_fec: bool = True  # Forward Error Correction
    enable_dtx: bool = True  # Discontinuous Transmission
    
    @property
    def frame_size_samples(self) -> int:
        """Calculate frame size in samples"""
        return int(self.sample_rate * self.frame_size_ms / 1000)
    
    @property
    def frame_size_bytes(self) -> int:
        """Calculate frame size in bytes (16-bit samples)"""
        return self.frame_size_samples * 2 * self.channels


class NetworkQuality(Enum):
    """Network quality levels"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"


class OpusAudioCodec:
    """Opus audio codec with adaptive bitrate and FEC"""
    
    def __init__(self, config: Optional[OpusConfig] = None):
        self.config = config or OpusConfig()
        self.encoder = None
        self.decoder = None
        self.initialized = False
        
        # Check if we're using PCM16 format
        import os
        audio_format = os.getenv('AUDIO_SEND_FORMAT', 'opus').lower()
        
        if audio_format == 'pcm16':
            logger.info("PCM16 format configured, skipping Opus codec initialization")
        else:
            try:
                self._setup_codec()
                self.initialized = True
            except Exception as e:
                logger.error(f"Failed to initialize Opus codec: {e}")
                logger.info("Will use PCM16 format instead")
        
        self._setup_buffers()
        self._setup_metrics()
        
    def _setup_codec(self):
        """Initialize Opus encoder and decoder"""
        if opuslib is None:
            raise ImportError("No Opus library available (opuslib or pyopus)")
        
        try:
            # Create encoder
            self.encoder = opuslib.Encoder(
                self.config.sample_rate,
                self.config.channels,
                opuslib.APPLICATION_VOIP  # Optimized for voice
            )
            
            # Configure encoder with proper value passing
            self.encoder.bitrate = self.config.bitrate
            self.encoder.complexity = self.config.complexity
            
            # Handle the FEC setting issue
            try:
                self.encoder.inband_fec = self.config.enable_fec
            except TypeError:
                # Some versions need the value passed differently
                if hasattr(self.encoder, '_set_inband_fec'):
                    self.encoder._set_inband_fec(1 if self.config.enable_fec else 0)
                else:
                    logger.warning("Could not set inband_fec")
            
            self.encoder.packet_loss_perc = self.config.packet_loss_perc
            
            if hasattr(self.encoder, 'dtx'):
                self.encoder.dtx = self.config.enable_dtx
            
            if hasattr(self.encoder, 'signal'):
                self.encoder.signal = opuslib.SIGNAL_VOICE
            
            # Create decoder
            self.decoder = opuslib.Decoder(
                self.config.sample_rate,
                self.config.channels
            )
            
            logger.info(f"Opus (pylibopus) codec initialized: {self.config.bitrate}bps, "
                       f"{self.config.frame_size_ms}ms frames, "
                       f"FEC={self.config.enable_fec}, DTX={self.config.enable_dtx}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Opus codec: {e}")
            raise
    
    def _setup_buffers(self):
        """Initialize audio buffers"""
        self.encode_buffer = bytearray()
        self.decode_buffer = bytearray()
        
        # Jitter buffer for network playback
        self.jitter_buffer = collections.deque(maxlen=10)
        
        # Packet loss concealment
        self.last_frame_size = self.config.frame_size_samples
        self.lost_packet_count = 0
        
    def _setup_metrics(self):
        """Initialize performance metrics"""
        self.metrics = {
            'frames_encoded': 0,
            'frames_decoded': 0,
            'bytes_compressed': 0,
            'bytes_original': 0,
            'encode_errors': 0,
            'decode_errors': 0,
            'packets_lost': 0,
            'network_quality': NetworkQuality.GOOD,
            'current_bitrate': self.config.bitrate
        }
        
    def encode_chunk(self, pcm_data: bytes) -> Optional[bytes]:
        """
        Encode PCM audio chunk to Opus
        
        Args:
            pcm_data: Raw PCM audio (16-bit, mono)
            
        Returns:
            Compressed Opus data with header
        """
        if not self.initialized or self.encoder is None:
            # Codec not initialized, return None to indicate PCM16 should be used
            return None
            
        try:
            # Validate input length
            expected_bytes = self.config.frame_size_bytes
            
            if len(pcm_data) < expected_bytes:
                # Pad with silence
                pcm_data += b'\x00' * (expected_bytes - len(pcm_data))
            elif len(pcm_data) > expected_bytes:
                # Trim excess
                pcm_data = pcm_data[:expected_bytes]
            
            # Encode frame
            encoded = self.encoder.encode(
                pcm_data,
                self.config.frame_size_samples
            )
            
            # Add header (length + frame size)
            header = struct.pack('!HH', len(encoded), self.config.frame_size_samples)
            
            # Update metrics
            self.metrics['frames_encoded'] += 1
            self.metrics['bytes_original'] += len(pcm_data)
            self.metrics['bytes_compressed'] += len(encoded)
            
            return header + encoded
            
        except Exception as e:
            logger.error(f"Encoding error: {e}")
            self.metrics['encode_errors'] += 1
            return None
    
    def decode_chunk(self, opus_data: bytes) -> Optional[bytes]:
        """
        Decode Opus audio chunk to PCM
        
        Args:
            opus_data: Compressed Opus data with header
            
        Returns:
            PCM audio data (16-bit, mono)
        """
        if not self.initialized or self.decoder is None:
            # Codec not initialized, return None
            return None
            
        try:
            # Extract header
            if len(opus_data) < 4:
                return self._generate_silence()
            
            encoded_len, frame_size = struct.unpack('!HH', opus_data[:4])
            encoded_data = opus_data[4:4+encoded_len]
            
            # Decode frame
            pcm_data = self.decoder.decode(encoded_data, frame_size)
            
            # Update metrics
            self.metrics['frames_decoded'] += 1
            self.last_frame_size = frame_size
            
            return pcm_data
            
        except Exception as e:
            logger.error(f"Decoding error: {e}")
            self.metrics['decode_errors'] += 1
            return self._handle_packet_loss()
    
    def decode_with_plc(self, opus_data: Optional[bytes] = None) -> bytes:
        """
        Decode with Packet Loss Concealment
        
        Args:
            opus_data: Compressed data or None for lost packet
            
        Returns:
            PCM audio with PLC if needed
        """
        if opus_data is None:
            # Packet lost - use PLC
            self.metrics['packets_lost'] += 1
            return self._handle_packet_loss()
        else:
            return self.decode_chunk(opus_data)
    
    def _handle_packet_loss(self) -> bytes:
        """Generate concealment audio for lost packet"""
        try:
            # Try to use decoder's built-in PLC
            if hasattr(self.decoder, 'decode') and hasattr(self.decoder.decode, '__call__'):
                pcm_data = self.decoder.decode(None, self.last_frame_size, fec=True)
                return pcm_data
        except:
            pass
        
        # Fallback to silence
        return self._generate_silence()
    
    def _generate_silence(self) -> bytes:
        """Generate silence for current frame size"""
        return b'\x00' * self.config.frame_size_bytes
    
    async def encode_stream(self, audio_stream: AsyncGenerator) -> AsyncGenerator:
        """
        Encode audio stream in real-time
        
        Args:
            audio_stream: Async generator of PCM chunks
            
        Yields:
            Dict with encoded data and metadata
        """
        sequence = 0
        
        async for chunk in audio_stream:
            # Add to buffer
            self.encode_buffer.extend(chunk)
            
            # Process complete frames
            while len(self.encode_buffer) >= self.config.frame_size_bytes:
                # Extract one frame
                frame_data = bytes(self.encode_buffer[:self.config.frame_size_bytes])
                self.encode_buffer = self.encode_buffer[self.config.frame_size_bytes:]
                
                # Check for voice activity
                if self.config.enable_dtx and self._is_silence(frame_data):
                    # Skip silent frames
                    continue
                
                # Encode frame
                encoded = self.encode_chunk(frame_data)
                
                if encoded:
                    yield {
                        'data': encoded,
                        'sequence': sequence,
                        'timestamp': time.time(),
                        'frame_size': self.config.frame_size_samples,
                        'compressed': True
                    }
                    sequence += 1
    
    def _is_silence(self, pcm_data: bytes, threshold_db: float = -40) -> bool:
        """
        Detect if audio frame is silence
        
        Args:
            pcm_data: PCM audio data
            threshold_db: Silence threshold in dBFS
            
        Returns:
            True if silence detected
        """
        try:
            # Convert to numpy array
            audio_array = np.frombuffer(pcm_data, dtype=np.int16)
            
            # Calculate RMS
            rms = np.sqrt(np.mean(audio_array.astype(np.float32) ** 2))
            
            # Convert to dBFS
            if rms > 0:
                db = 20 * np.log10(rms / 32768)
            else:
                db = -96
            
            return db < threshold_db
            
        except Exception:
            return False
    
    def adapt_bitrate(self, packet_loss: float, rtt_ms: float):
        """
        Dynamically adapt bitrate based on network conditions
        
        Args:
            packet_loss: Packet loss rate (0.0-1.0)
            rtt_ms: Round-trip time in milliseconds
        """
        # Calculate network quality score
        quality = 1.0 - (packet_loss * 2)  # Heavy penalty for loss
        quality -= max(0, (rtt_ms - 50) / 1000)  # Penalty for high RTT
        quality = max(0.0, min(1.0, quality))
        
        # Determine quality level
        if quality > 0.8:
            self.metrics['network_quality'] = NetworkQuality.EXCELLENT
            new_bitrate = 32000  # High quality
        elif quality > 0.6:
            self.metrics['network_quality'] = NetworkQuality.GOOD
            new_bitrate = 24000  # Normal quality
        elif quality > 0.4:
            self.metrics['network_quality'] = NetworkQuality.FAIR
            new_bitrate = 16000  # Reduced quality
        else:
            self.metrics['network_quality'] = NetworkQuality.POOR
            new_bitrate = 12000  # Minimum quality
        
        # Update encoder settings if initialized
        if self.encoder and new_bitrate != self.metrics['current_bitrate']:
            try:
                self.encoder.bitrate = new_bitrate
                self.metrics['current_bitrate'] = new_bitrate
                logger.info(f"Adapted bitrate to {new_bitrate}bps "
                           f"(quality: {self.metrics['network_quality'].value})")
                
                # Adjust FEC
                self.encoder.packet_loss_perc = int(packet_loss * 100)
            except Exception as e:
                logger.warning(f"Could not adapt bitrate: {e}")
    
    def get_compression_ratio(self) -> float:
        """Calculate current compression ratio"""
        if self.metrics['bytes_compressed'] == 0:
            return 0.0
        return self.metrics['bytes_original'] / self.metrics['bytes_compressed']
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current codec metrics"""
        return {
            **self.metrics,
            'compression_ratio': self.get_compression_ratio(),
            'avg_frame_size': (self.metrics['bytes_compressed'] / 
                             max(1, self.metrics['frames_encoded']))
        }
    
    def reset_metrics(self):
        """Reset performance metrics"""
        self._setup_metrics()
    
    def cleanup(self):
        """Clean up codec resources"""
        try:
            # Clear buffers
            self.encode_buffer.clear()
            self.decode_buffer.clear()
            self.jitter_buffer.clear()
            
            logger.info("Opus codec cleaned up")
            
        except Exception as e:
            logger.error(f"Cleanup error: {e}")


class OpusStreamProcessor:
    """High-level Opus stream processor with buffering"""
    
    def __init__(self, config: Optional[OpusConfig] = None):
        self.codec = OpusAudioCodec(config)
        self.config = config or OpusConfig()
        self.processing_active = False
        
    async def process_duplex_stream(self,
                                   input_stream: AsyncGenerator,
                                   output_queue: asyncio.Queue,
                                   network_send: callable,
                                   network_recv: callable):
        """
        Process full-duplex audio streaming
        
        Args:
            input_stream: Microphone input generator
            output_queue: Speaker output queue
            network_send: Async function to send to network
            network_recv: Async function to receive from network
        """
        self.processing_active = True
        
        async def encode_task():
            """Encode and send audio"""
            async for encoded_frame in self.codec.encode_stream(input_stream):
                if not self.processing_active:
                    break
                await network_send(encoded_frame)
        
        async def decode_task():
            """Receive and decode audio"""
            while self.processing_active:
                try:
                    # Receive from network
                    opus_frame = await network_recv()
                    
                    if opus_frame:
                        # Decode
                        pcm_data = self.codec.decode_with_plc(opus_frame.get('data'))
                        
                        if pcm_data:
                            await output_queue.put({
                                'data': pcm_data,
                                'timestamp': opus_frame.get('timestamp', time.time())
                            })
                    
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"Decode task error: {e}")
                    await asyncio.sleep(0.01)
        
        # Run both tasks concurrently
        try:
            await asyncio.gather(
                encode_task(),
                decode_task()
            )
        finally:
            self.processing_active = False
    
    def stop(self):
        """Stop stream processing"""
        self.processing_active = False
        self.codec.cleanup()


# Example usage and testing
if __name__ == "__main__":
    import pyaudio
    
    async def test_opus_codec():
        """Test Opus codec functionality"""
        logger.info("Testing Opus codec...")
        
        # Create codec
        codec = OpusAudioCodec()
        
        # Test encoding/decoding
        test_samples = 320  # 20ms at 16kHz
        test_data = np.random.randint(-32768, 32767, test_samples, dtype=np.int16)
        pcm_data = test_data.tobytes()
        
        # Encode
        encoded = codec.encode_chunk(pcm_data)
        logger.info(f"Encoded {len(pcm_data)} bytes to {len(encoded)} bytes")
        
        # Decode
        decoded = codec.decode_chunk(encoded)
        logger.info(f"Decoded back to {len(decoded)} bytes")
        
        # Check metrics
        metrics = codec.get_metrics()
        logger.info(f"Compression ratio: {metrics['compression_ratio']:.2f}x")
        
        # Test packet loss concealment
        logger.info("\nTesting packet loss concealment...")
        plc_audio = codec.decode_with_plc(None)
        logger.info(f"Generated {len(plc_audio)} bytes of concealment audio")
        
        # Test adaptive bitrate
        logger.info("\nTesting adaptive bitrate...")
        codec.adapt_bitrate(0.05, 100)  # 5% loss, 100ms RTT
        logger.info(f"Network quality: {codec.metrics['network_quality'].value}")
        logger.info(f"Adapted bitrate: {codec.metrics['current_bitrate']}bps")
        
        # Test with real audio
        try:
            audio = pyaudio.PyAudio()
            
            # Create test stream
            stream = audio.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                frames_per_buffer=320
            )
            
            logger.info("\nRecording 2 seconds of audio for compression test...")
            frames = []
            
            for _ in range(int(16000 / 320 * 2)):  # 2 seconds
                data = stream.read(320)
                frames.append(data)
                
                # Encode each frame
                encoded = codec.encode_chunk(data)
                if encoded:
                    decoded = codec.decode_chunk(encoded)
            
            stream.stop_stream()
            stream.close()
            audio.terminate()
            
            # Final metrics
            final_metrics = codec.get_metrics()
            logger.info(f"\nFinal compression ratio: {final_metrics['compression_ratio']:.2f}x")
            logger.info(f"Frames encoded: {final_metrics['frames_encoded']}")
            logger.info(f"Encoding errors: {final_metrics['encode_errors']}")
            
        except Exception as e:
            logger.warning(f"PyAudio test skipped: {e}")
        
        codec.cleanup()
        logger.info("\nOpus codec test completed!")
    
    # Run test
    asyncio.run(test_opus_codec())
