# Pommai Deployment Guide

## Pre-Deployment Security Checklist ✅

- [x] Removed hardcoded secrets from docker-compose.production.yml
- [x] Removed conflicting vercel.json files
- [x] Created .env.example templates
- [x] Verified .gitignore excludes sensitive files

## Deployment Architecture

Pommai consists of 3 deployable components:

### 1. Convex Backend (Database + Serverless Functions)
**Location**: `apps/web/convex/`
**Hosting**: Convex Cloud

### 2. Next.js Frontend (Web Application)
**Location**: `apps/web/`
**Hosting**: Vercel

### 3. FastRTC Gateway (WebSocket Server)
**Location**: `apps/fastrtc-gateway/`
**Hosting**: Fly.io

## Deployment Steps

### Step 1: Deploy Convex Backend

```bash
cd apps/web
npx convex deploy --prod

# Set production environment variables
npx convex env set ELEVENLABS_API_KEY "sk_..." --prod
npx convex env set OPENROUTER_API_KEY "sk-or-..." --prod
npx convex env set WHISPER_API_KEY "sk-proj-..." --prod
npx convex env set SITE_URL "https://your-production-domain.com" --prod
npx convex env set BETTER_AUTH_SECRET "your-secure-secret" --prod
```

### Step 2: Deploy Next.js Frontend to Vercel

1. **Push code to Git repository**
2. **Import project in Vercel dashboard**
3. **Configure Vercel project settings**:
   - Framework: Next.js (auto-detected)
   - Root Directory: `apps/web`
   - Build Command: `turbo run build --filter=@pommai/web`
   - Output Directory: `.next`

4. **Set Environment Variables in Vercel**:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   CONVEX_DEPLOYMENT=prod:your-deployment-name
   BETTER_AUTH_SECRET=your-secure-secret
   NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
   SITE_URL=https://your-app.vercel.app
   ```

### Step 3: Deploy FastRTC Gateway to Fly.io

```bash
cd apps/fastrtc-gateway

# Install Fly CLI and login
fly auth login

# Launch the app (reads fly.toml)
fly launch

# Set secrets (DO NOT commit these)
fly secrets set CONVEX_URL="https://your-deployment.convex.cloud"
fly secrets set CONVEX_DEPLOY_KEY="prod:your-deployment|your-key"
fly secrets set ELEVENLABS_API_KEY="sk_your_key"
fly secrets set TURN_TOKEN_ID="your_turn_token"
fly secrets set TURN_API_TOKEN="your_turn_api_token"

# Deploy
fly deploy
```

### Step 4: Update Raspberry Pi Configuration

After deploying the FastRTC Gateway, update your Raspberry Pi devices:

```bash
# In apps/raspberry-pi/.env
FASTRTC_GATEWAY_URL=wss://your-app-name.fly.dev/ws
```

## Environment Variables Reference

### Required for Convex Backend
- `ELEVENLABS_API_KEY`: ElevenLabs TTS service
- `OPENROUTER_API_KEY`: LLM inference
- `WHISPER_API_KEY`: OpenAI Whisper STT
- `SITE_URL`: Your production domain
- `BETTER_AUTH_SECRET`: Authentication secret

### Required for Vercel Frontend
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL
- `CONVEX_DEPLOYMENT`: Convex deployment identifier
- `BETTER_AUTH_SECRET`: Must match Convex backend
- `NEXT_PUBLIC_BASE_URL`: Your Vercel domain
- `SITE_URL`: Your Vercel domain

### Required for Fly.io Gateway
- `CONVEX_URL`: Convex deployment URL
- `CONVEX_DEPLOY_KEY`: Convex deployment key
- `ELEVENLABS_API_KEY`: ElevenLabs TTS service
- `TURN_TOKEN_ID`: Cloudflare TURN server ID
- `TURN_API_TOKEN`: Cloudflare TURN server token

## Security Notes

- Never commit real API keys to Git
- Use platform-specific secret management (Convex env, Vercel env vars, Fly secrets)
- Rotate keys regularly
- Use different keys for development and production

## Troubleshooting

### Common Issues
1. **Build failures**: Check that all dependencies are in package.json
2. **Environment variable errors**: Verify all required vars are set
3. **CORS issues**: Ensure SITE_URL matches your actual domain
4. **WebSocket connection failures**: Check FastRTC Gateway deployment status

### Verification Steps
1. Test Convex functions in dashboard
2. Verify Next.js app loads and authenticates
3. Test WebSocket connection to FastRTC Gateway
4. Verify end-to-end audio pipeline works