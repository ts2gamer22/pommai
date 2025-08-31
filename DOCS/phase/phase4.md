# Phase 4: FastRTC + Convex Integration with AI Services (Week 7-8)

## Overview
Phase 4 focuses on integrating FastRTC with Convex for real-time communication between the Raspberry Pi Zero 2W and our cloud infrastructure. This phase introduces WebSocket-based communication, Convex AI agents with built-in RAG system, and integration with our AI service stack (OpenAI Whisper for STT, ElevenLabs for TTS, and OpenRouter's OSS models for LLM).

## Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    Pommai.co Platform                        │
│                    (Next.js + Convex)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Convex AI Agent System                      │   │
│  │  - Agent management and orchestration                 │   │
│  │  - Built-in RAG with vector search                   │   │
│  │  - Message threading and persistence                  │   │
│  │  - Tool calling and workflows                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↕                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           FastRTC WebSocket Gateway                   │   │
│  │  - Real-time bidirectional communication             │   │
│  │  - Audio streaming with Opus codec                   │   │
│  │  - WebRTC data channels for low latency              │   │
│  │  - Automatic reconnection and buffering              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ WebSocket
                          │
┌─────────────────────────┴───────────────────────────────────┐
│            Raspberry Pi Zero 2W (Python Client)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           FastRTC Python Client                       │   │
│  │  - WebSocket connection management                    │   │
│  │  - Audio capture and streaming                       │   │
│  │  - Opus compression/decompression                    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Convex Python SDK                          │   │
│  │  - Real-time subscriptions                           │   │
│  │  - Toy configuration sync                            │   │
│  │  - Conversation persistence                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites
- Completed Phase 1-3 (Web platform, toy creation, basic Pi client)
- Convex backend with agent component installed
- FastRTC package available
- API keys for OpenAI, ElevenLabs, and OpenRouter
- Raspberry Pi Zero 2W with Python environment

## Task 1: Install and Configure Convex Agent Component

### Objective
Set up the Convex Agent component for managing AI conversations, RAG, and tool calling.

### Implementation Steps

#### 1.1 Install Convex Agent Component
```bash
cd apps/web
npm install @convex-dev/agent
```

#### 1.2 Configure Agent Schema
```typescript
// convex/agentSchema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { agentTables } from "@convex-dev/agent";

export default defineSchema({
  ...agentTables,
  
  // Toy-specific agent configurations
  toyAgents: defineTable({
    toyId: v.id("toys"),
    agentId: v.string(),
    name: v.string(),
    systemPrompt: v.string(),
    model: v.string(), // e.g., "openrouter/gpt-oss-120b"
    temperature: v.number(),
    maxTokens: v.number(),
    ragSettings: v.object({
      enabled: v.boolean(),
      collectionName: v.string(),
      maxResults: v.number(),
      minRelevance: v.number(),
    }),
    voiceSettings: v.object({
      provider: v.literal("elevenlabs"),
      voiceId: v.string(),
      stability: v.number(),
      similarityBoost: v.number(),
    }),
    safetySettings: v.object({
      enabled: v.boolean(),
      filterLevel: v.union(v.literal("strict"), v.literal("moderate"), v.literal("relaxed")),
      blockedTopics: v.array(v.string()),
    }),
  })
  .index("by_toy", ["toyId"])
  .index("by_agent", ["agentId"]),
  
  // RAG knowledge base
  knowledgeEmbeddings: defineTable({
    toyId: v.id("toys"),
    content: v.string(),
    embedding: v.array(v.number()),
    metadata: v.object({
      source: v.string(),
      type: v.string(),
      createdAt: v.number(),
    }),
  })
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536, // OpenAI ada-002 dimensions
    filterFields: ["toyId"],
  }),
});
```

#### 1.3 Create Agent Functions
```typescript
// convex/agents.ts
import { Agent } from "@convex-dev/agent";
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Create a toy-specific agent
export const createToyAgent = mutation({
  args: {
    toyId: v.id("toys"),
    personality: v.string(),
    knowledgeBase: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const toy = await ctx.db.get(args.toyId);
    if (!toy) throw new Error("Toy not found");
    
    const agent = new Agent({
      ctx,
      name: toy.name,
      model: "openrouter/gpt-oss-120b",
      instructions: generateSystemPrompt(toy, args.personality),
      tools: toy.isForKids ? getKidSafeTools() : getAllTools(),
    });
    
    // Store agent configuration
    const agentId = await ctx.db.insert("toyAgents", {
      toyId: args.toyId,
      agentId: agent.id,
      name: toy.name,
      systemPrompt: agent.instructions,
      model: agent.model,
      temperature: 0.7,
      maxTokens: 2000,
      ragSettings: {
        enabled: !!args.knowledgeBase,
        collectionName: `toy_${args.toyId}`,
        maxResults: 5,
        minRelevance: 0.7,
      },
      voiceSettings: {
        provider: "elevenlabs",
        voiceId: toy.voiceId,
        stability: 0.5,
        similarityBoost: 0.75,
      },
      safetySettings: {
        enabled: toy.isForKids,
        filterLevel: toy.isForKids ? "strict" : "moderate",
        blockedTopics: toy.isForKids ? getBlockedTopicsForKids() : [],
      },
    });
    
    return agentId;
  },
});
```

### Context Requirements
- Convex Agent documentation and examples
- OpenRouter API configuration for OSS models
- RAG implementation patterns

## Task 2: Implement FastRTC WebSocket Gateway

### Objective
Set up FastRTC for real-time audio streaming between the Pi and cloud services.

### Implementation Steps

#### 2.1 Install FastRTC Dependencies
```bash
cd apps/web
npm install fastrtc @gradio/client
```

#### 2.2 Create FastRTC Server Configuration
```typescript
// apps/web/src/lib/fastrtc/server.ts
import { FastRTC } from 'fastrtc';
import { ConvexClient } from 'convex/browser';

export class PommaiRTCServer {
  private rtc: FastRTC;
  private convex: ConvexClient;
  private activeConnections: Map<string, RTCConnection>;
  
  constructor(convexUrl: string) {
    this.convex = new ConvexClient(convexUrl);
    this.activeConnections = new Map();
    
    this.rtc = new FastRTC({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
      audio: {
        codec: 'opus',
        channels: 1,
        sampleRate: 16000,
      },
    });
    
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    // Handle new WebSocket connections
    this.rtc.on('connection', async (socket, request) => {
      const deviceId = request.headers['x-device-id'];
      const toyId = request.headers['x-toy-id'];
      const authToken = request.headers['authorization'];
      
      // Validate connection
      const isValid = await this.validateConnection(deviceId, toyId, authToken);
      if (!isValid) {
        socket.close(1008, 'Invalid credentials');
        return;
      }
      
      // Create RTC connection
      const connection = new RTCConnection(socket, this.convex, {
        deviceId,
        toyId,
        onAudioReceived: this.handleAudioFromPi.bind(this),
        onDisconnect: this.handleDisconnect.bind(this),
      });
      
      this.activeConnections.set(deviceId, connection);
      
      // Send initial configuration
      await connection.sendConfiguration();
    });
  }
  
  private async handleAudioFromPi(
    deviceId: string,
    audioData: ArrayBuffer,
    metadata: AudioMetadata
  ) {
    const connection = this.activeConnections.get(deviceId);
    if (!connection) return;
    
    try {
      // Process audio through our pipeline
      const { text, audioResponse } = await this.processAudioPipeline(
        audioData,
        connection.toyId,
        metadata
      );
      
      // Stream response back to Pi
      await connection.streamAudioResponse(audioResponse, {
        text,
        isFinal: metadata.isFinal,
      });
      
    } catch (error) {
      console.error('Audio processing error:', error);
      connection.sendError('Processing failed');
    }
  }
  
  private async processAudioPipeline(
    audioData: ArrayBuffer,
    toyId: string,
    metadata: AudioMetadata
  ): Promise<ProcessedAudio> {
    // 1. Speech-to-Text (Whisper)
    const text = await this.transcribeAudio(audioData);
    
    // 2. Safety check for Kids mode
    const toy = await this.convex.query('toys:get', { id: toyId });
    if (toy.isForKids) {
      const safetyCheck = await this.checkSafety(text);
      if (!safetyCheck.passed) {
        return this.getSafetyResponse(safetyCheck.reason);
      }
    }
    
    // 3. Process with Convex Agent
    const agentResponse = await this.convex.action('agents:processMessage', {
      toyId,
      message: text,
      includeRAG: true,
    });
    
    // 4. Text-to-Speech (ElevenLabs)
    const audioResponse = await this.synthesizeSpeech(
      agentResponse.text,
      toy.voiceId
    );
    
    return {
      text: agentResponse.text,
      audioResponse,
    };
  }
}
```

#### 2.3 WebSocket Message Protocol
```typescript
// apps/web/src/lib/fastrtc/protocol.ts

export interface WebSocketMessage {
  type: 'audio_chunk' | 'control' | 'config' | 'heartbeat' | 'error';
  payload: any;
  sequence: number;
  timestamp: number;
}

export interface AudioChunkMessage {
  type: 'audio_chunk';
  payload: {
    data: string; // Base64 encoded Opus audio
    metadata: {
      isFinal: boolean;
      duration: number;
      format: 'opus';
    };
  };
}

export interface ControlMessage {
  type: 'control';
  payload: {
    command: 'start_recording' | 'stop_recording' | 'switch_toy' | 'emergency_stop';
    params?: any;
  };
}

export interface ConfigMessage {
  type: 'config';
  payload: {
    toy: {
      id: string;
      name: string;
      personality: string;
      voiceId: string;
      isForKids: boolean;
    };
    audio: {
      sampleRate: number;
      channels: number;
      codec: string;
    };
    features: {
      wakeWord: boolean;
      offlineMode: boolean;
      rag: boolean;
    };
  };
}
```

### Context Requirements
- FastRTC documentation from gradio-app/fastrtc
- WebSocket protocol best practices
- WebRTC configuration for low latency

## Task 3: Integrate AI Services

### Objective
Connect OpenAI Whisper (STT), ElevenLabs (TTS), and OpenRouter (LLM) services.

### Implementation Steps

#### 3.1 Configure AI Service Providers
```typescript
// convex/aiServices.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { ElevenLabsClient } from "elevenlabs";

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL,
    "X-Title": "Pommai AI Toys",
  },
});

// Speech-to-Text with Whisper
export const transcribeAudio = action({
  args: {
    audioData: v.string(), // Base64 encoded audio
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const audioBuffer = Buffer.from(args.audioData, 'base64');
    const audioFile = new File([audioBuffer], 'audio.opus', { type: 'audio/opus' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: args.language,
      response_format: "verbose_json",
    });
    
    return {
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
      segments: transcription.segments,
    };
  },
});

// Text-to-Speech with ElevenLabs
export const synthesizeSpeech = action({
  args: {
    text: v.string(),
    voiceId: v.string(),
    modelId: v.optional(v.string()),
    voiceSettings: v.optional(v.object({
      stability: v.number(),
      similarityBoost: v.number(),
      style: v.optional(v.number()),
      useSpeakerBoost: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const audio = await elevenlabs.generate({
      voice: args.voiceId,
      text: args.text,
      model_id: args.modelId || "eleven_multilingual_v2",
      voice_settings: args.voiceSettings || {
        stability: 0.5,
        similarity_boost: 0.75,
      },
      stream: true,
    });
    
    // Convert stream to chunks for WebSocket transmission
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    
    return {
      audioData: Buffer.concat(chunks).toString('base64'),
      format: 'mp3_44100_128',
      duration: calculateDuration(chunks),
    };
  },
});

// LLM with OpenRouter
export const generateResponse = action({
  args: {
    messages: v.array(v.object({
      role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    stream: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const model = args.model || "anthropic/claude-3-haiku";
    
    if (args.stream) {
      const stream = await openrouter.chat.completions.create({
        model,
        messages: args.messages,
        temperature: args.temperature || 0.7,
        max_tokens: args.maxTokens || 2000,
        stream: true,
      });
      
      // Return stream handler
      return {
        type: 'stream',
        streamId: await createStreamHandler(stream),
      };
    } else {
      const completion = await openrouter.chat.completions.create({
        model,
        messages: args.messages,
        temperature: args.temperature || 0.7,
        max_tokens: args.maxTokens || 2000,
      });
      
      return {
        type: 'completion',
        content: completion.choices[0].message.content,
        usage: completion.usage,
      };
    }
  },
});
```

#### 3.2 Create AI Pipeline Integration
```typescript
// convex/aiPipeline.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const processVoiceInteraction = action({
  args: {
    toyId: v.id("toys"),
    audioData: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get toy configuration
    const toy = await ctx.runQuery(api.toys.get, { id: args.toyId });
    const agent = await ctx.runQuery(api.agents.getByToyId, { toyId: args.toyId });
    
    // 1. STT: Transcribe audio
    const transcription = await ctx.runAction(api.aiServices.transcribeAudio, {
      audioData: args.audioData,
      language: toy.language || "en",
    });
    
    // 2. Safety Check (for Kids mode)
    if (toy.isForKids) {
      const safety = await ctx.runAction(api.safety.checkContent, {
        text: transcription.text,
        level: toy.safetySettings.filterLevel,
      });
      
      if (!safety.passed) {
        // Return safe redirect response
        return await ctx.runAction(api.safety.getSafeResponse, {
          reason: safety.reason,
          voiceId: toy.voiceId,
        });
      }
    }
    
    // 3. RAG: Retrieve relevant context
    let context = "";
    if (agent.ragSettings.enabled) {
      const relevant = await ctx.runQuery(api.rag.search, {
        query: transcription.text,
        collectionName: agent.ragSettings.collectionName,
        maxResults: agent.ragSettings.maxResults,
      });
      context = relevant.map(r => r.content).join("\n");
    }
    
    // 4. LLM: Generate response with agent
    const agentResponse = await ctx.runAction(api.agents.generateResponse, {
      agentId: agent.agentId,
      message: transcription.text,
      context,
      sessionId: args.sessionId,
    });
    
    // 5. TTS: Convert response to speech
    const audio = await ctx.runAction(api.aiServices.synthesizeSpeech, {
      text: agentResponse.text,
      voiceId: toy.voiceId,
      voiceSettings: agent.voiceSettings,
    });
    
    // 6. Store conversation
    await ctx.runMutation(api.conversations.store, {
      toyId: args.toyId,
      userMessage: transcription.text,
      assistantMessage: agentResponse.text,
      audioUrl: audio.url,
      metadata: {
        duration: transcription.duration,
        model: agent.model,
        usage: agentResponse.usage,
      },
    });
    
    return {
      text: agentResponse.text,
      audioData: audio.audioData,
      format: audio.format,
      conversationId: agentResponse.conversationId,
    };
  },
});
```

### Context Requirements
- OpenAI Whisper API documentation
- ElevenLabs API integration guide
- OpenRouter model selection and pricing

## Task 4: Update Python Client for FastRTC

### Objective
Modify the Raspberry Pi Python client to use FastRTC for WebSocket communication.

### Implementation Steps

#### 4.1 Install Python Dependencies
```bash
# requirements.txt
convex==0.7.0
fastrtc==0.1.0
websockets==12.0
pyaudio==0.2.14
numpy==1.24.3
opuslib==3.0.1
python-dotenv==1.0.0
aiofiles==23.2.1
```

#### 4.2 Create FastRTC Python Client
```python
# apps/raspberry-pi/src/fastrtc_client.py
import asyncio
import json
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
import numpy as np

import websockets
from convex import ConvexClient
from fastrtc import FastRTCClient
import pyaudio
import opuslib

@dataclass
class RTCConfig:
    convex_url: str
    ws_url: str
    device_id: str
    toy_id: str
    auth_token: str
    audio_config: Dict[str, Any]

class PommaiRTCClient:
    def __init__(self, config: RTCConfig):
        self.config = config
        self.convex = ConvexClient(config.convex_url)
        self.rtc_client: Optional[FastRTCClient] = None
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.audio_stream = None
        self.is_connected = False
        self.opus_encoder = opuslib.Encoder(16000, 1, opuslib.APPLICATION_VOIP)
        self.opus_decoder = opuslib.Decoder(16000, 1)
        
    async def connect(self):
        """Establish WebSocket connection with FastRTC server"""
        try:
            # Connect to WebSocket with auth headers
            headers = {
                'Authorization': f'Bearer {self.config.auth_token}',
                'X-Device-ID': self.config.device_id,
                'X-Toy-ID': self.config.toy_id,
            }
            
            self.ws = await websockets.connect(
                self.config.ws_url,
                extra_headers=headers,
                ping_interval=20,
                ping_timeout=10
            )
            
            # Initialize FastRTC client
            self.rtc_client = FastRTCClient(self.ws)
            
            # Setup audio stream
            self.setup_audio_stream()
            
            # Start receiving messages
            asyncio.create_task(self.receive_messages())
            
            self.is_connected = True
            logging.info(f"Connected to FastRTC server at {self.config.ws_url}")
            
            # Send initial handshake
            await self.send_handshake()
            
            return True
            
        except Exception as e:
            logging.error(f"Connection failed: {e}")
            return False
    
    def setup_audio_stream(self):
        """Initialize PyAudio for audio capture and playback"""
        p = pyaudio.PyAudio()
        
        # Input stream for microphone
        self.input_stream = p.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=16000,
            input=True,
            frames_per_buffer=1024
        )
        
        # Output stream for speaker
        self.output_stream = p.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=16000,
            output=True,
            frames_per_buffer=1024
        )
    
    async def send_handshake(self):
        """Send initial handshake message"""
        message = {
            'type': 'handshake',
            'payload': {
                'deviceId': self.config.device_id,
                'toyId': self.config.toy_id,
                'capabilities': {
                    'audio': True,
                    'wakeWord': True,
                    'offlineMode': True,
                    'rag': True,
                },
                'audioConfig': self.config.audio_config,
            },
            'timestamp': asyncio.get_event_loop().time(),
        }
        
        await self.send_message(message)
    
    async def send_message(self, message: Dict[str, Any]):
        """Send message through WebSocket"""
        if self.ws and not self.ws.closed:
            await self.ws.send(json.dumps(message))
    
    async def receive_messages(self):
        """Receive and process messages from server"""
        try:
            async for message in self.ws:
                data = json.loads(message)
                await self.handle_message(data)
        except websockets.exceptions.ConnectionClosed:
            logging.warning("WebSocket connection closed")
            self.is_connected = False
            # Attempt reconnection
            asyncio.create_task(self.reconnect())
    
    async def handle_message(self, message: Dict[str, Any]):
        """Process received messages"""
        msg_type = message.get('type')
        
        if msg_type == 'audio_chunk':
            await self.handle_audio_chunk(message['payload'])
        elif msg_type == 'config':
            await self.handle_config_update(message['payload'])
        elif msg_type == 'control':
            await self.handle_control_command(message['payload'])
        elif msg_type == 'error':
            logging.error(f"Server error: {message['payload']}")
    
    async def handle_audio_chunk(self, payload: Dict[str, Any]):
        """Handle incoming audio chunks"""
        audio_data = bytes.fromhex(payload['data'])
        
        # Decode Opus audio
        pcm_data = self.opus_decoder.decode(audio_data, 960)
        
        # Play audio
        self.output_stream.write(pcm_data)
        
        # Update UI if this is the final chunk
        if payload['metadata'].get('isFinal'):
            logging.info("Audio playback completed")
    
    async def start_recording(self):
        """Start recording audio and streaming to server"""
        logging.info("Starting audio recording...")
        sequence = 0
        
        while self.is_connected:
            try:
                # Read audio from microphone
                audio_data = self.input_stream.read(1024, exception_on_overflow=False)
                
                # Convert to numpy array
                audio_array = np.frombuffer(audio_data, dtype=np.int16)
                
                # Encode with Opus
                encoded = self.opus_encoder.encode(audio_array.tobytes(), 960)
                
                # Send audio chunk
                message = {
                    'type': 'audio_chunk',
                    'payload': {
                        'data': encoded.hex(),
                        'metadata': {
                            'sequence': sequence,
                            'isFinal': False,
                            'format': 'opus',
                        }
                    },
                    'timestamp': asyncio.get_event_loop().time(),
                }
                
                await self.send_message(message)
                sequence += 1
                
            except Exception as e:
                logging.error(f"Recording error: {e}")
                break
    
    async def stop_recording(self):
        """Stop recording and send final chunk"""
        # Send final chunk marker
        message = {
            'type': 'audio_chunk',
            'payload': {
                'data': '',
                'metadata': {
                    'isFinal': True,
                    'format': 'opus',
                }
            },
            'timestamp': asyncio.get_event_loop().time(),
        }
        
        await self.send_message(message)
        logging.info("Recording stopped")
    
    async def switch_toy(self, new_toy_id: str):
        """Switch to a different toy configuration"""
        message = {
            'type': 'control',
            'payload': {
                'command': 'switch_toy',
                'params': {
                    'toyId': new_toy_id,
                }
            },
            'timestamp': asyncio.get_event_loop().time(),
        }
        
        await self.send_message(message)
        self.config.toy_id = new_toy_id
        logging.info(f"Switched to toy: {new_toy_id}")
    
    async def reconnect(self):
        """Attempt to reconnect to server"""
        max_attempts = 10
        attempt = 0
        
        while attempt < max_attempts and not self.is_connected:
            attempt += 1
            delay = min(2 ** attempt, 60)
            
            logging.info(f"Reconnection attempt {attempt}/{max_attempts} in {delay}s...")
            await asyncio.sleep(delay)
            
            if await self.connect():
                logging.info("Reconnection successful")
                break
        
        if not self.is_connected:
            logging.error("Failed to reconnect after maximum attempts")
```

#### 4.3 Integrate with Main Client
```python
# apps/raspberry-pi/src/pommai_client.py
import asyncio
import os
import logging
from dotenv import load_dotenv

from fastrtc_client import PommaiRTCClient, RTCConfig
from button_handler import ButtonHandler
from led_controller import LEDController
from wake_word_detector import WakeWordDetector
from conversation_cache import ConversationCache

class PommaiClient:
    def __init__(self):
        load_dotenv()
        
        # Configure RTC client
        self.rtc_config = RTCConfig(
            convex_url=os.getenv('CONVEX_URL'),
            ws_url=os.getenv('FASTRTC_WS_URL', 'wss://pommai.co/rtc'),
            device_id=os.getenv('DEVICE_ID'),
            toy_id=os.getenv('TOY_ID'),
            auth_token=os.getenv('AUTH_TOKEN'),
            audio_config={
                'sampleRate': 16000,
                'channels': 1,
                'codec': 'opus',
            }
        )
        
        self.rtc_client = PommaiRTCClient(self.rtc_config)
        self.button_handler = ButtonHandler(self)
        self.led_controller = LEDController()
        self.wake_word = WakeWordDetector()
        self.cache = ConversationCache()
        
        self.state = 'idle'
        
    async def initialize(self):
        """Initialize all components"""
        # Connect to FastRTC server
        if not await self.rtc_client.connect():
            logging.error("Failed to connect to server")
            return False
        
        # Initialize hardware
        self.button_handler.setup()
        self.led_controller.setup()
        
        # Start wake word detection
        if os.getenv('ENABLE_WAKE_WORD', 'false').lower() == 'true':
            await self.wake_word.start(self.on_wake_word_detected)
        
        # Set idle LED pattern
        await self.led_controller.set_pattern('idle')
        
        logging.info("Pommai client initialized successfully")
        return True
    
    async def on_button_press(self):
        """Handle button press event"""
        if self.state == 'idle':
            self.state = 'recording'
            await self.led_controller.set_pattern('listening')
            await self.rtc_client.start_recording()
    
    async def on_button_release(self):
        """Handle button release event"""
        if self.state == 'recording':
            self.state = 'processing'
            await self.led_controller.set_pattern('processing')
            await self.rtc_client.stop_recording()
    
    async def on_wake_word_detected(self):
        """Handle wake word detection"""
        logging.info("Wake word detected!")
        await self.on_button_press()
        
        # Auto-stop after 5 seconds if no button press
        await asyncio.sleep(5)
        if self.state == 'recording':
            await self.on_button_release()
    
    async def run(self):
        """Main event loop"""
        if not await self.initialize():
            return
        
        try:
            # Keep client running
            while True:
                await asyncio.sleep(1)
                
                # Heartbeat
                if self.rtc_client.is_connected:
                    await self.rtc_client.send_message({
                        'type': 'heartbeat',
                        'timestamp': asyncio.get_event_loop().time(),
                    })
                
        except KeyboardInterrupt:
            logging.info("Shutting down...")
        finally:
            await self.cleanup()
    
    async def cleanup(self):
        """Clean up resources"""
        if self.rtc_client.ws:
            await self.rtc_client.ws.close()
        self.led_controller.cleanup()
        self.button_handler.cleanup()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    client = PommaiClient()
    asyncio.run(client.run())
```

### Context Requirements
- FastRTC Python client documentation
- Convex Python SDK examples
- Opus codec configuration for Python

## Task 5: Implement RAG System with Convex

### Objective
Set up the RAG (Retrieval Augmented Generation) system using Convex's built-in vector search.

### Implementation Steps

#### 5.1 Create Knowledge Base Management
```typescript
// convex/rag.ts
import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add knowledge to toy's RAG system
export const addKnowledge = mutation({
  args: {
    toyId: v.id("toys"),
    content: v.string(),
    metadata: v.object({
      source: v.string(),
      type: v.union(v.literal("backstory"), v.literal("fact"), v.literal("memory")),
    }),
  },
  handler: async (ctx, args) => {
    // Generate embedding
    const embedding = await generateEmbedding(args.content);
    
    // Store in vector database
    await ctx.db.insert("knowledgeEmbeddings", {
      toyId: args.toyId,
      content: args.content,
      embedding,
      metadata: {
        ...args.metadata,
        createdAt: Date.now(),
      },
    });
  },
});

// Search knowledge base
export const search = query({
  args: {
    query: v.string(),
    toyId: v.id("toys"),
    maxResults: v.optional(v.number()),
    minRelevance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(args.query);
    
    // Vector search
    const results = await ctx.db
      .query("knowledgeEmbeddings")
      .withSearchIndex("by_embedding", (q) =>
        q.search("embedding", queryEmbedding)
          .filter((q) => q.eq("toyId", args.toyId))
      )
      .take(args.maxResults || 5);
    
    // Filter by relevance threshold
    const minRelevance = args.minRelevance || 0.7;
    return results.filter(r => r._score >= minRelevance);
  },
});

// Helper function to generate embeddings
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  
  return response.data[0].embedding;
}

// Process knowledge for better RAG
export const processKnowledgeBase = action({
  args: {
    toyId: v.id("toys"),
    documents: v.array(v.object({
      content: v.string(),
      source: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Chunk documents for better retrieval
    const chunks = [];
    
    for (const doc of args.documents) {
      const docChunks = chunkDocument(doc.content, 500); // 500 token chunks
      
      for (const chunk of docChunks) {
        chunks.push({
          toyId: args.toyId,
          content: chunk,
          metadata: {
            source: doc.source,
            type: 'document',
          },
        });
      }
    }
    
    // Add all chunks to knowledge base
    for (const chunk of chunks) {
      await ctx.runMutation(api.rag.addKnowledge, chunk);
    }
    
    return { processed: chunks.length };
  },
});

function chunkDocument(text: string, maxTokens: number): string[] {
  // Simple chunking by sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const chunks = [];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxTokens * 4) { // Rough token estimate
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += " " + sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  
  return chunks;
}
```

### Context Requirements
- Convex vector search documentation
- OpenAI embeddings best practices
- RAG chunking strategies

## Task 6: Implement Safety Features

### Objective
Implement comprehensive safety features for Guardian Mode.

### Implementation Steps

#### 6.1 Create Safety Module
```typescript
// convex/safety.ts
import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Content safety check
export const checkContent = action({
  args: {
    text: v.string(),
    level: v.union(v.literal("strict"), v.literal("moderate"), v.literal("relaxed")),
  },
  handler: async (ctx, args) => {
    // Use Azure Content Safety API or similar
    const safety = await checkWithAzureSafety(args.text);
    
    const thresholds = {
      strict: { harm: 2, inappropriate: 1 },
      moderate: { harm: 4, inappropriate: 3 },
      relaxed: { harm: 6, inappropriate: 5 },
    };
    
    const threshold = thresholds[args.level];
    const passed = safety.harm <= threshold.harm && 
                  safety.inappropriate <= threshold.inappropriate;
    
    if (!passed) {
      // Log safety incident
      await ctx.runMutation(api.safety.logIncident, {
        text: args.text,
        scores: safety,
        level: args.level,
      });
    }
    
    return {
      passed,
      reason: passed ? null : safety.reason,
      scores: safety,
    };
  },
});

// Get safe response for redirects
export const getSafeResponse = action({
  args: {
    reason: v.string(),
    voiceId: v.string(),
  },
  handler: async (ctx, args) => {
    const responses = {
      inappropriate: "That's an interesting question! Let's talk about something fun instead. What's your favorite game?",
      harmful: "Hmm, I think we should chat about something else. Want to hear a joke?",
      unknown: "I'm not sure about that. How about we play a word game?",
    };
    
    const text = responses[args.reason] || responses.unknown;
    
    // Generate audio for safe response
    const audio = await ctx.runAction(api.aiServices.synthesizeSpeech, {
      text,
      voiceId: args.voiceId,
    });
    
    return {
      text,
      audioData: audio.audioData,
      wasSafetyRedirect: true,
    };
  },
});
```

### Context Requirements
- Azure Content Safety API integration
- Safety threshold configurations
- Child-appropriate response templates

## Task 7: Testing and Integration

### Objective
Test the complete pipeline and ensure all components work together.

### Test Scenarios

#### 7.1 End-to-End Test Script
```python
# apps/raspberry-pi/tests/test_integration.py
import asyncio
import pytest
from unittest.mock import Mock, patch

from fastrtc_client import PommaiRTCClient, RTCConfig

@pytest.mark.asyncio
async def test_full_conversation_flow():
    """Test complete conversation flow from button press to audio response"""
    
    # Setup
    config = RTCConfig(
        convex_url="https://test.convex.cloud",
        ws_url="wss://test.pommai.co/rtc",
        device_id="test-device",
        toy_id="test-toy",
        auth_token="test-token",
        audio_config={'sampleRate': 16000, 'channels': 1, 'codec': 'opus'}
    )
    
    client = PommaiRTCClient(config)
    
    # Mock WebSocket connection
    with patch('websockets.connect') as mock_connect:
        mock_ws = Mock()
        mock_connect.return_value = mock_ws
        
        # Test connection
        assert await client.connect()
        assert client.is_connected
        
        # Test recording
        await client.start_recording()
        await asyncio.sleep(2)  # Simulate 2 seconds of recording
        await client.stop_recording()
        
        # Verify messages sent
        assert mock_ws.send.called
        
        # Test receiving audio response
        test_response = {
            'type': 'audio_chunk',
            'payload': {
                'data': 'deadbeef',  # Mock audio data
                'metadata': {'isFinal': True}
            }
        }
        
        await client.handle_message(test_response)

@pytest.mark.asyncio
async def test_toy_switching():
    """Test switching between different toy configurations"""
    # Implementation here
    pass

@pytest.mark.asyncio
async def test_offline_fallback():
    """Test offline mode when connection is lost"""
    # Implementation here
    pass

@pytest.mark.asyncio
async def test_safety_features():
    """Test Guardian Mode safety features"""
    # Implementation here
    pass
```

## Performance Optimization

### 1. Audio Pipeline Optimization
- Use Opus codec for 3-4x compression
- Stream audio in 20ms chunks
- Implement jitter buffer for network variance
- Pre-buffer TTS responses for smooth playback

### 2. Latency Reduction
- Target < 100ms WebSocket round-trip
- Parallel processing of STT/LLM/TTS when possible
- Use edge functions for audio processing
- Implement speculative TTS for common responses

### 3. Memory Management (Pi Zero 2W)
- Keep Python client under 100MB RAM
- Use circular buffers for audio
- Implement aggressive garbage collection
- Cache frequently used responses

## Deployment Steps

### 1. Deploy Convex Functions
```bash
cd apps/web
npx convex deploy
```

### 2. Configure Environment Variables
```env
# .env.local
CONVEX_URL=https://your-app.convex.cloud
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
OPENROUTER_API_KEY=...
FASTRTC_WS_URL=wss://pommai.co/rtc
```

### 3. Deploy to Raspberry Pi
```bash
# On Raspberry Pi
cd /home/pommai
git pull
pip install -r requirements.txt
sudo systemctl restart pommai.service
```

## Monitoring and Debugging

### 1. Logging
- Structured logging with levels
- Remote log aggregation
- Performance metrics tracking
- Error reporting

### 2. Debugging Tools
- Convex dashboard for function logs
- WebSocket message inspector
- Audio quality analyzer
- Latency profiler

## Phase 4 Deliverables

1. ✅ Convex Agent component integrated
2. ✅ FastRTC WebSocket gateway operational
3. ✅ AI services (Whisper, ElevenLabs, OpenRouter) connected
4. ✅ Python client updated for FastRTC
5. ✅ RAG system implemented with vector search
6. ✅ Safety features for Guardian Mode
7. ✅ End-to-end testing complete
8. ✅ Performance optimized for Pi Zero 2W
9. ✅ Documentation and deployment guides
10. ✅ Monitoring and debugging tools

## Next Steps

After completing Phase 4, the system will have:
- Real-time voice interaction with < 2s latency
- Intelligent responses with RAG-enhanced context
- Robust safety features for child interactions
- Scalable WebSocket architecture
- Production-ready deployment

Phase 5 will focus on:
- Advanced safety features and parental controls
- Multi-language support
- Community features and toy sharing
- Analytics and usage tracking
- Mobile app development
