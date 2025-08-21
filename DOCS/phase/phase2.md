# Phase 2: Core Web Platform Implementation Guide (Week 3-4)

## Overview
Phase 2 focuses on building the core web platform features that enable users to create and manage AI toys through the Creator Studio, with an optional Guardian Mode for parents who want to create safe, monitored toys for children. This phase establishes both the creative freedom for general users and the safety-first architecture for child-specific applications.

## Prerequisites
- Completed Phase 1 (monorepo setup, Next.js + Convex deployed, RetroUI components, auth flow, dashboard skeleton)
- Convex database schema designed and implemented
- Authentication system operational
- Basic RetroUI component library ready

## Task 1: Toy Creation Wizard (Creator Studio)

### Description
Build a multi-step wizard that guides users through creating an AI toy personality. The wizard should support both general creators and parents, with a critical "For Kids" designation that activates Guardian Mode safety features. This wizard should be intuitive for all users while providing advanced customization options.

### Technical Implementation

#### 1.1 Wizard Steps Structure
```typescript
// types/wizard.ts
interface ToySetupWizard {
  steps: [
    'welcome',           // Introduction and creator/guardian mode selection
    'toyProfile',        // Name, type, intended audience
    'forKidsToggle',     // Critical: Designate as "For Kids" (activates Guardian Mode)
    'personalitySetup',  // Configure personality traits
    'voiceSelection',    // Choose or upload voice
    'knowledgeBase',     // Add custom knowledge (optional)
    'safetySettings',    // Content filters (mandatory for "For Kids")
    'deviceSetup',       // Hardware connection instructions
    'testSimulator',     // Test in web simulator
    'completion'         // Success and next steps
  ];
  currentStep: number;
  toyData: ToyConfiguration;
  isForKids: boolean;  // Critical flag for safety features
  validationErrors: Record<string, string>;
}
```

#### 1.2 Device Pairing Flow
```typescript
// components/wizard/DevicePairing.tsx
interface DevicePairingProps {
  onComplete: (deviceId: string) => void;
}

// Features to implement:
// - Generate unique pairing code (6-digit PIN)
// - QR code display for easy scanning
// - WebSocket listener for device connection
// - Real-time connection status updates
// - Troubleshooting guide for common issues
// - Alternative manual setup option
```

#### 1.3 Convex Schema for Toy Configuration
```typescript
// convex/schema.ts
toys: defineTable({
  name: v.string(),
  type: v.string(), // "bear", "rabbit", "dragon", "robot", "custom"
  creatorId: v.id("users"),
  isForKids: v.boolean(), // Critical flag that enables Guardian Mode
  ageGroup: v.optional(v.union(v.literal("3-5"), v.literal("6-8"), v.literal("9-12"))), // Required if isForKids
  voiceId: v.string(),
  personalityPrompt: v.string(),
  knowledgeBase: v.optional(v.id("knowledgeBases")),
  
  // Guardian Mode specific fields (only when isForKids = true)
  guardianId: v.optional(v.id("users")), // Parent managing the toy
  childProfiles: v.optional(v.array(v.id("children"))),
  safetyLevel: v.optional(v.union(v.literal("strict"), v.literal("moderate"), v.literal("relaxed"))),
  contentFilters: v.optional(v.object({
    enabledCategories: v.array(v.string()),
    customBlockedTopics: v.array(v.string()),
  })),
  
  // Device management
  assignedDevices: v.array(v.string()), // Can be assigned to multiple devices
  status: v.union(v.literal("active"), v.literal("paused"), v.literal("archived")),
  
  // Metadata
  isPublic: v.boolean(), // Can be shared in community
  tags: v.array(v.string()),
  usageCount: v.number(),
  createdAt: v.number(),
  lastActiveAt: v.number(),
  lastModifiedAt: v.number(),
})
.index("by_creator", ["creatorId"])
.index("by_guardian", ["guardianId"])
.index("by_device", ["assignedDevices"])
.index("for_kids", ["isForKids"])
```

#### 1.4 UI Components Required
- Progress indicator (RetroUI style)
- Form validation with real-time feedback
- Device status indicator (connecting/connected/error)
- Help tooltips and contextual guidance
- Mobile-responsive layout
- Accessibility features (keyboard navigation, screen reader support)

### Context Requirements
- **Use context7 mcp or ask githubrepo from user** for:
  - Next.js 15 App Router patterns for multi-step forms
  - Convex real-time subscriptions for device pairing
  - RetroUI component styling guidelines
  - WebSocket implementation best practices

## Task 2: Personality Builder Interface

### Description
Create an intuitive interface for all users to define their toy's personality, including traits, speaking style, interests, and behavioral boundaries. For toys marked as "For Kids", additional safety constraints and age-appropriate options will be enforced. This should feel like creating a character rather than programming an AI.

### Technical Implementation

#### 2.1 Personality Traits System
```typescript
interface PersonalityTraits {
  // Core personality (select up to 3)
  traits: Array<'cheerful' | 'curious' | 'gentle' | 'playful' | 'wise' | 'silly' | 'brave' | 'caring'>;
  
  // Speaking style
  speakingStyle: {
    vocabulary: 'simple' | 'moderate' | 'advanced';
    sentenceLength: 'short' | 'medium' | 'long';
    usesSoundEffects: boolean;
    catchPhrases: string[];
  };
  
  // Interests and knowledge
  interests: string[];
  favoriteTopics: string[];
  avoidTopics: string[];
  
  // Behavioral settings
  behavior: {
    encouragesQuestions: boolean;
    tellsStories: boolean;
    playsGames: boolean;
    educationalFocus: 0-10; // slider
    imaginationLevel: 0-10; // slider
  };
}
```

#### 2.2 Visual Personality Builder
```typescript
// components/personality/PersonalityBuilder.tsx
// Features to implement:
// - Drag-and-drop trait cards
// - Real-time personality preview
// - Example conversations based on settings
// - Preset personalities (Teacher, Friend, Storyteller)
// - Custom prompt editor for advanced users
// - Personality template marketplace (future)
```

#### 2.3 Prompt Generation System
```typescript
// lib/personality/promptGenerator.ts
function generateSystemPrompt(
  toyProfile: ToyProfile,
  personality: PersonalityTraits,
  safetySettings: SafetySettings
): string {
  // Combine all settings into a comprehensive system prompt
  // Include safety rules as non-negotiable constraints
  // Add personality traits and speaking style
  // Incorporate interests and knowledge boundaries
  // Return optimized prompt for gpt-oss-120b
}
```

#### 2.4 UI/UX Considerations
- Visual personality spectrum (e.g., serious ← → playful)
- Interactive preview with sample responses
- Tooltips explaining each trait's impact
- Save/load personality presets
- A/B test different personality configurations
- Share personalities with community (opt-in)

### Context Requirements
- **Use context7 mcp or ask githubrepo from user** for:
  - Advanced React state management for complex forms
  - Prompt engineering best practices for LLMs
  - UI/UX patterns for personality configuration
  - Convex mutation patterns for saving complex objects

## Task 3: Voice Selection/Upload System

### Description
Implement a system for users to choose from pre-made voices or upload custom voice samples to create a unique voice for their toy. This includes voice preview, quality checks, and voice cloning integration. For "For Kids" toys, voices will be vetted for appropriateness.

### Technical Implementation

#### 3.1 Voice Library Structure
```typescript
interface VoiceOption {
  id: string;
  name: string;
  description: string;
  language: string;
  accent?: string;
  ageGroup: string;
  gender: 'male' | 'female' | 'neutral';
  previewUrl: string;
  provider: '11labs' | 'azure' | 'custom';
  tags: string[];
  isPremium: boolean;
}

// convex/schema.ts
voices: defineTable({
  ...VoiceOption,
  uploadedBy: v.optional(v.id("users")),
  isPublic: v.boolean(),
  usageCount: v.number(),
  averageRating: v.number(),
})
```

#### 3.2 Custom Voice Upload Flow
```typescript
// components/voice/VoiceUploader.tsx
interface VoiceUploadSteps {
  1: 'requirements',    // Show requirements (3-5 min audio, quiet environment)
  2: 'recordOrUpload',  // Record directly or upload files
  3: 'processing',      // Quality check and voice cloning
  4: 'preview',         // Test the cloned voice
  5: 'save'            // Name and save the voice
}

// Features to implement:
// - Audio file validation (format, quality, duration)
// - Real-time waveform visualization
// - Background noise detection
// - Voice quality scoring
// - 11Labs voice cloning API integration
// - Fallback to Azure Custom Voice if needed
```

#### 3.3 Voice Preview System
```typescript
// lib/voice/preview.ts
interface VoicePreviewSystem {
  // Cached preview phrases
  previewPhrases: [
    "Hi there! I'm so excited to be your friend!",
    "What would you like to talk about today?",
    "Once upon a time, in a magical forest...",
    "That's a great question! Let me think...",
    "Wow, you're so creative and smart!"
  ];
  
  // Generate preview with selected voice
  generatePreview(voiceId: string, text?: string): Promise<AudioBuffer>;
  
  // Real-time voice switching
  switchVoicePreview(fromVoiceId: string, toVoiceId: string): void;
}
```

#### 3.4 Voice Management Features
- Voice favorites/bookmarks
- Voice search and filtering
- Community voice marketplace
- Voice modification (pitch, speed)
- Multi-language voice support
- Voice emotion variants (happy, calm, excited)

### Context Requirements
- **Use context7 mcp or ask githubrepo from user** for:
  - 11Labs API integration and voice cloning
  - Audio processing in the browser (Web Audio API)
  - File upload best practices with Convex
  - Real-time audio streaming implementation

## Task 4: Knowledge Base Management

### Description
Build an interface for users to add custom knowledge, including toy backstory, specific information, and context. For general users, this can include any topic. For "For Kids" toys, knowledge will be filtered and approved by guardians. This creates a more personalized and contextual experience.

### Technical Implementation

#### 4.1 Knowledge Categories
```typescript
interface KnowledgeBase {
  toyBackstory: {
    origin: string;
    personality: string;
    specialAbilities: string[];
    favoriteThings: string[];
  };
  
  familyInfo: {
    members: Array<{
      name: string;
      relationship: string;
      facts: string[];
    }>;
    pets: Array<{ name: string; type: string; facts: string[] }>;
    importantDates: Array<{ date: string; event: string }>;
  };
  
  customFacts: Array<{
    category: string;
    fact: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  
  memories: Array<{
    id: string;
    description: string;
    date: string;
    participants: string[];
    autoGenerated: boolean;
  }>;
}
```

#### 4.2 Knowledge Editor Interface
```typescript
// components/knowledge/KnowledgeEditor.tsx
// Features to implement:
// - Structured data entry forms
// - Free-text knowledge input with NLP parsing
// - Import from common formats (JSON, CSV)
// - Knowledge validation and conflict detection
// - Privacy controls (what toy can/cannot share)
// - Knowledge versioning and rollback
```

#### 4.3 Vector Database Integration
```typescript
// lib/knowledge/vectorStore.ts
interface KnowledgeVectorization {
  // Convert knowledge to embeddings
  async vectorizeKnowledge(knowledge: KnowledgeBase): Promise<VectorData>;
  
  // Store in Pinecone/ChromaDB
  async storeVectors(vectors: VectorData, toyId: string): Promise<void>;
  
  // Retrieve relevant context during conversations
  async retrieveContext(query: string, toyId: string): Promise<Context[]>;
  
  // Update embeddings when knowledge changes
  async updateVectors(changes: KnowledgeChanges): Promise<void>;
}
```

#### 4.4 Privacy and Safety Controls
- Sensitive information flagging
- Auto-redaction of personal details
- Parent approval for AI-generated memories
- Knowledge sharing permissions
- Regular privacy audits
- COPPA compliance checks

### Context Requirements
- **Use context7 mcp or ask githubrepo from user** for:
  - Vector database setup (Pinecone/ChromaDB)
  - OpenAI embeddings API integration
  - RAG (Retrieval Augmented Generation) patterns
  - Privacy-preserving data storage techniques

## Task 5: Basic Chat Interface

### Description
Create a web-based chat interface (Web Simulator) that allows users to test and interact with their created toys through text or voice. For general users, this is the primary testing tool. For Guardian Mode users, this includes real-time monitoring and safety features.

### Technical Implementation

#### 5.1 Chat UI Components
```typescript
// components/chat/ChatInterface.tsx
interface ChatInterface {
  messages: Message[];
  isTyping: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  inputMode: 'text' | 'voice';
  currentUser: 'parent' | 'child';
}

interface Message {
  id: string;
  role: 'user' | 'toy' | 'system';
  content: string;
  timestamp: number;
  audioUrl?: string;
  metadata?: {
    sentiment?: string;
    safetyScore?: number;
    flagged?: boolean;
  };
}
```

#### 5.2 Real-time Messaging System
```typescript
// convex/functions/chat.ts
export const sendMessage = mutation({
  args: {
    toyId: v.id("toys"),
    message: v.string(),
    userId: v.id("users"),
    userType: v.union(v.literal("parent"), v.literal("child")),
  },
  handler: async (ctx, args) => {
    // 1. Store message
    // 2. Apply safety filters
    // 3. Generate AI response
    // 4. Stream response back
    // 5. Log for parent monitoring
  },
});

// Real-time subscription
export const subscribeToChat = subscription({
  args: { toyId: v.id("toys") },
  handler: async (ctx, args) => {
    // Stream new messages as they arrive
  },
});
```

#### 5.3 Advanced Chat Features
```typescript
// features to implement:
interface ChatFeatures {
  // Message reactions (for kids)
  reactions: ['❤️', '😄', '🌟', '👍', '🎉'];
  
  // Voice messages
  voiceInput: {
    record: () => Promise<AudioBlob>;
    transcribe: (audio: AudioBlob) => Promise<string>;
    playback: (audioUrl: string) => void;
  };
  
  // Rich media
  mediaSupport: {
    images: boolean; // Share drawings
    stickers: boolean; // Fun stickers
    gifs: boolean; // Safe GIFs only
  };
  
  // Chat modes
  modes: {
    learning: boolean; // Educational focus
    creative: boolean; // Story building
    game: boolean; // Interactive games
  };
}
```

#### 5.4 Parent Control Panel
- Real-time chat monitoring
- Message filtering toggles
- Conversation pause/resume
- Export chat history
- Flag concerning messages
- Set chat time limits

### Context Requirements
- **Use context7 mcp or ask githubrepo from user** for:
  - Convex real-time subscriptions
  - React chat UI patterns
  - WebSocket message streaming
  - Optimistic UI updates

## Task 6: Conversation History Viewer

### Description
Build a comprehensive conversation history viewer. For general users, this shows their own interactions. For Guardian Mode, this allows parents to review all interactions between their child and the toy, with search, filtering, and analytics capabilities.

### Technical Implementation

#### 6.1 History Data Structure
```typescript
interface ConversationHistory {
  conversations: Array<{
    id: string;
    startTime: number;
    endTime: number;
    duration: number;
    participantChild: string;
    messageCount: number;
    flaggedMessages: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    topics: string[];
    location: 'toy' | 'web' | 'app';
  }>;
  
  messages: Array<{
    conversationId: string;
    ...Message; // from chat interface
    analysis?: {
      topics: string[];
      educationalValue: number;
      emotionalTone: string;
      safetyFlags: string[];
    };
  }>;
}
```

#### 6.2 History Viewer UI
```typescript
// components/history/ConversationViewer.tsx
interface ViewerFeatures {
  // Timeline view
  timeline: {
    view: 'day' | 'week' | 'month';
    navigation: 'calendar' | 'scroll';
    highlights: 'all' | 'flagged' | 'educational';
  };
  
  // Search and filter
  search: {
    fullText: boolean;
    dateRange: boolean;
    topics: boolean;
    sentiment: boolean;
    participants: boolean;
  };
  
  // Analytics dashboard
  analytics: {
    conversationFrequency: Chart;
    topicDistribution: PieChart;
    sentimentTrends: LineChart;
    vocabularyGrowth: ProgressChart;
    safetyIncidents: IncidentLog;
  };
}
```

#### 6.3 Advanced History Features
```typescript
// lib/history/analysis.ts
interface ConversationAnalysis {
  // AI-powered insights
  async generateInsights(conversations: Conversation[]): Promise<{
    summary: string;
    patterns: Pattern[];
    recommendations: string[];
    concerns: Concern[];
  }>;
  
  // Export functionality
  async exportHistory(format: 'pdf' | 'csv' | 'json'): Promise<Blob>;
  
  // Comparison tools
  compareTimeframes(period1: DateRange, period2: DateRange): Comparison;
  
  // Learning progress tracking
  trackEducationalProgress(childId: string): ProgressReport;
}
```

#### 6.4 Privacy and Data Management
- Auto-deletion policies
- Data export for GDPR/CCPA
- Conversation archiving
- Selective deletion
- Anonymization options
- Audit logs

### Context Requirements
- **Use context7 mcp or ask githubrepo from user** for:
  - Data visualization libraries (Chart.js/Recharts)
  - Convex query optimization for large datasets
  - PDF generation in Next.js
  - Time-series data handling

## Integration Points

### Cross-Component Communication
```typescript
// lib/state/toyManagement.ts
interface ToyManagementState {
  currentToy: Toy | null;
  toys: Toy[];
  activeConversation: Conversation | null;
  
  // Actions
  createToy: (config: ToyConfiguration) => Promise<Toy>;
  updatePersonality: (toyId: string, personality: PersonalityTraits) => Promise<void>;
  changeVoice: (toyId: string, voiceId: string) => Promise<void>;
  updateKnowledge: (toyId: string, knowledge: KnowledgeBase) => Promise<void>;
  
  // Real-time updates
  subscribeToToyStatus: (toyId: string) => () => void;
  subscribeToConversations: (toyId: string) => () => void;
}
```

### API Integration Layer
```typescript
// lib/api/services.ts
interface ExternalServices {
  llm: {
    provider: 'openrouter';
    model: 'gpt-oss-120b';
    generateResponse: (prompt: string, context: Context) => Promise<string>;
  };
  
  tts: {
    provider: '11labs';
    generateSpeech: (text: string, voiceId: string) => Promise<AudioStream>;
  };
  
  stt: {
    provider: 'deepgram' | 'whisper';
    transcribe: (audio: AudioBlob) => Promise<string>;
  };
  
  safety: {
    provider: 'azure';
    checkContent: (text: string) => Promise<SafetyResult>;
  };
}
```

## Task 7: Toy Management Dashboard

### Description
Create a comprehensive "My Toys" dashboard where users can view, manage, and switch between all their created AI toys. This is a central hub for toy management and includes quick actions for editing, archiving, and device assignment.

### Technical Implementation

#### 7.1 Toy Management Interface
```typescript
// components/toys/MyToysGrid.tsx
interface MyToysView {
  toys: Array<{
    id: string;
    name: string;
    type: string;
    thumbnail: string;
    isForKids: boolean;
    status: 'active' | 'paused' | 'archived';
    assignedDevices: string[];
    lastActive: Date;
    conversationCount: number;
  }>;
  
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'lastActive' | 'created';
  filters: {
    status: string[];
    isForKids: boolean | null;
    hasDevice: boolean | null;
  };
}
```

#### 7.2 Quick Actions
```typescript
// Features to implement:
interface ToyActions {
  // Instant actions
  switchToy: (toyId: string, deviceId: string) => Promise<void>;
  pauseToy: (toyId: string) => Promise<void>;
  duplicateToy: (toyId: string) => Promise<Toy>;
  
  // Edit flows
  editPersonality: (toyId: string) => void;
  updateVoice: (toyId: string) => void;
  manageKnowledge: (toyId: string) => void;
  
  // Device management
  assignToDevice: (toyId: string, deviceId: string) => Promise<void>;
  removeFromDevice: (toyId: string, deviceId: string) => Promise<void>;
}
```

### Context Requirements
- **Use context7 mcp or ask githubrepo from user** for:
  - Grid/list view patterns in React
  - Real-time device status updates
  - Drag-and-drop for device assignment

## Task 8: Guardian Dashboard (For Kids Mode)

### Description
Build a specialized Guardian Dashboard that activates when a toy is marked as "For Kids". This provides parents with comprehensive monitoring, control, and safety features for their children's AI toy interactions.

### Technical Implementation

#### 8.1 Guardian Dashboard Structure
```typescript
// components/guardian/GuardianDashboard.tsx
interface GuardianDashboard {
  // Child profiles
  children: Array<{
    id: string;
    name: string;
    age: number;
    assignedToys: string[];
    dailyLimit: number; // minutes
    currentUsage: number;
  }>;
  
  // Safety monitoring
  safetyAlerts: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high';
    type: 'content' | 'usage' | 'behavior';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
  
  // Real-time monitoring
  activeConversations: Map<string, LiveConversation>;
  
  // Controls
  emergencyStop: () => Promise<void>;
  pauseAllToys: () => Promise<void>;
}
```

#### 8.2 Safety Controls Interface
```typescript
// components/guardian/SafetyControls.tsx
interface SafetyControls {
  // Content filtering
  contentFilters: {
    strictness: 'low' | 'medium' | 'high';
    blockedTopics: string[];
    allowedTopics: string[];
    customRules: SafetyRule[];
  };
  
  // Time controls
  timeRestrictions: {
    dailyLimit: number;
    allowedHours: { start: string; end: string; }[];
    schoolDayRules: boolean;
    weekendRules: boolean;
  };
  
  // Monitoring preferences
  notifications: {
    realTimeAlerts: boolean;
    dailySummary: boolean;
    weeklyReport: boolean;
    severityThreshold: 'all' | 'medium' | 'high';
  };
}
```

#### 8.3 Live Monitoring Features
```typescript
// lib/guardian/monitoring.ts
interface LiveMonitoring {
  // Real-time conversation tracking
  subscribeToConversation(toyId: string): Observable<Message>;
  
  // Safety analysis
  analyzeMessage(message: Message): Promise<SafetyAnalysis>;
  
  // Intervention tools
  pauseConversation(conversationId: string): Promise<void>;
  injectSafetyMessage(conversationId: string, message: string): Promise<void>;
  
  // Analytics
  generateSafetyReport(timeframe: DateRange): Promise<SafetyReport>;
}
```

### Context Requirements
- **Use context7 mcp or ask githubrepo from user** for:
  - Real-time monitoring UI patterns
  - Child safety best practices
  - Parental control interfaces
  - Live data visualization

## Testing Strategy

### Unit Tests
- Component rendering tests
- Form validation logic
- API integration mocks
- State management tests

### Integration Tests
- Full wizard flow completion
- Real-time chat functionality
- Voice upload and preview
- Knowledge base CRUD operations

### E2E Tests
- Parent onboarding journey
- Toy configuration and testing
- Conversation monitoring
- Safety feature verification

## Performance Considerations

### Optimization Targets
- Wizard load time < 1s
- Chat message latency < 100ms
- Voice preview generation < 2s
- History search results < 500ms
- Real-time updates < 50ms

### Implementation Tips
1. Use React Server Components for initial page loads
2. Implement virtual scrolling for conversation history
3. Cache voice previews aggressively
4. Debounce search inputs
5. Lazy load analytics charts
6. Use optimistic UI updates

## Security Checklist

- [ ] Input sanitization on all forms
- [ ] XSS prevention in chat messages
- [ ] CSRF protection on mutations
- [ ] Rate limiting on API calls
- [ ] Secure file upload validation
- [ ] Encrypted data transmission
- [ ] Session management
- [ ] Access control verification

## Deliverables

By the end of Phase 2, you should have:
1. ✅ Fully functional toy creation wizard with "For Kids" toggle
2. ✅ Interactive personality builder for all user types
3. ✅ Voice selection with upload capability
4. ✅ Knowledge base management system
5. ✅ Working web simulator (chat interface)
6. ✅ Comprehensive conversation history viewer
7. ✅ My Toys management dashboard
8. ✅ Guardian Dashboard for "For Kids" toys
9. ✅ All safety features implemented and tested
10. ✅ Device pairing and switching functionality
11. ✅ All components integrated with Convex backend
12. ✅ Ready for Phase 3 (Raspberry Pi integration)

## Notes for Implementation

When implementing these features, remember:
- **Use context7 mcp or ask githubrepo from user** for any specific library documentation or implementation patterns
- Follow the safety-first architecture principle
- Ensure all features are mobile-responsive
- Maintain consistent RetroUI styling
- Document all API integrations
- Write tests as you build
- Keep accessibility in mind
- Optimize for the hackathon demo

This phase forms the heart of the Pommai platform and sets the stage for the hardware integration in Phase 3.
