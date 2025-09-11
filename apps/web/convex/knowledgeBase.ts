import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Create or update knowledge base for a toy
 */
export const upsertKnowledgeBase = mutation({
  args: {
    toyId: v.id("toys"),
    toyBackstory: v.object({
      origin: v.string(),
      personality: v.string(),
      specialAbilities: v.array(v.string()),
      favoriteThings: v.array(v.string()),
    }),
    familyInfo: v.optional(v.object({
      members: v.array(v.object({
        name: v.string(),
        relationship: v.string(),
        facts: v.array(v.string()),
      })),
      pets: v.array(v.object({
        name: v.string(),
        type: v.string(),
        facts: v.array(v.string()),
      })),
      importantDates: v.array(v.object({
        date: v.string(),
        event: v.string(),
      })),
    })),
    customFacts: v.array(v.object({
      category: v.string(),
      fact: v.string(),
      importance: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    })),
  },
  handler: async (ctx, args) => {
    // Verify toy ownership
    const toy = await ctx.db.get(args.toyId);
    if (!toy) {
      throw new Error("Toy not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject as any;
    if (toy.creatorId !== userId && toy.guardianId !== userId) {
      throw new Error("Only the toy owner can update its knowledge base");
    }

    // Check if knowledge base already exists
    const existingKb = await ctx.db
      .query("knowledgeBases")
      .withIndex("by_toy", (q) => q.eq("toyId", args.toyId))
      .first();

    const now = new Date().toISOString();

    let kbId: Id<"knowledgeBases">;

    if (existingKb) {
      // Update existing knowledge base
      await ctx.db.patch(existingKb._id, {
        toyBackstory: args.toyBackstory,
        familyInfo: args.familyInfo,
        customFacts: args.customFacts,
        updatedAt: now,
      });

      // Update toy's knowledge base reference
      if (!toy.knowledgeBaseId) {
        await ctx.db.patch(args.toyId, {
          knowledgeBaseId: existingKb._id,
          lastModifiedAt: now,
        });
      }

      kbId = existingKb._id;
    } else {
      // Create new knowledge base
      kbId = await ctx.db.insert("knowledgeBases", {
        toyId: args.toyId,
        toyBackstory: args.toyBackstory,
        familyInfo: args.familyInfo,
        customFacts: args.customFacts,
        memories: [],
        vectorStoreId: undefined,
        createdAt: now,
        updatedAt: now,
      });

      // Update toy with knowledge base reference
      await ctx.db.patch(args.toyId, {
        knowledgeBaseId: kbId,
        lastModifiedAt: now,
      });
    }

    // --- Ingest knowledge into the Agent thread for RAG ---
    // Ensure the toy has a canonical agent thread
    const thread = await ctx.runMutation(api.agents.getOrCreateToyThread, {
      toyId: args.toyId,
      userId: toy.creatorId,
    });
    const threadId = thread.threadId;

    // Helper to enqueue a knowledge message
    const save = async (content: string, type: string, importance?: number, tags?: string[]) => {
      const trimmed = content?.trim();
      if (!trimmed) return;
      await ctx.runMutation(api.agents.saveKnowledgeMessage, {
        threadId,
        content: trimmed,
        metadata: {
          type,
          isKnowledge: true,
          source: "knowledgeBase",
          importance,
          tags,
        },
      });
    };

    // Chunking helpers
    const chunkText = (text: string, max = 500): string[] => {
      if (!text) return [];
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const chunks: string[] = [];
      let current = "";
      for (const s of sentences) {
        if ((current + s).length > max && current) {
          chunks.push(current.trim());
          current = s;
        } else {
          current += (current ? " " : "") + s;
        }
      }
      if (current) chunks.push(current.trim());
      if (chunks.length === 0 && text.length > 0) {
        for (let i = 0; i < text.length; i += max) chunks.push(text.slice(i, i + max));
      }
      return chunks;
    };

    // Backstory/personality
    const back = args.toyBackstory;
    const backstoryParts: string[] = [];
    if (back.origin) backstoryParts.push(`Origin: ${back.origin}`);
    if (back.personality) backstoryParts.push(`Personality: ${back.personality}`);
    if (back.specialAbilities?.length) backstoryParts.push(`Special Abilities: ${back.specialAbilities.join(", ")}`);
    if (back.favoriteThings?.length) backstoryParts.push(`Favorite Things: ${back.favoriteThings.join(", ")}`);
    const backstoryText = backstoryParts.join("\n");
    for (const chunk of chunkText(backstoryText)) {
      await save(chunk, "backstory", 0.8, ["backstory"]);
    }

    // Family info
    if (args.familyInfo) {
      const fam = args.familyInfo;
      for (const m of fam.members ?? []) {
        const line = `Family Member: ${m.name} (${m.relationship}) — Facts: ${m.facts.join(", ")}`;
        for (const chunk of chunkText(line)) await save(chunk, "relationships", 0.7, ["family", "relationships"]);
      }
      for (const p of fam.pets ?? []) {
        const line = `Pet: ${p.name} (${p.type}) — Facts: ${p.facts.join(", ")}`;
        for (const chunk of chunkText(line)) await save(chunk, "relationships", 0.6, ["pets", "relationships"]);
      }
      for (const d of fam.importantDates ?? []) {
        const line = `Important Date: ${d.date} — ${d.event}`;
        for (const chunk of chunkText(line)) await save(chunk, "memories", 0.5, ["dates"]);
      }
    }

    // Custom facts
    for (const f of args.customFacts ?? []) {
      const line = `Fact [${f.category}] (${f.importance}): ${f.fact}`;
      const imp = f.importance === "high" ? 1.0 : f.importance === "medium" ? 0.7 : 0.5;
      for (const chunk of chunkText(line)) await save(chunk, "facts", imp, ["facts", f.category]);
    }

    return kbId;
  },
});

/**
 * Get knowledge base for a toy
 */
export const getKnowledgeBase = query({
  args: { toyId: v.id("toys") },
  handler: async (ctx, args) => {
    // Verify toy access
    const toy = await ctx.db.get(args.toyId);
    if (!toy) {
      throw new Error("Toy not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject as any;
    if (toy.creatorId !== userId && toy.guardianId !== userId && !toy.isPublic) {
      throw new Error("Access denied");
    }

    const knowledgeBase = await ctx.db
      .query("knowledgeBases")
      .withIndex("by_toy", (q) => q.eq("toyId", args.toyId))
      .first();

    return knowledgeBase;
  },
});

/**
 * Add a memory to the knowledge base
 */
export const addMemory = mutation({
  args: {
    toyId: v.id("toys"),
    memory: v.object({
      description: v.string(),
      date: v.string(),
      participants: v.array(v.string()),
      autoGenerated: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    // Verify toy ownership
    const toy = await ctx.db.get(args.toyId);
    if (!toy) {
      throw new Error("Toy not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject as any;
    
    // For auto-generated memories from conversations, allow toy to add
    // For manual memories, only owner/guardian can add
    if (!args.memory.autoGenerated && 
        toy.creatorId !== userId && 
        toy.guardianId !== userId) {
      throw new Error("Only the toy owner can add memories");
    }

    const knowledgeBase = await ctx.db
      .query("knowledgeBases")
      .withIndex("by_toy", (q) => q.eq("toyId", args.toyId))
      .first();

    if (!knowledgeBase) {
      throw new Error("Knowledge base not found. Please create one first.");
    }

    // Generate unique memory ID
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add memory to the array
    const updatedMemories = [
      ...knowledgeBase.memories,
      {
        id: memoryId,
        ...args.memory,
      },
    ];

    await ctx.db.patch(knowledgeBase._id, {
      memories: updatedMemories,
      updatedAt: new Date().toISOString(),
    });

    return memoryId;
  },
});

/**
 * Remove a memory from the knowledge base
 */
export const removeMemory = mutation({
  args: {
    toyId: v.id("toys"),
    memoryId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify toy ownership
    const toy = await ctx.db.get(args.toyId);
    if (!toy) {
      throw new Error("Toy not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject as any;
    if (toy.creatorId !== userId && toy.guardianId !== userId) {
      throw new Error("Only the toy owner can remove memories");
    }

    const knowledgeBase = await ctx.db
      .query("knowledgeBases")
      .withIndex("by_toy", (q) => q.eq("toyId", args.toyId))
      .first();

    if (!knowledgeBase) {
      throw new Error("Knowledge base not found");
    }

    // Filter out the memory
    const updatedMemories = knowledgeBase.memories.filter(
      (mem) => mem.id !== args.memoryId
    );

    await ctx.db.patch(knowledgeBase._id, {
      memories: updatedMemories,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

/**
 * Add custom facts to knowledge base
 */
export const addCustomFacts = mutation({
  args: {
    toyId: v.id("toys"),
    facts: v.array(v.object({
      category: v.string(),
      fact: v.string(),
      importance: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    })),
  },
  handler: async (ctx, args) => {
    // Verify toy ownership
    const toy = await ctx.db.get(args.toyId);
    if (!toy) {
      throw new Error("Toy not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject as any;
    if (toy.creatorId !== userId && toy.guardianId !== userId) {
      throw new Error("Only the toy owner can add facts");
    }

    const knowledgeBase = await ctx.db
      .query("knowledgeBases")
      .withIndex("by_toy", (q) => q.eq("toyId", args.toyId))
      .first();

    if (!knowledgeBase) {
      throw new Error("Knowledge base not found. Please create one first.");
    }

    // Append new facts to existing ones
    const updatedFacts = [...knowledgeBase.customFacts, ...args.facts];

    await ctx.db.patch(knowledgeBase._id, {
      customFacts: updatedFacts,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

/**
 * Update family information
 */
export const updateFamilyInfo = mutation({
  args: {
    toyId: v.id("toys"),
    familyInfo: v.object({
      members: v.array(v.object({
        name: v.string(),
        relationship: v.string(),
        facts: v.array(v.string()),
      })),
      pets: v.array(v.object({
        name: v.string(),
        type: v.string(),
        facts: v.array(v.string()),
      })),
      importantDates: v.array(v.object({
        date: v.string(),
        event: v.string(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    // Verify toy ownership
    const toy = await ctx.db.get(args.toyId);
    if (!toy) {
      throw new Error("Toy not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject as any;
    if (toy.creatorId !== userId && toy.guardianId !== userId) {
      throw new Error("Only the toy owner can update family info");
    }

    const knowledgeBase = await ctx.db
      .query("knowledgeBases")
      .withIndex("by_toy", (q) => q.eq("toyId", args.toyId))
      .first();

    if (!knowledgeBase) {
      throw new Error("Knowledge base not found. Please create one first.");
    }

    await ctx.db.patch(knowledgeBase._id, {
      familyInfo: args.familyInfo,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

/**
 * Search memories by keyword
 */
export const searchMemories = query({
  args: {
    toyId: v.id("toys"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify toy access
    const toy = await ctx.db.get(args.toyId);
    if (!toy) {
      throw new Error("Toy not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject as any;
    if (toy.creatorId !== userId && toy.guardianId !== userId && !toy.isPublic) {
      throw new Error("Access denied");
    }

    const knowledgeBase = await ctx.db
      .query("knowledgeBases")
      .withIndex("by_toy", (q) => q.eq("toyId", args.toyId))
      .first();

    if (!knowledgeBase) {
      return [];
    }

    const searchLower = args.searchTerm.toLowerCase();

    // Search through memories
    const matchingMemories = knowledgeBase.memories.filter(mem =>
      mem.description.toLowerCase().includes(searchLower) ||
      mem.participants.some(p => p.toLowerCase().includes(searchLower))
    );

    return matchingMemories;
  },
});
