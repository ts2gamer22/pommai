#!/usr/bin/env python3
"""
Improved Hardware Controller that opens/closes audio streams on demand
This prevents "Device or resource busy" errors
"""

import pyaudio
import logging
from typing import Optional
import threading

logger = logging.getLogger(__name__)


class LazyHardwareController:
    """
    Hardware controller that opens audio streams only when needed.
    This prevents blocking the Bluetooth device when idle.
    """
    
    def __init__(self, sample_rate: int, channels: int, chunk_size: int,
                 input_device_index: Optional[int] = None,
                 output_device_index: Optional[int] = None,
                 output_sample_rate: Optional[int] = None):
        # Store configuration
        self.sample_rate = sample_rate
        self.channels = channels
        self.chunk_size = chunk_size
        self.input_device_index = input_device_index
        self.output_device_index = output_device_index
        self.output_sample_rate = output_sample_rate or sample_rate
        
        # PyAudio instance (keep this open)
        self._pa = pyaudio.PyAudio()
        
        # Streams (open on demand)
        self._input_stream = None
        self._output_stream = None
        
        # Thread safety
        self._lock = threading.Lock()
        
        logger.info(f"LazyHardwareController initialized - Input: {input_device_index}, Output: {output_device_index}")
    
    @property
    def input_stream(self):
        """Get or create input stream on demand"""
        with self._lock:
            if self._input_stream is None or not self._input_stream.is_active():
                logger.debug("Opening input stream on demand")
                try:
                    if self._input_stream:
                        self._input_stream.close()
                except:
                    pass
                    
                self._input_stream = self._pa.open(
                    format=pyaudio.paInt16,
                    channels=self.channels,
                    rate=self.sample_rate,
                    input=True,
                    input_device_index=self.input_device_index,
                    frames_per_buffer=self.chunk_size
                )
            return self._input_stream
    
    @property
    def output_stream(self):
        """Get or create output stream on demand"""
        with self._lock:
            if self._output_stream is None or not self._output_stream.is_active():
                logger.debug(f"Opening output stream on demand (device {self.output_device_index})")
                try:
                    if self._output_stream:
                        self._output_stream.close()
                except:
                    pass
                
                # Use larger buffer for Bluetooth to reduce underruns
                out_buffer = max(self.chunk_size, 2048)
                self._output_stream = self._pa.open(
                    format=pyaudio.paInt16,
                    channels=self.channels,
                    rate=self.output_sample_rate,
                    output=True,
                    output_device_index=self.output_device_index,
                    frames_per_buffer=out_buffer
                )
            return self._output_stream
    
    def close_input_stream(self):
        """Close input stream to free the device"""
        with self._lock:
            if self._input_stream:
                try:
                    logger.debug("Closing input stream")
                    self._input_stream.stop_stream()
                    self._input_stream.close()
                except Exception as e:
                    logger.warning(f"Error closing input stream: {e}")
                finally:
                    self._input_stream = None
    
    def close_output_stream(self):
        """Close output stream to free the device"""
        with self._lock:
            if self._output_stream:
                try:
                    logger.debug("Closing output stream")
                    self._output_stream.stop_stream()
                    self._output_stream.close()
                except Exception as e:
                    logger.warning(f"Error closing output stream: {e}")
                finally:
                    self._output_stream = None
    
    def cleanup(self):
        """Clean up all resources"""
        logger.info("Cleaning up hardware controller")
        self.close_input_stream()
        self.close_output_stream()
        
        try:
            self._pa.terminate()
        except Exception as e:
            logger.warning(f"Error terminating PyAudio: {e}")


class SmartAudioStreamManager:
    """
    Enhanced AudioStreamManager that closes streams when idle
    """
    
    def __init__(self, hardware_controller, config):
        self.hardware = hardware_controller
        self.config = config
        # ... rest of initialization ...
        
    async def play_audio_stream(self, audio_chunks):
        """Play audio and close stream when done"""
        try:
            # Play audio using hardware.output_stream
            # ... existing playback code ...
            pass
        finally:
            # IMPORTANT: Close the output stream when done
            self.hardware.close_output_stream()
            logger.info("Output stream closed after playback")
    
    async def stop_recording(self):
        """Stop recording and close input stream"""
        # ... existing stop code ...
        self.hardware.close_input_stream()
        logger.info("Input stream closed after recording")
