import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Main voice interaction pipeline
export const processVoiceInteraction = action({
  args: {
    toyId: v.id("toys"),
    audioData: v.string(), // Base64 encoded audio
    sessionId: v.string(),
    deviceId: v.string(),
    metadata: v.optional(v.object({
      timestamp: v.number(),
      duration: v.number(),
      format: v.string(),
    })),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    text: string;
    audioData: string;
    format: string;
    duration?: number;
    conversationId?: string;
    processingTime: number;
    transcription?: {
      text: string;
      confidence?: number;
    };
    error?: string;
  }> => {
    const startTime = Date.now();
    
    try {
      // Get toy configuration
      const toy = await ctx.runQuery(api.toys.getToy, { toyId: args.toyId });
      if (!toy) {
        throw new Error("Toy not found");
      }
      
      // Step 1: Speech-to-Text (Whisper)
      console.log("Step 1: Transcribing audio...");
      const transcription = await ctx.runAction(api.aiServices.transcribeAudio, {
        audioData: args.audioData,
        language: "en", // Default to English
      });
      
      console.log(`Transcribed: "${transcription.text}"`);
      
      // Step 2: Safety Check (for Kids mode)
      if (toy.isForKids) {
        console.log("Step 2: Running safety check...");
        const safetyCheck = await ctx.runAction(internal.aiPipeline.checkContentSafety, {
          text: transcription.text,
          level: "strict", // Default to strict for kids
        });
        
        if (!safetyCheck.passed) {
          console.log(`Safety check failed: ${safetyCheck.reason}`);
          
          // Generate safe redirect response
          const safeResponse = await ctx.runAction(internal.aiPipeline.getSafeRedirectResponse, {
            reason: safetyCheck.reason,
            voiceId: toy.voiceId || "JBFqnCBsd6RMkjVDRZzb", // Default voice
            voiceSettings: undefined,
          });
          
          // Log the interaction with safety flag
          await ctx.runMutation(api.conversations.createConversation, {
            toyId: args.toyId,
            deviceId: args.deviceId,
            sessionId: args.sessionId,
            location: "toy",
          });
          
          return {
            ...safeResponse,
            success: true,
            processingTime: Date.now() - startTime,
          };
        }
      }
      
      // Step 3: RAG - Retrieve relevant context (if enabled)
      let context = "";
      // RAG is disabled for now since ragEnabled field doesn't exist
      // if (toy.ragEnabled) {
      //   console.log("Step 3: Retrieving RAG context...");
      //   const relevantDocs = await ctx.runQuery(api.vectors.searchSimilar, {
      //     toyId: args.toyId,
      //     query: transcription.text,
      //     limit: 5,
      //     minRelevance: 0.7,
      //   });
      //   
      //   if (relevantDocs.length > 0) {
      //     context = relevantDocs.map(doc => doc.content).join("\n\n");
      //     console.log(`Found ${relevantDocs.length} relevant documents`);
      //   }
      // }
      
      // Step 4: LLM - Generate response
      console.log("Step 4: Generating AI response...");
      const messages = buildConversationMessages(toy, transcription.text, context, args.sessionId);
      
      const llmResponse = await ctx.runAction(api.aiServices.generateResponse, {
        messages,
        model: "openai/gpt-oss-120b", // Use default model
        temperature: 0.7, // Default temperature
        maxTokens: toy.isForKids ? 150 : 500, // Shorter responses for kids
      });
      
      console.log(`Generated response: "${llmResponse.content?.substring(0, 100)}..."`);
      
      // Step 5: Post-generation safety check (for Kids mode)
      if (toy.isForKids && llmResponse.content) {
        const outputSafetyCheck = await ctx.runAction(internal.aiPipeline.checkContentSafety, {
          text: llmResponse.content,
          level: "strict", // Default to strict for kids
        });
        
        if (!outputSafetyCheck.passed) {
          console.log("Output safety check failed, using fallback");
          llmResponse.content = "That's interesting! Let me think of something fun we can talk about instead.";
        }
      }
      
      // Step 6: Text-to-Speech (ElevenLabs)
      console.log("Step 5: Synthesizing speech...");
      const audio = await ctx.runAction(api.aiServices.synthesizeSpeech, {
        text: llmResponse.content || "Sorry, I couldn't generate a response.",
        voiceId: toy.voiceId || "JBFqnCBsd6RMkjVDRZzb", // Default voice
        voiceSettings: undefined,
        modelId: "eleven_multilingual_v2", // Default TTS model
        outputFormat: "mp3_44100_128",
      });
      
      // Step 7: Store conversation
      const conversationId = await ctx.runMutation(api.conversations.createConversation, {
        toyId: args.toyId,
        deviceId: args.deviceId,
        sessionId: args.sessionId,
        location: "toy",
      });
      
      const totalTime = Date.now() - startTime;
      console.log(`Pipeline completed in ${totalTime}ms`);
      
      return {
        success: true,
        text: llmResponse.content || "Sorry, I couldn't generate a response.",
        audioData: audio.audioData,
        format: audio.format,
        duration: audio.duration,
        conversationId,
        processingTime: totalTime,
        transcription: {
          text: transcription.text,
          confidence: transcription.confidence,
        },
      };
      
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Pipeline error:", errMsg);
      
      // Log error (commented out until errors module is created)
      // await ctx.runMutation(api.errors.logError, {
      //   type: "pipeline_error",
      //   message: errMsg,
      //   context: {
      //     toyId: args.toyId,
      //     deviceId: args.deviceId,
      //     sessionId: args.sessionId,
      //   },
      // });
      
      // Get toy for fallback (if not already fetched)
      let voiceId = "JBFqnCBsd6RMkjVDRZzb"; // Default voice
      try {
        const fallbackToy = await ctx.runQuery(api.toys.getToy, { toyId: args.toyId });
        if (fallbackToy) {
          voiceId = fallbackToy.voiceId || voiceId;
        }
      } catch {
        // Use default voice if toy fetch fails
      }
      
      // Return fallback response
      const fallbackText = "I'm having a little trouble right now. Can you try asking me again?";
      const fallbackAudio = await ctx.runAction(api.aiServices.synthesizeSpeech, {
        text: fallbackText,
        voiceId,
        outputFormat: "mp3_44100_128",
      });
      
      return {
        success: false,
        text: fallbackText,
        audioData: fallbackAudio.audioData,
        format: fallbackAudio.format,
        error: errMsg,
        processingTime: Date.now() - startTime,
      };
    }
  },
});

// Streaming voice interaction for lower latency
export const streamVoiceInteraction = action({
  args: {
    toyId: v.id("toys"),
    audioData: v.string(),
    sessionId: v.string(),
    deviceId: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    streaming: boolean;
    firstAudioChunk: any;
    text: string;
    transcription: string;
  }> => {
    const toy: any = await ctx.runQuery(api.toys.getToy, { toyId: args.toyId });
    if (!toy) throw new Error("Toy not found");
    
    // Start parallel processing for lower latency
    const [transcription, ttsPrep]: [any, any] = await Promise.all([
      // Transcribe audio
      ctx.runAction(api.aiServices.transcribeAudio, {
        audioData: args.audioData,
        language: "en", // Default to English
      }),
      // Prepare TTS settings (pre-warm)
      Promise.resolve({
        voiceId: toy.voiceId || "JBFqnCBsd6RMkjVDRZzb",
        voiceSettings: undefined,
      }),
    ]);
    
    // Generate LLM response with streaming
    const messages = buildConversationMessages(toy, transcription.text, "", args.sessionId);
    
    const llmStream: any = await ctx.runAction(api.aiServices.generateResponse, {
      messages,
      model: "openai/gpt-oss-120b", // Default model
      temperature: 0.7, // Default temperature
      maxTokens: toy.isForKids ? 150 : 500,
      stream: true,
    });
    
    // Start TTS streaming as soon as we have enough text
    if (llmStream.chunks && llmStream.chunks.length > 0) {
      // Process first chunk immediately
      const firstChunk: string = llmStream.chunks[0];
      const firstAudio: any = await ctx.runAction(api.aiServices.streamSpeech, {
        text: firstChunk,
        voiceId: ttsPrep.voiceId,
        modelId: "eleven_turbo_v2", // Faster model for streaming
        voiceSettings: ttsPrep.voiceSettings,
        optimizeStreamingLatency: 3,
      });
      
      return {
        success: true,
        streaming: true,
        firstAudioChunk: firstAudio, // ElevenLabs returns audio data directly
        text: llmStream.content,
        transcription: transcription.text,
      };
    }
    
    throw new Error("No response generated");
  },
});

// Internal safety check function
export const checkContentSafety = internalAction({
  args: {
    text: v.string(),
    level: v.union(v.literal("strict"), v.literal("moderate"), v.literal("relaxed")),
  },
  handler: async (ctx, args) => {
    // Basic safety check implementation
    // In production, this would use Azure Content Safety API or similar
    
    const blockedPatterns = {
      strict: [
        /\b(kill|hurt|death|die|blood|weapon|violence|scary|monster|nightmare)\b/gi,
        /\b(hate|stupid|dumb|idiot|shut up)\b/gi,
        /\b(drugs|alcohol|smoke|cigarette)\b/gi,
      ],
      moderate: [
        /\b(kill|death|weapon|violence)\b/gi,
        /\b(drugs|alcohol)\b/gi,
      ],
      relaxed: [
        /\b(explicit violence|graphic content)\b/gi,
      ],
    };
    
    const patterns = blockedPatterns[args.level];
    let score = 1.0;
    let reason = "";
    
    for (const pattern of patterns) {
      if (pattern.test(args.text)) {
        score = 0;
        reason = "inappropriate_content";
        break;
      }
    }
    
    // Check for personal information patterns
    const personalInfoPattern = /\b(\d{3}-\d{2}-\d{4}|\d{9}|[\w._%+-]+@[\w.-]+\.[A-Z]{2,})\b/gi;
    if (personalInfoPattern.test(args.text)) {
      score = Math.min(score, 0.3);
      reason = reason || "personal_information";
    }
    
    return {
      passed: score > 0.5,
      score,
      reason,
      severity: score === 0 ? 5 : Math.floor((1 - score) * 5),
    };
  },
});

// Get safe redirect response
export const getSafeRedirectResponse = internalAction({
  args: {
    reason: v.string(),
    voiceId: v.string(),
    voiceSettings: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<{
    text: string;
    audioData: string;
    format: string;
    wasSafetyRedirect: boolean;
  }> => {
    const redirectResponses = {
      inappropriate_content: [
        "That's an interesting thought! How about we talk about your favorite game instead?",
        "Hmm, let's think of something fun to chat about! What makes you happy?",
        "I love talking about fun things! What's your favorite thing to do?",
      ],
      personal_information: [
        "Let's keep our personal information private! What's your favorite color?",
        "I like to keep things fun and safe! Want to hear a joke instead?",
        "That's private information! How about we play a word game?",
      ],
      unknown: [
        "Let's talk about something else! What did you do today that was fun?",
        "I have a better idea! Want to hear a story?",
        "How about we chat about your hobbies instead?",
      ],
    };
    
    const responses = (redirectResponses as Record<string, string[]>)[args.reason] || redirectResponses.unknown;
    const text = responses[Math.floor(Math.random() * responses.length)];
    
    // Generate audio for the redirect response
    const audio: any = await ctx.runAction(api.aiServices.synthesizeSpeech, {
      text,
      voiceId: args.voiceId,
      voiceSettings: args.voiceSettings,
      outputFormat: "mp3_44100_128",
    });
    
    return {
      text,
      audioData: audio.audioData,
      format: audio.format,
      wasSafetyRedirect: true,
    };
  },
});

// Helper function to build conversation messages
function buildConversationMessages(
  toy: any,
  userMessage: string,
  context: string,
  sessionId: string
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const messages = [];
  
  // System prompt with toy personality
  let systemPrompt = `You are ${toy.name}, a friendly AI toy companion.
Personality: ${toy.personalityPrompt || "friendly and helpful"}
Voice: ${toy.voiceTone || "cheerful and engaging"}`;
  
  if (toy.isForKids) {
    systemPrompt += `

IMPORTANT RULES FOR CHILDREN:
- Use simple, age-appropriate language
- Keep responses short (2-3 sentences maximum)
- Be positive, encouraging, and educational
- Never discuss inappropriate topics
- Redirect to fun activities if asked about adult topics
- Use excitement and wonder in your responses`;
  }
  
  if (toy.interests?.length > 0) {
    systemPrompt += `
Interests: ${toy.interests.join(", ")}`;
  }
  
  if (context) {
    systemPrompt += `

Relevant Context:
${context}`;
  }
  
  messages.push({
    role: "system" as const,
    content: systemPrompt,
  });
  
  // Add conversation history if available (would need to fetch from DB)
  // For now, just add the current message
  messages.push({
    role: "user" as const,
    content: userMessage,
  });
  
  return messages;
}

// Batch processing for multiple audio chunks
export const processBatchAudio = action({
  args: {
    toyId: v.id("toys"),
    audioChunks: v.array(v.object({
      id: v.string(),
      audioData: v.string(),
    })),
    sessionId: v.string(),
    deviceId: v.string(),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const results: any[] = await Promise.all(
      args.audioChunks.map(async (chunk): Promise<any> => {
        try {
        const result: any = await ctx.runAction(api.aiPipeline.processVoiceInteraction, {
            toyId: args.toyId,
            audioData: chunk.audioData,
            sessionId: args.sessionId,
            deviceId: args.deviceId,
          });
          
          return {
            id: chunk.id,
            ...result,
          };
          } catch (error: unknown) {
            return {
              id: chunk.id,
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
      })
    );
    
    return results;
  },
});

// Pre-warm AI services for lower latency
export const prewarmServices = action({
  args: {
    toyId: v.id("toys"),
  },
  handler: async (ctx, args) => {
    const toy = await ctx.runQuery(api.toys.getToy, { toyId: args.toyId });
    if (!toy) throw new Error("Toy not found");
    
    // Pre-warm services with minimal requests
    const warmupTasks = [
      // Warm up STT
      ctx.runAction(api.aiServices.transcribeAudio, {
        audioData: "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQAAAAA=", // Minimal WAV
        language: "en", // Default to English
      }).catch(() => {}),
      
      // Warm up LLM
      ctx.runAction(api.aiServices.generateResponse, {
        messages: [{ role: "user", content: "Hi" }],
        model: "openai/gpt-oss-120b", // Default model
        maxTokens: 10,
      }).catch(() => {}),
      
      // Warm up TTS
      ctx.runAction(api.aiServices.synthesizeSpeech, {
        text: "Hi",
        voiceId: toy.voiceId || "JBFqnCBsd6RMkjVDRZzb", // Default voice
        outputFormat: "mp3_44100_128",
      }).catch(() => {}),
    ];
    
    await Promise.all(warmupTasks);
    
    return { warmed: true };
  },
});
