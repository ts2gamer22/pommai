#!/usr/bin/env python3
"""
Test suite for FastRTC connection and audio streaming
Tests the new FastRTC connection handler and simplified client
"""

import pytest
import asyncio
import json
import time
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import sys
import os

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from fastrtc_connection import FastRTCConnection, FastRTCConfig, ConnectionState


class TestFastRTCConnection:
    """Test cases for FastRTC connection handler"""
    
    @pytest.fixture
    def config(self):
        """Create test configuration"""
        return FastRTCConfig(
            gateway_url="ws://localhost:8080/ws",
            device_id="test-device",
            toy_id="test-toy",
            auth_token="test-token",
            reconnect_attempts=3,
            reconnect_delay=0.5
        )
    
    @pytest.fixture
    def connection(self, config):
        """Create test connection instance"""
        return FastRTCConnection(config)
    
    @pytest.mark.asyncio
    async def test_connection_initialization(self, connection):
        """Test connection initialization"""
        assert connection.state == ConnectionState.DISCONNECTED
        assert connection.ws is None
        assert connection.reconnect_count == 0
        assert not connection.is_connected()
    
    @pytest.mark.asyncio
    async def test_successful_connection(self, connection):
        """Test successful connection to gateway"""
        with patch('websockets.connect') as mock_connect:
            # Mock successful WebSocket connection
            mock_ws = AsyncMock()
            mock_ws.closed = False
            mock_connect.return_value = mock_ws
            
            # Connect
            result = await connection.connect()
            
            assert result == True
            assert connection.state == ConnectionState.CONNECTED
            assert connection.is_connected()
            assert connection.ws == mock_ws
            
            # Verify handshake was sent
            mock_ws.send.assert_called()
            sent_data = json.loads(mock_ws.send.call_args[0][0])
            assert sent_data['type'] == 'handshake'
            assert sent_data['deviceId'] == 'test-device'
            assert sent_data['toyId'] == 'test-toy'
    
    @pytest.mark.asyncio
    async def test_connection_failure_with_retry(self, connection):
        """Test connection failure and retry logic"""
        with patch('websockets.connect') as mock_connect:
            # Mock connection failures
            mock_connect.side_effect = [
                Exception("Connection failed"),
                Exception("Connection failed"),
                AsyncMock()  # Success on third attempt
            ]
            
            # Connect (should retry)
            with patch('asyncio.sleep', return_value=None):  # Speed up test
                result = await connection.connect()
            
            assert result == True
            assert connection.reconnect_count == 0  # Reset after success
            assert mock_connect.call_count == 3
    
    @pytest.mark.asyncio
    async def test_send_audio_chunk(self, connection):
        """Test sending audio chunk"""
        # Setup mock connection
        connection.state = ConnectionState.CONNECTED
        connection.ws = AsyncMock()
        connection.ws.closed = False
        
        # Send audio chunk
        audio_data = b"test audio data"
        result = await connection.send_audio_chunk(audio_data, is_final=False)
        
        assert result == True
        
        # Verify message was sent
        connection.ws.send.assert_called_once()
        sent_data = json.loads(connection.ws.send.call_args[0][0])
        
        assert sent_data['type'] == 'audio_chunk'
        assert sent_data['payload']['data'] == audio_data.hex()
        assert sent_data['payload']['metadata']['isFinal'] == False
        assert sent_data['payload']['metadata']['format'] == 'opus'
    
    @pytest.mark.asyncio
    async def test_send_audio_when_disconnected(self, connection):
        """Test sending audio when not connected"""
        connection.state = ConnectionState.DISCONNECTED
        
        audio_data = b"test audio data"
        result = await connection.send_audio_chunk(audio_data)
        
        assert result == False
    
    @pytest.mark.asyncio
    async def test_message_handling(self, connection):
        """Test message handler registration and execution"""
        # Register a test handler
        handler_called = False
        test_data = None
        
        async def test_handler(message):
            nonlocal handler_called, test_data
            handler_called = True
            test_data = message
        
        connection.on_message("test_type", test_handler)
        
        # Simulate receiving a message
        test_message = {
            'type': 'test_type',
            'data': 'test_data'
        }
        
        await connection._handle_message(test_message)
        
        assert handler_called
        assert test_data == test_message
    
    @pytest.mark.asyncio
    async def test_audio_response_handling(self, connection):
        """Test handling of audio response messages"""
        # Simulate audio response
        audio_message = {
            'type': 'audio_response',
            'payload': {
                'data': 'deadbeef',  # Hex encoded audio
                'metadata': {
                    'format': 'opus',
                    'duration': 1.5
                }
            }
        }
        
        await connection._handle_audio_response(audio_message)
        
        # Check audio was added to queue
        assert connection.audio_queue.qsize() == 1
        
        # Get audio from queue
        audio_chunk = await connection.get_audio_chunk()
        assert audio_chunk is not None
        assert audio_chunk['data'] == bytes.fromhex('deadbeef')
        assert audio_chunk['metadata']['format'] == 'opus'
    
    @pytest.mark.asyncio
    async def test_heartbeat_mechanism(self, connection):
        """Test heartbeat sending"""
        connection.state = ConnectionState.CONNECTED
        connection.ws = AsyncMock()
        connection.ws.closed = False
        
        # Start heartbeat with short interval for testing
        heartbeat_task = asyncio.create_task(connection._heartbeat_loop())
        
        # Wait briefly
        await asyncio.sleep(0.1)
        
        # Cancel heartbeat
        heartbeat_task.cancel()
        
        # Heartbeat should not have fired yet (30s interval)
        connection.ws.send.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_reconnection_logic(self, connection):
        """Test automatic reconnection"""
        connection.state = ConnectionState.CONNECTED
        connection.reconnect_count = 0
        
        with patch.object(connection, 'connect', new_callable=AsyncMock) as mock_connect:
            mock_connect.return_value = True
            
            with patch('asyncio.sleep', return_value=None):
                await connection._reconnect()
            
            assert mock_connect.called
            assert connection.reconnect_count == 1
    
    @pytest.mark.asyncio
    async def test_max_reconnection_attempts(self, config):
        """Test maximum reconnection attempts"""
        config.reconnect_attempts = 2
        connection = FastRTCConnection(config)
        connection.reconnect_count = 3  # Already exceeded max
        
        with patch.object(connection, 'connect', new_callable=AsyncMock) as mock_connect:
            await connection._reconnect()
            
            # Should not attempt to connect
            mock_connect.assert_not_called()
            assert connection.state == ConnectionState.FAILED
    
    @pytest.mark.asyncio
    async def test_disconnect(self, connection):
        """Test disconnection cleanup"""
        # Setup connected state
        connection.state = ConnectionState.CONNECTED
        connection.ws = AsyncMock()
        connection.receive_task = AsyncMock()
        connection.heartbeat_task = AsyncMock()
        
        await connection.disconnect()
        
        assert connection.state == ConnectionState.DISCONNECTED
        assert connection.ws is None
        connection.receive_task.cancel.assert_called_once()
        connection.heartbeat_task.cancel.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_connection_stats(self, connection):
        """Test connection statistics"""
        connection.state = ConnectionState.CONNECTED
        connection.reconnect_count = 2
        connection.last_activity = time.time() - 10
        
        stats = connection.get_stats()
        
        assert stats['state'] == 'connected'
        assert stats['reconnect_count'] == 2
        assert stats['connected'] == True
        assert stats['queue_size'] == 0
        assert stats['last_activity'] >= 10


class TestFastRTCIntegration:
    """Integration tests for FastRTC with mock server"""
    
    @pytest.mark.asyncio
    async def test_full_audio_cycle(self):
        """Test complete audio send/receive cycle"""
        config = FastRTCConfig(
            gateway_url="ws://localhost:8080/ws",
            device_id="test-device",
            toy_id="test-toy"
        )
        
        connection = FastRTCConnection(config)
        
        with patch('websockets.connect') as mock_connect:
            # Setup mock WebSocket
            mock_ws = AsyncMock()
            mock_ws.closed = False
            mock_connect.return_value = mock_ws
            
            # Connect
            await connection.connect()
            
            # Send audio
            test_audio = b"test audio data"
            await connection.send_audio_chunk(test_audio, is_final=True)
            
            # Simulate receiving audio response
            response_message = {
                'type': 'audio_response',
                'payload': {
                    'data': 'cafebabe',
                    'metadata': {'format': 'opus'}
                }
            }
            
            await connection._handle_message(response_message)
            
            # Get received audio
            audio_chunk = await connection.get_audio_chunk()
            assert audio_chunk is not None
            assert audio_chunk['data'] == bytes.fromhex('cafebabe')
            
            # Disconnect
            await connection.disconnect()
    
    @pytest.mark.asyncio
    async def test_streaming_mode(self):
        """Test streaming mode operations"""
        config = FastRTCConfig(
            gateway_url="ws://localhost:8080/ws",
            device_id="test-device",
            toy_id="test-toy"
        )
        
        connection = FastRTCConnection(config)
        
        # Setup mock connection
        connection.state = ConnectionState.CONNECTED
        connection.ws = AsyncMock()
        connection.ws.closed = False
        
        # Test audio callback registration
        callback_called = False
        
        async def audio_callback(message):
            nonlocal callback_called
            callback_called = True
        
        # Start streaming with callback
        await connection.start_streaming(audio_callback)
        
        # Verify control message sent
        connection.ws.send.assert_called()
        sent_data = json.loads(connection.ws.send.call_args_list[0][0][0])
        assert sent_data['type'] == 'control'
        assert sent_data['command'] == 'start_streaming'
        
        # Simulate audio chunk message
        await connection._handle_message({
            'type': 'audio_chunk',
            'data': 'test'
        })
        
        assert callback_called
        
        # Stop streaming
        await connection.stop_streaming()
        
        # Verify stop message sent
        sent_data = json.loads(connection.ws.send.call_args_list[-1][0][0])
        assert sent_data['type'] == 'control'
        assert sent_data['command'] == 'stop_streaming'


@pytest.mark.asyncio
async def test_standalone_connection():
    """Test standalone connection function"""
    # This would test the test_connection() function in the module
    # In a real environment, you'd need a running FastRTC server
    pass


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
