import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const createChild = mutation({
  args: {
    name: v.string(),
    birthDate: v.string(),
    voiceProfile: v.optional(v.string()),
    avatar: v.optional(v.string()),
    settings: v.object({
      contentLevel: v.union(v.literal("toddler"), v.literal("preschool"), v.literal("elementary")),
      safetyLevel: v.union(v.literal("strict"), v.literal("moderate"), v.literal("relaxed")),
      allowedTopics: v.array(v.string()),
      blockedWords: v.array(v.string()),
      dailyTimeLimit: v.optional(v.number()),
      bedtimeRestrictions: v.optional(v.object({
        startTime: v.string(),
        endTime: v.string(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    // TODO: Get authenticated user ID from BetterAuth session
    // For now, we'll require a parentId to be passed
    const parentId = "users:placeholder" as Id<"users">;
    
    const childId = await ctx.db.insert("children", {
      parentId,
      name: args.name,
      birthDate: args.birthDate,
      voiceProfile: args.voiceProfile,
      avatar: args.avatar,
      settings: args.settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return childId;
  },
});

export const listChildren = query({
  args: {},
  handler: async (ctx) => {
    // TODO: Get authenticated user ID from BetterAuth session
    // For now, return empty array
    return [];
  },
});

export const getChild = query({
  args: { id: v.id("children") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateChild = mutation({
  args: {
    id: v.id("children"),
    name: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    voiceProfile: v.optional(v.string()),
    avatar: v.optional(v.string()),
    settings: v.optional(v.object({
      contentLevel: v.union(v.literal("toddler"), v.literal("preschool"), v.literal("elementary")),
      safetyLevel: v.union(v.literal("strict"), v.literal("moderate"), v.literal("relaxed")),
      allowedTopics: v.array(v.string()),
      blockedWords: v.array(v.string()),
      dailyTimeLimit: v.optional(v.number()),
      bedtimeRestrictions: v.optional(v.object({
        startTime: v.string(),
        endTime: v.string(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return id;
  },
});

// Guardian Controls: Save per-child safety settings used by SafetyControls UI
export const updateGuardianControls = mutation({
  args: {
    childId: v.id("children"),
    controls: v.object({
      contentFilters: v.object({
        strictnessLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        blockedTopics: v.array(v.string()),
        allowedTopics: v.array(v.string()),
      }),
      timeControls: v.object({
        dailyLimit: v.number(),
        timeRestrictions: v.array(v.object({
          dayType: v.union(v.literal("weekday"), v.literal("weekend")),
          startTime: v.string(),
          endTime: v.string(),
        })),
        schoolDayRules: v.boolean(),
        weekendRules: v.boolean(),
      }),
      notifications: v.object({
        realTimeAlerts: v.boolean(),
        dailySummary: v.boolean(),
        weeklyReport: v.boolean(),
        severityThreshold: v.union(v.literal("all"), v.literal("medium"), v.literal("high")),
      }),
    }),
  },
  handler: async (ctx, { childId, controls }) => {
    const child = await ctx.db.get(childId);
    if (!child) throw new Error("Child not found");

    // TODO: Enforce auth: only the child's parent (guardian) may update. For now, skip strict auth to unblock UI.
    await ctx.db.patch(childId, {
      guardianControls: controls as any,
      updatedAt: new Date().toISOString(),
    });
    return { childId, saved: true };
  },
});

export const getGuardianControls = query({
  args: { childId: v.id("children") },
  handler: async (ctx, { childId }) => {
    const child = await ctx.db.get(childId);
    if (!child) return null;
    // May be undefined if not set yet
    return (child as any).guardianControls || null;
  },
});
