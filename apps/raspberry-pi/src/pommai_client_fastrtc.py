#!/usr/bin/env python3
"""
Updated Pommai Smart Toy Client for Raspberry Pi Zero 2W
Using FastRTC Gateway for simplified real-time communication

This updated client uses the new FastRTC connection handler for:
- Simplified WebSocket connection to FastRTC gateway
- Direct audio streaming with Opus compression
- Streamlined message handling
"""

import asyncio
import json
import logging
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any

# External dependencies
import pyaudio
import numpy as np
from dotenv import load_dotenv

# Local modules - using new FastRTC connection
from fastrtc_connection import FastRTCConnection, FastRTCConfig, ConnectionState
from led_controller import LEDController, LEDPattern
from button_handler import ButtonHandler
from audio_stream_manager import AudioStreamManager, AudioConfig
from opus_audio_codec import OpusAudioCodec, OpusConfig
from wake_word_detector import WakeWordDetector
from conversation_cache import ConversationCache

# Try to import RPi.GPIO (will fail on non-Pi systems)
try:
    import RPi.GPIO as GPIO
    ON_RASPBERRY_PI = True
except ImportError:
    ON_RASPBERRY_PI = False
    logging.warning("RPi.GPIO not available - running in simulation mode")

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def _get_env_with_fallback(primary, fallback_keys, default=None):
    """Read env var with fallbacks; log a warning if a legacy key is used.
    Does not log any secret values, only the variable names."""
    val = os.getenv(primary)
    if val:
        return val
    for fk in fallback_keys:
        fb = os.getenv(fk)
        if fb:
            logger.warning(f"Using legacy env var {fk}; please set {primary} in .env")
            return fb
    return default if default is not None else ""


@dataclass
class Config:
    """Configuration for the updated Pommai client"""
    # FastRTC Gateway connection
    FASTRTC_GATEWAY_URL: str = _get_env_with_fallback('FASTRTC_GATEWAY_URL', ['CONVEX_URL'], 'ws://localhost:8080/ws')
    
    # Device identification
    DEVICE_ID: str = os.getenv('DEVICE_ID', 'rpi-toy-001')
    TOY_ID: str = _get_env_with_fallback('TOY_ID', ['POMMAI_TOY_ID'], 'default-toy')
    AUTH_TOKEN: str = _get_env_with_fallback('AUTH_TOKEN', ['POMMAI_USER_TOKEN'], '')
    
    # Audio settings
    SAMPLE_RATE: int = 16000
    CHUNK_SIZE: int = 1024
    CHANNELS: int = 1
    AUDIO_FORMAT: int = pyaudio.paInt16
    
    # Opus codec settings
    OPUS_BITRATE: int = 24000
    OPUS_COMPLEXITY: int = 5
    
    # GPIO pins (if on Raspberry Pi)
    BUTTON_PIN: int = 17
    LED_PINS: Dict[str, int] = {
        'red': 5,
        'green': 6,
        'blue': 13
    }
    
    # Features
    ENABLE_WAKE_WORD: bool = os.getenv('ENABLE_WAKE_WORD', 'false').lower() == 'true'
    ENABLE_OFFLINE_MODE: bool = os.getenv('ENABLE_OFFLINE_MODE', 'true').lower() == 'true'
    
    # Performance
    MAX_RECONNECT_ATTEMPTS: int = 5
    RECONNECT_DELAY: float = 2.0


class ToyState(Enum):
    """State machine for toy operations"""
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    ERROR = "error"
    OFFLINE = "offline"
    CONNECTING = "connecting"


class PommaiClientFastRTC:
    """Main client application using FastRTC connection"""
    
    def __init__(self, config: Config):
        self.config = config
        self.state = ToyState.IDLE
        
        # Initialize FastRTC connection
        rtc_config = FastRTCConfig(
            gateway_url=config.FASTRTC_GATEWAY_URL,
            device_id=config.DEVICE_ID,
            toy_id=config.TOY_ID,
            auth_token=config.AUTH_TOKEN,
            reconnect_attempts=config.MAX_RECONNECT_ATTEMPTS,
            reconnect_delay=config.RECONNECT_DELAY,
            audio_format="opus",
            sample_rate=config.SAMPLE_RATE
        )
        self.connection = FastRTCConnection(rtc_config)
        
        # Initialize audio components
        self.audio_manager = AudioStreamManager(AudioConfig(
            sample_rate=config.SAMPLE_RATE,
            chunk_size=config.CHUNK_SIZE,
            channels=config.CHANNELS
        ))
        
        self.opus_codec = OpusAudioCodec(OpusConfig(
            sample_rate=config.SAMPLE_RATE,
            channels=config.CHANNELS,
            bitrate=config.OPUS_BITRATE,
            complexity=config.OPUS_COMPLEXITY
        ))
        
        # Initialize hardware controllers (if on Pi)
        if ON_RASPBERRY_PI:
            self.led_controller = LEDController(config.LED_PINS)
            self.button_handler = ButtonHandler(
                config.BUTTON_PIN,
                on_press=self.on_button_press,
                on_release=self.on_button_release
            )
        else:
            self.led_controller = None
            self.button_handler = None
            logger.info("Hardware controllers disabled (not on Raspberry Pi)")
        
        # Wake word detector (optional)
        self.wake_word_detector = None
        if config.ENABLE_WAKE_WORD:
            try:
                self.wake_word_detector = WakeWordDetector()
            except Exception as e:
                logger.error(f"Failed to initialize wake word detector: {e}")
        
        # Offline cache
        self.cache = ConversationCache() if config.ENABLE_OFFLINE_MODE else None
        
        # Audio recording state
        self.is_recording = False
        self.audio_buffer = []
        self.recording_task = None
        
        # Register message handlers
        self._register_handlers()
    
    def _register_handlers(self):
        """Register message handlers for FastRTC connection"""
        self.connection.on_message("audio_response", self.handle_audio_response)
        self.connection.on_message("config_update", self.handle_config_update)
        self.connection.on_message("error", self.handle_error)
        self.connection.on_message("toy_state", self.handle_toy_state)
    
    async def initialize(self) -> bool:
        """Initialize all components and connect to gateway"""
        logger.info("Initializing Pommai client with FastRTC...")
        
        # Set initial LED pattern
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.STARTUP)
        
        self.state = ToyState.CONNECTING
        
        # Connect to FastRTC gateway
        connected = await self.connection.connect()
        if not connected:
            logger.error("Failed to connect to FastRTC gateway")
            self.state = ToyState.OFFLINE
            if self.led_controller:
                await self.led_controller.set_pattern(LEDPattern.ERROR)
            return False
        
        logger.info("Connected to FastRTC gateway successfully")
        
        # Initialize audio
        await self.audio_manager.initialize()
        
        # Start wake word detection if enabled
        if self.wake_word_detector:
            asyncio.create_task(self.wake_word_loop())
        
        # Setup button handler if available
        if self.button_handler:
            self.button_handler.start()
        
        self.state = ToyState.IDLE
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.IDLE)
        
        return True
    
    async def on_button_press(self):
        """Handle button press event"""
        if self.state != ToyState.IDLE:
            logger.warning(f"Button pressed in state {self.state}, ignoring")
            return
        
        logger.info("Button pressed - starting recording")
        await self.start_recording()
    
    async def on_button_release(self):
        """Handle button release event"""
        if self.state != ToyState.LISTENING:
            return
        
        logger.info("Button released - stopping recording")
        await self.stop_recording()
    
    async def start_recording(self):
        """Start audio recording and streaming"""
        if self.is_recording:
            return
        
        self.state = ToyState.LISTENING
        self.is_recording = True
        self.audio_buffer = []
        
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.LISTENING)
        
        # Start streaming mode
        await self.connection.start_streaming()
        
        # Start recording task
        self.recording_task = asyncio.create_task(self.record_audio())
    
    async def stop_recording(self):
        """Stop audio recording and send final chunk"""
        if not self.is_recording:
            return
        
        self.is_recording = False
        self.state = ToyState.PROCESSING
        
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.PROCESSING)
        
        # Cancel recording task
        if self.recording_task:
            self.recording_task.cancel()
        
        # Send final audio chunk if we have data
        if self.audio_buffer:
            audio_data = np.concatenate(self.audio_buffer)
            compressed = self.opus_codec.encode(audio_data.tobytes())
            await self.connection.send_audio_chunk(compressed, is_final=True)
        
        # Stop streaming mode
        await self.connection.stop_streaming()
    
    async def record_audio(self):
        """Record audio from microphone and stream to server"""
        try:
            while self.is_recording:
                # Read audio chunk
                audio_chunk = await self.audio_manager.read_chunk()
                if audio_chunk is None:
                    continue
                
                # Add to buffer
                self.audio_buffer.append(audio_chunk)
                
                # Compress with Opus
                compressed = self.opus_codec.encode(audio_chunk.tobytes())
                
                # Send to server
                await self.connection.send_audio_chunk(compressed, is_final=False)
                
                # Small delay to prevent overwhelming
                await asyncio.sleep(0.01)
                
        except asyncio.CancelledError:
            logger.debug("Recording task cancelled")
        except Exception as e:
            logger.error(f"Recording error: {e}")
            self.is_recording = False
    
    async def handle_audio_response(self, message: Dict[str, Any]):
        """Handle audio response from server"""
        self.state = ToyState.SPEAKING
        
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.SPEAKING)
        
        # Get audio from connection queue
        audio_chunk = await self.connection.get_audio_chunk()
        if audio_chunk:
            audio_data = audio_chunk['data']
            
            # Decode Opus audio
            pcm_data = self.opus_codec.decode(audio_data)
            
            # Play audio
            await self.audio_manager.play_audio(pcm_data)
        
        # Return to idle state
        self.state = ToyState.IDLE
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.IDLE)
    
    async def handle_config_update(self, message: Dict[str, Any]):
        """Handle configuration update from server"""
        config = message.get('config', {})
        logger.info(f"Configuration update: {config}")
        
        # Update toy configuration if needed
        if 'toyId' in config:
            self.config.TOY_ID = config['toyId']
    
    async def handle_error(self, message: Dict[str, Any]):
        """Handle error message from server"""
        error = message.get('error', 'Unknown error')
        logger.error(f"Server error: {error}")
        
        self.state = ToyState.ERROR
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.ERROR)
        
        # Return to idle after a delay
        await asyncio.sleep(2)
        self.state = ToyState.IDLE
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.IDLE)
    
    async def handle_toy_state(self, message: Dict[str, Any]):
        """Handle toy state update from server"""
        state = message.get('state')
        if state:
            logger.info(f"Toy state update: {state}")
    
    async def wake_word_loop(self):
        """Continuous wake word detection loop"""
        logger.info("Wake word detection started")
        
        while True:
            try:
                # Check for wake word
                if self.wake_word_detector and self.state == ToyState.IDLE:
                    detected = await self.wake_word_detector.detect()
                    if detected:
                        logger.info("Wake word detected!")
                        await self.start_recording()
                        
                        # Auto-stop after 5 seconds if still recording
                        await asyncio.sleep(5)
                        if self.is_recording:
                            await self.stop_recording()
                
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Wake word detection error: {e}")
                await asyncio.sleep(1)
    
    async def run(self):
        """Main event loop"""
        logger.info("Starting Pommai client...")
        
        # Initialize
        if not await self.initialize():
            logger.error("Initialization failed")
            return
        
        try:
            # Main loop
            while True:
                # Check connection status
                if not self.connection.is_connected():
                    if self.state != ToyState.OFFLINE:
                        self.state = ToyState.OFFLINE
                        if self.led_controller:
                            await self.led_controller.set_pattern(LEDPattern.OFFLINE)
                    
                    # Try to reconnect
                    await asyncio.sleep(5)
                    if await self.connection.connect():
                        self.state = ToyState.IDLE
                        if self.led_controller:
                            await self.led_controller.set_pattern(LEDPattern.IDLE)
                
                # Small delay to prevent CPU overload
                await asyncio.sleep(0.1)
                
        except KeyboardInterrupt:
            logger.info("Shutting down...")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        finally:
            await self.cleanup()
    
    async def cleanup(self):
        """Clean up resources"""
        logger.info("Cleaning up...")
        
        # Stop recording if active
        if self.is_recording:
            await self.stop_recording()
        
        # Disconnect from gateway
        await self.connection.disconnect()
        
        # Clean up hardware
        if self.button_handler:
            self.button_handler.stop()
        
        if self.led_controller:
            await self.led_controller.cleanup()
        
        # Clean up audio
        await self.audio_manager.cleanup()
        
        logger.info("Cleanup complete")


async def main():
    """Main entry point"""
    config = Config()
    client = PommaiClientFastRTC(config)
    await client.run()


if __name__ == "__main__":
    # Run the client
    asyncio.run(main())
