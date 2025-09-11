# Sync Batch Server Schema (Draft)

This document describes the unified sync_batch payload the Raspberry Pi client sends to the FastRTC gateway/server to synchronize cached data, offline queue items, and usage metrics.

Status: Draft proposal (client implemented, server should confirm and adopt)
Protocol version: 1.1 (proposed)

1. Message type
- type: sync_batch

2. Top-level fields
- protocol_version: Optional string for negotiation. Example: "1.1"
- device_id: The device identifier from the client configuration. String or null.
- conversations: Array of conversation records pending sync.
- offline: Array of offline queue items (non-conversation) pending sync.
- metrics: Array of usage metric records pending sync.
- timestamp: Optional server-received or client-sent timestamp (epoch seconds or ISO8601).

3. Conversations array
Each element is the same shape provided by ConversationCache.get_unsynced_items() for type == "conversation" (DataType.CONVERSATION).

Example entry:
{
  "conversation_id": "toy-123_1725062665123",
  "user_input": "Tell me a joke",
  "toy_response": "Why did the teddy bear say no to dessert? Because she was stuffed!",
  "toy_id": "toy-123",
  "timestamp": "2025-08-30T22:24:25.123Z",
  "audio_path": "/opt/pommai/audio/responses/joke_1.opus"  // optional
}

4. Offline array
These are queued non-conversation items from the offline_queue table. The client includes minimal metadata for routing and prioritization.

Example entry:
{
  "id": 42,
  "type": "safety_event",        // e.g. DataType.SAFETY_EVENT, or other queue types
  "data": { /* payload object originally enqueued */ },
  "priority": 10
}

5. Metrics array
Usage metrics are batched to reduce chatter and are considered low priority. Each entry corresponds to a row in usage_metrics with pending sync status.

Example entry:
{
  "id": 101,
  "metric_type": "conversation_count",
  "metric_value": 1,
  "toy_id": "toy-123",
  "timestamp": "2025-08-30T22:24:25Z",
  "metadata": "{\"source\":\"client\"}"
}

6. Example full payload
{
  "type": "sync_batch",
  "protocol_version": "1.1",
  "device_id": "device-abc",
  "conversations": [
    {
      "conversation_id": "toy-123_1725062665123",
      "user_input": "Tell me a joke",
      "toy_response": "Why did the teddy bear say no to dessert? Because she was stuffed!",
      "toy_id": "toy-123",
      "timestamp": "2025-08-30T22:24:25.123Z"
    }
  ],
  "offline": [
    {
      "id": 42,
      "type": "safety_event",
      "data": {
        "event_type": "blocked_content",
        "severity": "medium",
        "content": "User asked about violence",
        "toy_id": "toy-123",
        "timestamp": "2025-08-30T22:25:00Z"
      },
      "priority": 10
    }
  ],
  "metrics": [
    {
      "id": 101,
      "metric_type": "conversation_count",
      "metric_value": 1,
      "toy_id": "toy-123",
      "timestamp": "2025-08-30T22:24:25Z",
      "metadata": "{\"source\":\"client\"}"
    }
  ]
}

7. Server handling guidelines
- Authorization: Use connection headers (X-Device-ID, X-Toy-ID, Authorization) from the initial WS upgrade.
- Validation: Accept empty arrays. Reject unknown fields gracefully (log + ignore) to allow forward compatibility.
- Idempotency: The client marks items as synced optimistically after a successful send. If the server requires strict delivery guarantees, it should respond with an ack message that includes the ids processed; future versions can switch to ack-based marking.
- Backward compatibility: If the server does not support metrics yet, return an error that includes unsupported_fields: ["metrics"]. The client can omit metrics thereafter during this session.

8. Future extensions
- Add items_attempted and items_rejected counts in a server ack for telemetry.
- Add per-item error reporting for partial failures.
- Include client clock drift estimate and last reconnect reason in a diagnostic metrics envelope.

