#!/usr/bin/env python3
"""
Test Bluetooth Audio WITHOUT changing anything
This just tests if we can play audio through Bluetooth
"""

import pyaudio
import numpy as np
import subprocess
import time

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
    except:
        print("✗ Could not check Bluetooth service")
    
    # Check if bluealsa is installed
    try:
        result = subprocess.run(['which', 'bluealsa'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ BlueALSA is installed")
        else:
            print("✗ BlueALSA is NOT installed (this is the problem!)")
            print("  To fix: sudo apt-get install bluealsa")
    except:
        print("✗ Could not check BlueALSA")
    
    # Check connected devices
    try:
        result = subprocess.run(['bluetoothctl', 'devices', 'Connected'],
                              capture_output=True, text=True)
        if result.stdout.strip():
            print(f"✓ Connected devices:\n  {result.stdout.strip()}")
        else:
            print("✗ No Bluetooth devices connected")
    except:
        print("✗ Could not check connected devices")

def main():
    print("=" * 50)
    print("BLUETOOTH AUDIO TEST (Safe - No Changes)")
    print("=" * 50)
    
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
        print("\n✗ No Bluetooth audio device found")
        print("  This means either:")
        print("  1. BlueALSA is not installed (sudo apt-get install bluealsa)")
        print("  2. Bluetooth speaker is not connected")
        print("  3. BlueALSA service is not running")
    
    if respeaker_device is not False:
        print(f"\n✓ ReSpeaker device found at index {respeaker_device}")
        print("  Testing ReSpeaker audio...")
        test_beep(respeaker_device, "ReSpeaker")
    
    print("\n" + "=" * 50)
    print("RECOMMENDATIONS:")
    print("=" * 50)
    
    if bt_device is False:
        print("\nTo enable Bluetooth audio:")
        print("1. Install BlueALSA: sudo apt-get install bluealsa")
        print("2. Start service: sudo systemctl start bluealsa")
        print("3. Connect your speaker in bluetoothctl")
        print("4. Run this test again")
    else:
        print("\n✓ Your Pi is ready for Bluetooth audio!")
        print("You can safely apply the audio patch.")

if __name__ == "__main__":
    main()
