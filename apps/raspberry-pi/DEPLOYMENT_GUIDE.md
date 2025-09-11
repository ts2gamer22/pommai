# Pommai Client Deployment (Raspberry Pi OS Lite 64-bit)

This guide gives you exact, copy-paste steps to deploy the Pommai Raspberry Pi client on Raspberry Pi OS Lite (64-bit, Bookworm). It configures the ReSpeaker 2‑Mics HAT (ALSA), installs dependencies, creates a systemd service, and starts the client.

If you previously followed DietPi instructions, ignore them. This guide replaces all older DietPi-specific steps.

---

## What you need
- Raspberry Pi Zero 2W with Raspberry Pi OS Lite (64-bit) Bookworm
- ReSpeaker 2‑Mics Pi HAT installed on the GPIO header
- Wi‑Fi with internet access and SSH enabled
- A small speaker (3.5mm or attached to the HAT’s output)
- Your PC on the same network, running the FastRTC Gateway (for local dev) or a hosted gateway

Tip: On first boot, ensure you set a password and enable SSH via Raspberry Pi Imager’s advanced options.

---

## Step 1 — SSH into your Pi

```bash
# Replace <PI_IP> and <USERNAME> as needed (default user is usually 'pi')
ssh <USERNAME>@<PI_IP>
```

---

## Step 2 — Copy the client folder to the Pi (from your PC)

Windows PowerShell (on your PC):
```powershell
# From the root of your project on your PC
# 1) Create a zip with the Raspberry Pi client files
Compress-Archive -Force -Path .\apps\raspberry-pi\* -DestinationPath .\pommai-raspi.zip

# 2) Copy the zip to your Pi (requires OpenSSH client on Windows)
scp .\pommai-raspi.zip <USERNAME>@<PI_IP>:/home/<USERNAME>/
```

Back on the Pi:
```bash
# Create a working directory and extract the files
mkdir -p ~/pommai-setup
unzip -q ~/pommai-raspi.zip -d ~/pommai-setup
cd ~/pommai-setup
```

---

## Step 3 — One-time setup (installs deps, drivers, service)

Run the provided setup script from the project you just copied. It:
- Installs system packages, PyAudio, Opus, SQLite, etc.
- Enables I2C/SPI and installs the ReSpeaker driver
- Creates a dedicated user (pommai) and a Python venv
- Writes ALSA defaults for the ReSpeaker HAT
- Creates the systemd service to auto-start the client

```bash
# IMPORTANT: run from the directory that contains src/ and scripts/
# The script will handle Raspberry Pi OS Bookworm’s /boot/firmware/config.txt automatically.
sudo bash scripts/setup.sh
```

If prompted to reboot for hardware overlays, you can reboot at the end (or continue now and reboot later).

---

## Step 4 — Configure your environment (.env)

```bash
# Edit the .env created by the setup script
sudo nano /home/pommai/app/.env
```

Replace values as needed. This annotated template shows what each variable means:

```bash
# ================= Pommai Client Configuration (.env) =================

# FastRTC Gateway WebSocket URL
# - For local testing: point to your PC running the gateway in Docker (change 192.168.x.x)
# - For hosted gateway: use your wss:// endpoint
FASTRTC_GATEWAY_URL=ws://192.168.1.100:8080/ws

# AUTH_TOKEN: Access token for your gateway (if your server requires auth)
# - For local dev, you can leave this empty if auth is disabled on your gateway
# - Never print or commit this token
AUTH_TOKEN=

# DEVICE_ID: Stable, unique ID for this hardware device
# - Choose any descriptive string; must stay the same across reboots
# - Used by the server to associate metrics and sync batches with this device
DEVICE_ID=rpi-zero2w-001

# TOY_ID: Which toy/personality/config to load on the server
# - Must match a configuration known to your gateway/server
# - For local dev, 'default-toy' is fine if your server accepts it
TOY_ID=default-toy

# Paths (defaults are fine unless you customized setup locations)
VOSK_MODEL_PATH=/home/pommai/models/vosk-model-small-en-us-0.15
CACHE_DB_PATH=/tmp/pommai_cache.db
AUDIO_RESPONSES_PATH=/home/pommai/audio_responses

# Optional features
# - Enable wake word only if needed (adds CPU load on Pi Zero 2W)
ENABLE_WAKE_WORD=false
# - Keep offline mode enabled to cache conversations and metrics
ENABLE_OFFLINE_MODE=true
# =====================================================================
```

Save and exit (Ctrl+O, Enter, Ctrl+X). Then secure the file:
```bash
sudo chown pommai:pommai /home/pommai/app/.env
sudo chmod 600 /home/pommai/app/.env
```

---

## Step 5 — Start the service and tail logs

```bash
# Enable on boot and start now
sudo systemctl enable pommai
sudo systemctl start pommai

# Follow logs (Ctrl+C to stop)
sudo journalctl -u pommai -f
```

You should see logs showing a WebSocket connection to your gateway and audio initialization.

---

## Step 6 — Verify audio and HAT

```bash
# List playback and capture devices (should show 'seeed' card)
aplay -l
arecord -l

# Quick speaker test (1 kHz tone for ~2 seconds)
timeout 2 speaker-test -t sine -f 1000 -c 2 >/dev/null 2>&1 || echo "Speaker test may have been skipped"

# Optional: record 3 seconds and play back
arecord -d 3 -f S16_LE -r 16000 -c 1 /tmp/test.wav && aplay /tmp/test.wav
```

If you don’t see the seeed device or you get audio errors, reboot:
```bash
sudo reboot
```

---

## Optional: Bluetooth audio (BlueALSA)
The default path is ALSA directly to the ReSpeaker HAT. If you later want Bluetooth audio output via BlueALSA, you can re-run setup with a playback profile override:
```bash
# Rerun setup to write a BlueALSA-focused /etc/asound.conf (experimental)
cd ~/pommai-setup
sudo AUDIO_PLAYBACK_PROFILE=bluealsa bash scripts/setup.sh
```
Make sure your Bluetooth speaker is paired and set as the default sink first.

---

## What the key settings mean
- AUTH_TOKEN: A bearer token the gateway uses to authenticate this device. Omit for local dev if your gateway doesn’t require auth. Keep it secret.
- DEVICE_ID: A stable identifier for the physical Pi. Pick something unique and persistent. Used for metrics and sync tracking.
- TOY_ID: The toy/personality/config to load on the server. Your server should recognize this string and return the right settings.
- FASTRTC_GATEWAY_URL: The WebSocket URL the client connects to. For local dev, point it at your PC’s LAN IP: ws://<your-pc-ip>:8080/ws.

---

## Quick troubleshooting
```bash
# Follow logs
sudo journalctl -u pommai -f

# Check service status
sudo systemctl status pommai --no-pager

# Confirm gateway hostname is resolvable and reachable
# (replace URL from your .env)
getent hosts $(echo $(grep ^FASTRTC_GATEWAY_URL= /home/pommai/app/.env | cut -d= -f2) | sed -E 's|^wss?://([^/:]+).*|\1|')
```

If audio devices don’t show up, check overlays were written to /boot/firmware/config.txt (Bookworm) or /boot/config.txt (older) and reboot.

---

## Success checklist
- Service is running: `sudo systemctl is-active pommai` returns active
- Logs show “Successfully connected to FastRTC gateway”
- LED feedback changes when listening/speaking (on Pi)
- You hear TTS playback from the speaker

That’s it. Your Pommai Raspberry Pi client should now be up and running on Raspberry Pi OS Lite (64-bit).
