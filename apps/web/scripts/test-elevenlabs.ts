import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = "https://warmhearted-snail-998.convex.cloud";

async function testElevenLabs() {
  const client = new ConvexClient(CONVEX_URL);
  
  console.log("Testing ElevenLabs API connection...\n");
  
  try {
    // Test 1: Sync default voices
    console.log("1. Testing syncDefaultVoices...");
    const syncResult = await client.action(api.aiServices.syncDefaultVoices, {});
    console.log("   Result:", syncResult);
    
    // Test 2: Try speech synthesis
    console.log("\n2. Testing synthesizeSpeech...");
    try {
      const speechResult = await client.action(api.aiServices.synthesizeSpeech, {
        text: "Hello, this is a test",
        voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel voice ID from ElevenLabs
      });
      
      if (speechResult?.audioData) {
        console.log("   ✓ Speech synthesis successful!");
        console.log("   Audio format:", speechResult.format);
        console.log("   Mock mode:", speechResult.isMock || false);
      }
    } catch (error) {
      console.error("   ✗ Speech synthesis failed:", error);
    }
    
    // Test 3: Check existing voices
    console.log("\n3. Checking existing voices...");
    const publicVoices = await client.query(api.voices.getPublicVoices, {});
    console.log(`   Found ${publicVoices?.length || 0} public voices`);
    
    const kidsFriendlyVoices = await client.query(api.voices.getKidsFriendlyVoices, {});
    console.log(`   Found ${kidsFriendlyVoices?.length || 0} kids-friendly voices`);
    
    // List voice names
    if (publicVoices && publicVoices.length > 0) {
      console.log("\n   Available voices:");
      publicVoices.slice(0, 5).forEach(v => {
        console.log(`   - ${v.name} (${v.externalVoiceId})`);
      });
    }
    
    console.log("\n✅ Tests complete!");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    await client.close();
  }
}

testElevenLabs().catch(console.error);
