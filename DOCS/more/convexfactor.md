# Convex Factor Plan

This plan enumerates the tasks to evolve our AI system to a unified, maintainable architecture powered by Convex Agent, embeddings, and workflows.

Phases

Phase 0 — Baseline stability (DONE)
- Disable vectorSearch where no embeddings are configured to prevent fallback replies in web chat.
- Document current flows (aiflow.md).

Phase 1 — Embeddings + Agent defaults (IN PROGRESS)
1. Add an embedding model to the Agent so vectorSearch can be enabled:
   - Use OpenAI embedding (text-embedding-3-small) via AI SDK or an adapter.
   - Implement adapter (done) calling api.aiServices.generateEmbedding from Convex.
   - Attach textEmbeddingModel to Agent in createAgentWithContext.
2. Re-enable vectorSearch where includeKnowledge is true (done for non-kids path), keep a guard pattern in place.
3. Add a capability check if needed: if embedding model not available, auto-fallback to vectorSearch=false with a warning.
4. Testing: generate responses and verify no assertion errors; verify enhanced recall across turns.

Phase 2 — Prompt refactor and modularization
5. Extract prompt composition to dedicated modules:
   - prompts/base.ts (persona + speaking style)
   - prompts/kids.ts (safety rules)
   - prompts/tools.ts (tool usage guidance)
6. Set Agent default instructions from these modules; keep per-call system additions short and focused.
7. Ensure consistent prompt application for both toy and web chat.

Phase 3 — Tools under Agent + unify kids mode
8. Move kids tools (quiz_generate, quiz_grade, save_progress, tts_play) into Agent.tools via createTool.
9. Set stopWhen to allow tool calls (e.g., stepCountIs(2) to (5)).
10. Switch kids mode generation to Agent.generateText; remove direct OpenRouter tool_calls usage for kids.
11. Validate tool calls are being persisted by Agent and results are saved.

Phase 4 — Unify AI toy pipeline with Agent
12. Update aiPipeline.processVoiceInteraction to:
   - Save user message via agent.saveMessage or via message saving with embeddings.
   - Generate text via agent.generateText or streamText.
   - Preserve TTS/STT via aiServices.
13. Keep thread creation/continuation consistent with web chat.
14. Verify latency and memory footprint; tune contextOptions (recentMessages, search limits).

Phase 5 — Workflows
15. Introduce Convex Workflow for multi-step learning sessions:
   - Create a session workflow: plan → quiz → answers → grade → save_progress.
   - Optional RAG: inject knowledge from indexed toyKnowledge.
16. Add return types to handlers to avoid circular dependency issues (per docs/debugging).

Phase 6 — Knowledge and RAG (optional but recommended)
17. Index toyKnowledge as Agent messages (isKnowledge=true) and/or use Convex RAG component.
18. Provide a searchContext tool using rag.search; allow LLM to use it when needed.
19. Tune vectorScoreThreshold and messageRange.

Phase 7 — Observability, rate limiting, health
20. Add usageHandler to record usage; integrate @convex-dev/rate-limiter token and message quotas.
21. Add rawRequestResponseHandler for audits and debugging.
22. Add health checks: embeddings test, OpenRouter model list, Whisper health, TTS voice check.

Phase 8 — UI updates (heads-up)
23. Web chat UI considerations:
   - Indicate when context was retrieved (e.g., small badge: "found relevant history").
   - Stream message deltas (already possible via Agent; optional event hooks).
   - Expose toggle for "knowledge" if you’d like users to control vectorSearch.
24. Toy UI (gateway/companion app):
   - Surface session/lesson state from workflow.
   - Display progress and quiz results.

Milestones and acceptance
- M1 (Phase 1):
  - No fallback errors. vectorSearch enabled with embeddings.
  - Basic recall quality improved over pure recentMessages.
- M2 (Phase 2–3):
  - Modular prompts and Agent tools; kids mode migrated to Agent.
  - Tool calls persisted; stopWhen tuned.
- M3 (Phase 4):
  - Toy pipeline uses Agent; parity with web chat.
- M4 (Phase 5–6):
  - Workflow session functional; optional RAG integrated.
- M5 (Phase 7–8):
  - Usage tracking, rate limits, health checks; basic UI affordances for context/streaming.

Open questions
- Provider choices and cost constraints for embeddings? (OpenAI works now since Whisper already configured.)
- How deep should tool-calling chains go by default? (stopWhen tuning.)
- RAG namespace strategy (per toyId or per userId) and data governance.
