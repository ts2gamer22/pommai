# Pommai RAG (Retrieval-Augmented Generation) Guide

This document explains how RAG works in our codebase, what the two knowledge stores do, and how conversational generation uses knowledge via Convex Agent.

Audience: developers working on AI generation, knowledge ingestion, and debugging RAG behavior.


## Overview

- We use Convex Agent to manage threads and messages for each toy. The Agent performs context retrieval over the thread when generating responses.
- Retrieval types used:
  - Text search: lexical search over thread messages.
  - Vector search: semantic search over embeddings stored with messages.
- Generation entrypoints (voice and web chat) now use a single function that enables vector search (RAG) by default.

Key effects of recent fixes:
- Vector search is enabled during generation via includeKnowledge = true.
- User transcripts (Whisper outputs) are saved with embeddings so they can be retrieved.
- The previous prompt-augmentation path was deprecated to avoid competing/duplicative behavior.


## Data model: Two knowledge stores and why both exist

We currently have two knowledge-related tables. Both are valid, but they serve different purposes.

- knowledgeBases (structured, owned by UI)
  - Purpose: A structured, user-friendly model for toy backstory, family info, and custom facts (what the Toy Wizard and Edit screens manage).
  - Ingestion: knowledgeBase.upsertKnowledgeBase chunks the structured content and saves it into the Agent thread as knowledge messages with embeddings.
  - Source of truth for UI.

- toyKnowledge (chunked entries)
  - Purpose: A simpler table for additional snippets (e.g., progress logs, ad‑hoc entries). Historically used by older search code.
  - Not required for RAG to work: the Agent retrieves from messages embedded in the Agent thread, not directly from this table.

Recommendation: Treat knowledgeBases as the canonical store for user-entered knowledge. toyKnowledge can remain for auxiliary needs; it no longer drives generation directly.


## Knowledge ingestion path (UI → Agent thread)

When the user saves knowledge in the Wizard or Edit screen, we store it in knowledgeBases and also ingest it into the Agent thread (with embeddings) so the Agent can retrieve it.

- Upsert and ingest (excerpt):
```ts path=C:\Users\Admin\Desktop\pommai\apps\web\convex\knowledgeBase.ts start=105
// --- Ingest knowledge into the Agent thread for RAG ---
const thread = await ctx.runMutation(api.agents.getOrCreateToyThread, {
  toyId: args.toyId,
  userId: toy.creatorId,
});
const threadId = thread.threadId;

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
```

- Agent-side save ensures embeddings are generated for RAG:
```ts path=C:\Users\Admin\Desktop\pommai\apps\web\convex\agents.ts start=1106
const { messageId } = await toyAgent.saveMessage(ctx, {
  threadId,
  prompt: content,
  metadata: metadata as any,
  skipEmbeddings: false, // Important: Generate embeddings for RAG
});
```


## User transcripts are embedded for retrieval

Speech captured on the device (Pi) is transcribed via Whisper. We save that transcript to the Agent thread and embed it so later prompts can reference it semantically.

```ts path=C:\Users\Admin\Desktop\pommai\apps\web\convex\agents.ts start=316
const { messageId } = await toyAgent.saveMessage(ctx, {
  threadId,
  userId: userId?.toString(),
  prompt: transcript,
  metadata: {},
  skipEmbeddings: false, // Embed user transcripts for retrieval
});
```

Why this matters: Follow-up questions like “Tell me more about that thing I mentioned” can pick up earlier user inputs using semantic search.


## Generation: unified entrypoint with vector search (RAG) enabled

We expose a single generate function to both voice and web chat. It controls vector search via includeKnowledge (defaults to true).

- Core function (excerpt):
```ts path=C:\Users\Admin\Desktop\pommai\apps\web\convex\agents.ts start=330
export const generateToyResponse = internalAction({
  args: {
    threadId: v.string(),
    toyId: v.id("toys"),
    promptMessageId: v.optional(v.string()),
    prompt: v.optional(v.string()),
    includeKnowledge: v.optional(v.boolean()), // controls RAG
  },
  handler: async (ctx, { threadId, toyId, promptMessageId, prompt, includeKnowledge = true }) => {
    // ... build system prompt + safety ...
    const result = await agent.generateText(
      ctx,
      { threadId },
      generateArgs,
      {
        contextOptions: {
          excludeToolMessages: true,
          recentMessages: 10,
          searchOptions: {
            limit: 5,
            textSearch: true,
            vectorSearch: includeKnowledge, // RAG on by default
            messageRange: { before: 2, after: 1 },
          },
          searchOtherThreads: false,
        },
        storageOptions: { saveMessages: "promptAndOutput" },
      }
    );
    // ... return result ...
  },
});
```

- Voice pipeline calls unified function with knowledge enabled:
```ts path=C:\Users\Admin\Desktop\pommai\apps\web\convex\aiPipeline.ts start=188
console.log("Step 4: Generating AI response via Agent...");
const agentResult: any = await ctx.runAction(internal.agents.generateToyResponse, {
  threadId,
  toyId: args.toyId,
  prompt: transcription.text,
  includeKnowledge: true,
});
```

- Web chat calls unified function with knowledge enabled:
```ts path=C:\Users\Admin\Desktop\pommai\apps\web\convex\messages.ts start=109
const agentResult = await ctx.runAction(internal.agents.generateToyResponse, {
  threadId,
  toyId: toy._id,
  promptMessageId: messageId,
  includeKnowledge: true,
});
```

Notes:
- Use promptMessageId OR prompt (not both) per Agent best practice.
- RAG leverages context from the Agent thread; ensure knowledge is ingested there.


## Deprecated path (for clarity)

The prior function generateToyResponseWithKnowledge relied on a keyword-based search (searchToyKnowledge). It is now commented out and removed from exports to avoid dual, competing paths. The unified function above is the single source of truth.


## How to adjust retrieval behavior

- Toggle RAG on/off per-call: set includeKnowledge to true/false when calling generateToyResponse.
- Tune search options:
  - searchOptions.limit: number of retrieved items.
  - recentMessages: how many recent thread messages are included regardless of search.
  - messageRange: window of surrounding messages to include around hits.

Cost considerations:
- Embeddings incur cost. We embed knowledge messages and (now) user transcripts. If cost becomes a concern, you can disable transcript embeddings selectively or reduce ingestion volume.


## End-to-end flow summary

1) User enters knowledge in the UI → stored in knowledgeBases.
2) knowledgeBase.upsertKnowledgeBase chunks and ingests content into the Agent thread with embeddings.
3) User speaks; Whisper produces a transcript, which we save to the thread with embeddings.
4) Voice or web chat calls generateToyResponse with includeKnowledge: true.
5) Agent performs text + vector retrieval over the thread and generates a response.


## Testing checklist

- Add a unique fact (e.g., “My secret friend is Sparky the blue dinosaur.”) in the Knowledge step.
- Start a chat or voice interaction.
- Ask “Who is your secret friend?”
- Expected: The answer references Sparky.

If not:
- Confirm a canonical Agent thread exists for the toy.
- Check that upsertKnowledgeBase ran and ingested knowledge into the thread.
- Confirm includeKnowledge is true in callers.
- Verify network logs for saveMessage calls with skipEmbeddings: false (transcripts) and knowledge save with skipEmbeddings: false.


## FAQ

- Do we still need toyKnowledge?
  - It’s not required for retrieval. It can be kept for auxiliary logging or management. The Agent retrieves from thread messages, not directly from toyKnowledge.

- Can we disable RAG per-request?
  - Yes, pass includeKnowledge: false to generateToyResponse.

- How does kids mode affect this?
  - Kids mode applies additional safety controls. Generation still uses the same unified function unless otherwise specified; keep includeKnowledge true for better personalization.

- Where are embeddings stored?
  - Within Convex Agent’s component-managed tables for messages; we mark skipEmbeddings: false when saving knowledge and transcripts.


## References

- Convex Agent docs – RAG concepts and APIs
- Our Convex functions:
  - apps/web/convex/knowledgeBase.ts – structured KB and ingestion
  - apps/web/convex/agents.ts – saveAudioMessage, generateToyResponse
  - apps/web/convex/aiPipeline.ts – voice flow
  - apps/web/convex/messages.ts – web chat flow
