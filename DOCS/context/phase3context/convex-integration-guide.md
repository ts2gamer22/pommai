# Convex Integration Guide for Raspberry Pi Client

## Overview
This guide synthesizes the Convex Python client documentation with the Gemini research insights to provide a practical integration strategy for the Pommai Raspberry Pi voice assistant.

## Architecture Overview

### Dual Communication Strategy
The Raspberry Pi client uses two complementary communication channels:

1. **WebSockets** - Real-time bidirectional audio streaming
2. **Convex Client** - Data persistence, file uploads, and configuration

```python
# Global instances to conserve memory
import asyncio
from convex import ConvexClient
import websockets

# Convex client for data operations
convex_client = ConvexClient(CONVEX_URL)

# WebSocket for real-time audio
websocket_uri = "wss://your-app.convex.site/audio-stream"
```

## Authentication Integration

### Device Authentication Flow
```python
async def authenticate_device():
    """Authenticate device and get tokens for both Convex and WebSocket"""
    
    # 1. Get device token from Convex
    device_auth = convex_client.mutation("auth:authenticateDevice", {
        "deviceId": DEVICE_ID,
        "deviceSecret": get_device_secret_from_tpm()  # TPM integration
    })
    
    # 2. Store tokens
    convex_token = device_auth["convexToken"]
    websocket_token = device_auth["websocketToken"]
    
    # 3. Set Convex client auth
    convex_client.set_auth(convex_token)
    
    return websocket_token
```

### WebSocket Connection with Auth
```python
async def connect_websocket(token):
    """Establish authenticated WebSocket connection"""
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Device-ID": DEVICE_ID,
        "X-Device-Type": "raspberry-pi-zero-2w"
    }
    
    async for websocket in websockets.connect(websocket_uri, extra_headers=headers):
        try:
            yield websocket
        except websockets.ConnectionClosed:
            # Automatic reconnection handled by async for loop
            await asyncio.sleep(5)
```

## Audio Pipeline Integration

### Real-time Audio Streaming
```python
import pyaudio
from pyogg import OpusEncoder

class AudioStreamer:
    def __init__(self, websocket, convex_client):
        self.websocket = websocket
        self.convex_client = convex_client
        self.opus_encoder = OpusEncoder()
        self.setup_audio()
        
    def audio_callback(self, in_data, frame_count, time_info, status):
        """PyAudio callback for non-blocking audio capture"""
        # Encode to Opus (research recommends 16-32kbps for voice)
        encoded = self.opus_encoder.encode(in_data)
        
        # Queue for WebSocket transmission
        asyncio.create_task(self.send_audio_chunk(encoded))
        
        return (in_data, pyaudio.paContinue)
    
    async def send_audio_chunk(self, opus_data):
        """Send audio chunk via WebSocket"""
        message = {
            "type": "audio_chunk",
            "data": opus_data.hex(),  # Convert bytes to hex string
            "timestamp": time.time(),
            "sequence": self.sequence
        }
        await self.websocket.send(json.dumps(message))
        self.sequence += 1
```

### Toy Configuration Management
```python
async def load_toy_configuration(toy_id):
    """Load toy configuration from Convex"""
    
    # Query toy configuration
    toy_config = convex_client.query("toys:getConfiguration", {
        "toyId": toy_id,
        "deviceId": DEVICE_ID
    })
    
    # Cache locally in SQLite (tmpfs as per research)
    cache_toy_config(toy_config)
    
    # Update wake word if custom
    if toy_config.get("wakeWord"):
        update_wake_word_model(toy_config["wakeWord"])
    
    return toy_config
```

## File Upload Pattern

### Audio Log Upload
```python
async def upload_conversation_audio(audio_data: bytes, transcript: str):
    """Upload conversation audio to Convex storage"""
    
    try:
        # 1. Generate upload URL
        upload_info = convex_client.mutation("storage:generateUploadUrl")
        
        # 2. Upload Opus-encoded audio
        response = requests.post(
            upload_info["url"],
            headers={
                "Content-Type": "audio/opus",
                "Content-Length": str(len(audio_data))
            },
            data=audio_data
        )
        
        if response.status_code != 200:
            raise Exception(f"Upload failed: {response.status_code}")
        
        # 3. Store metadata in Convex
        storage_id = response.json()["storageId"]
        
        convex_client.mutation("conversations:create", {
            "deviceId": DEVICE_ID,
            "toyId": current_toy_id,
            "audioStorageId": storage_id,
            "transcript": transcript,
            "timestamp": datetime.utcnow().isoformat(),
            "wasOffline": False
        })
        
    except Exception as e:
        # Queue for later sync if upload fails
        queue_for_offline_sync(audio_data, transcript)
```

## Offline Sync Strategy

### SQLite Integration (tmpfs)
```python
import sqlite3

# Database in tmpfs as per research recommendation
DB_PATH = "/tmp/pommai_assistant.db"

def init_offline_cache():
    """Initialize SQLite database in tmpfs"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS offline_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            synced BOOLEAN DEFAULT 0
        )
    ''')
    
    conn.commit()
    conn.close()
```

### Sync Offline Data
```python
async def sync_offline_data():
    """Sync queued data when connection restored"""
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get unsynced items
    cursor.execute(
        "SELECT id, data_type, payload FROM offline_queue WHERE synced = 0"
    )
    
    for row in cursor.fetchall():
        item_id, data_type, payload_json = row
        payload = json.loads(payload_json)
        
        try:
            if data_type == "conversation":
                convex_client.mutation("conversations:create", payload)
            elif data_type == "usage_metrics":
                convex_client.mutation("metrics:record", payload)
            elif data_type == "error_log":
                convex_client.mutation("logs:create", payload)
            
            # Mark as synced
            cursor.execute(
                "UPDATE offline_queue SET synced = 1 WHERE id = ?",
                (item_id,)
            )
            conn.commit()
            
        except Exception as e:
            logging.error(f"Failed to sync item {item_id}: {e}")
            # Will retry on next sync
    
    conn.close()
```

## Guardian Mode Integration

### Safety Event Reporting
```python
async def report_safety_event(event_type: str, details: dict):
    """Report safety events to parent dashboard via Convex"""
    
    event_data = {
        "deviceId": DEVICE_ID,
        "toyId": current_toy_id,
        "eventType": event_type,
        "details": details,
        "timestamp": datetime.utcnow().isoformat(),
        "isUrgent": event_type in ["safety_violation", "emergency_stop"]
    }
    
    try:
        # Try to report immediately
        convex_client.mutation("guardian:reportEvent", event_data)
    except Exception:
        # Queue for later if offline
        queue_safety_event(event_data)
```

## Memory Optimization Strategies

### Connection Pooling
```python
# Single global Convex client instance
convex_client = ConvexClient(CONVEX_URL)

# Reuse HTTP session for file uploads
upload_session = requests.Session()
upload_session.headers.update({
    "User-Agent": f"PommaiDevice/{DEVICE_ID}"
})
```

### Batch Operations
```python
async def batch_sync_metrics():
    """Batch multiple metrics updates to reduce API calls"""
    
    metrics = collect_device_metrics()  # CPU, memory, temperature
    
    # Single mutation instead of multiple calls
    convex_client.mutation("metrics:batchRecord", {
        "deviceId": DEVICE_ID,
        "metrics": metrics,
        "timestamp": datetime.utcnow().isoformat()
    })
```

## Error Handling and Resilience

### Convex Error Handling
```python
import convex

async def safe_convex_call(method, function_name, args=None):
    """Wrapper for resilient Convex calls"""
    
    max_retries = 3
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            if method == "query":
                return convex_client.query(function_name, args or {})
            elif method == "mutation":
                return convex_client.mutation(function_name, args or {})
                
        except convex.ConvexError as e:
            # Application-level error
            if isinstance(e.data, dict) and e.data.get("code") == "DEVICE_NOT_FOUND":
                # Re-authenticate device
                await authenticate_device()
            else:
                logging.error(f"Convex error: {e.data}")
                raise
                
        except Exception as e:
            # Network or other errors
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay * (2 ** attempt))
            else:
                # Queue for offline processing
                queue_for_retry(method, function_name, args)
                raise
```

## Complete Integration Example

```python
class PommaiConvexIntegration:
    def __init__(self):
        self.convex_client = ConvexClient(os.getenv("CONVEX_URL"))
        self.websocket = None
        self.websocket_token = None
        
    async def initialize(self):
        """Initialize Convex and WebSocket connections"""
        # Authenticate device
        self.websocket_token = await self.authenticate_device()
        
        # Start WebSocket connection
        asyncio.create_task(self.maintain_websocket_connection())
        
        # Load toy configuration
        await self.load_toy_configuration()
        
        # Start offline sync task
        asyncio.create_task(self.periodic_offline_sync())
    
    async def maintain_websocket_connection(self):
        """Maintain persistent WebSocket connection"""
        headers = {
            "Authorization": f"Bearer {self.websocket_token}",
            "X-Device-ID": DEVICE_ID
        }
        
        async for websocket in websockets.connect(
            "wss://your-app.convex.site/audio-stream",
            extra_headers=headers
        ):
            self.websocket = websocket
            try:
                await self.handle_websocket_messages()
            except websockets.ConnectionClosed:
                logging.info("WebSocket closed, reconnecting...")
                await asyncio.sleep(5)
    
    async def handle_websocket_messages(self):
        """Process incoming WebSocket messages"""
        async for message in self.websocket:
            data = json.loads(message) if isinstance(message, str) else message
            
            if data["type"] == "audio_response":
                await self.play_audio_response(data)
            elif data["type"] == "toy_config_update":
                await self.update_toy_configuration(data)
            elif data["type"] == "command":
                await self.execute_command(data)
```

## Best Practices

1. **Memory Management**
   - Use single global Convex client instance
   - Implement connection pooling for HTTP requests
   - Batch operations when possible
   - Use SQLite in tmpfs with periodic persistence

2. **Error Handling**
   - Implement retry logic with exponential backoff
   - Queue failed operations for offline sync
   - Distinguish between ConvexError and network errors
   - Log all errors for debugging

3. **Security**
   - Store credentials in TPM when available
   - Rotate authentication tokens periodically
   - Use TLS for all connections
   - Validate all server responses

4. **Performance**
   - Use non-blocking I/O for all operations
   - Implement caching for frequently accessed data
   - Monitor memory usage continuously
   - Profile code with py-spy as recommended

This integration guide provides a robust foundation for connecting the Raspberry Pi client to Convex services while adhering to the memory and performance constraints identified in the research.
