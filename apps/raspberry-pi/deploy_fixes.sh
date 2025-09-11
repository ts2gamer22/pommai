#!/bin/bash
# Deployment script to update Raspberry Pi client with fixes

echo "=== Pommai Client Update Script ==="
echo "This script will update the client with latest fixes"
echo ""

# Check if running on Pi
if [ ! -f /proc/device-tree/model ]; then
    echo "Warning: Not running on Raspberry Pi, but continuing..."
fi

# Stop the service if running
echo "Stopping pommai service..."
sudo systemctl stop pommai 2>/dev/null || true

# Backup current code
echo "Creating backup..."
sudo cp -r /opt/pommai/src /opt/pommai/src.backup.$(date +%Y%m%d_%H%M%S)

# Update fastrtc_connection.py with WebSocket URL fix
echo "Updating fastrtc_connection.py..."
cat > /tmp/fastrtc_connection_patch.py << 'EOF'
# Patch for fastrtc_connection.py - Fix WebSocket URL construction
# Apply this to line 87-98 in connect() method

            # Construct proper WebSocket URL with device_id and toy_id in path
            # Expected format: ws://host:port/ws/{device_id}/{toy_id}
            base_url = self.config.gateway_url.rstrip('/')
            if not base_url.endswith('/ws'):
                if '/ws' not in base_url:
                    base_url = f"{base_url}/ws"
            
            # Append device_id and toy_id to the path
            ws_url = f"{base_url}/{self.config.device_id}/{self.config.toy_id}"
            
            logger.info(f"Connecting to FastRTC gateway at {ws_url}")
EOF

# Update pommai_client_fastrtc.py configuration
echo "Updating pommai_client_fastrtc.py configuration..."
cat > /tmp/pommai_client_patch.py << 'EOF'
# Patch for pommai_client_fastrtc.py - Fix gateway URL configuration
# Update line 83-85 in Config class

    # FastRTC Gateway connection
    # Note: The actual WebSocket path will be constructed as: {GATEWAY_URL}/ws/{device_id}/{toy_id}
    FASTRTC_GATEWAY_URL: str = _get_env_with_fallback('FASTRTC_GATEWAY_URL', ['GATEWAY_URL'], 'ws://localhost:8080')
EOF

# Update conversation_cache.py with database schema fix
echo "Updating conversation_cache.py..."
cat > /tmp/conversation_cache_patch.py << 'EOF'
# Patch for conversation_cache.py - Add sync_attempts to usage_metrics
# Add after line 161 in _init_database() method

            # Add missing columns to existing tables (migration)
            try:
                await db.execute('ALTER TABLE usage_metrics ADD COLUMN sync_attempts INTEGER DEFAULT 0')
                await db.commit()
                logger.info("Added sync_attempts column to usage_metrics table")
            except Exception:
                # Column already exists, ignore
                pass
EOF

# Apply patches (you would need to actually apply these patches properly)
echo "Applying patches..."
echo "NOTE: Manual patching required - please update the files with the changes shown above"

# Update environment configuration
echo ""
echo "Updating environment configuration..."
if [ -f /opt/pommai/.env ]; then
    # Check if GATEWAY_URL is set
    if ! grep -q "GATEWAY_URL=" /opt/pommai/.env; then
        echo ""
        echo "Please add the following to /opt/pommai/.env:"
        echo "GATEWAY_URL=ws://YOUR_GATEWAY_IP:8080"
        echo ""
        echo "Replace YOUR_GATEWAY_IP with the actual IP address of your gateway server"
    else
        echo "GATEWAY_URL already configured in .env"
    fi
else
    echo "Creating .env file..."
    cat > /opt/pommai/.env << 'EOF'
# Pommai Client Configuration

# Gateway connection
GATEWAY_URL=ws://192.168.1.100:8080  # Replace with your gateway IP

# Device identification
DEVICE_ID=rpi-zero2w-001
TOY_ID=kd729cad81984f52pz1v1f3gh57q3774

# Audio configuration (optional)
PLAYBACK_SAMPLE_RATE=48000  # For Bluetooth speakers
AUDIO_SEND_FORMAT=pcm16     # or opus for compression

# Features
ENABLE_WAKE_WORD=false
ENABLE_OFFLINE_MODE=true

# Logging
LOG_LEVEL=INFO
EOF
    echo "Created .env file - please update GATEWAY_URL with your gateway IP"
fi

# Clear old database to force schema recreation
echo ""
read -p "Do you want to clear the database to fix schema issues? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Backing up and clearing database..."
    sudo mv /opt/pommai/cache/conversations.db /opt/pommai/cache/conversations.db.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    echo "Database cleared - will be recreated on next start"
fi

# Restart the service
echo ""
echo "Starting pommai service..."
sudo systemctl start pommai

# Check status
sleep 2
sudo systemctl status pommai --no-pager | head -n 10

echo ""
echo "=== Update Complete ==="
echo ""
echo "IMPORTANT: Please manually apply the code patches shown above to:"
echo "  1. /opt/pommai/src/fastrtc_connection.py (lines 87-98)"
echo "  2. /opt/pommai/src/pommai_client_fastrtc.py (lines 83-85)"
echo "  3. /opt/pommai/src/conversation_cache.py (after line 161)"
echo ""
echo "Then restart the service with: sudo systemctl restart pommai"
echo ""
echo "To view logs: sudo journalctl -u pommai -f"
