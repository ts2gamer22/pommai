import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * getActiveAlerts
 * Fetch recent flagged messages within the last 24 hours. Optionally filter by childId or toyId.
 * Returns minimal alert info consumed by the Guardian Dashboard.
 */
export const getActiveAlerts = query({
  args: {
    childId: v.optional(v.id("children")),
    toyId: v.optional(v.id("toys")),
    includeResolved: v.optional(v.boolean()),
    hours: v.optional(v.number()),
  },
  handler: async (ctx, { childId, toyId, includeResolved, hours }) => {
    const identity = await ctx.auth.getUserIdentity();
    // Allow empty list for unauthenticated to be safe
    if (!identity) return [];

    const sinceMs = Date.now() - (hours ? hours : 24) * 60 * 60 * 1000;
    const sinceIso = new Date(sinceMs).toISOString();

    // Query recent messages by timestamp index
    const recentMessages = await ctx.db
      .query("messages")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", sinceIso))
      .order("desc")
      .collect();

    const flagged = recentMessages.filter((m) => m.metadata?.flagged);

    const results = await Promise.all(
      flagged.map(async (msg) => {
        const conv = await ctx.db.get(msg.conversationId);
        if (!conv) return null;

        // Derive childId: conversation.childId if set; otherwise, try toyAssignments
        let derivedChildId: Id<"children"> | undefined = conv.childId as any;
        if (!derivedChildId) {
          const assignments = await ctx.db
            .query("toyAssignments")
            .withIndex("by_toy", (q) => q.eq("toyId", conv.toyId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
          const found = assignments.find((a) => a.childId);
          if (found && found.childId) derivedChildId = found.childId as any;
        }

        // Optional filtering
        if (childId && derivedChildId !== childId) return null;
        if (toyId && conv.toyId !== toyId) return null;

        // Severity from moderationLogs if available, else default to "low"
        const mod = await ctx.db
          .query("moderationLogs")
          .withIndex("messageId", (q) => q.eq("messageId", msg._id))
          .first();
        const severity = (mod?.severity as any) || "low"; // "low" | "medium" | "high"

        const resolved = !!msg.metadata?.resolved;
        if (!includeResolved && resolved) return null;

        // Normalize timestamp to number (ms) for frontend ease
        const tStr = msg.timestamp;
        const ts = typeof tStr === "string" ? Date.parse(tStr) || parseInt(tStr) || Date.now() : Date.now();

        return {
          messageId: msg._id,
          content: msg.content,
          severity,
          resolved,
          timestamp: ts,
          toyId: conv.toyId,
          childId: derivedChildId,
        };
      })
    );

    return results.filter((r) => r !== null);
  },
});

/**
 * resolveAlert
 * Marks a message's metadata.resolved = true.
 */
export const resolveAlert = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const msg = await ctx.db.get(messageId);
    if (!msg) throw new Error("Message not found");

    await ctx.db.patch(messageId, {
      metadata: {
        ...(msg.metadata || {}),
        resolved: true,
      },
    });

    // Optionally, record in moderation logs that it was resolved
    await ctx.db.insert("moderationLogs", {
      messageId,
      flagType: "resolved",
      severity: "low",
      details: "Alert resolved by guardian",
      action: "resolved",
      timestamp: Date.now().toString(),
    });

    return { messageId, resolved: true };
  },
});