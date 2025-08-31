# Phase 4 Architecture Analysis: FastRTC + Convex Integration

## Overview
Phase 4 focuses on building a real-time, low-latency voice communication system for the Pommai AI toy platform. This analysis explains how all components work together to achieve < 2s end-to-end latency while maintaining safety and reliability.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Pommai Cloud Platform                     │
│                   (Vercel + Convex Backend)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            FastRTC Gateway Server (FastAPI)            │ │
│  │                                                        │ │
│  │  • WebSocket endpoint for real-time audio streaming    │ │
│  │  • Handles audio encoding/decoding (mu-law/opus)       │ │
│  │  • Manages connection state and session management     │ │
│  │  • Integrates with AI service pipeline                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↕                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              AI Service Pipeline                        │ │
│  │                                                        │ │
│  │  STT (Whisper) → Safety Filter → LLM → TTS (11Labs)   │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↕                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Convex Real-time Database                 │ │
│  │                                                        │ │
│  │  • Toy configurations and personalities                │ │
│  │  • Conversation history and transcripts                │ │
│  │  • RAG vector embeddings for knowledge base            │ │
│  │  • Parent monitoring data (Guardian Mode)              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                          │ WebSocket
                          │ (Persistent Connection)
                          │
┌──────────────────────────┴───────────────────────────────────┐
│              Raspberry Pi Zero 2W Client                      │
│                     (Python Application)                      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  • WebSocket client for bi-directional audio streaming       │
│  • Audio capture and playback (PyAudio)                      │
│  • Push-to-talk button handling (GPIO)                       │
│  • LED state management for user feedback                    │
│  • Local caching for offline responses (SQLite)              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Component Deep Dive

### 1. FastRTC Gateway Server

**Purpose**: Acts as the real-time communication bridge between hardware clients and AI services.

**Key Features**:
- **WebSocket Protocol**: Persistent, low-latency connection for audio streaming
- **Audio Codec Support**: Mu-law and Opus for efficient compression
- **Stream Processing**: Handles chunked audio data for minimal buffering
- **Session Management**: Tracks unique client connections and state

**Implementation Pattern**:
```python
from fastrtc import Stream, ReplyOnPause
from fastapi import FastAPI

class ToyStreamHandler(AsyncStreamHandler):
    def __init__(self, toy_id: str, convex_client):
        super().__init__(input_sample_rate=24000)
        self.toy_id = toy_id
        self.convex = convex_client
        self.audio_queue = asyncio.Queue()
        
    async def receive(self, frame: tuple[int, np.ndarray]) -> None:
        # Receive audio from client
        await self.audio_queue.put(frame)
        
    async def emit(self) -> None:
        # Process and return audio
        audio_frame = await self.audio_queue.get()
        
        # Pipeline: Audio → STT → Filter → LLM → TTS
        text = await self.stt_service.transcribe(audio_frame)
        
        if await self.safety_filter.is_safe(text):
            response = await self.llm_service.generate(text)
            audio_response = await self.tts_service.synthesize(response)
            
            # Log to Convex for parent monitoring
            await self.convex.log_conversation(self.toy_id, text, response)
            
            return audio_response
```

### 2. AI Service Pipeline

**Components**:

#### Speech-to-Text (STT)
- **Service**: OpenAI Whisper API
- **Configuration**: Optimized for child speech patterns
- **Language**: Multi-language support with auto-detection
- **Output**: Transcribed text with confidence scores

#### Safety Filter (Guardian Mode)
- **Pre-LLM Filter**: Analyzes child input before AI processing
- **Post-LLM Filter**: Validates AI responses before synthesis
- **Azure AI Content Safety**: Multi-category content moderation
- **Emergency Response**: Immediate parent alerts for concerning content

#### Language Model (LLM)
- **Model**: OpenRouter gpt-oss-120b
- **Context**: 131K token window for conversation history
- **Safety Prompting**: Child-safe system prompts
- **RAG Integration**: Retrieves toy-specific knowledge

#### Text-to-Speech (TTS)
- **Service**: ElevenLabs streaming API
- **Voice Cloning**: Custom voices per toy personality
- **Streaming**: Chunk-based synthesis for low latency
- **Emotion**: Expressive speech with prosody control

### 3. Convex Integration

**Real-time Database Features**:
```typescript
// Convex Schema
export const toys = defineTable({
  name: v.string(),
  personality: v.string(),
  voiceId: v.string(),
  knowledgeBase: v.array(v.string()),
  isForKids: v.boolean(),
  ownerId: v.string(),
  settings: v.object({
    safetyLevel: v.number(),
    responseStyle: v.string(),
    maxConversationLength: v.number(),
  })
});

export const conversations = defineTable({
  toyId: v.id("toys"),
  timestamp: v.number(),
  userInput: v.string(),
  aiResponse: v.string(),
  safetyScore: v.number(),
  flagged: v.boolean(),
});

export const vectorEmbeddings = defineTable({
  toyId: v.id("toys"),
  content: v.string(),
  embedding: v.array(v.float64()),
  metadata: v.object({
    source: v.string(),
    timestamp: v.number(),
  })
});
```

**Python SDK Usage**:
```python
from convex import ConvexClient

class ConvexToyManager:
    def __init__(self):
        self.client = ConvexClient("https://your-app.convex.cloud")
        
    async def get_toy_config(self, toy_id: str):
        return await self.client.query("toys:get", {"id": toy_id})
        
    async def log_conversation(self, toy_id: str, user_input: str, response: str):
        await self.client.mutation("conversations:create", {
            "toyId": toy_id,
            "userInput": user_input,
            "aiResponse": response,
            "timestamp": time.time()
        })
        
    async def search_knowledge_base(self, toy_id: str, query: str):
        # Vector similarity search for RAG
        results = await self.client.query("vectors:search", {
            "toyId": toy_id,
            "query": query,
            "limit": 5
        })
        return results
```

### 4. Python Client (Raspberry Pi)

**Architecture**:
```python
import asyncio
import websockets
import pyaudio
import RPi.GPIO as GPIO
from opus import OpusEncoder, OpusDecoder
import sqlite3

class PommaiToyClient:
    def __init__(self, device_id: str, server_url: str):
        self.device_id = device_id
        self.server_url = server_url
        
        # Audio configuration
        self.sample_rate = 24000
        self.chunk_size = 1024
        self.encoder = OpusEncoder(self.sample_rate)
        self.decoder = OpusDecoder(self.sample_rate)
        
        # Hardware setup
        self.setup_gpio()
        self.setup_audio()
        self.setup_cache()
        
    def setup_gpio(self):
        GPIO.setmode(GPIO.BCM)
        self.BUTTON_PIN = 17
        self.LED_RED = 27
        self.LED_GREEN = 22
        self.LED_BLUE = 23
        GPIO.setup(self.BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup([self.LED_RED, self.LED_GREEN, self.LED_BLUE], GPIO.OUT)
        
    def setup_audio(self):
        self.audio = pyaudio.PyAudio()
        self.input_stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=self.sample_rate,
            input=True,
            frames_per_buffer=self.chunk_size
        )
        self.output_stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=self.sample_rate,
            output=True,
            frames_per_buffer=self.chunk_size
        )
        
    async def connect_to_server(self):
        self.ws = await websockets.connect(
            f"{self.server_url}/websocket/offer",
            ping_interval=20,
            ping_timeout=10
        )
        
        # Send initial handshake
        await self.ws.send(json.dumps({
            "event": "start",
            "websocket_id": self.device_id,
            "toy_id": self.current_toy_id
        }))
        
    async def stream_audio_loop(self):
        while True:
            if GPIO.input(self.BUTTON_PIN) == GPIO.LOW:
                # Button pressed - start recording
                self.set_led_color("blue")  # Recording indicator
                
                audio_chunks = []
                while GPIO.input(self.BUTTON_PIN) == GPIO.LOW:
                    chunk = self.input_stream.read(self.chunk_size, exception_on_overflow=False)
                    audio_chunks.append(chunk)
                    
                    # Compress and send audio
                    compressed = self.encoder.encode(chunk)
                    encoded = base64.b64encode(compressed).decode()
                    
                    await self.ws.send(json.dumps({
                        "event": "media",
                        "media": {"payload": encoded}
                    }))
                    
                self.set_led_color("green")  # Processing indicator
                
            # Check for incoming audio
            try:
                message = await asyncio.wait_for(self.ws.recv(), timeout=0.1)
                data = json.loads(message)
                
                if data.get("event") == "media":
                    # Decode and play audio
                    audio_data = base64.b64decode(data["media"]["payload"])
                    decoded = self.decoder.decode(audio_data)
                    self.output_stream.write(decoded)
                    
            except asyncio.TimeoutError:
                pass
                
    def set_led_color(self, color: str):
        colors = {
            "off": (0, 0, 0),
            "red": (1, 0, 0),
            "green": (0, 1, 0),
            "blue": (0, 0, 1),
            "purple": (1, 0, 1),
            "yellow": (1, 1, 0)
        }
        r, g, b = colors.get(color, (0, 0, 0))
        GPIO.output(self.LED_RED, r)
        GPIO.output(self.LED_GREEN, g)
        GPIO.output(self.LED_BLUE, b)
```

## Data Flow Sequence

### Complete Interaction Flow:

1. **User Activation** (0ms)
   - Child presses push-to-talk button
   - LED turns blue (recording indicator)
   - Client starts audio capture

2. **Audio Streaming** (10-50ms)
   - Audio chunks compressed with Opus codec
   - Streamed via WebSocket to FastRTC server
   - Minimal buffering for low latency

3. **Speech Recognition** (200-400ms)
   - FastRTC server accumulates audio chunks
   - Sends to Whisper API for transcription
   - Returns text with confidence score

4. **Safety Filtering** (50-100ms)
   - Pre-LLM content moderation check
   - Azure AI Content Safety API call
   - Blocks inappropriate content

5. **LLM Processing** (500-800ms)
   - Retrieve toy personality from Convex
   - RAG search for relevant knowledge
   - Generate response with gpt-oss-120b
   - Stream response tokens as available

6. **Text-to-Speech** (300-500ms)
   - Stream text to ElevenLabs API
   - Receive audio chunks progressively
   - Start playback before complete synthesis

7. **Audio Playback** (immediate)
   - Decode Opus audio chunks
   - Queue for smooth playback
   - LED turns green (speaking indicator)

8. **Logging & Monitoring** (async)
   - Log conversation to Convex database
   - Update parent dashboard in real-time
   - Store metrics for analytics

**Total Latency**: 1.5-2.5 seconds (optimized with streaming)

## Optimization Strategies

### 1. Streaming Architecture
- **Chunked Processing**: Don't wait for complete audio/text
- **Progressive Synthesis**: Start TTS before LLM completes
- **Audio Buffering**: Smart queue management for smooth playback

### 2. Caching Strategy
```python
class ResponseCache:
    def __init__(self):
        self.cache = {}
        self.common_responses = {
            "hello": "Hi there! How are you today?",
            "how are you": "I'm having a wonderful day!",
            "goodbye": "See you later, friend!"
        }
        
    async def get_cached_response(self, input_text: str):
        # Check exact matches first
        if input_text.lower() in self.common_responses:
            return self.common_responses[input_text.lower()]
            
        # Check semantic similarity cache
        if input_text in self.cache:
            return self.cache[input_text]
            
        return None
```

### 3. Speculative Processing
```python
async def handle_interaction(self, audio_input):
    # Start speculative TTS for common intros
    speculative_task = asyncio.create_task(
        self.tts_service.synthesize("That's a great question! ")
    )
    
    # Process actual request
    transcript = await self.stt_service.transcribe(audio_input)
    response = await self.llm_service.generate(transcript)
    
    # Merge or discard speculative audio
    if response.startswith("That's a great question"):
        speculative_audio = await speculative_task
        remaining_audio = await self.tts_service.synthesize(response[24:])
        return speculative_audio + remaining_audio
    else:
        speculative_task.cancel()
        return await self.tts_service.synthesize(response)
```

### 4. Connection Management
- **Persistent WebSocket**: Avoid connection overhead
- **Connection Pooling**: Reuse AI service connections
- **Heartbeat/Ping**: Maintain connection health
- **Auto-reconnect**: Handle network interruptions

## Safety Architecture (Guardian Mode)

### Multi-Layer Protection:

```python
class GuardianSafetySystem:
    def __init__(self):
        self.filters = [
            InputSafetyFilter(),      # Pre-LLM filtering
            OutputSafetyFilter(),      # Post-LLM filtering
            EmergencyResponseFilter()  # Critical content blocking
        ]
        
    async def process_safely(self, input_text: str, toy_config: dict):
        # Layer 1: Input filtering
        if not await self.filters[0].is_safe(input_text):
            await self.alert_parent(input_text, "Input blocked")
            return "Let's talk about something else!"
            
        # Generate response with safety prompt
        response = await self.generate_with_safety(input_text, toy_config)
        
        # Layer 2: Output filtering
        if not await self.filters[1].is_safe(response):
            await self.alert_parent(response, "Output blocked")
            return "How about we play a different game?"
            
        # Layer 3: Emergency check
        if await self.filters[2].is_critical(response):
            await self.emergency_shutdown()
            return None
            
        return response
```

### Parent Monitoring Dashboard:
- Real-time conversation transcripts
- Safety score visualization
- Usage patterns and analytics
- Remote control capabilities
- Alert notifications

## Performance Metrics

### Target Specifications:
- **End-to-end Latency**: < 2 seconds
- **Audio Quality**: 24kHz sampling rate
- **Compression Ratio**: 10:1 with Opus codec
- **Memory Usage**: < 100MB on Pi Zero 2W
- **Network Bandwidth**: < 50kbps per stream
- **Uptime**: 99.9% availability

### Monitoring & Telemetry:
```python
class PerformanceMonitor:
    def __init__(self):
        self.metrics = {
            "latency": [],
            "memory_usage": [],
            "network_bandwidth": [],
            "error_rate": 0
        }
        
    async def track_interaction(self, start_time: float):
        latency = time.time() - start_time
        self.metrics["latency"].append(latency)
        
        # Send to analytics
        await self.send_to_posthog({
            "event": "interaction_complete",
            "latency_ms": latency * 1000,
            "memory_mb": psutil.Process().memory_info().rss / 1024 / 1024,
            "timestamp": time.time()
        })
```

## Error Handling & Recovery

### Graceful Degradation:
1. **Network Failure**: Fall back to cached responses
2. **Service Timeout**: Use simpler LLM or pre-recorded audio
3. **Safety Block**: Redirect to safe conversation topics
4. **Hardware Issues**: Visual/audio feedback for troubleshooting

### Recovery Strategies:
```python
class ErrorRecovery:
    async def with_fallback(self, primary_fn, fallback_fn, timeout=5):
        try:
            return await asyncio.wait_for(primary_fn(), timeout=timeout)
        except (asyncio.TimeoutError, Exception) as e:
            logger.error(f"Primary function failed: {e}")
            return await fallback_fn()
            
    async def get_response_with_fallback(self, input_text):
        return await self.with_fallback(
            lambda: self.llm_service.generate(input_text),
            lambda: self.get_cached_or_simple_response(input_text)
        )
```

## Deployment Considerations

### Server Requirements:
- **FastAPI Server**: Deploy on Vercel/Railway
- **WebSocket Support**: Ensure provider supports persistent connections
- **Auto-scaling**: Handle multiple concurrent connections
- **Geographic Distribution**: Deploy close to users for low latency

### Client Configuration:
- **Device Provisioning**: Unique device IDs and API keys
- **OTA Updates**: Remote configuration updates
- **Logging**: Local buffering with periodic sync
- **Security**: Encrypted storage of credentials

## Summary

Phase 4's architecture successfully integrates:
1. **FastRTC** for real-time audio streaming
2. **Convex** for data persistence and real-time sync
3. **AI Services** for intelligent conversation
4. **Safety Systems** for child protection
5. **Hardware Integration** for physical toy interaction

The system achieves < 2s latency through:
- Streaming architecture at every layer
- Smart caching and speculation
- Optimized audio codecs
- Persistent connections
- Parallel processing where possible

This architecture provides a scalable, safe, and responsive platform for AI-powered toys while maintaining strict safety standards for children's interactions.
