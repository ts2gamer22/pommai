// apps/web/scripts/test-stt-llm.mjs
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL missing in apps/web/.env.local");
  process.exit(1);
}

const AUDIO_ARG = process.argv[2] || "test.wav";
const AUDIO_PATH = path.isAbsolute(AUDIO_ARG) ? AUDIO_ARG : path.resolve(process.cwd(), AUDIO_ARG);

const client = new ConvexClient(CONVEX_URL);

// Optional auth token
const AUTH_TOKEN = process.env.CONVEX_AUTH_TOKEN || process.env.AUTH_TOKEN || process.env.BETTER_AUTH_TOKEN;
if (AUTH_TOKEN) {
  try {
    client.setAuth(AUTH_TOKEN);
    console.log("- Using auth token from environment");
  } catch {}
}

async function main() {
  console.log("🚀 STT + LLM Smoke Test (no TTS)");
  console.log(`- Convex: ${CONVEX_URL}`);
  console.log(`- Audio: ${AUDIO_PATH}`);

  // Read audio
  const buf = await fs.readFile(AUDIO_PATH);
  const audioBase64 = buf.toString("base64");

  // 1) STT
  console.log("\n1️⃣ STT: Whisper transcription...");
  const transcription = await client.action(api.aiServices.transcribeAudio, {
    audioData: audioBase64,
    language: "en",
  });
  console.log("- Text:", transcription.text);
  console.log("- Confidence:", transcription.confidence);

  // 2) LLM via OpenRouter with fallback models
  console.log("\n2️⃣ LLM: Generating response (OpenRouter)...");
  const models = [
    process.env.OPENROUTER_MODEL,
    "openai/gpt-4o-mini",
    "google/gemini-1.5-flash",
    "meta-llama/llama-3.1-8b-instruct",
    "mistralai/mistral-7b-instruct",
  ].filter(Boolean);

  const messages = [
    {
      role: "system",
      content:
        "You are a friendly AI toy assistant. Keep it short and kid-safe when appropriate.",
    },
    { role: "user", content: transcription.text || "Hello!" },
  ];

  let llmResponse = null;
  let lastError = null;
  for (const model of models) {
    try {
      console.log(`- Trying model: ${model}`);
      llmResponse = await client.action(api.aiServices.generateResponse, {
        messages,
        model,
        temperature: 0.7,
        maxTokens: 150,
      });
      if (llmResponse?.content) {
        console.log("✅ Model worked:", model);
        break;
      }
    } catch (e) {
      lastError = e;
      console.log(`  ⚠️ Failed: ${model} ->`, e?.message || e);
    }
  }

  if (!llmResponse?.content) {
    console.error("❌ LLM generation failed for all fallback models.");
    if (lastError) console.error("Last error:", lastError);
    process.exit(1);
  }

  console.log("- LLM Response:", llmResponse.content);
  console.log("\n✅ STT + LLM test complete (TTS skipped)");
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});

