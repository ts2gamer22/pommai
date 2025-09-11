// apps/web/scripts/test-toy-backend.mjs
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// --- CONFIGURATION ---
// 1. PASTE YOUR TOY ID HERE
const TOY_ID = "ks7cw1ar4x1x4h0ep21as78d7s7pt9xg"; // 👈 Using provided Toy ID

// 2. MAKE SURE YOUR CONVEX URL IS CORRECT IN .env.local
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

// --- SCRIPT ---

async function runTest() {
  if (!CONVEX_URL) {
    console.error("❌ NEXT_PUBLIC_CONVEX_URL is not set in your .env.local file.");
    return;
  }
  if (!TOY_ID || TOY_ID === "YOUR_TOY_ID") {
    console.error("❌ Please set TOY_ID in this script to your actual Toy ID from the Convex dashboard.");
    return;
  }

  // Allow passing an audio file path as the first CLI argument
  const cliAudioArg = process.argv[2];
  const audioPath = cliAudioArg
    ? (path.isAbsolute(cliAudioArg) ? cliAudioArg : path.resolve(process.cwd(), cliAudioArg))
    : path.resolve(process.cwd(), "test.wav");

  console.log("🚀 Starting AI Toy Backend Test...");
  console.log(`- Using Toy ID: ${TOY_ID}`);
  console.log(`- Connecting to Convex at: ${CONVEX_URL}`);
  console.log(`- Audio file: ${audioPath}`);

  const client = new ConvexClient(CONVEX_URL);

  // Optional: set auth token if provided in environment
  const AUTH_TOKEN = process.env.CONVEX_AUTH_TOKEN || process.env.AUTH_TOKEN || process.env.BETTER_AUTH_TOKEN;
  if (AUTH_TOKEN) {
    try {
      // ConvexClient accepts a token string in Node/browser contexts
      client.setAuth(AUTH_TOKEN);
      console.log("- Using auth token from environment");
    } catch (e) {
      console.warn("- Failed to set auth token from environment; proceeding unauthenticated");
    }
  } else {
    console.log("- No auth token set; proceeding unauthenticated");
  }

  try {
    // 1. Read and encode the test audio file
    console.log("\n🔊 Reading test audio file...");
    const audioBuffer = await fs.readFile(audioPath);
    const audioBase64 = audioBuffer.toString("base64");
    console.log("✅ Audio file encoded successfully.");

    // 2. Call the main AI pipeline action
    console.log("\n🧠 Calling the AI pipeline... (This may take a few seconds)");
    const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    const result = await client.action(api.aiPipeline.processVoiceInteraction, {
      toyId: TOY_ID,
      audioData: audioBase64,
      sessionId: `test-session-${Date.now()}`,
      deviceId: "test-script-runner",
      model: MODEL,
    });

    console.log("\n🎉 Pipeline executed successfully!");
    console.log("------------------------------------");
    console.log(`🗣️ You said (Transcription): "${result.transcription?.text || ""}"`);
    console.log(`🧸 Toy replied (Response): "${result.text}"`);
    console.log(`🔊 Audio Generated: ${result.audioData ? 'Yes' : 'No'} (${result.format})`);
    console.log(`⏱️ Total Processing Time: ${result.processingTime}ms`);
    console.log("------------------------------------");

    if (result.audioData) {
      console.log("\n✅ Test Passed! The full AI pipeline is working.");
    } else {
      console.warn("\n⚠️ Test Warning: The pipeline worked, but no audio was generated. Check your ElevenLabs API key.");
    }

  } catch (error) {
    console.error("\n❌ Test Failed!");
    console.error("An error occurred during the pipeline execution:", error);
  }
}

runTest();

