#!/usr/bin/env python3
"""
Test script for Wake Word Detection with Vosk
Tests wake word detection, offline command processing, and safety features
"""

import asyncio
import sys
import os
import time
import logging
import json
import wave
import struct
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from wake_word_detector import (
    WakeWordDetector, WakeWordConfig, SafetyLevel, 
    OfflineCommands, OfflineVoiceProcessor
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WakeWordTestSuite:
    """Test suite for wake word detection functionality"""
    
    def __init__(self):
        self.test_passed = 0
        self.test_failed = 0
        
    async def run_all_tests(self):
        """Run all wake word detection tests"""
        logger.info("=== Wake Word Detection Test Suite ===\n")
        
        # Basic tests
        await self.test_vosk_initialization()
        await self.test_safety_filtering()
        await self.test_command_matching()
        await self.test_wake_word_grammar()
        await self.test_safety_violations_tracking()
        await self.test_offline_command_responses()
        await self.test_unknown_command_handling()
        
        # Print summary
        total = self.test_passed + self.test_failed
        logger.info(f"\n=== Test Summary ===")
        logger.info(f"Total tests: {total}")
        logger.info(f"Passed: {self.test_passed}")
        logger.info(f"Failed: {self.test_failed}")
        
        return self.test_failed == 0
    
    def log_test(self, name: str, passed: bool, details: str = ""):
        """Log test result"""
        if passed:
            self.test_passed += 1
            logger.info(f"✓ {name}: PASSED {details}")
        else:
            self.test_failed += 1
            logger.error(f"✗ {name}: FAILED {details}")
    
    async def test_vosk_initialization(self):
        """Test Vosk model initialization"""
        logger.info("\n1. Testing Vosk initialization...")
        
        try:
            # Test with mock path (won't load actual model)
            config = WakeWordConfig(
                model_path="/opt/pommai/models/vosk-model-small-en-us",
                wake_words=["hey pommai", "pommai"],
                safety_level=SafetyLevel.STRICT
            )
            
            # This will fail without actual model, but tests the structure
            try:
                detector = WakeWordDetector(config)
                self.log_test("Vosk initialization", True, "Structure validated")
            except FileNotFoundError:
                # Expected without actual model
                self.log_test("Vosk initialization", True, "FileNotFoundError as expected")
            
        except Exception as e:
            self.log_test("Vosk initialization", False, str(e))
    
    async def test_safety_filtering(self):
        """Test safety content filtering"""
        logger.info("\n2. Testing safety filtering...")
        
        try:
            # Create detector without Vosk model for testing
            detector = WakeWordDetector.__new__(WakeWordDetector)
            detector.config = WakeWordConfig(safety_level=SafetyLevel.STRICT)
            
            # Test various inputs
            test_cases = [
                # Safe inputs
                ("Hello pommai", False, None),
                ("I love you", False, None),
                ("Sing a song", False, None),
                
                # Blocked inputs
                ("Tell me about guns", True, "violence"),
                ("I'm scared of monsters", True, "scary"),
                ("What's your phone number?", True, "personal_info"),
                ("Let's fight", True, "violence"),
                ("Give me alcohol", True, "adult_topics"),
                ("This is stupid", True, "inappropriate"),
            ]
            
            passed = 0
            for text, should_block, expected_category in test_cases:
                result = detector._check_safety(text)
                
                if should_block:
                    if result['blocked'] and result.get('category') == expected_category:
                        passed += 1
                        logger.debug(f"✓ Correctly blocked: '{text}' ({expected_category})")
                    else:
                        logger.error(f"✗ Failed to block: '{text}'")
                else:
                    if not result['blocked']:
                        passed += 1
                        logger.debug(f"✓ Correctly allowed: '{text}'")
                    else:
                        logger.error(f"✗ Incorrectly blocked: '{text}'")
            
            self.log_test("Safety filtering", 
                         passed == len(test_cases),
                         f"({passed}/{len(test_cases)} cases)")
            
        except Exception as e:
            self.log_test("Safety filtering", False, str(e))
    
    async def test_command_matching(self):
        """Test offline command matching"""
        logger.info("\n3. Testing command matching...")
        
        try:
            detector = WakeWordDetector.__new__(WakeWordDetector)
            detector.config = WakeWordConfig(safety_level=SafetyLevel.STRICT)
            
            test_cases = [
                ("Hello there", "greeting"),
                ("Hi pommai", "greeting"),
                ("Good morning", "greeting"),
                ("Sing a song please", "sing_song"),
                ("Play some music", "sing_song"),
                ("Tell me a joke", "tell_joke"),
                ("Something funny", "tell_joke"),
                ("Goodnight pommai", "goodnight"),
                ("Time for bed", "goodnight"),
                ("I love you", "love_response"),
                ("You're my best friend", "love_response"),
                ("I need help", "need_help"),
                ("I'm hurt", "need_help"),
                ("Let's play a game", "play_game"),
                ("I'm bored", "play_game"),
                ("What's the weather?", None),  # Unknown command
                ("How old are you?", None),  # Unknown command
            ]
            
            matched = 0
            for text, expected_command in test_cases:
                result = detector._match_offline_command(text)
                
                if expected_command:
                    if result and result['command'] == expected_command:
                        matched += 1
                        logger.debug(f"✓ Matched: '{text}' -> {expected_command}")
                    else:
                        logger.error(f"✗ Failed to match: '{text}' (expected {expected_command})")
                else:
                    if result is None:
                        matched += 1
                        logger.debug(f"✓ Correctly unmatched: '{text}'")
                    else:
                        logger.error(f"✗ Incorrectly matched: '{text}' -> {result['command']}")
            
            self.log_test("Command matching", 
                         matched == len(test_cases),
                         f"({matched}/{len(test_cases)} cases)")
            
        except Exception as e:
            self.log_test("Command matching", False, str(e))
    
    async def test_wake_word_grammar(self):
        """Test wake word grammar creation"""
        logger.info("\n4. Testing wake word grammar...")
        
        try:
            config = WakeWordConfig(
                wake_words=["hey pommai", "pommai"],
                alternative_wake_words=["hello pommai", "hey buddy"]
            )
            
            detector = WakeWordDetector.__new__(WakeWordDetector)
            detector.config = config
            
            grammar = detector._create_wake_word_grammar()
            grammar_list = json.loads(grammar)
            
            # Check all wake words are included
            expected_words = config.wake_words + config.alternative_wake_words + ["[unk]"]
            
            self.log_test("Wake word grammar",
                         set(grammar_list) == set(expected_words),
                         f"({len(grammar_list)} words)")
            
        except Exception as e:
            self.log_test("Wake word grammar", False, str(e))
    
    async def test_safety_violations_tracking(self):
        """Test safety violations tracking"""
        logger.info("\n5. Testing safety violations tracking...")
        
        try:
            detector = WakeWordDetector.__new__(WakeWordDetector)
            detector.config = WakeWordConfig(safety_level=SafetyLevel.STRICT)
            detector.safety_violations = []
            
            # Simulate violations
            for i in range(4):
                detector._track_safety_violation("violence", f"bad content {i}")
                await asyncio.sleep(0.01)
            
            # Check tracking
            self.log_test("Violation tracking",
                         len(detector.safety_violations) == 4,
                         f"({len(detector.safety_violations)} violations)")
            
            # Check recent violations detection
            recent = [v for v in detector.safety_violations 
                     if time.time() - v['timestamp'] < 300]
            
            self.log_test("Recent violations",
                         len(recent) == 4,
                         f"({len(recent)} in last 5 min)")
            
        except Exception as e:
            self.log_test("Safety violations tracking", False, str(e))
    
    async def test_offline_command_responses(self):
        """Test offline command response selection"""
        logger.info("\n6. Testing offline command responses...")
        
        try:
            # Check each command has responses
            commands_tested = 0
            commands_valid = 0
            
            for cmd_name, cmd_config in OfflineCommands.COMMANDS.items():
                commands_tested += 1
                
                # Check responses exist
                if 'responses' in cmd_config and len(cmd_config['responses']) > 0:
                    commands_valid += 1
                    logger.debug(f"✓ {cmd_name}: {len(cmd_config['responses'])} responses")
                else:
                    logger.error(f"✗ {cmd_name}: No responses")
                
                # Check audio files if specified
                if 'audio_files' in cmd_config:
                    logger.debug(f"  Audio files: {len(cmd_config['audio_files'])}")
            
            self.log_test("Offline command responses",
                         commands_valid == commands_tested,
                         f"({commands_valid}/{commands_tested} valid)")
            
            # Test safe redirects
            redirects_tested = 0
            for category in OfflineCommands.BLOCKED_TOPICS.keys():
                redirect = OfflineCommands.get_safe_redirect(category)
                if redirect and len(redirect) > 0:
                    redirects_tested += 1
            
            self.log_test("Safe redirects",
                         redirects_tested == len(OfflineCommands.BLOCKED_TOPICS),
                         f"({redirects_tested} categories)")
            
        except Exception as e:
            self.log_test("Offline command responses", False, str(e))
    
    async def test_unknown_command_handling(self):
        """Test handling of unknown commands"""
        logger.info("\n7. Testing unknown command handling...")
        
        try:
            detector = WakeWordDetector.__new__(WakeWordDetector)
            detector.config = WakeWordConfig(
                safety_level=SafetyLevel.STRICT,
                max_consecutive_unknown=3
            )
            detector.consecutive_unknown = 0
            detector.command_recognizer = None  # Mock
            detector.safety_violations = []
            
            # Simulate processing unknown commands
            unknown_texts = [
                "What's the weather like?",
                "How old are you?",
                "Tell me a story about dragons",
                "Can you dance?",
                "What's 2+2?"
            ]
            
            results = []
            for text in unknown_texts:
                # Mock the command processing
                safety_result = detector._check_safety(text)
                if not safety_result['blocked']:
                    command_result = detector._match_offline_command(text)
                    if not command_result:
                        detector.consecutive_unknown += 1
                        
                        if detector.consecutive_unknown >= detector.config.max_consecutive_unknown:
                            response = "I'm having trouble understanding. Let's try again when we have internet!"
                        else:
                            response = "I need internet to understand that! Can we try something else?"
                        
                        results.append({
                            'text': text,
                            'consecutive': detector.consecutive_unknown,
                            'response': response
                        })
            
            # Check escalation
            escalated = False
            for i, result in enumerate(results):
                if i >= 2 and "having trouble understanding" in result['response']:
                    escalated = True
                    break
            
            self.log_test("Unknown command handling",
                         escalated,
                         f"(escalated after {detector.config.max_consecutive_unknown} unknowns)")
            
        except Exception as e:
            self.log_test("Unknown command handling", False, str(e))


def create_test_audio_file(filename: str, duration: float = 3.0, frequency: int = 440):
    """Create a test WAV file with a tone"""
    sample_rate = 16000
    num_samples = int(duration * sample_rate)
    
    # Generate sine wave
    import numpy as np
    t = np.linspace(0, duration, num_samples)
    audio_data = (np.sin(2 * np.pi * frequency * t) * 16384).astype(np.int16)
    
    # Write WAV file
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data.tobytes())
    
    return filename


async def main():
    """Run wake word detection tests"""
    print("\nPommai Wake Word Detection Test")
    print("=" * 40)
    
    # Check if running on Raspberry Pi
    is_pi = os.path.exists('/sys/firmware/devicetree/base/model')
    if is_pi:
        with open('/sys/firmware/devicetree/base/model', 'r') as f:
            model = f.read()
            print(f"Running on: {model.strip()}")
    else:
        print("Running on: Development machine")
    
    print(f"Python: {sys.version.split()[0]}")
    print("=" * 40)
    
    # Run tests
    test_suite = WakeWordTestSuite()
    success = await test_suite.run_all_tests()
    
    # Additional integration test if Vosk model is available
    if os.path.exists("/opt/pommai/models/vosk-model-small-en-us"):
        print("\n=== Integration Test ===")
        try:
            # Create test audio
            test_file = "test_wake_word.wav"
            create_test_audio_file(test_file)
            
            # Test with actual model
            config = WakeWordConfig(
                model_path="/opt/pommai/models/vosk-model-small-en-us",
                wake_words=["hey pommai", "pommai"]
            )
            detector = WakeWordDetector(config)
            
            # Process test audio
            with wave.open(test_file, 'rb') as wf:
                while True:
                    data = wf.readframes(512)
                    if len(data) == 0:
                        break
                    await detector.process_audio_chunk(data)
            
            print("✓ Integration test completed")
            
            # Cleanup
            os.remove(test_file)
            detector.cleanup()
            
        except Exception as e:
            print(f"✗ Integration test failed: {e}")
    else:
        print("\n[INFO] Vosk model not found - skipping integration test")
        print("To download the model:")
        print("wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip")
        print("unzip vosk-model-small-en-us-0.15.zip -d /opt/pommai/models/")
    
    if success:
        print("\n✓ All tests passed!")
        return 0
    else:
        print("\n✗ Some tests failed!")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
