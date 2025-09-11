#!/bin/bash

echo "=== Fixing Bluetooth Audio Device Busy Issue ==="
echo ""

# 1. Check what's using the audio device
echo "1. Checking what processes are using audio devices..."
lsof /dev/snd/* 2>/dev/null || echo "No processes found using /dev/snd"
echo ""

# 2. Check if pommai service is running
echo "2. Checking if pommai service is running..."
systemctl status pommai --no-pager | grep -E "Active:|Main PID:"
echo ""

# 3. Stop pommai service temporarily
echo "3. Stopping pommai service to free audio device..."
sudo systemctl stop pommai
sleep 2
echo "Pommai service stopped"
echo ""

# 4. Check BlueALSA processes
echo "4. Checking BlueALSA processes..."
ps aux | grep -E "bluealsa|bluetoothd" | grep -v grep
echo ""

# 5. Restart BlueALSA to clear any stuck connections
echo "5. Restarting BlueALSA service..."
sudo systemctl restart bluealsa
sleep 2
echo "BlueALSA restarted"
echo ""

# 6. Check Bluetooth device status
echo "6. Checking Bluetooth device connection..."
bluetoothctl info | grep -E "Device|Name:|Connected:"
echo ""

# 7. Test audio directly with ALSA
echo "7. Testing audio with ALSA tools..."
echo "   Playing test tone for 2 seconds..."

# Try different device names
echo "   Trying bluealsa device..."
timeout 2 speaker-test -c 1 -t sine -f 440 -D bluealsa 2>&1 | grep -E "Rate|Playback|error" || echo "bluealsa test done"

echo ""
echo "   Trying default device..."
timeout 2 speaker-test -c 1 -t sine -f 440 2>&1 | grep -E "Rate|Playback|error" || echo "default test done"

echo ""
echo "   Trying hw:0,0..."
timeout 2 speaker-test -c 1 -t sine -f 440 -D hw:0,0 2>&1 | grep -E "Rate|Playback|error" || echo "hw:0,0 test done"

echo ""
# 8. Check ALSA configuration
echo "8. Checking ALSA configuration..."
if [ -f /etc/asound.conf ]; then
    echo "Contents of /etc/asound.conf:"
    cat /etc/asound.conf
else
    echo "No /etc/asound.conf found"
fi

if [ -f ~/.asoundrc ]; then
    echo "Contents of ~/.asoundrc:"
    cat ~/.asoundrc
else
    echo "No ~/.asoundrc found"
fi

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Run the Python test again: python3 test_elevenlabs_bluetooth.py"
echo "2. If it works, restart pommai: sudo systemctl start pommai"
echo "3. If still busy, try using device index 6 (bt) or 7 (speaker) instead of 2"
echo "4. You may need to modify audio_utils.py to use the correct device index"
