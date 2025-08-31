# Phase 4 Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing Phase 4: FastRTC + Convex Integration for the Pommai AI toy platform.

## Prerequisites

### Required Accounts & API Keys
- [ ] Convex account (https://convex.dev)
- [ ] OpenRouter API key for gpt-oss-120b
- [ ] OpenAI API key for Whisper STT and embeddings
- [ ] ElevenLabs API key for TTS
- [ ] Azure AI Content Safety API key (for Guardian Mode)
- [ ] Vercel account for deployment

### Development Environment
- [ ] Node.js 18+ and npm/yarn
- [ ] Python 3.9+ with pip
- [ ] Git for version control
- [ ] VS Code or preferred IDE

## Step 1: Setup Convex Backend

### 1.1 Initialize Convex Project
```bash
cd apps/web
npx convex dev
```

### 1.2 Create Convex Schema
Create `convex/schema.ts`:
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  toys: defineTable({
    name: v.string(),
    personality: v.string(),
    voiceId: v.string(),
    voiceSettings: v.object({
      stability: v.number(),
      similarity_boost: v.number(),
      style: v.number(),
      use_speaker_boost: v.boolean(),
    }),
    knowledgeBase: v.array(v.string()),
    isForKids: v.boolean(),
    ownerId: v.string(),
    deviceIds: v.array(v.string()),
    settings: v.object({
      safetyLevel: v.number(),
      responseStyle: v.string(),
      maxConversationLength: v.number(),
      languageModel: v.string(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  conversations: defineTable({
    toyId: v.id("toys"),
    deviceId: v.string(),
    timestamp: v.number(),
    userInput: v.string(),
    aiResponse: v.string(),
    audioUrl: v.optional(v.string()),
    safetyScore: v.number(),
    flagged: v.boolean(),
    parentNotified: v.boolean(),
    metadata: v.object({
      sttConfidence: v.number(),
      llmTokensUsed: v.number(),
      processingTimeMs: v.number(),
    }),
  })
    .index("by_toy", ["toyId"])
    .index("by_timestamp", ["timestamp"])
    .index("flagged_items", ["flagged"]),

  vectorEmbeddings: defineTable({
    toyId: v.id("toys"),
    content: v.string(),
    embedding: v.array(v.float64()),
    metadata: v.object({
      source: v.string(),
      chunkIndex: v.number(),
      timestamp: v.number(),
    }),
  })
    .index("by_toy", ["toyId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
    }),

  devices: defineTable({
    deviceId: v.string(),
    toyId: v.optional(v.id("toys")),
    status: v.string(),
    lastSeen: v.number(),
    metadata: v.object({
      hardwareType: v.string(),
      firmwareVersion: v.string(),
      ipAddress: v.string(),
    }),
  }).index("by_device_id", ["deviceId"]),

  parentAlerts: defineTable({
    toyId: v.id("toys"),
    conversationId: v.id("conversations"),
    alertType: v.string(),
    severity: v.number(),
    message: v.string(),
    timestamp: v.number(),
    acknowledged: v.boolean(),
  })
    .index("by_toy", ["toyId"])
    .index("unacknowledged", ["acknowledged"]),
});
```

### 1.3 Create Convex Functions
Create `convex/toys.ts`:
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export const create = mutation({
  args: {
    name: v.string(),
    personality: v.string(),
    voiceId: v.string(),
    isForKids: v.boolean(),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const toyId = await ctx.db.insert("toys", {
      ...args,
      knowledgeBase: [],
      deviceIds: [],
      voiceSettings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
      settings: {
        safetyLevel: args.isForKids ? 5 : 2,
        responseStyle: "friendly",
        maxConversationLength: 100,
        languageModel: "gpt-oss-120b",
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return toyId;
  },
});

export const get = query({
  args: { id: v.id("toys") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByDevice = query({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const device = await ctx.db
      .query("devices")
      .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!device?.toyId) return null;
    return await ctx.db.get(device.toyId);
  },
});
```

## Step 2: Setup FastRTC Gateway Server

### 2.1 Create FastAPI Server
Create `apps/fastrtc-gateway/main.py`:
```python
import os
import asyncio
import json
import base64
import time
from typing import Optional, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import numpy as np

# FastRTC imports
from fastrtc import Stream, AsyncStreamHandler, wait_for_item

# AI Service imports
import openai
from elevenlabs import generate, stream
from azure.ai.contentsafety import ContentSafetyClient
from azure.core.credentials import AzureKeyCredential

# Convex imports
from convex import ConvexClient

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
convex_client = ConvexClient(os.getenv("CONVEX_URL"))
openai.api_key = os.getenv("OPENAI_API_KEY")
openai.api_base = "https://openrouter.ai/api/v1"
elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
content_safety_client = ContentSafetyClient(
    endpoint=os.getenv("AZURE_CONTENT_SAFETY_ENDPOINT"),
    credential=AzureKeyCredential(os.getenv("AZURE_CONTENT_SAFETY_KEY"))
)

class ToyStreamHandler(AsyncStreamHandler):
    def __init__(self, toy_id: str, device_id: str):
        super().__init__(input_sample_rate=24000, output_sample_rate=24000)
        self.toy_id = toy_id
        self.device_id = device_id
        self.audio_queue = asyncio.Queue()
        self.toy_config = None
        self.conversation_history = []
        
    async def start_up(self):
        # Load toy configuration from Convex
        self.toy_config = await convex_client.query("toys:get", {"id": self.toy_id})
        if not self.toy_config:
            raise ValueError(f"Toy {self.toy_id} not found")
            
        # Load recent conversation history
        recent_convos = await convex_client.query("conversations:getRecent", {
            "toyId": self.toy_id,
            "limit": 10
        })
        self.conversation_history = [
            {"role": "user" if i % 2 == 0 else "assistant", "content": c["userInput"] if i % 2 == 0 else c["aiResponse"]}
            for i, c in enumerate(recent_convos)
        ]
        
    async def receive(self, frame: tuple[int, np.ndarray]) -> None:
        await self.audio_queue.put(frame)
        
    async def emit(self) -> Optional[tuple[int, np.ndarray]]:
        try:
            # Get audio frame from queue
            audio_frame = await wait_for_item(self.audio_queue, timeout=0.1)
            
            # Process through AI pipeline
            result = await self.process_audio_pipeline(audio_frame)
            return result
            
        except asyncio.TimeoutError:
            return None
            
    async def process_audio_pipeline(self, audio_frame: tuple[int, np.ndarray]):
        start_time = time.time()
        sample_rate, audio_data = audio_frame
        
        # Step 1: Speech to Text
        transcript = await self.speech_to_text(audio_data, sample_rate)
        if not transcript:
            return None
            
        # Step 2: Safety Check (Pre-LLM)
        if self.toy_config["isForKids"]:
            is_safe = await self.check_content_safety(transcript, "input")
            if not is_safe:
                await self.alert_parent(transcript, "Inappropriate input detected")
                return await self.generate_safe_redirect()
                
        # Step 3: Generate LLM Response
        response_text = await self.generate_llm_response(transcript)
        
        # Step 4: Safety Check (Post-LLM)
        if self.toy_config["isForKids"]:
            is_safe = await self.check_content_safety(response_text, "output")
            if not is_safe:
                await self.alert_parent(response_text, "Inappropriate output blocked")
                return await self.generate_safe_redirect()
                
        # Step 5: Text to Speech
        audio_response = await self.text_to_speech(response_text)
        
        # Step 6: Log conversation
        processing_time = (time.time() - start_time) * 1000
        await self.log_conversation(transcript, response_text, processing_time)
        
        return audio_response
        
    async def speech_to_text(self, audio_data: np.ndarray, sample_rate: int) -> str:
        # Convert numpy array to WAV format
        import io
        import wave
        
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_data.tobytes())
            
        buffer.seek(0)
        
        # Send to Whisper API
        response = await openai.Audio.atranscribe(
            model="whisper-1",
            file=buffer,
            language="en"
        )
        
        return response.text
        
    async def generate_llm_response(self, user_input: str) -> str:
        # Build messages with personality and history
        messages = [
            {"role": "system", "content": self.toy_config["personality"]},
            *self.conversation_history[-6:],  # Last 3 exchanges
            {"role": "user", "content": user_input}
        ]
        
        # Add safety instructions for kids' toys
        if self.toy_config["isForKids"]:
            messages[0]["content"] += "\n\nSAFETY RULES: You are talking to a child. Never discuss violence, adult topics, or anything inappropriate. Always be positive, educational, and encouraging."
        
        # Generate response
        response = await openai.ChatCompletion.acreate(
            model=self.toy_config["settings"]["languageModel"],
            messages=messages,
            max_tokens=150,
            temperature=0.7,
            stream=True
        )
        
        # Collect streamed response
        full_response = ""
        async for chunk in response:
            if chunk.choices[0].delta.get("content"):
                full_response += chunk.choices[0].delta.content
                
        # Update conversation history
        self.conversation_history.append({"role": "user", "content": user_input})
        self.conversation_history.append({"role": "assistant", "content": full_response})
        
        return full_response
        
    async def text_to_speech(self, text: str) -> tuple[int, np.ndarray]:
        # Generate audio using ElevenLabs
        audio_stream = generate(
            text=text,
            voice=self.toy_config["voiceId"],
            model="eleven_monolingual_v1",
            stream=True,
            api_key=elevenlabs_api_key
        )
        
        # Collect audio chunks
        audio_chunks = []
        for chunk in audio_stream:
            audio_chunks.append(chunk)
            
        # Convert to numpy array
        audio_bytes = b''.join(audio_chunks)
        audio_array = np.frombuffer(audio_bytes, dtype=np.int16)
        
        return (24000, audio_array)
        
    async def check_content_safety(self, text: str, check_type: str) -> bool:
        try:
            response = content_safety_client.analyze_text(
                text=text,
                categories=["Hate", "SelfHarm", "Sexual", "Violence"]
            )
            
            # Check severity levels
            max_severity = max([
                response.hate_result.severity,
                response.self_harm_result.severity,
                response.sexual_result.severity,
                response.violence_result.severity
            ])
            
            # For kids' content, be very strict
            return max_severity <= 2
            
        except Exception as e:
            print(f"Content safety check failed: {e}")
            # Fail safe - block content if check fails
            return False
            
    async def alert_parent(self, content: str, alert_type: str):
        await convex_client.mutation("parentAlerts:create", {
            "toyId": self.toy_id,
            "alertType": alert_type,
            "message": content,
            "severity": 5,
            "timestamp": time.time()
        })
        
    async def generate_safe_redirect(self) -> tuple[int, np.ndarray]:
        safe_responses = [
            "Let's talk about something fun instead! What's your favorite color?",
            "How about we play a different game? I know lots of fun ones!",
            "That's interesting! Hey, want to hear a silly joke?",
        ]
        import random
        safe_text = random.choice(safe_responses)
        return await self.text_to_speech(safe_text)
        
    async def log_conversation(self, user_input: str, ai_response: str, processing_time: float):
        await convex_client.mutation("conversations:create", {
            "toyId": self.toy_id,
            "deviceId": self.device_id,
            "timestamp": time.time(),
            "userInput": user_input,
            "aiResponse": ai_response,
            "safetyScore": 0,
            "flagged": False,
            "parentNotified": False,
            "metadata": {
                "sttConfidence": 0.95,
                "llmTokensUsed": len(ai_response.split()),
                "processingTimeMs": processing_time
            }
        })
        
    def copy(self):
        return ToyStreamHandler(self.toy_id, self.device_id)
        
    async def shutdown(self):
        # Update device status
        await convex_client.mutation("devices:updateStatus", {
            "deviceId": self.device_id,
            "status": "offline"
        })

# WebSocket endpoint
@app.websocket("/websocket/offer")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        # Wait for initial handshake
        data = await websocket.receive_json()
        if data.get("event") != "start":
            await websocket.close(code=1008)
            return
            
        device_id = data.get("websocket_id")
        toy_id = data.get("toy_id")
        
        if not device_id or not toy_id:
            await websocket.close(code=1008)
            return
            
        # Create and start stream handler
        handler = ToyStreamHandler(toy_id, device_id)
        stream = Stream(
            handler=handler,
            modality="audio",
            mode="send-receive"
        )
        
        await handler.start_up()
        
        # Update device status
        await convex_client.mutation("devices:updateStatus", {
            "deviceId": device_id,
            "toyId": toy_id,
            "status": "online"
        })
        
        # Handle WebSocket communication
        while True:
            try:
                message = await websocket.receive_json()
                
                if message.get("event") == "media":
                    # Decode audio data
                    audio_data = base64.b64decode(message["media"]["payload"])
                    # Process through handler
                    # ... (audio processing logic)
                    
                elif message.get("event") == "stop":
                    break
                    
            except WebSocketDisconnect:
                break
                
    finally:
        await handler.shutdown()
        await websocket.close()

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 2.2 Create Requirements File
Create `apps/fastrtc-gateway/requirements.txt`:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
websockets==12.0
fastrtc==0.1.0
numpy==1.24.3
openai==0.28.0
elevenlabs==0.2.26
azure-ai-contentsafety==1.0.0
convex==0.1.0
python-multipart==0.0.6
pydantic==2.5.0
```

## Step 3: Update Python Client for Raspberry Pi

### 3.1 Update Client Code
Update `apps/raspberry-pi/pommai_client.py`:
```python
#!/usr/bin/env python3
"""
Pommai Toy Client for Raspberry Pi Zero 2W
Optimized for low memory usage and real-time audio streaming
"""

import asyncio
import websockets
import json
import base64
import time
import logging
import sqlite3
from typing import Optional, Dict, Any
from dataclasses import dataclass

import pyaudio
import numpy as np
import RPi.GPIO as GPIO
from opus import OpusEncoder, OpusDecoder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class Config:
    """Configuration for Pommai Client"""
    SERVER_URL: str = "wss://pommai-gateway.vercel.app"
    DEVICE_ID: str = "rpi-001"
    TOY_ID: str = ""
    
    # Audio settings
    SAMPLE_RATE: int = 24000
    CHUNK_SIZE: int = 1024
    CHANNELS: int = 1
    
    # GPIO pins (BCM numbering)
    BUTTON_PIN: int = 17
    LED_RED: int = 27
    LED_GREEN: int = 22
    LED_BLUE: int = 23
    
    # Network settings
    PING_INTERVAL: int = 20
    PING_TIMEOUT: int = 10
    RECONNECT_DELAY: int = 5

class AudioProcessor:
    """Handles audio capture and playback"""
    
    def __init__(self, config: Config):
        self.config = config
        self.audio = pyaudio.PyAudio()
        
        # Setup input stream
        self.input_stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=config.CHANNELS,
            rate=config.SAMPLE_RATE,
            input=True,
            frames_per_buffer=config.CHUNK_SIZE,
            stream_callback=None
        )
        
        # Setup output stream
        self.output_stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=config.CHANNELS,
            rate=config.SAMPLE_RATE,
            output=True,
            frames_per_buffer=config.CHUNK_SIZE,
            stream_callback=None
        )
        
        # Setup Opus codec
        self.encoder = OpusEncoder(config.SAMPLE_RATE, config.CHANNELS)
        self.decoder = OpusDecoder(config.SAMPLE_RATE, config.CHANNELS)
        
    def record_chunk(self) -> bytes:
        """Record a single audio chunk"""
        try:
            data = self.input_stream.read(self.config.CHUNK_SIZE, exception_on_overflow=False)
            return data
        except Exception as e:
            logger.error(f"Error recording audio: {e}")
            return b''
            
    def play_chunk(self, data: bytes):
        """Play a single audio chunk"""
        try:
            self.output_stream.write(data)
        except Exception as e:
            logger.error(f"Error playing audio: {e}")
            
    def encode_audio(self, data: bytes) -> str:
        """Encode audio to Opus and base64"""
        try:
            compressed = self.encoder.encode(data)
            return base64.b64encode(compressed).decode('utf-8')
        except Exception as e:
            logger.error(f"Error encoding audio: {e}")
            return ""
            
    def decode_audio(self, data: str) -> bytes:
        """Decode base64 and Opus audio"""
        try:
            compressed = base64.b64decode(data)
            return self.decoder.decode(compressed)
        except Exception as e:
            logger.error(f"Error decoding audio: {e}")
            return b''
            
    def cleanup(self):
        """Clean up audio resources"""
        self.input_stream.stop_stream()
        self.input_stream.close()
        self.output_stream.stop_stream()
        self.output_stream.close()
        self.audio.terminate()

class LEDController:
    """Controls RGB LED for status indication"""
    
    def __init__(self, config: Config):
        self.config = config
        self.setup_gpio()
        
    def setup_gpio(self):
        """Setup GPIO pins"""
        GPIO.setmode(GPIO.BCM)
        GPIO.setup([self.config.LED_RED, self.config.LED_GREEN, self.config.LED_BLUE], GPIO.OUT)
        self.set_color("off")
        
    def set_color(self, color: str):
        """Set LED color"""
        colors = {
            "off": (0, 0, 0),
            "red": (1, 0, 0),
            "green": (0, 1, 0),
            "blue": (0, 0, 1),
            "purple": (1, 0, 1),
            "yellow": (1, 1, 0),
            "cyan": (0, 1, 1),
            "white": (1, 1, 1)
        }
        
        r, g, b = colors.get(color, (0, 0, 0))
        GPIO.output(self.config.LED_RED, r)
        GPIO.output(self.config.LED_GREEN, g)
        GPIO.output(self.config.LED_BLUE, b)
        
    def pulse(self, color: str, duration: float = 0.5):
        """Pulse LED effect"""
        self.set_color(color)
        time.sleep(duration)
        self.set_color("off")
        
    def cleanup(self):
        """Clean up GPIO"""
        self.set_color("off")
        GPIO.cleanup()

class OfflineCache:
    """SQLite cache for offline responses"""
    
    def __init__(self, db_path: str = "/home/pi/pommai_cache.db"):
        self.conn = sqlite3.connect(db_path)
        self.setup_tables()
        
    def setup_tables(self):
        """Create cache tables"""
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS responses (
                input_text TEXT PRIMARY KEY,
                response_text TEXT,
                audio_data BLOB,
                timestamp INTEGER
            )
        """)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS offline_responses (
                trigger TEXT PRIMARY KEY,
                response_audio BLOB
            )
        """)
        self.conn.commit()
        
    def get_cached_response(self, input_text: str) -> Optional[bytes]:
        """Get cached audio response"""
        cursor = self.conn.execute(
            "SELECT audio_data FROM responses WHERE input_text = ?",
            (input_text.lower(),)
        )
        result = cursor.fetchone()
        return result[0] if result else None
        
    def cache_response(self, input_text: str, response_text: str, audio_data: bytes):
        """Cache a response"""
        self.conn.execute(
            "INSERT OR REPLACE INTO responses VALUES (?, ?, ?, ?)",
            (input_text.lower(), response_text, audio_data, int(time.time()))
        )
        self.conn.commit()
        
    def get_offline_response(self, trigger: str) -> Optional[bytes]:
        """Get offline response audio"""
        cursor = self.conn.execute(
            "SELECT response_audio FROM offline_responses WHERE trigger = ?",
            (trigger.lower(),)
        )
        result = cursor.fetchone()
        return result[0] if result else None
        
    def cleanup_old_cache(self, max_age_days: int = 7):
        """Remove old cached responses"""
        cutoff = int(time.time()) - (max_age_days * 86400)
        self.conn.execute("DELETE FROM responses WHERE timestamp < ?", (cutoff,))
        self.conn.commit()

class PommaiClient:
    """Main client application"""
    
    def __init__(self, config: Config):
        self.config = config
        self.audio = AudioProcessor(config)
        self.led = LEDController(config)
        self.cache = OfflineCache()
        self.websocket = None
        self.running = False
        self.button_pressed = False
        
        # Setup button
        GPIO.setup(config.BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.add_event_detect(
            config.BUTTON_PIN,
            GPIO.BOTH,
            callback=self.button_callback,
            bouncetime=50
        )
        
    def button_callback(self, channel):
        """Handle button press/release"""
        self.button_pressed = GPIO.input(channel) == GPIO.LOW
        if self.button_pressed:
            logger.info("Button pressed - starting recording")
            self.led.set_color("blue")
        else:
            logger.info("Button released - stopping recording")
            self.led.set_color("green")
            
    async def connect(self):
        """Connect to WebSocket server"""
        try:
            self.websocket = await websockets.connect(
                f"{self.config.SERVER_URL}/websocket/offer",
                ping_interval=self.config.PING_INTERVAL,
                ping_timeout=self.config.PING_TIMEOUT
            )
            
            # Send handshake
            await self.websocket.send(json.dumps({
                "event": "start",
                "websocket_id": self.config.DEVICE_ID,
                "toy_id": self.config.TOY_ID
            }))
            
            logger.info("Connected to server")
            self.led.pulse("green", 0.5)
            return True
            
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            self.led.pulse("red", 0.5)
            return False
            
    async def audio_streaming_loop(self):
        """Main audio streaming loop"""
        audio_buffer = []
        
        while self.running:
            try:
                # Handle recording
                if self.button_pressed:
                    # Record and send audio chunk
                    chunk = self.audio.record_chunk()
                    if chunk:
                        audio_buffer.append(chunk)
                        encoded = self.audio.encode_audio(chunk)
                        
                        if self.websocket and encoded:
                            await self.websocket.send(json.dumps({
                                "event": "media",
                                "media": {"payload": encoded}
                            }))
                            
                # Handle incoming audio
                if self.websocket:
                    try:
                        message = await asyncio.wait_for(
                            self.websocket.recv(),
                            timeout=0.01
                        )
                        data = json.loads(message)
                        
                        if data.get("event") == "media":
                            # Decode and play audio
                            audio_data = self.audio.decode_audio(
                                data["media"]["payload"]
                            )
                            if audio_data:
                                self.audio.play_chunk(audio_data)
                                
                    except asyncio.TimeoutError:
                        pass
                        
                # Small delay to prevent CPU overload
                await asyncio.sleep(0.001)
                
            except Exception as e:
                logger.error(f"Error in audio loop: {e}")
                await asyncio.sleep(0.1)
                
    async def run(self):
        """Main run loop"""
        self.running = True
        logger.info("Pommai Client starting...")
        
        # Initial LED pattern
        for color in ["red", "green", "blue"]:
            self.led.pulse(color, 0.2)
            
        while self.running:
            try:
                # Connect to server
                if await self.connect():
                    # Run audio streaming
                    await self.audio_streaming_loop()
                else:
                    # Offline mode
                    logger.warning("Running in offline mode")
                    self.led.set_color("yellow")
                    await self.offline_loop()
                    
                # Reconnect delay
                await asyncio.sleep(self.config.RECONNECT_DELAY)
                
            except KeyboardInterrupt:
                logger.info("Shutting down...")
                self.running = False
                break
                
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                await asyncio.sleep(self.config.RECONNECT_DELAY)
                
    async def offline_loop(self):
        """Handle offline mode with cached responses"""
        while self.running and not self.websocket:
            if self.button_pressed:
                # Play offline response
                self.led.set_color("purple")
                
                # Simple offline responses
                offline_audio = self.cache.get_offline_response("hello")
                if offline_audio:
                    self.audio.play_chunk(offline_audio)
                    
                self.led.set_color("off")
                
            await asyncio.sleep(0.1)
            
    def cleanup(self):
        """Clean up resources"""
        self.running = False
        if self.websocket:
            asyncio.create_task(self.websocket.close())
        self.audio.cleanup()
        self.led.cleanup()
        GPIO.cleanup()
        logger.info("Cleanup complete")

def main():
    """Main entry point"""
    # Load configuration
    config = Config()
    
    # Override with environment variables
    import os
    config.SERVER_URL = os.getenv("POMMAI_SERVER_URL", config.SERVER_URL)
    config.DEVICE_ID = os.getenv("POMMAI_DEVICE_ID", config.DEVICE_ID)
    config.TOY_ID = os.getenv("POMMAI_TOY_ID", config.TOY_ID)
    
    # Create and run client
    client = PommaiClient(config)
    
    try:
        asyncio.run(client.run())
    except KeyboardInterrupt:
        pass
    finally:
        client.cleanup()

if __name__ == "__main__":
    main()
```

## Step 4: Deploy and Test

### 4.1 Deploy FastRTC Gateway
```bash
cd apps/fastrtc-gateway
vercel deploy --prod
```

### 4.2 Deploy Convex Functions
```bash
cd apps/web
npx convex deploy
```

### 4.3 Test on Raspberry Pi
```bash
# Install on Pi
scp -r apps/raspberry-pi pi@raspberry.local:/home/pi/pommai

# SSH to Pi
ssh pi@raspberry.local

# Install dependencies
cd /home/pi/pommai
pip3 install -r requirements.txt

# Set environment variables
export POMMAI_SERVER_URL="wss://your-gateway.vercel.app"
export POMMAI_DEVICE_ID="rpi-001"
export POMMAI_TOY_ID="your-toy-id"

# Run client
python3 pommai_client.py
```

## Step 5: Monitor and Optimize

### 5.1 Setup Monitoring Dashboard
Create a simple monitoring page to track:
- Active connections
- Average latency
- Error rates
- Safety filter triggers

### 5.2 Performance Optimization
- Enable response caching for common phrases
- Implement speculative TTS for faster responses
- Use connection pooling for AI services
- Optimize audio chunk sizes for network conditions

### 5.3 Safety Testing
- Test content filters with various inputs
- Verify parent alerts are sent correctly
- Ensure emergency stop functionality works
- Test offline mode fallbacks

## Troubleshooting

### Common Issues:

1. **High Latency**
   - Check network connection quality
   - Reduce audio chunk size
   - Enable more aggressive caching
   - Use closer server regions

2. **Audio Quality Issues**
   - Verify sample rates match
   - Check microphone gain settings
   - Ensure proper grounding on Pi
   - Test with different audio HATs

3. **Connection Drops**
   - Implement exponential backoff for reconnects
   - Check WebSocket timeout settings
   - Monitor network stability
   - Add heartbeat mechanisms

4. **Memory Issues on Pi Zero 2W**
   - Reduce audio buffer sizes
   - Clear cache more frequently
   - Use swap file if needed
   - Monitor with `htop`

## Success Criteria

Phase 4 is complete when:
- [ ] End-to-end latency < 2 seconds
- [ ] Guardian Mode safety filters working
- [ ] Parent dashboard shows real-time transcripts
- [ ] Device can reconnect automatically
- [ ] Offline mode provides basic responses
- [ ] Memory usage stays under 100MB
- [ ] 99% uptime achieved
- [ ] Successfully tested with 10+ concurrent devices

## Next Steps

After completing Phase 4:
1. Begin Phase 5: Safety & Polish
2. Implement advanced safety features
3. Add analytics dashboard
4. Create setup documentation
5. Begin user testing
