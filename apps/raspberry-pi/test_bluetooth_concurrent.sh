#!/bin/bash

echo "=== Testing Bluetooth Audio (with pommai running) ==="
echo ""

# 1. Check pommai service status
echo "1. Pommai service status:"
systemctl status pommai --no-pager | grep -E "Active:" || echo "Pommai not found"
echo ""

# 2. Check what's using audio
echo "2. Processes using audio devices:"
lsof /dev/snd/* 2>/dev/null | head -5 || echo "No lsof available"
fuser -v /dev/snd/* 2>&1 | grep -v "Cannot" || echo "No audio devices in use shown"
echo ""

# 3. Check ALSA configuration
echo "3. ALSA configuration:"
if [ -f /etc/asound.conf ]; then
    echo "=== /etc/asound.conf ==="
    cat /etc/asound.conf
    echo ""
fi

if [ -f ~/.asoundrc ]; then
    echo "=== ~/.asoundrc ==="
    cat ~/.asoundrc
    echo ""
fi

# 4. Test with dmix (allows multiple clients)
echo "4. Testing audio playback methods:"
echo ""

echo "Method 1: Using dmix (allows sharing):"
timeout 2 speaker-test -D plug:dmix -c 1 -t sine -f 440 2>&1 | grep -E "Playback|Rate set" || echo "dmix test complete"
echo ""

echo "Method 2: Using 'default' device:"
timeout 2 speaker-test -D default -c 1 -t sine -f 440 2>&1 | grep -E "Playback|Rate set" || echo "default test complete"
echo ""

echo "Method 3: Using 'bt' alias:"
timeout 2 speaker-test -D bt -c 1 -t sine -f 440 2>&1 | grep -E "Playback|Rate set" || echo "bt test complete"
echo ""

echo "Method 4: Direct bluealsa with sharing:"
timeout 2 speaker-test -D plug:bluealsa -c 1 -t sine -f 440 2>&1 | grep -E "Playback|Rate set" || echo "plug:bluealsa test complete"
echo ""

# 5. Create a temporary ALSA config that allows sharing
echo "5. Creating temporary ALSA config for sharing..."
cat > /tmp/asound_shared.conf << 'EOF'
# Bluetooth with dmix for sharing
pcm.!default {
    type plug
    slave.pcm "dmixer"
}

pcm.dmixer {
    type dmix
    ipc_key 1024
    ipc_key_add_uid false
    ipc_perm 0666
    slave {
        pcm "bluetooth"
        rate 48000
        channels 2
        format S16_LE
        periods 4
        period_time 0
        period_size 1024
        buffer_size 4096
    }
}

pcm.bluetooth {
    type bluealsa
    device "00:00:00:00:00:00"
    profile "a2dp"
}
EOF

echo "To test with shared config:"
echo "  ALSA_CONF=/tmp/asound_shared.conf speaker-test -c 1"
echo ""

echo "=== Test Complete ==="
echo ""
echo "Solutions:"
echo "1. If pommai is blocking, try: sudo systemctl restart pommai"
echo "2. Use 'bt' or 'default' device instead of 'bluealsa' directly"
echo "3. Configure dmix for device sharing in /etc/asound.conf"
echo "4. Modify pommai to release audio device when idle"
