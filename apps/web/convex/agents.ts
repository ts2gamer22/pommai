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
        // Handle both string and object prompt formats
        let promptContent = '';
        if (typeof options.prompt === 'string') {
          promptContent = options.prompt;
        } else if (options.prompt) {
          // Extract text from nested structures
          promptContent = options.prompt?.content || options.prompt?.text || 
            (typeof options.prompt === 'object' ? JSON.stringify(options.prompt) : String(options.prompt));
        }
        if (promptContent) {
          messages.push({ role: 'user', content: promptContent });
        }
      }
      // Add any previous messages from options
      if (options.messages && Array.isArray(options.messages)) {
        // Normalize message format
        const normalizedMessages = options.messages.map((msg: any) => {
          // Extract content from various formats
          let content = msg.content;
          if (typeof content !== 'string') {
            if (Array.isArray(content)) {
              // Handle array of content objects (Convex Agent format)
              const textParts = content
                .filter((item: any) => item && (item.type === 'text' || item.text || item.content))
                .map((item: any) => {
                  if (typeof item === 'string') return item;
                  if (item.type === 'text' && item.text) return item.text;
                  if (item.content) return item.content;
                  if (item.text) return item.text;
                  return '';
                })
                .filter(Boolean);
              content = textParts.join(' ');
            } else if (content && typeof content === 'object') {
              // Handle single content object
              content = content.text || content.content || 
                (content.type === 'text' && content.value) || '';
            }
            // Only use JSON.stringify for debugging unknown structures
            if (!content && msg.content) {
              console.warn('Unknown message content structure:', msg.content);
              content = '';
            }
          }
          return {
            role: msg.role || 'user',
            content: content || ''
          };
        });
        messages.push(...normalizedMessages);
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

// Define the main toy agent - will be initialized with context in actions
// This is a placeholder that should not be used directly
export const toyAgent = new Agent(components.agent, {
  name: "ToyAgent",
  languageModel: toyLanguageModel as any, // Default fallback model
  instructions: "You are a friendly AI toy assistant. Be helpful, safe, and age-appropriate.",
});

// Helper to create a properly configured agent with context
function createAgentWithContext(ctx: any, toy: any) {
  const systemPrompt = buildToySystemPrompt(toy);
  return new Agent(components.agent, {
    name: toy.name || "ToyAgent",
    languageModel: createToyLanguageModel(ctx) as any,
    instructions: systemPrompt,
  });
}

// Create a thread for a toy
export const createToyThread = mutation({
  args: {
    toyId: v.id("toys"),
    userId: v.optional(v.id("_users")),
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
      skipEmbeddings: false, // Embed user transcripts for retrieval
    });

    return { messageId };
  },
});

// Generate AI response (to be called from both web chat and physical toy)
export const generateToyResponse = internalAction({
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

    // Build system prompt with toy personality and safety instructions
    const systemPrompt = buildToySystemPrompt(toy);
    const safetyInstructions = getSafetyInstructions(toy);

    try {
      // For kids mode, we need to use direct AI generation with tools instead of Convex Agent
      if (toy.isForKids) {
        console.log(`🧸 Kids mode activated for ${toy.name} (${toy.ageGroup}, ${toy.safetyLevel})`);
        
        // Use OpenRouter directly for tool support
        const messages = [
          { role: "system" as const, content: systemPrompt + safetyInstructions },
          { role: "user" as const, content: prompt || "Hello!" }
        ];
        
        const toolsConfig = {
          tools: kidsToolDefinitions,
          tool_choice: "auto" as const,
          extra_body: {
            provider: {
              order: ["openai"],
              allow_fallbacks: true,
              require_parameters: true,
              data_collection: "deny"
            }
          }
        };
        
        const response: any = await ctx.runAction(api.aiServices.generateResponse, {
          messages,
          model: "openai/gpt-oss-120b",
          temperature: toy.personalityTraits?.behavior?.imaginationLevel
            ? toy.personalityTraits.behavior.imaginationLevel / 10
            : 0.7,
          maxTokens: toy.safetyLevel === "strict" ? 150 : toy.safetyLevel === "moderate" ? 300 : 500,
          ...toolsConfig,
        });
        
        // Handle tool calls if present (OpenRouter format)
        const toolCalls = (response as any).choices?.[0]?.message?.tool_calls || [];
        if (toolCalls && toolCalls.length > 0) {
          console.log(`🛠️ Processing ${toolCalls.length} tool calls for kids mode`);
          
          const toolResults = await Promise.all(
            toolCalls.map(async (toolCall: any) => {
              try {
                switch (toolCall.function.name) {
                  case "quiz_generate":
                    const quizArgs = typeof toolCall.function.arguments === 'string' 
                      ? JSON.parse(toolCall.function.arguments) 
                      : toolCall.function.arguments;
                    return await ctx.runAction(api.agents.quizGenerate, quizArgs);
                  case "quiz_grade":
                    const gradeArgs = typeof toolCall.function.arguments === 'string' 
                      ? JSON.parse(toolCall.function.arguments) 
                      : toolCall.function.arguments;
                    return await ctx.runAction(api.agents.quizGrade, gradeArgs);
                  case "save_progress":
                    const progressArgs = typeof toolCall.function.arguments === 'string' 
                      ? JSON.parse(toolCall.function.arguments) 
                      : toolCall.function.arguments;
                    return await ctx.runMutation(api.agents.saveProgress, progressArgs);
                  case "tts_play":
                    const ttsArgs = typeof toolCall.function.arguments === 'string' 
                      ? JSON.parse(toolCall.function.arguments) 
                      : toolCall.function.arguments;
                    return await ctx.runAction(api.agents.ttsPlay, ttsArgs);
                  default:
                    console.warn(`Unknown tool: ${toolCall.function.name}`);
                    return { error: `Unknown tool: ${toolCall.function.name}` };
                }
              } catch (error) {
                console.error(`Tool execution error for ${toolCall.function.name}:`, error);
                return { error: `Failed to execute ${toolCall.function.name}` };
              }
            })
          );
          
          // Log tool usage (no PII)
          console.log(`📊 Kids tools used: ${toolCalls.map((tc: any) => tc.function.name).join(", ")}`);
          
          // Combine response with tool results
          const toolSummary = toolResults.map((result: any, index: number) => {
            const toolName = toolCalls[index].function.name;
            if (result.error) {
              return `❌ ${toolName}: ${result.error}`;
            }
            return `✅ ${toolName}: Success`;
          }).join("\n");
          
          return {
            text: response.content + (toolSummary ? `\n\n🛠️ Tools used:\n${toolSummary}` : ""),
            messageId: undefined,
            usage: response.usage,
            finishReason: response.finishReason,
            toolResults,
          } as any;
        }
        
        return {
          text: response.content || "I'm here to help you learn and play! What would you like to do?",
          messageId: undefined,
          usage: response.usage,
          finishReason: response.finishReason || "stop",
        };
      }
      
      // Non-kids mode: use existing Convex Agent approach
      const agent = createAgentWithContext(ctx, toy);
      
      // Use the Agent's generateText method for proper context management
      // Use either promptMessageId OR prompt, not both (Convex Agent best practice)
      const generateArgs: any = {
        system: systemPrompt + safetyInstructions,
        temperature: toy.personalityTraits?.behavior?.imaginationLevel
          ? toy.personalityTraits.behavior.imaginationLevel / 10
          : 0.7,
      };
      
      // Only set one of promptMessageId or prompt
      if (promptMessageId) {
        generateArgs.promptMessageId = promptMessageId;
      } else if (prompt) {
        generateArgs.prompt = prompt;
      } else {
        throw new Error("Either promptMessageId or prompt must be provided");
      }
      
      const result = await agent.generateText(
        ctx,
        { threadId },
        generateArgs,
        {
          // Context options for retrieving relevant history
          contextOptions: {
            excludeToolMessages: true,
            recentMessages: 10, // Include last 10 messages for context
            searchOptions: {
              limit: 5,
              textSearch: true,
              vectorSearch: false, // Disabled until a textEmbeddingModel is configured on the Agent
              messageRange: { before: 2, after: 1 },
            },
            searchOtherThreads: false,
          },
          // Storage options
          storageOptions: {
            saveMessages: "promptAndOutput", // Save both user prompt and AI response
          },
        }
      );
      
      return {
        text: result.text || "I'm having trouble responding right now.",
        messageId: result.promptMessageId,
        usage: result.usage,
        finishReason: result.finishReason || "stop",
      };
    } catch (error) {
      console.error("Error generating toy response:", error);
      
      // Enhanced safe fallbacks for kids mode
      if (toy.isForKids) {
        const kidsSafeFallbacks = {
          "strict": [
            "Hi! Let's play a fun game! 🎈",
            "What color do you like? 🌈", 
            "Can you count to 5? 1, 2, 3... 🔢",
            "What sound does a cat make? Meow! 🐱"
          ],
          "moderate": [
            "That's a great question! Let's explore something fun together! ✨",
            "I love learning with you! What would you like to discover today? 📚",
            "How about we play a guessing game or solve a puzzle? 🧩",
            "Want to learn about animals, colors, or numbers? 🦋"
          ],
          "relaxed": [
            "I'm here to help you learn and explore! What interests you most? 🌟",
            "Let's embark on a learning adventure! What topic excites you? 🚀", 
            "I can help with stories, math, science, or creative activities! 🎨",
            "What would you like to create or discover together today? 💡"
          ]
        };
        
        const fallbacks = kidsSafeFallbacks[toy.safetyLevel as keyof typeof kidsSafeFallbacks] || kidsSafeFallbacks.moderate;
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        
        return {
          text: randomFallback,
          messageId: undefined,
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          finishReason: "fallback",
        } as any;
      }
      
      // Standard fallback for non-kids toys
      return {
        text: "I'm having trouble understanding. Could you try asking in a different way?",
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
    
    // Build args with only one of promptMessageId or prompt
    const streamArgs: any = {
      system: systemPrompt,
      temperature: toy.personalityTraits?.behavior?.imaginationLevel
        ? toy.personalityTraits.behavior.imaginationLevel / 10
        : 0.7,
    };
    
    // Only set one of promptMessageId or prompt (Convex Agent best practice)
    if (promptMessageId) {
      streamArgs.promptMessageId = promptMessageId;
    } else if (prompt) {
      streamArgs.prompt = prompt;
    } else {
      throw new Error("Either promptMessageId or prompt must be provided");
    }
    
    // Stream with delta saving for real-time updates
    const result: any = await toyAgent.streamText(
      ctx,
      { threadId },
      streamArgs,
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

// Tool definitions for Kids/Guardian mode interactive features
const kidsToolDefinitions = [
  {
    type: "function",
    function: {
      name: "quiz_generate",
      description: "Generate an age-appropriate quiz for learning.",
      parameters: {
        type: "object",
        properties: {
          ageGroup: { type: "string", description: "Target age group: 3-5, 6-8, or 9-12" },
          safetyLevel: { type: "string", description: "Safety level: strict, moderate, or relaxed" },
          topic: { type: "string", description: "Quiz topic (colors, numbers, letters, animals, etc.)" },
          numQuestions: { type: "integer", description: "Number of questions (1-5 recommended)" }
        },
        required: ["ageGroup", "safetyLevel", "topic"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "quiz_grade",
      description: "Grade a user's answers and return scoring + hints.",
      parameters: {
        type: "object",
        properties: {
          quizId: { type: "string", description: "Unique quiz identifier" },
          answers: { type: "object", description: "User's answers to quiz questions" }
        },
        required: ["quizId", "answers"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "save_progress",
      description: "Persist user progress for a kid (no PII).",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "Anonymous user identifier" },
          toyId: { type: "string", description: "Toy identifier" },
          progress: { type: "object", description: "Learning progress data" }
        },
        required: ["userId", "toyId", "progress"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "tts_play",
      description: "Request server to generate TTS audio or sound effect cue.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to convert to speech" },
          voice: { type: "string", description: "Voice type (optional)" },
          soundType: { type: "string", description: "Sound effect type (animal, instrument, etc.)" }
        },
        required: ["text"]
      }
    }
  }
];

// Quiz Flow Helper Functions for Kids/Guardian Mode
export const quizGenerate = action({
  args: {
    ageGroup: v.string(),
    safetyLevel: v.string(),
    topic: v.string(),
    numQuestions: v.optional(v.number()),
  },
  handler: async (ctx, { ageGroup, safetyLevel, topic, numQuestions = 3 }) => {
    const maxQuestions = safetyLevel === "strict" ? 1 : safetyLevel === "moderate" ? 3 : 5;
    const questionCount = Math.min(numQuestions, maxQuestions);
    
    // Generate quiz questions based on age group and topic
    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Age-appropriate quiz templates
    const quizTemplates: Record<string, any> = {
      "colors": {
        "3-5": [
          { question: "What color is the sun?", choices: ["Yellow", "Blue", "Green"], answer: "Yellow" },
          { question: "What color is grass?", choices: ["Red", "Green", "Purple"], answer: "Green" }
        ],
        "6-8": [
          { question: "What happens when you mix red and yellow?", choices: ["Orange", "Purple", "Green"], answer: "Orange" },
          { question: "What are the primary colors?", choices: ["Red, Blue, Yellow", "Green, Orange, Purple", "Black, White, Gray"], answer: "Red, Blue, Yellow" }
        ],
        "9-12": [
          { question: "What is a complementary color to red?", choices: ["Green", "Blue", "Yellow"], answer: "Green" },
          { question: "In the color wheel, what comes between blue and yellow?", choices: ["Green", "Purple", "Orange"], answer: "Green" }
        ]
      },
      "numbers": {
        "3-5": [
          { question: "How many fingers do you have on one hand?", choices: ["3", "5", "7"], answer: "5" },
          { question: "What comes after 3?", choices: ["2", "4", "6"], answer: "4" }
        ],
        "6-8": [
          { question: "What is 2 + 3?", choices: ["4", "5", "6"], answer: "5" },
          { question: "What is 10 - 4?", choices: ["5", "6", "7"], answer: "6" }
        ],
        "9-12": [
          { question: "What is 7 × 8?", choices: ["54", "56", "58"], answer: "56" },
          { question: "What is 144 ÷ 12?", choices: ["11", "12", "13"], answer: "12" }
        ]
      },
      "animals": {
        "3-5": [
          { question: "What sound does a cow make?", choices: ["Woof", "Moo", "Meow"], answer: "Moo" },
          { question: "Which animal says 'roar'?", choices: ["Cat", "Dog", "Lion"], answer: "Lion" }
        ],
        "6-8": [
          { question: "Which animal is the largest mammal?", choices: ["Elephant", "Blue Whale", "Giraffe"], answer: "Blue Whale" },
          { question: "What do we call baby cats?", choices: ["Puppies", "Kittens", "Cubs"], answer: "Kittens" }
        ],
        "9-12": [
          { question: "Which animal can change its color to blend in?", choices: ["Chameleon", "Zebra", "Penguin"], answer: "Chameleon" },
          { question: "What is a group of lions called?", choices: ["Pack", "Herd", "Pride"], answer: "Pride" }
        ]
      }
    };
    
    const topicQuestions = quizTemplates[topic.toLowerCase()]?.[ageGroup] || quizTemplates["colors"][ageGroup];
    const selectedQuestions = topicQuestions.slice(0, questionCount);
    
    return {
      quizId,
      topic,
      ageGroup,
      safetyLevel,
      questions: selectedQuestions,
      totalQuestions: selectedQuestions.length,
      createdAt: Date.now()
    };
  },
});

export const quizGrade = action({
  args: {
    quizId: v.string(),
    answers: v.any(), // User's answers
    questions: v.optional(v.any()), // Original quiz questions for reference
  },
  handler: async (ctx, { quizId, answers, questions }) => {
    if (!questions || !Array.isArray(questions)) {
      return {
        score: 0,
        totalQuestions: 0,
        explanations: ["Unable to grade quiz - questions not provided"],
        hints: ["Try taking the quiz again!"],
        encouragement: "Don't worry, learning is all about trying! 🌟"
      };
    }
    
    let correctAnswers = 0;
    const explanations: string[] = [];
    const hints: string[] = [];
    
    questions.forEach((question: any, index: number) => {
      const userAnswer = answers[index] || answers[`question_${index}`];
      const correctAnswer = question.answer;
      
      if (userAnswer === correctAnswer) {
        correctAnswers++;
        explanations.push(`✅ Correct! ${userAnswer} is right!`);
      } else {
        explanations.push(`❌ The correct answer is ${correctAnswer}. You said ${userAnswer || 'no answer'}.`);
        hints.push(`Remember: ${question.question} - Think about ${correctAnswer}!`);
      }
    });
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    let encouragement = "";
    
    if (score >= 80) {
      encouragement = "Fantastic! You're doing amazing! 🎉";
    } else if (score >= 60) {
      encouragement = "Good job! Keep practicing and you'll get even better! ⭐";
    } else {
      encouragement = "That's okay! Learning takes practice. You're doing great by trying! 🌟";
    }
    
    return {
      quizId,
      score,
      correctAnswers,
      totalQuestions: questions.length,
      explanations,
      hints,
      encouragement,
      gradedAt: Date.now()
    };
  },
});

export const saveProgress = mutation({
  args: {
    userId: v.string(), // Anonymous session ID, not personal info
    toyId: v.id("toys"),
    progress: v.object({
      topic: v.string(),
      score: v.number(),
      questionsAnswered: v.number(),
      timeSpent: v.optional(v.number()),
      difficulty: v.string(),
    }),
  },
  handler: async (ctx, { userId, toyId, progress }) => {
    // Store non-PII learning progress
    const progressId = await ctx.db.insert("toyKnowledge", {
      toyId,
      content: `Learning progress: ${progress.topic} - Score: ${progress.score}%`,
      type: "progress" as any,
      metadata: {
        source: "interactive_quiz",
        importance: 0.5,
        tags: ["learning", "progress", progress.topic.toLowerCase()],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { progressId, saved: true };
  },
});

export const ttsPlay = action({
  args: {
    text: v.string(),
    voice: v.optional(v.string()),
    soundType: v.optional(v.string()),
  },
  handler: async (ctx, { text, voice, soundType }) => {
    // For sound effects, we can return preset audio cues
    if (soundType) {
      const soundEffects: Record<string, string> = {
        "applause": "👏 Clap clap clap!",
        "cheer": "🎉 Yay! Hooray!",
        "animal_cow": "🐄 Mooooo!",
        "animal_cat": "🐱 Meow meow!",
        "animal_dog": "🐕 Woof woof!",
        "animal_lion": "🦁 ROAAAAR!",
        "musical_note": "🎵 La la la!",
        "success": "✨ Ding ding! Well done!",
        "try_again": "💪 That's okay, try again!"
      };
      
      const soundText = soundEffects[soundType] || text;
      return {
        audioRequested: true,
        text: soundText,
        soundType,
        instruction: `Play sound effect: ${soundType}`,
      };
    }
    
    // For regular TTS, we return the text to be spoken
    return {
      audioRequested: true,
      text,
      voice: voice || "default",
      instruction: "Convert text to speech",
    };
  },
});

// Helper function to get safety instructions for kids toys
function getSafetyInstructions(toy: any): string {
  if (!toy?.isForKids) return "";

  const base = `
CRITICAL SAFETY RULES FOR CHILDREN:
- You are talking to a ${toy.ageGroup || "young"} child.
- Use short, age-appropriate language.
- Do not ask for or store personal info (name, address, phone, exact location).
- Never discuss violence, sexual content, or other adult themes.
- If asked about medical/legal topics, say "I'm not the right helper for that" and redirect to a parent.
- Keep interactions playful, encouraging, and educational.
- Use tool calls for interactive learning: quizzes, games, sounds, and progress tracking.
`;

  switch (toy.safetyLevel) {
    case "strict":
      return base + `
- Age target: 3-5 years
- Reply length: 1-2 short sentences.
- Activities: ABC song, colors, simple counting (1-10), single-step games.
- Use sound cues and onomatopoeia. Keep questions single-choice with big hints.
- Always use quiz_generate for learning activities, tts_play for sounds.
- Save progress with save_progress (no personal identifiers).
`;
    case "moderate":
      return base + `
- Age target: 6-8 years
- Reply length: 2-3 short sentences.
- Activities: short stories, basic arithmetic (+/-), quizzes (3 questions).
- Encourage curiosity, give one- or two-step tasks, use simple examples.
- Use quiz_generate for educational content, quiz_grade for feedback.
- Save learning progress without collecting personal data.
`;
    case "relaxed":
      return base + `
- Age target: 9-12 years
- Reply length: concise paragraphs allowed.
- Activities: creative storytelling, multi-step puzzles, multiplication basics.
- Guide reasoning and suggest follow-up learning activities.
- Use comprehensive tool set for interactive learning experiences.
- Track progress and provide personalized learning paths.
`;
    default:
      return base;
  }
}

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

  // Add tool usage instructions for kids mode
  if (toy.isForKids) {
    prompt += `

TOOL USAGE FOR INTERACTIVE LEARNING:
- Use quiz_generate to create educational quizzes tailored to ${toy.ageGroup || 'young children'}
- Use quiz_grade to provide encouraging feedback on quiz responses
- Use tts_play to add sound effects, animal sounds, or musical elements
- Use save_progress to track learning achievements (NO personal data)
- Always prioritize fun, engagement, and age-appropriate content
- When a child asks to play a game or learn something, use tools to make it interactive
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
/*
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
*/

// Internal helpers (not exposed to client)
export const internalAgents = {
  agents: {
    generateToyResponse,
    streamToyResponse,
    quizGenerate,
    quizGrade,
    saveProgress,
    ttsPlay,
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