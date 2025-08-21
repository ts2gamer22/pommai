# Pommai Raspberry Pi Client

This is the Raspberry Pi Zero 2W client for the Pommai smart toy platform. It provides voice interaction capabilities with multiple toy personalities, Guardian mode safety features, and offline functionality.

## Features

- **Real-time voice interaction** via WebSocket connection to Convex backend
- **Multiple toy personalities** - Switch between different AI toy configurations
- **Guardian mode** - Enhanced safety features for children
- **Offline mode** - Basic interactions when internet is unavailable
- **Wake word detection** - Hands-free activation with "Hey Pommai"
- **Hardware integration** - Button control and LED feedback via ReSpeaker HAT
- **Audio compression** - Opus codec for efficient streaming
- **Secure communication** - Token-based authentication with Convex

## Hardware Requirements

- Raspberry Pi Zero 2W (512MB RAM)
- ReSpeaker 2-Mics Pi HAT
- MicroSD card (8GB minimum)
- Power supply (5V 2.5A recommended)
- Optional: Speaker for audio output

## Software Requirements

- DietPi OS (32-bit) or Raspberry Pi OS Lite
- Python 3.9 or higher
- ALSA audio drivers
- Internet connection for initial setup

## Installation

### 1. Prepare the Raspberry Pi

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install system dependencies
sudo apt install -y python3-pip python3-venv git
sudo apt install -y portaudio19-dev python3-pyaudio
sudo apt install -y libopus0 libopus-dev
sudo apt install -y alsa-utils

# Install ReSpeaker drivers
git clone https://github.com/respeaker/seeed-voicecard
cd seeed-voicecard
sudo ./install.sh
sudo reboot
```

### 2. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/pommai.git
cd pommai/apps/raspberry-pi

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Download Vosk model
mkdir -p /home/pommai/models
cd /home/pommai/models
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
```

### 3. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

Required configuration:
- `CONVEX_URL` - Your Convex deployment WebSocket URL
- `DEVICE_ID` - Unique identifier for this device
- `POMMAI_USER_TOKEN` - Authentication token from web dashboard
- `POMMAI_TOY_ID` - Initial toy to load

### 4. Test Installation

```bash
# Test audio
python tests/test_audio.py

# Test GPIO/LEDs
python tests/test_leds.py

# Test button
python tests/test_button.py
```

## Usage

### Running the Client

```bash
# Activate virtual environment
source venv/bin/activate

# Run the client
python src/pommai_client.py
```

### Systemd Service (Recommended)

Create a systemd service for automatic startup:

```bash
sudo cp config/pommai.service /etc/systemd/system/
sudo systemctl enable pommai
sudo systemctl start pommai
```

Check service status:
```bash
sudo systemctl status pommai
sudo journalctl -u pommai -f
```

## LED Patterns

The ReSpeaker HAT LEDs indicate different states:

- **Blue breathing** - Idle, waiting for wake word
- **Blue pulse** - Listening/Recording
- **Rainbow swirl** - Processing/Thinking
- **Green solid** - Speaking
- **Red flash** - Error or offline
- **Yellow pulse** - Loading toy configuration

## Button Controls

- **Single press** - Start/stop recording (push-to-talk)
- **Long press (3s)** - Enter safe mode
- **Triple press** - Factory reset (when implemented)

## Offline Mode

When internet is unavailable, the toy provides:
- Basic greetings and responses
- Simple songs and jokes
- Safety-compliant interactions only
- Cached responses for common queries

All offline interactions are logged and synced when connection is restored.

## Troubleshooting

### No Audio Input
```bash
# Check audio devices
arecord -l
# Test recording
arecord -d 5 test.wav
```

### GPIO Permission Error
```bash
# Add user to gpio group
sudo usermod -a -G gpio $USER
# Logout and login again
```

### High CPU Usage
- Check Vosk model size (use smaller model if needed)
- Verify Opus codec is properly installed
- Monitor with `htop` or `ps aux`

### Connection Issues
- Verify CONVEX_URL is correct
- Check authentication token is valid
- Test network connectivity
- Review logs: `journalctl -u pommai -n 100`

## Development

### Project Structure
```
raspberry-pi/
├── src/
│   └── pommai_client.py    # Main client application
├── config/
│   └── pommai.service      # Systemd service file
├── audio_responses/        # Offline audio files
├── tests/                  # Test scripts
├── requirements.txt        # Python dependencies
├── .env.example           # Configuration template
└── README.md              # This file
```

### Testing
```bash
# Run all tests
pytest tests/

# Run specific test
pytest tests/test_websocket.py -v
```

### Monitoring
```bash
# Check memory usage
free -h

# Monitor CPU
top -d 1

# Check service logs
sudo journalctl -u pommai --since "1 hour ago"
```

## Security

- Device authentication uses unique tokens
- All communication is encrypted (WSS/HTTPS)
- Audio is not stored permanently
- Guardian mode enforces content filtering
- Offline mode has strict safety rules

## License

See main project LICENSE file.

## Support

For issues and questions:
1. Check troubleshooting section above
2. Review logs with `journalctl -u pommai`
3. Open an issue on GitHub
4. Contact support at support@pommai.com
