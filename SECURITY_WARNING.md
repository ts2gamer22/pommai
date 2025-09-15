# 🚨 CRITICAL SECURITY WARNING

## Immediate Action Required

Your repository currently contains **REAL API KEYS** in committed files. This is a critical security vulnerability.

### Files Containing Secrets:
- `apps/fastrtc-gateway/.env`
- `apps/web/.env.local`

### What You Must Do RIGHT NOW:

1. **Rotate ALL API Keys** (they're compromised):
   - ElevenLabs API Key
   - OpenRouter API Key  
   - OpenAI/Whisper API Key
   - Resend API Key
   - Cloudflare TURN tokens

2. **Remove secrets from committed files**:
   ```bash
   # Clear the files but keep them for local development
   cp apps/fastrtc-gateway/.env apps/fastrtc-gateway/.env.backup
   cp apps/web/.env.local apps/web/.env.local.backup
   
   # Replace with template content
   cp apps/fastrtc-gateway/.env.example apps/fastrtc-gateway/.env
   cp apps/web/.env.example apps/web/.env.local
   
   # Fill in your NEW keys locally
   ```

3. **Commit the cleaned files**:
   ```bash
   git add .
   git commit -m "security: remove hardcoded secrets, add deployment templates"
   git push
   ```

4. **Set up proper secret management**:
   - Use Vercel's environment variables UI for web app
   - Use `fly secrets set` for the gateway
   - Use `npx convex env set` for backend

## Why This Happened

The `.env` files were committed to git, making all secrets visible to anyone with repository access. This is a common mistake but extremely dangerous.

## Prevention

- ✅ `.gitignore` properly excludes `.env` files
- ✅ Created `.env.example` templates  
- ✅ Removed hardcoded secrets from docker-compose
- ❌ **Still need to rotate compromised keys**
- ❌ **Still need to clean committed files**

## After Fixing

Once you've rotated keys and cleaned the files, your deployment will be secure and ready to go live.