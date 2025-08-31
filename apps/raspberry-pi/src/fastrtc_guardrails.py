#!/usr/bin/env python3
"""
FastRTC WebSocket Connection with GuardrailsAI Safety Integration
Enhanced connection handler with comprehensive content moderation
"""

import asyncio
import json
import logging
import time
from typing import Optional, Dict, Any, Callable, Tuple
from dataclasses import dataclass
from enum import Enum

import websockets
import numpy as np

# Import safety module
from guardrails_safety import (
    GuardrailsSafetyManager,
    SafetyConfig,
    SafetyLevel,
    FastRTCSafetyMiddleware,
    SafetyResult
)

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
    """Configuration for FastRTC connection with safety"""
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
    # Safety configuration
    age_group: str = "6-8"
    safety_level: SafetyLevel = SafetyLevel.MODERATE
    enable_safety: bool = True
    custom_blocked_words: list = None
    custom_blocked_topics: list = None


class FastRTCConnectionWithSafety:
    """FastRTC WebSocket connection with GuardrailsAI safety integration"""
    
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
        
        # Initialize safety manager if enabled
        self.safety_middleware = None
        if config.enable_safety:
            self._initialize_safety()
        
        # Session info for safety context
        self.session_info = {
            "device_id": config.device_id,
            "toy_id": config.toy_id,
            "age_group": config.age_group,
            "session_id": f"{config.device_id}_{int(time.time())}",
            "start_time": time.time()
        }
        
        # Register default handlers
        self._register_default_handlers()
    
    def _initialize_safety(self):
        """Initialize GuardrailsAI safety manager"""
        safety_config = SafetyConfig(
            level=self.config.safety_level,
            age_group=self.config.age_group,
            block_personal_info=True,
            block_profanity=True,
            block_toxic_content=True,
            block_sensitive_topics=True,
            custom_blocked_words=self.config.custom_blocked_words or [],
            custom_blocked_topics=self.config.custom_blocked_topics or [],
            max_message_length=500 if self.config.age_group == "3-5" else 1000
        )
        
        self.safety_middleware = FastRTCSafetyMiddleware(safety_config)
        logger.info(f"Safety middleware initialized for age group: {self.config.age_group}")
    
    def _register_default_handlers(self):
        """Register default message handlers"""
        self.on_message("pong", self._handle_pong)
        self.on_message("audio_response", self._handle_audio_response)
        self.on_message("text_response", self._handle_text_response)
        self.on_message("error", self._handle_error)
        self.on_message("config_update", self._handle_config_update)
        self.on_message("safety_alert", self._handle_safety_alert)
    
    async def connect(self) -> bool:
        """Connect to FastRTC gateway with safety enabled"""
        if self.state == ConnectionState.CONNECTED:
            logger.warning("Already connected")
            return True
        
        self.state = ConnectionState.CONNECTING
        
        try:
            # Prepare connection headers
            headers = {
                'X-Device-ID': self.config.device_id,
                'X-Toy-ID': self.config.toy_id,
                'X-Safety-Enabled': str(self.config.enable_safety),
                'X-Age-Group': self.config.age_group,
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
            
            # Send handshake with safety info
            await self._send_handshake()
            
            # Start background tasks
            self.receive_task = asyncio.create_task(self._receive_messages())
            self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
            
            self.state = ConnectionState.CONNECTED
            self.reconnect_count = 0
            logger.info("Successfully connected to FastRTC gateway with safety enabled")
            
            return True
            
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            self.state = ConnectionState.FAILED
            
            # Attempt reconnection
            if self.reconnect_count < self.config.reconnect_attempts:
                await self._reconnect()
            
            return False
    
    async def _send_handshake(self):
        """Send initial handshake message with safety configuration"""
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
                'safety': self.config.enable_safety,
                'guardrails': True,  # Indicate GuardrailsAI support
            },
            'safety': {
                'enabled': self.config.enable_safety,
                'level': self.config.safety_level.value if self.config.enable_safety else None,
                'ageGroup': self.config.age_group,
                'framework': 'guardrails-ai',
            },
            'timestamp': time.time()
        }
        
        await self.send_message(handshake)
        logger.debug("Handshake with safety config sent")
    
    async def send_text_message(self, text: str, metadata: Optional[Dict] = None) -> Tuple[bool, str, Optional[str]]:
        """
        Send text message with safety check
        
        Returns:
            Tuple of (is_safe, processed_text, redirect_response)
        """
        if self.state != ConnectionState.CONNECTED:
            logger.warning("Cannot send text: Not connected")
            return False, None, None
        
        # Check safety if enabled
        if self.safety_middleware:
            is_safe, processed_text, redirect = await self.safety_middleware.process_user_input(
                text, 
                {**self.session_info, **(metadata or {})}
            )
            
            if not is_safe:
                logger.warning(f"Unsafe content blocked: {text[:50]}...")
                
                # Send safety redirect response
                if redirect:
                    await self._send_safety_redirect(redirect)
                
                return False, None, redirect
            
            # Use processed text (with PII removed, etc.)
            text = processed_text
        
        # Send safe message
        message = {
            'type': 'text_message',
            'payload': {
                'text': text,
                'metadata': {
                    'timestamp': time.time(),
                    'safety_checked': self.config.enable_safety,
                    **(metadata or {})
                }
            }
        }
        
        await self.send_message(message)
        return True, text, None
    
    async def _handle_text_response(self, message: Dict[str, Any]):
        """Handle text response from server with safety check"""
        payload = message.get('payload', {})
        text = payload.get('text', '')
        
        if self.safety_middleware:
            # Check AI response safety
            is_safe, processed_text = await self.safety_middleware.process_ai_output(
                text,
                self.session_info
            )
            
            if not is_safe:
                logger.warning(f"Unsafe AI response filtered: {text[:50]}...")
                text = processed_text  # Use safe replacement
            else:
                text = processed_text
        
        # Process safe response
        if hasattr(self, 'text_response_callback'):
            await self.text_response_callback(text, payload.get('metadata', {}))
    
    async def send_audio_chunk(self, audio_data: bytes, transcript: Optional[str] = None, 
                              is_final: bool = False, metadata: Optional[Dict] = None) -> bool:
        """Send audio chunk with optional transcript for safety checking"""
        if self.state != ConnectionState.CONNECTED:
            logger.warning("Cannot send audio: Not connected")
            return False
        
        # If transcript is provided, check safety
        if transcript and self.safety_middleware:
            is_safe, processed_transcript, redirect = await self.safety_middleware.process_user_input(
                transcript,
                {**self.session_info, **(metadata or {})}
            )
            
            if not is_safe:
                logger.warning(f"Unsafe audio transcript blocked: {transcript[:50]}...")
                
                # Send safety redirect
                if redirect:
                    await self._send_safety_redirect(redirect)
                
                return False
            
            # Update transcript with processed version
            transcript = processed_transcript
        
        message = {
            'type': 'audio_chunk',
            'payload': {
                'data': audio_data.hex() if isinstance(audio_data, bytes) else audio_data,
                'transcript': transcript,  # Include transcript if available
                'metadata': {
                    'isFinal': is_final,
                    'format': self.config.audio_format,
                    'sampleRate': self.config.sample_rate,
                    'timestamp': time.time(),
                    'safety_checked': bool(transcript and self.safety_middleware),
                    **(metadata or {})
                }
            }
        }
        
        await self.send_message(message)
        return True
    
    async def _send_safety_redirect(self, redirect_text: str):
        """Send safety redirect response to client"""
        message = {
            'type': 'safety_redirect',
            'payload': {
                'text': redirect_text,
                'reason': 'content_filtered',
                'timestamp': time.time()
            }
        }
        
        await self.send_message(message)
        
        # Log safety event
        logger.info(f"Safety redirect sent: {redirect_text[:50]}...")
    
    async def _handle_safety_alert(self, message: Dict[str, Any]):
        """Handle safety alerts from server"""
        payload = message.get('payload', {})
        alert_type = payload.get('type', 'unknown')
        
        logger.warning(f"Safety alert received: {alert_type}")
        
        # Could trigger additional actions like:
        # - Notifying parents
        # - Adjusting safety levels
        # - Logging to monitoring service
        
        if hasattr(self, 'safety_alert_callback'):
            await self.safety_alert_callback(payload)
    
    def on_message(self, msg_type: str, handler: Callable):
        """Register message handler"""
        self.message_handlers[msg_type] = handler
    
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
    
    async def _receive_messages(self):
        """Receive and process messages from server"""
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)
                    msg_type = data.get('type')
                    
                    # Process message through handler
                    if msg_type in self.message_handlers:
                        await self.message_handlers[msg_type](data)
                    else:
                        logger.debug(f"Unhandled message type: {msg_type}")
                    
                    self.last_activity = time.time()
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse message: {e}")
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.warning("WebSocket connection closed")
            await self._handle_connection_error()
    
    async def _heartbeat_loop(self):
        """Send periodic heartbeat messages"""
        while self.state == ConnectionState.CONNECTED:
            try:
                await asyncio.sleep(self.config.ping_interval)
                
                # Send ping with safety stats
                ping_message = {
                    'type': 'ping',
                    'timestamp': time.time(),
                    'safety_stats': await self._get_safety_stats() if self.safety_middleware else None
                }
                
                await self.send_message(ping_message)
                
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
                break
    
    async def _get_safety_stats(self) -> Dict[str, Any]:
        """Get safety statistics for current session"""
        # This would integrate with the safety manager to get stats
        return {
            'session_duration': time.time() - self.session_info['start_time'],
            'safety_checks': 0,  # Would track actual checks
            'blocks': 0,  # Would track blocked messages
            'age_group': self.config.age_group,
            'safety_level': self.config.safety_level.value
        }
    
    async def _handle_pong(self, message: Dict[str, Any]):
        """Handle pong response"""
        logger.debug("Pong received")
    
    async def _handle_audio_response(self, message: Dict[str, Any]):
        """Handle audio response from server"""
        payload = message.get('payload', {})
        audio_data = payload.get('data')
        
        if audio_data:
            # Decode audio data
            audio_bytes = bytes.fromhex(audio_data)
            
            # Add to audio queue
            await self.audio_queue.put(audio_bytes)
            
            # Call audio callback if registered
            if hasattr(self, 'audio_response_callback'):
                await self.audio_response_callback(audio_bytes, payload.get('metadata', {}))
    
    async def _handle_error(self, message: Dict[str, Any]):
        """Handle error message from server"""
        error = message.get('payload', {})
        logger.error(f"Server error: {error}")
        
        # Handle specific error types
        error_type = error.get('type', 'unknown')
        
        if error_type == 'safety_violation':
            # Handle safety violations
            logger.warning(f"Safety violation: {error.get('message')}")
            
            if hasattr(self, 'safety_violation_callback'):
                await self.safety_violation_callback(error)
    
    async def _handle_config_update(self, message: Dict[str, Any]):
        """Handle configuration update from server"""
        config = message.get('payload', {})
        
        # Update safety configuration if provided
        if 'safety' in config:
            safety_config = config['safety']
            
            if safety_config.get('level'):
                self.config.safety_level = SafetyLevel(safety_config['level'])
            
            if safety_config.get('ageGroup'):
                self.config.age_group = safety_config['ageGroup']
            
            # Reinitialize safety with new config
            if self.config.enable_safety:
                self._initialize_safety()
                logger.info(f"Safety configuration updated: {safety_config}")
    
    async def _handle_connection_error(self):
        """Handle connection errors"""
        self.state = ConnectionState.FAILED
        
        # Attempt reconnection
        if self.reconnect_count < self.config.reconnect_attempts:
            await self._reconnect()
    
    async def _reconnect(self):
        """Attempt to reconnect to gateway"""
        self.state = ConnectionState.RECONNECTING
        self.reconnect_count += 1
        
        delay = self.config.reconnect_delay * (2 ** (self.reconnect_count - 1))
        logger.info(f"Reconnecting in {delay}s (attempt {self.reconnect_count}/{self.config.reconnect_attempts})")
        
        await asyncio.sleep(delay)
        await self.connect()
    
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
    
    def set_audio_callback(self, callback: Callable):
        """Set callback for audio responses"""
        self.audio_response_callback = callback
    
    def set_text_callback(self, callback: Callable):
        """Set callback for text responses"""
        self.text_response_callback = callback
    
    def set_safety_alert_callback(self, callback: Callable):
        """Set callback for safety alerts"""
        self.safety_alert_callback = callback
    
    def set_safety_violation_callback(self, callback: Callable):
        """Set callback for safety violations"""
        self.safety_violation_callback = callback


# Example usage
async def main():
    # Configure connection with safety
    config = FastRTCConfig(
        gateway_url="wss://pommai.co/fastrtc",
        device_id="test-device-001",
        toy_id="toy-123",
        age_group="6-8",
        safety_level=SafetyLevel.MODERATE,
        enable_safety=True,
        custom_blocked_words=["homework", "test"],
        custom_blocked_topics=["school stress"]
    )
    
    # Create connection
    connection = FastRTCConnectionWithSafety(config)
    
    # Set callbacks
    async def handle_audio(audio_data: bytes, metadata: Dict):
        print(f"Received audio response: {len(audio_data)} bytes")
    
    async def handle_text(text: str, metadata: Dict):
        print(f"Received text response: {text}")
    
    async def handle_safety_alert(alert: Dict):
        print(f"Safety alert: {alert}")
    
    connection.set_audio_callback(handle_audio)
    connection.set_text_callback(handle_text)
    connection.set_safety_alert_callback(handle_safety_alert)
    
    # Connect
    if await connection.connect():
        print("Connected successfully with safety enabled")
        
        # Test sending messages
        test_messages = [
            "Hello! What's your favorite game?",  # Safe
            "Can you tell me a story about dragons?",  # Safe for most ages
            "My phone number is 555-1234",  # PII - should be blocked
            "I don't like my homework",  # Custom blocked word
        ]
        
        for msg in test_messages:
            print(f"\nSending: {msg}")
            is_safe, processed, redirect = await connection.send_text_message(msg)
            
            if is_safe:
                print(f"Message sent: {processed}")
            else:
                print(f"Message blocked. Redirect: {redirect}")
        
        # Keep connection alive
        await asyncio.sleep(10)
        
        # Disconnect
        await connection.disconnect()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
