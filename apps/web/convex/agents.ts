import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { action, mutation, query, internalAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";

// Simple mock language model that satisfies the interface
// In a real implementation, this would integrate with our AI services
const toyLanguageModel = {
  specificationVersion: 'v2' as const,
  provider: 'pommai',
  modelId: 'mock-gpt',
  supportedUrls: {},
  
  async doGenerate(options: any) {
    // Mock response for now - in production this would call our AI services
    return {
      content: [{
        type: 'text' as const,
        text: "I'm a friendly AI toy! How can I help you today?",
      }],
      finishReason: 'stop' as const,
      usage: {
        inputTokens: 10,
        outputTokens: 15,
        totalTokens: 25,
      },
      warnings: [],
    };
  },
  
  async doStream(options: any) {
    // Mock streaming response
    const mockText = "I'm a friendly AI toy! How can I help you today?";
    const words = mockText.split(' ');
    
    const stream = new ReadableStream({
      start(controller) {
        let index = 0;
        const pushNext = () => {
          if (index < words.length) {
            controller.enqueue({
              type: 'text-delta' as const,
              delta: words[index] + (index < words.length - 1 ? ' ' : ''),
            });
            index++;
            setTimeout(pushNext, 50);
          } else {
            controller.enqueue({
              type: 'finish' as const,
              finishReason: 'stop' as const,
              usage: {
                inputTokens: 10,
                outputTokens: 15,
                totalTokens: 25,
              },
            });
            controller.close();
          }
        };
        setTimeout(pushNext, 100);
      },
    });
    
    return {
      stream,
      warnings: [],
    };
  },
};

// Define the main toy agent - using basic configuration for now
export const toyAgent = new Agent(components.agent, {
  name: "ToyAgent",
  languageModel: toyLanguageModel,
  // Default system prompt (will be overridden per toy)
  instructions: "You are a friendly AI toy assistant. Be helpful, safe, and age-appropriate.",
});

// Create a thread for a toy
export const createToyThread = mutation({
  args: {
    toyId: v.id("toys"),
    userId: v.optional(v.id("users")),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, { toyId, userId, deviceId }) => {
    const toy = await ctx.db.get(toyId);
    if (!toy) throw new Error("Toy not found");

    // Create agent thread with toy-specific metadata
    const { threadId } = await toyAgent.createThread(ctx, {
      userId: userId?.toString(),
      title: toy.name,
      summary: `Toy thread for ${toy.name}`,
    });

    return { 
      threadId,
      toyId: toyId,
      metadata: {
        toyId: toyId.toString(),
        toyName: toy.name,
        isForKids: toy.isForKids,
        deviceId: deviceId || "",
        createdAt: Date.now(),
      },
    };
  },
});

// Get or create thread for a device
export const getOrCreateDeviceThread = mutation({
  args: {
    deviceId: v.string(),
    toyId: v.id("toys"),
  },
  handler: async (ctx, { deviceId, toyId }): Promise<{
    threadId: string;
    toyId: Id<"toys">;
    metadata: {
      toyId: string;
      toyName: string;
      isForKids: boolean;
      deviceId: string;
      createdAt: number;
    };
    existing: boolean;
  }> => {
    // NOTE: The Agent component manages its own tables; we avoid querying a non-existent
    // 'threads' table. For now, always create a fresh thread scoped to device+toy.
    const result: {
      threadId: string;
      toyId: Id<"toys">;
      metadata: {
        toyId: string;
        toyName: string;
        isForKids: boolean;
        deviceId: string;
        createdAt: number;
      };
    } = await ctx.runMutation(api.agents.createToyThread, {
      toyId,
      deviceId,
    });
    return { ...result, existing: false };
  },
});

// Save a message from audio interaction
export const saveAudioMessage = mutation({
  args: {
    threadId: v.string(),
    transcript: v.string(),
    audioUrl: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { threadId, transcript, audioUrl, userId }) => {
    const { messageId } = await toyAgent.saveMessage(ctx, {
      threadId,
      userId: userId?.toString(),
      prompt: transcript,
      metadata: {},
      skipEmbeddings: true, // Will be generated in action
    });

    return { messageId };
  },
});

// Generate AI response (to be called from FastRTC gateway)
export const generateToyResponse = internalAction({
  args: {
    threadId: v.string(),
    toyId: v.id("toys"),
    promptMessageId: v.optional(v.string()),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, toyId, promptMessageId, prompt }): Promise<{
    text: string;
    messageId: string | undefined;
    usage?: any;
    finishReason?: any;
  }> => {
    // Get toy configuration
    const toy: any = await ctx.runQuery(api.toys.getToy, { toyId });
    if (!toy) throw new Error("Toy not found");

    // Build system prompt with toy personality
    const systemPrompt = buildToySystemPrompt(toy);

    // Configure agent for this specific toy
    const safetyInstructions: string = toy.isForKids ? `

CRITICAL SAFETY RULES FOR CHILDREN:
- You are talking to a ${toy.ageGroup || "young"} child
- Use simple, age-appropriate language
- Never discuss violence, scary topics, or adult themes
- Always be positive, educational, and encouraging
- If asked about inappropriate topics, redirect to fun activities
- Keep responses short (2-3 sentences max)
- Use sound effects and expressions to be engaging
` : "";

    // Generate response with toy-specific configuration using the Agent API
    const result: any = await toyAgent.generateText(
      ctx,
      { threadId },
      {
        promptMessageId,
        prompt,
        system: systemPrompt + safetyInstructions,
        temperature: toy.personalityTraits?.behavior?.imaginationLevel
          ? toy.personalityTraits.behavior.imaginationLevel / 10
          : 0.7,
      }
    );

    return {
      text: result.text,
      messageId: result.promptMessageId,
      usage: result.usage,
      finishReason: result.finishReason,
    };
  },
});

// Stream text response with delta saving
export const streamToyResponse = internalAction({
  args: {
    threadId: v.string(),
    toyId: v.id("toys"),
    promptMessageId: v.optional(v.string()),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, toyId, promptMessageId, prompt }): Promise<{
    success: boolean;
    messageId?: string;
  }> => {
    const toy: any = await ctx.runQuery(api.toys.getToy, { toyId });
    if (!toy) throw new Error("Toy not found");

    const systemPrompt = buildToySystemPrompt(toy);
    // Stream with delta saving for real-time updates
    const result: any = await toyAgent.streamText(
      ctx,
      { threadId },
      {
        promptMessageId,
        prompt,
        system: systemPrompt,
        temperature: toy.personalityTraits?.behavior?.imaginationLevel
          ? toy.personalityTraits.behavior.imaginationLevel / 10
          : 0.7,
      }
    );

    return {
      success: true,
      messageId: result.messageId,
    };
  },
});

// Process complete audio interaction pipeline
export const processAudioInteraction = action({
  args: {
    toyId: v.id("toys"),
    threadId: v.string(),
    audioTranscript: v.string(),
    deviceId: v.string(),
  },
  handler: async (ctx, { toyId, threadId, audioTranscript, deviceId }): Promise<{
    success: boolean;
    response: string;
    messageId?: string;
    error?: string;
  }> => {
    try {
      // Step 1: Save user message
      const { messageId } = await ctx.runMutation(api.agents.saveAudioMessage, {
        threadId,
        transcript: audioTranscript,
      });

      // Step 2: Generate AI response
      const response: {
        text: string;
        messageId?: string;
        usage?: any;
        finishReason?: any;
      } = await ctx.runAction(internal.agents.generateToyResponse, {
        threadId,
        toyId,
        promptMessageId: messageId,
      });

      // Step 3: Log conversation
      await ctx.runMutation(api.conversations.createConversation, {
        toyId,
        sessionId: threadId,
        location: "toy",
        deviceId,
      });

      return {
        success: true,
        response: response.text,
        messageId: response.messageId,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Audio interaction error:", errMsg);
      
      // Return safe fallback for kids
      const toy = await ctx.runQuery(api.toys.getToy, { toyId });
      if (toy?.isForKids) {
        return {
          success: false,
          response: "Oops! Let me think about that differently. What's your favorite game?",
          error: "safety_redirect",
        };
      }
      
      throw error;
    }
  },
});

// Helper function to build toy-specific system prompt
function buildToySystemPrompt(toy: any): string {
  const traits = toy.personalityTraits;
  
  let prompt = `You are ${toy.name}, a ${toy.type} AI toy companion.

PERSONALITY:
${toy.personalityPrompt}

TRAITS:
- ${traits?.traits?.join(", ") || "friendly, helpful"}

SPEAKING STYLE:
- Vocabulary: ${traits?.speakingStyle?.vocabulary || "moderate"}
- Sentence length: ${traits?.speakingStyle?.sentenceLength || "medium"}
- ${traits?.speakingStyle?.usesSoundEffects ? "Use fun sound effects!" : ""}
- Catch phrases: ${traits?.speakingStyle?.catchPhrases?.join(", ") || "none"}

INTERESTS:
${traits?.interests?.join(", ") || "games, stories, learning"}

BEHAVIOR:
- ${traits?.behavior?.encouragesQuestions ? "Encourage questions" : ""}
- ${traits?.behavior?.tellsStories ? "Love telling stories" : ""}
- ${traits?.behavior?.playsGames ? "Enjoy playing games" : ""}
- Educational focus: ${traits?.behavior?.educationalFocus || 5}/10
- Imagination level: ${traits?.behavior?.imaginationLevel || 5}/10
`;

  // Add knowledge base context if available
  if (toy.knowledgeBaseId) {
    prompt += `

BACKSTORY AND KNOWLEDGE:
[Will be retrieved from knowledge base]
`;
  }

  return prompt;
}

// Query functions for the UI
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { threadId, limit = 50 }) => {
    return await toyAgent.listMessages(ctx, {
      threadId,
      paginationOpts: { cursor: null, numItems: limit },
    });
  },
});

// Get thread metadata
export const getThreadMetadata = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, { threadId }) => {
    return await toyAgent.getThreadMetadata(ctx, { threadId });
  },
});

// Get thread by toy ID
export const getThreadByToyId = query({
  args: {
    toyId: v.id("toys"),
  },
  handler: async (ctx, { toyId }) => {
    // NOTE: Without direct access to Agent component tables, we cannot query threads by metadata here.
    // Return null to signal callers to create a new thread when needed.
    return null;
  },
});

// Save knowledge message to thread (for RAG integration)
export const saveKnowledgeMessage = mutation({
  args: {
    threadId: v.string(),
    content: v.string(),
    metadata: v.object({
      type: v.string(),
      isKnowledge: v.boolean(),
      source: v.optional(v.string()),
      importance: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      expiresAt: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { threadId, content, metadata }) => {
    // Save message with knowledge metadata
    const { messageId } = await toyAgent.saveMessage(ctx, {
      threadId,
      prompt: content,
      metadata: {},
      skipEmbeddings: false, // Important: Generate embeddings for RAG
    });

    return { messageId };
  },
});

// Enhanced generate response with knowledge retrieval
export const generateToyResponseWithKnowledge = internalAction({
  args: {
    threadId: v.string(),
    toyId: v.id("toys"),
    promptMessageId: v.optional(v.string()),
    prompt: v.optional(v.string()),
    includeKnowledge: v.optional(v.boolean()),
  },
  handler: async (ctx, { threadId, toyId, promptMessageId, prompt, includeKnowledge = true }): Promise<{
    text: string;
    messageId: string | undefined;
    usage?: any;
    finishReason?: any;
  }> => {
    // Get toy configuration
    const toy: any = await ctx.runQuery(api.toys.getToy, { toyId });
    if (!toy) throw new Error("Toy not found");

    // Build base system prompt
    let systemPrompt = buildToySystemPrompt(toy);
    
    // Add relevant knowledge if requested
    if (includeKnowledge && prompt) {
      const relevantKnowledge = await ctx.runAction(api.knowledge.searchToyKnowledge, {
        toyId,
        query: prompt,
        limit: 5,
        minRelevance: 0.3,
      });
      
      if (relevantKnowledge.length > 0) {
        systemPrompt += `\n\nRELEVANT KNOWLEDGE AND CONTEXT:\n`;
        for (const knowledge of relevantKnowledge) {
          systemPrompt += `- ${knowledge.content}\n`;
        }
      }
    }

    // Safety rules for kids
    const safetyInstructions = toy.isForKids ? `

CRITICAL SAFETY RULES FOR CHILDREN:
- You are talking to a ${toy.ageGroup || "young"} child
- Use simple, age-appropriate language
- Never discuss violence, scary topics, or adult themes
- Always be positive, educational, and encouraging
- If asked about inappropriate topics, redirect to fun activities
- Keep responses short (2-3 sentences max)
- Use sound effects and expressions to be engaging
` : "";

    // Continue with generation
    const result = await toyAgent.generateText(
      ctx,
      { threadId },
      {
        promptMessageId,
        prompt,
        system: systemPrompt + safetyInstructions,
        temperature: toy.personalityTraits?.behavior?.imaginationLevel
          ? toy.personalityTraits.behavior.imaginationLevel / 10
          : 0.7,
      }
    );

    return {
      text: result.text,
      messageId: result.promptMessageId,
      usage: result.usage,
      finishReason: result.finishReason,
    };
  },
});

// Internal helpers (not exposed to client)
export const internalAgents = {
  agents: {
    generateToyResponse,
    generateToyResponseWithKnowledge,
    streamToyResponse,
  },
  toys: {
    getInternal: query({
      args: { id: v.id("toys") },
      handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
      },
    }),
  },
};
