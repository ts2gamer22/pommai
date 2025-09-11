#!/bin/bash
# Prepare FastRTC Gateway for Production Deployment (Option 1: TTS Streaming)

echo "Preparing FastRTC Gateway for production with TTS streaming..."

# Backup original server_relay.py if it exists
if [ -f "server_relay.py" ]; then
    echo "Backing up original server_relay.py..."
    cp server_relay.py server_relay_backup.py
fi

# Use the TTS streaming version as main server
echo "Setting up TTS streaming server..."
cp server_relay_with_tts.py server_relay.py

# Clean up old/unnecessary files
echo "Cleaning up unnecessary files..."
rm -f server.py                # Old server with local AI
rm -f requirements.txt         # Heavy dependencies
rm -f Dockerfile              # Old Dockerfile
rm -f Dockerfile.relay        # Replaced by Dockerfile.production
rm -f test_*.py              # Test files
rm -f docker-compose.yml     # If exists
rm -f docker-compose.local.yml

# Keep test files in a separate directory if needed
mkdir -p tests
mv test_*.py tests/ 2>/dev/null || true

echo "✅ Production files ready!"
echo ""
echo "Files structure:"
echo "- server_relay.py (main server with TTS streaming)"
echo "- tts_providers.py (TTS provider abstraction)"
echo "- requirements_relay.txt (minimal dependencies)"
echo "- Dockerfile.production (optimized Docker image)"
echo "- fly.toml (Fly.io configuration)"
echo ""
echo "Next steps:"
echo "1. Set your environment variables:"
echo "   - CONVEX_URL"
echo "   - CONVEX_DEPLOY_KEY"
echo "   - ELEVENLABS_API_KEY (or MINIMAX_API_KEY + MINIMAX_GROUP_ID)"
echo ""
echo "2. Deploy to Fly.io:"
echo "   fly deploy"
echo ""
echo "Or build Docker image:"
echo "   docker build -f Dockerfile.production -t pommai-gateway ."
