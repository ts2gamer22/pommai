# 🧸 Pommai - AI-Powered Companions for Children : Submission for Devpost Kiro Hackathon



<p align="center">
  <strong>Where Physical Toys Meet Generative AI - Safely</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## 🌟 About The Project

Pommai is an innovative platform for creating safe, interactive, and intelligent AI companions for children. It bridges the gap between physical toys and the world of generative AI, allowing parents and creators to design unique personalities, voices, and knowledge bases for plushies and other toys.

The platform is built with two core philosophies: **empowering creativity** and **ensuring uncompromising safety**.

### For Creators
The Creator Studio provides a powerful, intuitive interface to design every aspect of an AI's personality, from its core traits and speaking style to its custom knowledge, creating a truly unique companion.

### For Parents
Guardian Mode offers a suite of robust safety features, including real-time conversation monitoring, multi-layer content filtering, time limits, and detailed analytics, giving parents complete peace of mind.

### How It Works
At its heart, Pommai uses a physical device—a **Raspberry Pi** housed within a toy—to capture a child's voice, processes it through a sophisticated and safe cloud-based AI pipeline, and delivers a real-time, context-aware response, bringing the toy to life.

## 🎨 UI System

Pommai features a unified **RetroUI** design system built with React and TypeScript:

- **@pommai/ui Package**: Comprehensive component library with 25+ components
- **Pixel Art Aesthetic**: Consistent retro styling with pixel borders and shadows
- **Accessibility First**: WCAG compliant with proper ARIA attributes
- **TypeScript Support**: Full type safety with excellent IntelliSense
- **Testing Suite**: Comprehensive tests including visual regression, accessibility, and performance
- **Theme System**: Customizable CSS custom properties for consistent theming

All components follow the RetroUI design language while maintaining modern functionality and accessibility standards.

## ✨ Key Features

### 🎨 Toy Creation & Personalization
- **Toy Creation Wizard**: Step-by-step guide to design every aspect of a toy
- **Advanced Personality Builder**: Define core traits, speaking style, interests, and custom catchphrases
- **Custom Voice Engine**: Choose from high-quality voices or clone your own using ElevenLabs
- **RAG Knowledge Base**: Give your toy backstories, memories, and family facts for deeply personal interactions

### 🛡️ Safety & Guardian Controls
- **Guardian Dashboard**: Comprehensive control center for parents
- **Multi-Layer Safety**: Powered by GuardrailsAI for content filtering
- **Real-time Monitoring**: Track conversations and interactions
- **Age-Appropriate Boundaries**: Automatic content adjustment based on child's age
- **PII Protection**: Automatic detection and redaction of personal information

### 🚀 Performance & Reliability
- **Real-time Interaction**: End-to-end latency under 2 seconds
- **Offline Mode**: On-device wake-word detection and cached safe responses
- **Global Scalability**: Distributed architecture supporting thousands of concurrent toys
- **Hardware Integration**: Seamless connection with Raspberry Pi and audio hardware

## 🏗️ Architecture Overview

Pommai is built on a decoupled, real-time architecture designed for low latency and scalability. The system consists of three main components that work in concert:

```
┌────────────────────────────────┐      WebSockets      ┌─────────────────────────────────┐      HTTPS/API       ┌────────────────────────────────┐
│   Raspberry Pi Client (Toy)    │<─────────────────────>│    FastRTC Gateway (Python)     │<────────────────────>│      Convex Backend (AI Core)  │
│                                │                      │                                 │                      │                                │
│ • Audio Capture (PyAudio)      │                      │ • Real-time Audio Relay         │                      │ • User & Toy Management        │
│ • Opus Audio Compression       │                      │ • Session Management            │                      │ • AI Agent & RAG (Convex Agent)│
│ • Wake Word Detection (Vosk)   │                      │ • TTS Streaming (ElevenLabs)    │                      │ • AI Pipeline Orchestration    │
│ • LED & Button Control (GPIO)  │                      │                                 │                      │ • Database & Vector Store      │
│ • Offline Cache (SQLite)       │                      └─────────────────────────────────┘                      │ • Authentication (BetterAuth)  │
└────────────────────────────────┘                                                                               └───────────────┬────────────────┘
                                                                                                                                 │
                                                                                                                                 │ HTTPS
                                                                                                                                 ▼
                                                                                                               ┌─────────────────────────────────┐
                                                                                                               │      Web Platform (Next.js)    │
                                                                                                               │                                │
                                                                                                               │ • Creator Studio & Toy Wizard  │
                                                                                                               │ • Guardian Dashboard           │
                                                                                                               │ • Chat Simulator & History     │
                                                                                                               └────────────────────────────────┘
```

### Components

#### 1. **Web Platform** (`apps/web`)
The central hub for users, built with **Next.js 15** and powered by **Convex** for its backend logic and real-time database.
- **Frontend**: Modern React application featuring the Creator Studio, Guardian Dashboard, and web-based chat simulator
- **UI System**: Custom **RetroUI** component library (`packages/ui`) for a unique, playful aesthetic
- **Backend**: Convex manages all data persistence, user accounts, toy configurations, conversation logs, and RAG system

#### 2. **FastRTC Gateway** (`apps/fastrtc-gateway`)
A lightweight, high-performance WebSocket server built in **Python** using **aiohttp**.
- **Real-time Communication**: Handles persistent WebSocket connections from Raspberry Pi clients
- **Audio Processing**: Receives streamed Opus-compressed audio and relays to backend
- **TTS Streaming**: Streams Text-to-Speech audio directly back to toys with minimal latency
- **Scalability**: Stateless design for easy horizontal scaling on Fly.io

#### 3. **Raspberry Pi Client** (`apps/raspberry-pi`)
The brain inside the physical toy, running on a **Raspberry Pi Zero 2W**.
- **Hardware Integration**: Interfaces with ReSpeaker 2-Mics Pi HAT for audio I/O
- **Audio Pipeline**: Real-time audio capture, Opus compression, and streaming
- **Wake Word Detection**: On-device Vosk integration for hands-free activation
- **Offline Capabilities**: SQLite database for cached safe responses without internet

## 🤖 Tech Stack & Tools

### Core Platform
- **Monorepo Management**: Turborepo with pnpm workspaces
- **Frontend Framework**: Next.js 15, React 19, TypeScript
- **Backend & Database**: Convex (Real-time Database & Serverless Functions)
- **UI Components**: Custom RetroUI 
- **State Management**: Zustand for client-side state

### Real-Time & Hardware
- **Gateway Server**: Python 3.9+, aiohttp, asyncio
- **Raspberry Pi**: Python 3.9+, PyAudio, opuslib
- **Hardware Control**: RPi.GPIO for LED and button management
- **Audio Processing**: PyAudio for capture, Opus for compression

### Authentication & Services
- **Authentication**: `@convex-dev/better-auth` for secure user management
- **Email Service**: `@convex-dev/resend` for transactional emails
- **Rate Limiting**: `@convex-dev/rate-limiter` for API protection

### 🧠 Open Source AI & Safety

A key architectural decision was to build our AI pipeline around powerful **OpenAI OSS models: openai/gpt-oss-120b and fallback is gpt-oss-20b** and tools, ensuring transparency, control, and flexibility.

#### Language Models & AI
- **LLM Gateway**: **OpenRouter** for accessing state-of-the-art OSS models
- **AI Orchestration**: `@convex-dev/agent` for conversation and RAG management

#### Speech Processing
- **Speech-to-Text**: OpenAI Whisper for accurate transcription
- **Text-to-Speech**: ElevenLabs for high-quality, expressive voices
- **Wake Word**: Vosk for offline activation and woke word activation


### Development & Deployment
- **Web Hosting**: Vercel for Next.js application
- **Gateway Hosting**: Fly.io for global WebSocket servers
- **Development Tools**: Warp terminal, TypeScript, ESLint

## 📁 Project Structure

```
pommai/
├── apps/
│   ├── web/                    # Next.js web platform
│   │   ├── src/                # React components and pages
│   │   ├── convex/             # Backend functions and schema
│   │   └── public/             # Static assets
│   ├── fastrtc-gateway/        # Python WebSocket relay server
│   │   ├── server_relay.py     # Main gateway server
│   │   └── tts_providers.py    # TTS integration
│   └── raspberry-pi/           # Python client for physical toys
│       ├── src/                # Core client modules
│       ├── config/             # Hardware configuration
│       └── audio_responses/    # Cached offline responses
├── packages/
│   ├── ui/                     # Shared RetroUI components
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utilities
│   └── config/                 # Shared ESLint, TSConfig
├── docs/                       # Project documentation
├── turbo.json                  # Turborepo configuration
├── package.json                # Root package configuration
└── pnpm-workspace.yaml         # pnpm workspace config
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and pnpm 10+
- Python 3.9+
- Convex account
- API keys for OpenRouter, OpenAI, and ElevenLabs
- (Optional) Raspberry Pi Zero 2W with ReSpeaker HAT

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/pommai.git
cd pommai
```

#### 2. Install Dependencies
```bash
pnpm install
```

#### 3. Web Platform Setup
```bash
cd apps/web

# Set up Convex backend (follow prompts to create project)
npx convex dev

# Copy and configure environment variables
cp .env.local.example .env.local
# Add your API keys to .env.local

# Start development server
pnpm run dev
```
The web application will be available at `http://localhost:3000`

#### 4. FastRTC Gateway Setup
```bash
cd apps/fastrtc-gateway

# Install Python dependencies
pip install -r requirements_relay.txt

# Configure environment
cp .env.example .env
# Add your Convex URL and Deploy Key

# Run the gateway server
python server_relay.py
```
Gateway will be running on `ws://localhost:8080`

#### 5. Raspberry Pi Client Setup (Optional)
For detailed Raspberry Pi setup:
```bash
cd apps/raspberry-pi
# Follow instructions in apps/raspberry-pi/README.md
```

## 🌍 Deployment

### Web Platform (Vercel)
```bash
cd apps/web
vercel deploy --prod
```

### FastRTC Gateway (Fly.io)
```bash
cd apps/fastrtc-gateway
fly deploy
```

### Environment Variables
Required environment variables for production:

#### Web Platform
- `CONVEX_DEPLOYMENT`: Your Convex deployment URL
- `OPENROUTER_API_KEY`: OpenRouter API key
- `OPENAI_API_KEY`: OpenAI API key
- `ELEVENLABS_API_KEY`: ElevenLabs API key
- `RESEND_API_KEY`: Resend email API key

#### Gateway Server
- `CONVEX_URL`: Convex deployment URL
- `CONVEX_DEPLOY_KEY`: Convex deploy key
- `ELEVENLABS_API_KEY`: ElevenLabs API key

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write tests for new features
- Document API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Open Source Community**: For the amazing tools and libraries
- **GuardrailsAI**: For robust safety framework
- **Convex Team**: For the powerful backend platform
- **ElevenLabs**: For high-quality voice synthesis
- **Our Beta Testers**: For invaluable feedback

## 📧 Contact

- **Website**: [pommai.com](https://pommai.com)
- **Email**: hello@pommai.com
- **Discord**: [Join our community](https://discord.gg/pommai)
- **Twitter**: [@PommaiAI](https://twitter.com/PommaiAI)

---

<p align="center">
  <strong>Built with ❤️ for the next generation</strong>
</p>

<p align="center">
  We believe in creating technology that is not only innovative but also responsible.<br/>
  Pommai is our commitment to building a future where AI can be a safe, positive, and magical part of a child's development.
</p>
