#!/usr/bin/env python3
"""
FastRTC WebSocket Connection Handler for Raspberry Pi
Simplified connection to FastRTC gateway for real-time audio streaming
"""

import asyncio
import json
import logging
import time
from typing import Optional, Dict, Any, Callable
from dataclasses import dataclass
from enum import Enum

import websockets
import numpy as np

# Configure logging
logger = logging.getLogger(__name__)


class ConnectionState(Enum):
    """Connection state enumeration"""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    RECONNECTING = "reconnecting"
    FAILED = "failed"


@dataclass
class FastRTCConfig:
    """Configuration for FastRTC connection"""
    gateway_url: str
    device_id: str
    toy_id: str
    auth_token: Optional[str] = None
    reconnect_attempts: int = 5
    reconnect_delay: float = 2.0
    ping_interval: int = 20
    ping_timeout: int = 10
    audio_format: str = "opus"
    sample_rate: int = 16000


class FastRTCConnection:
    """Simplified WebSocket connection to FastRTC gateway"""
    
    def __init__(self, config: FastRTCConfig):
        self.config = config
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.state = ConnectionState.DISCONNECTED
        self.reconnect_count = 0
        self.message_handlers: Dict[str, Callable] = {}
        self.receive_task: Optional[asyncio.Task] = None
        self.heartbeat_task: Optional[asyncio.Task] = None
        self.audio_queue = asyncio.Queue(maxsize=100)
        self.last_activity = time.time()
        
        # Register default handlers
        self._register_default_handlers()
    
    def _register_default_handlers(self):
        """Register default message handlers"""
        self.on_message("pong", self._handle_pong)
        self.on_message("audio_response", self._handle_audio_response)
        self.on_message("error", self._handle_error)
        self.on_message("config_update", self._handle_config_update)
    
    async def connect(self) -> bool:
        """Connect to FastRTC gateway"""
        if self.state == ConnectionState.CONNECTED:
            logger.warning("Already connected")
            return True
        
        self.state = ConnectionState.CONNECTING
        
        try:
            # Prepare connection headers
            headers = {
                'X-Device-ID': self.config.device_id,
                'X-Toy-ID': self.config.toy_id,
            }
            
            if self.config.auth_token:
                headers['Authorization'] = f'Bearer {self.config.auth_token}'
            
            logger.info(f"Connecting to FastRTC gateway at {self.config.gateway_url}")
            
            # Establish WebSocket connection
            self.ws = await websockets.connect(
                self.config.gateway_url,
                extra_headers=headers,
                ping_interval=self.config.ping_interval,
                ping_timeout=self.config.ping_timeout
            )
            
            # Send handshake
            await self._send_handshake()
            
            # Start background tasks
            self.receive_task = asyncio.create_task(self._receive_messages())
            self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
            
            self.state = ConnectionState.CONNECTED
            self.reconnect_count = 0
            logger.info("Successfully connected to FastRTC gateway")
            
            return True
            
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            self.state = ConnectionState.FAILED
            
            # Attempt reconnection
            if self.reconnect_count < self.config.reconnect_attempts:
                await self._reconnect()
            
            return False
    
    async def disconnect(self):
        """Disconnect from gateway"""
        logger.info("Disconnecting from FastRTC gateway")
        
        # Cancel background tasks
        if self.receive_task:
            self.receive_task.cancel()
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
        
        # Close WebSocket
        if self.ws:
            await self.ws.close()
            self.ws = None
        
        self.state = ConnectionState.DISCONNECTED
    
    async def _send_handshake(self):
        """Send initial handshake message"""
        handshake = {
            'type': 'handshake',
            'deviceId': self.config.device_id,
            'toyId': self.config.toy_id,
            'capabilities': {
                'audio': True,
                'wakeWord': True,
                'offlineMode': True,
                'opus': True,
                'sampleRate': self.config.sample_rate,
            },
            'timestamp': time.time()
        }
        
        await self.send_message(handshake)
        logger.debug("Handshake sent")
    
    async def send_message(self, message: Dict[str, Any]):
        """Send JSON message through WebSocket"""
        if not self.ws or self.ws.closed:
            logger.error("Cannot send message: WebSocket not connected")
            return
        
        try:
            await self.ws.send(json.dumps(message))
            self.last_activity = time.time()
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            await self._handle_connection_error()
    
    async def send_audio_chunk(self, audio_data: bytes, is_final: bool = False, metadata: Optional[Dict] = None):
        """Send audio chunk to gateway"""
        if self.state != ConnectionState.CONNECTED:
            logger.warning("Cannot send audio: Not connected")
            return False
        
        message = {
            'type': 'audio_chunk',
            'payload': {
                'data': audio_data.hex() if isinstance(audio_data, bytes) else audio_data,
                'metadata': {
                    'isFinal': is_final,
                    'format': self.config.audio_format,
                    'sampleRate': self.config.sample_rate,
                    'timestamp': time.time(),
                    **(metadata or {})
                }
            }
        }
        
        await self.send_message(message)
        return True
    
    async def start_streaming(self, audio_callback: Optional[Callable] = None):
        """Start audio streaming mode"""
        message = {
            'type': 'control',
            'command': 'start_streaming',
            'timestamp': time.time()
        }
        
        await self.send_message(message)
        
        if audio_callback:
            self.on_message("audio_chunk", audio_callback)
    
    async def stop_streaming(self):
        """Stop audio streaming mode"""
        message = {
            'type': 'control',
            'command': 'stop_streaming',
            'timestamp': time.time()
        }
        
        await self.send_message(message)
    
    async def _receive_messages(self):
        """Receive and process messages from gateway"""
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)
                    await self._handle_message(data)
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON received: {message[:100]}")
                except Exception as e:
                    logger.error(f"Error handling message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.warning("WebSocket connection closed")
            await self._handle_connection_error()
        except Exception as e:
            logger.error(f"Receive loop error: {e}")
            await self._handle_connection_error()
    
    async def _handle_message(self, message: Dict[str, Any]):
        """Handle received message"""
        msg_type = message.get('type')
        
        if msg_type in self.message_handlers:
            handler = self.message_handlers[msg_type]
            try:
                await handler(message)
            except Exception as e:
                logger.error(f"Handler error for {msg_type}: {e}")
        else:
            logger.debug(f"Unhandled message type: {msg_type}")
        
        self.last_activity = time.time()
    
    async def _heartbeat_loop(self):
        """Send periodic heartbeat messages"""
        while self.state == ConnectionState.CONNECTED:
            try:
                await asyncio.sleep(30)  # Send heartbeat every 30 seconds
                
                if self.state == ConnectionState.CONNECTED:
                    await self.send_message({
                        'type': 'ping',
                        'timestamp': time.time()
                    })
                    
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
    
    async def _handle_connection_error(self):
        """Handle connection errors"""
        if self.state == ConnectionState.CONNECTED:
            self.state = ConnectionState.RECONNECTING
            await self._reconnect()
    
    async def _reconnect(self):
        """Attempt to reconnect to gateway"""
        self.reconnect_count += 1
        
        if self.reconnect_count > self.config.reconnect_attempts:
            logger.error("Max reconnection attempts reached")
            self.state = ConnectionState.FAILED
            return
        
        delay = self.config.reconnect_delay * (2 ** (self.reconnect_count - 1))
        delay = min(delay, 60)  # Cap at 60 seconds
        
        logger.info(f"Reconnecting in {delay:.1f} seconds (attempt {self.reconnect_count}/{self.config.reconnect_attempts})")
        await asyncio.sleep(delay)
        
        # Clean up old connection
        if self.ws:
            await self.ws.close()
            self.ws = None
        
        # Attempt reconnection
        await self.connect()
    
    def on_message(self, msg_type: str, handler: Callable):
        """Register a message handler"""
        self.message_handlers[msg_type] = handler
    
    async def _handle_pong(self, message: Dict):
        """Handle pong response"""
        logger.debug("Pong received")
    
    async def _handle_audio_response(self, message: Dict):
        """Handle audio response from server"""
        payload = message.get('payload', {})
        audio_data = payload.get('data')
        metadata = payload.get('metadata', {})
        
        if audio_data:
            # Convert hex string back to bytes
            audio_bytes = bytes.fromhex(audio_data)
            
            # Add to audio queue for playback
            await self.audio_queue.put({
                'data': audio_bytes,
                'metadata': metadata
            })
            
            logger.debug(f"Received audio chunk: {len(audio_bytes)} bytes")
    
    async def _handle_error(self, message: Dict):
        """Handle error message from server"""
        error = message.get('error', 'Unknown error')
        logger.error(f"Server error: {error}")
    
    async def _handle_config_update(self, message: Dict):
        """Handle configuration update from server"""
        config = message.get('config', {})
        logger.info(f"Configuration update received: {config}")
    
    def is_connected(self) -> bool:
        """Check if connected to gateway"""
        return self.state == ConnectionState.CONNECTED
    
    def get_state(self) -> ConnectionState:
        """Get current connection state"""
        return self.state
    
    async def get_audio_chunk(self, timeout: float = 1.0) -> Optional[Dict]:
        """Get audio chunk from queue"""
        try:
            return await asyncio.wait_for(
                self.audio_queue.get(),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            return None
    
    def get_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        return {
            'state': self.state.value,
            'reconnect_count': self.reconnect_count,
            'last_activity': time.time() - self.last_activity,
            'queue_size': self.audio_queue.qsize(),
            'connected': self.is_connected()
        }


# Convenience function for testing
async def test_connection():
    """Test FastRTC connection"""
    config = FastRTCConfig(
        gateway_url="ws://localhost:8080/ws",
        device_id="test-device",
        toy_id="test-toy"
    )
    
    client = FastRTCConnection(config)
    
    try:
        # Connect
        connected = await client.connect()
        if not connected:
            print("Failed to connect")
            return
        
        print("Connected successfully!")
        
        # Send test audio
        test_audio = b"test audio data"
        await client.send_audio_chunk(test_audio, is_final=True)
        
        # Wait for response
        await asyncio.sleep(2)
        
        # Get stats
        stats = client.get_stats()
        print(f"Stats: {stats}")
        
    finally:
        await client.disconnect()


if __name__ == "__main__":
    # Run test
    asyncio.run(test_connection())
