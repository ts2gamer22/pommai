#!/usr/bin/env node
const { ConvexClient } = require("convex/browser");

const CONVEX_URL = "https://warmhearted-snail-998.convex.cloud";

async function testProductionConvex() {
  const client = new ConvexClient(CONVEX_URL);
  
  try {
    // Test 1: Check if toy exists
    console.log("Testing production deployment...");
    console.log("Convex URL:", CONVEX_URL);
    
    // Create minimal WAV audio (silence)
    const minimalWav = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEB9AAACABAAZGF0YQAAAAA=";
    
    const args = {
      toyId: "kd729cad81984f52pz1v1f3gh57q3774",
      audioData: minimalWav,
      sessionId: "test-session",
      deviceId: "test-device",
      metadata: {
        timestamp: Date.now(),
        format: "wav",
        duration: 0
      }
    };
    
    console.log("Calling aiPipeline:processVoiceInteraction...");
    console.log("Toy ID:", args.toyId);
    
    // Set a timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout after 30 seconds")), 30000)
    );
    
    const actionPromise = client.action("aiPipeline:processVoiceInteraction", args);
    
    const result = await Promise.race([actionPromise, timeoutPromise]);
    
    console.log("Success! Result:", result);
    
  } catch (error) {
    console.error("Error:", error.message);
    
    // Try a simpler query
    console.log("\nTrying to query the toy directly...");
    try {
      const toy = await client.query("toys:getToy", { 
        toyId: "kd729cad81984f52pz1v1f3gh57q3774" 
      });
      console.log("Toy found:", toy);
    } catch (err) {
      console.error("Failed to get toy:", err.message);
    }
  } finally {
    await client.close();
  }
}

testProductionConvex().catch(console.error);
