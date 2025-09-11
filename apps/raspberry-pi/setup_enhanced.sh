#!/bin/bash
#
# Pommai Smart Toy Raspberry Pi Setup Script (v2 - BlueALSA & Fallback Support)
# For Raspberry Pi OS Lite (64-bit, Bookworm)
# This script installs all necessary software, drivers, and configurations
# for both ReSpeaker HAT and Bluetooth audio output with automatic fallback
#

set -e # Exit immediately if a command exits with a non-zero status.

# --- Colors for Output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Configuration ---
POMMAI_USER="pommai"
POMMAI_HOME="/home/${POMMAI_USER}"
POMMAI_APP_DIR="${POMMAI_HOME}/app"
VOSK_MODEL_DIR="${POMMAI_HOME}/models"
AUDIO_RESPONSES_DIR="${POMMAI_HOME}/audio_responses"
LOG_DIR="/var/log/pommai"

# Auto-detect correct config.txt path for Bullseye vs Bookworm
BOOT_CONFIG="/boot/firmware/config.txt"
if [ ! -f "$BOOT_CONFIG" ]; then
  BOOT_CONFIG="/boot/config.txt"
fi

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Pommai Smart Toy Setup Script v2.0${NC}"
echo -e "${BLUE}  With Bluetooth Audio & Smart Fallback${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# --- Check if running as root ---
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}ERROR: This script must be run as root. Please use 'sudo bash setup_enhanced.sh'${NC}" 
   exit 1
fi

# --- Check if running on Raspberry Pi ---
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo -e "${YELLOW}Warning: This script is designed for Raspberry Pi${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# --- Step 1: System Preparation ---
echo -e "${GREEN}[1/12] Updating system and installing core dependencies...${NC}"
apt-get update
apt-get install -y \
    git python3-pip python3-venv python3-dev \
    portaudio19-dev libatlas-base-dev \
    libopus-dev libopus0 opus-tools \
    sqlite3 wget unzip \
    alsa-utils i2c-tools \
    bluetooth bluez libbluetooth-dev bluealsa \
    ffmpeg \
    build-essential \
    libglib2.0-dev \
    libdbus-1-dev \
    libudev-dev \
    libical-dev \
    libreadline-dev

# --- Step 2: User and Directory Setup ---
echo -e "${GREEN}[2/12] Setting up user and directories...${NC}"
if ! id "$POMMAI_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$POMMAI_USER"
    echo -e "  ✓ Created user: ${POMMAI_USER}"
else
    echo -e "  ✓ User ${POMMAI_USER} already exists"
fi

# Add user to all necessary groups including bluetooth
usermod -aG audio,gpio,i2c,spi,bluetooth,dialout "$POMMAI_USER"
echo -e "  ✓ Added user to required groups"

# Create all necessary directories
mkdir -p "${POMMAI_APP_DIR}" "${VOSK_MODEL_DIR}" "${AUDIO_RESPONSES_DIR}" "${LOG_DIR}"
chown -R "${POMMAI_USER}:${POMMAI_USER}" "${POMMAI_HOME}"
chown -R "${POMMAI_USER}:${POMMAI_USER}" "${LOG_DIR}"
echo -e "  ✓ Created application directories"

# --- Step 3: Hardware Configuration (ReSpeaker HAT) ---
echo -e "${GREEN}[3/12] Configuring hardware interfaces for ReSpeaker HAT...${NC}"

# Remove any existing entries
sed -i '/^dtparam=i2c_arm/d' "$BOOT_CONFIG"
sed -i '/^dtparam=spi/d' "$BOOT_CONFIG"
sed -i '/^dtoverlay=seeed-2mic-voicecard/d' "$BOOT_CONFIG"

# Add fresh entries
echo "dtparam=i2c_arm=on" >> "$BOOT_CONFIG"
echo "dtparam=spi=on" >> "$BOOT_CONFIG"
echo "dtoverlay=seeed-2mic-voicecard" >> "$BOOT_CONFIG"
echo -e "  ✓ Updated ${BOOT_CONFIG} for I2C, SPI, and ReSpeaker"

# --- Step 4: Install ReSpeaker Drivers ---
echo -e "${GREEN}[4/12] Installing ReSpeaker HAT drivers...${NC}"
cd /tmp
if [ -d "seeed-voicecard" ]; then
    rm -rf seeed-voicecard
fi
git clone https://github.com/respeaker/seeed-voicecard.git
cd seeed-voicecard
./install.sh
echo -e "  ✓ ReSpeaker drivers installed"
cd /tmp
rm -rf seeed-voicecard

# --- Step 5: Configure Bluetooth Audio (BlueALSA) ---
echo -e "${GREEN}[5/12] Configuring Bluetooth audio with BlueALSA...${NC}"

# Enable and start bluetooth service
systemctl enable bluetooth
systemctl start bluetooth
echo -e "  ✓ Bluetooth service enabled"

# Configure BlueALSA service
cat > /etc/systemd/system/bluealsa.service << 'EOF'
[Unit]
Description=BlueALSA Bluetooth Audio ALSA Backend
After=bluetooth.service
Requires=bluetooth.service

[Service]
Type=simple
ExecStart=/usr/bin/bluealsa --profile=a2dp-sink --profile=a2dp-source
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable bluealsa
systemctl start bluealsa
echo -e "  ✓ BlueALSA service configured and started"

# --- Step 6: Download Vosk Model ---
echo -e "${GREEN}[6/12] Downloading offline wake-word model...${NC}"
if [ ! -d "${VOSK_MODEL_DIR}/vosk-model-small-en-us-0.15" ]; then
    cd "${VOSK_MODEL_DIR}"
    wget -q -O vosk-model.zip https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
    unzip -q vosk-model.zip
    rm vosk-model.zip
    chown -R "${POMMAI_USER}:${POMMAI_USER}" "${VOSK_MODEL_DIR}"
    echo -e "  ✓ Vosk model installed"
else
    echo -e "  ✓ Vosk model already exists"
fi

# --- Step 7: Setup Python Environment ---
echo -e "${GREEN}[7/12] Setting up Python virtual environment...${NC}"
cd "${POMMAI_APP_DIR}"
sudo -u "$POMMAI_USER" python3 -m venv venv
echo -e "  ✓ Virtual environment created"

# Copy requirements file if it exists
if [ -f "./requirements.txt" ]; then
    cp ./requirements.txt "${POMMAI_APP_DIR}/"
    chown "${POMMAI_USER}:${POMMAI_USER}" "${POMMAI_APP_DIR}/requirements.txt"
fi

# Upgrade pip and install dependencies
sudo -u "$POMMAI_USER" "${POMMAI_APP_DIR}/venv/bin/pip" install --upgrade pip setuptools wheel
echo -e "  ✓ Pip upgraded"

# Install Python dependencies
if [ -f "${POMMAI_APP_DIR}/requirements.txt" ]; then
    sudo -u "$POMMAI_USER" "${POMMAI_APP_DIR}/venv/bin/pip" install -r "${POMMAI_APP_DIR}/requirements.txt"
else
    sudo -u "$POMMAI_USER" "${POMMAI_APP_DIR}/venv/bin/pip" install \
        websockets==12.0 \
        pyaudio==0.2.14 \
        RPi.GPIO==0.7.1 \
        vosk==0.3.45 \
        opuslib==3.0.1 \
        aiofiles==23.2.1 \
        python-dotenv==1.0.0 \
        aiosqlite==0.19.0 \
        numpy==1.24.3 \
        requests==2.31.0 \
        psutil==5.9.8 \
        pydub==0.25.1
fi
echo -e "  ✓ Python dependencies installed"

# --- Step 8: Configure ALSA for Bluetooth Fallback ---
echo -e "${GREEN}[8/12] Configuring ALSA for Bluetooth audio with fallback...${NC}"

# Create system-wide ALSA configuration
cat > /etc/asound.conf << 'EOF'
# System-wide ALSA configuration for Pommai
# This config attempts to use Bluetooth first, falls back to ReSpeaker

pcm.!default {
    type asym
    playback.pcm {
        type plug
        slave.pcm "playback_auto"
    }
    capture.pcm {
        type plug
        slave.pcm "capture_respeaker"
    }
}

# Automatic playback selection with fallback
pcm.playback_auto {
    type plug
    slave.pcm {
        @func refer
        name {
            @func concat
            strings [
                "pcm."
                {
                    @func refer
                    name "bluetooth_or_respeaker"
                    default "hw:seeed2micvoicec,0"
                }
            ]
        }
    }
}

# BlueALSA PCM for Bluetooth devices
pcm.bluealsa {
    type bluealsa
    device "ANY"
    profile "a2dp"
}

# ReSpeaker capture device
pcm.capture_respeaker {
    type hw
    card seeed2micvoicec
    device 0
}

# ReSpeaker playback device
pcm.playback_respeaker {
    type hw
    card seeed2micvoicec
    device 0
}

ctl.!default {
    type hw
    card seeed2micvoicec
}
EOF
echo -e "  ✓ ALSA configuration created"

# Create user-specific ALSA config with smart fallback
ASOUNDRC_PATH="${POMMAI_HOME}/.asoundrc"
cat > "$ASOUNDRC_PATH" << 'EOF'
# User ALSA configuration for Pommai Client
# Attempts Bluetooth first, falls back to ReSpeaker

# Try BlueALSA first, fall back to ReSpeaker
pcm.!default {
    type asym
    playback.pcm {
        type plug
        slave.pcm "smart_output"
    }
    capture.pcm {
        type plug
        slave.pcm "hw:seeed2micvoicec,0"
    }
}

# Smart output that tries Bluetooth first
pcm.smart_output {
    type plug
    slave.pcm {
        @func refer
        name {
            @func concat
            strings [
                "pcm."
                {
                    @func refer
                    name {
                        @func concat
                        strings [
                            "cards."
                            {
                                @func refer
                                name "bluealsa_available"
                                default "hw:seeed2micvoicec,0"
                            }
                        ]
                    }
                }
            ]
        }
    }
}

pcm.bluealsa {
    type bluealsa
    device "ANY"
    profile "a2dp"
}

ctl.!default {
    type hw
    card seeed2micvoicec
}
EOF
chown "${POMMAI_USER}:${POMMAI_USER}" "$ASOUNDRC_PATH"
echo -e "  ✓ User ALSA configuration created"

# --- Step 9: Copy Application Files ---
echo -e "${GREEN}[9/12] Copying application files...${NC}"

# Copy all Python source files
if [ -d "./src" ]; then
    cp -r ./src/*.py "${POMMAI_APP_DIR}/"
    chown -R "${POMMAI_USER}:${POMMAI_USER}" "${POMMAI_APP_DIR}"
    echo -e "  ✓ Application files copied"
else
    echo -e "  ⚠ Source files not found in ./src/"
fi

# --- Step 10: Setup Systemd Service ---
echo -e "${GREEN}[10/12] Setting up systemd service...${NC}"

cat > /etc/systemd/system/pommai.service << 'EOF'
[Unit]
Description=Pommai Smart Toy Client
After=network-online.target sound.target bluetooth.target bluealsa.service
Wants=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=10
User=pommai
Group=pommai
WorkingDirectory=/home/pommai/app
Environment="PATH=/home/pommai/app/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="PYTHONPATH=/home/pommai/app"
Environment="PULSE_RUNTIME_PATH=/run/user/1000/pulse"
ExecStartPre=/bin/sleep 10
ExecStart=/home/pommai/app/venv/bin/python /home/pommai/app/pommai_client_fastrtc.py

# Resource limits for Pi Zero 2W
MemoryMax=200M
CPUQuota=60%

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=pommai

# Security (relaxed for hardware access)
NoNewPrivileges=true
PrivateTmp=false
ProtectSystem=false
ProtectHome=false
ReadWritePaths=/home/pommai /tmp /var/log/pommai

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable pommai.service
echo -e "  ✓ Pommai service created and enabled"

# --- Step 11: Create Configuration Template ---
echo -e "${GREEN}[11/12] Creating configuration template...${NC}"

ENV_FILE="${POMMAI_APP_DIR}/.env"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << 'EOF'
# Pommai Client Configuration

# FastRTC Gateway Connection
FASTRTC_GATEWAY_URL=ws://your-gateway-address:8080/ws

# Device Identification
DEVICE_ID=rpi-toy-001
TOY_ID=default-toy
AUTH_TOKEN=

# Audio Configuration
AUDIO_SEND_FORMAT=opus  # opus, pcm16, or wav
ENABLE_WAKE_WORD=false
ENABLE_OFFLINE_MODE=true

# Logging
LOG_LEVEL=INFO
EOF
    chown "${POMMAI_USER}:${POMMAI_USER}" "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    echo -e "  ✓ Configuration template created"
else
    echo -e "  ✓ Configuration file already exists"
fi

# --- Step 12: Final System Configuration ---
echo -e "${GREEN}[12/12] Performing final system configuration...${NC}"

# Enable I2C and SPI kernel modules
if ! lsmod | grep -q "i2c_dev"; then
    modprobe i2c-dev
    echo "i2c-dev" >> /etc/modules
fi

if ! lsmod | grep -q "spidev"; then
    modprobe spidev
    echo "spidev" >> /etc/modules
fi

# Set up audio permissions
usermod -aG audio,bluetooth,dialout "$POMMAI_USER"

# Create test script
cat > "${POMMAI_APP_DIR}/test_audio.py" << 'EOF'
#!/usr/bin/env python3
"""Quick audio test script"""
import sys
sys.path.insert(0, '/home/pommai/app')
from audio_utils import get_audio_device_indices, test_audio_output, check_bluetooth_connection

# Check Bluetooth
bt_connected, bt_device = check_bluetooth_connection()
if bt_connected:
    print(f"✓ Bluetooth device connected: {bt_device}")
else:
    print("✗ No Bluetooth device connected")

# Find audio devices
devices = get_audio_device_indices()
print(f"✓ Input device: {devices['input']}")
print(f"✓ Output device: {devices['output']}")

# Test output
if devices['output'] is not None:
    print("Playing test tone...")
    test_audio_output(devices['output'], duration=1.0)
    print("Test complete!")
EOF
chmod +x "${POMMAI_APP_DIR}/test_audio.py"
chown "${POMMAI_USER}:${POMMAI_USER}" "${POMMAI_APP_DIR}/test_audio.py"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}        SETUP COMPLETE!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT NEXT STEPS:${NC}"
echo ""
echo "1. Edit the configuration file:"
echo -e "   ${BLUE}sudo nano ${ENV_FILE}${NC}"
echo "   Set: FASTRTC_GATEWAY_URL, DEVICE_ID, TOY_ID"
echo ""
echo "2. Pair your Bluetooth speaker (if using):"
echo -e "   ${BLUE}sudo bluetoothctl${NC}"
echo "   Commands: scan on → pair <MAC> → trust <MAC> → connect <MAC>"
echo ""
echo "3. Test audio configuration:"
echo -e "   ${BLUE}sudo -u pommai ${POMMAI_APP_DIR}/venv/bin/python ${POMMAI_APP_DIR}/test_audio.py${NC}"
echo ""
echo "4. Start the service:"
echo -e "   ${BLUE}sudo systemctl start pommai${NC}"
echo "   ${BLUE}sudo journalctl -u pommai -f${NC}  (to view logs)"
echo ""
echo "5. A system reboot is recommended for all changes to take effect."
echo ""
read -p "Reboot now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Rebooting in 5 seconds..."
    sleep 5
    reboot
fi
