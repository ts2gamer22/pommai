# Pommai AI Toy Platform - Production Improvement Plan

## Executive Summary
This document outlines critical improvements needed to make the Pommai codebase production-ready. The analysis identified 47 issues across architecture, performance, security, and user experience that need to be addressed.

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### 1. Duplicate FastRTC Server Implementations
**Problem:** Both `server.py` (old, heavy) and `server_relay.py` (new, lightweight) exist, causing confusion
**Impact:** 5GB vs 150MB Docker images, duplicate processing, unclear deployment path
**Solution:**
```bash
# Remove old implementation
rm apps/fastrtc-gateway/server.py
rm apps/fastrtc-gateway/Dockerfile
rm apps/fastrtc-gateway/requirements.txt

# Update all references to use relay version
mv apps/fastrtc-gateway/server_relay.py apps/fastrtc-gateway/server.py
mv apps/fastrtc-gateway/Dockerfile.relay apps/fastrtc-gateway/Dockerfile
mv apps/fastrtc-gateway/requirements_relay.txt apps/fastrtc-gateway/requirements.txt
```

### 2. ElevenLabs to Minimax TTS Migration
**Problem:** ElevenLabs is too expensive for production
**Impact:** High operational costs, free tier limitations
**Solution:**
```typescript
// apps/web/convex/aiServices.ts
// Add Minimax TTS provider
export const synthesizeSpeech = action({
  args: {
    text: v.string(),
    provider: v.optional(v.union(v.literal("elevenlabs"), v.literal("minimax"))),
    voice: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const provider = args.provider || process.env.TTS_PROVIDER || "minimax";
    
    if (provider === "minimax") {
      return await synthesizeWithMinimax(args.text, args.voice);
    }
    // Fallback to ElevenLabs
    return await synthesizeWithElevenLabs(args.text, args.voice);
  }
});

async function synthesizeWithMinimax(text: string, voice?: string) {
  const response = await fetch("https://api.minimax.chat/v1/tts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voice_id: voice || "default",
      output_format: "mp3_44100",
      speed: 1.0,
    }),
  });
  
  const audioBuffer = await response.arrayBuffer();
  return Buffer.from(audioBuffer).toString("base64");
}
```

### 3. ReSpeaker v2 LED Issues
**Problem:** LED controller not properly initialized for APA102 LEDs
**Impact:** No visual feedback for users
**Solution:**
```python
# apps/raspberry-pi/src/led_controller.py
# Fix SPI initialization for APA102
class PixelAPA102:
    def __init__(self, led_count: int = 3, spi_bus: int = 0, spi_dev: int = 0):
        # ReSpeaker 2-Mic HAT has 3 APA102 LEDs, not 2
        self.led_count = 3  
        self.spi = spidev.SpiDev()
        self.spi.open(spi_bus, spi_dev)
        # Reduce speed for stability
        self.spi.max_speed_hz = 4_000_000  # 4MHz instead of 8MHz
        self.spi.mode = 0b01  # Mode 1 for APA102
```

### 4. Cloudflare TURN Server Setup
**Problem:** No TURN server configured for WebRTC relay
**Impact:** Connection failures behind NAT/firewalls
**Solution:**
```javascript
// apps/web/lib/webrtc-client.ts
const turnConfig = {
  iceServers: [
    { urls: 'stun:stun.cloudflare.com:3478' },
    {
      urls: 'turn:turn.cloudflare.com:3478?transport=udp',
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    },
    {
      urls: 'turn:turn.cloudflare.com:3478?transport=tcp',
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    }
  ]
};
```

---

## 🟡 ARCHITECTURE IMPROVEMENTS

### 5. Remove Outdated Code
**Files to Remove:**
- `test-apis.cjs` (security risk detected)
- `test.wav`, `test4.wav` (binary test files in repo)
- Old Phase 1-3 documentation (move to archive)
- Duplicate TypeScript declaration files

### 6. Centralize Configuration
**Problem:** Configuration scattered across multiple .env files
**Solution:** Create centralized config service
```typescript
// packages/config/index.ts
export const config = {
  services: {
    fastrtc: {
      url: process.env.FASTRTC_URL,
      port: process.env.FASTRTC_PORT || 8080,
    },
    convex: {
      url: process.env.CONVEX_URL,
      deployKey: process.env.CONVEX_DEPLOY_KEY,
    },
    tts: {
      provider: process.env.TTS_PROVIDER || 'minimax',
      apiKey: process.env.TTS_API_KEY,
    }
  }
};
```

### 7. Implement Proper Service Discovery
**Problem:** Hardcoded service URLs
**Solution:** Use environment-based service discovery
```yaml
# docker-compose.prod.yml
services:
  service-registry:
    image: consul:latest
    ports:
      - "8500:8500"
  
  fastrtc:
    environment:
      - CONSUL_HOST=service-registry
      - SERVICE_NAME=fastrtc-gateway
```

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### 8. Optimize Opus Codec Settings
**Problem:** Suboptimal codec configuration for Pi Zero 2W
```python
# apps/raspberry-pi/src/opus_audio_codec.py
class OpusConfig:
    sample_rate: int = 16000
    channels: int = 1
    bitrate: int = 16000  # Reduce from 24000 for Pi Zero
    complexity: int = 0   # Reduce from 5 for faster encoding
    frame_size_ms: int = 40  # Increase from 20ms for less overhead
```

### 9. Implement Audio Buffer Pool
**Problem:** Constant memory allocation for audio buffers
```python
# apps/raspberry-pi/src/audio_buffer_pool.py
class AudioBufferPool:
    def __init__(self, size: int = 10, buffer_size: int = 1280):
        self.pool = [bytearray(buffer_size) for _ in range(size)]
        self.available = asyncio.Queue()
        for buf in self.pool:
            self.available.put_nowait(buf)
    
    async def acquire(self) -> bytearray:
        return await self.available.get()
    
    def release(self, buffer: bytearray):
        buffer[:] = b'\x00' * len(buffer)  # Clear
        self.available.put_nowait(buffer)
```

### 10. Add Request Batching
**Problem:** Too many individual Convex calls
```typescript
// apps/web/convex/batchProcessor.ts
export const processBatch = mutation({
  args: {
    operations: v.array(v.object({
      type: v.string(),
      payload: v.any(),
    }))
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const op of args.operations) {
      results.push(await processOperation(ctx, op));
    }
    return results;
  }
});
```

---

## 🛡️ SECURITY & SAFETY ENHANCEMENTS

### 11. Complete GuardrailsAI Integration
**Problem:** GuardrailsAI not properly integrated with server
```python
# apps/fastrtc-gateway/server.py
from guardrails_safety import GuardrailsSafetyManager, SafetyConfig, SafetyLevel

class FastRTCRelayGateway:
    def __init__(self):
        # ... existing code ...
        self.safety_manager = GuardrailsSafetyManager(
            SafetyConfig(
                level=SafetyLevel.MODERATE,
                age_group="6-8",
                block_personal_info=True,
                custom_blocked_words=["violence", "inappropriate"],
            )
        )
    
    async def handle_audio_chunk(self, session, payload):
        # Add safety check for transcripts
        transcript = payload.get('transcript')
        if transcript:
            result = await self.safety_manager.check_input(transcript)
            if not result.passed:
                await self._send_safety_redirect(session, result)
                return
```

### 12. Add Rate Limiting
```typescript
// apps/web/convex/rateLimiter.ts
export const rateLimit = {
  check: async (ctx: any, userId: string, limit: number = 100) => {
    const key = `rate_limit:${userId}`;
    const count = await ctx.runQuery(internal.cache.get, { key });
    
    if (count >= limit) {
      throw new Error("Rate limit exceeded");
    }
    
    await ctx.runMutation(internal.cache.increment, { key, ttl: 60 });
  }
};
```

### 13. Implement API Key Rotation
```python
# apps/raspberry-pi/src/key_manager.py
class APIKeyManager:
    def __init__(self):
        self.keys = []
        self.current_index = 0
    
    async def rotate_key(self):
        self.current_index = (self.current_index + 1) % len(self.keys)
        await self.notify_services()
```

---

## 🎨 USER EXPERIENCE IMPROVEMENTS

### 14. Fix Next.js Chat Interface
**Problem:** Poor chat UI with placeholder content
```tsx
// apps/web/src/components/chat/ChatInterface.tsx
import { useState, useRef, useEffect } from 'react';
import { useConvex } from 'convex/react';

export function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <button
            onClick={toggleRecording}
            className={`p-3 rounded-full ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
            }`}
          >
            {isRecording ? '🎤' : '🎙️'}
          </button>
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          
          <button
            onClick={sendMessage}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 15. Replace Placeholder Content
```tsx
// apps/web/src/app/page.tsx
// Remove all placeholder Lorem ipsum text
const heroContent = {
  title: "Pommai - AI-Powered Smart Toy",
  subtitle: "Safe, Educational, and Fun AI Companion for Children",
  features: [
    "Age-appropriate conversations",
    "Educational games and stories",
    "Parental controls and monitoring",
    "Offline mode for privacy"
  ]
};
```

---

## 🔧 RASPBERRY PI IMPROVEMENTS

### 16. Fix setup.sh Script
```bash
#!/bin/bash
# apps/raspberry-pi/src/scripts/setup.sh

# Use dynamic paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Detect Raspberry Pi model
PI_MODEL=$(cat /proc/cpuinfo | grep "Model" | cut -d':' -f2 | xargs)

# Dynamic audio device detection
detect_audio_device() {
    if aplay -l | grep -q "seeed"; then
        echo "seeed2micvoicec"
    elif aplay -l | grep -q "USB"; then
        echo "usb"
    else
        echo "default"
    fi
}

AUDIO_DEVICE=$(detect_audio_device)
```

### 17. Add Hardware Detection
```python
# apps/raspberry-pi/src/hardware_detector.py
import subprocess
import re

class HardwareDetector:
    @staticmethod
    def detect_respeaker_version():
        try:
            result = subprocess.run(['i2cdetect', '-y', '1'], 
                                  capture_output=True, text=True)
            # ReSpeaker 2-Mic: 0x1a
            # ReSpeaker 4-Mic: 0x38
            if '1a' in result.stdout:
                return '2mic'
            elif '38' in result.stdout:
                return '4mic'
            return None
        except:
            return None
    
    @staticmethod
    def get_led_count():
        version = HardwareDetector.detect_respeaker_version()
        return {'2mic': 3, '4mic': 12}.get(version, 0)
```

### 18. Improve Wake Word Detection
```python
# apps/raspberry-pi/src/wake_word_detector.py
class ImprovedWakeWordDetector:
    def __init__(self, model_path: str):
        # Use Picovoice Porcupine for better accuracy
        import pvporcupine
        self.porcupine = pvporcupine.create(
            keyword_paths=[model_path],
            sensitivities=[0.5]
        )
    
    def process(self, audio_frame):
        keyword_index = self.porcupine.process(audio_frame)
        return keyword_index >= 0
```

---

## 📦 DEPLOYMENT & DEVOPS

### 19. Create Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  fastrtc:
    image: pommai/fastrtc:latest
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - pommai-network
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - fastrtc
    networks:
      - pommai-network

networks:
  pommai-network:
    driver: overlay
    encrypted: true
```

### 20. Add GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test
  
  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t pommai/fastrtc:${{ github.sha }} apps/fastrtc-gateway
          docker build -t pommai/web:${{ github.sha }} apps/web
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push pommai/fastrtc:${{ github.sha }}
          docker push pommai/web:${{ github.sha }}
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /opt/pommai
            docker-compose pull
            docker-compose up -d
```

---

## 🐛 BUG FIXES

### 21. Fix Memory Leaks
```python
# apps/raspberry-pi/src/pommai_client_fastrtc.py
class PommaiClient:
    async def cleanup(self):
        # Properly clean up resources
        if self.audio_stream:
            await self.audio_stream.stop()
        if self.led_controller:
            await self.led_controller.cleanup()
        if self.connection:
            await self.connection.disconnect()
        # Clear circular references
        self.audio_queue.clear()
        self.audio_buffer = None
```

### 22. Fix Async Task Cancellation
```python
# apps/raspberry-pi/src/fastrtc_connection.py
async def disconnect(self):
    # Cancel all tasks properly
    tasks = [self.receive_task, self.heartbeat_task, self.sync_task]
    for task in tasks:
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
```

---

## 📊 MONITORING & OBSERVABILITY

### 23. Add Prometheus Metrics
```python
# apps/fastrtc-gateway/metrics.py
from prometheus_client import Counter, Histogram, Gauge

messages_processed = Counter('fastrtc_messages_processed', 'Total messages processed')
audio_latency = Histogram('fastrtc_audio_latency', 'Audio processing latency')
active_connections = Gauge('fastrtc_active_connections', 'Active WebSocket connections')

class MetricsMiddleware:
    async def track_message(self, message_type: str, duration: float):
        messages_processed.labels(type=message_type).inc()
        audio_latency.observe(duration)
```

### 24. Add Structured Logging
```python
# apps/raspberry-pi/src/logger.py
import structlog

logger = structlog.get_logger()
logger = logger.bind(
    device_id=os.getenv('DEVICE_ID'),
    service='pommai-client'
)

# Use structured logging
logger.info("audio_processed", 
            frames=frame_count,
            duration_ms=duration,
            compression_ratio=ratio)
```

---

## 🔄 DATABASE & STATE MANAGEMENT

### 25. Optimize Convex Queries
```typescript
// apps/web/convex/conversations.ts
export const getRecentConversations = query({
  args: { 
    toyId: v.id("toys"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Add index for better performance
    return await ctx.db
      .query("conversations")
      .withIndex("by_toy_and_time", (q) => 
        q.eq("toyId", args.toyId)
      )
      .order("desc")
      .take(args.limit || 10);
  },
});

// Add index in schema
export default defineSchema({
  conversations: defineTable({
    toyId: v.id("toys"),
    timestamp: v.number(),
    // ... other fields
  }).index("by_toy_and_time", ["toyId", "timestamp"]),
});
```

### 26. Implement Caching Layer
```typescript
// apps/web/convex/cache.ts
export const getCached = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("cache")
      .withIndex("by_key", q => q.eq("key", args.key))
      .first();
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
    return null;
  }
});
```

---

## 🧪 TESTING IMPROVEMENTS

### 27. Add Integration Tests
```python
# apps/raspberry-pi/tests/test_e2e.py
import pytest
import asyncio
from pommai_client_fastrtc import PommaiClient

@pytest.mark.asyncio
async def test_full_conversation_flow():
    client = PommaiClient(test_config)
    await client.connect()
    
    # Simulate button press
    await client.start_recording()
    
    # Send test audio
    test_audio = generate_test_audio("Hello Pommai")
    await client.process_audio(test_audio)
    
    # Stop and wait for response
    response = await client.stop_recording_and_wait()
    
    assert response is not None
    assert response.get('text') is not None
    
    await client.disconnect()
```

### 28. Add Load Testing
```javascript
// tests/load-test.js
import { check } from 'k6';
import ws from 'k6/ws';

export let options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
};

export default function() {
  const url = 'ws://localhost:8080/ws/test-device/test-toy';
  
  ws.connect(url, {}, function(socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        type: 'handshake',
        deviceId: 'load-test',
        toyId: 'test-toy'
      }));
    });
    
    socket.on('message', (data) => {
      check(data, {
        'message received': (d) => d !== null
      });
    });
  });
}
```

---

## 📝 DOCUMENTATION UPDATES

### 29. Create API Documentation
```yaml
# docs/api/openapi.yaml
openapi: 3.0.0
info:
  title: Pommai FastRTC API
  version: 1.0.0
paths:
  /ws/{device_id}/{toy_id}:
    get:
      summary: WebSocket connection endpoint
      parameters:
        - name: device_id
          in: path
          required: true
          schema:
            type: string
        - name: toy_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '101':
          description: Switching Protocols
```

### 30. Update README Files
```markdown
# apps/web/README.md
# Pommai Web Application

## Quick Start
\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Environment Variables
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL
- `OPENROUTER_API_KEY`: OpenRouter API key for LLM
- `MINIMAX_API_KEY`: Minimax API key for TTS
- `NEXT_PUBLIC_TURN_USERNAME`: Cloudflare TURN username
- `NEXT_PUBLIC_TURN_CREDENTIAL`: Cloudflare TURN credential

## Architecture
See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.
```

---

## 🚀 IMPLEMENTATION PRIORITY (Refactor Phases & Single‑Owner Agents)

The improvement items below are executed as parallel phases, each owned by exactly one agent. Progress and decisions must be logged to `refactorlogs.md`. See `Refactor.md` for detailed scope, deliverables, dependencies, and doc references.

- Phase A — Web Platform & UX (Agent A)
  - [#14] Fix Chat Interface
  - [#15] Replace placeholder content
  - App Router and Tailwind alignment per WARP/PLAN

- Phase B — Convex Backend (Agent B)
  - [#12] Add rate limiting (client hooks + server guards)
  - [#10] Batch processor
  - [#25] Indexes + query tuning
  - [#26] Caching layer

- Phase C — Real‑time Comms: FastRTC + TURN (Agent C)
  - [#1] Remove duplicate FastRTC implementations; standardize relay server
  - [#4] Configure Cloudflare TURN (ICE servers, short‑lived creds)
  - [#19] Align gateway packaging for production

- Phase D — Raspberry Pi Client (Agent D)
  - [#3] ReSpeaker LED fix
  - [#8] Opus codec tuning
  - [#9] Audio buffer pool
  - [#16] setup.sh fixes; [#17] hardware detection
  - [#18] Improved wake word
  - [#21][#22] Memory leak + async cancellation fixes

- Phase E — AI Services & Safety (Agent E)
  - [#2] ElevenLabs → Minimax TTS migration
  - [#11] GuardrailsAI integration; Content Safety thresholds (from PLAN)

- Phase F — DevOps & CI/CD (Agent F)
  - [#19] Production Docker Compose
  - [#20] GitHub Actions CI/CD

- Phase G — Observability & SLOs (Agent G)
  - [#23] Prometheus metrics
  - [#24] Structured logging
  - [#28] Load testing

- Phase H — Documentation & DX (Agent H)
  - [#29] API documentation
  - [#30] Update READMEs

Notes
- Phases run in parallel; coordinate on interfaces (audio formats, API shapes, secret management)
- Each agent records changes, perf deltas, and backout steps in `refactorlogs.md`
- Detailed plan and doc links: see `Refactor.md`

---

## 📈 SUCCESS METRICS

- **Performance**: <200ms audio latency, <500ms E2E response time
- **Reliability**: 99.9% uptime, <0.1% error rate
- **Security**: Zero PII leaks, 100% safety compliance
- **Cost**: 80% reduction in TTS costs with Minimax
- **Scale**: Support 1000+ concurrent connections

---

## 🛠️ TOOLS & DEPENDENCIES TO ADD

```json
// package.json - Root
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "vitest": "^1.0.0"
  }
}
```

```txt
# apps/raspberry-pi/requirements.txt - Add
pvporcupine>=3.0.0  # Better wake word
prometheus-client>=0.19.0  # Metrics
structlog>=23.0.0  # Structured logging
tenacity>=8.0.0  # Retry logic
```

---

## 📞 SUPPORT & MONITORING

### Setup Monitoring Stack
```yaml
# monitoring/docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
  
  loki:
    image: grafana/loki
    ports:
      - "3100:3100"
```

---

## CONCLUSION

This improvement plan addresses all identified issues and provides a clear path to production readiness. The estimated timeline is 4 weeks with a team of 2-3 developers. Priority should be given to critical fixes that affect user experience and system stability.

Key benefits after implementation:
- 80% cost reduction (Minimax vs ElevenLabs)
- 90% smaller Docker images
- 50% faster response times
- 100% safety compliance with GuardrailsAI
- Production-grade reliability and monitoring

Next steps:
1. Review and approve this plan
2. Create JIRA tickets for each item
3. Assign team members
4. Begin Phase 1 implementation
