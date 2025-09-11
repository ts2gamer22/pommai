#!/usr/bin/env python3
"""
Test audio flow without directly importing pyaudio
Uses the existing audio_stream_manager module
"""

import asyncio
import logging
import sys
import os
import subprocess
import numpy as np

# Add the app directory to path
sys.path.insert(0, '/home/pommai/app')

from audio_stream_manager import AudioStreamManager, AudioConfig, HardwareController

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def check_bluetooth_status():
    """Check Bluetooth connection status"""
    logger.info("=== Checking Bluetooth Status ===")
    
    try:
        # Check if Bluetooth service is running
        result = subprocess.run(
            ["systemctl", "status", "bluetooth"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if "active (running)" in result.stdout:
            logger.info("✓ Bluetooth service is running")
        else:
            logger.warning("✗ Bluetooth service is not active")
            
        # Check BlueALSA
        result = subprocess.run(
            ["systemctl", "status", "bluealsa"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if "active (running)" in result.stdout:
            logger.info("✓ BlueALSA service is running")
        else:
            logger.warning("✗ BlueALSA service is not active")
            
        # Check connected devices
        result = subprocess.run(
            ["bluetoothctl", "devices", "Connected"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.stdout.strip():
            logger.info(f"✓ Connected devices:\n{result.stdout}")
        else:
            # Alternative method
            result = subprocess.run(
                ["bluetoothctl", "info"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if "Connected: yes" in result.stdout:
                logger.info("✓ Bluetooth device is connected")
                # Extract device name
                for line in result.stdout.split('\n'):
                    if 'Name:' in line:
                        logger.info(f"  Device: {line.strip()}")
            else:
                logger.warning("✗ No Bluetooth audio device connected")
                
    except Exception as e:
        logger.error(f"Error checking Bluetooth: {e}")


async def test_audio_playback():
    """Test audio playback using AudioStreamManager"""
    logger.info("\n=== Testing Audio Playback ===")
    
    try:
        # Try to import audio_utils to get device indices
        try:
            from audio_utils import get_audio_device_indices
            devices = get_audio_device_indices()
            input_device = devices.get("input")
            output_device = devices.get("output")
            logger.info(f"Detected devices - Input: {input_device}, Output: {output_device}")
        except Exception as e:
            logger.warning(f"Could not detect devices: {e}, using defaults")
            input_device = None
            output_device = 2  # Try Bluetooth device index
            
        # Initialize hardware controller
        hardware = HardwareController(
            sample_rate=16000,
            channels=1,
            chunk_size=320,
            input_device_index=input_device,
            output_device_index=output_device
        )
        
        # Initialize audio manager
        audio_manager = AudioStreamManager(
            hardware,
            AudioConfig(
                sample_rate=16000,
                chunk_size=320,
                channels=1
            )
        )
        
        # Generate test audio (440Hz tone for 2 seconds)
        logger.info("Generating test audio...")
        sample_rate = 16000
        duration = 2.0
        frequency = 440
        samples = int(sample_rate * duration)
        t = np.linspace(0, duration, samples)
        audio_data = (np.sin(2 * np.pi * frequency * t) * 0.3 * 32767).astype(np.int16)
        audio_bytes = audio_data.tobytes()
        
        # Create chunks like ElevenLabs (1024 bytes each)
        chunks = []
        for i in range(0, len(audio_bytes), 1024):
            chunk = audio_bytes[i:i+1024]
            chunks.append({'data': chunk, 'is_final': False})
        chunks.append({'data': b'', 'is_final': True})
        
        logger.info(f"Created {len(chunks)} chunks (1024 bytes each)")
        
        # Create async generator
        async def audio_generator():
            for chunk in chunks:
                yield chunk
                await asyncio.sleep(0.01)  # Simulate streaming delay
                
        # Play audio
        logger.info("Starting playback...")
        await audio_manager.play_audio_stream(audio_generator())
        
        logger.info("✓ Playback completed")
        
        # Get stats
        stats = audio_manager.get_stats()
        logger.info(f"Stats: {stats}")
        
        # Cleanup
        hardware.cleanup()
        
    except Exception as e:
        logger.error(f"✗ Playback test failed: {e}")
        import traceback
        traceback.print_exc()


async def test_direct_write():
    """Test writing directly to the output stream"""
    logger.info("\n=== Testing Direct Stream Write ===")
    
    try:
        # Initialize hardware
        hardware = HardwareController(
            sample_rate=16000,
            channels=1,
            chunk_size=2048,  # Larger buffer for Bluetooth
            input_device_index=None,
            output_device_index=2  # Bluetooth device
        )
        
        # Generate simple beep
        sample_rate = 16000
        duration = 1.0
        frequency = 880  # Higher pitch
        samples = int(sample_rate * duration)
        t = np.linspace(0, duration, samples)
        audio_data = (np.sin(2 * np.pi * frequency * t) * 0.5 * 32767).astype(np.int16)
        audio_bytes = audio_data.tobytes()
        
        logger.info(f"Writing {len(audio_bytes)} bytes directly to stream...")
        
        # Write in larger chunks for Bluetooth
        chunk_size = 4096
        for i in range(0, len(audio_bytes), chunk_size):
            chunk = audio_bytes[i:i+chunk_size]
            if chunk:
                hardware.output_stream.write(chunk)
                await asyncio.sleep(0.02)
                
        logger.info("✓ Direct write completed")
        
        # Cleanup
        hardware.cleanup()
        
    except Exception as e:
        logger.error(f"✗ Direct write failed: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """Run all tests"""
    logger.info("=== Audio Flow Diagnostic ===\n")
    
    # Check Bluetooth
    check_bluetooth_status()
    
    # Test playback methods
    await test_audio_playback()
    await test_direct_write()
    
    logger.info("\n=== Diagnostic Complete ===")
    logger.info("\nIf audio didn't play:")
    logger.info("1. Check your Bluetooth speaker is on and connected")
    logger.info("2. Try: sudo systemctl restart bluealsa")
    logger.info("3. Try: bluetoothctl connect <MAC_ADDRESS>")
    logger.info("4. Check volume: alsamixer")
    logger.info("5. Test manually: speaker-test -c 1 -t sine -f 440")


if __name__ == "__main__":
    asyncio.run(main())
