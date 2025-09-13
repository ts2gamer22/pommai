// Using built-in fetch (Node 18+)

const ELEVENLABS_API_KEY = "sk_5c10eb2b6c46788bf8c18464f9b2efff27f4b091163e8738";

async function testElevenLabsDirectly() {
  console.log("Testing ElevenLabs API directly...\n");

  // Test 1: Get user info
  console.log("1. Testing user subscription info...");
  try {
    const userResponse = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      }
    });
    
    if (!userResponse.ok) {
      console.error("   ✗ Failed to get user info:", userResponse.status, userResponse.statusText);
      const text = await userResponse.text();
      console.error("   Response:", text);
    } else {
      const userData = await userResponse.json();
      console.log("   ✓ User info retrieved successfully!");
      console.log("   Subscription:", userData.subscription);
      console.log("   Character count:", userData.subscription?.character_count);
      console.log("   Character limit:", userData.subscription?.character_limit);
    }
  } catch (error) {
    console.error("   ✗ Error getting user info:", error);
  }

  // Test 2: Get available voices
  console.log("\n2. Testing available voices...");
  try {
    const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      }
    });
    
    if (!voicesResponse.ok) {
      console.error("   ✗ Failed to get voices:", voicesResponse.status, voicesResponse.statusText);
    } else {
      const voicesData = await voicesResponse.json();
      console.log(`   ✓ Found ${voicesData.voices?.length || 0} voices`);
      
      // List first 5 voices
      if (voicesData.voices && voicesData.voices.length > 0) {
        console.log("   Available voices:");
        voicesData.voices.slice(0, 5).forEach(v => {
          console.log(`   - ${v.name} (${v.voice_id}) - ${v.category || 'custom'}`);
        });
      }
    }
  } catch (error) {
    console.error("   ✗ Error getting voices:", error);
  }

  // Test 3: Simple TTS with Rachel voice
  console.log("\n3. Testing Text-to-Speech with Rachel (free voice)...");
  try {
    const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: "Hello, this is a test.",
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });
    
    if (!ttsResponse.ok) {
      console.error("   ✗ TTS failed:", ttsResponse.status, ttsResponse.statusText);
      const text = await ttsResponse.text();
      console.error("   Response:", text);
    } else {
      console.log("   ✓ TTS successful! Audio generated.");
      const contentType = ttsResponse.headers.get('content-type');
      console.log("   Content type:", contentType);
    }
  } catch (error) {
    console.error("   ✗ Error with TTS:", error);
  }

  console.log("\n✅ Direct API tests complete!");
}

testElevenLabsDirectly().catch(console.error);
