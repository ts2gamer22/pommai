# Raspberry Pi Zero 2W Setup Guide

## Hardware Requirements

### Core Components
1. **Raspberry Pi Zero 2W**
   - Quad-core ARM Cortex-A53 @ 1GHz
   - 512MB RAM
   - Built-in WiFi/Bluetooth
   - MicroSD card slot

2. **ReSpeaker 2-Mics Pi HAT**
   - WM8960 audio codec
   - Dual microphones for voice capture
   - 3 programmable RGB LEDs
   - User button (GPIO17)
   - 3.5mm audio jack

3. **Storage**
   - 32GB microSD card (Class 10 minimum)
   - Industrial-grade recommended for reliability

4. **Power Supply**
   - 10,000mAh USB power bank (5V/3A output)
   - Must support "always-on" mode
   - Recommended: Anker PowerCore 10000 PD Redux

5. **Cooling**
   - Passive heatsink (mandatory)
   - Operating temps: 47°C idle, 67-80°C under load

## Operating System Setup

### DietPi Installation
```bash
# Download DietPi for Pi Zero 2W (32-bit mandatory)
# Use the 32-bit ARMv7 image - NOT 64-bit!
# Important: Pi Zero 2W has only 512MB RAM, 32-bit OS is required for memory efficiency
wget https://dietpi.com/downloads/images/DietPi_RPi-ARMv7-Bookworm.img.xz

# Flash to SD card using Balena Etcher or dd
sudo dd if=DietPi_RPi-ARMv7-Bookworm.img of=/dev/sdX bs=4M status=progress

# Initial configuration
# - Set GPU memory to 16MB (headless operation)
# - Increase swap: 100MB → 1024MB
```

### DietPi Configuration
```bash
# /boot/dietpi.txt
AUTO_SETUP_LOCALE=en_US.UTF-8
AUTO_SETUP_KEYBOARD_LAYOUT=us
AUTO_SETUP_TIMEZONE=America/New_York
AUTO_SETUP_NET_ETHERNET_ENABLED=0
AUTO_SETUP_NET_WIFI_ENABLED=1
AUTO_SETUP_NET_WIFI_COUNTRY_CODE=US
AUTO_SETUP_NET_HOSTNAME=pommai-toy
AUTO_SETUP_HEADLESS=1
AUTO_SETUP_AUTOSTART_TARGET_INDEX=7  # Console auto-login

# /boot/config.txt
gpu_mem=16
dtparam=audio=on
dtoverlay=seeed-2mic-voicecard
```

## GPIO Pin Mapping (ReSpeaker 2-Mics HAT)

### Pin Configuration
```python
# GPIO Pin Assignments
BUTTON_PIN = 17        # User button
LED_RED_PIN = 5        # Red LED
LED_GREEN_PIN = 6      # Green LED  
LED_BLUE_PIN = 13      # Blue LED

# I2C for Audio Codec
I2C_SDA = 2           # I2C data
I2C_SCL = 3           # I2C clock

# I2S for Audio
I2S_BCLK = 18         # Bit clock
I2S_LRCLK = 19        # Left/Right clock
I2S_DIN = 20          # Data in (microphone)
I2S_DOUT = 21         # Data out (speaker)
```

### GPIO Library Setup
```python
import RPi.GPIO as GPIO

# Initialize GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

# Setup button with pull-up
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# Setup LEDs as outputs
for pin in [LED_RED_PIN, LED_GREEN_PIN, LED_BLUE_PIN]:
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, GPIO.LOW)

# Setup PWM for LED effects
pwm_red = GPIO.PWM(LED_RED_PIN, 1000)    # 1kHz frequency
pwm_green = GPIO.PWM(LED_GREEN_PIN, 1000)
pwm_blue = GPIO.PWM(LED_BLUE_PIN, 1000)

# Start PWM with 0% duty cycle
for pwm in [pwm_red, pwm_green, pwm_blue]:
    pwm.start(0)
```

## Software Dependencies Installation

### System Packages
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install audio dependencies
sudo apt install -y \
    python3-pip \
    python3-dev \
    python3-numpy \
    libasound2-dev \
    portaudio19-dev \
    libportaudio2 \
    libatlas-base-dev \
    python3-pyaudio \
    alsa-utils \
    libopus0 \
    libopus-dev \
    flac \
    git

# Install build tools (for compiling)
sudo apt install -y \
    build-essential \
    cmake \
    pkg-config
```

### Python Environment Setup
```bash
# Create virtual environment
python3 -m venv /home/pommai/app/venv
source /home/pommai/app/venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install Python packages
pip install \
    websockets==12.0 \
    pyaudio==0.2.14 \
    RPi.GPIO==0.7.1 \
    vosk==0.3.45 \
    aiofiles==23.2.1 \
    python-dotenv==1.0.0 \
    psutil==5.9.8 \
    numpy==1.24.3
```

### Vosk Model Installation
```bash
# Download small English model for wake word
mkdir -p /home/pommai/models
cd /home/pommai/models
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
rm vosk-model-small-en-us-0.15.zip
```

## Audio Configuration

### ALSA Configuration
```bash
# /etc/asound.conf
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
```

### Test Audio Hardware
```bash
# List audio devices
aplay -l
arecord -l

# Test recording (5 seconds)
arecord -D hw:seeed2micvoicec,0 -f S16_LE -r 16000 -c 2 -d 5 test.wav

# Test playback
aplay -D hw:seeed2micvoicec,0 test.wav

# Adjust volume
alsamixer -c seeed2micvoicec
```

## File System Optimization

### Read-Only Root Filesystem
```bash
# Enable overlay filesystem
sudo dietpi-drive_manager

# Select "Read-Only" mode for root partition
# This prevents SD card corruption from power loss
```

### Directory Structure
```
/home/pommai/
├── app/
│   ├── pommai_client_fastrtc.py  # Main FastRTC client entrypoint
│   ├── fastrtc_connection.py     # FastRTC WebSocket handler
│   ├── audio_stream_manager.py   # Audio capture/playback
│   ├── led_controller.py         # LED patterns
│   ├── button_handler.py         # GPIO button handling
│   ├── wake_word_detector.py     # Wake word detection
│   ├── conversation_cache.py     # Offline mode support
│   ├── opus_audio_codec.py       # Audio compression
│   ├── venv/                     # Python virtual environment
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Environment variables
├── models/
│   └── vosk-model-small-en-us-0.15/  # Wake word model
├── audio_responses/              # Offline audio files
├── scripts/                      # Deployment/maintenance scripts
│   ├── setup.sh                  # Initial setup script
│   ├── update.sh                 # Update script
│   └── diagnose.sh               # Diagnostic tool
└── logs/                         # Application logs
```

## Environment Configuration

### Create .env file
```bash
# /home/pommai/app/.env
# FastRTC Gateway (canonical variables)
FASTRTC_GATEWAY_URL=wss://your-fastrtc-gateway.example.com/ws
AUTH_TOKEN=your_auth_token_here
DEVICE_ID=rpi-toy-001
TOY_ID=default-toy

# Audio settings
SAMPLE_RATE=16000
CHUNK_SIZE=1024
CHANNELS=1

# Paths
VOSK_MODEL_PATH=/home/pommai/models/vosk-model-small-en-us-0.15
CACHE_DB_PATH=/tmp/pommai_cache.db
AUDIO_RESPONSES_PATH=/home/pommai/audio_responses

# Features
ENABLE_WAKE_WORD=false
ENABLE_OFFLINE_MODE=true

# Legacy variables (backward compatibility)
# The client will automatically fallback to these if set:
# CONVEX_URL → maps to FASTRTC_GATEWAY_URL
# POMMAI_USER_TOKEN → maps to AUTH_TOKEN  
# POMMAI_TOY_ID → maps to TOY_ID
```

## Systemd Service Setup

### Create service file
```ini
# /etc/systemd/system/pommai.service
[Unit]
Description=Pommai Smart Toy Client
After=network-online.target sound.target
Wants=network-online.target

[Service]
Type=simple
User=pommai
Group=pommai
WorkingDirectory=/home/pommai/app
Environment="PATH=/home/pommai/app/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="PYTHONPATH=/home/pommai/app"
ExecStart=/home/pommai/app/venv/bin/python /home/pommai/app/pommai_client_fastrtc.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security settings (relaxed for GPIO/I2C/SPI)
NoNewPrivileges=true
PrivateTmp=false
ProtectSystem=false
ProtectHome=false
ReadWritePaths=/home/pommai /tmp /var/log/pommai

# Resource limits
MemoryMax=200M
CPUQuota=60%

[Install]
WantedBy=multi-user.target
```

### Enable service
```bash
# Create pommai user
sudo useradd -m -s /bin/bash pommai
sudo usermod -a -G audio,gpio,i2c,spi pommai

# Set permissions
sudo chown -R pommai:pommai /home/pommai
sudo chmod +x /home/pommai/app/pommai_client_fastrtc.py

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable pommai.service
sudo systemctl start pommai.service

# Check status
sudo systemctl status pommai.service
sudo journalctl -u pommai.service -f
```

## Performance Optimization

### Memory Management
```bash
# Increase swap size
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Monitor memory usage
free -h
```

### CPU Governor
```bash
# Set to performance mode
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Make persistent
echo 'echo performance > /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor' | sudo tee /etc/rc.local
```

## Troubleshooting

### Common Issues

1. **Audio not working**
   ```bash
   # Check if ReSpeaker is detected
   dmesg | grep seeed
   i2cdetect -y 1
   ```

2. **GPIO permission errors**
   ```bash
   # Add user to gpio group
   sudo usermod -a -G gpio $USER
   # Logout and login again
   ```

3. **High CPU usage**
   ```bash
   # Check running processes
   htop
   # Disable unnecessary services
   sudo dietpi-services
   ```

4. **WiFi connection issues**
   ```bash
   # Check WiFi status
   iwconfig
   # Reconfigure WiFi
   sudo dietpi-config
   ```

## Security Hardening

### Firewall Configuration
```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp  # SSH (disable in production)
sudo ufw enable
```

### SSH Hardening (Development Only)
```bash
# Disable password authentication
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

## Monitoring and Logging

### System Monitoring Script
```python
#!/usr/bin/env python3
# /opt/pommai/client/monitor.py

import psutil
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def monitor_system():
    while True:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        temperature = psutil.sensors_temperatures()['cpu_thermal'][0].current
        
        logger.info(f"CPU: {cpu_percent}% | RAM: {memory.percent}% | Temp: {temperature}°C")
        
        if temperature > 75:
            logger.warning(f"High temperature: {temperature}°C")
            
        time.sleep(60)

if __name__ == "__main__":
    monitor_system()
```

## Backup and Recovery

### Create System Backup
```bash
# Backup SD card image
sudo dd if=/dev/mmcblk0 of=pommai-backup.img bs=4M status=progress

# Backup configuration files
tar -czf pommai-config-backup.tar.gz /opt/pommai/client/.env /etc/systemd/system/pommai.service
```

This comprehensive setup guide ensures the Raspberry Pi Zero 2W is properly configured for the Pommai smart toy client with optimal performance and reliability.
