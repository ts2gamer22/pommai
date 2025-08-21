#!/usr/bin/env python3
"""
Integration tests for Pommai Smart Toy Client
Tests the complete system with all components integrated
"""

import asyncio
import unittest
import json
import os
import tempfile
import sqlite3
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from datetime import datetime, timedelta

# Mock GPIO before importing modules that use it
sys.modules['RPi'] = Mock()
sys.modules['RPi.GPIO'] = Mock()

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from pommai_client import PommaiToyClient, ToyState, Config
from conversation_cache import ConversationCache, CacheConfig
from sync_manager import SyncManager
from led_controller import LEDPattern


class TestPommaiIntegration(unittest.IsolatedAsyncioTestCase):
    """Integration tests for the complete Pommai client"""
    
    async def asyncSetUp(self):
        """Set up test environment"""
        # Create temporary database
        self.temp_db = tempfile.NamedTemporaryFile(delete=False)
        self.temp_db.close()
        
        # Mock configuration
        self.mock_config = Config()
        self.mock_config.CACHE_DB_PATH = self.temp_db.name
        self.mock_config.VOSK_MODEL_PATH = '/mock/vosk/model'
        
        # Mock hardware components
        self.mock_gpio = Mock()
        self.mock_pyaudio = Mock()
        
        # Create client with mocked dependencies
        with patch('pommai_client.Config', return_value=self.mock_config):
            with patch('pommai_client.GPIO', self.mock_gpio):
                with patch('pommai_client.pyaudio.PyAudio', return_value=self.mock_pyaudio):
                    self.client = PommaiToyClient()
    
    async def asyncTearDown(self):
        """Clean up test environment"""
        # Clean up temporary database
        if os.path.exists(self.temp_db.name):
            os.unlink(self.temp_db.name)
    
    async def test_client_initialization(self):
        """Test client initialization with all components"""
        # Mock connection
        self.client.connection.connect = AsyncMock(return_value=True)
        self.client.wake_detector.initialize = AsyncMock()
        self.client.wake_detector.start_detection = AsyncMock()
        self.client.led_controller.set_pattern = AsyncMock()
        
        # Initialize client
        await self.client.initialize()
        
        # Verify initialization steps
        self.assertTrue(self.client.is_online)
        self.assertEqual(self.client.current_state, ToyState.IDLE)
        self.client.led_controller.set_pattern.assert_called()
        self.client.wake_detector.initialize.assert_called_once()
    
    async def test_offline_mode_initialization(self):
        """Test client initialization in offline mode"""
        # Mock failed connection
        self.client.connection.connect = AsyncMock(return_value=False)
        self.client.wake_detector.initialize = AsyncMock()
        self.client.wake_detector.start_detection = AsyncMock()
        self.client.led_controller.set_pattern = AsyncMock()
        
        # Initialize client
        await self.client.initialize()
        
        # Verify offline mode
        self.assertFalse(self.client.is_online)
        self.assertEqual(self.client.current_state, ToyState.IDLE)
        self.client.led_controller.set_pattern.assert_any_call(LEDPattern.OFFLINE)
    
    async def test_wake_word_detection_flow(self):
        """Test complete wake word detection and audio processing flow"""
        # Setup mocks
        self.client.hardware.play_sound = AsyncMock()
        self.client.led_controller.set_pattern = AsyncMock()
        self.client.audio_manager.start_recording = AsyncMock()
        self.client.audio_manager.record_stream = AsyncMock()
        
        # Initialize client
        self.client.is_online = True
        self.client.current_state = ToyState.IDLE
        
        # Simulate wake word detection
        await self.client.on_wake_word_detected("hey pommai")
        
        # Verify state transition
        self.assertEqual(self.client.current_state, ToyState.LISTENING)
        self.client.hardware.play_sound.assert_called_with('wake_ack.wav')
        self.client.led_controller.set_pattern.assert_called_with(LEDPattern.LISTENING)
    
    async def test_audio_streaming_pipeline(self):
        """Test audio streaming from recording to server"""
        # Setup mocks
        audio_chunk = b'fake_audio_data'
        self.client.audio_manager.record_stream = AsyncMock()
        self.client.audio_manager.record_stream.return_value.__aiter__.return_value = [audio_chunk]
        
        self.client.opus_codec.encode = Mock(return_value=b'encoded_data')
        self.client.connection.send_audio_chunk = AsyncMock()
        
        # Start listening
        self.client.is_online = True
        self.client.is_recording = True
        
        # Process audio stream
        await self.client.stream_audio()
        
        # Verify audio was processed and sent
        self.client.connection.send_audio_chunk.assert_called()
        self.assertEqual(self.client.current_state, ToyState.PROCESSING)
    
    async def test_conversation_caching(self):
        """Test conversation is properly cached"""
        # Initialize cache
        await self.client.cache.initialize()
        
        # Save a conversation
        await self.client.cache.save_conversation(
            user_input="Hello toy",
            toy_response="Hello! I'm your friendly toy!",
            toy_id="test_toy_001",
            was_offline=False
        )
        
        # Verify conversation was saved
        conversations = await self.client.cache.get_recent_conversations(limit=1)
        self.assertEqual(len(conversations), 1)
        self.assertEqual(conversations[0]['user_input'], "Hello toy")
    
    async def test_state_transitions(self):
        """Test all state transitions work correctly"""
        self.client.led_controller.set_pattern = AsyncMock()
        
        # Test all state transitions
        states_to_test = [
            (ToyState.IDLE, LEDPattern.IDLE),
            (ToyState.LISTENING, LEDPattern.LISTENING),
            (ToyState.PROCESSING, LEDPattern.PROCESSING),
            (ToyState.SPEAKING, LEDPattern.SPEAKING),
            (ToyState.ERROR, LEDPattern.ERROR),
            (ToyState.OFFLINE, LEDPattern.OFFLINE),
        ]
        
        for state, expected_pattern in states_to_test:
            await self.client.transition_to(state)
            self.assertEqual(self.client.current_state, state)
            self.client.led_controller.set_pattern.assert_called_with(expected_pattern)
    
    async def test_button_interactions(self):
        """Test button press handling"""
        self.client.led_controller.set_pattern = AsyncMock()
        self.client.audio_manager.stop_playback = AsyncMock()
        
        # Test single press in idle state
        self.client.current_state = ToyState.IDLE
        await self.client.on_button_single_press()
        self.assertEqual(self.client.current_state, ToyState.LISTENING)
        
        # Test single press while speaking (interrupt)
        self.client.current_state = ToyState.SPEAKING
        await self.client.on_button_single_press()
        self.client.audio_manager.stop_playback.assert_called()
        self.assertEqual(self.client.current_state, ToyState.IDLE)
        
        # Test double press (toggle online/offline)
        self.client.is_online = True
        self.client.connection.close = AsyncMock()
        await self.client.on_button_double_press()
        self.assertFalse(self.client.is_online)
        self.assertEqual(self.client.current_state, ToyState.OFFLINE)
    
    async def test_toy_switching(self):
        """Test toy configuration switching"""
        self.client.led_controller.set_pattern = AsyncMock()
        self.client.hardware.play_sound = AsyncMock()
        self.client.connection.request_toy_config = AsyncMock(return_value={
            'name': 'New Toy',
            'personality_prompt': 'I am a new toy!',
            'is_for_kids': True
        })
        
        # Simulate toy switch message
        await self.client.handle_toy_switch({'toyId': 'new_toy_001'})
        
        # Verify toy was switched
        self.assertEqual(self.client.config.TOY_ID, 'new_toy_001')
        self.client.hardware.play_sound.assert_called_with('toy_switch.wav')
        self.assertTrue(self.client.is_guardian_mode)
    
    async def test_sync_manager_integration(self):
        """Test sync manager works with cache and connection"""
        # Initialize components
        await self.client.cache.initialize()
        
        # Create sync manager
        sync_manager = SyncManager(self.client.cache, self.client.connection)
        
        # Mock connection
        self.client.connection.is_authenticated = True
        self.client.connection.send_message = AsyncMock()
        self.client.connection.get_message = AsyncMock(return_value={
            'type': 'conversations_ack',
            'success': True
        })
        
        # Add some test data
        await self.client.cache.save_conversation(
            user_input="Test sync",
            toy_response="Testing sync functionality",
            toy_id="test_toy",
            was_offline=True
        )
        
        # Perform sync
        await sync_manager._sync_conversations()
        
        # Verify sync was attempted
        self.client.connection.send_message.assert_called()
        
    async def test_safety_event_handling(self):
        """Test guardian mode safety event handling"""
        self.client.led_controller.flash_pattern = AsyncMock()
        
        # Initialize cache
        await self.client.cache.initialize()
        
        # Handle guardian alert
        await self.client.handle_guardian_alert({
            'alert_type': 'inappropriate_content',
            'severity': 'high',
            'content': 'blocked content'
        })
        
        # Verify safety event was recorded
        events = await self.client.cache.get_unsynced_safety_events(limit=1)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]['event_type'], 'inappropriate_content')
        
        # Verify visual feedback
        self.client.led_controller.flash_pattern.assert_called_with(
            LEDPattern.WARNING,
            duration=2
        )
    
    async def test_performance_monitoring(self):
        """Test session limits and performance monitoring"""
        # Set up short limits for testing
        self.client.config.SESSION_DURATION_LIMIT_MINUTES = 0.1  # 6 seconds
        self.client.config.MAX_CONVERSATIONS_PER_HOUR = 2
        
        self.client.led_controller.flash_pattern = AsyncMock()
        
        # Initialize cache
        await self.client.cache.initialize()
        
        # Start monitoring
        monitor_task = asyncio.create_task(self.client.monitor_performance())
        
        # Wait for limit to be exceeded
        await asyncio.sleep(0.2)
        
        # Cancel monitoring
        monitor_task.cancel()
        try:
            await monitor_task
        except asyncio.CancelledError:
            pass
        
        # Verify warning was shown
        self.client.led_controller.flash_pattern.assert_called()
    
    async def test_error_recovery(self):
        """Test client recovers from errors gracefully"""
        self.client.led_controller.set_pattern = AsyncMock()
        
        # Simulate audio processing error
        self.client.audio_manager.start_recording = AsyncMock(
            side_effect=Exception("Audio device error")
        )
        
        # Try to stream audio
        await self.client.stream_audio()
        
        # Verify error state and recovery
        self.assertEqual(self.client.current_state, ToyState.ERROR)
        self.client.led_controller.set_pattern.assert_called_with(LEDPattern.ERROR)
    
    async def test_shutdown_sequence(self):
        """Test graceful shutdown of all components"""
        # Setup mocks
        self.client.wake_detector.stop_detection = AsyncMock()
        self.client.audio_manager.stop_recording = AsyncMock()
        self.client.audio_manager.stop_playback = AsyncMock()
        self.client.connection.close = AsyncMock()
        self.client.hardware.cleanup = Mock()
        self.client.led_controller.set_pattern = AsyncMock()
        
        # Create mock sync manager
        self.client.sync_manager = Mock()
        self.client.sync_manager.stop = AsyncMock()
        
        # Perform shutdown
        await self.client.shutdown()
        
        # Verify all components were stopped
        self.assertEqual(self.client.current_state, ToyState.SHUTDOWN)
        self.client.wake_detector.stop_detection.assert_called()
        self.client.audio_manager.stop_recording.assert_called()
        self.client.connection.close.assert_called()
        self.client.sync_manager.stop.assert_called()
        self.client.hardware.cleanup.assert_called()


class TestOfflineCapabilities(unittest.IsolatedAsyncioTestCase):
    """Test offline mode functionality"""
    
    async def asyncSetUp(self):
        """Set up test environment for offline tests"""
        self.temp_db = tempfile.NamedTemporaryFile(delete=False)
        self.temp_db.close()
        
        self.cache = ConversationCache(CacheConfig(db_path=self.temp_db.name))
        await self.cache.initialize()
    
    async def asyncTearDown(self):
        """Clean up test environment"""
        if os.path.exists(self.temp_db.name):
            os.unlink(self.temp_db.name)
    
    async def test_offline_response_caching(self):
        """Test offline responses are properly cached and retrieved"""
        # Cache a response
        await self.cache.cache_offline_response(
            command="what is your name",
            response_text="I'm Pommai, your friendly toy!",
            popularity_score=1.0
        )
        
        # Retrieve response
        response = await self.cache.get_offline_response("what is your name")
        self.assertIsNotNone(response)
        self.assertEqual(response['response_text'], "I'm Pommai, your friendly toy!")
    
    async def test_offline_conversation_queue(self):
        """Test conversations are queued for sync when offline"""
        # Save offline conversation
        conv_id = await self.cache.save_conversation(
            user_input="Hello offline",
            toy_response="Hello from offline mode!",
            toy_id="test_toy",
            was_offline=True
        )
        
        # Verify it's marked for sync
        unsynced = await self.cache.get_unsynced_conversations(limit=10)
        self.assertEqual(len(unsynced), 1)
        self.assertEqual(unsynced[0]['conversation_id'], conv_id)
        self.assertTrue(unsynced[0]['was_offline'])
    
    async def test_popular_response_tracking(self):
        """Test popular responses are tracked and prioritized"""
        # Create multiple responses
        responses = [
            ("hello", "Hi there!", 0.5),
            ("how are you", "I'm doing great!", 0.8),
            ("tell me a joke", "Why did the robot cross the road?", 0.9),
        ]
        
        for command, text, score in responses:
            await self.cache.cache_offline_response(command, text, score)
        
        # Get popular responses
        popular = await self.cache.get_popular_responses(limit=2)
        self.assertEqual(len(popular), 2)
        self.assertEqual(popular[0]['command'], "tell me a joke")  # Highest score


if __name__ == '__main__':
    unittest.main()
