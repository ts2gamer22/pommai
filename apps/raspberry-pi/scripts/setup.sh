#!/bin/bash
#
# Pommai Smart Toy Raspberry Pi Setup Script
# This script sets up the Pommai client on a Raspberry Pi Zero 2W
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Configuration
POMMAI_USER="pommai"
POMMAI_HOME="/home/pommai"
POMMAI_APP_DIR="$POMMAI_HOME/app"
SCRIPTS_DIR="$POMMAI_HOME/scripts"
VOSK_MODEL_DIR="$POMMAI_HOME/models"
AUDIO_RESPONSES_DIR="$POMMAI_HOME/audio_responses"
LOG_DIR="/var/log/pommai"

echo -e "${GREEN}Pommai Smart Toy Setup Script${NC}"
echo "=============================="
echo ""

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo; then
    echo -e "${YELLOW}Warning: This script is designed for Raspberry Pi${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}" 
   exit 1
fi

echo -e "${GREEN}Step 1: System Updates${NC}"
apt-get update
apt-get upgrade -y

echo -e "${GREEN}Step 2: Installing System Dependencies${NC}"
apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    git \
    portaudio19-dev \
    libatlas-base-dev \
    libopus0 \
    libopus-dev \
    sqlite3 \
    wget \
    unzip \
    alsa-utils \
    i2c-tools

echo -e "${GREEN}Step 3: Creating Pommai User${NC}"
if ! id "$POMMAI_USER" &>/dev/null; then
    useradd -m -s /bin/bash $POMMAI_USER
    usermod -aG audio,gpio,i2c,spi $POMMAI_USER
    echo -e "${GREEN}Created user: $POMMAI_USER${NC}"
else
    echo -e "${YELLOW}User $POMMAI_USER already exists${NC}"
fi

echo -e "${GREEN}Step 4: Setting up Directory Structure${NC}"
mkdir -p "$POMMAI_APP_DIR" "$VOSK_MODEL_DIR" "$AUDIO_RESPONSES_DIR" "$SCRIPTS_DIR" "$LOG_DIR" /tmp/pommai

# Set permissions
chown -R $POMMAI_USER:$POMMAI_USER "$POMMAI_HOME"
chown -R $POMMAI_USER:$POMMAI_USER "$LOG_DIR"
chmod 755 "$LOG_DIR"

echo -e "${GREEN}Step 5: Enabling Hardware Interfaces${NC}"
# Enable I2C for ReSpeaker HAT
if ! grep -q "^dtparam=i2c_arm=on" /boot/config.txt; then
    echo "dtparam=i2c_arm=on" >> /boot/config.txt
    echo -e "${GREEN}Enabled I2C interface${NC}"
fi

# Enable SPI
if ! grep -q "^dtparam=spi=on" /boot/config.txt; then
    echo "dtparam=spi=on" >> /boot/config.txt
    echo -e "${GREEN}Enabled SPI interface${NC}"
fi

# Add device tree overlay for ReSpeaker
if ! grep -q "^dtoverlay=seeed-2mic-voicecard" /boot/config.txt; then
    echo "dtoverlay=seeed-2mic-voicecard" >> /boot/config.txt
    echo -e "${GREEN}Added ReSpeaker 2-Mics HAT overlay${NC}"
fi

echo -e "${GREEN}Step 6: Installing ReSpeaker Drivers${NC}"
cd /tmp
if [ ! -d "seeed-voicecard" ]; then
    git clone https://github.com/respeaker/seeed-voicecard.git
    cd seeed-voicecard
    ./install.sh
else
    echo -e "${YELLOW}ReSpeaker drivers already downloaded${NC}"
fi

echo -e "${GREEN}Step 7: Downloading Vosk Model${NC}"
cd "$VOSK_MODEL_DIR"
if [ ! -d "vosk-model-small-en-us-0.15" ]; then
    wget -q https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
    unzip -q vosk-model-small-en-us-0.15.zip
    rm -f vosk-model-small-en-us-0.15.zip
    echo -e "${GREEN}Downloaded Vosk model${NC}"
else
    echo -e "${YELLOW}Vosk model already exists${NC}"
fi

echo -e "${GREEN}Step 8: Setting up Python Virtual Environment${NC}"
cd "$POMMAI_APP_DIR"
sudo -u "$POMMAI_USER" python3 -m venv "$POMMAI_APP_DIR/venv"

echo -e "${GREEN}Step 9: Installing Python Dependencies${NC}"
# Upgrade pip and wheel inside venv (as pommai user)
sudo -u "$POMMAI_USER" "$POMMAI_APP_DIR/venv/bin/pip" install --upgrade pip setuptools wheel

# Install dependencies either from requirements.txt (if present) or a known set
if [ -f "$POMMAI_APP_DIR/requirements.txt" ]; then
  sudo -u "$POMMAI_USER" "$POMMAI_APP_DIR/venv/bin/pip" install -r "$POMMAI_APP_DIR/requirements.txt"
else
  sudo -u "$POMMAI_USER" "$POMMAI_APP_DIR/venv/bin/pip" install \
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
    psutil==5.9.8
fi

echo -e "${GREEN}Step 10: Configuring Audio (ALSA)${NC}"
# Set default audio device (explicitly select card 0)
cat > /etc/asound.conf << 'EOF'
pcm.!default {
    type asym
    playback.pcm {
        type plug
        slave.pcm "hw:seeed2micvoicec,0"
    }
    capture.pcm {
        type plug
        slave.pcm "hw:seeed2micvoicec,0"
    }
}

ctl.!default {
    type hw
    card seeed2micvoicec
}
EOF

# Test audio (non-blocking)
echo -e "${YELLOW}Testing audio setup...${NC}"
if ! timeout 2 speaker-test -t sine -f 1000 -c 2 >/dev/null 2>&1; then
  echo -e "${YELLOW}Audio test did not complete. Verify hardware connections if audio fails later.${NC}"
fi

echo -e "${GREEN}Step 11: Creating Default Audio Responses${NC}"
mkdir -p "$AUDIO_RESPONSES_DIR"
cd "$AUDIO_RESPONSES_DIR"
# Placeholder files (replace with real audio in production)
touch wake_ack.wav toy_switch.wav error.wav offline_mode.wav

echo -e "${GREEN}Step 12: Setting up Environment File${NC}"
cat > "$POMMAI_APP_DIR/.env" << EOF
# Pommai Environment Configuration (FastRTC-first)
FASTRTC_GATEWAY_URL=wss://your-fastrtc-gateway.example.com/ws
AUTH_TOKEN=
DEVICE_ID=
TOY_ID=

VOSK_MODEL_PATH=$VOSK_MODEL_DIR/vosk-model-small-en-us-0.15
CACHE_DB_PATH=/tmp/pommai_cache.db
AUDIO_RESPONSES_PATH=$AUDIO_RESPONSES_DIR
EOF
chown "$POMMAI_USER:$POMMAI_USER" "$POMMAI_APP_DIR/.env"
chmod 600 "$POMMAI_APP_DIR/.env"

echo -e "${GREEN}Step 13: Creating Systemd Service${NC}"
cat > /etc/systemd/system/pommai.service << EOF
[Unit]
Description=Pommai Smart Toy Client
After=network-online.target sound.target
Wants=network-online.target

[Service]
Type=simple
User=$POMMAI_USER
Group=$POMMAI_USER
WorkingDirectory=$POMMAI_APP_DIR
Environment="PATH=$POMMAI_APP_DIR/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="PYTHONPATH=$POMMAI_APP_DIR"
ExecStart=$POMMAI_APP_DIR/venv/bin/python $POMMAI_APP_DIR/pommai_client_fastrtc.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=pommai

# Security settings
NoNewPrivileges=true
PrivateTmp=false
ProtectHome=false
ProtectSystem=false
ReadWritePaths=$POMMAI_HOME /tmp /var/log/pommai

# Resource limits for Pi Zero 2W
MemoryMax=200M
CPUQuota=60%

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

echo -e "${GREEN}Step 14: Optimizing for Raspberry Pi Zero 2W${NC}"
# Disable unnecessary services
systemctl disable bluetooth || true
systemctl disable avahi-daemon || true
systemctl disable triggerhappy || true

# Configure swap (256MB)
if [ ! -f /swapfile ]; then
    dd if=/dev/zero of=/swapfile bs=1M count=256
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
    echo -e "${GREEN}Created 256MB swap file${NC}"
fi

# Optimize memory usage
if ! grep -q "vm.swappiness=10" /etc/sysctl.conf; then
  echo "vm.swappiness=10" >> /etc/sysctl.conf
fi
sysctl -p || true

echo -e "${GREEN}Step 15: Setting up Log Rotation${NC}"
cat > /etc/logrotate.d/pommai << EOF
/var/log/pommai/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 $POMMAI_USER $POMMAI_USER
    sharedscripts
    postrotate
        systemctl reload pommai >/dev/null 2>&1 || true
    endscript
}
EOF

echo -e "${GREEN}Step 16: Final Setup${NC}"
# If running from repo directory with src/, copy Python sources
if [ -d "src" ]; then
    cp src/*.py "$POMMAI_APP_DIR/" 2>/dev/null || true
    chown -R "$POMMAI_USER:$POMMAI_USER" "$POMMAI_APP_DIR"
    echo -e "${GREEN}Copied application files to $POMMAI_APP_DIR${NC}"
else
    echo -e "${YELLOW}No src/ directory found. Ensure application files are placed in $POMMAI_APP_DIR${NC}"
fi

echo ""
echo -e "${GREEN}Setup Complete!${NC}"
echo "=============================="
echo ""
echo "Next steps:"
echo "1. Edit $POMMAI_APP_DIR/.env with your configuration (set AUTH_TOKEN, FASTRTC_GATEWAY_URL, TOY_ID, DEVICE_ID)"
echo "2. Enable and start the service:"
echo "   sudo systemctl enable pommai"
echo "   sudo systemctl start pommai"
echo "3. Check logs with:"
echo "   sudo journalctl -u pommai -f"
echo ""
echo -e "${YELLOW}Note: A reboot is recommended for hardware changes to take effect${NC}"
echo ""
read -p "Reboot now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    reboot
fi
