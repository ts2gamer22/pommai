#!/bin/bash
# Quick Fix Script for Pommai Raspberry Pi Issues

echo "🔧 Pommai Quick Fix Script"
echo "=========================="

# 1. Fix database schema issue
echo "1. Fixing database schema..."
cd /home/pi/pommai/apps/raspberry-pi 2>/dev/null || cd ~/pommai/apps/raspberry-pi 2>/dev/null || cd .

# Remove the problematic database to force recreation
if [ -f "conversation_cache.db" ]; then
    echo "   Backing up and removing conversation_cache.db..."
    mv conversation_cache.db conversation_cache.db.backup.$(date +%Y%m%d_%H%M%S)
fi

# 2. Install missing Python packages
echo "2. Installing missing Python packages..."
pip3 install websockets --user
pip3 install pyaudio --user
pip3 install numpy --user

# 3. Restart services
echo "3. Restarting services..."
sudo systemctl stop pommai
sleep 2
sudo systemctl start pommai

echo "4. Checking service status..."
if systemctl is-active --quiet pommai; then
    echo "   ✅ Pommai service is running"
else
    echo "   ❌ Pommai service failed to start"
    echo "   Checking logs:"
    sudo journalctl -u pommai -n 10 --no-pager
fi

echo ""
echo "🔧 Quick fixes applied!"
echo "Now test by pressing the button and checking logs with:"
echo "   sudo journalctl -u pommai -f"
