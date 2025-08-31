#!/usr/bin/env tsx

/**
 * Test script for AI Pipeline Integration
 * Run with: npx tsx scripts/test-ai-pipeline.ts
 */

import { ConvexClient } from "convex/browser";
import dotenv from "dotenv";
import { api } from "../convex/_generated/api";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Missing NEXT_PUBLIC_CONVEX_URL in .env.local");
  process.exit(1);
}

async function testAIPipeline() {
  console.log("🚀 Testing AI Pipeline Integration\n");
  
  const client = new ConvexClient(CONVEX_URL);
  
  try {
    // Test 1: Check API Health
    console.log("1️⃣ Checking API Health...");
    const health = await client.action(api.aiServices.checkAPIHealth, {});
    console.log("API Health Status:");
    console.log("  - OpenAI:", health.openai ? "✅" : "❌");
    console.log("  - ElevenLabs:", health.elevenlabs ? "✅" : "❌");
    console.log("  - OpenRouter:", health.openrouter ? "✅" : "❌");
    
    if (health.errors.length > 0) {
      console.log("  Errors:", health.errors);
    }
    console.log();
    
    // Test 2: Test Speech-to-Text (with minimal audio)
    console.log("2️⃣ Testing Speech-to-Text...");
    // Create a minimal WAV file header (silent audio)
    const minimalWav = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x00, 0x00, 0x00, // File size
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6D, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // Subchunk size
      0x01, 0x00,             // Audio format (PCM)
      0x01, 0x00,             // Number of channels
      0x40, 0x1F, 0x00, 0x00, // Sample rate (8000)
      0x80, 0x3E, 0x00, 0x00, // Byte rate
      0x02, 0x00,             // Block align
      0x10, 0x00,             // Bits per sample
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x00, 0x00, 0x00  // Data size
    ]).toString('base64');
    
    try {
      const transcription = await client.action(api.aiServices.transcribeAudio, {
        audioData: minimalWav,
        language: "en",
      });
      console.log("  Transcription test completed (silent audio expected)");
    } catch (error) {
      console.log("  ⚠️ STT test failed (may need real audio):", error.message);
    }
    console.log();
    
    // Test 3: Test LLM Generation
    console.log("3️⃣ Testing LLM Generation...");
    const llmResponse = await client.action(api.aiServices.generateResponse, {
      messages: [
        { role: "system", content: "You are a friendly AI toy assistant." },
        { role: "user", content: "Hello! Can you count to 3?" }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.7,
      maxTokens: 50,
    });
    
    console.log("  LLM Response:", llmResponse.content?.substring(0, 100));
    console.log("  Model used:", llmResponse.model || "default");
    console.log();
    
    // Test 4: Test Text-to-Speech
    console.log("4️⃣ Testing Text-to-Speech...");
    try {
      const audio = await client.action(api.aiServices.synthesizeSpeech, {
        text: "Hello! I am your AI toy friend.",
        voiceId: "JBFqnCBsd6RMkjVDRZzb", // Default voice
        outputFormat: "mp3_44100_128",
      });
      
      console.log("  TTS completed successfully");
      console.log(`  Audio size: ${audio.byteSize} bytes`);
      console.log(`  Duration: ~${audio.duration} seconds`);
    } catch (error) {
      console.log("  ⚠️ TTS test failed:", error.message);
    }
    console.log();
    
    // Test 5: Test Embedding Generation
    console.log("5️⃣ Testing Embedding Generation...");
    const embedding = await client.action(api.aiServices.generateEmbedding, {
      text: "This is a test sentence for embedding generation.",
    });
    
    console.log("  Embedding generated successfully");
    console.log(`  Dimensions: ${embedding.embedding.length}`);
    console.log(`  Tokens used: ${embedding.tokenCount}`);
    console.log();
    
    // Test 6: Test Safety Check
    console.log("6️⃣ Testing Safety Check...");
    const safetyTests = [
      { text: "Let's play a fun game!", expected: true },
      { text: "I want to hurt someone", expected: false },
      { text: "What's your email address?", expected: false },
    ];
    
    for (const test of safetyTests) {
      const result = await client.action(api.aiPipeline.checkContentSafety, {
        text: test.text,
        level: "strict",
      });
      
      const passed = result.passed === test.expected;
      console.log(`  "${test.text.substring(0, 30)}...":`);
      console.log(`    Result: ${result.passed ? "Safe" : "Unsafe"} ${passed ? "✅" : "❌"}`);
      if (!result.passed) {
        console.log(`    Reason: ${result.reason}`);
      }
    }
    console.log();
    
    // Test 7: Test Complete Pipeline (if toy exists)
    console.log("7️⃣ Testing Complete Voice Pipeline...");
    console.log("  ⚠️ Requires a valid toy ID to test");
    console.log("  Would test: Audio → STT → Safety → LLM → TTS → Audio");
    console.log();
    
    console.log("✅ AI Pipeline tests completed!");
    console.log("\n📝 Summary:");
    console.log("- API connections tested");
    console.log("- Individual service functions tested");
    console.log("- Safety filtering tested");
    console.log("\n⚠️ Note: Some tests may fail if API keys are not configured");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the test
testAIPipeline().catch(console.error);
