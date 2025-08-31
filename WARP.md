# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

Pommai is an AI-powered smart toy platform with multiple components:
- **Web Application** (`apps/web`) - Next.js 15 app with Convex backend, admin dashboard, and toy configuration
- **Raspberry Pi Client** (`apps/raspberry-pi`) - Python client for hardware devices with voice interaction
- **FastRTC Gateway** (`apps/fastrtc-gateway`) - Python WebRTC gateway server for real-time audio streaming
- **UI Components** (`packages/ui`) - Shared React component library

## Common Development Commands

### Initial Setup
```bash
# Install dependencies for all workspaces
pnpm install

# Set up environment variables
cp apps/web/.env.local.example apps/web/.env.local
# Edit apps/web/.env.local with your API keys
```

### Development
```bash
# Run all apps in development mode
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

# Start production server
pnpm start --filter @pommai/web
```

### Testing & Quality
```bash
# Run linting across all packages
pnpm lint

# Type checking
pnpm type-check

# Format code
pnpm format

# Run Python tests for Raspberry Pi client
cd apps/raspberry-pi && pytest tests/

# Run specific Python test
pytest tests/test_fastrtc.py -v
```

### Clean & Reset
```bash
# Clean build artifacts
pnpm clean

# Full reset (removes node_modules)
pnpm clean && rm -rf node_modules && pnpm install
```

## Architecture Overview

### Backend Architecture (Convex)

The Convex backend (`apps/web/convex/`) serves as the central data layer and API:

- **Authentication** (`auth.ts`, `auth.config.ts`) - Better Auth integration for user management
- **AI Pipeline** (`aiPipeline.ts`, `aiServices.ts`) - Orchestrates STT, LLM, and TTS services
- **Agents** (`agents.ts`) - AI agent framework for toy personalities using Convex Agent SDK
- **Conversations** (`conversations.ts`, `messages.ts`) - Message history and thread management
- **Toys** (`toys.ts`) - Toy configuration, personalities, and behaviors
- **Knowledge Base** (`knowledge.ts`, `knowledgeBase.ts`) - Vector search for toy-specific knowledge
- **Children** (`children.ts`) - Child profiles and parental controls
- **Voices** (`voices.ts`) - Voice synthesis configuration using ElevenLabs

### Frontend Architecture (Next.js)

The web app uses:
- **App Router** with React Server Components
- **Convex React hooks** for real-time data synchronization
- **Zustand** for client state management
- **Tailwind CSS v4** with custom retro UI theme
- **Framer Motion** for animations

### Hardware Integration

The Raspberry Pi client communicates via:
1. **FastRTC Gateway** - WebRTC for low-latency audio streaming
2. **Convex WebSocket** - For control messages and state synchronization
3. **Opus codec** - Audio compression for efficient bandwidth usage

### AI Service Integration

The platform integrates multiple AI services:
- **OpenAI Whisper** - Speech-to-text (via OpenAI API or local model)
- **OpenRouter** - LLM access (gpt-oss-120b model)
- **ElevenLabs** - Text-to-speech with custom voices
- **Azure Content Safety** (optional) - Enhanced content filtering

## Key Environment Variables

Required for `apps/web/.env.local`:
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `CONVEX_DEPLOY_KEY` - Convex deployment key
- `OPENAI_API_KEY` - For Whisper STT and embeddings
- `ELEVENLABS_API_KEY` - For voice synthesis
- `OPENROUTER_API_KEY` - For LLM inference
- `BETTER_AUTH_SECRET` - Authentication secret

## Convex Development

### Running Convex Functions
```bash
# Run a query
npx convex run toys:list

# Run a mutation with arguments
npx convex run messages:send '{"content": "Hello", "threadId": "..."}'

# Watch logs
npx convex logs --watch

# Export data
npx convex export --path ./backup.zip
```

### Common Convex Patterns

The codebase uses Convex helpers for:
- **CRUD operations** with `crud` helper from convex-helpers
- **Zod validation** for all function arguments
- **Vector search** for knowledge base queries
- **File storage** for audio and images

## Raspberry Pi Development

### Setting Up a Device
```bash
cd apps/raspberry-pi
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure device
cp .env.example .env
# Edit .env with device credentials

# Test hardware
python tests/test_audio.py
python tests/test_leds.py

# Run client
python src/pommai_client_fastrtc.py
```

### Remote Deployment
```bash
cd apps/raspberry-pi/scripts
./deploy.sh pi@192.168.1.100
```

## FastRTC Gateway

### Running the Gateway
```bash
cd apps/fastrtc-gateway
pip install -r requirements.txt
python server.py
```

The gateway provides:
- WebRTC signaling server
- Audio stream processing
- AI model orchestration
- Convex integration

## Monorepo Structure

This is a pnpm workspace monorepo managed by Turborepo:
- **Root commands** affect all packages
- Use `--filter` flag to target specific packages
- Dependencies between packages are automatically resolved
- Shared configuration in `packages/config/`

## Database Schema

Key Convex tables:
- `users` - User accounts and profiles
- `children` - Child profiles linked to users
- `toys` - Toy configurations and personalities
- `threads` - Conversation threads
- `messages` - Individual messages in threads
- `knowledgeBase` - Vector-indexed knowledge documents
- `devices` - Registered Raspberry Pi devices

## Security Considerations

- All device-to-cloud communication uses token authentication
- Guardian mode enforces strict content filtering
- Audio streams are encrypted via WSS/HTTPS
- Sensitive environment variables must never be committed
- Child safety is enforced at multiple layers (client, gateway, and backend)

## Performance Optimization

The platform optimizes for:
- **Low latency** - WebRTC for <200ms audio round-trip
- **Efficient streaming** - Opus codec reduces bandwidth by 80%
- **Edge caching** - Convex's global edge network
- **Optimistic updates** - UI updates before server confirmation
- **Background processing** - Audio processing in separate threads

## Common Issues & Solutions

### Convex connection errors
- Ensure `npx convex dev` is running
- Check NEXT_PUBLIC_CONVEX_URL in .env.local

### Audio streaming issues
- Verify FastRTC gateway is running
- Check firewall allows WebRTC ports
- Test with `apps/raspberry-pi/tests/test_audio_streaming.py`

### Type errors after schema changes
- Run `npx convex codegen` to regenerate types
- Restart TypeScript server in your IDE

### Raspberry Pi audio problems
- Check ALSA configuration with `arecord -l`
- Verify ReSpeaker HAT drivers are installed
- Test with `apps/raspberry-pi/tests/test_audio.py`
