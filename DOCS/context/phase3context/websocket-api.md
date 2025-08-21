# WebSocket API Protocol Documentation for Pommai Raspberry Pi Client

## Overview
This document details the WebSocket protocol for communication between the Raspberry Pi client and the Convex cloud backend. The protocol supports real-time audio streaming, toy configuration management, and Guardian mode enforcement.

## Connection Establishment

### WebSocket URL
```
wss://your-app.convex.site/audio-stream
```

### Authentication Headers
```python
headers = {
    'Authorization': f'Bearer {USER_TOKEN}',
    'X-Device-ID': DEVICE_ID,
    'X-Device-Type': 'raspberry-pi-zero-2w',
    'X-Toy-ID': TOY_ID  # Selected toy for this session
}
```

### Initial Handshake
Upon connection, the client must send a handshake message:
```json
{
    "type": "handshake",
    "deviceId": "device-001",
    "toyId": "toy-abc123",
    "capabilities": {
        "audio": true,
        "wake_word": true,
        "offline_mode": true,
        "toy_switching": true,
        "guardian_mode": false
    }
}
```

## Message Types

### 1. Audio Streaming Messages

#### Audio Chunk (Client → Server)
```json
{
    "type": "audio_chunk",
    "data": "hex_encoded_audio_data",
    "metadata": {
        "timestamp": "2024-01-01T12:00:00.000Z",
        "sequence": 0,
        "is_final": false,
        "compression": "opus",
        "sample_rate": 16000,
        "channels": 1
    }
}
```

#### Audio Response Stream (Server → Client)
```json
{
    "type": "audio_response",
    "chunks": [
        {
            "data": "hex_encoded_audio",
            "sequence": 0,
            "is_final": false,
            "compressed": true
        }
    ],
    "transcript": "Hello! How can I help you today?",
    "emotion": "happy"
}
```

### 2. Toy Configuration Messages

#### Get Toy Configuration (Client → Server)
```json
{
    "type": "get_toy_config",
    "toyId": "toy-abc123"
}
```

#### Toy Configuration Response (Server → Client)
```json
{
    "type": "toy_config",
    "config": {
        "toyId": "toy-abc123",
        "name": "Teddy Bear",
        "personality_prompt": "You are a friendly teddy bear...",
        "voice_settings": {
            "voice_id": "voice-123",
            "speed": 1.0,
            "pitch": 1.0
        },
        "is_for_kids": true,
        "safety_level": "strict",
        "wake_word": "hey teddy",
        "knowledge_base": ["facts about bears", "bedtime stories"],
        "guardian_settings": {
            "content_filter_level": 4,
            "allowed_topics": ["animals", "nature", "stories"],
            "blocked_topics": ["violence", "scary content"]
        }
    }
}
```

#### Switch Toy Command (Server → Client)
```json
{
    "type": "switch_toy",
    "toyId": "toy-xyz789",
    "reason": "user_request"
}
```

### 3. Guardian Mode Messages

#### Guardian Alert (Client → Server)
```json
{
    "type": "guardian_alert",
    "severity": "medium",
    "reason": "inappropriate_content",
    "transcript": "User said: [content]",
    "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Safety Override (Server → Client)
```json
{
    "type": "safety_override",
    "action": "pause_interaction",
    "duration": 300,
    "message": "Let's take a break!"
}
```

### 4. Connection Management

#### Heartbeat/Ping (Client ↔ Server)
```json
{
    "type": "ping",
    "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Heartbeat/Pong Response
```json
{
    "type": "pong",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "server_time": "2024-01-01T12:00:00.000Z"
}
```

#### Error Messages
```json
{
    "type": "error",
    "code": "AUTH_FAILED",
    "message": "Invalid authentication token",
    "details": {
        "retry_after": 60
    }
}
```

### 5. Conversation Management

#### Save Conversation (Client → Server)
```json
{
    "type": "save_conversation",
    "conversation": {
        "user_input": "Tell me a story",
        "toy_response": "Once upon a time...",
        "timestamp": "2024-01-01T12:00:00.000Z",
        "was_offline": false,
        "toy_id": "toy-abc123"
    }
}
```

#### Sync Offline Conversations (Client → Server)
```json
{
    "type": "sync_offline_conversations",
    "conversations": [
        {
            "id": "local-123",
            "user_input": "Hello",
            "toy_response": "Hi there!",
            "timestamp": "2024-01-01T11:00:00.000Z",
            "was_offline": true
        }
    ]
}
```

## Connection States

### State Machine
```
DISCONNECTED → CONNECTING → CONNECTED → AUTHENTICATED → READY
                    ↓            ↓            ↓           ↓
               DISCONNECTED ← ERROR ←────────┴───────────┘
```

### Reconnection Strategy
- Initial retry delay: 1 second
- Exponential backoff: 2x multiplier
- Maximum retry delay: 60 seconds
- Maximum attempts: 10

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| AUTH_FAILED | Authentication failed | Re-authenticate |
| TOY_NOT_FOUND | Toy ID not found | Load default toy |
| RATE_LIMITED | Too many requests | Back off and retry |
| AUDIO_ERROR | Audio processing failed | Retry or fallback |
| SAFETY_VIOLATION | Content safety triggered | Use safe response |

## Security Considerations

1. **Token Rotation**: Tokens should be rotated every 24 hours
2. **Device Authentication**: Each device has a unique key
3. **TLS Required**: All connections must use WSS (not WS)
4. **Rate Limiting**: 100 messages per minute per device
5. **Payload Size**: Maximum 1MB per message

## Python Implementation Example

```python
import asyncio
import websockets
import json
from datetime import datetime

class ConvexWebSocketClient:
    def __init__(self, url, token, device_id, toy_id):
        self.url = url
        self.token = token
        self.device_id = device_id
        self.toy_id = toy_id
        self.websocket = None
        
    async def connect(self):
        headers = {
            'Authorization': f'Bearer {self.token}',
            'X-Device-ID': self.device_id,
            'X-Device-Type': 'raspberry-pi-zero-2w',
            'X-Toy-ID': self.toy_id
        }
        
        self.websocket = await websockets.connect(
            self.url,
            extra_headers=headers,
            ping_interval=20,
            ping_timeout=10
        )
        
        # Send handshake
        await self.send_handshake()
        
    async def send_handshake(self):
        handshake = {
            'type': 'handshake',
            'deviceId': self.device_id,
            'toyId': self.toy_id,
            'capabilities': {
                'audio': True,
                'wake_word': True,
                'offline_mode': True,
                'toy_switching': True,
                'guardian_mode': False
            }
        }
        await self.websocket.send(json.dumps(handshake))
        
    async def send_audio_chunk(self, audio_data, sequence, is_final=False):
        message = {
            'type': 'audio_chunk',
            'data': audio_data.hex(),
            'metadata': {
                'timestamp': datetime.utcnow().isoformat(),
                'sequence': sequence,
                'is_final': is_final,
                'compression': 'opus',
                'sample_rate': 16000,
                'channels': 1
            }
        }
        await self.websocket.send(json.dumps(message))
```

## Testing Endpoints

For development and testing:
- `wss://dev.pommai.convex.site/audio-stream` - Development
- `wss://staging.pommai.convex.site/audio-stream` - Staging
- `wss://pommai.convex.site/audio-stream` - Production
