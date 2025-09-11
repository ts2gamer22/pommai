#!/bin/bash

# Simple Bluetooth audio test script
# No Python dependencies required

echo "=== Simple Bluetooth Audio Test ==="
echo ""

# 1. Check Bluetooth status
echo "1. Checking Bluetooth status..."
bluetoothctl show | grep "Powered:" || echo "Bluetooth not found"
echo ""

# 2. Check connected devices
echo "2. Checking connected devices..."
bluetoothctl devices Connected || bluetoothctl info | grep -E "Name:|Connected:"
echo ""

# 3. Check BlueALSA
echo "3. Checking BlueALSA service..."
systemctl status bluealsa | grep -E "Active:|Main PID:" || echo "BlueALSA not running"
echo ""

# 4. List audio devices
echo "4. Available ALSA devices:"
aplay -l | grep -E "card|device"
echo ""

# 5. Test audio with speaker-test
echo "5. Testing audio output..."
echo "   This will play a test tone for 3 seconds"
echo "   Press Ctrl+C to stop if needed"
echo ""

# Try Bluetooth device first (usually hw:0,0 or plughw:bluealsa)
echo "Testing Bluetooth audio..."
timeout 3 speaker-test -c 1 -t sine -f 440 -D bluealsa 2>/dev/null || \
timeout 3 speaker-test -c 1 -t sine -f 440 -D plughw:0,0 2>/dev/null || \
timeout 3 speaker-test -c 1 -t sine -f 440 2>/dev/null || \
echo "Could not play test tone"

echo ""
echo "6. Volume check:"
amixer | grep -E "Simple mixer control|Playback" | head -5

echo ""
echo "=== Test Complete ==="
echo ""
echo "If you didn't hear audio:"
echo "1. Make sure your Bluetooth speaker is on and connected"
echo "2. Check volume: alsamixer"
echo "3. Restart BlueALSA: sudo systemctl restart bluealsa"
echo "4. Reconnect Bluetooth: bluetoothctl connect <MAC_ADDRESS>"
echo "5. Check ALSA config: cat /etc/asound.conf"
