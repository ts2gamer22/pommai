# Project Structure & Organization

## Monorepo Architecture

Pommai uses a Turborepo-managed monorepo with pnpm workspaces for efficient development and deployment.

```
pommai/
├── apps/                      # Application packages
│   ├── web/                   # Next.js web platform
│   ├── fastrtc-gateway/       # Python WebSocket relay server
│   └── raspberry-pi/          # Python client for physical toys
├── packages/                  # Shared packages
│   ├── ui/                    # RetroUI component library
│   ├── types/                 # Shared TypeScript types
│   ├── utils/                 # Shared utilities
│   └── config/                # Shared configurations (ESLint, TSConfig)
├── DOCS/                      # Project documentation
└── .kiro/                     # Kiro IDE configuration
```

## Web Application Structure (`apps/web/`)

### Frontend Organization
```
src/
├── app/                       # Next.js App Router
│   ├── (auth)/               # Auth route group
│   ├── dashboard/            # Main dashboard pages
│   ├── api/                  # API routes
│   └── globals.css           # Global styles
├── components/               # React components (organized by feature)
│   ├── chat/                 # Chat interface components
│   ├── dashboard/            # Dashboard-specific components
│   │   └── steps/           # Toy wizard step components
│   ├── voice/               # Voice-related components
│   ├── history/             # Conversation history components
│   ├── guardian/            # Guardian mode components
│   └── ui/                  # Base UI components (shadcn/ui style)
├── lib/                     # Utility libraries
├── stores/                  # Zustand state stores
└── types/                   # TypeScript type definitions
```

### Backend Organization (`convex/`)
```
convex/
├── schema.ts                # Database schema definitions
├── auth.ts                  # Authentication functions
├── toys.ts                  # Toy management functions
├── conversations.ts         # Conversation handling
├── messages.ts              # Message operations
├── aiPipeline.ts           # AI processing pipeline
├── agents.ts               # AI agent configurations
├── knowledgeBase.ts        # RAG system functions
├── safety.ts               # Content filtering & safety
└── voices.ts               # Voice management
```

## Component Organization Rules

### File Naming Conventions
- **Components**: PascalCase (e.g., `ToyWizard.tsx`)
- **Pages**: lowercase with hyphens (e.g., `dashboard/page.tsx`)
- **Utilities**: camelCase (e.g., `audioUtils.ts`)
- **Types**: PascalCase with `.types.ts` suffix

### Component Structure Guidelines
- **Maximum 500 lines per file** - Split larger components into smaller ones
- **Feature-based folders** - Group related components together
- **Index files** - Use `index.ts` for clean imports

### Example Component Organization
```
components/
├── dashboard/
│   ├── ToyWizard.tsx         # Main wizard component
│   ├── MyToysGrid.tsx        # Toy grid display
│   └── steps/                # Wizard step components
│       ├── WelcomeStep.tsx
│       ├── PersonalityStep.tsx
│       ├── VoiceStep.tsx
│       └── CompletionStep.tsx
├── chat/
│   ├── ChatInterface.tsx     # Main chat component
│   ├── MessageBubble.tsx     # Individual message
│   └── InputArea.tsx         # Chat input
└── ui/                       # Reusable UI components
    ├── Button.tsx
    ├── Card.tsx
    └── Input.tsx
```

## Hardware Applications Structure

### Raspberry Pi Client (`apps/raspberry-pi/`)
```
src/
├── pommai_client_fastrtc.py  # Main client application
├── fastrtc_connection.py     # WebSocket connection handling
├── audio_stream_manager.py   # Audio capture and playback
├── opus_audio_codec.py       # Audio compression
├── led_controller.py         # LED control
├── button_handler.py         # Button input handling
├── wake_word_detector.py     # Wake word detection
└── conversation_cache.py     # Local conversation caching
```

### FastRTC Gateway (`apps/fastrtc-gateway/`)
```
├── server_relay.py           # Main WebSocket server
├── server_relay_with_tts.py  # Server with TTS integration
└── tts_providers.py          # TTS service providers
```

## Shared Packages Structure

### UI Package (`packages/ui/`)
```
src/
├── components/               # RetroUI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── Tabs.tsx
├── styles/
│   └── retroui.css          # RetroUI theme styles
└── index.ts                 # Package exports
```

### Types Package (`packages/types/`)
```
src/
├── auth.ts                  # Authentication types
├── toys.ts                  # Toy-related types
├── conversations.ts         # Conversation types
└── index.ts                 # Type exports
```

## Documentation Structure (`DOCS/`)

### Phase-Based Documentation
```
DOCS/
├── phase/                   # Development phases
│   ├── phase1.md           # Foundation phase
│   ├── phase2.md           # Core platform
│   ├── phase3.md           # Hardware integration
│   └── phase4.md           # AI pipeline
├── context/                # Phase-specific context
│   ├── phase1context/      # Phase 1 documentation
│   ├── phase2context/      # Phase 2 documentation
│   ├── phase3context/      # Phase 3 documentation
│   └── phase4context/      # Phase 4 documentation
└── more/
    └── PLAN.md             # Detailed project plan
```

## Code Organization Best Practices

### JSDoc Documentation
- **All functions** should have JSDoc comments
- **Complex components** should document props and usage
- **API functions** should document parameters and return types

### Component Creation Rules
1. **New pages** → Create folder in `components/[feature]/`
2. **Reusable components** → Place in `components/ui/`
3. **Feature-specific** → Group in `components/[feature]/`
4. **Split large files** → Keep under 500 lines

### Import Organization
```typescript
// External libraries
import React from 'react'
import { NextPage } from 'next'

// Internal utilities
import { cn } from '@/lib/utils'

// Components (UI first, then feature-specific)
import { Button } from '@/components/ui/Button'
import { ToyCard } from '@/components/dashboard/ToyCard'

// Types
import type { Toy } from '@/types/toys'
```

### State Management Structure
- **Global state** → Zustand stores in `src/stores/`
- **Server state** → Convex queries and mutations
- **Local state** → React useState/useReducer
- **Form state** → React Hook Form or similar

## Testing Structure
- **Unit tests** → Jest with `.test.ts` suffix
- **Integration tests** → Separate `tests/` directory
- **Python tests** → pytest in `apps/raspberry-pi/tests/`

## Styling Guidelines
- **Airbnb format** for code style
- **Tailwind CSS** for styling
- **RetroUI components** for consistent design
- **CSS modules** for component-specific styles when needed

## File Updates
- **Always update** `projectstructure.md` when creating new files or folders
- **Maintain** consistent naming conventions across the codebase
- **Document** architectural decisions in appropriate DOCS files