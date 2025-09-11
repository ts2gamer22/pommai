#!/usr/bin/env node
/**
 * Create a test toy in Convex database
 */

const { ConvexClient } = require("convex/browser");

const CONVEX_URL = "https://warmhearted-snail-998.convex.cloud";

async function createTestToy() {
  const client = new ConvexClient(CONVEX_URL);
  
  try {
    // First, try to list existing toys
    console.log("Checking existing toys...");
    const toys = await client.query("toys:list");
    console.log(`Found ${toys?.length || 0} existing toys`);
    
    if (toys && toys.length > 0) {
      console.log("First toy ID:", toys[0]._id);
      console.log("First toy name:", toys[0].name);
      return toys[0]._id;
    }
    
    // Create a new toy if none exist
    console.log("Creating new test toy...");
    const toyId = await client.mutation("toys:create", {
      name: "Pommai Test Toy",
      personalityPrompt: "You are a friendly and helpful AI assistant toy. Be cheerful and engaging.",
      voiceTone: "cheerful",
      isForKids: true,
      voiceId: "JBFqnCBsd6RMkjVDRZzb", // Default ElevenLabs voice
      interests: ["learning", "playing", "stories"],
      isPublic: false
    });
    
    console.log("Created toy with ID:", toyId);
    return toyId;
    
  } catch (error) {
    console.error("Error:", error);
    
    // If toys:list doesn't exist, the schema might be different
    console.log("\nLet's check what functions are available...");
    // This would require listing all functions, which isn't directly available
    console.log("Please ensure Convex is properly deployed with: npx convex deploy");
  } finally {
    await client.close();
  }
}

createTestToy().then(toyId => {
  console.log("\n=================");
  console.log("Update your Raspberry Pi .env file with:");
  console.log(`TOY_ID=${toyId}`);
  console.log("=================");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
