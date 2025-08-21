import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new toy
 * This mutation handles the creation of both general toys and "For Kids" toys
 */
export const createToy = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    isForKids: v.boolean(),
    ageGroup: v.optional(v.union(v.literal("3-5"), v.literal("6-8"), v.literal("9-12"))),
    voiceId: v.string(),
    personalityPrompt: v.string(),
    personalityTraits: v.object({
      traits: v.array(v.string()),
      speakingStyle: v.object({
        vocabulary: v.union(v.literal("simple"), v.literal("moderate"), v.literal("advanced")),
        sentenceLength: v.union(v.literal("short"), v.literal("medium"), v.literal("long")),
        usesSoundEffects: v.boolean(),
        catchPhrases: v.array(v.string()),
      }),
      interests: v.array(v.string()),
      favoriteTopics: v.array(v.string()),
      avoidTopics: v.array(v.string()),
      behavior: v.object({
        encouragesQuestions: v.boolean(),
        tellsStories: v.boolean(),
        playsGames: v.boolean(),
        educationalFocus: v.number(),
        imaginationLevel: v.number(),
      }),
    }),
    safetyLevel: v.optional(v.union(v.literal("strict"), v.literal("moderate"), v.literal("relaxed"))),
    contentFilters: v.optional(v.object({
      enabledCategories: v.array(v.string()),
      customBlockedTopics: v.array(v.string()),
    })),
    isPublic: v.boolean(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // For "For Kids" toys, age group and safety settings are required
    if (args.isForKids && !args.ageGroup) {
      throw new Error("Age group is required for toys designated 'For Kids'");
    }

    if (args.isForKids && !args.safetyLevel) {
      throw new Error("Safety level is required for toys designated 'For Kids'");
    }

    // Validate personality traits (max 3)
    if (args.personalityTraits.traits.length > 3) {
      throw new Error("Maximum 3 personality traits allowed");
    }

    const now = new Date().toISOString();

    // Get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    const toyId = await ctx.db.insert("toys", {
      name: args.name,
      type: args.type,
      creatorId: user._id,
      isForKids: args.isForKids,
      ageGroup: args.ageGroup,
      voiceId: args.voiceId,
      personalityPrompt: args.personalityPrompt,
      personalityTraits: args.personalityTraits,
      guardianId: args.isForKids ? user._id : undefined,
      safetyLevel: args.safetyLevel,
      contentFilters: args.contentFilters,
      assignedDevices: [],
      status: "active",
      isPublic: args.isPublic,
      tags: args.tags,
      usageCount: 0,
      createdAt: now,
      lastActiveAt: now,
      lastModifiedAt: now,
    });

    return toyId;
  },
});

// Get all toys for a user
export const getUserToys = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // TODO: Get actual user ID from auth
    const userId = args.userId;
    if (!userId) return [];

    const toys = await ctx.db
      .query("toys")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .order("desc")
      .collect();

    // Get additional stats for each toy
    const toysWithStats = await Promise.all(
      toys.map(async (toy) => {
        // Get conversation count
        const conversations = await ctx.db
          .query("conversations")
          .withIndex("by_toy", (q) => q.eq("toyId", toy._id))
          .collect();

        // Get last active time from conversations
        const lastActive = conversations.length > 0
          ? Math.max(...conversations.map(c => parseInt(c.startTime)))
          : new Date(toy.createdAt).getTime();

        // Count total messages
        let totalMessages = 0;
        for (const conv of conversations) {
          const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
            .collect();
          totalMessages += messages.length;
        }

        return {
          ...toy,
          conversationCount: conversations.length,
          messageCount: totalMessages,
          lastActiveAt: lastActive,
        };
      })
    );

    return toysWithStats;
  },
});


/**
 * Get all toys created by the current user
 */
export const getMyToys = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      return [];
    }

    const toys = await ctx.db
      .query("toys")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .collect();

    return toys;
  },
});

/**
 * Get toys managed as guardian (For Kids toys)
 */
export const getGuardianToys = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      return [];
    }

    const toys = await ctx.db
      .query("toys")
      .withIndex("by_guardian", (q) => q.eq("guardianId", user._id))
      .collect();

    return toys;
  },
});

/**
 * Get a specific toy by ID
 */
export const getToy = query({
  args: { toyId: v.id("toys") },
  handler: async (ctx, args) => {
    const toy = await ctx.db.get(args.toyId);
    
    if (!toy) {
      throw new Error("Toy not found");
    }

    // Check if user has access to this toy
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    if (toy.creatorId !== user._id && toy.guardianId !== user._id && !toy.isPublic) {
      throw new Error("Access denied");
    }

    return toy;
  },
});

/**
 * Update toy personality and settings
 */
export const updateToy = mutation({
  args: {
    toyId: v.id("toys"),
    name: v.optional(v.string()),
    personalityPrompt: v.optional(v.string()),
    personalityTraits: v.optional(v.object({
      traits: v.array(v.string()),
      speakingStyle: v.object({
        vocabulary: v.union(v.literal("simple"), v.literal("moderate"), v.literal("advanced")),
        sentenceLength: v.union(v.literal("short"), v.literal("medium"), v.literal("long")),
        usesSoundEffects: v.boolean(),
        catchPhrases: v.array(v.string()),
      }),
      interests: v.array(v.string()),
      favoriteTopics: v.array(v.string()),
      avoidTopics: v.array(v.string()),
      behavior: v.object({
        encouragesQuestions: v.boolean(),
        tellsStories: v.boolean(),
        playsGames: v.boolean(),
        educationalFocus: v.number(),
        imaginationLevel: v.number(),
      }),
    })),
    voiceId: v.optional(v.string()),
    safetyLevel: v.optional(v.union(v.literal("strict"), v.literal("moderate"), v.literal("relaxed"))),
    contentFilters: v.optional(v.object({
      enabledCategories: v.array(v.string()),
      customBlockedTopics: v.array(v.string()),
    })),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { toyId, ...updates } = args;
    
    // Get the toy and verify ownership
    const toy = await ctx.db.get(toyId);
    if (!toy) {
      throw new Error("Toy not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    if (toy.creatorId !== user._id && toy.guardianId !== user._id) {
      throw new Error("Only the creator or guardian can update this toy");
    }

    // Validate personality traits if provided
    if (updates.personalityTraits && updates.personalityTraits.traits.length > 3) {
      throw new Error("Maximum 3 personality traits allowed");
    }

    // Update the toy
    await ctx.db.patch(toyId, {
      ...updates,
      lastModifiedAt: new Date().toISOString(),
    });

    return toyId;
  },
});

/**
 * Change toy status (active, paused, archived)
 */
export const updateToyStatus = mutation({
  args: {
    toyId: v.id("toys"),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    const toy = await ctx.db.get(args.toyId);
    if (!toy) {
      throw new Error("Toy not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    if (toy.creatorId !== user._id && toy.guardianId !== user._id) {
      throw new Error("Only the creator or guardian can update toy status");
    }

    await ctx.db.patch(args.toyId, {
      status: args.status,
      lastModifiedAt: new Date().toISOString(),
    });

    return args.toyId;
  },
});

/**
 * Assign toy to a device
 */
export const assignToyToDevice = mutation({
  args: {
    toyId: v.id("toys"),
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const toy = await ctx.db.get(args.toyId);
    if (!toy) {
      throw new Error("Toy not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    if (toy.creatorId !== user._id && toy.guardianId !== user._id) {
      throw new Error("Only the creator or guardian can assign devices");
    }

    // Check if device already has this toy
    if (toy.assignedDevices.includes(args.deviceId)) {
      return args.toyId;
    }

    // Update toy's assigned devices
    await ctx.db.patch(args.toyId, {
      assignedDevices: [...toy.assignedDevices, args.deviceId],
      lastModifiedAt: new Date().toISOString(),
    });

    // Create assignment record
    await ctx.db.insert("toyAssignments", {
      toyId: args.toyId,
      deviceId: args.deviceId,
      childId: undefined,
      assignedAt: new Date().toISOString(),
      assignedBy: user._id,
      isActive: true,
    });

    return args.toyId;
  },
});

/**
 * Remove toy from device
 */
export const removeToyFromDevice = mutation({
  args: {
    toyId: v.id("toys"),
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const toy = await ctx.db.get(args.toyId);
    if (!toy) {
      throw new Error("Toy not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    if (toy.creatorId !== user._id && toy.guardianId !== user._id) {
      throw new Error("Only the creator or guardian can manage device assignments");
    }

    // Update toy's assigned devices
    await ctx.db.patch(args.toyId, {
      assignedDevices: toy.assignedDevices.filter(id => id !== args.deviceId),
      lastModifiedAt: new Date().toISOString(),
    });

    // Deactivate assignment record
    const assignment = await ctx.db
      .query("toyAssignments")
      .withIndex("by_toy", (q) => q.eq("toyId", args.toyId))
      .filter((q) => q.eq(q.field("deviceId"), args.deviceId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (assignment) {
      await ctx.db.patch(assignment._id, { isActive: false });
    }

    return args.toyId;
  },
});

/**
 * Duplicate a toy
 */
export const duplicateToy = mutation({
  args: {
    toyId: v.id("toys"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const originalToy = await ctx.db.get(args.toyId);
    if (!originalToy) {
      throw new Error("Toy not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    if (originalToy.creatorId !== user._id && !originalToy.isPublic) {
      throw new Error("Can only duplicate your own toys or public toys");
    }

    const now = new Date().toISOString();

    // Create a copy with new name
    const { _id, _creationTime, ...toyData } = originalToy;
    const newToyId = await ctx.db.insert("toys", {
      ...toyData,
      name: args.newName,
      creatorId: user._id,
      guardianId: originalToy.isForKids ? user._id : undefined,
      assignedDevices: [], // Start with no device assignments
      usageCount: 0,
      createdAt: now,
      lastActiveAt: now,
      lastModifiedAt: now,
    });

    return newToyId;
  },
});

/**
 * Delete a toy (soft delete by archiving)
 */
export const deleteToy = mutation({
  args: {
    toyId: v.id("toys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const toy = await ctx.db.get(args.toyId);
    if (!toy) throw new Error("Toy not found");

    // Get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    if (toy.creatorId !== user._id && toy.guardianId !== user._id) {
      throw new Error("Only the creator or guardian can delete this toy");
    }

    // Archive instead of hard delete
    await ctx.db.patch(args.toyId, {
      status: "archived",
      lastModifiedAt: new Date().toISOString(),
    });

    return args.toyId;
  },
});
