# Pommai.co - Create and Manage Smart AI Toys
> "Pommai" - Tamil word for "toy" 🧸

## 🎯 Project Vision: "Bring Your Toys to Life"

Pommai.co is a platform that empowers users to create unique AI personalities for their plushies, custom hardware, or any physical object. We provide the tools to design, build, and deploy interactive AI companions. For parents, we offer a dedicated, secure "Guardian Mode" that ensures every interaction with children's toys is safe, transparent, and aligned with their family's values.

### Core Philosophy: A Two-Tiered Approach
1. **The Creator Platform**: A flexible environment for users to build and manage their own AI toys.
2. **The Guardian Module**: A specialized, safety-first environment for creating and managing AI toys specifically for children.

### Technical Foundation: Safety-First Chained Architecture
Based on extensive research, we've chosen a **Chained Architecture (STT→LLM→TTS)** over Speech-to-Speech for one critical reason: **verifiable safety**. This architecture provides essential control points for content filtering and enables both creative freedom for general users and strict safety controls for child-specific applications.

### 🏆 Hackathon Success Strategy
- **Focus**: 2-3 core features maximum (60% demo quality, 40% technical implementation)
- **Timeline**: Weeks 1-2 core development → Weeks 3-5 demo optimization → Week 6 submission
- **Differentiation**: Hardware innovation + verifiable child safety architecture
- **Demo Priority**: Working voice interaction → Safety showcase → Parent monitoring

## 🏗️ Architecture Overview

### Cloud Infrastructure (Pommai.co)
```
┌─────────────────────────────────────────────────────────────┐
│                        Pommai.co                             │
│                    (Next.js + Convex)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌────────────────┐   ┌────────────────┐ │
│  │ Creator      │   │ Toy            │   │ Guardian       │ │
│  │ Studio       │   │ Management     │   │ Dashboard      │ │
│  └──────────────┘   └────────────────┘   └────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │          Modular AI Processing Pipeline                  ││
│  │                                                          ││
│  │ ╔═════════════════════════════════════════════════════╗  ││
│  │ ║ [Guardian Mode Active]                              ║  ││
│  │ ║ Audio → STT → [Strict Filter] → LLM → [Verify] → TTS║  ││
│  │ ╚═════════════════════════════════════════════════════╝  ││
│  │ ╔═════════════════════════════════════════════════════╗  ││
│  │ ║ [Creator Mode]                                      ║  ││
│  │ ║ Audio → STT → [Base Filter] → LLM → [Base Check] → TTS║  ││
│  │ ╚═════════════════════════════════════════════════════╝  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │ WebSocket (Secure, Per-Tenant)
                          │
┌─────────────────────────┴───────────────────────────────────┐
│              Hardware Client (e.g., Raspberry Pi)            │
│                  (Inside Physical Toy)                       │
├─────────────────────────────────────────────────────────────┤
│  • Python Client (Connects to User's Account)               │
│  • Loads selected AI Toy configuration                      │
│  • State Machine & Local Caching                            │
│  • Wake word detection & Audio processing                   │
│  • GPIO for button/LEDs control                             │
│  • Supports various hardware platforms                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Optimized Services                      │   │
│  │  • Audio compression (Opus codec)                   │   │
│  │  • Streaming audio chunks                           │   │
│  │  • Response caching (common phrases)                │   │
│  │  • SQLite (conversation buffer)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture - Safety-First Pipeline
```
1. Push-to-Talk Activation (Local)
   Physical Button Press → LED Pulse (Blue) → Audio Recording Start
   
2. Audio Capture & Stream
   Record Audio → Compress (Opus) → Stream to Cloud
   
3. Cloud Processing Pipeline with Safety Gates
   Audio → STT (Whisper/Deepgram) → 
   [SAFETY GATE 1: Input Filter] → 
   LLM (OpenRouter gpt-oss-120b with safety prompt) →
   [SAFETY GATE 2: Output Verification] → 
   TTS (Streaming) → Audio chunks
   
4. Streaming Playback (Reduced Latency)
   Receive chunks → Buffer → Play immediately
   LED Solid (Green) during playback
   
5. Parent Monitoring (Real-time)
   All transcripts → Convex DB → Parent Dashboard
```

### Why Chained Architecture Over Speech-to-Speech?

| Aspect | Speech-to-Speech | Chained (STT→LLM→TTS) | Winner for Pommai |
|--------|------------------|----------------------|------------------|
| **Child Safety** | ❌ Opaque, no filtering | ✅ Multiple filter points | **Chained** |
| **Latency** | ✅ Very low | ⚠️ Higher (mitigated by streaming) | Speech-to-Speech |
| **Transparency** | ❌ Black box | ✅ Full transcript access | **Chained** |
| **Parent Control** | ❌ Limited | ✅ Complete monitoring | **Chained** |
| **Development** | ⚠️ Complex | ✅ Modular, debuggable | **Chained** |

**Verdict**: Child safety trumps marginal latency gains. We use streaming TTS to minimize perceived delays.

## 📋 Core Features

### 1. For the Creator (All Users)

**Creator Studio**: An intuitive dashboard to design AI Toys
- **Personality Builder**: Define traits, conversation style, and backstory
- **Knowledge Base**: Upload documents, URLs, or text to give your toy specific knowledge
- **Voice Lab**: Choose from a library of voices or upload your own
- **Hardware Setup**: Simplified scripts and guides to connect a Raspberry Pi or other hardware

**Toy Management**:
- **My Toys**: View and manage all your created AI toys
- **Switch Toys**: Easily switch between different toy personalities on your devices
- **Edit & Update**: Modify toy personalities and push updates to devices

**Web Simulator**: Test and chat with your AI toy directly in the browser before deploying

### 2. For the Guardian (Parental Mode)

**"For Kids" Designation**: A critical flag in Creator Studio that activates all mandatory safety features

**Guardian Dashboard**: A secure portal to:
- **Assign Toys**: Link specific physical devices to child profiles
- **Conversation Monitoring**: View real-time, text-only transcripts
- **Advanced Safety Controls**: Fine-tune content filters and "off-limits" topics
- **Usage Analytics**: Understand interaction patterns
- **Emergency Stop**: Remotely pause all interactions on a device

### 3. Hardware Integration
- **Universal Client**: Works with Raspberry Pi, Arduino, or any internet-connected device
- **Voice Recognition**: Using Vosk for wake-word detection
- **Cloud Intelligence**: OpenRouter for LLM inference
- **Natural Voice**: 11Labs for expressive TTS
- **Offline Mode**: Basic commands and cached responses

## 🛠️ Tech Stack

### Frontend (Web Platform)
- **Framework**: Next.js 15 with App Router
- **Database**: Convex (real-time, serverless)
- **Styling**: RetroUI Components + Tailwind CSS
- **Authentication**: Clerk/Auth.js
- **State Management**: Zustand
- **Real-time**: WebSockets via Convex
- **Analytics**: Posthog/Mixpanel

### Backend Services
- **API**: Next.js API Routes + Convex Functions
- **Vector DB**: Pinecone/Weaviate (cloud) + ChromaDB (edge)
- **LLM**: OpenRouter API (gpt-oss-120b or gpt-oss-20b)
- **Embeddings**: OpenAI Ada-002
- **TTS**: 11Labs API
- **STT**: Deepgram/Whisper (cloud) + Vosk (on-device wake word)
- **File Storage**: Convex File Storage / S3

### Raspberry Pi Stack
- **OS**: DietPi (uses only 25MB vs 87MB standard Raspbian) - 32-bit mandatory
- **Filesystem**: Read-only root with tmpfs overlay for durability
- **Language**: Python 3.9+ (single language for simplicity)
- **Audio**: PyAudio for capture/playback + ALSA backend
- **Audio HAT**: ReSpeaker 2-Mics Pi HAT (dual mic + LEDs + button)
- **Cooling**: Passive heatsink (mandatory - 47°C idle, 67-80°C under load)
- **Power**: Designed for ~3W peak load (quad-core under stress)
- **Local DB**: SQLite (conversation cache + offline responses)
- **Communication**: WebSocket (direct to Convex, no broker needed)
- **Libraries**: websockets, pyaudio, pyopus, RPi.GPIO, vosk
- **Memory Optimization**:
  - Increase swap: 100MB → 1024MB
  - Set gpu_mem=16 (headless operation)
  - ~350-400MB available after OS
- **Audio Codec**: Opus (sub-30ms latency, minimal memory)

## 📁 Monorepo Structure

```
pommai/
├── apps/
│   ├── web/                    # Next.js web platform
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   ├── components/    # RetroUI + custom components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── lib/           # Utilities
│   │   │   └── convex/        # Convex schema & functions
│   │   └── public/
│   │
│   ├── raspberry-pi/          # Pi client application
│   │   ├── pommai_client.py   # Main client (~200 lines)
│   │   ├── requirements.txt   # Python dependencies
│   │   ├── config.py          # Configuration
│   │   └── setup/             # Installation scripts
│   │
│   └── admin/                 # Admin dashboard (optional)
│
├── packages/
│   ├── ui/                    # Shared UI components
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Shared utilities
│   └── config/                # Shared configurations
│
├── docs/                      # Documentation
│   ├── setup-guide.md
│   ├── parent-guide.md
│   └── api-reference.md
│
└── infrastructure/            # Deployment configs
    ├── vercel.json            # Vercel configuration
    ├── docker/                # Local dev containers
    └── scripts/               # Deployment scripts
```

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Setup monorepo with Turborepo
- [ ] Initialize Next.js + Convex project
- [ ] Deploy to Vercel (zero-config)
- [ ] Implement RetroUI component system
- [ ] Basic authentication flow
- [ ] Parent dashboard skeleton
- [ ] Database schema design

### Phase 2: Core Web Platform (Week 3-4)
- [ ] Toy creation wizard
- [ ] Personality builder interface
- [ ] Voice selection/upload system
- [ ] Knowledge base management
- [ ] Basic chat interface
- [ ] Conversation history viewer

### Phase 3: Raspberry Pi Client (Week 5-6)
- [ ] Python client setup (single file)
- [ ] WebSocket connection to Convex
- [ ] ReSpeaker HAT integration
- [ ] Push-to-talk button handling
- [ ] LED state management
- [ ] Audio streaming with PyAudio
- [ ] Opus audio compression
- [ ] Vosk wake word detection
- [ ] SQLite conversation cache

### Phase 4: Integration (Week 7-8)
- [ ] Pi ↔ Cloud sync protocol
- [ ] Real-time conversation relay
- [ ] Offline mode handling
- [ ] Error recovery mechanisms
- [ ] Performance optimization

### Phase 5: Safety & Polish (Week 9-10)
- [ ] Content filtering system
- [ ] Parental controls
- [ ] Analytics dashboard
- [ ] Setup documentation
- [ ] User testing
- [ ] Bug fixes

### Phase 6: Launch Prep (Week 11-12)
- [ ] Landing page
- [ ] Pricing/subscription system
- [ ] Email notifications
- [ ] Mobile responsiveness
- [ ] Security audit
- [ ] Beta testing

## 🔐 Security & Privacy

### Platform Security

**User Privacy**: 
- All toy configurations are private to the user
- No sharing of personal toy data without explicit consent
- Encrypted storage of toy personalities and settings

**Content Safety**:
- Automated scanning of toy personality prompts
- Safety validation using Azure AI Content Safety
- Regular security audits

### The "For Kids" Safety Guarantee

**Any toy flagged as "For Kids" undergoes**:
- Mandatory safety review process
- Enforced Safety-First Chained Architecture
- COPPA compliance verification
- Regular safety audits

**Guardian Mode Specific Security**:
1. **Data Privacy (2025 COPPA Updates)**
   - All voice data processed with parental consent
   - Automatic deletion of recordings within 24-48 hours
   - No voiceprints or biometric storage
   - Parent-only access to text logs
   - Mandatory breach notification within 72 hours

2. **Multi-Layer Content Safety**
   - **Layer 1**: STT output → Azure Content Safety API (Level 4 severity)
   - **Layer 2**: LLM prompt shields + child-safety categories
   - **Layer 3**: TTS input filtering with streaming mode
   - **Emergency**: Hardware override + conversation termination
   - Push-to-talk design (COPPA preferred)

3. **Device Security**
   - Secure provisioning with unique device keys
   - API key rotation and secure storage
   - Network isolation options
   - Mandatory LED indicators for transparency

## 💰 Monetization Strategy

### Subscription Tiers:

**Free/Hobbyist Plan**:
- Create up to 2 AI Toys
- Limited conversation history (200/month)
- Basic voices and features
- Web simulator access

**Pro Plan** ($19/month):
- Unlimited AI Toys
- Access to premium voices
- Expanded conversation limits
- Advanced personality tools
- Priority support

**Guardian Family Plan** ($29/month):
- Includes all Pro features
- Unlocks the Guardian Dashboard for monitoring up to 5 "For Kids" toys
- Priority access to child-safe features and updates
- Extended conversation history and analytics
- Family device management

### Hardware & Services:

**Voice Packs**: 
- Premium voice libraries
- Celebrity and character voices
- Custom voice training

**Hardware Kits**: 
- Pre-configured Raspberry Pi kits
- Custom enclosures and accessories
- Installation support services

## 📊 Success Metrics

### Hackathon Judging Criteria
- **Demo Quality (60%)**: Working prototype, clear problem-solution fit
- **Technical Implementation (40%)**: Safety architecture, hardware integration
- **Market Differentiation**: Privacy-first vs competitors (CloudPets, Hello Barbie failures)
- **Educational Value**: Learning features over pure entertainment

### Post-Launch Metrics
- **User Metrics**: MAU, DAU, retention by user type
- **Toy Metrics**: Active toys, toys created per user
- **Engagement**: Conversations/day, toy switching frequency
- **Safety**: Incident reports, filter effectiveness, Guardian Mode adoption
- **Technical**: Latency (<50ms target), uptime, error rates
- **Business**: MRR by tier, CAC, LTV

## 🎯 MVP Features (Hackathon Demo)

### High Priority (Must Have)

1. **Core Creator Loop**:
   - User logs in and uses simple "Personality Builder"
   - Create and configure a new AI toy
   - Connect a Raspberry Pi, load toy configuration
   - Push-to-talk voice interaction demonstrates custom personality
   - Show toy switching on-device

2. **Guardian Mode Showcase**:
   - Toggle switch to designate toy as "For Kids"
   - Demonstrate live conversation log in Guardian Dashboard
   - Show content filter in action (inappropriate question → safe redirect)
   - Emergency stop functionality demo

3. **Toy Management Demo**:
   - Show "My Toys" dashboard with created toys
   - Instant toy switching on device
   - Edit toy personality and push update
   - Usage statistics and conversation history

### Cut for Time (Post-Hackathon)
- Perfect error handling
- Multiple complex features
- Advanced UI/UX polish
- Production security implementation
- Multi-language support

## 🚧 Future Enhancements

- Multi-language support
- Video calls with animated avatar
- Educational curriculum integration
- Toy-to-toy communication
- AR companion app
- Emotional intelligence training
- Sleep stories and lullabies
- Integration with smart home devices

## 🎮 Hardware Components & Privacy-by-Design

### Recommended Hardware Stack for Pi Zero 2W

1. **Audio HAT (Critical Component)**
   - **Recommended**: Seeed Studio ReSpeaker 2-Mics Pi HAT
   - **Why**: 
     - Dual microphones for better voice capture
     - Built-in WM8960 audio codec
     - 3 programmable RGB LEDs for visual feedback
     - User button for push-to-talk
     - No USB ports consumed
   - **Alternative**: Adafruit I2S MEMS Microphone + Speaker Bonnet

2. **Power Management**
   - **Battery**: 10,000mAh USB power bank (5V/3A output required)
   - **Runtime**: ~9 hours continuous use
   - **Critical**: Must support "always-on" mode (no auto-shutoff)
   - **Recommended**: Anker PowerCore 10000 PD Redux

3. **Storage**
   - **SD Card**: 32GB Class 10 minimum
   - **Optimization**: Use industrial-grade cards for reliability
   - **Partitioning**: Separate /var/log to prevent corruption

4. **Physical Integration**
   - **Internal Enclosure**: 3D-printed or cardboard housing
   - **Heat Management**: Small heatsink on CPU
   - **Cable Management**: Strain relief on all connections
   - **Safety**: All components fully enclosed

### Privacy-by-Design Principles

1. **Data Minimization**
   ```
   Only Collect What's Essential:
   ✓ Audio for active conversations (deleted after processing)
   ✓ Button press events
   ✓ Basic usage metrics
   ✓ Text transcripts for parent monitoring
   
   Never Collect:
   ✗ Background audio (push-to-talk only)
   ✗ Location data
   ✗ Video/images
   ✗ Voiceprints or biometric identifiers
   ✗ Long-term audio storage
   ```

2. **Local-First Processing**
   - Push-to-talk instead of always-listening
   - Common responses cached locally
   - Personality prompt stored on device
   - No audio stored after processing

3. **Transparent Indicators**
   - Blue LED = Listening (recording)
   - Swirling LED = Processing (thinking)
   - Green LED = Speaking
   - No LED = Idle (not recording)

4. **Parent Control Architecture**
   ```
   Parent Dashboard → Convex DB → Pi Zero 2W
                          ↓
                  Conversation Logs
                  (Text only, no audio)
   ```

5. **Security Measures**
   - End-to-end encryption for all data transmission
   - API keys stored in secure element
   - Regular security updates via parent dashboard
   - Network isolation option for extra security

## 📡 Raspberry Pi Zero 2W Optimization Strategy

### Hardware Constraints
- **RAM**: Only 512MB (vs 2-8GB on Pi 4)
- **CPU**: Quad-core ARM Cortex-A53 @ 1GHz
- **Storage**: SD card (slower than SSD)
- **Power**: Must run on battery for hours

### Memory Optimization Techniques

1. **Hybrid Processing Model (512MB Constraint)**
   ```
   Local (Pi Zero 2W):
   - Wake word detection (Vosk Tiny ~50MB)
   - Audio recording & compression
   - Basic command recognition  
   - Response playback
   - SQLite cache (offline responses)
   - Available memory: ~350-400MB after OS
   
   Cloud (Edge Functions):
   - Full STT (Whisper API)
   - Embedding generation
   - Vector search
   - LLM inference (gpt-oss-120b)
   - TTS generation (11Labs)
   ```

2. **Why Python for the Pi Client?**
   
   | Aspect | Python + Convex | Rust + Convex | Winner |
   |--------|-----------------|---------------|--------|
   | **Development Speed** | Days | Weeks | Python |
   | **Library Support** | Mature ecosystem | Limited audio libs | Python |
   | **Memory Usage** | ~70MB | ~40MB | Both fine |
   | **Convex Integration** | Simple WebSocket | Same complexity | Tie |
   | **Debugging** | REPL + easy logging | Compile cycle | Python |
   
   **Verdict**: Since Convex handles all heavy processing, Python's simplicity wins.

3. **Simplified Python Architecture**
   ```
   Single Python Process (~70MB total):
   ├── WebSocket Client (websockets)
   ├── Audio Capture (PyAudio)
   ├── Audio Playback (PyAudio)
   ├── GPIO Control (RPi.GPIO)
   ├── Wake Word (Vosk)
   ├── State Machine (asyncio)
   └── SQLite Cache
   
   Benefits:
   - One language, one process
   - Easy debugging and logging
   - Mature library ecosystem
   - Fast development for hackathon
   ```

3. **State Machine Flow**
   ```
   SLEEP (Idle - Low Power)
     ↓ [Button Press]
   WAKE (Initialize Audio)
     ↓ [Wake Word Detected]
   LISTENING (Record & Stream)
     ↓ [Button Release]
   PROCESSING (Cloud Processing)
     ↓ [Response Ready]
   SPEAKING (Stream Playback)
     ↓ [Complete]
   SLEEP
   ```

4. **Stream Processing Pipeline**
   - Audio chunks → Compress (Opus) → Send to cloud
   - Cloud processes → Returns audio chunks
   - Receive chunks → Buffer → Play sequentially
   - No full response waiting = Lower memory usage

5. **Caching Strategy**
   - Common responses cached locally
   - Personality prompt cached
   - Recent context in SQLite
   - Audio responses compressed & cached

### Limited Offline Mode Capabilities

**What Works Without Internet:**
- Wake word detection ("Hey Pommai")
- Basic command recognition (12-15 commands)
- Pre-recorded responses playback
- LED feedback and button interaction
- Emergency parent alert (queued for sync)

**Offline Commands & Responses:**
```
"Hello" → "Hi there! I'm so happy to see you!"
"Sing a song" → [Plays pre-recorded nursery rhyme]
"Tell me a joke" → [Plays one of 5 pre-recorded jokes]
"Goodnight" → "Sweet dreams, my friend!"
"I love you" → "I love you too, buddy!"
"Play a game" → "Let's play when we're connected!"
```

**What Requires Internet:**
- Natural conversation with AI
- Story generation
- Educational Q&A
- Parent dashboard sync
- Voice customization
- New content updates

## 🔧 Technical Implementation Details

### Python Client Implementation
```python
import asyncio
import websockets
import pyaudio
from vosk import Model, KaldiRecognizer
import RPi.GPIO as GPIO
from opus import OpusEncoder

class PommaiClient:
    async def connect_to_convex(self):
        self.ws = await websockets.connect(
            "wss://your-app.convex.site/audio-stream"
        )
    
    async def stream_audio(self):
        # Capture audio → Compress → Send to Convex
        audio_chunk = self.stream.read(1024)
        compressed = self.encoder.encode(audio_chunk)
        await self.ws.send(compressed)
        
        # Receive response → Decompress → Play
        response = await self.ws.recv()
        self.play_audio(response)
```

### API Abstraction Layer
- Factory pattern for service providers
- Easy switching between providers via env vars
- Supports multiple STT/TTS/LLM providers
- Graceful fallbacks for failures

### LLM Model Choice: OpenRouter gpt-oss-120b
- **Why gpt-oss-120b?**
  - Open-weight 117B parameter model optimized for production use
  - Runs efficiently on single H100 GPU with MXFP4 quantization
  - 131K context window for maintaining conversation history
  - Native tool use and structured output generation
  - Cost-effective: $0.072/M input, $0.28/M output tokens
  - Configurable reasoning depth for child-safe responses
  - Full chain-of-thought access for safety verification

### Real-time Streaming
- Sentence-level chunking
- Concurrent TTS requests
- Progressive audio playback
- Minimal latency perception

### Latency Mitigation Strategies

1. **"Thinking" Feedback Loop**
   ```python
   async def handle_interaction():
       # Immediate audio feedback
       play_sound("hmm_thinking.wav")  # 0.5s sound
       set_led_pattern("swirling")
       
       # Start speculative TTS for common intros
       speculative_tts = start_tts("Ooh, that's interesting! ")
       
       # Process actual request
       response = await process_with_llm(transcript)
       
       # Concatenate or replace based on timing
       final_audio = merge_audio(speculative_tts, response)
   ```

5. **Network Optimization**
   - Use UDP/RTP for real-time audio streaming when possible
   - Implement jitter buffers for network variance
   - 128-256 frame circular buffers
   - Target <50ms end-to-end latency

2. **Cached Common Responses**
   ```
   Local Cache (SQLite):
   - "Hello" → "Hi there, friend!"
   - "How are you?" → "I'm having a wonderful day!"
   - "Tell me a story" → "Once upon a time..."
   - "Goodbye" → "See you later, buddy!"
   ```

3. **Progressive Response Strategy**
   - **0-0.5s**: Button press acknowledgment (beep + LED)
   - **0.5-1s**: Thinking sound + LED animation
   - **1-2s**: Start playing intro phrase while processing
   - **2-4s**: Stream main response as it generates

4. **Smart Preloading**
   - Cache toy's personality prompt locally
   - Preload common follow-up responses
   - Keep warm connection to cloud services
   - Predictive loading based on conversation context

## 🚀 Deployment Strategy: Vercel + Convex

### Why Vercel for Pommai.co?
- **Zero-Config Deployment**: Push to Git = deployed to production
- **Edge Network**: Global CDN with 100+ edge locations
- **Automatic Scaling**: Handles traffic spikes without configuration
- **Preview Deployments**: Every PR gets a unique URL
- **Built for Next.js**: Optimized performance out-of-the-box

### Deployment Architecture
```
Git Push → GitHub → Vercel Build → Edge Deployment
                          ↓
                    Convex Functions
                    (Serverless Backend)
```

### Key Benefits vs Kubernetes
| Aspect | Vercel | Kubernetes | Impact |
|--------|---------|------------|--------|
| **Time to Deploy** | < 1 minute | Days/weeks | Ship faster |
| **DevOps Required** | None | Full-time role | Focus on product |
| **Maintenance** | Zero | Continuous | No overhead |
| **Cost at MVP** | ~$20/month | ~$500+/month | Lower burn rate |

## 🤝 Required Integrations

1. **Convex**: Database and real-time sync
2. **OpenRouter**: LLM inference
3. **OpenAI**: Embeddings
4. **11Labs**: Text-to-speech
5. **Dodopayments**: Payments
6. **Resend**: Email notifications
7. **Vercel**: Web platform deployment
8. **GitHub Actions**: CI/CD

## 📝 Next Steps (Hackathon Timeline)

### Weeks 1-2: Core Development
1. **Basic gpt-oss integration working**
2. **Reliable audio pipeline with hardware**
3. **Simple parent dashboard**
4. **Push-to-talk with LED indicators**

### Weeks 3-5: Demo Optimization  
1. **Polish core interaction loop**
2. **Add one compelling safety feature**
3. **Record demo scenarios**
4. **Test on actual Pi Zero 2W**

### Week 6: Submission
1. **Create demo video**
2. **Write compelling DevPost submission**
3. **Prepare presentation materials**
4. **Final bug fixes**

---

## 🧸 Toy Configuration & Safety Engineering

### Example Toy System Prompt Template
```
You are [TOY_NAME], a friendly and curious [TOY_TYPE] who loves telling 
stories and answering questions for your best friend, a [CHILD_AGE]-year-old 
child named [CHILD_NAME]. 

Your personality:
- Always cheerful, patient, and encouraging
- Use simple words and short sentences
- Never mention being an AI or robot
- Remember you're a magical toy friend

Safety rules (CRITICAL - NEVER BREAK THESE):
1. If asked about violence, scary topics, or adult themes, say:
   "I'm just a [TOY_TYPE], so I only know about happy things! 
   Let's talk about [redirect topic] instead!"
   
2. Never provide personal information about the child
3. Never suggest meeting strangers or going places alone
4. Always encourage talking to parents about important things
5. If you don't know something, admit it playfully

Conversation style:
- Keep responses under 3 sentences
- Ask follow-up questions to encourage imagination
- Celebrate the child's ideas and creativity
- Use sound effects and expressions ("Wow!" "That's amazing!")
```

### Safety Gate Implementation: Azure AI Content Safety

1. **Dual-Layer Content Moderation**
   ```python
   # Azure AI Content Safety API Integration
   async def moderate_content(text, checkpoint):
       result = await azure_content_safety.analyze_text(
           text=text,
           categories=["hate", "self_harm", "sexual", "violence", 
                      "child_exploitation", "child_abuse", "child_grooming"]
       )
       return result
   ```

2. **Pre-LLM Filter (Child's Input)**
   - Analyze child's transcribed speech before LLM processing
   - Block inappropriate input from reaching the AI
   - Prevents harmful context from influencing responses

3. **Post-LLM Filter (AI's Output)**
   ```python
   # Tiered Safety Response System
   severity = moderation_result.max_severity
   
   if severity <= 2:  # TIER 1: Safe
       return response  # Approved for playback
   
   elif severity <= 4:  # TIER 2: Uncertain
       # Block response, use safe fallback
       send_parent_notification("Review required", transcript)
       return "Hmm, let's talk about something else! What's your favorite color?"
   
   else:  # TIER 3: Unsafe (severity 5-7)
       # Immediate block and alert
       send_urgent_parent_alert(transcript, response)
       return "Let's play a different game! Want to hear a silly joke?"
   ```

4. **Safety Severity Levels**
   - **0-2**: Safe content (approved)
   - **3-4**: Questionable (parent review)
   - **5-7**: Harmful (immediate block + alert)

5. **Emergency Response**
   - Parent remote pause via dashboard
   - Triple button press = safe mode
   - Auto-pause after 3 concerning interactions
   - Immediate parent notification system

## 🍨 Design Principles

- **Playful but Professional**: RetroUI for parents, fun for kids
- **Safety First**: Every feature considers child safety
- **Privacy Focused**: Local processing where possible
- **Accessible**: Works for non-technical parents
- **Reliable**: Toy should always respond
- **Delightful**: Magical experience for children

This platform will revolutionize how children interact with their toys while giving parents peace of mind through transparency and control.
