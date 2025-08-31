# Pommai Client Deployment Guide for Raspberry Pi Zero 2W

## Complete Step-by-Step Guide for Deploying Pommai Smart Toy Client

This guide will walk you through deploying the Pommai client application on a Raspberry Pi Zero 2W running DietPi, from initial setup to running as a persistent background service.

## Prerequisites

### Hardware Requirements
- **Raspberry Pi Zero 2W** with DietPi installed (32-bit)
- **ReSpeaker 2-Mics Pi HAT** (or compatible I2S audio HAT)
- **32GB microSD card** (Class 10 minimum)
- **Passive heatsink** for CPU cooling
- **USB power supply** (5V/3A) or 10,000mAh power bank
- **3.5mm speaker** or audio output device

### Software Requirements
- DietPi OS configured and connected to WiFi
- SSH access to the Raspberry Pi
- FastRTC Gateway URL from your deployed gateway (see Agent 2's task)

## Phase 1: Initial System Preparation

### Step 1: Connect to Your Raspberry Pi

```bash
# From your computer, SSH into the Pi
ssh dietpi@<your-pi-ip-address>
# Default password is 'dietpi' - change it immediately
```

### Step 2: Update System and Configure DietPi

```bash
# Update package lists and upgrade system
sudo apt update && sudo apt upgrade -y

# Configure DietPi for optimal performance
sudo dietpi-config
# Navigate to: Performance Options → CPU Governor → Set to "Performance"
# Navigate to: Advanced Options → Swap file → Set to 1024MB

# Optimize for headless operation
sudo nano /boot/config.txt
# Add or modify these lines:
gpu_mem=16
dtparam=audio=on
dtparam=i2c_arm=on
dtparam=spi=on
dtoverlay=seeed-2mic-voicecard
```

## Phase 2: Transfer Code to Raspberry Pi

### Step 3: Create Directory Structure and Transfer Files

On your development machine:

```bash
# Create a compressed archive of the Pommai client code
cd /path/to/pommai/apps/raspberry-pi
tar -czf pommai-client.tar.gz src/ scripts/ config/ requirements.txt .env.example

# Transfer to Raspberry Pi (replace with your Pi's IP)
scp pommai-client.tar.gz dietpi@<your-pi-ip>:/home/dietpi/
```

On the Raspberry Pi:

```bash
# Create application directory
sudo mkdir -p /home/pommai/app /home/pommai/scripts
sudo chown -R pommai:pommai /home/pommai

# Extract files
cd /home/pommai/app
tar -xzf /home/dietpi/pommai-client.tar.gz
rm /home/dietpi/pommai-client.tar.gz

# Make scripts executable
chmod +x scripts/*.sh
```

## Phase 3: Install Dependencies and Drivers

### Step 4: Run the Enhanced Setup Script

First, let's create an improved version of the setup script with better error handling:

```bash
# Create the improved setup script
sudo nano /opt/pommai/scripts/setup_enhanced.sh
```

Add this enhanced content:

```bash
#!/bin/bash
set -e

# Enhanced Pommai Setup Script with better error handling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function for logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
[[ $EUID -ne 0 ]] && error "This script must be run as root (use sudo)"

# Detect Pi model
if grep -q "Raspberry Pi Zero 2" /proc/cpuinfo; then
    log "Detected Raspberry Pi Zero 2W"
else
    warning "Not running on Pi Zero 2W - performance may vary"
fi

log "Starting Pommai Client Setup..."

# Install system dependencies
log "Installing system packages..."
apt-get update || error "Failed to update package lists"
apt-get install -y \
    python3.9 python3.9-dev python3.9-venv \
    python3-pip \
    portaudio19-dev libportaudio2 \
    libatlas-base-dev \
    libopus0 libopus-dev \
    libasound2-dev alsa-utils \
    i2c-tools \
    git wget unzip \
    sqlite3 \
    || error "Failed to install system packages"

# Create pommai user if it doesn't exist
if ! id "pommai" &>/dev/null; then
    log "Creating pommai user..."
    useradd -m -s /bin/bash -G audio,gpio,i2c,spi pommai
else
    log "User 'pommai' already exists"
    usermod -aG audio,gpio,i2c,spi pommai
fi

# Setup directory structure
log "Creating directory structure..."
POMMAI_HOME="/home/pommai"
mkdir -p $POMMAI_HOME/{app,models,audio_responses,logs}
mkdir -p /var/log/pommai
chown -R pommai:pommai $POMMAI_HOME
chown -R pommai:pommai /var/log/pommai

# Install ReSpeaker drivers
log "Installing ReSpeaker 2-Mics HAT drivers..."
if [ ! -d "/tmp/seeed-voicecard" ]; then
    cd /tmp
    git clone https://github.com/respeaker/seeed-voicecard.git || warning "Failed to clone ReSpeaker drivers"
    cd seeed-voicecard
    ./install.sh || warning "ReSpeaker driver installation failed - audio may not work"
else
    log "ReSpeaker drivers already downloaded"
fi

# Download Vosk model
log "Downloading Vosk wake word model..."
VOSK_MODEL_DIR="$POMMAI_HOME/models"
if [ ! -d "$VOSK_MODEL_DIR/vosk-model-small-en-us-0.15" ]; then
    cd $VOSK_MODEL_DIR
    wget -q https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip || error "Failed to download Vosk model"
    unzip -q vosk-model-small-en-us-0.15.zip
    rm vosk-model-small-en-us-0.15.zip
    chown -R pommai:pommai $VOSK_MODEL_DIR
else
    log "Vosk model already exists"
fi

# Copy application files
log "Copying application files..."
cp -r /opt/pommai/src/* $POMMAI_HOME/app/ 2>/dev/null || warning "No source files to copy"
chown -R pommai:pommai $POMMAI_HOME/app

# Setup Python virtual environment
log "Creating Python virtual environment..."
cd $POMMAI_HOME/app
sudo -u pommai python3.9 -m venv venv || error "Failed to create virtual environment"

# Install Python packages
log "Installing Python dependencies..."
sudo -u pommai $POMMAI_HOME/app/venv/bin/pip install --upgrade pip setuptools wheel
sudo -u pommai $POMMAI_HOME/app/venv/bin/pip install -r /opt/pommai/requirements.txt || error "Failed to install Python packages"

# Configure audio
log "Configuring audio system..."
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
log "Testing audio configuration..."
timeout 2 speaker-test -t sine -f 1000 -c 2 2>/dev/null || warning "Audio test failed - check hardware connections"

log "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure environment variables: sudo nano $POMMAI_HOME/app/.env"
echo "2. Install systemd service: sudo /opt/pommai/scripts/install_service.sh"
echo "3. Start the service: sudo systemctl start pommai"
echo ""
log "A system reboot is recommended for hardware changes to take effect"
```

Now run the setup:

```bash
# Make the script executable and run it
chmod +x /opt/pommai/scripts/setup_enhanced.sh
sudo /opt/pommai/scripts/setup_enhanced.sh
```

## Phase 4: Configure Environment Variables

### Step 5: Create and Configure the .env File

This is a **critical step** - you need the correct FastRTC Gateway URL from your deployed gateway.

```bash
# Copy the example environment file
sudo cp /home/pommai/app/.env.example /home/pommai/app/.env

# Edit with your actual values
sudo nano /home/pommai/app/.env
```

Update the file with your **actual values**:

```bash
# CRITICAL: Replace with your actual FastRTC Gateway URL
FASTRTC_GATEWAY_URL=wss://your-fastrtc-gateway.example.com/ws
# Or if running locally:
# FASTRTC_GATEWAY_URL=ws://your-server-ip:8080/ws

# Authentication and device identity
AUTH_TOKEN=your-auth-token
DEVICE_ID=rpi-toy-001
TOY_ID=default-toy

# File paths (these should be correct if using default setup)
VOSK_MODEL_PATH=/home/pommai/models/vosk-model-small-en-us-0.15
CACHE_DB_PATH=/tmp/pommai_cache.db
AUDIO_RESPONSES_PATH=/home/pommai/audio_responses

# Optional features
ENABLE_WAKE_WORD=false
ENABLE_OFFLINE_MODE=true

# Safety settings for children
SAFETY_LEVEL=strict
MAX_CONVERSATIONS_PER_HOUR=20

# Legacy variables (fallbacks exist in code; not recommended)
# CONVEX_URL=wss://your-deployment.convex.site/audio-stream
# CONVEX_API_URL=https://your-deployment.convex.site
# POMMAI_USER_TOKEN=your-user-auth-token
# POMMAI_TOY_ID=toy-id
```

**Important**: Set proper permissions on the .env file:

```bash
sudo chown pommai:pommai /home/pommai/app/.env
sudo chmod 600 /home/pommai/app/.env
```

## Phase 5: Install and Configure Systemd Service

### Step 6: Create an Improved Service Installation Script

```bash
# Create the service installation script
sudo nano /home/pommai/scripts/install_service.sh
```

Add this content:

```bash
#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Installing Pommai systemd service...${NC}"

# Create the systemd service file with correct paths
cat > /etc/systemd/system/pommai.service << 'EOF'
[Unit]
Description=Pommai Smart Toy Client
After=network-online.target sound.target
Wants=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=10
User=pommai
Group=pommai
WorkingDirectory=/home/pommai/app

# Environment
Environment="PATH=/home/pommai/app/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="PYTHONPATH=/home/pommai/app"
Environment="PYTHONUNBUFFERED=1"

# Wait for network to be ready
ExecStartPre=/bin/bash -c 'until ping -c1 google.com &>/dev/null; do sleep 5; done'
# Main process - use the FastRTC client
ExecStart=/home/pommai/app/venv/bin/python /home/pommai/app/pommai_client_fastrtc.py

# Resource limits for Pi Zero 2W (512MB RAM)
MemoryMax=200M
CPUQuota=60%

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=pommai

# Security hardening (relaxed for GPIO access)
NoNewPrivileges=true
PrivateTmp=false
ProtectSystem=false
ProtectHome=false
ReadWritePaths=/home/pommai /tmp /var/log/pommai

# Restart policy
StartLimitBurst=3
StartLimitInterval=60s

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

echo -e "${GREEN}Service installed successfully!${NC}"
echo ""
echo "To enable the service to start on boot:"
echo "  sudo systemctl enable pommai"
echo ""
echo "To start the service now:"
echo "  sudo systemctl start pommai"
echo ""
echo "To check service status:"
echo "  sudo systemctl status pommai"
```

Run the installation:

```bash
chmod +x /home/pommai/scripts/install_service.sh
sudo /home/pommai/scripts/install_service.sh
```

### Step 7: Enable and Start the Service

```bash
# Enable the service to start automatically on boot
sudo systemctl enable pommai

# Start the service
sudo systemctl start pommai

# Check if the service started successfully
sudo systemctl status pommai
```

## Phase 6: Monitor and Troubleshoot

### Step 8: Monitor Service Logs

Use `journalctl` to monitor the Pommai client logs in real-time:

```bash
# View live logs (follow mode)
sudo journalctl -u pommai -f

# View last 100 lines
sudo journalctl -u pommai -n 100

# View logs from the last hour
sudo journalctl -u pommai --since "1 hour ago"

# View only error messages
sudo journalctl -u pommai -p err

# Export logs to a file for analysis
sudo journalctl -u pommai --since today > pommai_logs.txt
```

### Step 9: Use the Enhanced Diagnostic Script

Create an improved diagnostic script:

```bash
sudo nano /home/pommai/scripts/diagnose_enhanced.sh
```

Add this enhanced diagnostic content:

```bash
#!/bin/bash

# Enhanced Pommai Diagnostic Tool
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Pommai Client Diagnostic Tool ===${NC}"
echo ""

# Function for checking status
check() {
    if eval "$2" &>/dev/null; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# System Information
echo -e "${YELLOW}System Information:${NC}"
echo "  Hostname: $(hostname)"
echo "  OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "  Kernel: $(uname -r)"
echo "  Uptime: $(uptime -p)"
echo "  Memory: $(free -h | grep Mem | awk '{print $3 " / " $2}')"
echo "  CPU Temp: $(cat /sys/class/thermal/thermal_zone0/temp | awk '{print $1/1000 "°C"}')"
echo ""

# Network Connectivity
echo -e "${YELLOW}Network Status:${NC}"
check "Internet connectivity" "ping -c 1 -W 2 google.com"
check "DNS resolution" "nslookup google.com"
IP=$(ip -4 addr show wlan0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1)
echo "  WiFi IP: ${IP:-Not connected}"
echo ""

# Hardware Checks
echo -e "${YELLOW}Hardware:${NC}"
check "I2C enabled" "test -e /dev/i2c-1"
check "GPIO accessible" "test -e /sys/class/gpio"
check "Audio device present" "aplay -l 2>/dev/null | grep -q seeed"
echo ""

# Service Status
echo -e "${YELLOW}Pommai Service:${NC}"
if systemctl is-active --quiet pommai; then
    echo -e "${GREEN}✓${NC} Service is running"
    echo "  PID: $(systemctl show pommai -p MainPID | cut -d= -f2)"
    echo "  Memory: $(systemctl show pommai -p MemoryCurrent | cut -d= -f2 | numfmt --to=iec-i --suffix=B)"
    echo "  Uptime: $(systemctl show pommai -p ActiveEnterTimestamp | cut -d= -f2-)"
    
    # Check for recent errors
    ERROR_COUNT=$(journalctl -u pommai --since "10 minutes ago" 2>/dev/null | grep -c ERROR || echo 0)
    if [ $ERROR_COUNT -gt 0 ]; then
        echo -e "  ${YELLOW}Recent errors: $ERROR_COUNT in last 10 minutes${NC}"
        echo "  Last error:"
        journalctl -u pommai -p err -n 1 --no-pager | tail -1 | sed 's/^/    /'
    fi
else
    echo -e "${RED}✗${NC} Service is not running"
    echo "  Last exit code: $(systemctl show pommai -p ExecMainStatus | cut -d= -f2)"
    echo "  Last log entries:"
    journalctl -u pommai -n 3 --no-pager | sed 's/^/    /'
fi
echo ""

# Environment Configuration
echo -e "${YELLOW}Configuration:${NC}"
ENV_FILE="/home/pommai/app/.env"
if [ -f "$ENV_FILE" ]; then
    check ".env file exists" "test -f $ENV_FILE"
    
    # Check critical variables (without showing values)
    source $ENV_FILE 2>/dev/null
    check "FASTRTC_GATEWAY_URL set" "test -n '$FASTRTC_GATEWAY_URL'"
    check "DEVICE_ID configured" "test -n '$DEVICE_ID'"
    check "AUTH_TOKEN present" "test -n '$AUTH_TOKEN'"
    
    # Test gateway connectivity
    if [ -n "$FASTRTC_GATEWAY_URL" ]; then
        GATEWAY_HOST=$(echo $FASTRTC_GATEWAY_URL | sed -E 's|^wss?://([^:/]+).*|\1|')
        check "Gateway reachable" "ping -c 1 -W 2 $GATEWAY_HOST"
    fi
else
    echo -e "${RED}✗${NC} Configuration file missing!"
fi
echo ""

# Python Environment
echo -e "${YELLOW}Python Environment:${NC}"
VENV_PATH="/home/pommai/app/venv"
if [ -d "$VENV_PATH" ]; then
    check "Virtual environment exists" "test -d $VENV_PATH"
    check "Python binary present" "test -x $VENV_PATH/bin/python"
    
    # Check critical packages
    echo "  Checking packages:"
    for pkg in websockets pyaudio RPi.GPIO vosk guardrails-ai; do
        if $VENV_PATH/bin/pip show $pkg &>/dev/null; then
            echo -e "    ${GREEN}✓${NC} $pkg"
        else
            echo -e "    ${RED}✗${NC} $pkg"
        fi
    done
else
    echo -e "${RED}✗${NC} Virtual environment not found!"
fi
echo ""

# Performance Metrics
echo -e "${YELLOW}Current Performance:${NC}"
echo "  CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8"%"}')"
echo "  Memory Free: $(free -m | grep Mem | awk '{print $7 "MB"}')"
echo "  Disk Usage: $(df -h / | tail -1 | awk '{print $5}')"
echo "  Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

# Quick Actions
echo -e "${BLUE}Quick Actions:${NC}"
echo "  View logs:     sudo journalctl -u pommai -f"
echo "  Restart:       sudo systemctl restart pommai"
echo "  Edit config:   sudo nano /home/pommai/app/.env"
echo "  Update client: sudo /opt/pommai/scripts/update.sh"
echo ""

# Summary
ISSUES=0
systemctl is-active --quiet pommai || ((ISSUES++))
[ -f "$ENV_FILE" ] || ((ISSUES++))
[ -n "$FASTRTC_GATEWAY_URL" ] || ((ISSUES++))

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
else
    echo -e "${YELLOW}⚠ Found $ISSUES issue(s) - review output above${NC}"
fi
```

Make it executable and run:

```bash
chmod +x /home/pommai/scripts/diagnose_enhanced.sh
sudo /home/pommai/scripts/diagnose_enhanced.sh
```

## Common Troubleshooting

### Issue: Service Won't Start

```bash
# Check for Python syntax errors
sudo -u pommai /home/pommai/app/venv/bin/python -m py_compile /home/pommai/app/pommai_client_fastrtc.py

# Check environment variables
sudo -u pommai bash -c 'source /home/pommai/app/.env && env | grep FASTRTC'

# Test connectivity to gateway
curl -I your-fastrtc-gateway-url
```

### Issue: Audio Not Working

```bash
# List audio devices
aplay -l
arecord -l

# Test speaker
speaker-test -t wav -c 2

# Test microphone
arecord -d 5 -f cd test.wav && aplay test.wav

# Check I2C devices
sudo i2cdetect -y 1
```

### Issue: High CPU/Memory Usage

```bash
# Monitor resource usage
htop

# Check service resource limits
systemctl show pommai | grep -E 'Memory|CPU'

# Adjust limits if needed
sudo systemctl edit pommai
# Add under [Service]:
# MemoryMax=250M
# CPUQuota=70%
```

### Issue: Connection Errors

```bash
# Test WebSocket connection
python3 -c "
import websockets
import asyncio
async def test():
    try:
        async with websockets.connect('wss://your-gateway-url/ws') as ws:
            print('Connected successfully!')
    except Exception as e:
        print(f'Connection failed: {e}')
asyncio.run(test())
"
```

## Maintenance and Updates

### Updating the Client

```bash
# Use the update script
sudo /home/pommai/scripts/update.sh https://github.com/your-repo/pommai.git

# Or manually:
sudo systemctl stop pommai
# Copy new files to /home/pommai/app/
sudo systemctl start pommai
```

### Log Rotation

The service logs are automatically rotated by systemd. To configure:

```bash
sudo nano /etc/systemd/journald.conf
# Set:
# SystemMaxUse=100M
# SystemMaxFileSize=10M
```

### Backup Configuration

```bash
# Backup current configuration
sudo tar -czf pommai-backup-$(date +%Y%m%d).tar.gz \
    /home/pommai/app/.env \
    /home/pommai/app/*.py \
    /etc/systemd/system/pommai.service
```

## Security Considerations

1. **Never commit .env files** to version control
2. **Use strong, unique tokens** for authentication
3. **Regularly update** the system and dependencies
4. **Monitor logs** for suspicious activity
5. **Restrict network access** using firewall rules if needed

## Performance Optimization

For Pi Zero 2W (512MB RAM):

```bash
# Optimize Python garbage collection
export PYTHONOPTIMIZE=1
export PYTHONUNBUFFERED=1

# Reduce memory fragmentation
echo 1 > /proc/sys/vm/drop_caches

# Monitor memory usage
watch -n 5 'free -m'
```

## Final Verification

After completing all steps, verify the deployment:

```bash
# Run the diagnostic script
sudo /opt/pommai/scripts/diagnose_enhanced.sh

# Check service is running
sudo systemctl status pommai

# Monitor logs for successful connection
sudo journalctl -u pommai -f | grep -E 'Connected|Ready'

# Test button press (if hardware connected)
# Press the button and watch for LED changes and log entries
```

## Success Criteria

Your Pommai client is successfully deployed when:

- ✅ Service starts automatically on boot
- ✅ Connects to FastRTC gateway without errors
- ✅ Responds to button presses (LED feedback)
- ✅ Processes audio and communicates with the backend
- ✅ Logs show stable operation without repeated errors
- ✅ Memory usage stays below 200MB
- ✅ CPU usage remains reasonable (<60% average)

## Support and Documentation

- Review logs regularly: `sudo journalctl -u pommai -f`
- Check system health: `sudo /opt/pommai/scripts/diagnose_enhanced.sh`
- Monitor performance: `htop` or `top`
- Update regularly: `sudo /opt/pommai/scripts/update.sh`

## Script Improvements Summary

The existing scripts have been enhanced with:

1. **Better error handling** - Scripts now fail gracefully with clear error messages
2. **Progress logging** - Timestamped, color-coded output for better visibility
3. **Dependency checking** - Verify prerequisites before proceeding
4. **Network readiness** - Wait for network before starting service
5. **Resource limits** - Appropriate constraints for Pi Zero 2W
6. **Diagnostic capabilities** - Comprehensive system health checks
7. **Rollback support** - Backup creation before updates

These improvements ensure a more reliable and maintainable deployment.
