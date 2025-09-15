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
    model: v.optional(v.string()),
    skipTTS: v.optional(v.boolean()), // Allow gateway to skip TTS when streaming directly
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
    toyConfig?: {
      voiceId: string;
      ttsProvider?: string;
      voiceSettings?: any;
    };
    error?: string;
  }> => {
    const startTime = Date.now();
    
    try {
      // Determine test mode and auth state
      const identity = await ctx.auth.getUserIdentity();
      const allowUnauthTests = (process.env.ALLOW_UNAUTH_TESTS || "true").toLowerCase() === "true";
      const publicTest = !identity && allowUnauthTests;
      const skipTTS = args.skipTTS || (process.env.SKIP_TTS || "true").toLowerCase() === "true" || !process.env.ELEVENLABS_API_KEY;
      // Prefer explicit model from args/env, otherwise use OSS models from OpenRouter
      // Use the OpenAI OSS models that are available on OpenRouter
      const primaryModel = args.model || process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b";
      const fallbackModel = process.env.OPENROUTER_MODEL_FALLBACK || "openai/gpt-oss-20b";

      // Get toy configuration (or stub in public test mode)
      let toy: any;
      if (publicTest) {
        toy = {
          name: "TestToy",
          isForKids: false,
          voiceId: "JBFqnCBsd6RMkjVDRZzb",
          personalityPrompt: "friendly and helpful",
          interests: [],
          voiceTone: "cheerful",
        };
      } else {
        toy = await ctx.runQuery(api.toys.getToy, { toyId: args.toyId });
        if (!toy) throw new Error("Toy not found");
      }
      
      // Step 1: Speech-to-Text (Whisper)
      console.log("Step 1: Transcribing audio...");
      const sttStart = Date.now();
      let transcription: any;
      try {
        transcription = await ctx.runAction(api.aiServices.transcribeAudio, {
          audioData: args.audioData,
          language: "en", // Default to English
        });
      } catch (e: any) {
        const dt = Date.now() - sttStart;
        console.error(`STT failed after ${dt}ms (audioDataLen=${args.audioData.length}, format=${args.metadata?.format || 'unknown'})`, e?.message || e);
        throw e;
      }
      const sttMs = Date.now() - sttStart;
      console.log(`Transcribed in ${sttMs}ms: "${transcription.text}"`);
      
      // Step 2: Safety Check (for Kids mode)
      if (toy.isForKids) {
        console.log("Step 2: Running safety check...");
        const safetyCheck = await ctx.runAction(internal.aiPipeline.checkContentSafety, {
          text: transcription.text,
          level: "strict", // Default to strict for kids
        });
        
        if (!safetyCheck.passed && !publicTest) {
          console.log(`Safety check failed: ${safetyCheck.reason}`);
          
          // Generate safe redirect response
          const safeResponse = await ctx.runAction(internal.aiPipeline.getSafeRedirectResponse, {
            reason: safetyCheck.reason,
            voiceId: toy.voiceId || "JBFqnCBsd6RMkjVDRZzb", // Default voice
            voiceSettings: undefined,
          });
          
          // Ensure conversation exists and persist both messages (skip in public test)
          if (!publicTest) {
            const conversationId = await ctx.runMutation(internal.conversations.getOrCreate, {
              toyId: args.toyId,
              deviceId: args.deviceId,
              sessionId: args.sessionId,
              location: "toy",
            });

            await ctx.runMutation(internal.messages.logMessage, {
              conversationId,
              role: "user",
              content: transcription.text,
              metadata: {
                safetyScore: 0,
                flagged: true,
                safetyFlags: [safetyCheck.reason],
              },
            });

            await ctx.runMutation(internal.messages.logMessage, {
              conversationId,
              role: "toy",
              content: safeResponse.text,
              metadata: {
                safetyScore: 1.0,
                flagged: false,
              },
            });

            return {
              ...safeResponse,
              success: true,
              processingTime: Date.now() - startTime,
            };
          }

          // Public test: return text-only response
          return {
            success: true,
            text: safeResponse.text,
            audioData: "",
            format: "skipped",
            processingTime: Date.now() - startTime,
            transcription: { text: transcription.text },
          };
        }
      }
      
      // Step 3 & 4: Generation
      let generatedText = "";
      if (publicTest) {
        console.log("Step 3: Generating AI response via OpenRouter (public test mode)...");
        const messages = buildConversationMessages(toy, transcription.text, "", args.sessionId);
        let llmResp: any;
        try {
          llmResp = await ctx.runAction(api.aiServices.generateResponse, {
            messages,
            model: primaryModel,
            temperature: 0.7,
            maxTokens: toy.isForKids ? 150 : 500,
          });
        } catch (e: any) {
          const msg = (e?.message || String(e) || "").toLowerCase();
          const providerErr = msg.includes("no allowed providers are available") || msg.includes("404");
          if (providerErr) {
            console.log(`Primary model failed (${primaryModel}), falling back to ${fallbackModel}: ${e?.message || e}`);
            llmResp = await ctx.runAction(api.aiServices.generateResponse, {
              messages,
              model: fallbackModel,
              temperature: 0.7,
              maxTokens: toy.isForKids ? 150 : 500,
            });
          } else {
            throw e;
          }
        }
        generatedText = (llmResp && llmResp.content) || "Sorry, I couldn't generate a response.";
      } else {
        console.log("Step 3: Ensuring canonical agent thread...");
        const { threadId } = await ctx.runMutation(api.agents.getOrCreateToyThread, {
          toyId: args.toyId,
          userId: toy.creatorId,
        });

        console.log("Step 4: Generating AI response via Agent...");
        const agentResult: any = await ctx.runAction(internal.agents.generateToyResponse, {
          threadId,
          toyId: args.toyId,
          prompt: transcription.text,
          includeKnowledge: true,
        });
        generatedText = agentResult.text || "Sorry, I couldn't generate a response.";
      }

      // Post-generation safety for kids
      if (toy.isForKids && generatedText) {
        const outputSafetyCheck = await ctx.runAction(internal.aiPipeline.checkContentSafety, {
          text: generatedText,
          level: "strict",
        });
        if (!outputSafetyCheck.passed) {
          console.log("Output safety check failed, using fallback");
          generatedText = "That's interesting! Let me think of something fun we can talk about instead.";
        }
      }

      // Step 5: Text-to-Speech (skip if gateway is streaming)
      let audio = { audioData: "", format: "skipped", duration: undefined as number | undefined } as any;
      if (!skipTTS && !publicTest) {
        // Gateway is NOT streaming, generate TTS in Convex
        console.log("Step 5: Synthesizing speech in Convex...");
        audio = await ctx.runAction(api.aiServices.synthesizeSpeech, {
          text: generatedText,
          voiceId: toy.voiceId || "JBFqnCBsd6RMkjVDRZzb",
          provider: toy.ttsProvider || "elevenlabs",
          voiceSettings: toy.voiceSettings,
          modelId: "eleven_multilingual_v2",
          outputFormat: "mp3_44100_128",
        });
      } else if (skipTTS) {
        // Gateway will stream TTS directly
        console.log("Step 5: TTS skipped - gateway will stream directly");
      }
      
      // Step 7: Persist messages (skip in public test)
      let conversationId: Id<"conversations"> | undefined = undefined as any;
      if (!publicTest) {
        conversationId = await ctx.runMutation(internal.conversations.getOrCreate, {
          toyId: args.toyId,
          deviceId: args.deviceId,
          sessionId: args.sessionId,
          location: "toy",
        }) as unknown as Id<"conversations">;

        await ctx.runMutation(internal.messages.logMessage, {
          conversationId,
          role: "user",
          content: transcription.text,
          metadata: {
            safetyScore: toy.isForKids ? 1.0 : 1.0,
            flagged: false,
          },
        });

        await ctx.runMutation(internal.messages.logMessage, {
          conversationId,
          role: "toy",
          content: generatedText,
          metadata: {
            safetyScore: 1.0,
            flagged: false,
          },
        });
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`Pipeline completed in ${totalTime}ms`);
      
      return {
        success: true,
        text: generatedText,
        audioData: audio.audioData || "",
        format: audio.format || (skipTTS ? "skipped" : ""),
        duration: audio.duration,
        conversationId: conversationId ? (conversationId as unknown as string) : undefined,
        processingTime: totalTime,
        transcription: {
          text: transcription.text,
          confidence: transcription.confidence,
        },
        toyConfig: {
          voiceId: toy.voiceId || "JBFqnCBsd6RMkjVDRZzb",
          ttsProvider: toy.ttsProvider || "elevenlabs",
          voiceSettings: toy.voiceSettings || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        },
      };
      
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Pipeline error:", errMsg);
      
      const skipTTS = (process.env.SKIP_TTS || "").toLowerCase() === "true" || !process.env.ELEVENLABS_API_KEY;
      // Fallback response
      const fallbackText = "I'm having a little trouble right now. Can you try asking me again?";
      
      if (skipTTS) {
        return {
          success: false,
          text: fallbackText,
          audioData: "",
          format: "skipped",
          error: errMsg,
          processingTime: Date.now() - startTime,
        };
      }

      // Try TTS fallback if allowed
      let voiceId = "JBFqnCBsd6RMkjVDRZzb"; // Default voice
      try {
        const fallbackToy = await ctx.runQuery(api.toys.getToy, { toyId: args.toyId });
        if (fallbackToy) {
          voiceId = fallbackToy.voiceId || voiceId;
        }
      } catch {}
      
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

// Internal safety check function - simple but effective for kids mode
export const checkContentSafety = internalAction({
  args: {
    text: v.string(),
    level: v.union(v.literal("strict"), v.literal("moderate"), v.literal("relaxed")),
  },
  handler: async (ctx, args) => {
    // Enhanced regex patterns for comprehensive coverage
    const blockedPatterns = {
      strict: [
        // Violence and harm
        /\b(kill|hurt|death|die|blood|weapon|gun|knife|fight|punch|kick|violence|scary|monster|nightmare|murder|attack|bomb|explosion)\b/gi,
        // Hate and bullying
        /\b(hate|stupid|dumb|idiot|shut up|loser|ugly|fat|skinny|weak|racist|sexist)\b/gi,
        // Substances
        /\b(drugs|alcohol|smoke|cigarette|beer|wine|drunk|high|vape|marijuana|cocaine)\b/gi,
        // Adult content
        /\b(sex|naked|kiss|body parts|private|underwear)\b/gi,
        // Dangerous behavior
        /\b(suicide|self-harm|cutting|dangerous|risk|dare)\b/gi,
      ],
      moderate: [
        /\b(kill|death|weapon|gun|knife|violence|murder|bomb)\b/gi,
        /\b(drugs|alcohol|cocaine|marijuana)\b/gi,
        /\b(sex|naked)\b/gi,
        /\b(suicide|self-harm)\b/gi,
      ],
      relaxed: [
        /\b(explicit violence|graphic content|extreme)\b/gi,
        /\b(hard drugs|explicit sexual)\b/gi,
      ],
    };
    
    const patterns = blockedPatterns[args.level];
    let score = 1.0;
    let reason = "";
    let matchedPatterns: string[] = [];
    
    for (const pattern of patterns) {
      const matches = args.text.match(pattern);
      if (matches) {
        score = 0;
        reason = "inappropriate_content";
        matchedPatterns = [...new Set([...matchedPatterns, ...matches])];
        break;
      }
    }
    
    // Check for personal information patterns
    const personalInfoPattern = /\b(\d{3}-\d{2}-\d{4}|\d{9}|[\w._%+-]+@[\w.-]+\.[A-Z]{2,}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/gi;
    if (personalInfoPattern.test(args.text)) {
      score = Math.min(score, 0.3);
      reason = reason || "personal_information";
    }
    
    // Check for suspicious URLs in strict mode
    const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    if (urlPattern.test(args.text) && args.level === "strict") {
      score = Math.min(score, 0.5);
      reason = reason || "external_link";
    }
    
    return {
      passed: score > 0.5,
      score,
      reason,
      severity: score === 0 ? 5 : Math.floor((1 - score) * 5),
      matchedPatterns: matchedPatterns.length > 0 ? matchedPatterns.slice(0, 3) : undefined,
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
