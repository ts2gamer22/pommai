# FastRTC Gateway Architecture - Option 1: TTS Streaming

## Overview
This gateway implements **Option 1**: Direct TTS streaming from the gateway for lowest latency audio playback.

## Architecture Flow

```
1. Pi sends audio → Gateway
2. Gateway forwards to Convex (with skipTTS=true)
3. Convex performs:
   - Speech-to-Text (Whisper)
   - Safety checks
   - LLM response generation
   - Returns TEXT + toy voice config (no audio)
4. Gateway receives text response
5. Gateway streams TTS directly to Pi:
   - Uses ElevenLabs or Minimax API
   - Sends audio chunks as they're generated
   - Pi starts playing immediately (low latency!)
```

## Benefits of Option 1

### ✅ **Ultra-Low Latency**
- Pi starts playing audio within ~100-200ms
- No waiting for complete audio generation
- Real-time streaming as TTS generates

### ✅ **Provider Flexibility**
- Parents can choose between:
  - **ElevenLabs**: Western company, voice cloning support
  - **Minimax**: Chinese company, preset voices only
- Addresses privacy/geopolitical concerns

### ✅ **Clean Separation**
- **Convex**: Business logic, data, AI orchestration
- **Gateway**: Real-time streaming layer
- **Pi**: Simple audio I/O client

## Voice Cloning Flow

### During Toy Setup (Next.js app):
1. Parent records voice samples
2. If ElevenLabs: Creates voice clone, gets `voice_id`
3. If Minimax: Selects preset voice
4. Saves `voice_id` and `ttsProvider` to toy config in Convex

### During Playback:
1. Convex returns toy's `voiceId` and `ttsProvider` in response
2. Gateway uses this config to stream correct voice
3. Every response uses the toy's configured voice

## File Structure

```
fastrtc-gateway/
├── server_relay_with_tts.py  # Main server (renamed to server_relay.py in prod)
├── tts_providers.py          # ElevenLabs/Minimax abstraction
├── requirements_relay.txt    # Minimal dependencies
├── Dockerfile.production     # Optimized Docker image
├── fly.toml                 # Fly.io deployment config
└── .env.example             # Environment template
```

## Environment Variables

```bash
# Required
CONVEX_URL=https://warmhearted-snail-998.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# TTS Providers (at least one required)
ELEVENLABS_API_KEY=your-key     # For ElevenLabs
MINIMAX_API_KEY=your-key        # For Minimax
MINIMAX_GROUP_ID=your-group-id  # For Minimax

# Optional
LOG_LEVEL=INFO
CONVEX_ACTION_TIMEOUT=60
```

## Deployment Commands

```bash
# Prepare for production
chmod +x prepare_production.sh
./prepare_production.sh

# Deploy to Fly.io
fly auth login
fly apps create pommai-gateway
fly secrets set CONVEX_URL=...
fly secrets set CONVEX_DEPLOY_KEY=...
fly secrets set ELEVENLABS_API_KEY=...
fly deploy

# Your gateway URL: https://pommai-gateway.fly.dev
```

## Performance Metrics

- **First Audio Byte**: ~100-200ms (vs 2-3s with Option 2)
- **Memory Usage**: ~100-200MB
- **Docker Image**: ~200MB
- **Cost**: ~$5/month on Fly.io

## API Integration Details

### ElevenLabs Streaming
- Model: `eleven_turbo_v2_5` (lowest latency)
- Format: `mp3_22050_32` (optimized for streaming)
- Optimization: `optimize_streaming_latency=3`

### Minimax Streaming  
- Model: `speech-01-turbo`
- Format: `pcm` (16kHz, mono, 16-bit)
- Streaming: SSE (Server-Sent Events)

## Security Notes

1. API keys stored as secrets (never in code)
2. Non-root Docker user
3. HTTPS/WSS only in production
4. Rate limiting available if needed

## Testing

```bash
# Health check
curl https://pommai-gateway.fly.dev/health

# Monitor logs
fly logs -a pommai-gateway

# Test WebSocket
wscat -c wss://pommai-gateway.fly.dev/ws/test/test
```
