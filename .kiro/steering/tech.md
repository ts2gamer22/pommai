# Technology Stack & Build System

## Build System
- **Monorepo Management**: Turborepo with pnpm workspaces
- **Package Manager**: pnpm 10+ (required)
- **Node Version**: 20+ (required)

## Common Commands

### Development
```bash
# Install all dependencies
pnpm install

# Run all apps in development
pnpm dev

# Run specific app
pnpm dev --filter @pommai/web
pnpm dev --filter @pommai/ui

# Start Convex development server (required for web app)
cd apps/web && npx convex dev
```

### Build & Production
```bash
# Build all packages
pnpm build

# Build specific app
pnpm build --filter @pommai/web

# Deploy Convex to production
cd apps/web && npx convex deploy
```

### Quality & Testing
```bash
# Lint all packages
pnpm lint

# Type checking
pnpm type-check

# Format code (Prettier)
pnpm format

# Python tests (Raspberry Pi)
cd apps/raspberry-pi && pytest tests/
```

## Frontend Stack (Web Platform)

### Core Framework
- **Next.js 15** with App Router and React Server Components
- **React 19** with concurrent features
- **TypeScript 5+** for type safety

### Backend & Database
- **Convex**: Real-time serverless database and functions
- **Better Auth**: Authentication system (@convex-dev/better-auth)
- **Convex Agent**: AI orchestration (@convex-dev/agent)

### UI & Styling
- **Custom RetroUI**: Component library in packages/ui
- **Tailwind CSS v4**: Utility-first styling
- **Framer Motion**: Animations and transitions
- **Radix UI**: Accessible component primitives

### State Management
- **Zustand**: Client-side state management
- **Convex React**: Real-time data synchronization

## Backend Services

### AI & ML Services
- **OpenRouter**: LLM inference (gpt-oss-120b primary, gpt-oss-20b fallback)
- **OpenAI**: Whisper STT and embeddings (Ada-002)
- **ElevenLabs**: Text-to-speech with custom voices
- **GuardrailsAI**: Content filtering and safety

### Infrastructure
- **Vercel**: Web platform hosting with edge network
- **Fly.io**: FastRTC Gateway deployment
- **Convex**: Serverless functions and real-time database

## Hardware Stack (Raspberry Pi)

### Platform
- **Raspberry Pi Zero 2W**: 512MB RAM, quad-core ARM Cortex-A53
- **DietPi OS**: Lightweight Linux (32-bit mandatory)
- **Python 3.9+**: Single language for simplicity

### Audio Hardware
- **ReSpeaker 2-Mics Pi HAT**: Dual microphones, LEDs, push-to-talk button
- **PyAudio**: Audio capture and playback
- **Opus Codec**: Audio compression for low latency

### Libraries & Dependencies
```python
# Core dependencies
websockets      # WebSocket client for Convex
pyaudio        # Audio I/O
opuslib        # Opus audio compression
RPi.GPIO       # Hardware control
vosk           # Wake word detection
sqlite3        # Local caching
asyncio        # Async programming
```

### Memory Optimization
- **Available RAM**: ~350-400MB after OS
- **Swap**: Increased to 1024MB
- **GPU Memory**: Set to 16MB (headless)
- **Target Usage**: <100MB for client application

## FastRTC Gateway

### Technology
- **Python 3.9+** with aiohttp for WebSocket server
- **WebRTC**: Real-time audio streaming
- **Cloudflare Calls**: TURN server for NAT traversal

### Key Features
- Stateless design for horizontal scaling
- Audio stream processing and relay
- TTS streaming with minimal latency
- Convex integration for backend communication

## Development Tools

### Code Quality
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Jest**: Testing framework (when needed)
- **Winston**: Logging (when needed)

### Deployment
- **Vercel**: Zero-config Next.js deployment
- **GitHub Actions**: CI/CD pipeline
- **Docker**: Containerization for services

## Environment Variables

### Web Platform (.env.local)
```bash
NEXT_PUBLIC_CONVEX_URL=        # Convex deployment URL
CONVEX_DEPLOY_KEY=             # Convex deployment key
OPENAI_API_KEY=                # OpenAI services
ELEVENLABS_API_KEY=            # Voice synthesis
OPENROUTER_API_KEY=            # LLM inference
BETTER_AUTH_SECRET=            # Authentication
```

### FastRTC Gateway (.env)
```bash
CONVEX_URL=                    # Convex deployment URL
CONVEX_DEPLOY_KEY=             # Convex deployment key
ELEVENLABS_API_KEY=            # TTS streaming
CLOUDFLARE_TURN_KEY_ID=        # WebRTC TURN
CLOUDFLARE_TURN_KEY_API_TOKEN= # WebRTC TURN
```

## Performance Targets
- **Web Platform**: <100ms page loads, real-time data sync
- **Audio Pipeline**: <2s end-to-end latency (STT→LLM→TTS)
- **Hardware**: <100MB RAM usage on Pi Zero 2W
- **Network**: Opus compression for 80% bandwidth reduction