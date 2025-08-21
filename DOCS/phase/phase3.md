# Phase 3: Raspberry Pi Client Implementation Guide

## Overview
Phase 3 focuses on developing the Raspberry Pi Zero 2W client that will live inside the physical toy. This phase bridges the hardware with our cloud infrastructure, enabling the core voice interaction experience for both Creator and Guardian modes. The client supports multiple toy personalities, allowing users to switch between different AI toys on the same device. The implementation must remain lightweight and optimized for the Pi Zero 2W's limited resources (512MB RAM).

## Prerequisites
- Raspberry Pi Zero 2W with DietPi OS installed (32-bit)
- ReSpeaker 2-Mics Pi HAT installed and configured
- Python 3.9+ environment set up
- Convex backend deployed and accessible (from Phase 2)
- WebSocket endpoint configured with per-tenant isolation in Convex
- User account created with at least one AI toy configured

## Task Breakdown

### 1. Python Client Setup (Single File Architecture)

**Objective**: Create a clean, maintainable single-file Python client that handles all device operations.

**Implementation Details**:
```python
# pommai_client.py structure (~200 lines total)
"""
Pommai Smart Toy Client for Raspberry Pi Zero 2W
Supports multiple toy personalities and Creator/Guardian modes
"""

import asyncio
import json
import logging
import os
import sys
from dataclasses import dataclass
from enum import Enum
from typing import Optional, Dict, Any

# External dependencies
import websockets
import pyaudio
import RPi.GPIO as GPIO
from vosk import Model, KaldiRecognizer
import sqlite3
from datetime import datetime
import pyopus

# Configuration
@dataclass
class Config:
    CONVEX_URL: str = os.getenv('CONVEX_URL', 'wss://your-app.convex.site/audio-stream')
    DEVICE_ID: str = os.getenv('DEVICE_ID', 'default-toy-001')
    USER_TOKEN: str = os.getenv('POMMAI_USER_TOKEN', '')  # User authentication token
    TOY_ID: str = os.getenv('POMMAI_TOY_ID', '')  # Selected toy configuration
    API_KEY: str = os.getenv('POMMAI_API_KEY', '')  # Legacy support
    
    # Audio settings
    SAMPLE_RATE: int = 16000
    CHUNK_SIZE: int = 1024
    CHANNELS: int = 1
    
    # GPIO pins (ReSpeaker 2-Mics HAT)
    BUTTON_PIN: int = 17
    LED_PINS: Dict[str, int] = {
        'red': 5,
        'green': 6,
        'blue': 13
    }
    
    # Paths
    VOSK_MODEL_PATH: str = '/home/pommai/models/vosk-model-small-en-us-0.15'
    CACHE_DB_PATH: str = '/home/pommai/cache.db'
    
    # Wake word
    WAKE_WORD: str = "hey pommai"

class ToyState(Enum):
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    ERROR = "error"
    LOADING_TOY = "loading_toy"  # Loading toy configuration
    SWITCHING_TOY = "switching_toy"  # Switching between toys
```

**Required Dependencies**:
```txt
# requirements.txt
websockets==12.0
pyaudio==0.2.14
RPi.GPIO==0.7.1
vosk==0.3.45
pyopus==0.1.1
aiofiles==23.2.1
python-dotenv==1.0.0
```

**Context Needed**: 
- Use context7 mcp or ask githubrepo from user for Convex WebSocket API documentation
- User authentication and toy selection protocol
- Specific audio format requirements for the cloud services

### 2. WebSocket Connection to Convex

**Objective**: Establish and maintain a reliable WebSocket connection to Convex for real-time communication.

**Implementation Details**:
```python
class ConvexConnection:
    def __init__(self, config: Config):
        self.config = config
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 10
        self.reconnect_delay = 1
        
    async def connect(self):
        """Establish WebSocket connection with exponential backoff"""
        while self.reconnect_attempts < self.max_reconnect_attempts:
            try:
                # Include authentication headers
                headers = {
                    'Authorization': f'Bearer {self.config.USER_TOKEN}',
                    'X-Device-ID': self.config.DEVICE_ID,
                    'X-Device-Type': 'raspberry-pi-zero-2w',
                    'X-Toy-ID': self.config.TOY_ID  # Selected toy for this session
                }
                
                self.websocket = await websockets.connect(
                    self.config.CONVEX_URL,
                    extra_headers=headers,
                    ping_interval=20,
                    ping_timeout=10
                )
                
                # Send initial handshake
                await self.send_message({
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
                })
                
                logging.info(f"Connected to Convex at {self.config.CONVEX_URL}")
                self.reconnect_attempts = 0
                return True
                
            except Exception as e:
                self.reconnect_attempts += 1
                delay = min(self.reconnect_delay * (2 ** self.reconnect_attempts), 60)
                logging.error(f"Connection failed: {e}. Retrying in {delay}s...")
                await asyncio.sleep(delay)
        
        return False
    
    async def send_audio_chunk(self, audio_data: bytes, metadata: Dict[str, Any]):
        """Send compressed audio chunk to server"""
        message = {
            'type': 'audio_chunk',
            'data': audio_data.hex(),  # Convert bytes to hex string
            'metadata': {
                'timestamp': datetime.utcnow().isoformat(),
                'sequence': metadata.get('sequence', 0),
                'is_final': metadata.get('is_final', False),
                **metadata
            }
        }
        
        await self.send_message(message)
```

**Context Needed**: 
- Use context7 mcp or ask githubrepo from user for Convex WebSocket protocol specification
- User authentication and per-tenant isolation
- Toy configuration loading and switching protocols
- Guardian mode detection and enforcement

### 3. ReSpeaker HAT Integration

**Objective**: Interface with the ReSpeaker 2-Mics Pi HAT for audio input/output and visual feedback.

**Implementation Details**:
```python
class HardwareController:
    def __init__(self, config: Config):
        self.config = config
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
    
    def setup_audio(self):
        """Configure PyAudio for ReSpeaker HAT"""
        self.audio = pyaudio.PyAudio()
        
        # Find ReSpeaker device
        respeaker_index = None
        for i in range(self.audio.get_device_count()):
            info = self.audio.get_device_info_by_index(i)
            if 'seeed' in info['name'].lower() or 'respeaker' in info['name'].lower():
                respeaker_index = i
                break
        
        if respeaker_index is None:
            logging.warning("ReSpeaker not found, using default audio device")
        
        # Configure streams
        self.input_stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=self.config.CHANNELS,
            rate=self.config.SAMPLE_RATE,
            input=True,
            input_device_index=respeaker_index,
            frames_per_buffer=self.config.CHUNK_SIZE
        )
        
        self.output_stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=self.config.CHANNELS,
            rate=self.config.SAMPLE_RATE,
            output=True,
            output_device_index=respeaker_index,
            frames_per_buffer=self.config.CHUNK_SIZE
        )
    
    async def set_led_pattern(self, pattern: str):
        """Set LED patterns for different states"""
        patterns = {
            'idle': {'red': 0, 'green': 0, 'blue': 10},
            'listening': {'red': 0, 'green': 0, 'blue': 100},
            'processing': self._create_swirl_pattern,
            'speaking': {'red': 0, 'green': 100, 'blue': 0},
            'error': {'red': 100, 'green': 0, 'blue': 0},
            'loading_toy': self._loading_pattern,
            'switching_toy': self._switching_pattern
        }
        
        if pattern in patterns:
            if callable(patterns[pattern]):
                await patterns[pattern]()
            else:
                for color, brightness in patterns[pattern].items():
                    self.led_pwm[color].ChangeDutyCycle(brightness)
```

**Hardware Testing Steps**:
1. Test button responsiveness (debouncing may be needed)
2. Verify LED colors and brightness levels
3. Test audio quality from both microphones
4. Measure power consumption in different states

**Context Needed**: 
- ReSpeaker 2-Mics HAT technical documentation
- GPIO pin mapping verification

### 4. Push-to-Talk Button Handling

**Objective**: Implement reliable push-to-talk functionality with proper debouncing and state management.

**Implementation Details**:
```python
class ButtonHandler:
    def __init__(self, hardware: HardwareController, state_machine: 'StateMachine'):
        self.hardware = hardware
        self.state_machine = state_machine
        self.button_state = False
        self.last_press_time = 0
        self.debounce_time = 0.05  # 50ms debounce
        self.long_press_threshold = 3.0  # 3 seconds for special actions
        self.press_start_time = None
        
        # Setup interrupt
        GPIO.add_event_detect(
            self.hardware.config.BUTTON_PIN,
            GPIO.BOTH,
            callback=self._button_callback,
            bouncetime=50
        )
    
    def _button_callback(self, channel):
        """Handle button press/release events"""
        current_time = asyncio.get_event_loop().time()
        
        # Debounce check
        if current_time - self.last_press_time < self.debounce_time:
            return
        
        self.last_press_time = current_time
        button_pressed = GPIO.input(channel) == GPIO.LOW
        
        if button_pressed and not self.button_state:
            # Button pressed
            self.button_state = True
            self.press_start_time = current_time
            asyncio.create_task(self._handle_press())
            
        elif not button_pressed and self.button_state:
            # Button released
            self.button_state = False
            press_duration = current_time - self.press_start_time if self.press_start_time else 0
            asyncio.create_task(self._handle_release(press_duration))
    
    async def _handle_press(self):
        """Handle button press event"""
        logging.info("Button pressed")
        
        # Immediate feedback
        await self.hardware.play_sound('button_press.wav')
        await self.hardware.set_led_pattern('listening')
        
        # Start recording if in idle state
        if self.state_machine.current_state == ToyState.IDLE:
            await self.state_machine.transition_to(ToyState.LISTENING)
    
    async def _handle_release(self, duration: float):
        """Handle button release event"""
        logging.info(f"Button released after {duration:.2f}s")
        
        if duration > self.long_press_threshold:
            # Long press - special action
            await self._handle_long_press()
        else:
            # Normal press - stop recording
            if self.state_machine.current_state == ToyState.LISTENING:
                await self.state_machine.transition_to(ToyState.PROCESSING)
    
    async def _handle_long_press(self):
        """Handle special long press actions"""
        # Triple pulse red LED
        for _ in range(3):
            await self.hardware.set_led_pattern('error')
            await asyncio.sleep(0.2)
            await self.hardware.set_led_pattern('idle')
            await asyncio.sleep(0.2)
        
        # Enter configuration mode or emergency stop
        logging.info("Long press detected - entering safe mode")
        await self.state_machine.enter_safe_mode()
```

**Context Needed**: 
- User experience guidelines for button interactions
- Safety mode implementation details from Phase 2

### 5. LED State Management

**Objective**: Create an intuitive LED feedback system that clearly communicates toy state to children.

**Implementation Details**:
```python
class LEDController:
    def __init__(self, hardware: HardwareController):
        self.hardware = hardware
        self.current_pattern = None
        self.pattern_task = None
        
    async def set_pattern(self, pattern: str, **kwargs):
        """Set LED pattern with smooth transitions"""
        # Cancel current pattern if running
        if self.pattern_task and not self.pattern_task.done():
            self.pattern_task.cancel()
        
        self.current_pattern = pattern
        
        patterns = {
            'idle': self._idle_breathing,
            'listening': self._listening_pulse,
            'processing': self._processing_swirl,
            'speaking': self._speaking_solid,
            'error': self._error_flash,
            'connection_lost': self._connection_lost_pattern,
            'loading_toy': self._loading_pattern,
            'switching_toy': self._switching_pattern
        }
        
        if pattern in patterns:
            self.pattern_task = asyncio.create_task(patterns[pattern](**kwargs))
    
    async def _idle_breathing(self, **kwargs):
        """Gentle breathing effect in blue"""
        while self.current_pattern == 'idle':
            # Breathe in
            for brightness in range(0, 30, 2):
                self.hardware.led_pwm['blue'].ChangeDutyCycle(brightness)
                await asyncio.sleep(0.05)
            
            # Breathe out
            for brightness in range(30, 0, -2):
                self.hardware.led_pwm['blue'].ChangeDutyCycle(brightness)
                await asyncio.sleep(0.05)
            
            await asyncio.sleep(0.5)
    
    async def _listening_pulse(self, **kwargs):
        """Pulsing blue to indicate recording"""
        while self.current_pattern == 'listening':
            for _ in range(2):  # Double pulse
                self.hardware.led_pwm['blue'].ChangeDutyCycle(100)
                await asyncio.sleep(0.1)
                self.hardware.led_pwm['blue'].ChangeDutyCycle(20)
                await asyncio.sleep(0.1)
            await asyncio.sleep(0.5)
    
    async def _processing_swirl(self, **kwargs):
        """Rainbow swirl effect while thinking"""
        colors = ['red', 'green', 'blue']
        phase = 0
        
        while self.current_pattern == 'processing':
            for i, color in enumerate(colors):
                # Create phase-shifted sine wave for each color
                brightness = int(50 * (1 + math.sin(phase + i * 2.09)) / 2)
                self.hardware.led_pwm[color].ChangeDutyCycle(brightness)
            
            phase += 0.1
            await asyncio.sleep(0.05)
    
    async def _speaking_solid(self, **kwargs):
        """Solid green while speaking"""
        self.hardware.led_pwm['green'].ChangeDutyCycle(80)
        self.hardware.led_pwm['red'].ChangeDutyCycle(0)
        self.hardware.led_pwm['blue'].ChangeDutyCycle(0)
        
        # Keep solid until pattern changes
        while self.current_pattern == 'speaking':
            await asyncio.sleep(0.1)
```

**LED Pattern Guidelines**:
- Blue: Listening/Recording states
- Green: Speaking/Success states  
- Red: Error/Warning states
- Rainbow/Swirl: Processing/Thinking
- Breathing: Idle/Waiting
- Fast flash: Urgent attention needed

### 6. Audio Streaming with PyAudio

**Objective**: Implement efficient audio capture and playback with minimal latency and memory usage.

**Implementation Details**:
```python
class AudioStreamManager:
    def __init__(self, hardware: HardwareController, config: Config):
        self.hardware = hardware
        self.config = config
        self.recording_buffer = []
        self.playback_queue = asyncio.Queue(maxsize=10)
        self.is_recording = False
        self.is_playing = False
        
    async def start_recording(self):
        """Start capturing audio from microphone"""
        self.is_recording = True
        self.recording_buffer = []
        
        async def record_loop():
            sequence = 0
            while self.is_recording:
                try:
                    # Read audio chunk
                    audio_data = self.hardware.input_stream.read(
                        self.config.CHUNK_SIZE,
                        exception_on_overflow=False
                    )
                    
                    # Add to buffer
                    self.recording_buffer.append(audio_data)
                    
                    # Compress and send if connected
                    if self.connection and self.connection.websocket:
                        compressed = self.compress_audio(audio_data)
                        await self.connection.send_audio_chunk(
                            compressed,
                            {'sequence': sequence, 'is_final': False}
                        )
                        sequence += 1
                    
                except Exception as e:
                    logging.error(f"Recording error: {e}")
                    await asyncio.sleep(0.01)
        
        asyncio.create_task(record_loop())
    
    async def stop_recording(self):
        """Stop recording and send final chunk"""
        self.is_recording = False
        
        # Send final chunk marker
        if self.connection and self.connection.websocket:
            await self.connection.send_audio_chunk(
                b'',
                {'is_final': True}
            )
        
        # Return full recording for offline processing
        return b''.join(self.recording_buffer)
    
    def compress_audio(self, audio_data: bytes) -> bytes:
        """Compress audio using Opus codec"""
        # Initialize Opus encoder if not exists
        if not hasattr(self, 'opus_encoder'):
            self.opus_encoder = pyopus.OpusEncoder(
                self.config.SAMPLE_RATE,
                self.config.CHANNELS,
                pyopus.APPLICATION_VOIP
            )
        
        # Convert bytes to numpy array for processing
        import numpy as np
        audio_array = np.frombuffer(audio_data, dtype=np.int16)
        
        # Encode with Opus
        encoded = self.opus_encoder.encode(audio_array.tobytes(), len(audio_array))
        return encoded
    
    async def play_audio_stream(self, audio_chunks):
        """Play audio chunks as they arrive"""
        self.is_playing = True
        
        async def playback_loop():
            buffer = []
            min_buffer_size = 3  # Buffer 3 chunks before starting
            
            async for chunk in audio_chunks:
                if not self.is_playing:
                    break
                
                # Decompress if needed
                if chunk.get('compressed'):
                    chunk['data'] = self.decompress_audio(chunk['data'])
                
                buffer.append(chunk['data'])
                
                # Start playback once minimum buffer reached
                if len(buffer) >= min_buffer_size or chunk.get('is_final'):
                    while buffer and self.is_playing:
                        audio_data = buffer.pop(0)
                        self.hardware.output_stream.write(audio_data)
            
            # Play remaining buffer
            while buffer and self.is_playing:
                audio_data = buffer.pop(0)
                self.hardware.output_stream.write(audio_data)
        
        await playback_loop()
        self.is_playing = False
```

**Audio Optimization Tips**:
- Use Opus codec for 3-4x compression
- Buffer management to prevent underruns
- Adjust chunk size based on network latency
- Implement adaptive bitrate based on connection quality

**Context Needed**: 
- Audio format specifications from cloud services
- Opus codec configuration for optimal quality/size trade-off

### 7. Opus Audio Compression

**Objective**: Implement efficient audio compression to reduce bandwidth usage and improve responsiveness.

**Implementation Details**:
```python
class OpusAudioCodec:
    def __init__(self, sample_rate: int = 16000, channels: int = 1):
        self.sample_rate = sample_rate
        self.channels = channels
        
        # Configure Opus for voice
        self.encoder = pyopus.OpusEncoder(
            sample_rate,
            channels,
            pyopus.APPLICATION_VOIP  # Optimized for voice
        )
        
        self.decoder = pyopus.OpusDecoder(
            sample_rate,
            channels
        )
        
        # Set codec parameters for optimal performance
        self.encoder.set_bitrate(24000)  # 24 kbps
        self.encoder.set_complexity(5)   # Balance quality/CPU
        self.encoder.set_packet_loss_perc(10)  # Handle 10% packet loss
        self.encoder.set_inband_fec(True)  # Forward error correction
        
    def encode_chunk(self, pcm_data: bytes, frame_size: int = 960) -> bytes:
        """Encode PCM audio to Opus"""
        try:
            # Ensure data is correct length
            expected_bytes = frame_size * self.channels * 2  # 16-bit samples
            
            if len(pcm_data) < expected_bytes:
                # Pad with silence
                pcm_data += b'\x00' * (expected_bytes - len(pcm_data))
            elif len(pcm_data) > expected_bytes:
                # Trim excess
                pcm_data = pcm_data[:expected_bytes]
            
            # Encode
            encoded = self.encoder.encode(pcm_data, frame_size)
            
            # Add simple header for chunk info
            header = struct.pack('!HH', len(encoded), frame_size)
            return header + encoded
            
        except Exception as e:
            logging.error(f"Opus encoding error: {e}")
            return b''
    
    def decode_chunk(self, opus_data: bytes) -> bytes:
        """Decode Opus audio to PCM"""
        try:
            # Extract header
            if len(opus_data) < 4:
                return b''
            
            encoded_len, frame_size = struct.unpack('!HH', opus_data[:4])
            encoded_data = opus_data[4:4+encoded_len]
            
            # Decode
            pcm_data = self.decoder.decode(encoded_data, frame_size)
            return pcm_data
            
        except Exception as e:
            logging.error(f"Opus decoding error: {e}")
            return b''
    
    def calculate_compression_ratio(self, original_size: int, compressed_size: int) -> float:
        """Calculate compression ratio for monitoring"""
        if compressed_size == 0:
            return 0.0
        return original_size / compressed_size
```

**Compression Strategy**:
- Target bitrate: 24 kbps for voice (good quality, low bandwidth)
- Frame size: 20ms (960 samples at 48kHz)
- Enable FEC for network resilience
- Monitor compression ratio to ensure efficiency

### 8. Vosk Wake Word Detection

**Objective**: Implement offline wake word detection to enable hands-free activation.

**Implementation Details**:
```python
class WakeWordDetector:
    def __init__(self, config: Config):
        self.config = config
        self.is_active = False
        self.wake_word_callback = None
        
        # Initialize Vosk model
        self.model = Model(config.VOSK_MODEL_PATH)
        self.recognizer = KaldiRecognizer(
            self.model,
            config.SAMPLE_RATE,
            '["hey pommai", "pommai", "[unk]"]'  # Limited vocabulary for efficiency
        )
        
        # Continuous audio buffer for wake word detection
        self.audio_buffer = collections.deque(maxlen=50)  # ~3 seconds
        
    async def start_detection(self, callback):
        """Start continuous wake word detection"""
        self.is_active = True
        self.wake_word_callback = callback
        
        async def detection_loop():
            stream = self.hardware.input_stream
            
            while self.is_active:
                try:
                    # Read small chunks for low latency
                    audio_chunk = stream.read(512, exception_on_overflow=False)
                    
                    # Add to buffer
                    self.audio_buffer.append(audio_chunk)
                    
                    # Process with Vosk
                    if self.recognizer.AcceptWaveform(audio_chunk):
                        result = json.loads(self.recognizer.Result())
                        text = result.get('text', '').lower()
                        
                        if 'hey pommai' in text or 'pommai' in text:
                            logging.info(f"Wake word detected: {text}")
                            
                            # Trigger callback
                            if self.wake_word_callback:
                                await self.wake_word_callback()
                            
                            # Clear buffer to avoid duplicate detections
                            self.audio_buffer.clear()
                            self.recognizer.Reset()
                            
                            # Cooldown period
                            await asyncio.sleep(2.0)
                    
                    # Small delay to prevent CPU overload
                    await asyncio.sleep(0.01)
                    
                except Exception as e:
                    logging.error(f"Wake word detection error: {e}")
                    await asyncio.sleep(0.1)
        
        asyncio.create_task(detection_loop())
    
    def stop_detection(self):
        """Stop wake word detection"""
        self.is_active = False
    
    async def process_offline_command(self, audio_data: bytes) -> Optional[str]:
        """Process audio for basic offline commands"""
        # Reset recognizer for fresh recognition
        self.recognizer.Reset()
        
        # Process entire audio
        self.recognizer.AcceptWaveform(audio_data)
        result = json.loads(self.recognizer.FinalResult())
        
        text = result.get('text', '').lower()
        confidence = result.get('confidence', 0)
        
        logging.info(f"Offline recognition: '{text}' (confidence: {confidence})")
        
        # Map to offline commands if confidence is high enough
        if confidence > 0.7:
            return self._map_to_offline_command(text)
        
        return None
    
    def _map_to_offline_command(self, text: str) -> Optional[str]:
        """Map recognized text to offline commands"""
        offline_commands = {
            'hello': 'greeting',
            'hi': 'greeting',
            'sing': 'sing_song',
            'song': 'sing_song',
            'joke': 'tell_joke',
            'goodnight': 'goodnight',
            'night': 'goodnight',
            'love you': 'love_response',
            'game': 'suggest_game',
            'story': 'suggest_story'
        }
        
        for keyword, command in offline_commands.items():
            if keyword in text:
                return command
        
        return None
```

**Wake Word Optimization**:
- Use smallest Vosk model (vosk-model-small-en-us)
- Limited vocabulary for faster processing
- Continuous background detection with low CPU usage
- Configurable sensitivity threshold

**Context Needed**: 
- Vosk model selection guide for Pi Zero 2W
- Wake word training best practices

### 9. SQLite Conversation Cache

**Objective**: Implement local caching for offline functionality and conversation history.

**Implementation Details**:
```python
class ConversationCache:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_database()
        
    def init_database(self):
        """Initialize SQLite database with schema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Conversations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_input TEXT,
                toy_response TEXT,
                was_offline BOOLEAN DEFAULT 0,
                synced BOOLEAN DEFAULT 0
            )
        ''')
        
        # Cached responses table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cached_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                command TEXT UNIQUE,
                response_text TEXT,
                response_audio BLOB,
                usage_count INTEGER DEFAULT 0,
                last_used DATETIME
            )
        ''')
        
        # Toy configuration cache
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS toy_configurations (
                toy_id TEXT PRIMARY KEY,
                name TEXT,
                personality_prompt TEXT,
                voice_settings TEXT,
                is_for_kids BOOLEAN DEFAULT 0,
                safety_level TEXT,
                knowledge_base TEXT,
                last_updated DATETIME
            )
        ''')
        
        # Metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usage_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_type TEXT,
                value REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        
        # Preload default offline responses
        self._preload_offline_responses()
    
    def _preload_offline_responses(self):
        """Load default offline responses"""
        default_responses = [
            {
                'command': 'greeting',
                'text': "Hi there! I'm so happy to talk with you!",
                'audio_file': 'responses/greeting.opus'
            },
            {
                'command': 'sing_song',
                'text': "🎵 Twinkle twinkle little star... 🎵",
                'audio_file': 'responses/twinkle_star.opus'
            },
            {
                'command': 'tell_joke',
                'text': "Why did the teddy bear say no to dessert? Because she was stuffed!",
                'audio_file': 'responses/joke_1.opus'
            },
            {
                'command': 'goodnight',
                'text': "Sweet dreams, my friend! Sleep tight!",
                'audio_file': 'responses/goodnight.opus'
            },
            {
                'command': 'love_response',
                'text': "I love you too, buddy! You're the best!",
                'audio_file': 'responses/love_you.opus'
            }
        ]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for response in default_responses:
            # Load audio file if exists
            audio_data = None
            if os.path.exists(response['audio_file']):
                with open(response['audio_file'], 'rb') as f:
                    audio_data = f.read()
            
            cursor.execute('''
                INSERT OR REPLACE INTO cached_responses 
                (command, response_text, response_audio) 
                VALUES (?, ?, ?)
            ''', (response['command'], response['text'], audio_data))
        
        conn.commit()
        conn.close()
    
    async def save_conversation(self, user_input: str, toy_response: str, was_offline: bool = False):
        """Save conversation to local cache"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO conversations (user_input, toy_response, was_offline, synced)
            VALUES (?, ?, ?, ?)
        ''', (user_input, toy_response, was_offline, False))
        
        conn.commit()
        conn.close()
        
        # Queue for sync if online
        if not was_offline:
            asyncio.create_task(self._sync_to_cloud())
    
    async def get_offline_response(self, command: str) -> Optional[Dict[str, Any]]:
        """Get cached response for offline mode"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT response_text, response_audio 
            FROM cached_responses 
            WHERE command = ?
        ''', (command,))
        
        result = cursor.fetchone()
        
        if result:
            # Update usage stats
            cursor.execute('''
                UPDATE cached_responses 
                SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP 
                WHERE command = ?
            ''', (command,))
            conn.commit()
            
            return {
                'text': result[0],
                'audio': result[1]
            }
        
        conn.close()
        return None
    
    async def cache_popular_response(self, user_input: str, response_text: str, response_audio: bytes):
        """Cache frequently used responses for offline access"""
        # Simple frequency analysis
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Check if this input appears frequently
        cursor.execute('''
            SELECT COUNT(*) FROM conversations 
            WHERE user_input LIKE ? 
            AND timestamp > datetime('now', '-7 days')
        ''', (f'%{user_input}%',))
        
        count = cursor.fetchone()[0]
        
        if count > 5:  # If asked more than 5 times in a week
            # Generate a command key
            command_key = f"cached_{hash(user_input) % 10000}"
            
            cursor.execute('''
                INSERT OR REPLACE INTO cached_responses 
                (command, response_text, response_audio) 
                VALUES (?, ?, ?)
            ''', (command_key, response_text, response_audio))
            
            conn.commit()
        
        conn.close()
    
    async def get_unsynced_conversations(self) -> List[Dict[str, Any]]:
        """Get conversations that need to be synced to cloud"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, timestamp, user_input, toy_response, was_offline 
            FROM conversations 
            WHERE synced = 0 
            ORDER BY timestamp
        ''')
        
        conversations = []
        for row in cursor.fetchall():
            conversations.append({
                'id': row[0],
                'timestamp': row[1],
                'user_input': row[2],
                'toy_response': row[3],
                'was_offline': row[4]
            })
        
        conn.close()
        return conversations
    
    async def cleanup_old_data(self, days_to_keep: int = 30):
        """Remove old conversations and unused cache entries"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Remove old synced conversations
        cursor.execute('''
            DELETE FROM conversations 
            WHERE synced = 1 
            AND timestamp < datetime('now', '-{} days')
        '''.format(days_to_keep))
        
        # Remove unused cached responses
        cursor.execute('''
            DELETE FROM cached_responses 
            WHERE usage_count = 0 
            AND last_used < datetime('now', '-30 days')
        ''')
        
        conn.commit()
        conn.close()
```

**Cache Strategy**:
- Store last 100 conversations locally
- Cache top 20 most common responses
- Sync to cloud when connection available
- Automatic cleanup of old data
- Personality prompt cached for offline mode

### Main Integration and State Machine

**Objective**: Tie all components together into a cohesive state machine.

**Implementation Details**:
```python
class PommaiToyClient:
    def __init__(self):
        self.config = Config()
        self.hardware = HardwareController(self.config)
        self.connection = ConvexConnection(self.config)
        self.audio_manager = AudioStreamManager(self.hardware, self.config)
        self.opus_codec = OpusAudioCodec()
        self.wake_detector = WakeWordDetector(self.config)
        self.cache = ConversationCache(self.config.CACHE_DB_PATH)
        self.led_controller = LEDController(self.hardware)
        self.button_handler = ButtonHandler(self.hardware, self)
        
        self.current_state = ToyState.IDLE
        self.is_online = False
        self.current_toy_config = None
        self.is_guardian_mode = False
        
    async def initialize(self):
        """Initialize all components and establish connections"""
        logging.info("Initializing Pommai Toy Client...")
        
        # Set initial LED state
        await self.led_controller.set_pattern('idle')
        
        # Try to connect to cloud
        self.is_online = await self.connection.connect()
        
        if not self.is_online:
            logging.warning("Starting in offline mode")
            await self.led_controller.set_pattern('connection_lost')
        else:
            # Load toy configuration from server
            await self.load_toy_configuration()
        
        # Start wake word detection
        await self.wake_detector.start_detection(self.on_wake_word)
        
        # Start connection monitor
        asyncio.create_task(self.monitor_connection())
        
        # Start toy switch listener
        asyncio.create_task(self.listen_for_toy_switch())
        
        logging.info("Initialization complete")
    
    async def load_toy_configuration(self):
        """Load the selected toy configuration from server"""
        await self.transition_to(ToyState.LOADING_TOY)
        
        try:
            # Request toy configuration
            await self.connection.send_message({
                'type': 'get_toy_config',
                'toyId': self.config.TOY_ID
            })
            
            # Wait for response
            response = await self.connection.receive_message()
            
            if response['type'] == 'toy_config':
                self.current_toy_config = response['config']
                self.is_guardian_mode = response['config'].get('is_for_kids', False)
                
                # Cache configuration locally
                await self.cache.save_toy_configuration(self.current_toy_config)
                
                # Update wake word if custom
                if 'wake_word' in self.current_toy_config:
                    self.wake_detector.update_wake_word(self.current_toy_config['wake_word'])
                
                logging.info(f"Loaded toy: {self.current_toy_config['name']}")
                
        except Exception as e:
            logging.error(f"Failed to load toy configuration: {e}")
            # Load from cache if available
            self.current_toy_config = await self.cache.get_toy_configuration(self.config.TOY_ID)
        
        await self.transition_to(ToyState.IDLE)
    
    async def listen_for_toy_switch(self):
        """Listen for toy switching commands from server"""
        while self.is_online:
            try:
                message = await self.connection.receive_message()
                
                if message['type'] == 'switch_toy':
                    new_toy_id = message['toyId']
                    logging.info(f"Switching to toy: {new_toy_id}")
                    
                    # Update configuration
                    self.config.TOY_ID = new_toy_id
                    
                    # Load new toy configuration
                    await self.load_toy_configuration()
                    
                    # Play confirmation sound
                    await self.hardware.play_sound('toy_switch.wav')
                    
            except Exception as e:
                logging.error(f"Toy switch listener error: {e}")
                await asyncio.sleep(1)
    
    async def _check_guardian_mode(self):
        """Check if current toy is in guardian mode"""
        if self.current_toy_config:
            return self.current_toy_config.get('is_for_kids', False)
        return False
    
    async def transition_to(self, new_state: ToyState):
        """Handle state transitions"""
        old_state = self.current_state
        self.current_state = new_state
        
        logging.info(f"State transition: {old_state} -> {new_state}")
        
        # Update LED pattern
        await self.led_controller.set_pattern(new_state.value)
        
        # Handle state-specific actions
        if new_state == ToyState.LISTENING:
            await self.audio_manager.start_recording()
            
        elif new_state == ToyState.PROCESSING:
            audio_data = await self.audio_manager.stop_recording()
            await self.process_audio(audio_data)
            
        elif new_state == ToyState.SPEAKING:
            # Handled by process_audio
            pass
            
        elif new_state == ToyState.IDLE:
            # Reset to idle
            pass
    
    async def process_audio(self, audio_data: bytes):
        """Process recorded audio through online or offline pipeline"""
        try:
            if self.is_online:
                # Online processing through Convex
                await self.process_online(audio_data)
            else:
                # Offline processing
                await self.process_offline(audio_data)
                
        except Exception as e:
            logging.error(f"Audio processing error: {e}")
            await self.transition_to(ToyState.ERROR)
            await asyncio.sleep(2)
            await self.transition_to(ToyState.IDLE)
    
    async def process_online(self, audio_data: bytes):
        """Process audio through cloud pipeline"""
        # Audio is already being streamed, wait for response
        response_stream = await self.connection.receive_audio_stream()
        
        # Transition to speaking state
        await self.transition_to(ToyState.SPEAKING)
        
        # Play response as it arrives
        await self.audio_manager.play_audio_stream(response_stream)
        
        # Return to idle
        await self.transition_to(ToyState.IDLE)
    
    async def process_offline(self, audio_data: bytes):
        """Process audio using offline capabilities"""
        # Try offline command recognition
        command = await self.wake_detector.process_offline_command(audio_data)
        
        if command:
            # Get cached response
            response = await self.cache.get_offline_response(command)
            
            if response:
                await self.transition_to(ToyState.SPEAKING)
                
                # Play cached audio if available
                if response['audio']:
                    await self.play_cached_audio(response['audio'])
                else:
                    # Use TTS fallback
                    await self.play_text_response(response['text'])
                
                # Save conversation for later sync
                await self.cache.save_conversation(
                    command,
                    response['text'],
                    was_offline=True
                )
        else:
            # No offline command matched
            await self.play_cached_audio('responses/offline_fallback.opus')
        
        await self.transition_to(ToyState.IDLE)
    
    async def run(self):
        """Main event loop"""
        await self.initialize()
        
        try:
            # Keep running
            while True:
                await asyncio.sleep(1)
                
        except KeyboardInterrupt:
            logging.info("Shutdown requested")
        finally:
            await self.cleanup()
    
    async def cleanup(self):
        """Clean shutdown"""
        logging.info("Cleaning up...")
        
        # Stop all services
        self.wake_detector.stop_detection()
        await self.connection.close()
        
        # Cleanup hardware
        GPIO.cleanup()
        self.hardware.audio.terminate()
        
        logging.info("Shutdown complete")

# Entry point
if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the client
    client = PommaiToyClient()
    asyncio.run(client.run())
```

## Testing Strategy

### Unit Tests
1. Test each component in isolation
2. Mock hardware interfaces for CI/CD
3. Test state transitions
4. Verify offline fallbacks

### Integration Tests  
1. Test full audio pipeline
2. Test connection resilience
3. Test button interactions
4. Verify LED patterns

### Hardware Tests
1. Audio quality verification
2. Button responsiveness
3. Power consumption monitoring
4. Heat generation under load
5. Long-running stability tests

## Performance Optimization

### Memory Management
- Monitor memory usage continuously
- Implement garbage collection hints
- Use memory-mapped files for large audio
- Clear buffers after use

### CPU Optimization
- Use async/await for all I/O
- Optimize audio processing loops
- Profile and optimize hot paths
- Consider Cython for critical sections

### Network Optimization
- Implement connection pooling
- Use compression for all data
- Batch small messages
- Implement retry with backoff

## Deployment Considerations

### SD Card Image
1. Create base image with all dependencies
2. Read-only filesystem with overlay
3. Automated provisioning script
4. OTA update mechanism

### Configuration Management
1. Environment variables for secrets
2. Config file for user settings
3. Remote configuration updates
4. Factory reset capability

### Monitoring and Logging
1. Remote log collection
2. Performance metrics
3. Error reporting
4. Usage analytics

## Security Implementation

### Device Security
1. Unique device keys
2. Secure boot if possible
3. Encrypted storage for sensitive data
4. API key rotation

### Communication Security
1. TLS for all connections
2. Certificate pinning
3. Message authentication
4. Rate limiting

### Privacy Protection
1. No audio storage after processing
2. Anonymized metrics
3. Parent-controlled data retention
4. COPPA compliance

## Context Requirements

For successful implementation of Phase 3, the following additional context will be needed:

1. **Convex WebSocket API Documentation** (use context7 mcp or ask githubrepo from user)
   - Authentication protocol
   - Message format specifications
   - Audio streaming protocol
   - Error handling requirements

2. **Audio Service Specifications** (use context7 mcp or ask githubrepo from user)
   - Required audio formats
   - Compression settings
   - Streaming chunk sizes
   - Latency requirements

3. **Safety Integration Details** (use context7 mcp or ask githubrepo from user)
   - How offline mode handles safety
   - Emergency stop protocol
   - Parent notification system
   - Content filtering for offline responses

4. **Hardware Specifications** (use context7 mcp or ask githubrepo from user)
   - ReSpeaker HAT pinout confirmation
   - Power consumption targets
   - Temperature thresholds
   - Physical integration guidelines

This comprehensive guide should enable successful implementation of the Raspberry Pi client, creating a responsive, safe, and delightful experience for children while maintaining the technical constraints of the Pi Zero 2W platform.
