const { ConvexClient } = require("convex/browser");

async function test() {
    const client = new ConvexClient("https://warmhearted-snail-998.convex.cloud");
    
    // Minimal WAV file (silence)
    const testAudio = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEB9AAACABAAZGF0YQAAAAA=";
    
    try {
        console.log("Testing Convex action...");
        const result = await client.action("aiPipeline:processVoiceInteraction", {
            toyId: "kd729cad81984f52pz1v1f3gh57q3774",
            audioData: testAudio,
            sessionId: "test",
            deviceId: "test",
            metadata: {
                timestamp: Date.now(),
                format: "wav",
                duration: 0
            }
        });
        console.log("Result:", result);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}

test();
