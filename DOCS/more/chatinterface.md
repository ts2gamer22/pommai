# Chat Interface Refactor and TTS/Mic Fixes

Last updated: 2025-09-15

Author: Agent Mode (AI Debugger)


## Summary
We unified the web chat into a single, stateless pipeline and fixed several audio-related bugs. The microphone flow was implemented end-to-end, TTS playback is now reliably gated by the mute state, and stale audio is prevented when switching toys or sending new messages.

This document captures exactly what changed, why it changed, and how we plan to leverage `agents.ts` in the future.


## Goals
- Eliminate dual/competing AI pipelines in the web chat.
- Ensure mute reliably governs TTS playback and immediately stops audio when toggled on.
- Implement browser mic recording and route it through a single web chat flow.
- Prevent cross-talk and stale audio when switching toys or sending consecutive messages.
- Clarify roles of `messages.ts` (web chat), `aiPipeline.ts` (physical toy), and `agents.ts` (stateful/knowledgeable brain).


## What changed (by file)

### apps/web/src/components/chat/ChatInterface.tsx
- Implemented full microphone flow using MediaRecorder:
  - Record -> convert to mono 16-bit PCM WAV (base64) -> `aiServices.transcribeAudio` -> send user message -> `messages.generateAIResponse` -> optional TTS playback.
- Unifies web chat to a single pipeline (no direct call to `aiPipeline.processVoiceInteraction` in the UI).
- Added a per-request guard `currentRequestIdRef` to drop stale responses and avoid playing outdated audio.
- Stop all audio when:
  - Starting a new request (text or mic) to avoid overlapping sounds.
  - Switching toys (to prevent previous toy’s audio from continuing).
- Mute handling:
  - Playback gated by `isMuted`.
  - Toggling mute ON calls `stopAllAudio()` to immediately stop playback.
- Conversation readiness guard:
  - Disabled input/mic until `getActiveConversation` for the selected toy is ready (`isConvReady`).
  - Input placeholder shows "Preparing conversation..." when not ready.
- UI/UX improvements for controls:
  - Moved mic and mute buttons to the right of the input.
  - Active states use a green treatment (not destructive red).
  - Tooltips for both buttons: “Sound on/Muted”, “Start/Stop recording”.
- TTS playback calls now use a unique ID and disable cache to prevent replaying the first audio:
  - `playAudio(response.audioData, { id: "chat-tts-<timestamp>", cache: false })`.

### apps/web/convex/messages.ts
- Web chat flow simplified and made stateless:
  - Replaced Agent-thread path with a direct LLM call via `aiServices.generateResponse`.
  - Constructed a system prompt from toy profile:
    - `toy.personalityPrompt`.
    - `toy.personalityTraits` (speaking style, traits, interests) instead of non-existent fields.
  - Kept kids safety checks for output.
  - TTS generation only when `includeAudio === true` (mirrors client mute state).
  - Saves both user and toy messages to the conversation as before.

### apps/web/src/lib/audio.ts
- On audio `ended` and `error`, revoke Object URLs for non-cached playbacks to avoid memory leaks when using `cache: false`.

### apps/web/src/app/dashboard/chat/page.tsx
- `ChatInterface` receives a `key={selectedToy._id}` so it remounts on toy switch. This resets per-component state and further prevents cross-toy bleed.


## Architecture after this change
- Web Text Flow:
  - UI -> `messages.sendMessage` -> `messages.generateAIResponse` -> `aiServices.generateResponse` -> (optional TTS if client requested) -> client `playAudio`.
- Web Mic Flow:
  - UI (MediaRecorder) -> WAV base64 -> `aiServices.transcribeAudio` -> `messages.sendMessage` -> `messages.generateAIResponse` -> (optional TTS) -> client `playAudio`.
- Physical Toy:
  - Device/Gateway -> `aiPipeline.processVoiceInteraction` (STT -> safety -> LLM -> optional TTS -> persist) -> Device playback.

This keeps the **web chat stateless and simple**, and the **physical toy pipeline specialized and audio-first**.


## Why we changed it
- Previously the web chat could trigger both `aiPipeline` (voice path) and Agent-driven `messages.generateAIResponse` concurrently, leading to confusing races and double work.
- TTS sometimes replayed the very first audio due to the cached object URL keyed by a constant ID—this is now fixed by using unique IDs and disabling cache for ChatInterface playback.
- Switching toys could leave audio playing from the previous toy; we now stop audio immediately on toy change and invalidate any in-flight replies.


## How we will use `agents.ts` later
`agents.ts` is not removed—it’s being reserved for its best use:

- Physical Toy’s Long-Term Brain
  - `aiPipeline.ts` can leverage `agents.ts` to maintain persistent threads and incorporate long-term context for the physical device.
  - When we enable semantic retrieval (vector search), we will configure a `textEmbeddingModel` for the Agent and set `vectorSearch: true` behind a capability check.

- Optional “High-Fidelity” Web Mode (Future)
  - We can add a feature flag (e.g., “Agent mode” toggle) to make the web chat use the full Agents stack for RAG/long memory testing.
  - This would switch `messages.generateAIResponse` to call into `internal.agents.generateToyResponse` again (after enabling embeddings and vector search), turning the web simulator into a true high-fidelity mirror of the physical toy.

- Guardrails for enabling Agent mode
  - Detect embedding capability at startup or via a health check action; log a clear warning if vector search is requested but embeddings aren’t configured.
  - Provide an admin UI toggle so we can switch between Stateless (simple) and Agent (RAG) modes without code changes.


## Operational notes
- ENV dependencies:
  - `ELEVENLABS_API_KEY` required for real TTS—otherwise development may produce silent/placeholder audio.
  - `SKIP_TTS` or public test modes on the server may skip TTS; the client respects mute and only requests audio when unmuted.
- Request guard:
  - Each outbound request increments `currentRequestIdRef`; only matching replies are allowed to play audio.
- Audio stop behavior:
  - `stopAllAudio()` is called on toy switch and before new playback to prevent overlaps.
- Conversation readiness:
  - Input/mic disabled until `getActiveConversation` for the selected toy is available.


## Testing checklist
- Text (unmuted): Send multiple messages and confirm unique, correct TTS each time.
- Text (muted): No audio plays.
- Mic: Record, stop, and confirm the transcript is used, only one reply appears, and TTS plays once (unmuted).
- Toy switch: While audio is playing, switch toys—audio stops immediately and subsequent replies are for the new toy only.


## Rollback / feature flags
- To restore Agent mode for web chat, update `messages.generateAIResponse` to call the Agent again and ensure embeddings are configured, then flip the feature flag.
- To simplify further or debug TTS, set `includeAudio: false` client-side and/or set `SKIP_TTS=true` server-side.


## Known pitfalls addressed
- Replaying the first TTS audio due to cached URLs keyed by a constant ID—fixed by unique IDs and `cache: false` in ChatInterface.
- Cross-toy audio bleed—fixed by stopping audio on toy change and remounting ChatInterface.
- Mute not stopping current audio—fixed by calling `stopAllAudio()` on mute toggle.
- Non-existent fields (`voiceTone`, `interests`)—replaced with `personalityTraits` fields in prompt building.


## Appendix: Future roadmap for `agents.ts`
- Configure embeddings for the Agent (e.g., via OpenAI embeddings through OpenRouter or another provider) and enable `vectorSearch`.
- Add streaming support end-to-end (Agent streaming tokens -> TTS streaming pipeline -> client streaming playback) for even lower latency.
- Expose an admin switch for Agent vs Stateless mode in web chat and a health page for embeddings/knowledge status.
