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
    python3.9 \
    python3.9-dev \
    python3-pip \
    python3-venv \
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
mkdir -p $POMMAI_APP_DIR
mkdir -p $VOSK_MODEL_DIR
mkdir -p $AUDIO_RESPONSES_DIR
mkdir -p $LOG_DIR
mkdir -p /tmp/pommai  # For cache database

# Set permissions
chown -R $POMMAI_USER:$POMMAI_USER $POMMAI_HOME
chown -R $POMMAI_USER:$POMMAI_USER $LOG_DIR
chmod 755 $LOG_DIR

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
cd $VOSK_MODEL_DIR
if [ ! -d "vosk-model-small-en-us-0.15" ]; then
    wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
    unzip vosk-model-small-en-us-0.15.zip
    rm vosk-model-small-en-us-0.15.zip
    echo -e "${GREEN}Downloaded Vosk model${NC}"
else
    echo -e "${YELLOW}Vosk model already exists${NC}"
fi

echo -e "${GREEN}Step 8: Setting up Python Virtual Environment${NC}"
cd $POMMAI_APP_DIR
sudo -u $POMMAI_USER python3.9 -m venv venv
source venv/bin/activate

echo -e "${GREEN}Step 9: Installing Python Dependencies${NC}"
# Upgrade pip first
pip install --upgrade pip

# Install wheel for building packages
pip install wheel

# Install main dependencies
pip install \
    websockets==12.0 \
    pyaudio==0.2.14 \
    RPi.GPIO==0.7.1 \
    vosk==0.3.45 \
    pyopus==0.1.1 \
    aiofiles==23.2.1 \
    python-dotenv==1.0.0 \
    aiosqlite==0.19.0 \
    numpy==1.24.3

echo -e "${GREEN}Step 10: Configuring Audio${NC}"
# Set default audio device
cat > /etc/asound.conf << EOF
pcm.!default {
    type asym
    playback.pcm {
        type plug
        slave.pcm "hw:seeed2micvoicec"
    }
    capture.pcm {
        type plug
        slave.pcm "hw:seeed2micvoicec"
    }
}
EOF

# Test audio
echo -e "${YELLOW}Testing audio setup...${NC}"
sudo -u $POMMAI_USER speaker-test -t wav -c 2 -l 1

echo -e "${GREEN}Step 11: Creating Default Audio Responses${NC}"
# Create basic audio response files
cd $AUDIO_RESPONSES_DIR
# These would be actual audio files in production
touch wake_ack.wav
touch toy_switch.wav
touch error.wav
touch offline_mode.wav

echo -e "${GREEN}Step 12: Setting up Environment File${NC}"
cat > $POMMAI_APP_DIR/.env << EOF
# Pommai Environment Configuration
CONVEX_URL=wss://your-app.convex.site/audio-stream
CONVEX_API_URL=https://your-app.convex.site
DEVICE_ID=$(cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2 | tr -d '\n')
POMMAI_USER_TOKEN=
POMMAI_TOY_ID=
VOSK_MODEL_PATH=$VOSK_MODEL_DIR/vosk-model-small-en-us-0.15
CACHE_DB_PATH=/tmp/pommai_cache.db
AUDIO_RESPONSES_PATH=$AUDIO_RESPONSES_DIR
EOF

chown $POMMAI_USER:$POMMAI_USER $POMMAI_APP_DIR/.env
chmod 600 $POMMAI_APP_DIR/.env

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
ExecStart=$POMMAI_APP_DIR/venv/bin/python $POMMAI_APP_DIR/pommai_client.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=pommai

# Security settings
NoNewPrivileges=true
PrivateTmp=false  # We need access to /tmp for cache
ProtectHome=false  # We need access to pommai home
ProtectSystem=strict
ReadWritePaths=$POMMAI_HOME /tmp/pommai /var/log/pommai

# Resource limits
MemoryMax=256M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

echo -e "${GREEN}Step 14: Optimizing for Raspberry Pi Zero 2W${NC}"
# Disable unnecessary services
systemctl disable bluetooth
systemctl disable avahi-daemon
systemctl disable triggerhappy

# Configure swap
if [ ! -f /swapfile ]; then
    dd if=/dev/zero of=/swapfile bs=1M count=256
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
    echo -e "${GREEN}Created 256MB swap file${NC}"
fi

# Optimize memory usage
echo "vm.swappiness=10" >> /etc/sysctl.conf
sysctl -p

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
# Copy application files (assuming they're in current directory)
if [ -f "pommai_client.py" ]; then
    cp *.py $POMMAI_APP_DIR/
    chown -R $POMMAI_USER:$POMMAI_USER $POMMAI_APP_DIR
    echo -e "${GREEN}Copied application files${NC}"
else
    echo -e "${YELLOW}Warning: Application files not found in current directory${NC}"
    echo -e "${YELLOW}Please copy all .py files to $POMMAI_APP_DIR/${NC}"
fi

echo ""
echo -e "${GREEN}Setup Complete!${NC}"
echo "=============================="
echo ""
echo "Next steps:"
echo "1. Edit $POMMAI_APP_DIR/.env with your configuration"
echo "2. Copy your application files to $POMMAI_APP_DIR/"
echo "3. Enable and start the service:"
echo "   sudo systemctl enable pommai"
echo "   sudo systemctl start pommai"
echo "4. Check logs with:"
echo "   sudo journalctl -u pommai -f"
echo ""
echo -e "${YELLOW}Note: A reboot is required for hardware changes to take effect${NC}"
echo ""
read -p "Reboot now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    reboot
fi
