import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Send a message in a conversation
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("toy"), v.literal("system")),
    audioUrl: v.optional(v.string()),
    metadata: v.optional(v.object({
      sentiment: v.optional(v.string()),
      safetyScore: v.optional(v.number()),
      flagged: v.optional(v.boolean()),
      topics: v.optional(v.array(v.string())),
      educationalValue: v.optional(v.number()),
      emotionalTone: v.optional(v.string()),
      safetyFlags: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      audioUrl: args.audioUrl,
      metadata: args.metadata,
      timestamp: Date.now().toString(),
    });

    // Update conversation message count and flagged count if needed
    const flaggedMessages = args.metadata?.flagged ? conversation.flaggedMessages + 1 : conversation.flaggedMessages;
    await ctx.db.patch(args.conversationId, {
      messageCount: conversation.messageCount + 1,
      flaggedMessages,
    });

    return messageId;
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .take(args.limit || 100);

    return messages;
  },
});

// Generate AI response
export const generateAIResponse = action({
  args: {
    conversationId: v.id("conversations"),
    userMessage: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    // Get conversation and toy details
    const conversation = await ctx.runQuery(api.conversations.getConversationWithMessages, {
      conversationId: args.conversationId,
    });

    if (!conversation || !conversation.toy) {
      throw new Error("Conversation or toy not found");
    }

    const toy = conversation.toy;
    const recentMessages = conversation.messages.slice(-10); // Last 10 messages for context

    // Build context from recent messages
    const conversationContext = recentMessages
      .map((msg: any) => `${msg.role === "user" ? "User" : toy.name}: ${msg.content}`)
      .join("\n");

    // Generate system prompt based on toy configuration
    const systemPrompt = `You are ${toy.name}, a ${toy.type} toy with the following personality: ${toy.personalityPrompt}.
${toy.isForKids ? `This is a conversation with a child aged ${toy.ageGroup}. Keep responses age-appropriate, educational, and safe.` : ""}

Recent conversation:
${conversationContext}

Stay in character and respond naturally as ${toy.name} would.`;

    // TODO: Replace with actual LLM API call
    // For now, return a mock response
    const mockResponse = `Hello! I'm ${toy.name}, and I'm so happy to talk with you! What would you like to chat about today? 🌟`;

    // Apply safety checks if it's a kids' toy
    let finalResponse = mockResponse;
    let metadata: any = {};

    if (toy.isForKids) {
      // TODO: Implement actual safety checking
      metadata.safetyScore = 1.0;
      metadata.flagged = false;
    }

    // Save AI response
    await ctx.runMutation(api.messages.sendMessage, {
      conversationId: args.conversationId,
      content: finalResponse,
      role: "toy",
      metadata,
    });

    return finalResponse;
  },
});

// Flag a message for review
export const flagMessage = mutation({
  args: {
    messageId: v.id("messages"),
    reason: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    // Update message metadata
    await ctx.db.patch(args.messageId, {
      metadata: {
        ...message.metadata,
        flagged: true,
        safetyFlags: [...(message.metadata?.safetyFlags || []), args.reason],
      },
    });

    // Create moderation log (matching schema)
    await ctx.db.insert("moderationLogs", {
      messageId: args.messageId,
      flagType: args.reason,
      severity: args.severity,
      details: `Message flagged: ${args.reason}`,
      action: "flagged",
      timestamp: Date.now().toString(),
    });

    // Update conversation flagged count
    const conversation = await ctx.db.get(message.conversationId);
    if (conversation) {
      await ctx.db.patch(message.conversationId, {
        flaggedMessages: conversation.flaggedMessages + 1,
      });
    }
  },
});

// Search messages with filters
export const searchMessages = query({
  args: {
    conversationId: v.optional(v.id("conversations")),
    toyId: v.optional(v.id("toys")),
    userId: v.optional(v.id("users")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    flaggedOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Get all messages first (since we don't have direct toy/user indexes on messages)
    let messages = await ctx.db.query("messages").collect();

    // If conversationId is provided, filter by it
    if (args.conversationId) {
      messages = messages.filter(msg => msg.conversationId === args.conversationId);
    }

    // If toyId or userId provided, we need to get conversations first
    if (args.toyId || args.userId) {
      let conversations;
      if (args.toyId) {
        conversations = await ctx.db
          .query("conversations")
          .withIndex("by_toy", (q) => q.eq("toyId", args.toyId!))
          .collect();
      } else if (args.userId) {
        conversations = await ctx.db
          .query("conversations")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();
      }
      
      if (conversations) {
        const conversationIds = new Set(conversations.map(c => c._id));
        messages = messages.filter(msg => conversationIds.has(msg.conversationId));
      }
    }

    // Apply additional filters
    const filtered = messages.filter((msg) => {
      if (args.flaggedOnly && !msg.metadata?.flagged) return false;
      return (
        (!args.dateFrom || parseInt(msg.timestamp) >= args.dateFrom) &&
        (!args.dateTo || parseInt(msg.timestamp) <= args.dateTo)
      );
    });
    
    // Sort by timestamp descending and apply limit
    filtered.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    const limited = filtered.slice(0, args.limit || 100);

    return limited;
  },
});
