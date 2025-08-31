# Phase 4 - Tasks 4-6 Implementation Plan (Updated)

## Overview
Updated implementation plan based on:
- Using Convex Agent's built-in RAG (no external RAG needed)
- Existing Raspberry Pi client infrastructure
- No Azure Content Safety (using open-source alternatives)

## Task 4: Update Python Client for FastRTC

### Current State
The Raspberry Pi client already has most infrastructure in place:
- WebSocket connection management
- Audio streaming with Opus codec
- Hardware control (LEDs, button)
- Wake word detection (Vosk)
- Offline caching

### Required Updates

#### 4.1 Update WebSocket Connection
```python
# apps/raspberry-pi/src/fastrtc_connection.py
import asyncio
import json
import websockets
import numpy as np
from typing import Optional, Dict, Any
import logging

class FastRTCConnection:
    """Simplified WebSocket connection to FastRTC gateway"""
    
    def __init__(self, gateway_url: str, device_id: str, toy_id: str):
        self.gateway_url = gateway_url
        self.device_id = device_id
        self.toy_id = toy_id
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.is_connected = False
        
    async def connect(self) -> bool:
        """Connect to FastRTC gateway"""
        try:
            # Connect to our FastRTC gateway
            self.ws = await websockets.connect(
                self.gateway_url,
                extra_headers={
                    'X-Device-ID': self.device_id,
                    'X-Toy-ID': self.toy_id,
                },
                ping_interval=20,
                ping_timeout=10
            )
            
            # Send handshake
            await self.send_message({
                'type': 'handshake',
                'deviceId': self.device_id,
                'toyId': self.toy_id,
                'capabilities': {
                    'audio': True,
                    'wakeWord': True,
                    'offlineMode': True,
                }
            })
            
            self.is_connected = True
            logging.info(f"Connected to FastRTC gateway at {self.gateway_url}")
            return True
            
        except Exception as e:
            logging.error(f"Connection failed: {e}")
            return False
    
    async def send_audio_chunk(self, audio_data: bytes, is_final: bool = False):
        """Send audio chunk to gateway"""
        if not self.is_connected:
            return
            
        message = {
            'type': 'audio_chunk',
            'payload': {
                'data': audio_data.hex(),
                'metadata': {
                    'isFinal': is_final,
                    'format': 'opus',
                }
            }
        }
        
        await self.send_message(message)
    
    async def send_message(self, message: Dict[str, Any]):
        """Send JSON message through WebSocket"""
        if self.ws and not self.ws.closed:
            await self.ws.send(json.dumps(message))
```

#### 4.2 Update Main Client
```python
# Update apps/raspberry-pi/src/pommai_client.py
# Changes needed:
# 1. Replace ConvexConnection with FastRTCConnection
# 2. Simplify audio streaming logic
# 3. Remove unnecessary complexity
```

### Files to Modify
1. `apps/raspberry-pi/src/pommai_client.py` - Main client
2. Create `apps/raspberry-pi/src/fastrtc_connection.py` - New connection handler
3. Update `requirements.txt` - Remove fastrtc, keep websockets

## Task 5: Implement RAG with Convex Agent

### Understanding Convex Agent's Built-in RAG
The Convex Agent already provides:
- Vector search capabilities (`vectorSearch: true`)
- Text embeddings (`text-embedding-3-small`)
- Message history search
- Automatic context retrieval

### Required Implementation

#### 5.1 Knowledge Base Management
```typescript
// apps/web/convex/knowledge.ts
import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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
      v.literal("rules")
    ),
    metadata: v.optional(v.object({
      source: v.string(),
      importance: v.number(), // 0-1 scale
      tags: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Store knowledge in the agent's message system
    // This will be automatically indexed for vector search
    const thread = await ctx.runQuery(api.agents.getThreadByToyId, {
      toyId: args.toyId,
    });
    
    if (thread) {
      // Save as a system message that will be searchable
      await ctx.runMutation(api.agents.saveKnowledgeMessage, {
        threadId: thread.threadId,
        content: args.content,
        metadata: {
          type: args.type,
          ...args.metadata,
        },
      });
    }
    
    // Also store in a dedicated knowledge table
    return await ctx.db.insert("toyKnowledge", {
      toyId: args.toyId,
      content: args.content,
      type: args.type,
      metadata: args.metadata || {},
      createdAt: Date.now(),
    });
  },
});

// Bulk import knowledge for a toy
export const importToyKnowledge = action({
  args: {
    toyId: v.id("toys"),
    documents: v.array(v.object({
      content: v.string(),
      type: v.string(),
      source: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Process and chunk documents
    for (const doc of args.documents) {
      // Smart chunking based on content
      const chunks = chunkContent(doc.content, 500);
      
      for (const chunk of chunks) {
        await ctx.runMutation(api.knowledge.addToyKnowledge, {
          toyId: args.toyId,
          content: chunk,
          type: doc.type as any,
          metadata: {
            source: doc.source,
            importance: 0.5,
            tags: extractTags(chunk),
          },
        });
      }
    }
    
    return { success: true, chunksCreated: chunks.length };
  },
});

// Helper functions
function chunkContent(content: string, maxLength: number): string[] {
  // Smart chunking that preserves context
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += " " + sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

function extractTags(content: string): string[] {
  // Extract relevant tags from content
  const tags: string[] = [];
  
  // Check for common themes
  if (content.toLowerCase().includes("friend")) tags.push("friendship");
  if (content.toLowerCase().includes("learn")) tags.push("education");
  if (content.toLowerCase().includes("play")) tags.push("games");
  if (content.toLowerCase().includes("story")) tags.push("storytelling");
  
  return tags;
}
```

#### 5.2 Update Agent to Use Knowledge
```typescript
// Update apps/web/convex/agents.ts
// Add function to inject knowledge into context

export const saveKnowledgeMessage = mutation({
  args: {
    threadId: v.string(),
    content: v.string(),
    metadata: v.any(),
  },
  handler: async (ctx, { threadId, content, metadata }) => {
    // Save as a special system message for RAG
    return await toyAgent.saveMessage(ctx, {
      threadId,
      prompt: content,
      metadata: {
        ...metadata,
        isKnowledge: true,
        timestamp: Date.now(),
      },
      // Let the agent generate embeddings
      skipEmbeddings: false,
    });
  },
});

export const getThreadByToyId = query({
  args: {
    toyId: v.id("toys"),
  },
  handler: async (ctx, { toyId }) => {
    // Find the most recent thread for this toy
    const thread = await ctx.db
      .query("threads")
      .filter((q) => q.eq(q.field("metadata.toyId"), toyId.toString()))
      .order("desc")
      .first();
      
    return thread ? { threadId: thread._id.toString() } : null;
  },
});
```

## Task 6: Enhanced Safety Features (No Azure)

### Open-Source Safety Implementation

#### 6.1 Enhanced Safety Module
```typescript
// apps/web/convex/enhancedSafety.ts
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";

// Enhanced safety check with multiple layers
export const enhancedSafetyCheck = internalAction({
  args: {
    text: v.string(),
    toyId: v.id("toys"),
    isInput: v.boolean(), // true for user input, false for AI output
  },
  handler: async (ctx, args) => {
    const toy = await ctx.runQuery(api.toys.getToy, { id: args.toyId });
    const level = toy?.isForKids ? "strict" : "moderate";
    
    // Layer 1: Pattern-based filtering
    const patternCheck = checkPatterns(args.text, level);
    
    // Layer 2: Sentiment analysis (simple implementation)
    const sentimentCheck = checkSentiment(args.text);
    
    // Layer 3: Topic classification
    const topicCheck = checkTopics(args.text, level);
    
    // Layer 4: Personal information detection
    const piiCheck = checkPII(args.text);
    
    // Combine all checks
    const overallScore = (
      patternCheck.score * 0.4 +
      sentimentCheck.score * 0.2 +
      topicCheck.score * 0.3 +
      piiCheck.score * 0.1
    );
    
    const passed = overallScore > 0.6;
    
    // Log if failed
    if (!passed) {
      await ctx.runMutation(api.safety.logSafetyIncident, {
        toyId: args.toyId,
        text: args.text.substring(0, 100), // Only log snippet
        reason: determineFailureReason({
          patternCheck,
          sentimentCheck,
          topicCheck,
          piiCheck,
        }),
        severity: calculateSeverity(overallScore),
        isInput: args.isInput,
      });
    }
    
    return {
      passed,
      score: overallScore,
      details: {
        patterns: patternCheck,
        sentiment: sentimentCheck,
        topics: topicCheck,
        pii: piiCheck,
      },
    };
  },
});

// Pattern-based content filtering
function checkPatterns(text: string, level: string): SafetyResult {
  const patterns = {
    strict: {
      violence: /\b(kill|hurt|fight|punch|hit|attack|weapon|gun|knife|blood)\b/gi,
      inappropriate: /\b(stupid|dumb|hate|ugly|fat|idiot|loser)\b/gi,
      adult: /\b(drug|alcohol|cigarette|smoke|drink|beer)\b/gi,
      scary: /\b(monster|ghost|demon|nightmare|scary|horror|death|die)\b/gi,
    },
    moderate: {
      violence: /\b(kill|murder|torture|assault)\b/gi,
      inappropriate: /\b(hate speech|discrimination)\b/gi,
      adult: /\b(explicit|drug abuse)\b/gi,
    },
  };
  
  const levelPatterns = patterns[level] || patterns.moderate;
  let violations = 0;
  let totalChecks = 0;
  
  for (const [category, pattern] of Object.entries(levelPatterns)) {
    totalChecks++;
    if (pattern.test(text)) {
      violations++;
    }
  }
  
  return {
    score: 1 - (violations / totalChecks),
    passed: violations === 0,
    category: violations > 0 ? "pattern_violation" : "clean",
  };
}

// Simple sentiment analysis
function checkSentiment(text: string): SafetyResult {
  // Count positive vs negative words (simplified)
  const positiveWords = /\b(happy|fun|love|great|awesome|wonderful|nice|good|beautiful|amazing)\b/gi;
  const negativeWords = /\b(sad|bad|angry|mad|upset|terrible|awful|horrible|disgusting|nasty)\b/gi;
  
  const positiveCount = (text.match(positiveWords) || []).length;
  const negativeCount = (text.match(negativeWords) || []).length;
  
  const total = positiveCount + negativeCount;
  if (total === 0) return { score: 0.8, passed: true, category: "neutral" };
  
  const positivityRatio = positiveCount / total;
  
  return {
    score: 0.5 + (positivityRatio * 0.5), // Scale to 0.5-1.0
    passed: positivityRatio >= 0.3, // At least 30% positive
    category: positivityRatio > 0.6 ? "positive" : positivityRatio < 0.3 ? "negative" : "mixed",
  };
}

// Topic classification
function checkTopics(text: string, level: string): SafetyResult {
  const blockedTopics = {
    strict: [
      "violence", "weapons", "death", "horror", "romance",
      "politics", "religion", "drugs", "alcohol",
    ],
    moderate: [
      "extreme_violence", "illegal_drugs", "hate_speech",
    ],
  };
  
  const topics = blockedTopics[level] || blockedTopics.moderate;
  
  // Simple keyword-based topic detection
  for (const topic of topics) {
    const topicPattern = new RegExp(`\\b${topic}\\b`, 'i');
    if (topicPattern.test(text)) {
      return {
        score: 0,
        passed: false,
        category: `blocked_topic_${topic}`,
      };
    }
  }
  
  return {
    score: 1,
    passed: true,
    category: "safe_topics",
  };
}

// Personal Information Detection
function checkPII(text: string): SafetyResult {
  const piiPatterns = {
    email: /[\w._%+-]+@[\w.-]+\.[A-Z]{2,}/gi,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    address: /\b\d+\s+[\w\s]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct)\b/gi,
  };
  
  for (const [type, pattern] of Object.entries(piiPatterns)) {
    if (pattern.test(text)) {
      return {
        score: 0,
        passed: false,
        category: `pii_${type}`,
      };
    }
  }
  
  return {
    score: 1,
    passed: true,
    category: "no_pii",
  };
}

// Helper interfaces
interface SafetyResult {
  score: number;
  passed: boolean;
  category: string;
}

function determineFailureReason(checks: any): string {
  // Determine primary reason for failure
  const failures = [];
  if (!checks.patternCheck.passed) failures.push("inappropriate_content");
  if (!checks.sentimentCheck.passed) failures.push("negative_sentiment");
  if (!checks.topicCheck.passed) failures.push("blocked_topic");
  if (!checks.piiCheck.passed) failures.push("personal_information");
  
  return failures.join(", ") || "unknown";
}

function calculateSeverity(score: number): number {
  if (score < 0.2) return 5; // Critical
  if (score < 0.4) return 4; // High
  if (score < 0.6) return 3; // Medium
  if (score < 0.8) return 2; // Low
  return 1; // Minimal
}
```

#### 6.2 Safety Logging and Monitoring
```typescript
// apps/web/convex/safety.ts (additions)

export const logSafetyIncident = mutation({
  args: {
    toyId: v.id("toys"),
    text: v.string(),
    reason: v.string(),
    severity: v.number(),
    isInput: v.boolean(),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.insert("safetyIncidents", {
      ...args,
      timestamp: Date.now(),
      resolved: false,
    });
    
    // Alert parent if severity is high
    if (args.severity >= 4) {
      await ctx.runMutation(api.notifications.alertParent, {
        toyId: args.toyId,
        type: "safety_incident",
        severity: args.severity,
        message: `Safety filter triggered: ${args.reason}`,
      });
    }
    
    return incident;
  },
});

export const getSafetyStats = query({
  args: {
    toyId: v.id("toys"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, { toyId, days = 7 }) => {
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const incidents = await ctx.db
      .query("safetyIncidents")
      .filter((q) => 
        q.and(
          q.eq(q.field("toyId"), toyId),
          q.gte(q.field("timestamp"), since)
        )
      )
      .collect();
    
    return {
      totalIncidents: incidents.length,
      bySeverity: groupBy(incidents, "severity"),
      byReason: groupBy(incidents, "reason"),
      recentIncidents: incidents.slice(0, 10),
    };
  },
});
```

## Implementation Priority

1. **First Priority - Task 4 (Partial)**:
   - Update the WebSocket connection in Raspberry Pi client
   - Test basic audio streaming to FastRTC gateway
   - Ensure button and LED functionality works

2. **Second Priority - Task 5**:
   - Implement knowledge base management
   - Integrate with Convex Agent's built-in RAG
   - Test knowledge retrieval in conversations

3. **Third Priority - Task 6**:
   - Implement enhanced safety checks
   - Add safety logging and monitoring
   - Test with various content scenarios

## Testing Strategy

### Task 4 Testing
```python
# apps/raspberry-pi/tests/test_fastrtc.py
import pytest
import asyncio
from fastrtc_connection import FastRTCConnection

@pytest.mark.asyncio
async def test_connection():
    client = FastRTCConnection(
        gateway_url="ws://localhost:8080/ws",
        device_id="test-device",
        toy_id="test-toy"
    )
    
    connected = await client.connect()
    assert connected == True
    
    # Test audio sending
    test_audio = b"test audio data"
    await client.send_audio_chunk(test_audio, is_final=True)
```

### Task 5 Testing
```typescript
// Test knowledge addition and retrieval
const testKnowledge = async () => {
  const toyId = "toy_123";
  
  // Add knowledge
  await api.knowledge.addToyKnowledge({
    toyId,
    content: "The toy loves to tell stories about space adventures",
    type: "personality",
  });
  
  // Test retrieval through agent
  const response = await api.agents.generateToyResponse({
    threadId: "thread_123",
    toyId,
    prompt: "Tell me about space",
  });
  
  // Should incorporate the knowledge
  assert(response.text.includes("space"));
};
```

### Task 6 Testing
```typescript
// Test safety filters
const testSafety = async () => {
  const tests = [
    { text: "Let's play a fun game!", expected: true },
    { text: "I hate you", expected: false },
    { text: "My email is test@example.com", expected: false },
  ];
  
  for (const test of tests) {
    const result = await api.enhancedSafety.enhancedSafetyCheck({
      text: test.text,
      toyId: "toy_123",
      isInput: true,
    });
    
    assert(result.passed === test.expected);
  }
};
```

## Conclusion

This updated plan:
1. **Simplifies Task 4** by using the existing Pi client infrastructure
2. **Leverages Convex Agent's built-in RAG** for Task 5 (no external RAG needed)
3. **Implements open-source safety** for Task 6 (no Azure dependency)

The implementation focuses on practical, deployable solutions that work within the existing architecture while adding the necessary new features for Phase 4 completion.
