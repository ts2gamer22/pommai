import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { action, mutation, query, internalAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";

// Create a factory function for the language model that accepts context
function createToyLanguageModel(ctx: any) {
  return {
    specificationVersion: 'v2' as const,
    provider: 'openrouter',
    modelId: 'openai/gpt-oss-120b',
    supportedUrls: {},
    
    async doGenerate(options: any) {
      // Extract messages and system prompt
      const messages: any[] = [];
      if (options.system) {
        messages.push({ role: 'system', content: options.system });
      }
      if (options.prompt) {
        messages.push({ role: 'user', content: options.prompt });
      }
      // Add any previous messages from options
      if (options.messages && Array.isArray(options.messages)) {
        messages.push(...options.messages);
      }
      
      try {
        // Use the Convex context to call our AI services directly
        const result = await ctx.runAction(api.aiServices.generateResponse, {
          messages,
          model: options.model || 'openai/gpt-oss-120b',
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 500,
        });
        
        return {
          content: [{
            type: 'text' as const,
            text: result.content || "I'm having trouble understanding. Can you try again?",
          }],
          finishReason: 'stop' as const,
          usage: {
            inputTokens: result.usage?.prompt_tokens || 0,
            outputTokens: result.usage?.completion_tokens || 0,
            totalTokens: result.usage?.total_tokens || 0,
          },
          warnings: [],
        };
      } catch (error) {
        console.error('Language model error:', error);
        // Return a safe fallback response
        return {
          content: [{
            type: 'text' as const,
            text: "I'm having a little trouble right now. Can you ask me again?",
          }],
          finishReason: 'error' as const,
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
          },
          warnings: [String(error)],
        };
      }
    },
  
    async doStream(options: any) {
      // For streaming, we need to handle it differently
      // Since Convex doesn't directly support streaming from actions,
      // we'll simulate streaming by breaking the response into chunks
      const fullResponse = await this.doGenerate(options);
      const text = fullResponse.content[0]?.text || "";
      const words = text.split(' ');
      
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
              // Faster streaming for better UX
              setTimeout(pushNext, 30);
            } else {
              controller.enqueue({
                type: 'finish' as const,
                finishReason: fullResponse.finishReason,
                usage: fullResponse.usage,
              });
              controller.close();
            }
          };
          pushNext();
        },
      });
      
      return {
        stream,
        warnings: fullResponse.warnings,
      };
    },
  };
}

// Default language model for backward compatibility
const toyLanguageModel = {
  specificationVersion: 'v2' as const,
  provider: 'openrouter',
  modelId: 'openai/gpt-oss-120b',
  supportedUrls: {},
  
  async doGenerate(options: any) {
    console.warn('Using default language model without context - responses will be limited');
    return {
      content: [{
        type: 'text' as const,
        text: "I need to be properly connected to help you. Please check my configuration.",
      }],
      finishReason: 'stop' as const,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      warnings: ['No context available'],
    };
  },
  
  async doStream(options: any) {
    const response = await this.doGenerate(options);
    const text = response.content[0]?.text || "";
    return {
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'text-delta' as const, delta: text });
          controller.enqueue({ type: 'finish' as const, finishReason: 'stop' as const, usage: response.usage });
          controller.close();
        },
      }),
      warnings: response.warnings,
    };
  },
};

// Define the main toy agent - using basic configuration for now
export const toyAgent = new Agent(components.agent, {
  name: "ToyAgent",
  languageModel: toyLanguageModel as any, // Type casting for compatibility
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

// Get or create thread for a toy (canonical thread)
export const getOrCreateToyThread = mutation({
  args: {
    toyId: v.id("toys"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { toyId, userId }): Promise<{ threadId: string }> => {
    const toy = await ctx.db.get(toyId);
    if (!toy) throw new Error("Toy not found");

    // If toy already has a canonical agent thread, return it
    if ((toy as any).agentThreadId) {
      return { threadId: (toy as any).agentThreadId as string };
    }

    // Otherwise, create a new thread and persist its id on the toy
    const { threadId } = await toyAgent.createThread(ctx, {
      userId: userId?.toString(),
      title: toy.name,
      summary: `Toy thread for ${toy.name}`,
    });

    await ctx.db.patch(toyId, { agentThreadId: threadId, lastModifiedAt: new Date().toISOString() });
    return { threadId };
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

    // Configure safety instructions for kids
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

    // Instead of using the mock toyAgent, directly call the AI service
    try {
      // Build messages array for context
      const messages: Array<{ role: "system" | "user"; content: string }> = [
        { role: "system", content: systemPrompt + safetyInstructions },
      ];
      
      if (prompt) {
        messages.push({ role: "user", content: prompt });
      }
      
      // Call the real AI service
      const aiResponse = await ctx.runAction(api.aiServices.generateResponse, {
        messages,
        model: "openai/gpt-oss-120b",
        temperature: toy.personalityTraits?.behavior?.imaginationLevel
          ? toy.personalityTraits.behavior.imaginationLevel / 10
          : 0.7,
        maxTokens: toy.isForKids ? 150 : 500,
      });
      
      // Save the response to the thread if we have the Agent component
      let messageId: string | undefined;
      try {
        // Try to use the Agent to save the message
        const agentWithContext = new Agent(components.agent, {
          name: "ToyAgent",
          languageModel: createToyLanguageModel(ctx) as any,
          instructions: systemPrompt,
        });
        
        const saveResult = await agentWithContext.saveMessage(ctx, {
          threadId,
          prompt: aiResponse.content || "I'm having trouble responding right now.",
          metadata: {} as any,
        });
        messageId = saveResult.messageId;
      } catch (e) {
        console.log("Could not save to Agent thread:", e);
      }
      
      return {
        text: aiResponse.content || "I'm having trouble responding right now.",
        messageId,
        usage: aiResponse.usage,
        finishReason: aiResponse.finishReason || "stop",
      };
    } catch (error) {
      console.error("Error generating toy response:", error);
      // Fallback to a safe response
      return {
        text: toy.isForKids 
          ? "Oops! Let me think about that differently. What's your favorite game?"
          : "I'm having trouble understanding. Could you try asking in a different way?",
        messageId: undefined,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        finishReason: "error",
      };
    }
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
      },
      {
        contextOptions: {
          excludeToolMessages: true,
          recentMessages: 50,
          searchOptions: {
            limit: 10,
            textSearch: true,
            vectorSearch: false,
            messageRange: { before: 2, after: 1 },
          },
          searchOtherThreads: false,
        },
        saveStreamDeltas: true,
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
    // Save message with knowledge metadata and generate embeddings
    const { messageId } = await toyAgent.saveMessage(ctx, {
      threadId,
      prompt: content,
      metadata: metadata as any,
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
