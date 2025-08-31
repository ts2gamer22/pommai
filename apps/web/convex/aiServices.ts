import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { ElevenLabs, ElevenLabsClient } from "elevenlabs";
import { api } from "./_generated/api";

// Initialize clients lazily to avoid environment variable issues during module loading
let openai: OpenAI | null = null;
let elevenlabs: ElevenLabsClient | null = null;
let openrouter: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
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
export const transcribeAudio = action({
  args: {
    audioData: v.string(), // Base64 encoded audio
    language: v.optional(v.string()),
    prompt: v.optional(v.string()), // Optional prompt for better accuracy
  },
  handler: async (ctx, args) => {
    try {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(args.audioData, 'base64');
      
      // Create a File object from buffer
      const audioFile = new File([audioBuffer], 'audio.wav', { 
        type: 'audio/wav' 
      });
      
      // Transcribe with Whisper
      const transcription = await getOpenAI().audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: args.language || "en",
        prompt: args.prompt,
        response_format: "verbose_json",
        temperature: 0.2, // Lower temperature for more accurate transcription
      });
      
      return {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        segments: transcription.segments,
        confidence: calculateConfidence(transcription.segments),
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Whisper transcription error:", errMsg);
      throw new Error(`Transcription failed: ${errMsg}`);
    }
  },
});

// Text-to-Speech with ElevenLabs
export const synthesizeSpeech = action({
  args: {
    text: v.string(),
    voiceId: v.string(),
    modelId: v.optional(v.string()),
    voiceSettings: v.optional(v.object({
      stability: v.number(),
      similarityBoost: v.number(),
      style: v.optional(v.number()),
      useSpeakerBoost: v.optional(v.boolean()),
    })),
    outputFormat: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Generate speech with ElevenLabs
      const audioStream = await getElevenLabs().generate({
        voice: args.voiceId,
        text: args.text,
        model_id: args.modelId || "eleven_multilingual_v2",
        voice_settings: {
          stability: args.voiceSettings?.stability || 0.5,
          similarity_boost: args.voiceSettings?.similarityBoost || 0.75,
          style: args.voiceSettings?.style || 0,
          use_speaker_boost: args.voiceSettings?.useSpeakerBoost || true,
        },
        output_format: (args.outputFormat as any) || "mp3_44100_128",
      });
      
      // Collect audio chunks
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }
      
      // Combine chunks and convert to base64
      const audioBuffer = Buffer.concat(chunks);
      const audioData = audioBuffer.toString('base64');
      
      return {
        audioData,
        format: args.outputFormat || "mp3_44100_128",
        duration: estimateAudioDuration(audioBuffer, args.outputFormat || "mp3_44100_128"),
        byteSize: audioBuffer.length,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("ElevenLabs TTS error:", errMsg);
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
  },
  handler: async (ctx, args) => {
    try {
      const model = args.model || "openai/gpt-oss-120b";
      
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
          stream: true,
        });
        
        // Collect stream chunks
        const chunks: string[] = [];
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            chunks.push(content);
          }
        }
        
        return {
          type: 'stream',
          content: chunks.join(''),
          chunks,
        };
      } else {
        // Non-streaming response
        const completion = await getOpenRouter().chat.completions.create({
          model,
          messages: args.messages,
          temperature: args.temperature || 0.7,
          max_tokens: args.maxTokens || 2000,
          top_p: args.topP || 1,
          frequency_penalty: args.frequencyPenalty || 0,
          presence_penalty: args.presencePenalty || 0,
        });
        
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
function estimateAudioDuration(audioBuffer: Buffer, format: string): number {
  // Rough estimation based on format and buffer size
  const bitrates: Record<string, number> = {
    "mp3_44100_128": 128000,
    "mp3_44100_64": 64000,
    "pcm_16000": 256000,
    "pcm_24000": 384000,
    "pcm_44100": 705600,
  };
  
  const bitrate = bitrates[format] || 128000;
  const durationSeconds = (audioBuffer.length * 8) / bitrate;
  
  return Math.round(durationSeconds * 1000) / 1000; // Round to 3 decimal places
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
          const result: any = await ctx.runAction(api.aiServices.transcribeAudio, {
            audioData: chunk.audioData,
            language: args.language,
          });
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
