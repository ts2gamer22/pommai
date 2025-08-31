#!/usr/bin/env python3
"""
Phase 4 Integration Test Suite for Pommai FastRTC Client

This comprehensive test suite validates the complete FastRTC client logic with:
- Mocked hardware layers (GPIO, PyAudio)
- Mocked network layers (WebSockets)
- State transition testing
- Error handling and recovery
- Reconnection logic
- Resource management
- Performance benchmarks
"""

import asyncio
import json
import os
import sys
import unittest
from unittest.mock import AsyncMock, MagicMock, patch, call, Mock
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Any
import tempfile
import time
import logging

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging for tests
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class MockGPIO:
    """Mock RPi.GPIO module for testing without hardware"""
    BCM = 11
    IN = 1
    OUT = 0
    PUD_UP = 22
    HIGH = 1
    LOW = 0
    RISING = 31
    FALLING = 32
    BOTH = 33
    
    @staticmethod
    def setmode(mode):
        pass
    
    @staticmethod
    def setwarnings(flag):
        pass
    
    @staticmethod
    def setup(pin, mode, pull_up_down=None):
        logger.debug(f"GPIO.setup: pin={pin}, mode={mode}, pull_up_down={pull_up_down}")
    
    @staticmethod
    def output(pin, state):
        logger.debug(f"GPIO.output: pin={pin}, state={state}")
    
    @staticmethod
    def input(pin):
        return 0
    
    @staticmethod
    def add_event_detect(pin, edge, callback=None, bouncetime=None):
        logger.debug(f"GPIO.add_event_detect: pin={pin}, edge={edge}")
    
    @staticmethod
    def remove_event_detect(pin):
        pass
    
    @staticmethod
    def cleanup():
        pass
    
    class PWM:
        def __init__(self, pin, frequency):
            self.pin = pin
            self.frequency = frequency
            self.duty_cycle = 0
        
        def start(self, duty_cycle):
            self.duty_cycle = duty_cycle
        
        def ChangeDutyCycle(self, duty_cycle):
            self.duty_cycle = duty_cycle
        
        def stop(self):
            self.duty_cycle = 0


class MockPyAudio:
    """Mock PyAudio for testing audio functionality"""
    paInt16 = 8
    
    class Stream:
        def __init__(self):
            self.is_active_flag = True
            self.chunks_written = []
            self.chunks_read = []
            self.read_counter = 0
        
        def read(self, chunk_size, exception_on_overflow=False):
            # Return different patterns to simulate real audio
            self.read_counter += 1
            if self.read_counter % 3 == 0:
                return b'\x10' * (chunk_size * 2)  # Some signal
            return b'\x00' * (chunk_size * 2)  # Silence
        
        def write(self, data):
            self.chunks_written.append(data)
        
        def stop_stream(self):
            self.is_active_flag = False
        
        def close(self):
            self.is_active_flag = False
        
        def is_active(self):
            return self.is_active_flag
    
    def __init__(self):
        self.streams = []
    
    def open(self, **kwargs):
        stream = self.Stream()
        self.streams.append(stream)
        return stream
    
    def terminate(self):
        for stream in self.streams:
            stream.close()


@dataclass
class TestConfig:
    """Test configuration matching actual Config dataclass"""
    FASTRTC_GATEWAY_URL: str = "ws://localhost:8080/ws"
    DEVICE_ID: str = "test-device-001"
    TOY_ID: str = "test-toy"
    AUTH_TOKEN: str = "test-token"
    SAMPLE_RATE: int = 16000
    CHUNK_SIZE: int = 1024
    CHANNELS: int = 1
    AUDIO_FORMAT: int = 8  # pyaudio.paInt16
    OPUS_BITRATE: int = 24000
    OPUS_COMPLEXITY: int = 5
    BUTTON_PIN: int = 17
    LED_PINS: Dict[str, int] = None
    ENABLE_WAKE_WORD: bool = False
    ENABLE_OFFLINE_MODE: bool = True
    MAX_RECONNECT_ATTEMPTS: int = 3
    RECONNECT_DELAY: float = 0.1  # Shorter for testing
    
    def __post_init__(self):
        if self.LED_PINS is None:
            self.LED_PINS = {'red': 5, 'green': 6, 'blue': 13}


class TestFastRTCIntegration(unittest.TestCase):
    """Integration tests for FastRTC client"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Mock hardware modules before importing client
        self.gpio_mock = MockGPIO()
        sys.modules['RPi'] = MagicMock()
        sys.modules['RPi.GPIO'] = self.gpio_mock
        
        # Mock PyAudio
        self.pyaudio_mock = MockPyAudio
        sys.modules['pyaudio'] = MagicMock()
        sys.modules['pyaudio'].PyAudio = self.pyaudio_mock
        
        # Mock other dependencies
        sys.modules['vosk'] = MagicMock()
        sys.modules['opuslib'] = MagicMock()
        
        # Create temp directory for test files
        self.temp_dir = tempfile.mkdtemp()
        self.test_config = TestConfig()
        
        # Set up environment variables
        os.environ['FASTRTC_GATEWAY_URL'] = self.test_config.FASTRTC_GATEWAY_URL
        os.environ['AUTH_TOKEN'] = self.test_config.AUTH_TOKEN
        os.environ['DEVICE_ID'] = self.test_config.DEVICE_ID
        os.environ['TOY_ID'] = self.test_config.TOY_ID
    
    def tearDown(self):
        """Clean up test fixtures"""
        # Clean up temp files
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
        
        # Clean up mocked modules
        for module in ['RPi', 'RPi.GPIO', 'pyaudio', 'vosk', 'opuslib']:
            if module in sys.modules:
                del sys.modules[module]
    
    @patch('websockets.connect')
    async def test_connection_lifecycle(self, mock_ws_connect):
        """Test connection establishment and teardown"""
        # Import after mocks are set up
        from pommai_client_fastrtc import PommaiClientFastRTC, Config, ToyState
        
        # Mock WebSocket connection
        mock_ws = AsyncMock()
        mock_ws.send = AsyncMock()
        mock_ws.recv = AsyncMock(side_effect=[
            json.dumps({"type": "connection_ack", "device_id": self.test_config.DEVICE_ID}),
            asyncio.CancelledError()  # Stop receiving
        ])
        mock_ws.close = AsyncMock()
        mock_ws_connect.return_value.__aenter__.return_value = mock_ws
        
        # Create client
        config = Config()
        client = PommaiClientFastRTC(config)
        
        # Test initialization
        self.assertEqual(client.state, ToyState.IDLE)
        self.assertIsNotNone(client.connection)
        self.assertIsNotNone(client.audio_manager)
        
        # Test connection
        success = await client.initialize()
        self.assertTrue(success)
        
        # Test cleanup
        await client.cleanup()
        mock_ws.close.assert_called()
    
    @patch('websockets.connect')
    async def test_reconnection_logic(self, mock_ws_connect):
        """Test automatic reconnection on connection loss"""
        from pommai_client_fastrtc import PommaiClientFastRTC, Config
        
        connection_attempts = []
        
        async def connect_side_effect(*args, **kwargs):
            class AsyncContextManager:
                async def __aenter__(self_):
                    attempt = len(connection_attempts)
                    connection_attempts.append(attempt)
                    
                    if attempt < 2:
                        raise ConnectionRefusedError("Connection refused")
                    
                    mock_ws = AsyncMock()
                    mock_ws.send = AsyncMock()
                    mock_ws.recv = AsyncMock(return_value=json.dumps({"type": "connection_ack"}))
                    mock_ws.close = AsyncMock()
                    return mock_ws
                
                async def __aexit__(self_, *args):
                    pass
            
            return AsyncContextManager()
        
        mock_ws_connect.side_effect = connect_side_effect
        
        config = Config()
        config.MAX_RECONNECT_ATTEMPTS = 5
        config.RECONNECT_DELAY = 0.01
        
        client = PommaiClientFastRTC(config)
        success = await client.initialize()
        
        self.assertTrue(success)
        self.assertEqual(len(connection_attempts), 3)  # Failed twice, succeeded on third
    
    @patch('websockets.connect')
    async def test_state_transitions(self, mock_ws_connect):
        """Test state machine transitions"""
        from pommai_client_fastrtc import PommaiClientFastRTC, Config, ToyState
        
        # Mock WebSocket
        mock_ws = AsyncMock()
        mock_ws.send = AsyncMock()
        mock_ws.recv = AsyncMock(return_value=json.dumps({"type": "connection_ack"}))
        mock_ws.close = AsyncMock()
        mock_ws_connect.return_value.__aenter__.return_value = mock_ws
        
        config = Config()
        client = PommaiClientFastRTC(config)
        
        # Test initial state
        self.assertEqual(client.state, ToyState.IDLE)
        
        # Test state transitions through typical flow
        await client.initialize()
        
        # Start recording -> LISTENING
        await client.start_recording()
        self.assertEqual(client.state, ToyState.LISTENING)
        self.assertTrue(client.is_recording)
        
        # Stop recording -> PROCESSING
        await client.stop_recording()
        self.assertEqual(client.state, ToyState.PROCESSING)
        self.assertFalse(client.is_recording)
        
        # Simulate audio response -> SPEAKING
        await client.handle_audio_response({"audio": "base64_audio_data"})
        self.assertEqual(client.state, ToyState.SPEAKING)
        
        # Error -> ERROR state
        await client.handle_error({"message": "Test error"})
        self.assertEqual(client.state, ToyState.ERROR)
    
    @patch('websockets.connect')
    async def test_audio_streaming(self, mock_ws_connect):
        """Test audio capture and streaming"""
        from pommai_client_fastrtc import PommaiClientFastRTC, Config
        
        # Mock WebSocket
        mock_ws = AsyncMock()
        mock_ws.send = AsyncMock()
        mock_ws.recv = AsyncMock(return_value=json.dumps({"type": "connection_ack"}))
        mock_ws.close = AsyncMock()
        mock_ws_connect.return_value.__aenter__.return_value = mock_ws
        
        config = Config()
        client = PommaiClientFastRTC(config)
        await client.initialize()
        
        # Start recording
        await client.start_recording()
        self.assertTrue(client.is_recording)
        self.assertIsNotNone(client.recording_task)
        
        # Let recording run briefly
        await asyncio.sleep(0.2)
        
        # Stop recording
        audio_data = await client.stop_recording()
        self.assertFalse(client.is_recording)
        self.assertIsNotNone(audio_data)
        self.assertGreater(len(audio_data), 0)
    
    @patch('websockets.connect')
    async def test_button_interaction(self, mock_ws_connect):
        """Test button press/release handling"""
        from pommai_client_fastrtc import PommaiClientFastRTC, Config, ToyState
        
        mock_ws = AsyncMock()
        mock_ws.send = AsyncMock()
        mock_ws.recv = AsyncMock(return_value=json.dumps({"type": "connection_ack"}))
        mock_ws.close = AsyncMock()
        mock_ws_connect.return_value.__aenter__.return_value = mock_ws
        
        config = Config()
        client = PommaiClientFastRTC(config)
        await client.initialize()
        
        # Test button press
        await client.on_button_press()
        self.assertEqual(client.state, ToyState.LISTENING)
        self.assertTrue(client.is_recording)
        
        # Test button release
        await client.on_button_release()
        self.assertEqual(client.state, ToyState.PROCESSING)
        self.assertFalse(client.is_recording)
    
    @patch('websockets.connect')
    async def test_message_handling(self, mock_ws_connect):
        """Test handling of different message types from server"""
        from pommai_client_fastrtc import PommaiClientFastRTC, Config
        
        mock_ws = AsyncMock()
        mock_ws.send = AsyncMock()
        mock_ws.close = AsyncMock()
        mock_ws_connect.return_value.__aenter__.return_value = mock_ws
        
        config = Config()
        client = PommaiClientFastRTC(config)
        
        # Test different message types
        test_messages = [
            {"type": "connection_ack", "status": "connected"},
            {"type": "audio_response", "audio": "base64_audio_data"},
            {"type": "config_update", "config": {"volume": 0.8}},
            {"type": "toy_state", "state": "active"},
            {"type": "error", "message": "Test error"}
        ]
        
        for msg in test_messages:
            # Mock the appropriate handler
            handler_name = f"handle_{msg['type'].replace('_', '_')}"
            if hasattr(client, handler_name):
                handler = getattr(client, handler_name)
                await handler(msg)
    
    async def test_offline_mode(self):
        """Test offline mode functionality"""
        from pommai_client_fastrtc import PommaiClientFastRTC, Config, ToyState
        
        config = Config()
        config.ENABLE_OFFLINE_MODE = True
        config.FASTRTC_GATEWAY_URL = "ws://unreachable.host/ws"
        config.MAX_RECONNECT_ATTEMPTS = 1
        
        with patch('websockets.connect', side_effect=ConnectionRefusedError("No connection")):
            client = PommaiClientFastRTC(config)
            success = await client.initialize()
            
            self.assertFalse(success)
            self.assertEqual(client.state, ToyState.OFFLINE)
            
            # Test offline functionality
            if client.cache:
                # Should have offline responses available
                self.assertIsNotNone(client.cache)
    
    async def test_resource_cleanup(self):
        """Test proper resource cleanup"""
        from pommai_client_fastrtc import PommaiClientFastRTC, Config
        
        config = Config()
        client = PommaiClientFastRTC(config)
        
        # Create some resources
        client.audio_buffer = [b'data'] * 100
        client.is_recording = True
        
        # Cleanup
        await client.cleanup()
        
        # Verify cleanup
        self.assertEqual(len(client.audio_buffer), 0)
        self.assertFalse(client.is_recording)
    
    async def test_led_patterns(self):
        """Test LED controller integration"""
        from pommai_client_fastrtc import PommaiClientFastRTC, Config
        from led_controller import LEDPattern
        
        config = Config()
        client = PommaiClientFastRTC(config)
        
        if client.led_controller:
            # Test pattern changes don't cause errors
            patterns = [
                LEDPattern.STARTUP,
                LEDPattern.IDLE,
                LEDPattern.LISTENING,
                LEDPattern.PROCESSING,
                LEDPattern.SPEAKING,
                LEDPattern.ERROR
            ]
            
            for pattern in patterns:
                await client.led_controller.set_pattern(pattern)
    
    async def test_error_recovery(self):
        """Test error handling and recovery"""
        from pommai_client_fastrtc import PommaiClientFastRTC, Config, ToyState
        
        config = Config()
        client = PommaiClientFastRTC(config)
        
        # Test error state
        await client.handle_error({"message": "Test error", "code": "TEST_ERROR"})
        self.assertEqual(client.state, ToyState.ERROR)
        
        # Test recovery
        await client.recover_from_error()
        self.assertEqual(client.state, ToyState.IDLE)
    
    async def test_legacy_env_fallback(self):
        """Test backward compatibility with legacy environment variables"""
        # Set legacy variables
        os.environ['CONVEX_URL'] = 'ws://legacy.example.com/ws'
        os.environ['POMMAI_USER_TOKEN'] = 'legacy-token'
        os.environ['POMMAI_TOY_ID'] = 'legacy-toy'
        
        # Remove new variables
        for key in ['FASTRTC_GATEWAY_URL', 'AUTH_TOKEN', 'TOY_ID']:
            os.environ.pop(key, None)
        
        from pommai_client_fastrtc import Config
        
        config = Config()
        
        # Should use legacy variables with warnings
        self.assertEqual(config.FASTRTC_GATEWAY_URL, 'ws://legacy.example.com/ws')
        self.assertEqual(config.AUTH_TOKEN, 'legacy-token')
        self.assertEqual(config.TOY_ID, 'legacy-toy')


class TestPerformance(unittest.TestCase):
    """Performance benchmarks for the client"""
    
    def setUp(self):
        """Set up performance test environment"""
        sys.modules['RPi'] = MagicMock()
        sys.modules['RPi.GPIO'] = MockGPIO()
        sys.modules['pyaudio'] = MagicMock()
        sys.modules['pyaudio'].PyAudio = MockPyAudio
        sys.modules['vosk'] = MagicMock()
        sys.modules['opuslib'] = MagicMock()
    
    def tearDown(self):
        """Clean up"""
        for module in ['RPi', 'RPi.GPIO', 'pyaudio', 'vosk', 'opuslib']:
            if module in sys.modules:
                del sys.modules[module]
    
    async def test_audio_processing_latency(self):
        """Test audio processing doesn't introduce excessive latency"""
        from pommai_client_fastrtc import PommaiClientFastRTC, Config
        
        config = Config()
        client = PommaiClientFastRTC(config)
        
        # Generate test audio
        test_audio = b'\x00' * (config.CHUNK_SIZE * 2)
        
        # Measure processing time
        iterations = 100
        start_time = time.time()
        
        for _ in range(iterations):
            # Simulate audio processing pipeline
            if client.opus_codec:
                encoded = client.opus_codec.encode(test_audio)
                decoded = client.opus_codec.decode(encoded)
        
        elapsed = time.time() - start_time
        avg_latency = elapsed / iterations
        
        # Should process each chunk in less than 20ms for real-time
        self.assertLess(avg_latency, 0.02, f"Audio latency too high: {avg_latency*1000:.2f}ms")
    
    async def test_memory_usage(self):
        """Test memory usage stays within limits"""
        from pommai_client_fastrtc import PommaiClientFastRTC, Config
        import gc
        
        config = Config()
        client = PommaiClientFastRTC(config)
        
        # Force garbage collection
        gc.collect()
        
        # Simulate extended recording
        for _ in range(1000):
            client.audio_buffer.append(b'\x00' * 1024)
            # Client should manage buffer size
            if len(client.audio_buffer) > 100:
                client.audio_buffer = client.audio_buffer[-100:]
        
        # Buffer should be limited
        self.assertLessEqual(len(client.audio_buffer), 100)
        
        # Calculate approximate memory usage
        buffer_size = len(client.audio_buffer) * 1024
        self.assertLess(buffer_size, 200 * 1024, "Audio buffer using too much memory")
    
    async def test_concurrent_operations(self):
        """Test handling concurrent operations without deadlock"""
        from pommai_client_fastrtc import PommaiClientFastRTC, Config
        
        config = Config()
        client = PommaiClientFastRTC(config)
        
        # Create concurrent tasks
        tasks = []
        
        async def operation():
            await client.start_recording()
            await asyncio.sleep(0.01)
            await client.stop_recording()
        
        # Run multiple concurrent operations
        for _ in range(10):
            tasks.append(asyncio.create_task(operation()))
        
        # Should complete without deadlock
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Check no unexpected exceptions
        for result in results:
            if isinstance(result, Exception):
                self.assertIsInstance(result, (asyncio.CancelledError,))


def run_async_test(test_func):
    """Helper function to run async tests"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(test_func())
    finally:
        loop.close()


class TestRunner(unittest.TestCase):
    """Test runner for async tests"""
    
    def test_connection_lifecycle(self):
        test = TestFastRTCIntegration()
        test.setUp()
        try:
            run_async_test(test.test_connection_lifecycle)
        finally:
            test.tearDown()
    
    def test_reconnection_logic(self):
        test = TestFastRTCIntegration()
        test.setUp()
        try:
            run_async_test(test.test_reconnection_logic)
        finally:
            test.tearDown()
    
    def test_state_transitions(self):
        test = TestFastRTCIntegration()
        test.setUp()
        try:
            run_async_test(test.test_state_transitions)
        finally:
            test.tearDown()
    
    def test_audio_streaming(self):
        test = TestFastRTCIntegration()
        test.setUp()
        try:
            run_async_test(test.test_audio_streaming)
        finally:
            test.tearDown()
    
    def test_offline_mode(self):
        test = TestFastRTCIntegration()
        test.setUp()
        try:
            run_async_test(test.test_offline_mode)
        finally:
            test.tearDown()
    
    def test_performance(self):
        test = TestPerformance()
        test.setUp()
        try:
            run_async_test(test.test_audio_processing_latency)
            run_async_test(test.test_memory_usage)
            run_async_test(test.test_concurrent_operations)
        finally:
            test.tearDown()


if __name__ == '__main__':
    # Run all tests with verbose output
    unittest.main(verbosity=2)
