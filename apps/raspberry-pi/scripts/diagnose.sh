#!/bin/bash
#
# Pommai Diagnostic Script
# Helps diagnose common issues with the Pommai client
#

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Pommai Diagnostic Tool${NC}"
echo "===================="
echo ""
echo "Running system diagnostics..."
echo ""

# Function to check status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# System Information
echo -e "${YELLOW}System Information:${NC}"
echo -n "Hostname: "; hostname
echo -n "OS: "; cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2
echo -n "Kernel: "; uname -r
echo -n "Architecture: "; uname -m
echo -n "Memory: "; free -h | grep Mem | awk '{print $2 " total, " $3 " used"}'
echo -n "Disk: "; df -h / | tail -1 | awk '{print $2 " total, " $3 " used (" $5 ")"}'
echo ""

# Check Hardware
echo -e "${YELLOW}Hardware Checks:${NC}"

# Check if running on Raspberry Pi
if grep -q "Raspberry Pi" /proc/cpuinfo; then
    MODEL=$(cat /proc/cpuinfo | grep "Model" | cut -d':' -f2 | xargs)
    check_status 0 "Raspberry Pi detected: $MODEL"
else
    check_status 1 "Not running on Raspberry Pi"
fi

# Check I2C
if lsmod | grep -q i2c_dev; then
    check_status 0 "I2C kernel module loaded"
else
    check_status 1 "I2C kernel module not loaded"
fi

# Check for ReSpeaker
if aplay -l 2>/dev/null | grep -q "seeed"; then
    check_status 0 "ReSpeaker audio device detected"
else
    check_status 1 "ReSpeaker audio device not found"
fi

# Check GPIO access
if [ -e /sys/class/gpio ]; then
    check_status 0 "GPIO interface available"
else
    check_status 1 "GPIO interface not available"
fi

echo ""

# Check Software Dependencies
echo -e "${YELLOW}Software Dependencies:${NC}"

# Python version
if command -v python3.9 &> /dev/null; then
    PY_VERSION=$(python3.9 --version 2>&1 | cut -d' ' -f2)
    check_status 0 "Python 3.9 installed ($PY_VERSION)"
else
    check_status 1 "Python 3.9 not found"
fi

# Check for required system packages
PACKAGES=("portaudio19-dev" "libopus0" "sqlite3" "alsa-utils")
for pkg in "${PACKAGES[@]}"; do
    if dpkg -l | grep -q "^ii  $pkg"; then
        check_status 0 "$pkg installed"
    else
        check_status 1 "$pkg not installed"
    fi
done

echo ""

# Check Pommai Installation
echo -e "${YELLOW}Pommai Installation:${NC}"

POMMAI_HOME="/home/pommai"
POMMAI_APP_DIR="$POMMAI_HOME/app"

# Check user exists
if id "pommai" &>/dev/null; then
    check_status 0 "Pommai user exists"
    # Check user groups
    GROUPS=$(groups pommai 2>/dev/null | cut -d':' -f2)
    echo "  User groups:$GROUPS"
else
    check_status 1 "Pommai user not found"
fi

# Check directories
DIRS=("$POMMAI_APP_DIR" "$POMMAI_HOME/models" "$POMMAI_HOME/audio_responses" "/var/log/pommai")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        check_status 0 "Directory exists: $dir"
    else
        check_status 1 "Directory missing: $dir"
    fi
done

# Check main application file
if [ -f "$POMMAI_APP_DIR/pommai_client.py" ]; then
    check_status 0 "Main application file found"
else
    check_status 1 "Main application file missing"
fi

# Check virtual environment
if [ -d "$POMMAI_APP_DIR/venv" ]; then
    check_status 0 "Python virtual environment exists"
    
    # Check installed packages
    if [ -f "$POMMAI_APP_DIR/venv/bin/pip" ]; then
        echo "  Checking Python packages..."
        REQUIRED_PACKAGES=("websockets" "pyaudio" "RPi.GPIO" "vosk" "aiofiles")
        for pkg in "${REQUIRED_PACKAGES[@]}"; do
            if $POMMAI_APP_DIR/venv/bin/pip show $pkg &>/dev/null; then
                echo -e "  ${GREEN}✓${NC} $pkg installed"
            else
                echo -e "  ${RED}✗${NC} $pkg not installed"
            fi
        done
    fi
else
    check_status 1 "Python virtual environment not found"
fi

# Check Vosk model
if [ -d "$POMMAI_HOME/models/vosk-model-small-en-us-0.15" ]; then
    check_status 0 "Vosk model downloaded"
else
    check_status 1 "Vosk model not found"
fi

echo ""

# Check Configuration
echo -e "${YELLOW}Configuration:${NC}"

if [ -f "$POMMAI_APP_DIR/.env" ]; then
    check_status 0 ".env file exists"
    
    # Check required variables (without showing values)
    source $POMMAI_APP_DIR/.env
    [ -n "$CONVEX_URL" ] && check_status 0 "CONVEX_URL configured" || check_status 1 "CONVEX_URL not set"
    [ -n "$POMMAI_USER_TOKEN" ] && check_status 0 "POMMAI_USER_TOKEN configured" || check_status 1 "POMMAI_USER_TOKEN not set"
    [ -n "$POMMAI_TOY_ID" ] && check_status 0 "POMMAI_TOY_ID configured" || check_status 1 "POMMAI_TOY_ID not set"
else
    check_status 1 ".env file not found"
fi

echo ""

# Check Service Status
echo -e "${YELLOW}Service Status:${NC}"

if systemctl is-enabled pommai &>/dev/null; then
    check_status 0 "Pommai service is enabled"
else
    check_status 1 "Pommai service is not enabled"
fi

if systemctl is-active --quiet pommai; then
    check_status 0 "Pommai service is running"
    
    # Get service details
    echo "  Service uptime: $(systemctl show pommai --property=ActiveEnterTimestamp | cut -d'=' -f2-)"
    
    # Check recent logs for errors
    ERROR_COUNT=$(journalctl -u pommai --since "1 hour ago" | grep -c ERROR || true)
    if [ $ERROR_COUNT -gt 0 ]; then
        echo -e "  ${YELLOW}Warning: $ERROR_COUNT errors in last hour${NC}"
    fi
else
    check_status 1 "Pommai service is not running"
    
    # Show last error if service failed
    if systemctl is-failed --quiet pommai; then
        echo -e "  ${RED}Service failed. Last error:${NC}"
        journalctl -u pommai -n 5 --no-pager | sed 's/^/  /'
    fi
fi

echo ""

# Check Network Connectivity
echo -e "${YELLOW}Network Connectivity:${NC}"

# Check internet connection
if ping -c 1 -W 2 google.com &>/dev/null; then
    check_status 0 "Internet connection available"
else
    check_status 1 "No internet connection"
fi

# Check if we can resolve Convex URL
if [ -n "$CONVEX_URL" ]; then
    CONVEX_HOST=$(echo $CONVEX_URL | sed -E 's|^wss?://([^/]+).*|\1|' | cut -d':' -f1)
    if host $CONVEX_HOST &>/dev/null; then
        check_status 0 "Can resolve Convex host: $CONVEX_HOST"
    else
        check_status 1 "Cannot resolve Convex host: $CONVEX_HOST"
    fi
fi

echo ""

# Check Audio System
echo -e "${YELLOW}Audio System:${NC}"

# Check ALSA
if command -v aplay &> /dev/null; then
    check_status 0 "ALSA installed"
    
    # List audio devices
    echo "  Playback devices:"
    aplay -l 2>/dev/null | grep "^card" | sed 's/^/    /'
    
    echo "  Capture devices:"
    arecord -l 2>/dev/null | grep "^card" | sed 's/^/    /'
else
    check_status 1 "ALSA not installed"
fi

echo ""

# Performance Metrics
echo -e "${YELLOW}Current Performance:${NC}"
echo -n "CPU Usage: "
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}'

echo -n "Memory Usage: "
free | grep Mem | awk '{print int($3/$2 * 100) "%"}'

echo -n "Temperature: "
if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    TEMP=$(cat /sys/class/thermal/thermal_zone0/temp)
    echo "$((TEMP/1000))°C"
else
    echo "N/A"
fi

echo ""

# Summary
echo -e "${BLUE}Diagnostic Summary:${NC}"
echo "=================="

# Count issues
ISSUES=0
[ ! -f "$POMMAI_APP_DIR/.env" ] && ((ISSUES++))
[ -z "$POMMAI_USER_TOKEN" ] && ((ISSUES++))
[ -z "$POMMAI_TOY_ID" ] && ((ISSUES++))
systemctl is-active --quiet pommai || ((ISSUES++))

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}All checks passed! System appears to be configured correctly.${NC}"
else
    echo -e "${YELLOW}Found $ISSUES potential issues. Please review the output above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "1. Complete configuration: sudo nano $POMMAI_APP_DIR/.env"
    echo "2. Start service: sudo systemctl start pommai"
    echo "3. Check logs: sudo journalctl -u pommai -f"
    echo "4. Re-run setup: sudo /path/to/setup.sh"
fi

echo ""
echo "For more help, visit: https://docs.pommai.com/troubleshooting"
