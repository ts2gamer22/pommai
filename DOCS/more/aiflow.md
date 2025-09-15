# AI flow overview: physical toy vs. web chat (after vectorSearch fix)

This document explains the two AI “brains” in the codebase, what caused the web chat fallback reply, the minimal fix that was applied, and how the flows work now. It also outlines options to unify and improve the architecture.

Scope
- Repo area: apps/web/convex
- Files involved: agents.ts, messages.ts, aiPipeline.ts, aiServices.ts
- Libraries: @convex-dev/agent, Convex actions/mutations

Summary
- Physical toy (voice pipeline) uses a simple direct LLM path via aiServices.generateResponse (OpenRouter). This has been reliable.
- Web chat uses Convex Agent (threads, context, storage). It was configured to use vectorSearch without a textEmbeddingModel, which triggered an assert inside @convex-dev/agent and caused a fallback reply.
- Fix: Disable vectorSearch in the non-kids Agent path. Only textSearch + recentMessages are used for context. This matches what streamToyResponse already did and restores normal replies.

Detailed flows

1) Physical toy (voice) flow: aiPipeline.ts
- Entry: processVoiceInteraction action
- Steps:
  1. Transcribe audio to text via aiServices.transcribeAudio (OpenAI Whisper)
  2. For kids mode, run checkContentSafety (regex patterns) and possibly produce a redirect response
  3. Generate LLM response by calling aiServices.generateResponse directly
     - No @convex-dev/agent generateText is used in the publicTest path
     - Uses OpenRouter models (e.g., openai/gpt-oss-120b) with fallback
  4. Optional TTS via aiServices.synthesizeSpeech (ElevenLabs)
  5. Persist conversation messages via internal.messages.logMessage
- Why it works
  - Simple direct path, no dependency on Agent vector search/embeddings
  - Minimal moving parts, clear error handling/fallbacks

2) Web chat flow: messages.ts -> agents.ts (generateToyResponse)
- Entry: messages.generateAIResponse action
- Steps:
  1. Get or create a canonical Convex Agent thread for the toy
  2. Save the user message to the Agent thread
  3. Call internal.agents.generateToyResponse to produce a reply
     - For kids toys: direct OpenRouter call in agents.ts with tool support
     - For non-kids toys: uses Agent.generateText for context management and storage
  4. Safety check for kids toys (post-generation) and fallback if needed
  5. Save response to the messages table
- Why it previously failed
  - The non-kids path set contextOptions.searchOptions.vectorSearch = includeKnowledge
  - No textEmbeddingModel was configured on the Agent
  - @convex-dev/agent requires a textEmbeddingModel to be present when vectorSearch is true, and asserts
  - The thrown error was caught and mapped to the fallback: "I'm having trouble understanding. Could you try asking in a different way?"

What changed (the fix)
- File: apps/web/convex/agents.ts
- In generateToyResponse (non-kids path), we changed:
  - vectorSearch: includeKnowledge -> vectorSearch: false
- Effect:
  - Removes the embedding requirement path; Agent can assemble context from recent messages + textSearch only
  - Aligns with streamToyResponse (which already used vectorSearch: false)
  - Avoids the internal assert and restores normal replies

Behavior now
- Physical toy: unchanged; still direct OpenRouter path in aiPipeline.ts
- Web chat:
  - Kids toys: still direct OpenRouter + tools in agents.ts (no Agent.generateText)
  - Non-kids toys: Agent.generateText with recentMessages + textSearch context, no vector search

Why leave Agent in the web chat path?
- Benefits of Agent:
  - Thread management (createThread, continueThread)
  - Saved messages with metadata and pagination
  - Consistent context assembly (recent + optional text search)
  - Optional streaming with delta saving
- Disabling vector search keeps these benefits while avoiding the embedding requirement until you decide to add it properly

Options to improve further
- Option A: Add embeddings to re-enable vectorSearch
  - Configure Agent with a textEmbeddingModel (e.g., @ai-sdk/openai embedding model) at construction time
  - Pros: better context retrieval (semantic)
  - Cons: adds provider dependency + cost; must wire up providers correctly
- Option B: Fully unify brains to direct aiServices
  - Replace Agent.generateText in agents.ts with api.aiServices.generateResponse for non-kids toys as well
  - Pros: single code path (toy and web), smaller surface area
  - Cons: lose built-in thread/memory handling; need to re-implement storage/ordering semantics; more refactor
- Option C: Hybrid
  - Keep Agent for thread/message storage and recent history, but swap its language model to a wrapper that calls aiServices internally (you’ve partially done this with createToyLanguageModel)
  - Enable vector search only when textEmbeddingModel is present

Testing recommendations
- Web chat
  - Send a prompt that previously produced the fallback
  - Expect: normal response, no "I'm having trouble understanding..."
  - Verify recent context appears to be used across multiple turns
- Logs
  - Ensure the specific assert message about textEmbeddingModel no longer appears
- Kids mode, both toy and web chat
  - Exercise quiz_generate/quiz_grade/tts_play tool calls and confirm results
- Regression
  - Test streamToyResponse (streaming path) — unchanged behavior expected

Future guardrails
- Guard vector search behind capability detection:
  - vectorSearch = includeKnowledge && hasEmbeddingModel
- On startup or first call, log a clear warning if includeKnowledge is requested but no embedding model is configured
- Add a health check action for embeddings (try a small embed) and expose status to admin UI

Appendix: relevant code references
- web chat call site:
  - apps/web/convex/messages.ts → generateAIResponse → internal.agents.generateToyResponse
- fixed vectorSearch location:
  - apps/web/convex/agents.ts (non-kids branch in generateToyResponse) — vectorSearch: false
- streaming path already had vectorSearch: false:
  - apps/web/convex/agents.ts → streamToyResponse
- physical toy (voice) path:
  - apps/web/convex/aiPipeline.ts → processVoiceInteraction → aiServices.generateResponse
- direct LLM service:
  - apps/web/convex/aiServices.ts → generateResponse (OpenRouter)

Decision checklist
- If you want semantic retrieval (vector search), plan to add and test a textEmbeddingModel on the Agent
- If you prefer a single code path, consider unifying to aiServices and re-adding storage semantics
- If you prefer minimal change and stability, keep current setup; it’s now consistent and functional
