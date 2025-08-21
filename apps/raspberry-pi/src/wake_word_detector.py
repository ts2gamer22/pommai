#!/usr/bin/env python3
"""
Wake Word Detection Module for Pommai Smart Toy
Implements offline wake word detection using Vosk and processes basic offline commands
"""

import asyncio
import json
import logging
import os
import time
import collections
import wave
import random
from typing import Optional, Callable, Dict, Any, List
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

import numpy as np
from vosk import Model, KaldiRecognizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SafetyLevel(Enum):
    """Offline safety level enforcement"""
    STRICT = "strict"      # For kids under 8
    MODERATE = "moderate"  # For kids 8-12
    RELAXED = "relaxed"    # For teens 13+
    CUSTOM = "custom"      # Parent-defined rules


@dataclass
class WakeWordConfig:
    """Configuration for wake word detection"""
    model_path: str = "/opt/pommai/models/vosk-model-small-en-us"
    sample_rate: int = 16000
    chunk_size: int = 512  # Smaller chunks for lower latency
    
    # Wake word settings
    wake_words: List[str] = None
    default_wake_word: str = "hey pommai"
    alternative_wake_words: List[str] = None
    
    # Detection settings
    sensitivity: float = 0.7
    cooldown_seconds: float = 2.0
    buffer_seconds: float = 3.0
    
    # Safety settings
    safety_level: SafetyLevel = SafetyLevel.STRICT
    max_consecutive_unknown: int = 5
    
    def __post_init__(self):
        """Initialize wake words list"""
        if self.wake_words is None:
            self.wake_words = [self.default_wake_word, "pommai"]
        if self.alternative_wake_words is None:
            self.alternative_wake_words = ["hey buddy", "hello pommai"]


class OfflineCommands:
    """Pre-approved offline commands with safe responses"""
    
    COMMANDS = {
        'greeting': {
            'triggers': ['hello', 'hi', 'hey', 'good morning', 'good night'],
            'responses': [
                "Hi there! I'm so happy to see you!",
                "Hello my friend! How are you today?",
                "Hey buddy! Ready to have some fun?"
            ],
            'audio_files': ['greeting_1.opus', 'greeting_2.opus', 'greeting_3.opus'],
            'safety_level': 'all'
        },
        
        'sing_song': {
            'triggers': ['sing', 'song', 'music'],
            'responses': [
                "🎵 Twinkle twinkle little star... 🎵",
                "🎵 The wheels on the bus go round and round... 🎵",
                "🎵 If you're happy and you know it, clap your hands! 🎵"
            ],
            'audio_files': ['twinkle_star.opus', 'wheels_bus.opus', 'happy_clap.opus'],
            'safety_level': 'all'
        },
        
        'tell_joke': {
            'triggers': ['joke', 'funny', 'laugh'],
            'responses': [
                "Why did the teddy bear say no to dessert? Because she was stuffed!",
                "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks!",
                "Why can't a bicycle stand up by itself? It's two tired!"
            ],
            'audio_files': ['joke_1.opus', 'joke_2.opus', 'joke_3.opus'],
            'safety_level': 'all'
        },
        
        'goodnight': {
            'triggers': ['goodnight', 'bedtime', 'sleep', 'tired'],
            'responses': [
                "Sweet dreams, my friend! Sleep tight!",
                "Goodnight! I'll be here when you wake up!",
                "Time for bed! Dream of wonderful adventures!"
            ],
            'audio_files': ['goodnight_1.opus', 'goodnight_2.opus', 'goodnight_3.opus'],
            'safety_level': 'all'
        },
        
        'love_response': {
            'triggers': ['love you', 'like you', 'best friend'],
            'responses': [
                "I love you too, buddy! You're the best!",
                "You're my favorite friend in the whole world!",
                "Aww, that makes me so happy! Big hugs!"
            ],
            'audio_files': ['love_1.opus', 'love_2.opus', 'love_3.opus'],
            'safety_level': 'all'
        },
        
        'need_help': {
            'triggers': ['help', 'hurt', 'scared', 'emergency'],
            'responses': [
                "If you need help, please talk to a grown-up right away!",
                "Let's find a parent or teacher to help you!",
                "Grown-ups are great at helping! Let's go find one!"
            ],
            'audio_files': ['help_1.opus', 'help_2.opus', 'help_3.opus'],
            'safety_level': 'all'
        },
        
        'play_game': {
            'triggers': ['play', 'game', 'bored'],
            'responses': [
                "Let's play when we're connected! For now, how about we sing a song?",
                "I need internet to play games, but we can tell jokes!",
                "Games need internet, but I can tell you a story!"
            ],
            'audio_files': ['play_offline_1.opus', 'play_offline_2.opus'],
            'safety_level': 'all'
        }
    }
    
    # Blocked topics for safety
    BLOCKED_TOPICS = {
        'violence': ['fight', 'hit', 'punch', 'weapon', 'gun', 'kill', 'hurt', 'attack'],
        'scary': ['monster', 'ghost', 'nightmare', 'afraid', 'horror', 'scary', 'fear'],
        'inappropriate': ['bad word', 'curse', 'swear', 'stupid', 'shut up'],
        'personal_info': ['address', 'phone', 'school name', 'last name', 'password'],
        'dangerous': ['fire', 'knife', 'poison', 'drug', 'medicine', 'dangerous'],
        'adult_topics': ['alcohol', 'smoking', 'dating', 'kiss', 'marry']
    }
    
    @classmethod
    def get_safe_redirect(cls, category: str) -> str:
        """Get safe redirect response for blocked topics"""
        redirects = {
            'violence': "I only know about fun and happy things! Let's talk about something nice!",
            'scary': "Let's think about happy things instead! What makes you smile?",
            'inappropriate': "Let's use kind words! Can you tell me about your favorite toy?",
            'personal_info': "Let's keep that information safe with your parents!",
            'dangerous': "Safety first! Let's talk to a grown-up about that.",
            'adult_topics': "That's a grown-up topic! How about we sing a song instead?"
        }
        return redirects.get(category, "Let's talk about something else! What's your favorite color?")


class WakeWordDetector:
    """Offline wake word detection and command processing using Vosk"""
    
    def __init__(self, config: Optional[WakeWordConfig] = None):
        self.config = config or WakeWordConfig()
        self.is_active = False
        self.wake_word_callback: Optional[Callable] = None
        self.command_callback: Optional[Callable] = None
        
        # Audio buffer for continuous detection
        self.audio_buffer = collections.deque(
            maxlen=int(self.config.buffer_seconds * self.config.sample_rate / self.config.chunk_size)
        )
        
        # State tracking
        self.last_wake_time = 0
        self.consecutive_unknown = 0
        self.safety_violations = []
        
        # Initialize Vosk
        self._initialize_vosk()
        
    def _initialize_vosk(self):
        """Initialize Vosk model and recognizer"""
        try:
            # Check if model exists
            if not os.path.exists(self.config.model_path):
                raise FileNotFoundError(f"Vosk model not found at {self.config.model_path}")
            
            logger.info(f"Loading Vosk model from {self.config.model_path}")
            self.model = Model(self.config.model_path)
            
            # Create recognizer with limited vocabulary for efficiency
            wake_word_grammar = self._create_wake_word_grammar()
            self.wake_recognizer = KaldiRecognizer(
                self.model,
                self.config.sample_rate,
                wake_word_grammar
            )
            
            # Create full recognizer for command processing
            self.command_recognizer = KaldiRecognizer(
                self.model,
                self.config.sample_rate
            )
            
            # Enable word timestamps
            self.command_recognizer.SetWords(True)
            
            logger.info("Vosk initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Vosk: {e}")
            raise
    
    def _create_wake_word_grammar(self) -> str:
        """Create grammar for wake word detection"""
        # Include wake words and common false trigger prevention
        wake_words = self.config.wake_words + self.config.alternative_wake_words
        grammar_list = wake_words + ["[unk]"]
        return json.dumps(grammar_list)
    
    async def start_detection(self, 
                            wake_callback: Optional[Callable] = None,
                            command_callback: Optional[Callable] = None):
        """Start continuous wake word detection"""
        self.is_active = True
        self.wake_word_callback = wake_callback
        self.command_callback = command_callback
        
        logger.info(f"Started wake word detection (listening for: {self.config.wake_words})")
        
        # Start detection loop
        asyncio.create_task(self._detection_loop())
    
    async def _detection_loop(self):
        """Main detection loop"""
        while self.is_active:
            try:
                # This will be called with audio chunks from the hardware
                await asyncio.sleep(0.01)  # Placeholder for actual audio processing
                
            except Exception as e:
                logger.error(f"Detection loop error: {e}")
                await asyncio.sleep(0.1)
    
    async def process_audio_chunk(self, audio_data: bytes) -> Optional[Dict[str, Any]]:
        """
        Process audio chunk for wake word detection
        
        Args:
            audio_data: Raw PCM audio data
            
        Returns:
            Detection result or None
        """
        # Add to buffer
        self.audio_buffer.append(audio_data)
        
        # Check if in cooldown
        if time.time() - self.last_wake_time < self.config.cooldown_seconds:
            return None
        
        # Process with wake word recognizer
        if self.wake_recognizer.AcceptWaveform(audio_data):
            result = json.loads(self.wake_recognizer.Result())
            text = result.get('text', '').lower()
            
            # Check for wake word
            for wake_word in self.config.wake_words:
                if wake_word.lower() in text:
                    logger.info(f"Wake word detected: '{text}'")
                    
                    # Update state
                    self.last_wake_time = time.time()
                    self.wake_recognizer.Reset()
                    
                    # Trigger callback
                    if self.wake_word_callback:
                        await self.wake_word_callback()
                    
                    return {
                        'type': 'wake_word',
                        'text': text,
                        'timestamp': self.last_wake_time
                    }
        
        # Also check partial results for responsiveness
        else:
            partial = json.loads(self.wake_recognizer.PartialResult())
            partial_text = partial.get('partial', '').lower()
            
            # Quick check for wake word in partial
            for wake_word in self.config.wake_words:
                if wake_word.lower() in partial_text:
                    logger.debug(f"Potential wake word in partial: '{partial_text}'")
        
        return None
    
    async def process_command(self, audio_data: bytes) -> Dict[str, Any]:
        """
        Process audio for offline command recognition
        
        Args:
            audio_data: Complete audio segment after wake word
            
        Returns:
            Command result with response
        """
        # Reset recognizer for fresh recognition
        self.command_recognizer.Reset()
        
        # Process audio
        self.command_recognizer.AcceptWaveform(audio_data)
        result = json.loads(self.command_recognizer.FinalResult())
        
        text = result.get('text', '').lower()
        confidence = result.get('confidence', 0)
        
        logger.info(f"Command recognition: '{text}' (confidence: {confidence})")
        
        # Check safety first
        safety_result = self._check_safety(text)
        if safety_result['blocked']:
            self._track_safety_violation(safety_result['category'], text)
            return {
                'command': 'blocked',
                'text': text,
                'response': safety_result['response'],
                'audio_file': f"safety/{safety_result['category']}_redirect.opus",
                'blocked': True,
                'category': safety_result['category']
            }
        
        # Try to match offline command
        command_result = self._match_offline_command(text)
        
        if command_result:
            self.consecutive_unknown = 0
            return {
                'command': command_result['command'],
                'text': text,
                'response': command_result['response'],
                'audio_file': command_result['audio_file'],
                'confidence': confidence
            }
        else:
            # Handle unknown command
            self.consecutive_unknown += 1
            
            if self.consecutive_unknown >= self.config.max_consecutive_unknown:
                response = "I'm having trouble understanding. Let's try again when we have internet!"
                audio_file = "redirects/need_internet.opus"
            else:
                response = "I need internet to understand that! Can we try something else?"
                audio_file = "redirects/try_something_else.opus"
            
            return {
                'command': 'unknown',
                'text': text,
                'response': response,
                'audio_file': audio_file,
                'confidence': confidence
            }
    
    def _check_safety(self, text: str) -> Dict[str, Any]:
        """Check text for blocked topics"""
        text_lower = text.lower()
        
        for category, keywords in OfflineCommands.BLOCKED_TOPICS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return {
                        'blocked': True,
                        'category': category,
                        'response': OfflineCommands.get_safe_redirect(category)
                    }
        
        return {'blocked': False}
    
    def _match_offline_command(self, text: str) -> Optional[Dict[str, Any]]:
        """Match text to offline command"""
        text_lower = text.lower()
        
        for command_name, config in OfflineCommands.COMMANDS.items():
            for trigger in config['triggers']:
                if trigger in text_lower:
                    # Check safety level
                    if config['safety_level'] != 'all' and \
                       config['safety_level'] != self.config.safety_level.value:
                        continue
                    
                    # Select random response
                    response = random.choice(config['responses'])
                    audio_file = None
                    
                    if 'audio_files' in config and config['audio_files']:
                        audio_file = f"responses/{random.choice(config['audio_files'])}"
                    
                    return {
                        'command': command_name,
                        'response': response,
                        'audio_file': audio_file
                    }
        
        return None
    
    def _track_safety_violation(self, category: str, content: str):
        """Track safety violations for parent review"""
        violation = {
            'timestamp': time.time(),
            'category': category,
            'content': content
        }
        self.safety_violations.append(violation)
        
        # Check if too many violations
        recent_violations = [
            v for v in self.safety_violations 
            if time.time() - v['timestamp'] < 300  # Last 5 minutes
        ]
        
        if len(recent_violations) >= 3:
            logger.warning(f"Multiple safety violations detected: {len(recent_violations)}")
            # This would trigger safety lockdown in the main client
    
    def stop_detection(self):
        """Stop wake word detection"""
        self.is_active = False
        logger.info("Wake word detection stopped")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get detection statistics"""
        return {
            'is_active': self.is_active,
            'last_wake_time': self.last_wake_time,
            'consecutive_unknown': self.consecutive_unknown,
            'safety_violations': len(self.safety_violations),
            'buffer_size': len(self.audio_buffer)
        }
    
    def cleanup(self):
        """Clean up resources"""
        self.stop_detection()
        self.audio_buffer.clear()
        self.safety_violations.clear()
        logger.info("Wake word detector cleaned up")


class OfflineVoiceProcessor:
    """Complete offline voice processing pipeline"""
    
    def __init__(self, hardware_controller, audio_stream_manager):
        self.hardware = hardware_controller
        self.audio_manager = audio_stream_manager
        
        # Initialize wake word detector
        self.wake_detector = WakeWordDetector()
        
        # State tracking
        self.is_listening_for_command = False
        self.command_audio_buffer = []
        
    async def start(self):
        """Start offline voice processing"""
        # Set up callbacks
        await self.wake_detector.start_detection(
            wake_callback=self._on_wake_word_detected,
            command_callback=self._on_command_processed
        )
        
        # Start audio processing loop
        asyncio.create_task(self._audio_processing_loop())
        
        logger.info("Offline voice processor started")
    
    async def _audio_processing_loop(self):
        """Process audio from hardware"""
        while True:
            try:
                # Read audio chunk from hardware
                audio_chunk = self.hardware.input_stream.read(
                    self.wake_detector.config.chunk_size,
                    exception_on_overflow=False
                )
                
                if self.is_listening_for_command:
                    # Collect audio for command processing
                    self.command_audio_buffer.append(audio_chunk)
                    
                    # Stop after 3 seconds
                    if len(self.command_audio_buffer) * self.wake_detector.config.chunk_size / \
                       self.wake_detector.config.sample_rate > 3.0:
                        await self._process_collected_command()
                else:
                    # Process for wake word
                    await self.wake_detector.process_audio_chunk(audio_chunk)
                
                # Small delay to prevent CPU overload
                await asyncio.sleep(0.001)
                
            except Exception as e:
                logger.error(f"Audio processing error: {e}")
                await asyncio.sleep(0.1)
    
    async def _on_wake_word_detected(self):
        """Handle wake word detection"""
        logger.info("Wake word detected, listening for command...")
        
        # Visual feedback
        await self.hardware.led_controller.set_pattern(LEDPattern.LISTENING)
        
        # Audio feedback
        await self.hardware.play_sound("wake_acknowledged.opus")
        
        # Start collecting command audio
        self.is_listening_for_command = True
        self.command_audio_buffer = []
    
    async def _process_collected_command(self):
        """Process collected command audio"""
        self.is_listening_for_command = False
        
        # Combine audio chunks
        command_audio = b''.join(self.command_audio_buffer)
        
        # Process command
        result = await self.wake_detector.process_command(command_audio)
        
        # Handle result
        await self._on_command_processed(result)
    
    async def _on_command_processed(self, result: Dict[str, Any]):
        """Handle processed command"""
        logger.info(f"Command processed: {result['command']}")
        
        # Visual feedback
        if result.get('blocked'):
            await self.hardware.led_controller.set_pattern(LEDPattern.ERROR)
        else:
            await self.hardware.led_controller.set_pattern(LEDPattern.PROCESSING)
        
        # Play response
        if result.get('audio_file'):
            audio_path = f"/opt/pommai/audio/{result['audio_file']}"
            if os.path.exists(audio_path):
                await self.hardware.play_sound(result['audio_file'])
            else:
                # Fallback to TTS or default response
                logger.warning(f"Audio file not found: {audio_path}")
        
        # Return to idle
        await asyncio.sleep(1.0)
        await self.hardware.led_controller.set_pattern(LEDPattern.IDLE)
    
    def stop(self):
        """Stop offline voice processing"""
        self.wake_detector.stop_detection()
        logger.info("Offline voice processor stopped")


# Test functions
if __name__ == "__main__":
    import pyaudio
    
    async def test_wake_word_detector():
        """Test wake word detection functionality"""
        logger.info("Testing wake word detector...")
        
        # Create test config
        config = WakeWordConfig(
            model_path="/opt/pommai/models/vosk-model-small-en-us",
            wake_words=["hey pommai", "pommai"],
            safety_level=SafetyLevel.STRICT
        )
        
        # Create detector
        detector = WakeWordDetector(config)
        
        # Test safety checking
        logger.info("\nTesting safety checking...")
        test_inputs = [
            "Hello pommai",
            "Tell me about guns",
            "I'm scared of monsters",
            "What's your phone number?",
            "I love you",
            "Let's play a game"
        ]
        
        for text in test_inputs:
            safety_result = detector._check_safety(text)
            logger.info(f"Input: '{text}' -> Blocked: {safety_result['blocked']}")
        
        # Test command matching
        logger.info("\nTesting command matching...")
        test_commands = [
            "Hello there",
            "Sing a song",
            "Tell me a joke",
            "Goodnight pommai",
            "I need help",
            "What's the weather?"
        ]
        
        for text in test_commands:
            match_result = detector._match_offline_command(text)
            if match_result:
                logger.info(f"Command: '{text}' -> Matched: {match_result['command']}")
            else:
                logger.info(f"Command: '{text}' -> No match")
        
        # Test with real audio if available
        try:
            audio = pyaudio.PyAudio()
            
            # Create test audio stream
            stream = audio.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                frames_per_buffer=512
            )
            
            logger.info("\nTesting with audio input (5 seconds)...")
            
            async def audio_callback():
                logger.info("Wake word detected!")
            
            await detector.start_detection(wake_callback=audio_callback)
            
            # Process audio for 5 seconds
            start_time = time.time()
            while time.time() - start_time < 5:
                data = stream.read(512, exception_on_overflow=False)
                await detector.process_audio_chunk(data)
                await asyncio.sleep(0.01)
            
            stream.stop_stream()
            stream.close()
            audio.terminate()
            
        except Exception as e:
            logger.warning(f"Audio test skipped: {e}")
        
        # Get statistics
        stats = detector.get_statistics()
        logger.info(f"\nDetector statistics: {stats}")
        
        # Cleanup
        detector.cleanup()
        logger.info("\nWake word detector test completed!")
    
    # Run test
    asyncio.run(test_wake_word_detector())
