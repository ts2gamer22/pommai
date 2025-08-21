#!/usr/bin/env python3
"""
Pommai Smart Toy Client for Raspberry Pi Zero 2W
Supports multiple toy personalities and Creator/Guardian modes

This is the main client application that handles all device operations including:
- WebSocket connection to Convex backend
- Audio streaming with Opus compression
- Wake word detection with Vosk
- Hardware control (button, LEDs)
- Offline mode with SQLite caching
- Guardian mode safety features
"""

import asyncio
import json
import logging
import os
import sys
import time
import struct
import sqlite3
import collections
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List

# External dependencies
import websockets
import pyaudio
import RPi.GPIO as GPIO
from vosk import Model, KaldiRecognizer
import aiofiles
from dotenv import load_dotenv
import requests
import numpy as np

# Local modules
from led_controller import LEDController, LEDPattern
from button_handler import ButtonHandler, ButtonPatternDetector
from audio_stream_manager import AudioStreamManager, AudioConfig
from opus_audio_codec import OpusAudioCodec, OpusConfig, OpusStreamProcessor
from wake_word_detector import WakeWordDetector, WakeWordConfig, OfflineVoiceProcessor
from conversation_cache import ConversationCache, CacheConfig, CacheSyncManager

# Load environment variables
load_dotenv()

# Configuration
@dataclass
class Config:
    """Configuration for the Pommai client"""
    # Convex connection
    CONVEX_URL: str = os.getenv('CONVEX_URL', 'wss://your-app.convex.site/audio-stream')
    CONVEX_API_URL: str = os.getenv('CONVEX_API_URL', 'https://your-app.convex.site')
    
    # Device identification
    DEVICE_ID: str = os.getenv('DEVICE_ID', 'rpi-toy-001')
    DEVICE_SECRET: str = os.getenv('DEVICE_SECRET', '')  # For TPM integration
    
    # User and toy selection
    USER_TOKEN: str = os.getenv('POMMAI_USER_TOKEN', '')  # User authentication token
    TOY_ID: str = os.getenv('POMMAI_TOY_ID', '')  # Selected toy configuration
    
    # Audio settings
    SAMPLE_RATE: int = 16000
    CHUNK_SIZE: int = 1024
    CHANNELS: int = 1
    AUDIO_FORMAT: int = pyaudio.paInt16
    FRAME_SIZE: int = 320  # 20ms at 16kHz
    
    # Opus codec settings
    OPUS_BITRATE: int = 24000  # 24 kbps
    OPUS_COMPLEXITY: int = 5  # Balanced for Pi Zero 2W
    OPUS_PACKET_LOSS_PERC: int = 10  # Handle 10% packet loss
    
    # GPIO pins (ReSpeaker 2-Mics HAT)
    BUTTON_PIN: int = 17
    LED_PINS: Dict[str, int] = {
        'red': 5,
        'green': 6,
        'blue': 13
    }
    
    # Paths
    VOSK_MODEL_PATH: str = os.getenv('VOSK_MODEL_PATH', '/home/pommai/models/vosk-model-small-en-us-0.15')
    CACHE_DB_PATH: str = os.getenv('CACHE_DB_PATH', '/tmp/pommai_cache.db')  # Use tmpfs
    AUDIO_RESPONSES_PATH: str = os.getenv('AUDIO_RESPONSES_PATH', '/home/pommai/audio_responses')
    
    # Wake word configuration
    DEFAULT_WAKE_WORD: str = "hey pommai"
    WAKE_WORD_SENSITIVITY: float = 0.7
    
    # Performance limits
    MAX_MEMORY_MB: int = 50
    MAX_CPU_PERCENT: int = 30
    MAX_LATENCY_MS: int = 260
    
    # Safety defaults
    MAX_CONVERSATIONS_PER_HOUR: int = 20
    SESSION_DURATION_LIMIT_MINUTES: int = 30
    OFFLINE_SAFETY_LEVEL: str = "strict"


class ToyState(Enum):
    """State machine for toy operations"""
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    ERROR = "error"
    LOADING_TOY = "loading_toy"
    SWITCHING_TOY = "switching_toy"
    OFFLINE = "offline"
    CONNECTING = "connecting"
    SHUTDOWN = "shutdown"


class ConvexConnection:
    """Manages WebSocket connection to Convex backend"""
    
    def __init__(self, config: Config):
        self.config = config
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 10
        self.reconnect_delay = 1
        self.is_authenticated = False
        self.message_queue = asyncio.Queue()
        self.receive_task = None
        
    async def connect(self) -> bool:
        """Establish WebSocket connection with exponential backoff"""
        while self.reconnect_attempts < self.max_reconnect_attempts:
            try:
                # Include authentication headers
                headers = {
                    'Authorization': f'Bearer {self.config.USER_TOKEN}',
                    'X-Device-ID': self.config.DEVICE_ID,
                    'X-Device-Type': 'raspberry-pi-zero-2w',
                    'X-Toy-ID': self.config.TOY_ID
                }
                
                logging.info(f"Connecting to {self.config.CONVEX_URL}...")
                
                self.websocket = await websockets.connect(
                    self.config.CONVEX_URL,
                    extra_headers=headers,
                    ping_interval=20,
                    ping_timeout=10
                )
                
                # Send initial handshake
                await self.send_handshake()
                
                # Start message receiver
                self.receive_task = asyncio.create_task(self._receive_messages())
                
                logging.info(f"Connected to Convex at {self.config.CONVEX_URL}")
                self.reconnect_attempts = 0
                self.is_authenticated = True
                return True
                
            except Exception as e:
                self.reconnect_attempts += 1
                delay = min(self.reconnect_delay * (2 ** self.reconnect_attempts), 60)
                logging.error(f"Connection failed: {e}. Retrying in {delay}s...")
                await asyncio.sleep(delay)
        
        logging.error("Max reconnection attempts reached")
        return False
    
    async def send_handshake(self):
        """Send initial handshake message"""
        handshake = {
            'type': 'handshake',
            'deviceId': self.config.DEVICE_ID,
            'toyId': self.config.TOY_ID,
            'capabilities': {
                'audio': True,
                'wake_word': True,
                'offline_mode': True,
                'toy_switching': True,
                'guardian_mode': await self._check_guardian_mode()
            }
        }
        await self.send_message(handshake)
    
    async def _check_guardian_mode(self) -> bool:
        """Check if current toy is in guardian mode"""
        # This will be implemented based on toy configuration
        return False
    
    async def send_message(self, message: Dict[str, Any]):
        """Send message to WebSocket"""
        if self.websocket and not self.websocket.closed:
            try:
                await self.websocket.send(json.dumps(message))
            except Exception as e:
                logging.error(f"Failed to send message: {e}")
                await self._handle_connection_error()
    
    async def send_audio_chunk(self, audio_data: bytes, metadata: Dict[str, Any]):
        """Send compressed audio chunk to server"""
        message = {
            'type': 'audio_chunk',
            'data': audio_data.hex(),  # Convert bytes to hex string
            'metadata': {
                'timestamp': datetime.utcnow().isoformat(),
                'sequence': metadata.get('sequence', 0),
                'is_final': metadata.get('is_final', False),
                'compression': 'opus',
                'sample_rate': self.config.SAMPLE_RATE,
                'channels': self.config.CHANNELS,
                **metadata
            }
        }
        
        await self.send_message(message)
    
    async def _receive_messages(self):
        """Continuously receive messages from WebSocket"""
        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    await self.message_queue.put(data)
                except json.JSONDecodeError:
                    logging.error(f"Failed to decode message: {message}")
        except websockets.ConnectionClosed:
            logging.warning("WebSocket connection closed")
            await self._handle_connection_error()
        except Exception as e:
            logging.error(f"Error receiving messages: {e}")
            await self._handle_connection_error()
    
    async def _handle_connection_error(self):
        """Handle connection errors and trigger reconnection"""
        self.is_authenticated = False
        if self.websocket:
            await self.websocket.close()
        self.websocket = None
        
        # Trigger reconnection
        asyncio.create_task(self.connect())
    
    async def get_message(self) -> Optional[Dict[str, Any]]:
        """Get next message from queue"""
        try:
            return await asyncio.wait_for(self.message_queue.get(), timeout=0.1)
        except asyncio.TimeoutError:
            return None
    
    async def request_toy_config(self) -> Optional[Dict[str, Any]]:
        """Request toy configuration from server"""
        await self.send_message({
            'type': 'get_toy_config',
            'toyId': self.config.TOY_ID
        })
        
        # Wait for response
        start_time = time.time()
        while time.time() - start_time < 5:  # 5 second timeout
            message = await self.get_message()
            if message and message.get('type') == 'toy_config':
                return message.get('config')
            await asyncio.sleep(0.1)
        
        return None
    
    async def close(self):
        """Close WebSocket connection"""
        if self.receive_task:
            self.receive_task.cancel()
        
        if self.websocket:
            await self.websocket.close()
            self.websocket = None


class HardwareController:
    """Controls Raspberry Pi hardware (GPIO, audio devices)"""
    
    def __init__(self, config: Config):
        self.config = config
        self.audio = None
        self.input_stream = None
        self.output_stream = None
        self.led_pwm = {}
        self.button_callback = None
        
        self.setup_gpio()
        self.setup_audio()
    
    def setup_gpio(self):
        """Initialize GPIO for button and LEDs"""
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        
        # Setup button with pull-up resistor
        GPIO.setup(self.config.BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        
        # Setup RGB LEDs
        for color, pin in self.config.LED_PINS.items():
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, GPIO.LOW)
        
        # Setup PWM for LED effects
        self.led_pwm = {
            color: GPIO.PWM(pin, 1000)  # 1kHz frequency
            for color, pin in self.config.LED_PINS.items()
        }
        
        for pwm in self.led_pwm.values():
            pwm.start(0)
        
        logging.info("GPIO initialized")
    
    def setup_audio(self):
        """Configure PyAudio for ReSpeaker HAT"""
        self.audio = pyaudio.PyAudio()
        
        # Find ReSpeaker device
        respeaker_index = None
        for i in range(self.audio.get_device_count()):
            info = self.audio.get_device_info_by_index(i)
            if 'seeed' in info['name'].lower() or 'respeaker' in info['name'].lower():
                respeaker_index = i
                logging.info(f"Found ReSpeaker device at index {i}: {info['name']}")
                break
        
        if respeaker_index is None:
            logging.warning("ReSpeaker not found, using default audio device")
        
        # Configure input stream
        self.input_stream = self.audio.open(
            format=self.config.AUDIO_FORMAT,
            channels=self.config.CHANNELS,
            rate=self.config.SAMPLE_RATE,
            input=True,
            input_device_index=respeaker_index,
            frames_per_buffer=self.config.CHUNK_SIZE
        )
        
        # Configure output stream
        self.output_stream = self.audio.open(
            format=self.config.AUDIO_FORMAT,
            channels=self.config.CHANNELS,
            rate=self.config.SAMPLE_RATE,
            output=True,
            output_device_index=respeaker_index,
            frames_per_buffer=self.config.CHUNK_SIZE
        )
        
        logging.info("Audio devices initialized")
    
    def set_button_callback(self, callback):
        """Set callback for button events"""
        self.button_callback = callback
        GPIO.add_event_detect(
            self.config.BUTTON_PIN,
            GPIO.BOTH,
            callback=self._button_event_handler,
            bouncetime=50
        )
    
    def _button_event_handler(self, channel):
        """Internal button event handler"""
        if self.button_callback:
            # Run callback in async context
            asyncio.create_task(self.button_callback(channel))
    
    async def set_led_color(self, red: int, green: int, blue: int):
        """Set LED color (0-100 for each channel)"""
        self.led_pwm['red'].ChangeDutyCycle(red)
        self.led_pwm['green'].ChangeDutyCycle(green)
        self.led_pwm['blue'].ChangeDutyCycle(blue)
    
    async def play_sound(self, filename: str):
        """Play a pre-recorded sound file"""
        try:
            filepath = os.path.join(self.config.AUDIO_RESPONSES_PATH, filename)
            if os.path.exists(filepath):
                # Simple playback implementation
                # In production, use a proper audio library
                logging.info(f"Playing sound: {filename}")
        except Exception as e:
            logging.error(f"Failed to play sound {filename}: {e}")
    
    def cleanup(self):
        """Cleanup hardware resources"""
        # Turn off LEDs
        for pwm in self.led_pwm.values():
            pwm.stop()
        
        # Cleanup GPIO
        GPIO.cleanup()
        
        # Close audio streams
        if self.input_stream:
            self.input_stream.stop_stream()
            self.input_stream.close()
        
        if self.output_stream:
            self.output_stream.stop_stream()
            self.output_stream.close()
        
        if self.audio:
            self.audio.terminate()
        
        logging.info("Hardware cleanup complete")


class PommaiToyClient:
    """Main client orchestrator for Pommai Smart Toy"""
    
    def __init__(self):
        self.config = Config()
        self.hardware = HardwareController(self.config)
        self.connection = ConvexConnection(self.config)
        
        # Initialize components
        self.audio_manager = AudioStreamManager(AudioConfig(
            sample_rate=self.config.SAMPLE_RATE,
            channels=self.config.CHANNELS,
            chunk_size=self.config.CHUNK_SIZE,
            frame_size=self.config.FRAME_SIZE
        ))
        
        self.opus_codec = OpusAudioCodec(OpusConfig(
            sample_rate=self.config.SAMPLE_RATE,
            channels=self.config.CHANNELS,
            bitrate=self.config.OPUS_BITRATE,
            complexity=self.config.OPUS_COMPLEXITY,
            packet_loss_perc=self.config.OPUS_PACKET_LOSS_PERC
        ))
        
        self.wake_detector = WakeWordDetector(WakeWordConfig(
            model_path=self.config.VOSK_MODEL_PATH,
            wake_words=[self.config.DEFAULT_WAKE_WORD],
            sensitivity=self.config.WAKE_WORD_SENSITIVITY
        ))
        
        self.cache = ConversationCache(CacheConfig(
            db_path=self.config.CACHE_DB_PATH
        ))
        
        self.led_controller = LEDController(self.hardware)
        self.button_handler = ButtonHandler(self.hardware, self)
        
        # State management
        self.current_state = ToyState.IDLE
        self.previous_state = None
        self.is_online = False
        self.current_toy_config = None
        self.is_guardian_mode = False
        
        # Audio streaming state
        self.audio_stream_task = None
        self.current_sequence = 0
        self.is_recording = False
        
        # Performance monitoring
        self.last_activity_time = time.time()
        self.conversation_count = 0
        self.session_start_time = time.time()
        
        # Sync manager
        self.sync_manager = None
        
    async def initialize(self):
        """Initialize all components and establish connections"""
        try:
            logging.info("Initializing Pommai Toy Client...")
            
            # Initialize cache
            await self.cache.initialize()
            
            # Set initial LED state
            await self.led_controller.set_pattern(LEDPattern.STARTING)
            
            # Initialize wake word detector
            await self.wake_detector.initialize()
            self.wake_detector.set_callback(self.on_wake_word_detected)
            
            # Setup button handler
            self.button_handler.set_callbacks({
                'single_press': self.on_button_single_press,
                'double_press': self.on_button_double_press,
                'long_press': self.on_button_long_press
            })
            
            # Try to connect to cloud
            await self.transition_to(ToyState.CONNECTING)
            self.is_online = await self.connection.connect()
            
            if not self.is_online:
                logging.warning("Starting in offline mode")
                await self.transition_to(ToyState.OFFLINE)
                await self.led_controller.set_pattern(LEDPattern.OFFLINE)
                
                # Load cached toy configuration
                self.current_toy_config = await self.cache.get_toy_configuration(self.config.TOY_ID)
            else:
                # Load toy configuration from server
                await self.load_toy_configuration()
                
                # Initialize sync manager
                from sync_manager import SyncManager
                self.sync_manager = SyncManager(self.cache, self.connection)
                asyncio.create_task(self.sync_manager.start())
            
            # Start background tasks
            asyncio.create_task(self.monitor_connection())
            asyncio.create_task(self.monitor_performance())
            asyncio.create_task(self.process_server_messages())
            
            # Start wake word detection
            await self.wake_detector.start_detection()
            
            await self.transition_to(ToyState.IDLE)
            logging.info("Initialization complete")
            
        except Exception as e:
            logging.error(f"Initialization failed: {e}")
            await self.transition_to(ToyState.ERROR)
            raise
    
    async def load_toy_configuration(self):
        """Load the selected toy configuration from server"""
        await self.transition_to(ToyState.LOADING_TOY)
        
        try:
            config = await self.connection.request_toy_config()
            
            if config:
                self.current_toy_config = config
                self.is_guardian_mode = config.get('is_for_kids', False)
                
                # Cache configuration locally
                await self.cache.save_toy_configuration(config)
                
                # Update wake word if custom
                if 'wake_word' in config:
                    await self.wake_detector.update_wake_word(config['wake_word'])
                
                logging.info(f"Loaded toy: {config.get('name', 'Unknown')}")
                return True
            else:
                # Load from cache if available
                self.current_toy_config = await self.cache.get_toy_configuration(self.config.TOY_ID)
                return self.current_toy_config is not None
                
        except Exception as e:
            logging.error(f"Failed to load toy configuration: {e}")
            # Load from cache if available
            self.current_toy_config = await self.cache.get_toy_configuration(self.config.TOY_ID)
            return self.current_toy_config is not None
    
    async def transition_to(self, new_state: ToyState):
        """Handle state transitions with proper cleanup and setup"""
        if self.current_state == new_state:
            return
        
        self.previous_state = self.current_state
        old_state = self.current_state
        self.current_state = new_state
        
        logging.info(f"State transition: {old_state.value} -> {new_state.value}")
        
        # Update LED pattern based on state
        led_pattern_map = {
            ToyState.IDLE: LEDPattern.IDLE,
            ToyState.LISTENING: LEDPattern.LISTENING,
            ToyState.PROCESSING: LEDPattern.PROCESSING,
            ToyState.SPEAKING: LEDPattern.SPEAKING,
            ToyState.ERROR: LEDPattern.ERROR,
            ToyState.LOADING_TOY: LEDPattern.LOADING,
            ToyState.SWITCHING_TOY: LEDPattern.LOADING,
            ToyState.OFFLINE: LEDPattern.OFFLINE,
            ToyState.CONNECTING: LEDPattern.CONNECTING,
            ToyState.SHUTDOWN: LEDPattern.SHUTDOWN
        }
        
        if new_state in led_pattern_map:
            await self.led_controller.set_pattern(led_pattern_map[new_state])
        
        # Handle state-specific actions
        if new_state == ToyState.LISTENING:
            await self.start_listening()
        elif new_state == ToyState.PROCESSING:
            await self.stop_listening()
        elif new_state == ToyState.IDLE:
            self.current_sequence = 0
            self.last_activity_time = time.time()
    
    async def on_wake_word_detected(self, wake_word: str):
        """Handle wake word detection"""
        logging.info(f"Wake word detected: {wake_word}")
        
        # Play acknowledgment sound
        await self.hardware.play_sound('wake_ack.wav')
        
        # Transition to listening state
        await self.transition_to(ToyState.LISTENING)
    
    async def start_listening(self):
        """Start recording audio for processing"""
        if self.is_recording:
            return
        
        self.is_recording = True
        self.current_sequence = 0
        
        # Start audio streaming
        self.audio_stream_task = asyncio.create_task(self.stream_audio())
    
    async def stop_listening(self):
        """Stop recording audio"""
        self.is_recording = False
        
        if self.audio_stream_task:
            self.audio_stream_task.cancel()
            try:
                await self.audio_stream_task
            except asyncio.CancelledError:
                pass
    
    async def stream_audio(self):
        """Stream audio to server or process offline"""
        try:
            await self.audio_manager.start_recording()
            
            # Create Opus stream processor
            stream_processor = OpusStreamProcessor(
                self.opus_codec,
                on_encoded_chunk=self.send_audio_chunk
            )
            
            async for audio_chunk in self.audio_manager.record_stream():
                if not self.is_recording:
                    break
                
                # Process through Opus encoder
                await stream_processor.process_chunk(audio_chunk)
                
            # Send final chunk
            await stream_processor.flush()
            
            # Transition to processing
            await self.transition_to(ToyState.PROCESSING)
            
        except Exception as e:
            logging.error(f"Audio streaming error: {e}")
            await self.transition_to(ToyState.ERROR)
        finally:
            await self.audio_manager.stop_recording()
    
    async def send_audio_chunk(self, encoded_data: bytes, is_final: bool = False):
        """Send encoded audio chunk to server"""
        if self.is_online:
            metadata = {
                'sequence': self.current_sequence,
                'is_final': is_final
            }
            await self.connection.send_audio_chunk(encoded_data, metadata)
            self.current_sequence += 1
        else:
            # Store for offline processing
            # TODO: Implement offline audio processing
            pass
    
    async def process_server_messages(self):
        """Process incoming messages from server"""
        while True:
            try:
                message = await self.connection.get_message()
                if message:
                    await self.handle_server_message(message)
                else:
                    await asyncio.sleep(0.01)
            except Exception as e:
                logging.error(f"Error processing server messages: {e}")
                await asyncio.sleep(1)
    
    async def handle_server_message(self, message: Dict[str, Any]):
        """Handle different types of server messages"""
        msg_type = message.get('type')
        
        if msg_type == 'audio_response':
            await self.handle_audio_response(message)
        elif msg_type == 'switch_toy':
            await self.handle_toy_switch(message)
        elif msg_type == 'guardian_alert':
            await self.handle_guardian_alert(message)
        elif msg_type == 'error':
            await self.handle_server_error(message)
        else:
            logging.warning(f"Unknown message type: {msg_type}")
    
    async def handle_audio_response(self, message: Dict[str, Any]):
        """Handle audio response from server"""
        try:
            await self.transition_to(ToyState.SPEAKING)
            
            # Decode audio data
            audio_data = bytes.fromhex(message.get('audio', ''))
            
            # Decode Opus audio
            pcm_data = self.opus_codec.decode(audio_data)
            
            # Play audio
            await self.audio_manager.play_audio(pcm_data)
            
            # Save conversation
            user_input = message.get('user_input', '')
            toy_response = message.get('toy_response', '')
            
            await self.cache.save_conversation(
                user_input=user_input,
                toy_response=toy_response,
                toy_id=self.config.TOY_ID,
                was_offline=False
            )
            
            # Update conversation count
            self.conversation_count += 1
            
            # Return to idle
            await self.transition_to(ToyState.IDLE)
            
        except Exception as e:
            logging.error(f"Error handling audio response: {e}")
            await self.transition_to(ToyState.ERROR)
    
    async def handle_toy_switch(self, message: Dict[str, Any]):
        """Handle toy switching request"""
        new_toy_id = message.get('toyId')
        logging.info(f"Switching to toy: {new_toy_id}")
        
        await self.transition_to(ToyState.SWITCHING_TOY)
        
        # Update configuration
        self.config.TOY_ID = new_toy_id
        
        # Load new toy configuration
        success = await self.load_toy_configuration()
        
        if success:
            # Play confirmation sound
            await self.hardware.play_sound('toy_switch.wav')
        
        await self.transition_to(ToyState.IDLE)
    
    async def handle_guardian_alert(self, message: Dict[str, Any]):
        """Handle guardian mode alerts"""
        alert_type = message.get('alert_type')
        logging.warning(f"Guardian alert: {alert_type}")
        
        # Save safety event
        await self.cache.save_safety_event(
            event_type=alert_type,
            severity=message.get('severity', 'medium'),
            content=message.get('content', ''),
            toy_id=self.config.TOY_ID
        )
        
        # Visual/audio feedback
        await self.led_controller.flash_pattern(LEDPattern.WARNING, duration=2)
    
    async def handle_server_error(self, message: Dict[str, Any]):
        """Handle error messages from server"""
        error_code = message.get('code')
        error_msg = message.get('message', 'Unknown error')
        
        logging.error(f"Server error {error_code}: {error_msg}")
        
        # Show error pattern briefly
        await self.led_controller.flash_pattern(LEDPattern.ERROR, duration=1)
    
    async def on_button_single_press(self):
        """Handle single button press"""
        logging.info("Button single press")
        
        if self.current_state == ToyState.LISTENING:
            # Stop listening and process
            await self.transition_to(ToyState.PROCESSING)
        elif self.current_state == ToyState.SPEAKING:
            # Stop speaking (interrupt)
            await self.audio_manager.stop_playback()
            await self.transition_to(ToyState.IDLE)
        else:
            # Manual trigger listening
            await self.transition_to(ToyState.LISTENING)
    
    async def on_button_double_press(self):
        """Handle double button press"""
        logging.info("Button double press")
        
        # Toggle online/offline mode
        if self.is_online:
            logging.info("Switching to offline mode")
            await self.connection.close()
            self.is_online = False
            await self.transition_to(ToyState.OFFLINE)
        else:
            logging.info("Attempting to reconnect...")
            await self.transition_to(ToyState.CONNECTING)
            self.is_online = await self.connection.connect()
            await self.transition_to(ToyState.IDLE if self.is_online else ToyState.OFFLINE)
    
    async def on_button_long_press(self):
        """Handle long button press"""
        logging.info("Button long press - shutdown initiated")
        await self.shutdown()
    
    async def monitor_connection(self):
        """Monitor connection status and handle reconnection"""
        while self.current_state != ToyState.SHUTDOWN:
            try:
                if self.is_online and not self.connection.is_authenticated:
                    logging.warning("Connection lost, attempting reconnection...")
                    self.is_online = False
                    await self.transition_to(ToyState.OFFLINE)
                    
                    # Try to reconnect
                    await asyncio.sleep(5)
                    if await self.connection.connect():
                        self.is_online = True
                        await self.transition_to(ToyState.IDLE)
                        logging.info("Reconnection successful")
                
                await asyncio.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logging.error(f"Connection monitor error: {e}")
                await asyncio.sleep(30)
    
    async def monitor_performance(self):
        """Monitor system performance and enforce limits"""
        while self.current_state != ToyState.SHUTDOWN:
            try:
                # Check session duration
                session_duration = (time.time() - self.session_start_time) / 60
                if session_duration > self.config.SESSION_DURATION_LIMIT_MINUTES:
                    logging.warning("Session duration limit reached")
                    await self.led_controller.flash_pattern(LEDPattern.WARNING, duration=3)
                    # Could implement auto-shutdown or parent notification
                
                # Check conversation rate
                if self.conversation_count > self.config.MAX_CONVERSATIONS_PER_HOUR:
                    logging.warning("Conversation rate limit reached")
                    # Implement cooldown period
                
                # Record usage metrics
                await self.cache.record_usage_metric(
                    metric_type='session_duration',
                    value=session_duration,
                    toy_id=self.config.TOY_ID
                )
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logging.error(f"Performance monitor error: {e}")
                await asyncio.sleep(60)
    
    async def shutdown(self):
        """Gracefully shutdown the client"""
        logging.info("Shutting down Pommai client...")
        
        await self.transition_to(ToyState.SHUTDOWN)
        
        # Stop all components
        await self.wake_detector.stop_detection()
        await self.audio_manager.stop_recording()
        await self.audio_manager.stop_playback()
        
        # Stop sync manager
        if self.sync_manager:
            await self.sync_manager.stop()
        
        # Close connection
        await self.connection.close()
        
        # Cleanup hardware
        self.hardware.cleanup()
        
        logging.info("Shutdown complete")
    
    async def run(self):
        """Main event loop"""
        try:
            await self.initialize()
            
            # Keep running until shutdown
            while self.current_state != ToyState.SHUTDOWN:
                await asyncio.sleep(0.1)
                
        except KeyboardInterrupt:
            logging.info("Keyboard interrupt received")
        except Exception as e:
            logging.error(f"Fatal error: {e}")
        finally:
            await self.shutdown()


def setup_logging():
    """Configure logging for the application"""
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter(log_format))
    
    # File handler
    file_handler = logging.FileHandler('/tmp/pommai_client.log')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(log_format))
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    # Reduce noise from some libraries
    logging.getLogger('websockets').setLevel(logging.WARNING)
    logging.getLogger('asyncio').setLevel(logging.WARNING)


def main():
    """Entry point for the application"""
    # Setup logging
    setup_logging()
    
    # Log startup information
    logging.info("="*50)
    logging.info("Pommai Smart Toy Client Starting")
    logging.info(f"Python version: {sys.version}")
    logging.info(f"Device ID: {os.getenv('DEVICE_ID', 'not-set')}")
    logging.info("="*50)
    
    # Create and run client
    client = PommaiToyClient()
    
    # Run the async event loop
    try:
        asyncio.run(client.run())
    except Exception as e:
        logging.error(f"Fatal error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
