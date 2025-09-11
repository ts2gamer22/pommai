# API Test Guide (Backend: STT + LLM, TTS later)

This guide explains the backend test we ran to validate Speech-to-Text (STT) and Language Model (LLM) processing without Text-to-Speech (TTS). It also outlines what to prepare to enable ElevenLabs or Minimax TTS later.

---

What we tested
- Goal: Confirm cloud pipeline pieces (STT → LLM) work before touching the Raspberry Pi.
- Approach: Use a Node script to call Convex actions directly:
  - STT: aiServices.transcribeAudio (OpenAI Whisper)
  - LLM: aiServices.generateResponse (OpenRouter)
- Scope: TTS skipped (by design), so we avoid ElevenLabs free tier limitations.

Prerequisites
- apps/web/.env.local must include at least:
  - NEXT_PUBLIC_CONVEX_URL=https://original-jay-795.convex.cloud
  - OPENROUTER_API_KEY={{your_openrouter_key}}
  - OPENAI_API_KEY={{your_openai_key}} (used by Whisper)
- Audio file: Save a short WAV clip (>= 0.2s) with clear speech. Example used: C:\Users\Admin\Desktop\pommai\test4.wav

How to run
1) From the project root, run:
   - PowerShell (Windows):
     node apps/web/scripts/test-stt-llm.mjs "C:\\Users\\Admin\\Desktop\\pommai\\test4.wav"

2) Expected output:
   - STT: Transcription text and a confidence score
   - LLM: A short response from the model
   - No audio output (TTS intentionally skipped)

Interpreting results
- If STT fails with "Audio file is too short": provide a longer audio clip.
- If LLM fails with "No allowed providers": your OpenRouter account may not have access to that model. Set OPENROUTER_MODEL to a model you can use (e.g., openai/gpt-4o-mini) and re-run.
- If both pass, your core backend path (STT → LLM) is working.

Using the full aiPipeline later
- aiPipeline:processVoiceInteraction additionally:
  - Fetches toy config (requires user authentication)
  - Runs safety gates and logging
  - Generates TTS (ElevenLabs by default)
- Run it from an authenticated web context (user must be logged in), or provide a valid Convex user session token via the client you use to call the action.

Enabling ElevenLabs TTS later
- Requirements:
  - Paid/eligible ElevenLabs account (server-side TTS often restricted on free tier)
  - ELEVENLABS_API_KEY in apps/web/.env.local
- Verification checklist:
  - Run the existing script apps/web/scripts/test-ai-pipeline.ts
  - Confirm TTS step succeeds (no 401 Unauthorized / unusual activity messages)
- Common pitfalls:
  - Free tier abuse protections block server-side requests
  - Missing or invalid API key

Considering Minimax TTS (alternative)
- What to prepare:
  - Minimax TTS API credentials and endpoint docs
  - Decide target audio format (e.g., mp3_44100, wav/pcm) to match your Pi playback path
- Integration strategy:
  - Add a provider switch to the TTS action and route to Minimax’s REST endpoint
  - Return a base64 audio payload and format string identical to the current ElevenLabs shape
- Validation steps:
  - Unit test: provider returns audio bytes and correct format metadata
  - End-to-end: run a short text through aiServices.synthesizeSpeech with provider=minimax and verify the Pi can play it

Raspberry Pi .env (client)
- We created apps/raspberry-pi/.env with your Toy ID and placeholders:
  - FASTRTC_GATEWAY_URL=ws://192.168.1.100:8080/ws (adjust IP to your gateway host)
  - AUTH_TOKEN= (if your gateway requires auth)
  - DEVICE_ID=rpi-zero2w-001
  - TOY_ID=ks7cw1ar4x1x4h0ep21as78d7s7pt9xg
  - ENABLE_WAKE_WORD=false, ENABLE_OFFLINE_MODE=true
- Next when you’re ready, follow apps/raspberry-pi/DEPLOYMENT_GUIDE.md to deploy and run on the Pi.

Troubleshooting quick hits
- STT: ensure audio length and format are valid (WAV, 16 kHz mono is safe)
- LLM: switch model to one enabled on your OpenRouter account
- TTS (later): use a paid ElevenLabs account or integrate Minimax
- Auth (pipeline): run in a logged-in web context or provide a valid session token when calling actions

