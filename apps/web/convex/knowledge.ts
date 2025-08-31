import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Knowledge Base Management for Toy RAG System
 * Uses Convex Agent's built-in vector search and embeddings
 */

// Add knowledge to a toy's context
export const addToyKnowledge = mutation({
  args: {
    toyId: v.id("toys"),
    content: v.string(),
    type: v.union(
      v.literal("backstory"),
      v.literal("personality"),
      v.literal("facts"),
      v.literal("memories"),
      v.literal("rules"),
      v.literal("preferences"),
      v.literal("relationships")
    ),
    metadata: v.optional(v.object({
      source: v.string(),
      importance: v.number(), // 0-1 scale
      tags: v.array(v.string()),
      expiresAt: v.optional(v.number()), // For temporary knowledge
    })),
  },
  handler: async (ctx, args) => {
    // Get the toy to verify it exists
    const toy = await ctx.db.get(args.toyId);
    if (!toy) {
      throw new Error("Toy not found");
    }

    // Get or create thread for this toy
    const thread = await ctx.runQuery(api.agents.getThreadByToyId, {
      toyId: args.toyId,
    });
    
    if (thread && thread !== null) {
      // Save as a knowledge message in the Agent's system
      // This will be automatically indexed for vector search
      await ctx.runMutation(api.agents.saveKnowledgeMessage, {
        threadId: (thread as any).threadId,
        content: formatKnowledgeContent(args.type, args.content),
        metadata: {
          type: args.type,
          isKnowledge: true,
          ...args.metadata,
        },
      });
    } else {
      // Create a new thread if none exists
      const newThread = await ctx.runMutation(api.agents.createToyThread, {
        toyId: args.toyId,
      });
      
      // Save knowledge to the new thread
      await ctx.runMutation(api.agents.saveKnowledgeMessage, {
        threadId: newThread.threadId,
        content: formatKnowledgeContent(args.type, args.content),
        metadata: {
          type: args.type,
          isKnowledge: true,
          ...args.metadata,
        },
      });
    }
    
    // Also store in a dedicated knowledge table for management
    return await ctx.db.insert("toyKnowledge", {
      toyId: args.toyId,
      content: args.content,
      type: args.type,
      metadata: args.metadata || {
        source: "manual",
        importance: 0.5,
        tags: [],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Bulk import knowledge for a toy
export const importToyKnowledge = action({
  args: {
    toyId: v.id("toys"),
    documents: v.array(v.object({
      content: v.string(),
      type: v.union(
        v.literal("backstory"),
        v.literal("personality"),
        v.literal("facts"),
        v.literal("memories"),
        v.literal("rules"),
        v.literal("preferences"),
        v.literal("relationships")
      ),
      source: v.string(),
    })),
    chunkSize: v.optional(v.number()), // Default 500 characters
  },
  handler: async (ctx, args) => {
    const chunkSize = args.chunkSize || 500;
    let totalChunks = 0;
    let successfulChunks = 0;
    const errors: string[] = [];
    
    // Process each document
    for (const doc of args.documents) {
      try {
        // Smart chunking based on content
        const chunks = chunkContent(doc.content, chunkSize);
        totalChunks += chunks.length;
        
        for (const [index, chunk] of chunks.entries()) {
          try {
            await ctx.runMutation(api.knowledge.addToyKnowledge, {
              toyId: args.toyId,
              content: chunk,
              type: doc.type,
              metadata: {
                source: doc.source,
                importance: calculateImportance(doc.type),
                tags: extractTags(chunk, doc.type),
              },
            });
            successfulChunks++;
          } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            errors.push(`Failed to add chunk ${index + 1} of ${doc.source}: ${errMsg}`);
          }
        }
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to process document ${doc.source}: ${errMsg}`);
      }
    }
    
    return { 
      success: errors.length === 0,
      totalChunks,
      successfulChunks,
      errors,
    };
  },
});

// Query toy knowledge
export const getToyKnowledge = query({
  args: {
    toyId: v.id("toys"),
    type: v.optional(v.union(
      v.literal("backstory"),
      v.literal("personality"),
      v.literal("facts"),
      v.literal("memories"),
      v.literal("rules"),
      v.literal("preferences"),
      v.literal("relationships")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("toyKnowledge")
      .filter((q) => q.eq(q.field("toyId"), args.toyId));
    
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }
    
    const results = await query
      .order("desc")
      .take(args.limit || 100);
    
    return results;
  },
});

// Search toy knowledge using text similarity (leverages Agent's vector search)
export const searchToyKnowledge = action({
  args: {
    toyId: v.id("toys"),
    query: v.string(),
    limit: v.optional(v.number()),
    minRelevance: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    // Get the thread for this toy
    const thread = await ctx.runQuery(api.agents.getThreadByToyId, {
      toyId: args.toyId,
    });
    
    if (!thread) {
      return [];
    }
    
    // The Agent's built-in RAG will automatically search through
    // all messages in the thread, including our knowledge messages
    // This happens when we generate responses, but we can also
    // query directly from the toyKnowledge table
    
    const knowledge: any[] = await ctx.runQuery(api.knowledge.getToyKnowledge, {
      toyId: args.toyId,
      limit: args.limit || 10,
    });
    
    // Filter by relevance if needed (simple text matching for now)
    // In production, this would use the Agent's vector search
    const queryLower = args.query.toLowerCase();
    const minRelevance = args.minRelevance || 0.3;
    
    const relevant: any[] = knowledge
      .map((item: any) => ({
        ...item,
        relevance: calculateRelevance(item.content, queryLower),
      }))
      .filter((item: any) => item.relevance >= minRelevance)
      .sort((a: any, b: any) => b.relevance - a.relevance)
      .slice(0, args.limit || 10);
    
    return relevant;
  },
});

// Update toy knowledge
export const updateToyKnowledge = mutation({
  args: {
    knowledgeId: v.id("toyKnowledge"),
    content: v.optional(v.string()),
    metadata: v.optional(v.object({
      source: v.string(),
      importance: v.number(),
      tags: v.array(v.string()),
      expiresAt: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const knowledge = await ctx.db.get(args.knowledgeId);
    if (!knowledge) {
      throw new Error("Knowledge not found");
    }
    
    const updates: any = {
      updatedAt: Date.now(),
    };
    
    if (args.content !== undefined) {
      updates.content = args.content;
    }
    
    if (args.metadata !== undefined) {
      updates.metadata = {
        ...knowledge.metadata,
        ...args.metadata,
      };
    }
    
    return await ctx.db.patch(args.knowledgeId, updates);
  },
});

// Delete toy knowledge
export const deleteToyKnowledge = mutation({
  args: {
    knowledgeId: v.id("toyKnowledge"),
  },
  handler: async (ctx, args) => {
    const knowledge = await ctx.db.get(args.knowledgeId);
    if (!knowledge) {
      throw new Error("Knowledge not found");
    }
    
    await ctx.db.delete(args.knowledgeId);
    return { success: true };
  },
});

// Clear all knowledge for a toy (use with caution)
export const clearToyKnowledge = mutation({
  args: {
    toyId: v.id("toys"),
    type: v.optional(v.union(
      v.literal("backstory"),
      v.literal("personality"),
      v.literal("facts"),
      v.literal("memories"),
      v.literal("rules"),
      v.literal("preferences"),
      v.literal("relationships")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("toyKnowledge")
      .filter((q) => q.eq(q.field("toyId"), args.toyId));
    
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }
    
    const items = await query.collect();
    
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    
    return { 
      success: true, 
      deletedCount: items.length 
    };
  },
});

// Get knowledge statistics for a toy
export const getToyKnowledgeStats = query({
  args: {
    toyId: v.id("toys"),
  },
  handler: async (ctx, args) => {
    const knowledge = await ctx.db
      .query("toyKnowledge")
      .filter((q) => q.eq(q.field("toyId"), args.toyId))
      .collect();
    
    const stats = {
      total: knowledge.length,
      byType: {} as Record<string, number>,
      avgImportance: 0,
      totalCharacters: 0,
      oldestEntry: null as Date | null,
      newestEntry: null as Date | null,
      topTags: [] as Array<{ tag: string; count: number }>,
    };
    
    const tagCounts: Record<string, number> = {};
    let totalImportance = 0;
    
    for (const item of knowledge) {
      // Count by type
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
      
      // Sum importance
      totalImportance += item.metadata?.importance || 0.5;
      
      // Count characters
      stats.totalCharacters += item.content.length;
      
      // Track dates
      const date = new Date(item.createdAt);
      if (!stats.oldestEntry || date < stats.oldestEntry) {
        stats.oldestEntry = date;
      }
      if (!stats.newestEntry || date > stats.newestEntry) {
        stats.newestEntry = date;
      }
      
      // Count tags
      if (item.metadata?.tags) {
        for (const tag of item.metadata.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }
    
    // Calculate average importance
    if (knowledge.length > 0) {
      stats.avgImportance = totalImportance / knowledge.length;
    }
    
    // Get top tags
    stats.topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return stats;
  },
});

// Helper functions

function chunkContent(content: string, maxLength: number): string[] {
  // Smart chunking that preserves context
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  // If no sentences found, fall back to simple chunking
  if (chunks.length === 0 && content.length > 0) {
    for (let i = 0; i < content.length; i += maxLength) {
      chunks.push(content.slice(i, i + maxLength));
    }
  }
  
  return chunks;
}

function extractTags(content: string, type: string): string[] {
  const tags: string[] = [type];
  const contentLower = content.toLowerCase();
  
  // Common theme detection
  const themes: Record<string, string[]> = {
    friendship: ["friend", "buddy", "pal", "companion"],
    education: ["learn", "teach", "study", "knowledge", "school"],
    games: ["play", "game", "fun", "activity", "puzzle"],
    storytelling: ["story", "tale", "adventure", "journey"],
    emotions: ["happy", "sad", "excited", "angry", "scared"],
    family: ["mom", "dad", "brother", "sister", "family"],
    nature: ["tree", "flower", "animal", "forest", "ocean"],
    science: ["science", "experiment", "discover", "explore"],
    creativity: ["create", "imagine", "build", "draw", "paint"],
    music: ["song", "music", "sing", "dance", "rhythm"],
  };
  
  for (const [theme, keywords] of Object.entries(themes)) {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      tags.push(theme);
    }
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

function calculateImportance(type: string): number {
  // Assign default importance based on type
  const importanceMap: Record<string, number> = {
    rules: 1.0,        // Most important - safety and behavior rules
    backstory: 0.8,    // Core personality definition
    personality: 0.8,  // Core traits
    relationships: 0.7, // Important context
    preferences: 0.6,   // User preferences
    facts: 0.5,        // General knowledge
    memories: 0.4,     // Past interactions
  };
  
  return importanceMap[type] || 0.5;
}

function formatKnowledgeContent(type: string, content: string): string {
  // Format content based on type for better Agent understanding
  const prefixes: Record<string, string> = {
    backstory: "Background Information: ",
    personality: "Personality Trait: ",
    facts: "Fact: ",
    memories: "Memory: ",
    rules: "Important Rule: ",
    preferences: "Preference: ",
    relationships: "Relationship: ",
  };
  
  return (prefixes[type] || "") + content;
}

function calculateRelevance(content: string, query: string): number {
  // Simple relevance calculation based on keyword matching
  // In production, this would use vector similarity from the Agent
  const contentLower = content.toLowerCase();
  const queryWords = query.split(/\s+/);
  
  let matches = 0;
  let totalWords = queryWords.length;
  
  for (const word of queryWords) {
    if (contentLower.includes(word)) {
      matches++;
    }
  }
  
  return totalWords > 0 ? matches / totalWords : 0;
}
