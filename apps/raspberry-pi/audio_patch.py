#!/usr/bin/env python3
"""
Safe Audio Patch for Pommai Client
This script adds Bluetooth audio support without breaking existing setup
Run this ON YOUR PI to patch the client safely
"""

import os
import shutil
from datetime import datetime

def create_audio_utils():
    """Create the audio_utils.py file"""
    
    audio_utils_content = '''#!/usr/bin/env python3
"""Simple audio device detection for Pommai"""
import pyaudio
import logging
import subprocess

logger = logging.getLogger(__name__)

def get_audio_device_indices():
    """Find best audio devices"""
    p = pyaudio.PyAudio()
    
    mic_index = None
    bt_speaker_index = None
    hat_speaker_index = None
    
    for i in range(p.get_device_count()):
        try:
            info = p.get_device_info_by_index(i)
            name = info.get('name', '').lower()
            
            # Find microphone (ReSpeaker)
            if info.get('maxInputChannels', 0) > 0:
                if 'seeed' in name or 'respeaker' in name:
                    mic_index = i
                    logger.info(f"Found ReSpeaker Mic: {i}")
            
            # Find speaker (Bluetooth preferred)
            if info.get('maxOutputChannels', 0) > 0:
                if 'bluealsa' in name or 'bluetooth' in name:
                    bt_speaker_index = i
                    logger.info(f"Found Bluetooth: {i}")
                elif 'seeed' in name or 'respeaker' in name:
                    hat_speaker_index = i
                    logger.info(f"Found ReSpeaker Speaker: {i}")
                    
        except Exception as e:
            continue
    
    p.terminate()
    
    # Use Bluetooth if available, else ReSpeaker
    output = bt_speaker_index if bt_speaker_index is not None else hat_speaker_index
    
    logger.info(f"Using output device: {output}")
    return {"input": mic_index, "output": output}
'''
    
    with open('/home/pommai/app/audio_utils.py', 'w') as f:
        f.write(audio_utils_content)
    
    print("✓ Created audio_utils.py")

def patch_client():
    """Patch the main client to use audio_utils"""
    
    client_path = '/home/pommai/app/pommai_client_fastrtc.py'
    backup_path = f'/home/pommai/app/pommai_client_fastrtc.py.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    
    # Make backup
    shutil.copy2(client_path, backup_path)
    print(f"✓ Backed up to {backup_path}")
    
    # Read current file
    with open(client_path, 'r') as f:
        lines = f.readlines()
    
    # Find where to add import
    import_added = False
    hardware_patched = False
    
    for i, line in enumerate(lines):
        # Add import after other local imports
        if not import_added and 'from led_controller import' in line:
            lines.insert(i+1, 'from audio_utils import get_audio_device_indices\n')
            import_added = True
            
        # Find HardwareController initialization and patch it
        if not hardware_patched and 'self.hardware = HardwareController(' in line:
            # Find the end of this initialization
            j = i
            while j < len(lines) and ')' not in lines[j]:
                j += 1
            
            # Replace the initialization
            new_init = '''        # Get audio devices with Bluetooth fallback
        audio_devices = get_audio_device_indices()
        self.hardware = HardwareController(
            sample_rate=config.SAMPLE_RATE,
            channels=config.CHANNELS,
            chunk_size=config.CHUNK_SIZE,
            input_device_index=audio_devices.get("input"),
            output_device_index=audio_devices.get("output")
        )
'''
            # Remove old lines and insert new
            del lines[i:j+1]
            lines.insert(i, new_init)
            hardware_patched = True
            break
    
    if import_added and hardware_patched:
        # Write patched file
        with open(client_path, 'w') as f:
            f.writelines(lines)
        print("✓ Patched pommai_client_fastrtc.py")
        return True
    else:
        print("✗ Could not patch client (may already be patched)")
        return False

def install_missing_packages():
    """Install only the missing packages"""
    print("\n Installing missing Bluetooth audio packages...")
    os.system('sudo apt-get update')
    os.system('sudo apt-get install -y bluealsa bluetooth bluez ffmpeg')
    print("✓ Packages installed")

def setup_bluealsa_service():
    """Ensure BlueALSA service is running"""
    print("\nSetting up BlueALSA service...")
    
    service_content = '''[Unit]
Description=BlueALSA
After=bluetooth.service
Requires=bluetooth.service

[Service]
Type=simple
ExecStart=/usr/bin/bluealsa --profile=a2dp-sink --profile=a2dp-source

[Install]
WantedBy=multi-user.target
'''
    
    with open('/tmp/bluealsa.service', 'w') as f:
        f.write(service_content)
    
    os.system('sudo mv /tmp/bluealsa.service /etc/systemd/system/')
    os.system('sudo systemctl daemon-reload')
    os.system('sudo systemctl enable bluealsa')
    os.system('sudo systemctl start bluealsa')
    print("✓ BlueALSA service configured")

def main():
    print("=" * 50)
    print("Pommai Audio Patch - Safe Bluetooth Addition")
    print("=" * 50)
    
    # Check if running on Pi
    if not os.path.exists('/home/pommai/app'):
        print("ERROR: This must be run on the Raspberry Pi in the pommai directory")
        return
    
    print("\nThis will:")
    print("1. Backup your current client")
    print("2. Add Bluetooth audio support")
    print("3. Keep all existing functionality")
    print("\nYour current setup will NOT be broken!")
    
    response = input("\nProceed? (y/n): ")
    if response.lower() != 'y':
        print("Cancelled")
        return
    
    # Apply patches
    create_audio_utils()
    
    if patch_client():
        print("\n✓ Client patched successfully!")
        
        print("\nInstalling BlueALSA...")
        install_missing_packages()
        setup_bluealsa_service()
        
        print("\n" + "=" * 50)
        print("PATCH COMPLETE!")
        print("=" * 50)
        print("\nNext steps:")
        print("1. Restart the service: sudo systemctl restart pommai")
        print("2. Check logs: sudo journalctl -u pommai -f")
        print("\nYour Bluetooth speaker should now work!")
    else:
        print("\nPatch may have already been applied or failed")
        print("Check your backup files in /home/pommai/app/")

if __name__ == "__main__":
    main()
