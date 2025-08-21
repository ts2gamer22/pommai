# Phase 3 Context Documentation Index

## Overview
This folder contains comprehensive documentation for implementing Phase 3 of the Pommai project - the Raspberry Pi Zero 2W client. These documents provide all necessary context for building a reliable, safe, and efficient smart toy client.

## Documentation Files

### 1. [websocket-api.md](./websocket-api.md)
**WebSocket API Protocol Documentation**
- Connection establishment with Convex backend
- Authentication headers and handshake protocol
- Message types for audio streaming, toy configuration, and safety
- Error handling and reconnection strategies
- Python implementation examples

**Key Topics:**
- Audio chunk streaming protocol
- Toy configuration management
- Guardian mode messages
- Real-time conversation sync
- Connection state management

### 2. [audio-streaming-protocol.md](./audio-streaming-protocol.md)
**Audio Streaming Protocol Documentation**
- PCM audio format specifications (16kHz, 16-bit, mono)
- Opus compression configuration for 10:1 ratio
- PyAudio setup for ReSpeaker HAT
- Real-time streaming architecture
- Latency optimization strategies (<260ms target)

**Key Topics:**
- Frame size optimization (20ms recommended)
- Buffering strategies for smooth playback
- Error handling for audio underrun/overrun
- Memory management for Pi Zero 2W constraints
- Performance monitoring

### 3. [raspberry-pi-setup.md](./raspberry-pi-setup.md)
**Raspberry Pi Zero 2W Hardware Setup Guide**
- Complete hardware requirements and configuration
- DietPi OS installation and optimization
- GPIO pin mapping for ReSpeaker 2-Mics HAT
- Software dependencies and Python environment
- Systemd service configuration

**Key Topics:**
- Memory optimization (512MB constraint)
- Audio device configuration
- Security hardening
- Performance tuning
- Troubleshooting common issues

### 4. [offline-safety-rules.md](./offline-safety-rules.md)
**Offline Safety Rules Documentation**
- Guardian mode enforcement without internet
- Pre-approved safe commands whitelist
- Blocked topics and automatic redirection
- Emergency safety protocols
- Parent notification queuing

**Key Topics:**
- Safety level enforcement (strict/moderate/relaxed)
- Triple button press safe mode
- Conversation time limits
- Incident logging for parent review
- Testing safety scenarios

### 5. [opus-codec-config.md](./opus-codec-config.md)
**Opus Audio Codec Configuration Guide**
- Why Opus for voice (24kbps, <26.5ms latency)
- Encoder/decoder configuration
- Frame size selection (20ms optimal)
- Dynamic bitrate adaptation
- PyAudio integration

**Key Topics:**
- Voice optimization settings
- Packet loss resilience (FEC)
- Memory-efficient buffering
- Performance benchmarking
- Troubleshooting audio quality

### 6. [gpio-control.md](./gpio-control.md)
**GPIO Control Documentation**
- ReSpeaker HAT GPIO pin mapping
- LED pattern implementations for all states
- Button handling with debouncing
- Multi-press and long-press detection
- Power management for battery life

**Key Topics:**
- Visual feedback patterns
- Button callback management
- Advanced LED effects
- Testing scripts
- Best practices for GPIO

## Quick Reference

### Key Python Dependencies
```txt
websockets==12.0      # WebSocket client
pyaudio==0.2.14      # Audio I/O
RPi.GPIO==0.7.1      # GPIO control
vosk==0.3.45         # Wake word detection
opuslib              # Opus codec
aiofiles==23.2.1     # Async file operations
python-dotenv==1.0.0 # Environment configuration
psutil==5.9.8        # System monitoring
```

### Critical Configuration Values
```python
# Audio Settings
SAMPLE_RATE = 16000
CHUNK_SIZE = 1024
CHANNELS = 1
FRAME_SIZE = 320  # 20ms at 16kHz

# Opus Compression
BITRATE = 24000  # 24 kbps
COMPLEXITY = 5   # Balanced for Pi Zero 2W

# GPIO Pins
BUTTON_PIN = 17
LED_PINS = {'red': 5, 'green': 6, 'blue': 13}

# Performance Targets
MAX_LATENCY = 260  # ms
MAX_CPU_USAGE = 30  # %
MAX_MEMORY = 50  # MB
```

### Safety Defaults
- **Offline Mode**: Strict safety level
- **Max Conversations/Hour**: 20
- **Session Duration Limit**: 30 minutes
- **Emergency Activation**: Triple button press
- **Content Filter**: Comprehensive blocked topics list

## Implementation Checklist

### Before Starting Phase 3:
- [ ] Review all documentation files
- [ ] Set up Raspberry Pi Zero 2W with DietPi
- [ ] Install ReSpeaker 2-Mics HAT
- [ ] Configure development environment
- [ ] Test audio hardware
- [ ] Verify GPIO functionality

### During Implementation:
- [ ] Follow single-file architecture (pommai_client.py)
- [ ] Implement WebSocket connection with auth
- [ ] Set up audio streaming with Opus
- [ ] Configure offline safety rules
- [ ] Test all LED patterns
- [ ] Implement button handling
- [ ] Add SQLite caching
- [ ] Test Guardian mode

### Testing Requirements:
- [ ] Audio quality at different network conditions
- [ ] Offline mode safety compliance
- [ ] Button responsiveness
- [ ] LED pattern visibility
- [ ] Memory usage under 50MB
- [ ] CPU usage under 30%
- [ ] Battery life >8 hours
- [ ] Parent dashboard sync

### 7. [convex-integration-guide.md](./convex-integration-guide.md)
**Convex Python Integration Guide**
- Dual communication strategy (WebSocket + Convex Client)
- Device authentication flow with TPM integration
- Real-time audio streaming implementation
- File upload patterns for audio logs
- Offline sync strategy with SQLite on tmpfs
- Guardian mode and safety event reporting

**Key Topics:**
- Memory optimization strategies
- Error handling and resilience
- Complete integration example
- Best practices for Pi Zero 2W constraints
- Performance monitoring

## Additional Resources

### External Documentation
- [Vosk Speech Recognition](https://alphacephei.com/vosk/)
- [Opus Codec](https://opus-codec.org/)
- [ReSpeaker HAT Wiki](https://wiki.seeedstudio.com/ReSpeaker_2_Mics_Pi_HAT/)
- [DietPi Documentation](https://dietpi.com/docs/)
- [Convex Python Client](https://docs.convex.dev/client/python/)

### Testing Tools
- `test_audio.py` - Audio pipeline testing
- `test_button.py` - Button functionality
- `test_leds.py` - LED patterns
- `test_offline_safety.py` - Safety compliance

## Support

For questions about Phase 3 implementation:
1. Check the specific documentation file for your topic
2. Review the troubleshooting sections
3. Test with provided scripts
4. Monitor system resources during testing

This documentation set provides comprehensive guidance for implementing a safe, efficient, and delightful Raspberry Pi client for the Pommai smart toy platform.
