#!/bin/bash
#
# Comprehensive Audio Troubleshooting Script for Pommai Raspberry Pi
# This script helps diagnose and fix the ElevenLabs TTS audio streaming issue
#

echo "========================================================"
echo "Pommai Audio Troubleshooting Script"
echo "========================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Step 1: Check system basics
echo "1. Checking System Basics..."
echo "----------------------------"

# Check if we're on Raspberry Pi
if [ -f /proc/device-tree/model ]; then
    MODEL=$(cat /proc/device-tree/model)
    print_status "Running on: $MODEL"
else
    print_warning "Not running on Raspberry Pi"
fi

# Check network connectivity
if ping -c 1 google.com &> /dev/null; then
    print_status "Internet connectivity: OK"
else
    print_error "No internet connectivity!"
fi

# Check if FastRTC gateway is reachable
GATEWAY_URL=$(grep FASTRTC_GATEWAY_URL .env 2>/dev/null | cut -d '=' -f2 | sed 's/ws:/http:/g' | sed 's/\/ws$/\/health/g')
if [ -z "$GATEWAY_URL" ]; then
    GATEWAY_URL="http://pommai-gateway.fly.dev/health"
fi

echo ""
echo "2. Checking FastRTC Gateway..."
echo "-------------------------------"
echo "Gateway URL: $GATEWAY_URL"

if curl -s "$GATEWAY_URL" > /tmp/gateway_health.json 2>/dev/null; then
    print_status "Gateway is reachable"
    echo "Gateway Status:"
    cat /tmp/gateway_health.json | python3 -m json.tool 2>/dev/null || cat /tmp/gateway_health.json
else
    print_error "Cannot reach gateway at $GATEWAY_URL"
fi

echo ""
echo "3. Checking Audio System..."
echo "----------------------------"

# Check if PulseAudio is running (shouldn't be for our setup)
if pgrep pulseaudio > /dev/null; then
    print_warning "PulseAudio is running - this might interfere with ALSA"
    echo "  Consider stopping it: sudo killall pulseaudio"
fi

# Check if BlueALSA is running
if pgrep bluealsa > /dev/null; then
    print_status "BlueALSA is running"
else
    print_warning "BlueALSA is not running"
    echo "  Starting BlueALSA..."
    sudo systemctl start bluealsa
fi

# Check Bluetooth status
echo ""
echo "4. Checking Bluetooth..."
echo "-------------------------"

if systemctl is-active --quiet bluetooth; then
    print_status "Bluetooth service is active"
    
    # Check for connected devices
    CONNECTED_DEVICES=$(bluetoothctl devices Connected 2>/dev/null | grep "Device")
    if [ -n "$CONNECTED_DEVICES" ]; then
        print_status "Bluetooth devices connected:"
        echo "$CONNECTED_DEVICES"
    else
        print_warning "No Bluetooth devices connected"
    fi
else
    print_error "Bluetooth service is not active"
    echo "  Starting Bluetooth..."
    sudo systemctl start bluetooth
fi

# Check ALSA devices
echo ""
echo "5. Checking ALSA Audio Devices..."
echo "----------------------------------"

# List playback devices
echo "Playback devices:"
aplay -l | grep "^card" || print_error "No playback devices found"

# Check default ALSA device
echo ""
echo "Default ALSA device:"
cat /proc/asound/card*/id 2>/dev/null || print_warning "Cannot determine default device"

# Test speaker-test
echo ""
echo "6. Testing Audio Output..."
echo "---------------------------"
echo "Playing test tone (2 seconds)..."

# Try to play a test tone
timeout 2 speaker-test -t sine -f 440 > /dev/null 2>&1
if [ $? -eq 124 ]; then
    print_status "Audio test completed (timeout as expected)"
else
    print_warning "Audio test may have issues"
fi

echo ""
echo "7. Checking Python Environment..."
echo "----------------------------------"

# Check Python version
PYTHON_VERSION=$(python3 --version 2>/dev/null)
if [ -n "$PYTHON_VERSION" ]; then
    print_status "Python: $PYTHON_VERSION"
else
    print_error "Python3 not found!"
fi

# Check required Python packages
REQUIRED_PACKAGES="pyaudio websockets numpy python-dotenv"
for package in $REQUIRED_PACKAGES; do
    if python3 -c "import $package" 2>/dev/null; then
        print_status "Package '$package' is installed"
    else
        print_error "Package '$package' is NOT installed"
        echo "  Install with: pip3 install $package"
    fi
done

echo ""
echo "8. Checking Service Status..."
echo "------------------------------"

# Check if pommai service is running
if systemctl is-active --quiet pommai; then
    print_status "Pommai service is running"
    echo "Recent logs:"
    sudo journalctl -u pommai -n 20 --no-pager | tail -10
else
    print_warning "Pommai service is not running"
    echo "  Start with: sudo systemctl start pommai"
fi

echo ""
echo "9. Running Debug Connection Test..."
echo "------------------------------------"

# Create a simple test script
cat > /tmp/test_ws_connection.py << 'EOF'
#!/usr/bin/env python3
import asyncio
import websockets
import json
import os
from dotenv import load_dotenv

load_dotenv()

async def test_connection():
    gateway_url = os.getenv('FASTRTC_GATEWAY_URL', 'ws://pommai-gateway.fly.dev/ws')
    device_id = os.getenv('DEVICE_ID', 'test-device')
    toy_id = os.getenv('TOY_ID', 'test-toy')
    
    # Build the WebSocket URL
    ws_url = f"{gateway_url}/{device_id}/{toy_id}"
    print(f"Connecting to: {ws_url}")
    
    try:
        async with websockets.connect(ws_url, subprotocols=['fastrtc']) as ws:
            print("✓ Connected successfully!")
            
            # Send config
            await ws.send(json.dumps({
                'type': 'config',
                'deviceId': device_id,
                'toyId': toy_id,
                'audioFormat': 'pcm16',
                'sampleRate': 16000
            }))
            print("✓ Sent configuration")
            
            # Send test audio to trigger response
            await ws.send(json.dumps({
                'type': 'audio_chunk',
                'payload': {
                    'data': 'deadbeef',  # Dummy hex data
                    'format': 'pcm16',
                    'isFinal': True
                }
            }))
            print("✓ Sent test audio chunk")
            
            # Wait for responses
            print("Waiting for responses (10 seconds)...")
            start_time = asyncio.get_event_loop().time()
            message_count = 0
            audio_responses = 0
            
            while asyncio.get_event_loop().time() - start_time < 10:
                try:
                    message = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    data = json.loads(message)
                    message_count += 1
                    
                    msg_type = data.get('type')
                    print(f"  Received: {msg_type}")
                    
                    if msg_type == 'audio_response':
                        audio_responses += 1
                        metadata = data.get('payload', {}).get('metadata', {})
                        print(f"    Audio format: {metadata.get('format')}")
                        print(f"    Is final: {metadata.get('isFinal')}")
                        
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    print(f"  Error: {e}")
            
            print(f"\nSummary:")
            print(f"  Total messages received: {message_count}")
            print(f"  Audio responses: {audio_responses}")
            
            if audio_responses > 0:
                print("✓ Audio streaming is working!")
            else:
                print("✗ No audio responses received - this is the issue!")
                
    except Exception as e:
        print(f"✗ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
EOF

print_status "Running WebSocket connection test..."
cd /home/pi/pommai/apps/raspberry-pi 2>/dev/null || cd ~/pommai/apps/raspberry-pi 2>/dev/null || cd .
python3 /tmp/test_ws_connection.py

echo ""
echo "10. Recommendations..."
echo "-----------------------"

echo ""
echo "Based on the tests above, here are the recommended fixes:"
echo ""

# Check if we found issues and provide recommendations
if ! pgrep bluealsa > /dev/null; then
    echo "1. Start BlueALSA:"
    echo "   sudo systemctl start bluealsa"
    echo ""
fi

if ! systemctl is-active --quiet pommai; then
    echo "2. Start Pommai service:"
    echo "   sudo systemctl start pommai"
    echo ""
fi

echo "3. To use the debug connection module:"
echo "   cd ~/pommai/apps/raspberry-pi"
echo "   cp src/fastrtc_connection.py src/fastrtc_connection.py.backup"
echo "   # Then copy the debug version over it"
echo "   python3 src/fastrtc_connection_debug.py"
echo ""

echo "4. To test audio playback directly:"
echo "   python3 test_audio_playback.py"
echo ""

echo "5. To monitor real-time logs:"
echo "   sudo journalctl -u pommai -f"
echo ""

echo "6. To restart everything:"
echo "   sudo systemctl restart bluetooth"
echo "   sudo systemctl restart bluealsa"
echo "   sudo systemctl restart pommai"
echo ""

echo "========================================================"
echo "Troubleshooting Complete"
echo "========================================================"
