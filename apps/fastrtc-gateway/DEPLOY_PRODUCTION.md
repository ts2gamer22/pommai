# Production Deployment Guide for FastRTC Gateway

## Files Cleanup Checklist

### ✅ Files to KEEP for Production:
- `server_relay_with_tts.py` - Main relay server with TTS streaming
- `tts_providers.py` - TTS provider abstraction (ElevenLabs/Minimax)
- `requirements_relay.txt` - Minimal dependencies
- `Dockerfile.production` - Optimized Docker image
- `fly.toml` - Fly.io configuration
- `.env.example` - Environment variable template

### ❌ Files to DELETE before deployment:
- `server.py` - OLD server with local AI (not needed)
- `server_relay.py` - Old relay without TTS streaming
- `requirements.txt` - Heavy dependencies including PyTorch (not needed)
- `Dockerfile` - Old heavy Docker image
- `Dockerfile.relay` - Can delete, using Dockerfile.production instead
- `test_*.py` - Test files (not needed in production)
- `docker-compose.*.yml` - Local development files

### 📝 Files to UPDATE:
- Remove hardcoded credentials from `docker-compose.relay.yml` if keeping for local dev

## Deployment Options

### Option A: Deploy on Fly.io (Recommended)

1. **Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login to Fly:**
```bash
fly auth login
```

3. **Create app:**
```bash
cd apps/fastrtc-gateway
fly apps create pommai-gateway
```

4. **Set secrets:**
```bash
fly secrets set CONVEX_URL=https://warmhearted-snail-998.convex.cloud
fly secrets set CONVEX_DEPLOY_KEY=your-production-key
```

5. **Deploy:**
```bash
fly deploy
```

6. **Get your gateway URL:**
```bash
fly info
# Your URL will be: https://pommai-gateway.fly.dev
```

### Option B: Deploy on Cloudflare (using Cloudflare Tunnels)

1. **Build Docker image:**
```bash
docker build -f Dockerfile.production -t pommai-gateway:latest .
```

2. **Run container:**
```bash
docker run -d \
  --name pommai-gateway \
  -p 8080:8080 \
  -e CONVEX_URL=$CONVEX_URL \
  -e CONVEX_DEPLOY_KEY=$CONVEX_DEPLOY_KEY \
  --restart unless-stopped \
  pommai-gateway:latest
```

3. **Setup Cloudflare Tunnel:**
```bash
cloudflared tunnel create pommai-gateway
cloudflared tunnel route dns pommai-gateway gateway.yourcompany.com
cloudflared tunnel run pommai-gateway
```

### Option C: Deploy on Railway.app

1. **Connect GitHub repo**
2. **Set environment variables in Railway dashboard**
3. **Deploy from GitHub**

## Environment Variables

### Required:
```bash
CONVEX_URL=https://warmhearted-snail-998.convex.cloud
CONVEX_DEPLOY_KEY=prod:warmhearted-snail-998|your-key-here

# For TTS Streaming (at least one required)
ELEVENLABS_API_KEY=your-elevenlabs-key  # For ElevenLabs TTS
MINIMAX_API_KEY=your-minimax-key        # For Minimax TTS
MINIMAX_GROUP_ID=your-group-id         # For Minimax TTS
```

### Optional:
```bash
PORT=8080                    # Server port
HOST=0.0.0.0                # Bind address
LOG_LEVEL=INFO              # INFO, DEBUG, WARNING, ERROR
CONVEX_ACTION_TIMEOUT=60    # Timeout for Convex AI pipeline
SKIP_TTS=false              # Set true to disable TTS (testing only)
```

## Update Raspberry Pi Configuration

Once deployed, update your Pi's `.env`:
```bash
# For Fly.io
FASTRTC_GATEWAY_URL=wss://pommai-gateway.fly.dev/ws

# For Cloudflare
FASTRTC_GATEWAY_URL=wss://gateway.yourcompany.com/ws

# Keep the rest unchanged
DEVICE_ID=rpi-zero2w-001
TOY_ID=ks7cw1ar4x1x4h0ep21as78d7s7pt9xg
```

## Monitoring

### Check health:
```bash
curl https://pommai-gateway.fly.dev/health
```

### View logs (Fly.io):
```bash
fly logs
```

### Scale up (Fly.io):
```bash
fly scale count 2  # Run 2 instances
fly scale vm shared-cpu-1x --memory 512  # Increase resources
```

## Performance Expectations

- **Memory Usage**: ~50-100MB
- **CPU Usage**: <5% idle, 10-20% under load
- **Latency**: <50ms added overhead
- **Concurrent Connections**: 500-1000 per instance
- **Docker Image Size**: ~150MB

## Security Checklist

- [ ] Never commit `.env` files with real credentials
- [ ] Use HTTPS/WSS in production
- [ ] Rotate CONVEX_DEPLOY_KEY regularly
- [ ] Enable rate limiting if needed
- [ ] Monitor for suspicious activity
- [ ] Keep Python dependencies updated

## Troubleshooting

### Connection issues:
```bash
# Test WebSocket connection
wscat -c wss://pommai-gateway.fly.dev/ws/test/test
```

### High latency:
- Check region placement (deploy closer to users)
- Increase Convex timeout if needed
- Monitor Convex action performance

### Memory issues:
- Should not happen with relay-only server
- If occurs, check for memory leaks in session management

## Cost Estimates

### Fly.io:
- Free tier: 3 shared VMs, 160GB outbound
- Paid: ~$2-5/month for basic instance

### Cloudflare:
- Free Cloudflare Tunnel
- Pay for VM/VPS hosting (~$5-10/month)

### Railway:
- $5/month + usage-based pricing
