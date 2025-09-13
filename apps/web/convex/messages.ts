import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
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
      timestamp: new Date().toISOString(),
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

// Generate AI response with audio
export const generateAIResponse = action({
  args: {
    conversationId: v.id("conversations"),
    userMessage: v.string(),
    includeAudio: v.optional(v.boolean()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    text: string;
    audioData?: string;
    format?: string;
    duration?: number;
  }> => {
    // Get conversation and toy details
    const conversation = await ctx.runQuery(api.conversations.getConversationWithMessages, {
      conversationId: args.conversationId,
    });

    if (!conversation || !conversation.toy) {
      throw new Error("Conversation or toy not found");
    }

    const toy = conversation.toy;
    
    try {
      // Step 1: Get or create the canonical agent thread for this toy
      const { threadId } = await ctx.runMutation(api.agents.getOrCreateToyThread, {
        toyId: toy._id,
        userId: toy.creatorId,
      });

      // Step 2: Save the user's message to the agent thread
      const { messageId } = await ctx.runMutation(api.agents.saveAudioMessage, {
        threadId,
        transcript: args.userMessage,
      });

      // Step 3: Generate response using the unified Agent approach
      // Only pass promptMessageId since we already saved the message
      const agentResult = await ctx.runAction(internal.agents.generateToyResponse, {
        threadId,
        toyId: toy._id,
        promptMessageId: messageId,
        // Don't pass prompt - the Agent will get it from promptMessageId
      });

      const responseText = agentResult.text || "I'm having trouble understanding. Can you try asking in a different way?";
      
      // Step 4: Apply safety check for kids' toys
      let finalText = responseText;
      let metadata: any = {
        safetyScore: 1.0,
        flagged: false,
      };
      
      if (toy.isForKids) {
        const safetyCheck = await ctx.runAction(internal.aiPipeline.checkContentSafety, {
          text: responseText,
          level: "strict",
        });
        
        if (!safetyCheck.passed) {
          console.log("Output safety check failed, using fallback response");
          finalText = "That's interesting! Let me think of something fun we can talk about instead.";
          metadata.flagged = true;
          metadata.safetyFlags = [safetyCheck.reason];
        }
      }

      // Generate audio if requested
      let audioData: string | undefined;
      let format: string | undefined;
      let duration: number | undefined;

      // Skip audio generation for web chat to avoid TTS issues
      // Audio is primarily for physical toys, not web interface
      const skipAudio = true; // Disable audio for now
      
      if (!skipAudio && args.includeAudio !== false) {
        try {
          const audioResponse = await ctx.runAction(api.aiServices.synthesizeSpeech, {
            text: finalText,
            voiceId: toy.voiceId || "JBFqnCBsd6RMkjVDRZzb",
            voiceSettings: {
              stability: 0.5,
              similarityBoost: 0.75,
              style: 0,
              useSpeakerBoost: true,
            },
            outputFormat: "mp3_44100_128",
          });

          audioData = audioResponse.audioData;
          format = audioResponse.format;
          duration = audioResponse.duration;
        } catch (audioError) {
          console.log("TTS skipped due to error:", audioError);
          // Continue without audio - this is fine for web chat
        }
      }

      // Save AI response with metadata
      await ctx.runMutation(api.messages.sendMessage, {
        conversationId: args.conversationId,
        content: finalText,
        role: "toy",
        metadata,
      });

      return {
        text: finalText,
        audioData,
        format,
        duration,
      };
    } catch (error) {
      console.error("Error in AI pipeline:", error);
      
      // Fallback response
      const fallbackText = `Hi! I'm ${toy.name}. I'm having a little trouble right now, but I'm still happy to talk with you! What would you like to chat about?`;
      
      // Try to generate audio for fallback
      let audioData: string | undefined;
      let format: string | undefined;
      
      // Skip audio for fallback as well
      const skipAudio = true;
      if (!skipAudio && args.includeAudio !== false) {
        try {
          const audioResponse = await ctx.runAction(api.aiServices.synthesizeSpeech, {
            text: fallbackText,
            voiceId: toy.voiceId || "JBFqnCBsd6RMkjVDRZzb",
            outputFormat: "mp3_44100_128",
          });
          audioData = audioResponse.audioData;
          format = audioResponse.format;
        } catch (audioError) {
          console.log("Fallback TTS skipped:", audioError);
        }
      }
      
      // Save fallback response
      await ctx.runMutation(api.messages.sendMessage, {
        conversationId: args.conversationId,
        content: fallbackText,
        role: "toy",
        metadata: {
          safetyScore: 1.0,
          flagged: false,
          // Note: isFallback is tracked internally but not in schema
        },
      });

      return {
        text: fallbackText,
        audioData,
        format,
      };
    }
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

/**
 * Internal helper to log a message without requiring client auth.
 * Used by device/gateway pipelines to persist transcripts and replies.
 */
export const logMessage = internalMutation({
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
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      audioUrl: args.audioUrl,
      metadata: args.metadata,
      timestamp: Date.now().toString(),
    });

    // Update counters on the conversation.
    const flaggedMessages = args.metadata?.flagged ? conversation.flaggedMessages + 1 : conversation.flaggedMessages;
    await ctx.db.patch(args.conversationId, {
      messageCount: conversation.messageCount + 1,
      flaggedMessages,
    });

    return messageId;
  },
});

/**
 * Internal maintenance job to delete messages older than 48 hours.
 * Deletes in small batches to stay within execution limits and maintains
 * conversation counters for integrity.
 */
export const deleteOldMessages = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { batchSize }) => {
    const BATCH = Math.max(1, Math.min(batchSize ?? 500, 1000));
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const cutoffStr = cutoff.toString();

    const oldMessages = await ctx.db
      .query("messages")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoffStr))
      .take(BATCH);

    for (const msg of oldMessages) {
      // Adjust conversation counters if possible.
      const conv = await ctx.db.get(msg.conversationId);
      if (conv) {
        await ctx.db.patch(conv._id, {
          messageCount: Math.max(0, conv.messageCount - 1),
          flaggedMessages: Math.max(0, conv.flaggedMessages - (msg.metadata?.flagged ? 1 : 0)),
        });
      }
      await ctx.db.delete(msg._id);
    }

    return { deletedCount: oldMessages.length, cutoff: cutoff };
  },
});
