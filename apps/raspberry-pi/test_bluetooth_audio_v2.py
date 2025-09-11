#!/home/pommai/app/venv/bin/python
"""
Test Bluetooth Audio WITHOUT changing anything
This uses the correct Python from virtual environment
"""

import sys
import os

# Make sure we're using the venv
if '/home/pommai/app/venv' not in sys.prefix:
    print("Warning: Not running in virtual environment")
    print(f"Python: {sys.executable}")
    print(f"Prefix: {sys.prefix}")

try:
    import pyaudio
    import numpy as np
    import subprocess
    import time
except ImportError as e:
    print(f"Error importing: {e}")
    print("\nTo run this test, use:")
    print("  /home/pommai/app/venv/bin/python test_bluetooth_audio.py")
    print("Or:")
    print("  source /home/pommai/app/venv/bin/activate")
    print("  python test_bluetooth_audio.py")
    sys.exit(1)

def list_all_devices():
    """List all audio devices"""
    print("\n=== ALL AUDIO DEVICES ===")
    p = pyaudio.PyAudio()
    
    bluetooth_found = False
    respeaker_found = False
    
    for i in range(p.get_device_count()):
        info = p.get_device_info_by_index(i)
        name = info['name']
        
        print(f"\nDevice {i}: {name}")
        print(f"  Max Input Channels: {info['maxInputChannels']}")
        print(f"  Max Output Channels: {info['maxOutputChannels']}")
        
        if 'bluealsa' in name.lower() or 'bluetooth' in name.lower():
            bluetooth_found = i
            print("  *** This looks like BLUETOOTH ***")
            
        if 'seeed' in name.lower() or 'respeaker' in name.lower():
            if info['maxOutputChannels'] > 0:
                respeaker_found = i
                print("  *** This is ReSpeaker output ***")
    
    p.terminate()
    return bluetooth_found, respeaker_found

def test_beep(device_index, device_name):
    """Play a test beep on specific device"""
    print(f"\nTesting {device_name} (device {device_index})...")
    
    p = pyaudio.PyAudio()
    
    # Generate a 440Hz beep
    duration = 1.0
    sample_rate = 16000
    freq = 440
    
    samples = int(sample_rate * duration)
    wave = np.sin(freq * 2 * np.pi * np.arange(samples) / sample_rate)
    audio = (wave * 0.3 * 32767).astype(np.int16)
    
    try:
        stream = p.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=sample_rate,
            output=True,
            output_device_index=device_index,
            frames_per_buffer=1024
        )
        
        print(f"  Playing beep on {device_name}...")
        stream.write(audio.tobytes())
        stream.close()
        print(f"  ✓ Success on {device_name}!")
        return True
        
    except Exception as e:
        print(f"  ✗ Failed on {device_name}: {e}")
        return False
    finally:
        p.terminate()

def check_bluetooth_status():
    """Check if Bluetooth is connected"""
    print("\n=== BLUETOOTH STATUS ===")
    
    # Check if bluetooth service is running
    try:
        result = subprocess.run(['systemctl', 'is-active', 'bluetooth'], 
                              capture_output=True, text=True)
        if result.stdout.strip() == 'active':
            print("✓ Bluetooth service is running")
        else:
            print("✗ Bluetooth service is NOT running")
            print("  Fix: sudo systemctl start bluetooth")
    except:
        print("✗ Could not check Bluetooth service")
    
    # Check if bluealsa is installed
    try:
        result = subprocess.run(['which', 'bluealsa'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ BlueALSA is installed")
            
            # Check if bluealsa service exists and is running
            result = subprocess.run(['systemctl', 'is-active', 'bluealsa'], 
                                  capture_output=True, text=True)
            if result.stdout.strip() == 'active':
                print("✓ BlueALSA service is running")
            else:
                print("✗ BlueALSA service is NOT running")
                print("  Fix: sudo systemctl start bluealsa")
        else:
            print("✗ BlueALSA is NOT installed (this is the missing piece!)")
            print("  To fix, run these commands:")
            print("    sudo apt-get update")
            print("    sudo apt-get install -y bluealsa")
    except:
        print("✗ Could not check BlueALSA")
    
    # Check connected devices
    try:
        result = subprocess.run(['bluetoothctl', 'devices', 'Connected'],
                              capture_output=True, text=True, timeout=5)
        if result.stdout.strip():
            print(f"✓ Connected Bluetooth devices:")
            for line in result.stdout.strip().split('\n'):
                print(f"    {line}")
        else:
            print("✗ No Bluetooth devices connected")
            print("  To connect your speaker:")
            print("    sudo bluetoothctl")
            print("    scan on")
            print("    pair <MAC>")
            print("    trust <MAC>")
            print("    connect <MAC>")
    except subprocess.TimeoutExpired:
        print("✗ bluetoothctl timed out")
    except Exception as e:
        print(f"✗ Could not check connected devices: {e}")

def main():
    print("=" * 50)
    print("BLUETOOTH AUDIO TEST (Safe - No Changes)")
    print("=" * 50)
    
    print(f"\nRunning with Python: {sys.executable}")
    print(f"Virtual env: {sys.prefix}")
    
    # Check Bluetooth status first
    check_bluetooth_status()
    
    # List all devices
    bt_device, respeaker_device = list_all_devices()
    
    print("\n" + "=" * 50)
    print("AUDIO TEST RESULTS:")
    print("=" * 50)
    
    if bt_device is not False:
        print(f"\n✓ Bluetooth audio device found at index {bt_device}")
        print("  Testing Bluetooth audio...")
        if test_beep(bt_device, "Bluetooth"):
            print("\n🎉 BLUETOOTH AUDIO WORKS!")
            print("Your setup can use Bluetooth!")
        else:
            print("\n⚠️ Bluetooth device found but couldn't play audio")
            print("You may need to check BlueALSA configuration")
    else:
        print("\n✗ No Bluetooth audio device found in PyAudio")
        print("  This means either:")
        print("  1. BlueALSA is not installed or not running")
        print("  2. Bluetooth speaker is not connected")
        print("  3. ALSA configuration needs updating")
    
    if respeaker_device is not False:
        print(f"\n✓ ReSpeaker device found at index {respeaker_device}")
        print("  Testing ReSpeaker audio...")
        test_beep(respeaker_device, "ReSpeaker")
    
    print("\n" + "=" * 50)
    print("NEXT STEPS:")
    print("=" * 50)
    
    if bt_device is False:
        print("\n1. First, check the Bluetooth Status section above")
        print("2. Install any missing components")
        print("3. Make sure your Bluetooth speaker is connected")
        print("4. Run this test again")
        print("\nQuick fix commands:")
        print("  sudo apt-get update")
        print("  sudo apt-get install -y bluealsa")
        print("  sudo systemctl start bluealsa")
    else:
        print("\n✓ Your Pi is ready for Bluetooth audio!")
        print("✓ You can safely apply the audio patch.")
        print("\nTo apply the patch:")
        print("  /home/pommai/app/venv/bin/python audio_patch.py")

if __name__ == "__main__":
    main()
