#!/bin/bash
#
# Pommai Client Update Script
# Updates the Pommai client to the latest version
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Configuration
POMMAI_USER="pommai"
POMMAI_HOME="/home/pommai"
POMMAI_APP_DIR="$POMMAI_HOME/app"
BACKUP_DIR="$POMMAI_HOME/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}Pommai Client Update Script${NC}"
echo "=========================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}" 
   exit 1
fi

# Check if service is running
if systemctl is-active --quiet pommai; then
    SERVICE_WAS_RUNNING=true
    echo -e "${YELLOW}Pommai service is running, will restart after update${NC}"
else
    SERVICE_WAS_RUNNING=false
fi

echo -e "${GREEN}Step 1: Creating Backup${NC}"
mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/pommai_backup_$TIMESTAMP.tar.gz"

# Stop service if running
if [ "$SERVICE_WAS_RUNNING" = true ]; then
    echo "Stopping pommai service..."
    systemctl stop pommai
fi

# Create backup
cd $POMMAI_HOME
tar -czf $BACKUP_FILE app/ --exclude='app/venv' --exclude='app/__pycache__' --exclude='app/*.pyc'
echo -e "${GREEN}Backup created: $BACKUP_FILE${NC}"

echo -e "${GREEN}Step 2: Checking for Updates${NC}"
cd /tmp

# If git repo URL is provided as argument, use it
if [ -n "$1" ]; then
    REPO_URL="$1"
else
    REPO_URL="https://github.com/yourusername/pommai.git"
fi

# Clone latest version
if [ -d "pommai_update" ]; then
    rm -rf pommai_update
fi
git clone --depth 1 $REPO_URL pommai_update

echo -e "${GREEN}Step 3: Comparing Versions${NC}"
# Check if there are actual changes
if [ -f "$POMMAI_APP_DIR/pommai_client.py" ] && [ -f "pommai_update/apps/raspberry-pi/src/pommai_client.py" ]; then
    if diff -q "$POMMAI_APP_DIR/pommai_client.py" "pommai_update/apps/raspberry-pi/src/pommai_client.py" >/dev/null; then
        echo -e "${YELLOW}No updates found - client is already up to date${NC}"
        # Cleanup
        rm -rf pommai_update
        
        # Restart service if it was running
        if [ "$SERVICE_WAS_RUNNING" = true ]; then
            systemctl start pommai
        fi
        exit 0
    fi
fi

echo -e "${GREEN}Step 4: Updating Application Files${NC}"
# Update Python files
cp pommai_update/apps/raspberry-pi/src/*.py $POMMAI_APP_DIR/

# Update scripts
if [ -d "pommai_update/apps/raspberry-pi/scripts" ]; then
    cp pommai_update/apps/raspberry-pi/scripts/*.sh $POMMAI_HOME/scripts/
    chmod +x $POMMAI_HOME/scripts/*.sh
fi

# Set correct ownership
chown -R $POMMAI_USER:$POMMAI_USER $POMMAI_APP_DIR

echo -e "${GREEN}Step 5: Updating Dependencies${NC}"
cd $POMMAI_APP_DIR
source venv/bin/activate

# Update pip first
pip install --upgrade pip

# Check if requirements.txt exists and update dependencies
if [ -f "/tmp/pommai_update/apps/raspberry-pi/requirements.txt" ]; then
    echo "Installing updated dependencies..."
    pip install -r /tmp/pommai_update/apps/raspberry-pi/requirements.txt
fi

deactivate

echo -e "${GREEN}Step 6: Updating Configuration${NC}"
# Check for new configuration options
if [ -f "/tmp/pommai_update/apps/raspberry-pi/.env.example" ]; then
    echo -e "${YELLOW}New configuration options may be available${NC}"
    echo "Please review: /tmp/pommai_update/apps/raspberry-pi/.env.example"
    echo "And update your .env file accordingly"
fi

echo -e "${GREEN}Step 7: Database Migration${NC}"
# Run any database migrations
cd $POMMAI_APP_DIR
sudo -u $POMMAI_USER python3 << EOF
import sys
sys.path.insert(0, '.')
from conversation_cache import ConversationCache
import asyncio

async def migrate():
    cache = ConversationCache()
    await cache.initialize()
    print("Database schema updated")

asyncio.run(migrate())
EOF

echo -e "${GREEN}Step 8: Cleaning Up${NC}"
# Remove update files
rm -rf /tmp/pommai_update

# Clear Python cache
find $POMMAI_APP_DIR -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find $POMMAI_APP_DIR -name "*.pyc" -delete 2>/dev/null || true

echo -e "${GREEN}Step 9: Restarting Service${NC}"
# Reload systemd in case service file was updated
systemctl daemon-reload

# Start service
if [ "$SERVICE_WAS_RUNNING" = true ] || [ "$2" = "--start" ]; then
    systemctl start pommai
    sleep 3
    
    # Check if service started successfully
    if systemctl is-active --quiet pommai; then
        echo -e "${GREEN}Pommai service started successfully${NC}"
    else
        echo -e "${RED}Failed to start pommai service${NC}"
        echo "Check logs with: journalctl -u pommai -n 50"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}Update Complete!${NC}"
echo "====================="
echo ""
echo "Changes have been applied. To verify:"
echo "1. Check service status: sudo systemctl status pommai"
echo "2. View logs: sudo journalctl -u pommai -f"
echo ""
echo "To rollback if needed:"
echo "1. Stop service: sudo systemctl stop pommai"
echo "2. Restore backup: tar -xzf $BACKUP_FILE -C $POMMAI_HOME"
echo "3. Start service: sudo systemctl start pommai"
echo ""
