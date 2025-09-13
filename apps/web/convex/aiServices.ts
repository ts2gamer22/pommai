import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { ElevenLabs, ElevenLabsClient } from "elevenlabs";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Initialize clients lazily to avoid environment variable issues during module loading
let openai: OpenAI | null = null;
let elevenlabs: ElevenLabsClient | null = null;
let openrouter: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY || "",
    });
  }
  return openai;
}

function getElevenLabs() {
  if (!elevenlabs) {
    elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY || "",
    });
  }
  return elevenlabs;
}

function getOpenRouter() {
  if (!openrouter) {
    openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY || "",
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "https://pommai.co",
        "X-Title": "Pommai AI Toys",
      },
    });
  }
  return openrouter;
}

// Speech-to-Text with Whisper
// Internal helper to perform Whisper transcription from a buffer
async function transcribeWithOpenAI(audioBuffer: Buffer, language?: string, prompt?: string) {
const audioFile = new File([new Uint8Array(audioBuffer)], 'audio.wav', { type: 'audio/wav' });
  const transcription = await getOpenAI().audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: language || "en",
    prompt,
    response_format: "verbose_json",
    temperature: 0.2,
  } as any);
  return {
    text: (transcription as any).text,
    language: (transcription as any).language,
    duration: (transcription as any).duration,
    segments: (transcription as any).segments,
    confidence: calculateConfidence((transcription as any).segments),
  };
}

/**
 * Transcribe base64-encoded WAV audio using OpenAI Whisper API.
 * - Decodes base64 safely (no data: URL fetch).
 * - Adds timing logs to aid debugging latency and failures.
 */
export const transcribeAudio = action({
  args: {
    audioData: v.string(), // Base64 encoded audio
    language: v.optional(v.string()),
    prompt: v.optional(v.string()), // Optional prompt for better accuracy
  },
  handler: async (ctx, args) => {
    const t0 = Date.now();
    const base64Len = args.audioData.length;
    try {
      // Avoid fetch on data: URL; decode base64 directly
      const wavBytes = base64ToUint8Array(args.audioData);
      const wavBuffer = wavBytes.buffer.slice(
        wavBytes.byteOffset,
        wavBytes.byteOffset + wavBytes.byteLength
      );
      const file = new File([wavBuffer as ArrayBuffer], 'audio.wav', { type: 'audio/wav' });
      const transcription = await getOpenAI().audio.transcriptions.create({
        file,
        model: "whisper-1",
        language: args.language || "en",
        prompt: args.prompt,
        response_format: "verbose_json",
        temperature: 0.2,
      } as any);
      const dt = Date.now() - t0;
      console.log(`Whisper transcription ok in ${dt}ms (base64Len=${base64Len}, bytes=${wavBytes.byteLength})`);
      return {
        text: (transcription as any).text,
        language: (transcription as any).language,
        duration: (transcription as any).duration,
        segments: (transcription as any).segments,
        confidence: calculateConfidence((transcription as any).segments),
      };
    } catch (error: unknown) {
      const dt = Date.now() - t0;
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`Whisper transcription error after ${dt}ms (base64Len=${base64Len}):`, errMsg);
      throw new Error(`Transcription failed: ${errMsg}`);
    }
  },
});

// Text-to-Speech with ElevenLabs or Minimax
export const synthesizeSpeech = action({
  args: {
    text: v.string(),
    voiceId: v.string(),
    provider: v.optional(v.union(v.literal("elevenlabs"), v.literal("minimax"))),
    modelId: v.optional(v.string()),
    voiceSettings: v.optional(v.object({
      stability: v.number(),
      similarityBoost: v.number(),
      style: v.optional(v.number()),
      useSpeakerBoost: v.optional(v.boolean()),
      // Minimax-specific settings
      speed: v.optional(v.number()),
      volume: v.optional(v.number()),
      pitch: v.optional(v.number()),
      emotion: v.optional(v.string()),
    })),
    outputFormat: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const provider = args.provider || "elevenlabs";
    
    // Check if we're in development mode without API keys
    const isDevelopment = process.env.NODE_ENV === "development";
    
    try {
      if (provider === "minimax") {
        // Minimax TTS implementation
        const apiKey = process.env.MINIMAX_API_KEY;
        const groupId = process.env.MINIMAX_GROUP_ID;
        
        if (!apiKey || !groupId) {
          throw new Error("MINIMAX_API_KEY or MINIMAX_GROUP_ID not configured");
        }
        
        const body = {
          model: "speech-01-turbo",
          text: args.text,
          group_id: groupId,
          voice_setting: {
            voice_id: args.voiceId || "female-shaonv",
            speed: args.voiceSettings?.speed ?? 1.0,
            vol: args.voiceSettings?.volume ?? 1.0,
            pitch: args.voiceSettings?.pitch ?? 0,
            emotion: args.voiceSettings?.emotion ?? "happy",
          },
          audio_setting: {
            format: "mp3",
            sample_rate: 16000,
            channel: 1,
            bits_per_sample: 16,
          },
        };
        
        const resp = await fetch("https://api.minimax.chat/v1/t2a_v2", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Minimax TTS failed: ${resp.status} ${resp.statusText} ${text}`);
        }
        
        const data = await resp.json();
        const audioData = data.audio_file || data.audio || "";
        
        return {
          audioData,
          format: "mp3",
          duration: data.duration || 0,
          byteSize: audioData.length * 0.75, // Estimate from base64
        };
      } else {
        // ElevenLabs TTS implementation (default)
        const apiKey = process.env.ELEVENLABS_API_KEY || "";
        
        console.log("ElevenLabs API Key present:", !!apiKey);
        console.log("API Key length:", apiKey.length);
        
        // Return mock data in development if no API key
        if (!apiKey) {
          console.warn("ELEVENLABS_API_KEY not configured, returning mock audio data");
          // Return a simple base64 encoded silent audio for development
          const silentMp3Base64 = "SUQzAwAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFuAAzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAQKAAAAAAAABbjLjxDpAAAAAAD/+0DEAAPH";
          return {
            audioData: silentMp3Base64,
            format: "mp3",
            duration: 1,
            byteSize: 100,
            isMock: true,
          };
        }
        
        // Use settings compatible with free plan
        const body = {
          text: args.text,
          model_id: args.modelId || "eleven_monolingual_v1", // Use basic model for free plan
          voice_settings: {
            stability: args.voiceSettings?.stability ?? 0.5,
            similarity_boost: args.voiceSettings?.similarityBoost ?? 0.75,
          },
        };
        
        console.log(`Calling ElevenLabs TTS with voice: ${args.voiceId}`);
        
        // For free plan, ensure we're using free voices
        const freeVoiceIds = [
          "21m00Tcm4TlvDq8ikWAM", // Rachel
          "2EiwWnXFnvU5JabPnv8n", // Clyde  
          "CwhRBWXzGAHq8TQ4Fs17", // Roger
          "ErXwobaYiN019PkySvjV", // Antoni
          "MF3mGyEYCl7XYWbV9V6O", // Elli
          "TxGEqnHWrfWFTfGW9XjX", // Josh
          "VR6AewLTigWG4xSOukaG", // Arnold
          "pNInz6obpgDQGcFmaJgB", // Adam
          "yoZ06aMxZJJ28mfd3POQ", // Sam
        ];
        
        // Check if the voice is a free voice or use a default free voice
        let voiceIdToUse = args.voiceId;
        if (!freeVoiceIds.includes(args.voiceId) && !args.voiceId.startsWith("mock-")) {
          console.warn(`Voice ${args.voiceId} may not be available on free plan, using default Rachel voice`);
          voiceIdToUse = "21m00Tcm4TlvDq8ikWAM"; // Default to Rachel
        }
        
        // Make the API call with proper error handling
        let resp;
        try {
          resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceIdToUse}`, {
            method: 'POST',
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg',
            },
            body: JSON.stringify(body),
          });
        } catch (fetchError) {
          console.error("Fetch error:", fetchError);
          throw new Error(`Network error calling ElevenLabs: ${fetchError}`);
        }
        
        if (!resp.ok) {
          const text = await resp.text();
          console.error(`ElevenLabs TTS error: ${resp.status} ${resp.statusText}`);
          console.error(`Response body: ${text}`);
          
          // Check for common errors
          if (resp.status === 401) {
            throw new Error("ElevenLabs API key is invalid. Please check your API key.");
          } else if (resp.status === 404) {
            throw new Error(`Voice ID '${args.voiceId}' not found. Please use a valid voice ID.`);
          } else if (resp.status === 422) {
            throw new Error(`Invalid request parameters: ${text}`);
          } else {
            throw new Error(`ElevenLabs TTS failed: ${resp.status} ${resp.statusText} - ${text}`);
          }
        }
        
        // Convert response to base64
        const ab = await resp.arrayBuffer();
        const byteSize = ab.byteLength;
        const audioData = arrayBufferToBase64(ab);
        
        console.log(`TTS successful! Generated ${byteSize} bytes of audio`);
        
        return {
          audioData,
          format: "mp3",
          duration: byteSize / 4000, // Rough estimate
          byteSize,
        };
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`${provider} TTS error:`, errMsg);
      throw new Error(`Speech synthesis failed: ${errMsg}`);
    }
  },
});

// LLM Generation with OpenRouter
export const generateResponse = action({
  args: {
    messages: v.array(v.object({
      role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    stream: v.optional(v.boolean()),
    topP: v.optional(v.number()),
    frequencyPenalty: v.optional(v.number()),
    presencePenalty: v.optional(v.number()),
    tools: v.optional(v.array(v.any())),
    tool_choice: v.optional(v.union(v.literal("auto"), v.literal("required"), v.string())),
    extra_body: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      // Use OpenAI OSS models available on OpenRouter
      let model = args.model || "openai/gpt-oss-120b";
      
      // Fallback models if the primary fails
      const modelFallbacks = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b"
      ];
      
      if (!args.model) {
        model = modelFallbacks[0];
      }
      
      if (args.stream) {
        // Streaming response
        const stream = await getOpenRouter().chat.completions.create({
          model,
          messages: args.messages,
          temperature: args.temperature || 0.7,
          max_tokens: args.maxTokens || 2000,
          top_p: args.topP || 1,
          frequency_penalty: args.frequencyPenalty || 0,
          presence_penalty: args.presencePenalty || 0,
          tools: args.tools,
          tool_choice: args.tool_choice,
          stream: true,
          ...(args.extra_body || {}),
        });
        
        // For now, convert stream to non-streaming to avoid iterator issues
        // TODO: Properly implement streaming with OpenRouter tool calls
        const streamResult: any = stream;
        const chunks: string[] = [];
        
        // If it's actually a stream, we'd need to handle it properly
        // For now, return the response as-is
        const responseContent = streamResult.choices?.[0]?.message?.content || "";
        chunks.push(responseContent);
        
        return {
          type: 'stream',
          content: chunks.join(''),
          chunks,
        };
      } else {
        // Non-streaming response with fallback
        let completion;
        let lastError;
        
        // Try primary model first, then fallbacks
        const modelsToTry = args.model ? [args.model] : modelFallbacks;
        
        for (const tryModel of modelsToTry) {
          try {
            completion = await getOpenRouter().chat.completions.create({
              model: tryModel,
              messages: args.messages,
              temperature: args.temperature || 0.7,
              max_tokens: args.maxTokens || 2000,
              top_p: args.topP || 1,
              frequency_penalty: args.frequencyPenalty || 0,
              presence_penalty: args.presencePenalty || 0,
              tools: args.tools,
              tool_choice: args.tool_choice,
              ...(args.extra_body || {}),
            });
            
            console.log(`Successfully used model: ${tryModel}`);
            break; // Success, exit loop
          } catch (error) {
            lastError = error;
            console.error(`Failed with model ${tryModel}:`, error);
            if (tryModel === modelsToTry[modelsToTry.length - 1]) {
              // Last model in list, throw the error
              throw lastError;
            }
            // Otherwise, try next model
          }
        }
        
        if (!completion) {
          throw lastError || new Error("Failed to get completion from any model");
        }
        
        return {
          type: 'completion',
          content: completion.choices[0].message.content,
          usage: completion.usage,
          model: completion.model,
          finishReason: completion.choices[0].finish_reason,
        };
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("OpenRouter LLM error:", errMsg);
      throw new Error(`LLM generation failed: ${errMsg}`);
    }
  },
});

// Generate embeddings for RAG
export const generateEmbedding = action({
  args: {
    text: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const response = await getOpenAI().embeddings.create({
        model: args.model || "text-embedding-3-small",
        input: args.text,
        encoding_format: "float",
      });
      
      return {
        embedding: response.data[0].embedding,
        model: response.model,
        tokenCount: response.usage.total_tokens,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Embedding generation error:", errMsg);
      throw new Error(`Embedding generation failed: ${errMsg}`);
    }
  },
});

// Streaming Text-to-Speech with ElevenLabs (for lower latency)
export const streamSpeech = action({
  args: {
    text: v.string(),
    voiceId: v.string(),
    modelId: v.optional(v.string()),
    voiceSettings: v.optional(v.object({
      stability: v.number(),
      similarityBoost: v.number(),
    })),
    optimizeStreamingLatency: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const audioStream = await getElevenLabs().generate({
        voice: args.voiceId,
        text: args.text,
        model_id: args.modelId || "eleven_turbo_v2",
        voice_settings: {
          stability: args.voiceSettings?.stability || 0.5,
          similarity_boost: args.voiceSettings?.similarityBoost || 0.75,
        },
        optimize_streaming_latency: args.optimizeStreamingLatency || 3,
        output_format: "pcm_24000" as any, // PCM for lowest latency
        stream: true,
      });
      
      // Return first chunk immediately for low latency
      // audioStream is a Node.js Readable, not an async iterator
      return new Promise((resolve, reject) => {
        audioStream.once('data', (chunk: any) => {
          resolve({
            firstChunk: Buffer.from(chunk).toString('base64'),
            format: "pcm_24000",
            streaming: true,
          });
        });
        
        audioStream.once('error', (error: any) => {
          reject(new Error(`Streaming audio error: ${error.message}`));
        });
        
        audioStream.once('end', () => {
          reject(new Error("Stream ended without data"));
        });
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("ElevenLabs streaming TTS error:", errMsg);
      throw new Error(`Streaming speech synthesis failed: ${errMsg}`);
    }
  },
});

// Helper function to calculate confidence from Whisper segments
function calculateConfidence(segments: any[] | undefined): number {
  if (!segments || segments.length === 0) return 0;
  
  const avgLogprob = segments.reduce((sum, seg) => {
    return sum + (seg.avg_logprob || 0);
  }, 0) / segments.length;
  
  // Convert log probability to confidence score (0-1)
  return Math.min(Math.max(Math.exp(avgLogprob), 0), 1);
}

// Helper function to estimate audio duration
function estimateAudioDurationBytes(byteLength: number, format: string): number {
  // Rough estimation based on format and buffer size
  const bitrates: Record<string, number> = {
    "mp3_44100_128": 128000,
    "mp3_44100_64": 64000,
    "pcm_16000": 256000,
    "pcm_24000": 384000,
    "pcm_44100": 705600,
  };
  
  const bitrate = bitrates[format] || 128000;
  const durationSeconds = (byteLength * 8) / bitrate;
  
  return Math.round(durationSeconds * 1000) / 1000; // Round to 3 decimal places
}

function arrayBufferToBase64(ab: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(ab);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  // @ts-ignore
  return btoa(binary);
}

// Convert a base64 string to a Uint8Array without using Node Buffer or data: URLs
function base64ToUint8Array(base64: string): Uint8Array {
  // Remove any non-base64 characters (newlines, spaces)
  base64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');

  // Prefer atob if available
  // @ts-ignore
  if (typeof atob === 'function') {
    // @ts-ignore
    const binaryString: string = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Fallback: manual decoder
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const len = base64.length;
  let bufferLength = (len / 4) * 3;
  if (base64.charAt(len - 1) === '=') bufferLength--;
  if (base64.charAt(len - 2) === '=') bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;

  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 6);
    if (base64.charAt(i + 2) !== '=') {
      bytes[p++] = ((encoded2 & 63) << 4) | (encoded3 >> 2);
    }
    if (base64.charAt(i + 3) !== '=') {
      bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
    }
  }

  return bytes;
}

// Batch transcription for multiple audio chunks
export const batchTranscribe = action({
  args: {
    audioChunks: v.array(v.object({
      id: v.string(),
      audioData: v.string(),
    })),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const results: any[] = await Promise.all(
      args.audioChunks.map(async (chunk): Promise<any> => {
        try {
          const wavBytes = base64ToUint8Array(chunk.audioData);
          const wavBuffer = wavBytes.buffer.slice(
            wavBytes.byteOffset,
            wavBytes.byteOffset + wavBytes.byteLength
          ) as ArrayBuffer;
          const file = new File([wavBuffer], 'audio.wav', { type: 'audio/wav' });
          const transcription = await getOpenAI().audio.transcriptions.create({
            file,
            model: "whisper-1",
            language: args.language || "en",
            response_format: "verbose_json",
            temperature: 0.2,
          } as any);
          const result: any = {
            text: (transcription as any).text,
            language: (transcription as any).language,
            duration: (transcription as any).duration,
            segments: (transcription as any).segments,
            confidence: calculateConfidence((transcription as any).segments),
          };
          return {
            id: chunk.id,
            success: true,
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

// Check API health and quotas
export const checkAPIHealth = action({
  args: {},
  handler: async (ctx) => {
    const health = {
      openai: false,
      elevenlabs: false,
      openrouter: false,
      errors: [] as string[],
    };
    
    // Check OpenAI
    try {
      await getOpenAI().models.list();
      health.openai = true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      health.errors.push(`OpenAI: ${msg}`);
    }
    
    // Check ElevenLabs
    try {
      await getElevenLabs().voices.getAll();
      health.elevenlabs = true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      health.errors.push(`ElevenLabs: ${msg}`);
    }
    
    // Check OpenRouter
    try {
      await getOpenRouter().models.list();
      health.openrouter = true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      health.errors.push(`OpenRouter: ${msg}`);
    }
    
    return health;
  },
});

/**
 * Sync three default ElevenLabs premade voices into the voices table.
 * Prefers Rachel, Antoni, Bella; falls back to first premade voices available.
 */
export const syncDefaultVoices = action({
  args: {
    names: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      
      // If no API key, use mock voices for development
      if (!apiKey) {
        console.warn("ELEVENLABS_API_KEY not configured, creating mock default voices");
        const mockVoices = [
          {
            name: "Rachel (Mock)",
            description: "Mock voice for development",
            externalVoiceId: "mock-rachel-voice",
            gender: "female",
            ageGroup: "child",
          },
          {
            name: "Antoni (Mock)",
            description: "Mock voice for development",
            externalVoiceId: "mock-antoni-voice",
            gender: "male",
            ageGroup: "child",
          },
          {
            name: "Bella (Mock)",
            description: "Mock voice for development",
            externalVoiceId: "mock-bella-voice",
            gender: "female",
            ageGroup: "teen",
          },
        ];
        
        let inserted = 0;
        for (const voice of mockVoices) {
          const existing = await ctx.runQuery(api.voices.getByExternalVoiceId, { 
            externalVoiceId: voice.externalVoiceId 
          });
          if (!existing) {
            await ctx.runMutation(api.voices.upsertProviderVoice, {
              name: voice.name,
              description: voice.description,
              language: "en",
              accent: undefined as any,
              ageGroup: voice.ageGroup,
              gender: voice.gender as any,
              previewUrl: "",
              provider: "custom",
              externalVoiceId: voice.externalVoiceId,
              tags: ["kids-friendly", "child-safe", "mock", "development"],
              isPremium: false,
              isPublic: true,
            } as any);
            inserted++;
          }
        }
        return { inserted };
      }
      
      const targetNames = new Set((args.names || ["Rachel", "Antoni", "Bella"]).map(n => n.toLowerCase()));
      const result = await getElevenLabs().voices.getAll();
      // SDK returns shape { voices: Voice[] }
      const allVoices: any[] = (result as any).voices || (result as any) || [];
      console.log(`Found ${allVoices.length} total voices from ElevenLabs`);
      
      // Try different category filters to find available voices
      let premade = allVoices.filter(v => 
        (v.category || v.labels?.category) === "premade" || 
        v.category === "cloned" || 
        v.category === "generated"
      );
      
      // If no premade voices found, use any available voices
      if (premade.length === 0) {
        console.log("No premade voices found, using all available voices");
        premade = allVoices.slice(0, 10); // Take first 10 voices
      }
      
      console.log(`Found ${premade.length} suitable voices`);

      const selected: any[] = [];
      // First add by preferred names
      for (const vInfo of premade) {
        if (selected.length >= 3) break;
        if (vInfo?.name && targetNames.has(String(vInfo.name).toLowerCase())) {
          selected.push(vInfo);
        }
      }
      // Fill up remaining slots
      if (selected.length < 3) {
        for (const vInfo of premade) {
          if (selected.length >= 3) break;
          if (!selected.find(s => s.voice_id === vInfo.voice_id)) {
            selected.push(vInfo);
          }
        }
      }

      let inserted = 0;
      for (const vInfo of selected) {
        // Check if voice already exists by provider+externalVoiceId
        const existing = await ctx.runQuery(api.voices.getByExternalVoiceId, { externalVoiceId: vInfo.voice_id });
        if (existing) continue;

        const previewUrl = vInfo.preview_url || vInfo.preview?.url || (vInfo.samples?.[0]?.preview_url) || "";
        try {
          await ctx.runMutation(api.voices.upsertProviderVoice, {
            name: vInfo.name || "ElevenLabs Voice",
            description: vInfo.description || "Premade voice from ElevenLabs",
            language: "en",
            accent: undefined as any,
            ageGroup: "child",  // Mark default voices as child-friendly
            gender: (vInfo.gender === "male" || vInfo.gender === "female") ? vInfo.gender : "neutral",
            previewUrl: previewUrl,
            provider: "11labs",
            externalVoiceId: vInfo.voice_id,
            tags: Array.isArray(vInfo.labels) 
              ? [...vInfo.labels, "kids-friendly", "child-safe"]  // Add kid-friendly tags
              : ["kids-friendly", "child-safe"],
            isPremium: false,
            isPublic: true,
            // uploadedBy omitted for default library voices
          } as any);
          inserted += 1;
        } catch (e: any) {
          // Ignore write conflicts from concurrent seed attempts
          const msg = e?.message || String(e);
          if (!msg.includes('Documents read from or written to the "voices" table changed')) throw e;
        }
      }

      return { inserted };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("syncDefaultVoices error:", msg);
      throw new Error(`Failed to sync default voices: ${msg}`);
    }
  },
});

/**
 * Clone a new ElevenLabs voice from a base64-encoded audio file and store it in the voices table.
 * Returns the external voice_id for use in TTS, and the created DB document id.
 */
export const cloneElevenVoiceFromBase64 = action({
  args: {
    name: v.string(),
    description: v.string(),
    language: v.optional(v.string()),
    accent: v.optional(v.string()),
    ageGroup: v.string(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("neutral")),
    tags: v.array(v.string()),
    isPublic: v.boolean(),
    fileBase64: v.string(),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ voiceDocId: Id<"voices">; externalVoiceId: string; previewUrl: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    // Return mock data in development if no API key
    if (!apiKey) {
      console.warn("ELEVENLABS_API_KEY not configured, returning mock voice data for development");
      const mockVoiceId = `mock-voice-${Date.now()}`;
      
      // Store a mock voice in the database
      const insertedId = await ctx.runMutation(api.voices.upsertProviderVoice, {
        name: args.name,
        description: args.description,
        language: args.language || "en",
        accent: args.accent,
        ageGroup: args.ageGroup,
        gender: args.gender,
        previewUrl: "",
        provider: "custom",
        externalVoiceId: mockVoiceId,
        tags: [...args.tags, "mock", "development"],
        isPremium: false,
        isPublic: args.isPublic,
        uploadedBy: identity.subject as any,
      } as any) as Id<"voices">;
      
      return { 
        voiceDocId: insertedId, 
        externalVoiceId: mockVoiceId, 
        previewUrl: "" 
      };
    }

    // Prepare multipart form-data without Node Buffer or data: URL fetch
    const bytes = base64ToUint8Array(args.fileBase64);
    const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const blob = new Blob([buf], { type: args.mimeType || 'audio/webm' });
    const form = new FormData();
    form.append('name', args.name);
    form.append('files', blob, 'voice_sample.webm');
    if (args.description) form.append('description', args.description);

    // Call ElevenLabs Voice Cloning API
    // Note: Free plan has limited voice cloning (only 3 custom voices)
    const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: form as any,
    } as any);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`ElevenLabs clone failed: ${res.status} ${res.statusText} ${errText}`);
    }

    const data: any = await res.json();
    const externalVoiceId: string = data?.voice_id || data?.voiceId || data?.id;
    if (!externalVoiceId) throw new Error("Missing voice_id from ElevenLabs response");

    // Try to fetch voice details to get preview URL
    let previewUrl = "";
    try {
      const detailsRes = await fetch(`https://api.elevenlabs.io/v1/voices/${externalVoiceId}`, {
        headers: { 'xi-api-key': apiKey },
      });
      if (detailsRes.ok) {
        const details: any = await detailsRes.json();
        previewUrl = details?.preview_url || details?.preview?.url || details?.samples?.[0]?.preview_url || "";
      }
    } catch (e) {
      // best-effort only
    }

    // Store in DB via mutation
    const insertedId = await ctx.runMutation(api.voices.upsertProviderVoice, {
      name: args.name,
      description: args.description,
      language: args.language || "en",
      accent: args.accent,
      ageGroup: args.ageGroup,
      gender: args.gender,
      previewUrl,
      provider: "11labs",
      externalVoiceId,
      tags: args.tags,
      isPremium: false,
      isPublic: args.isPublic,
      uploadedBy: identity.subject as any,
    } as any) as Id<"voices">;

    return { voiceDocId: insertedId, externalVoiceId, previewUrl };
  },
});
