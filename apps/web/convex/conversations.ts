import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Create a new conversation
export const createConversation = mutation({
  args: {
    toyId: v.id("toys"),
    sessionId: v.string(),
    location: v.optional(v.union(v.literal("toy"), v.literal("web"), v.literal("app"))),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    const conversationId = await ctx.db.insert("conversations", {
      toyId: args.toyId,
      sessionId: args.sessionId,
      startTime: new Date().toISOString(),
      userId: user?._id,
      duration: 0,
      messageCount: 0,
      flaggedMessages: 0,
      sentiment: "neutral",
      topics: [],
      location: args.location || "web",
      deviceId: args.deviceId,
    });

    return conversationId;
  },
});

// End a conversation
export const endConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.patch(args.conversationId, {
      endTime: new Date().toISOString(),
      duration: Math.floor((Date.now() - new Date(conversation.startTime).getTime()) / 1000),
    });
  },
});

// Get recent conversations
export const getRecentConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return ctx.db
      .query("conversations")
      .order("desc")
      .take(10);
  },
});

// Get conversation history
export const getConversationHistory = query({
  args: {
    toyId: v.optional(v.id("toys")),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let conversations;
    
    if (args.toyId) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_toy", (q) => q.eq("toyId", args.toyId!))
        .order("desc")
        .collect();
    } else if (args.userId) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    } else {
      conversations = await ctx.db
        .query("conversations")
        .order("desc")
        .collect();
    }

    // Apply limit
    conversations = conversations.slice(0, args.limit || 10);

    // Get message counts for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .collect();

        return {
          ...conv,
          messageCount: messages.length,
        };
      })
    );

    return conversationsWithDetails;
  },
});

// Get active conversations for monitoring
export const getActiveConversations = query({
  args: {
    isForKids: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    // Allow public test mode for development
    const allowUnauthTests = (process.env.ALLOW_UNAUTH_TESTS || "true").toLowerCase() === "true";
    if (!identity && !allowUnauthTests) return [];

    let query = ctx.db.query("conversations");
    
    // Filter by toys that are for kids if specified
    const conversations = await query
      .order("desc")
      .take(args.limit || 20);
    
    // Fetch toy details and filter by isForKids if needed
    const conversationsWithToys = await Promise.all(
      conversations.map(async (conv) => {
        const toy = await ctx.db.get(conv.toyId);
        if (args.isForKids && toy && !toy.isForKids) {
          return null;
        }
        return { ...conv, toy };
      })
    );
    
    // Filter out nulls and return active conversations
    return conversationsWithToys
      .filter(conv => conv !== null)
      .filter(conv => {
        // Consider a conversation active if it had messages in the last hour
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const lastActivity = parseInt((conv as any).lastMessageAt || (conv as any).startedAt || "0");
        return lastActivity > oneHourAgo;
      });
  },
});

// Get conversation with messages
export const getConversationWithMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    const toy = await ctx.db.get(conversation.toyId);
    const user = conversation.userId ? await ctx.db.get(conversation.userId) : null;

    return {
      ...conversation,
      messages,
      toy,
      user,
    };
  },
});

// Get conversation history with advanced filters
export const getFilteredConversationHistory = query({
  args: {
    toyId: v.optional(v.id("toys")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    sentiment: v.optional(v.array(v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative")))),
    hasFlaggedMessages: v.optional(v.boolean()),
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let conversations;
    
    if (args.toyId) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_toy", (q) => q.eq("toyId", args.toyId!))
        .order("desc")
        .collect();
    } else {
      conversations = await ctx.db
        .query("conversations")
        .order("desc")
        .collect();
    }
    
    // Apply limit
    conversations = conversations.slice(0, args.limit || 100);

    // Get additional details for filtering
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .collect();

        const toy = await ctx.db.get(conv.toyId);
        
        // Calculate sentiment and flagged count
        let flaggedCount = 0;
        let positiveCount = 0;
        let negativeCount = 0;
        let neutralCount = 0;
        
        messages.forEach((msg) => {
          if (msg.metadata?.flagged) flaggedCount++;
          const sentiment = msg.metadata?.sentiment || 'neutral';
          if (sentiment === 'positive') positiveCount++;
          else if (sentiment === 'negative') negativeCount++;
          else neutralCount++;
        });
        
        // Determine overall sentiment
        let overallSentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
        if (positiveCount > negativeCount && positiveCount > neutralCount) {
          overallSentiment = 'positive';
        } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
          overallSentiment = 'negative';
        }

        // Check if conversation matches search query
        let matchesSearch = true;
        if (args.searchQuery) {
          const query = args.searchQuery.toLowerCase();
          matchesSearch = messages.some(msg => 
            msg.content.toLowerCase().includes(query)
          );
        }

        return {
          ...conv,
          toyName: toy?.name || 'Unknown Toy',
          messageCount: messages.length,
          flaggedMessageCount: flaggedCount,
          sentiment: overallSentiment,
          startedAt: parseInt(conv.startTime),
          duration: conv.endTime ? parseInt(conv.endTime) - parseInt(conv.startTime) : 0,
          matchesSearch,
        };
      })
    );

    // Apply filters
    const filtered = conversationsWithDetails.filter((conv) => {
      if (args.dateFrom && parseInt(conv.startTime) < args.dateFrom) return false;
      if (args.dateTo && parseInt(conv.startTime) > args.dateTo) return false;
      if (args.sentiment && args.sentiment.length > 0 && !args.sentiment.includes(conv.sentiment)) return false;
      if (args.hasFlaggedMessages !== undefined && (conv.flaggedMessageCount > 0) !== args.hasFlaggedMessages) return false;
      if (!conv.matchesSearch) return false;
      return true;
    });

    return filtered;
  },
});

// Get conversation analytics
export const getConversationAnalytics = query({
  args: {
    toyId: v.optional(v.id("toys")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    let allConversations;
    
    if (args.toyId) {
      allConversations = await ctx.db
        .query("conversations")
        .withIndex("by_toy", (q) => q.eq("toyId", args.toyId!))
        .collect();
    } else {
      allConversations = await ctx.db
        .query("conversations")
        .collect();
    }

    // Filter by date range
    const filtered = allConversations.filter((conv) => {
      const startTime = parseInt(conv.startTime);
      if (args.dateFrom && startTime < args.dateFrom) return false;
      if (args.dateTo && startTime > args.dateTo) return false;
      return true;
    });

    // Get all messages for sentiment analysis
    const allMessages = await Promise.all(
      filtered.map(async (conv) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .collect();
        return messages;
      })
    );

    const flatMessages = allMessages.flat();

    // Calculate analytics
    const totalConversations = filtered.length;
    const totalMessages = flatMessages.length;
    const totalDuration = filtered.reduce((sum, conv) => {
      const duration = conv.endTime ? parseInt(conv.endTime) - parseInt(conv.startTime) : 0;
      return sum + duration;
    }, 0);
    const averageDuration = totalConversations > 0 ? totalDuration / totalConversations : 0;

    // Sentiment breakdown
    const sentimentBreakdown = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };
    
    flatMessages.forEach((msg) => {
      const sentiment = msg.metadata?.sentiment || 'neutral';
      sentimentBreakdown[sentiment as keyof typeof sentimentBreakdown]++;
    });

    // Conversations by day (last 30 days)
    const conversationsByDay: { [key: string]: number } = {};
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    filtered
      .filter(conv => parseInt(conv.startTime) >= thirtyDaysAgo)
      .forEach((conv) => {
        const date = new Date(parseInt(conv.startTime)).toISOString().split('T')[0];
        conversationsByDay[date] = (conversationsByDay[date] || 0) + 1;
      });

    // Convert to array format
    const conversationsByDayArray = Object.entries(conversationsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Count flagged messages
    const flaggedMessageCount = flatMessages.filter(msg => msg.metadata?.flagged).length;

    return {
      totalConversations,
      totalMessages,
      averageDuration,
      sentimentBreakdown,
      conversationsByDay: conversationsByDayArray,
      flaggedMessageCount,
      // TODO: Add topic analysis when we have topic extraction
      topTopics: [],
    };
  },
});

/**
 * Get the active conversation for the current user and toy.
 * Returns the most recent conversation for this toy owned by the user.
 */
export const getActiveConversation = query({
  args: {
    toyId: v.id("toys"),
  },
  handler: async (ctx, { toyId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Find the app user record from auth identity.
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return null;

    // Get latest conversation for this user and toy.
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const conv = conversations.find((c) => c.toyId === toyId) || null;
    return conv;
  },
});

/**
 * Internal helper to get or create a conversation by sessionId.
 * - Does not require client auth.
 * - Links the conversation's userId to the toy creator for Guardian Mode.
 */
export const getOrCreate = internalMutation({
  args: {
    toyId: v.id("toys"),
    sessionId: v.string(),
    location: v.optional(v.union(v.literal("toy"), v.literal("web"), v.literal("app"))),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to find an existing conversation for this session.
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existing && existing.toyId === args.toyId) {
      return existing._id;
    }

    // Create a new conversation linked to the toy's creator as the user.
    const toy = await ctx.db.get(args.toyId);
    const userId = toy?.creatorId;

    const conversationId = await ctx.db.insert("conversations", {
      toyId: args.toyId,
      userId,
      sessionId: args.sessionId,
      startTime: new Date().toISOString(),
      duration: 0,
      messageCount: 0,
      flaggedMessages: 0,
      sentiment: "neutral",
      topics: [],
      location: args.location || "toy",
      deviceId: args.deviceId,
    });

    return conversationId;
  },
});
