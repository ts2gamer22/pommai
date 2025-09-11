#!/usr/bin/env python3
"""
Test all available audio devices to find the working Bluetooth output
"""

import pyaudio
import numpy as np
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_device(device_index, device_name, duration=1.0):
    """Test a specific audio device"""
    p = pyaudio.PyAudio()
    
    try:
        # Generate test tone
        sample_rate = 16000
        frequency = 440
        samples = int(sample_rate * duration)
        t = np.linspace(0, duration, samples)
        audio_data = (np.sin(2 * np.pi * frequency * t) * 0.3 * 32767).astype(np.int16)
        
        logger.info(f"\nTesting device [{device_index}]: {device_name}")
        
        # Try to open stream
        stream = p.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=sample_rate,
            output=True,
            output_device_index=device_index,
            frames_per_buffer=2048
        )
        
        # Play test tone
        logger.info(f"  ✓ Device opened successfully, playing tone...")
        stream.write(audio_data.tobytes())
        
        stream.stop_stream()
        stream.close()
        
        logger.info(f"  ✓ SUCCESS: Device {device_index} works!")
        return True
        
    except Exception as e:
        logger.error(f"  ✗ FAILED: {str(e)[:100]}")
        return False
    finally:
        p.terminate()


def main():
    """Test all available output devices"""
    logger.info("=== Testing All Audio Output Devices ===\n")
    
    # First, list all devices
    p = pyaudio.PyAudio()
    
    # Based on your logs, these are the available devices:
    devices_to_test = [
        (0, "seeed2micvoicec (hw:0,0)"),
        (1, "sysdefault"),
        (2, "bluealsa"),
        (6, "bt"),
        (7, "speaker"),
        (9, "dmix"),
        (10, "default")
    ]
    
    logger.info("Available output devices from scan:")
    for i in range(p.get_device_count()):
        try:
            info = p.get_device_info_by_index(i)
            if info['maxOutputChannels'] > 0:
                logger.info(f"  [{i}] {info['name']} (Output: {info['maxOutputChannels']} ch)")
        except:
            pass
    
    p.terminate()
    
    # Test each device
    working_devices = []
    logger.info("\n" + "="*50)
    logger.info("Testing each device with a 1-second tone...")
    logger.info("Listen for a beep from your Bluetooth speaker!")
    logger.info("="*50)
    
    for device_index, device_name in devices_to_test:
        time.sleep(0.5)  # Small delay between tests
        if test_device(device_index, device_name):
            working_devices.append((device_index, device_name))
    
    # Summary
    logger.info("\n" + "="*50)
    logger.info("SUMMARY")
    logger.info("="*50)
    
    if working_devices:
        logger.info(f"\n✓ Working devices found: {len(working_devices)}")
        for idx, name in working_devices:
            logger.info(f"  - Device {idx}: {name}")
        
        logger.info(f"\n🎯 RECOMMENDED: Use device index {working_devices[0][0]} ({working_devices[0][1]})")
        logger.info("\nTo use this device, update audio_utils.py:")
        logger.info(f"  Change the Bluetooth device index to: {working_devices[0][0]}")
        
    else:
        logger.error("\n✗ No working audio devices found!")
        logger.info("\nTroubleshooting:")
        logger.info("1. Make sure your Bluetooth speaker is on and connected")
        logger.info("2. Stop the pommai service: sudo systemctl stop pommai")
        logger.info("3. Restart BlueALSA: sudo systemctl restart bluealsa")
        logger.info("4. Check Bluetooth connection: bluetoothctl info")
        logger.info("5. Try manual test: speaker-test -D bluealsa -c 1")


if __name__ == "__main__":
    main()
