# Pommai Refactor Plan — Parallel Phases & Single‑Owner Agents

Purpose
- Execute the production improvements as a coordinated refactor across parallel phases
- Assign exactly one accountable agent per phase to reduce handoffs and unblock progress
- Log all changes per agent in refactorlogs.md for traceability

Guiding principles
- Parallel by default, block only on true dependencies
- Small PRs with observable impact; measure before/after
- Backwards compatible where possible; use feature flags and kill‑switches
- Security and safety are first‑class concerns (Guardian Mode, content safety, secret hygiene)

Execution model
- Ownership: Each phase has a single Phase Owner (Agent) with authority to decide and merge within scope
- Standup cadence: 15m async update in refactorlogs.md daily; weekly checkpoint aligning cross‑phase interfaces
- Interfaces: Each phase publishes Inputs, Outputs, and Integration Points
- Done means done: Each phase has Definition of Done (DoD) and success metrics; changes documented in refactorlogs.md

Phases overview (run in parallel)
- A. Web Platform & UX (Next.js 15 + Tailwind + Chat UX)
- B. Convex Backend: Performance, Limits, Caching, Components
- C. Real‑time Comms: FastRTC Gateway + Cloudflare TURN/WebRTC
- D. Raspberry Pi Client: Audio, Wake Word, LEDs, Stability
- E. AI Services & Safety: TTS migration, guardrails, content safety
- F. DevOps & CI/CD: Docker, GitHub Actions, environments
- G. Observability & SLOs: Metrics, logs, load tests
- H. Documentation & DX: API docs, READMEs, developer workflow

A. Web Platform & UX — Agent A (Owner)
Mission
- Make the web experience production‑ready, compliant with App Router conventions, and ship a usable chat interface
Scope (maps to improvement items)
- Fix Chat Interface [#14]
- Replace placeholder content [#15]
- Ensure App Router conventions and Tailwind v4 integration (from WARP.md/PLAN.md)
Outputs
- Production‑ready chat UI and landing content; stable route handlers; Tailwind config verified
DoD / Metrics
- Lighthouse PWA/Perf >= 85; no console errors; zero SSR hydration warnings in CI
Dependencies
- None (pure FE), coordinates with B for API shapes
Reference docs
- Next.js: /vercel/next.js — App Router, route handlers, migration notes

B. Convex Backend (Perf, Limits, Caching, Components) — Agent B (Owner)
Mission
- Harden Convex layer: indexes, caching, rate limits, batch APIs; prepare for RAG/Agents integration
Scope
- Rate limiting [#12]
- Batch processor [#10]
- Query indexes + schema updates [#25]
- Caching layer [#26]
- Align with Convex Agent/Components where applicable (RAG planned in PLAN.md)
Outputs
- Documented indexes; rate limiter hooks; batch endpoints; cache hit report
DoD / Metrics
-  p50 query < 25ms; p95 < 100ms; cache hit rate > 60% on eligible reads
Dependencies
- Coordinates with A for hook exposure; E for token budgets
Reference docs
- Convex: /get-convex/convex-backend — indexes, components, rate‑limiter

C. Real‑time Comms (FastRTC + WebRTC/TURN) — Agent C (Owner)
Mission
- Simplify gateway to single implementation; configure Cloudflare TURN; ensure reliable NAT traversal
Scope
- Remove duplicate FastRTC impl and standardize relay [#1]
- Cloudflare TURN credentials & RTC config [#4]
- Align with deployment packaging (Docker) [#19] for gateway
Outputs
- One gateway binary/image; reproducible TURN credentials flow; integration tests
DoD / Metrics
- NAT traversal success > 99%; reconnect < 2s; e2e audio round trip < 200ms under test profile
Dependencies
- D for client handshake; G for metrics endpoints
Reference docs
- Cloudflare Docs: /cloudflare/cloudflare-docs — Realtime TURN, generate ICE servers

D. Raspberry Pi Client (Audio, Wake Word, LEDs, Stability) — Agent D (Owner)
Mission
- Stabilize device UX (LEDs, button), improve audio pipeline (Opus, buffers), robust lifecycle
Scope
- ReSpeaker LED fix [#3]
- Opus codec tuning [#8]
- Audio buffer pool [#9]
- setup.sh fixes + hardware detection [#16][#17]
- Improved wake word (Porcupine) [#18]
- Memory/async cleanup [#21][#22]
Outputs
- Deterministic audio & LED behavior; wake‑word accuracy improved; clean shutdown
DoD / Metrics
- Peak RAM < 100MB; GC pauses negligible; wake word FAR/FRR within target; zero zombie tasks after disconnect
Dependencies
- C for RTC parameters; E for TTS voice formats
Reference docs
- Porcupine wake word: /picovoice/porcupine
- (Opus codec notes: Xiph Opus spec; WebCodecs for stream concepts)

E. AI Services & Safety (TTS, Guardrails, Content Safety) — Agent E (Owner)
Mission
- Reduce cost via TTS provider migration; enforce multi‑layer safety in pipeline
Scope
- ElevenLabs → Minimax TTS migration [#2]
- GuardrailsAI integration on gateway [#11]
- Azure Content Safety policy & thresholds (as in PLAN.md) 
Outputs
- Runtime‑selectable TTS provider; safety gates documented and measured
DoD / Metrics
- 80% TTS cost reduction; 0 critical safety incidents in test suite; latency impact < 150ms
Dependencies
- B for rate limits & token budgets; C/D for audio format compatibility
Reference docs
- Azure Content Safety: /microsoftdocs/azure-docs (Content Safety policy)

F. DevOps & CI/CD (Docker, CI, Environments) — Agent F (Owner)
Mission
- Production packaging, repeatable deploys, and guarded rollouts
Scope
- Production docker‑compose [#19]
- GitHub Actions CI/CD [#20]
- Image size reductions and tagging; secrets management patterns
Outputs
- CI pipelines (test→build→push→deploy); prod compose; rollout docs
DoD / Metrics
- Green CI; build < 10m; image size targets (web < 800MB; gateway < 300MB)
Dependencies
- C for gateway image; A/B for web build; G for metrics sidecars
Reference docs
- GitHub Actions Starter Workflows: /actions/starter-workflows

G. Observability & SLOs (Metrics, Logs, Load) — Agent G (Owner)
Mission
- Expose actionable metrics/logs and validate scale targets
Scope
- Prometheus metrics [#23]
- Structured logging [#24]
- Load testing [#28]
Outputs
- Metrics endpoints (gateway, client, web);
- Log fields: correlation IDs, device_id, toy_id; k6 load scripts
DoD / Metrics
- Dashboards with SLOs; alert rules defined; withstand staged load profile
Dependencies
- All services provide hooks; F wires collectors
Reference docs
- Prometheus Python Client: /prometheus/client_python

H. Documentation & DX — Agent H (Owner)
Mission
- Ensure developers and parents can use, extend, and operate the platform
Scope
- API docs [#29]
- README updates [#30]
- WARP commands and setup guides kept current
Outputs
- Docs in docs/ and app READMEs; links in UI where appropriate
DoD / Metrics
- Zero broken doc links; onboarding time < 30m to run dev stack
Dependencies
- All other phases for latest interfaces

Cross‑phase alignment
- Security: secret management, TURN creds TTL, content safety thresholds
- Data: schema/index changes communicated before merge (B→A)
- Audio formats: codec/bitrate/stream framing agreed (C↔D↔E)

Change logging
- All agents must write an entry to refactorlogs.md per merged PR with: date, scope, tasks addressed (IDs), migration notes, perf deltas, and backout steps

Appendix — Mapping from PRODUCTION_IMPROVEMENT_PLAN.md
- A: #14, #15 (+ App Router hardening)
- B: #10, #12, #25, #26
- C: #1, #4 (+ gateway packaging in #19)
- D: #3, #8, #9, #16, #17, #18, #21, #22
- E: #2, #11 (+ Azure Content Safety as per PLAN.md)
- F: #19, #20
- G: #23, #24, #28
- H: #29, #30

