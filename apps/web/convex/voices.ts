import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { betterAuthComponent } from "./auth";

/**
 * Get all public voices available in the library
 */
export const getPublicVoices = query({
  args: {
    language: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("neutral"))),
    ageGroup: v.optional(v.string()),
    isPremium: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let voicesQuery = ctx.db
      .query("voices")
      .withIndex("is_public", (q) => q.eq("isPublic", true));

    const voices = await voicesQuery.collect();

    // Apply filters
    let filteredVoices = voices;

    if (args.language) {
      filteredVoices = filteredVoices.filter(v => v.language === args.language);
    }

    if (args.gender) {
      filteredVoices = filteredVoices.filter(v => v.gender === args.gender);
    }

    if (args.ageGroup) {
      filteredVoices = filteredVoices.filter(v => v.ageGroup === args.ageGroup);
    }

    if (args.isPremium !== undefined) {
      filteredVoices = filteredVoices.filter(v => v.isPremium === args.isPremium);
    }

    // Sort by usage count (popular first)
    return filteredVoices.sort((a, b) => b.usageCount - a.usageCount);
  },
});

/**
 * Get user's custom uploaded voices
 */
export const getMyVoices = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get authenticated user ID from BetterAuth
    const userId = await betterAuthComponent.getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const voices = await ctx.db
      .query("voices")
      .withIndex("by_uploader", (q) => q.eq("uploadedBy", userId as any))
      .collect();

    return voices;
  },
});

/**
 * Get a specific voice by ID
 */
export const getVoice = query({
  args: { voiceId: v.id("voices") },
  handler: async (ctx, args) => {
    const voice = await ctx.db.get(args.voiceId);
    
    if (!voice) {
      throw new Error("Voice not found");
    }

    // Check access permissions
    if (!voice.isPublic) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Access denied");
      }
      
      const userId = await betterAuthComponent.getAuthUserId(ctx);
      if (!userId || voice.uploadedBy !== userId) {
        throw new Error("Access denied");
      }
    }

    return voice;
  },
});

/**
 * Create a custom voice entry (after voice cloning is complete)
 */
export const createCustomVoice = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    language: v.string(),
    accent: v.optional(v.string()),
    ageGroup: v.string(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("neutral")),
    previewUrl: v.string(),
    externalVoiceId: v.string(), // Voice ID from 11Labs or other provider
    tags: v.array(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get authenticated user ID from BetterAuth
    const userId = await betterAuthComponent.getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const voiceId = await ctx.db.insert("voices", {
      name: args.name,
      description: args.description,
      language: args.language,
      accent: args.accent,
      ageGroup: args.ageGroup,
      gender: args.gender,
      previewUrl: args.previewUrl,
      provider: "custom",
      externalVoiceId: args.externalVoiceId,
      tags: args.tags,
      isPremium: false,
      isPublic: args.isPublic,
      uploadedBy: userId as any,
      usageCount: 0,
      averageRating: 0,
      createdAt: new Date().toISOString(),
    });

    return voiceId;
  },
});

/**
 * Update voice metadata
 */
export const updateVoice = mutation({
  args: {
    voiceId: v.id("voices"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { voiceId, ...updates } = args;
    
    const voice = await ctx.db.get(voiceId);
    if (!voice) {
      throw new Error("Voice not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get authenticated user ID from BetterAuth
    const userId = await betterAuthComponent.getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Only the uploader can update their voice
    if (voice.uploadedBy !== userId) {
      throw new Error("Only the voice owner can update it");
    }

    await ctx.db.patch(voiceId, updates);

    return voiceId;
  },
});

/**
 * Delete a custom voice
 */
export const deleteVoice = mutation({
  args: {
    voiceId: v.id("voices"),
  },
  handler: async (ctx, args) => {
    const voice = await ctx.db.get(args.voiceId);
    if (!voice) {
      throw new Error("Voice not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get authenticated user ID from BetterAuth
    const userId = await betterAuthComponent.getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Only the uploader can delete their voice
    if (voice.uploadedBy !== userId) {
      throw new Error("Only the voice owner can delete it");
    }

    // Check if any toys are using this voice
    const toysUsingVoice = await ctx.db
      .query("toys")
      .filter((q) => q.eq(q.field("voiceId"), voice.externalVoiceId))
      .collect();

    if (toysUsingVoice.length > 0) {
      throw new Error(`Cannot delete voice: ${toysUsingVoice.length} toys are using it`);
    }

    await ctx.db.delete(args.voiceId);

    return { success: true };
  },
});

/**
 * Increment voice usage count
 */
export const incrementVoiceUsage = mutation({
  args: {
    voiceId: v.id("voices"),
  },
  handler: async (ctx, args) => {
    const voice = await ctx.db.get(args.voiceId);
    if (!voice) {
      throw new Error("Voice not found");
    }

    await ctx.db.patch(args.voiceId, {
      usageCount: voice.usageCount + 1,
    });

    return args.voiceId;
  },
});

/**
 * Get popular voices for kids
 */
export const getKidsFriendlyVoices = query({
  args: {
    language: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("neutral"))),
    ageGroup: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const voices = await ctx.db
      .query("voices")
      .withIndex("is_public", (q) => q.eq("isPublic", true))
      .collect();

    // Filter for kid-friendly voices
    let kidsFriendlyVoices = voices.filter(v => 
      v.tags.includes("kids-friendly") || 
      v.tags.includes("child-safe") ||
      v.tags.includes("kids") ||
      v.ageGroup === "child" ||
      v.ageGroup === "kids" ||
      v.ageGroup === "teen"
    );

    // If no kid-friendly voices found, return all public voices as fallback
    if (kidsFriendlyVoices.length === 0) {
      kidsFriendlyVoices = voices;
    }

    // Apply additional filters if provided
    if (args.language) {
      kidsFriendlyVoices = kidsFriendlyVoices.filter(v => v.language === args.language);
    }

    if (args.gender) {
      kidsFriendlyVoices = kidsFriendlyVoices.filter(v => v.gender === args.gender);
    }

    if (args.ageGroup) {
      kidsFriendlyVoices = kidsFriendlyVoices.filter(v => v.ageGroup === args.ageGroup);
    }

    // Sort by usage count
    return kidsFriendlyVoices.sort((a, b) => b.usageCount - a.usageCount);
  },
});

/**
 * Search voices by name or tags
 */
export const searchVoices = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const searchLower = args.searchTerm.toLowerCase();
    
    const voices = await ctx.db
      .query("voices")
      .withIndex("is_public", (q) => q.eq("isPublic", true))
      .collect();

    // Filter by search term in name, description, or tags
    const matchingVoices = voices.filter(v => 
      v.name.toLowerCase().includes(searchLower) ||
      v.description.toLowerCase().includes(searchLower) ||
      v.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );

    return matchingVoices;
  },
});

/**
 * Lookup a voice by its provider's external voice ID
 */
export const getByExternalVoiceId = query({
  args: { externalVoiceId: v.string() },
  handler: async (ctx, args) => {
    const match = await ctx.db
      .query("voices")
      .withIndex("by_external", (q) => q.eq("externalVoiceId", args.externalVoiceId))
      .first();
    return match ?? null;
  },
});

/**
 * Upsert a provider-backed voice (e.g., ElevenLabs) into the voices table
 */
export const upsertProviderVoice = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    language: v.string(),
    accent: v.optional(v.string()),
    ageGroup: v.string(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("neutral")),
    previewUrl: v.string(),
    provider: v.union(v.literal("11labs"), v.literal("azure"), v.literal("custom")),
    externalVoiceId: v.string(),
    tags: v.array(v.string()),
    isPremium: v.optional(v.boolean()),
    isPublic: v.boolean(),
    uploadedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("voices")
      .withIndex("by_external", (q) => q.eq("externalVoiceId", args.externalVoiceId))
      .first();

    if (existing) {
      const doc = existing;
      await ctx.db.patch(doc._id, {
        name: args.name,
        description: args.description,
        language: args.language,
        accent: args.accent,
        ageGroup: args.ageGroup,
        gender: args.gender,
        previewUrl: args.previewUrl,
        provider: args.provider,
        tags: args.tags,
        isPremium: args.isPremium ?? doc.isPremium,
        isPublic: args.isPublic,
        ...(args.uploadedBy ? { uploadedBy: args.uploadedBy } : {}),
      });
      return doc._id;
    }

    const insertedId = await ctx.db.insert("voices", {
      name: args.name,
      description: args.description,
      language: args.language,
      accent: args.accent,
      ageGroup: args.ageGroup,
      gender: args.gender,
      previewUrl: args.previewUrl,
      provider: args.provider,
      externalVoiceId: args.externalVoiceId,
      tags: args.tags,
      isPremium: args.isPremium ?? false,
      isPublic: args.isPublic,
      uploadedBy: args.uploadedBy,
      usageCount: 0,
      averageRating: 0,
      createdAt: new Date().toISOString(),
    } as any);
    return insertedId;
  },
});
