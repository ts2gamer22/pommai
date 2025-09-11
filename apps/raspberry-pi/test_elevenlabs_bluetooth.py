#!/usr/bin/env python3
"""
Test ElevenLabs audio streaming with Bluetooth output
Diagnoses the complete audio flow from queue to speaker
"""

import asyncio
import pyaudio
import logging
import subprocess
import time
from typing import Optional

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def check_bluetooth_audio():
    """Check if Bluetooth audio is properly configured"""
    try:
        # Check BlueALSA status
        result = subprocess.run(
            ["systemctl", "status", "bluealsa"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if "active (running)" in result.stdout:
            logger.info("✓ BlueALSA service is running")
        else:
            logger.warning("✗ BlueALSA service is not running properly")
            
        # Check for connected Bluetooth devices
        result = subprocess.run(
            ["bluetoothctl", "info"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if "Connected: yes" in result.stdout:
            logger.info("✓ Bluetooth device is connected")
        else:
            logger.warning("✗ No Bluetooth device connected")
            
        # List audio devices
        p = pyaudio.PyAudio()
        logger.info("\nAvailable audio devices:")
        for i in range(p.get_device_count()):
            info = p.get_device_info_by_index(i)
            if info['maxOutputChannels'] > 0:
                logger.info(f"  [{i}] {info['name']} (Output: {info['maxOutputChannels']} ch)")
        p.terminate()
        
    except Exception as e:
        logger.error(f"Bluetooth check failed: {e}")
        

def test_direct_bluetooth_playback():
    """Test playing audio directly to Bluetooth device"""
    import numpy as np
    
    p = pyaudio.PyAudio()
    
    # Try device index 2 (typically Bluetooth on Pi)
    bt_device_index = 2
    
    try:
        logger.info(f"\nTesting direct playback to device {bt_device_index}...")
        
        # Create test tone
        sample_rate = 16000
        duration = 2.0
        frequency = 440
        samples = int(sample_rate * duration)
        t = np.linspace(0, duration, samples)
        audio_data = (np.sin(2 * np.pi * frequency * t) * 0.3 * 32767).astype(np.int16)
        
        # Open stream with explicit buffer size
        stream = p.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=sample_rate,
            output=True,
            output_device_index=bt_device_index,
            frames_per_buffer=2048  # Larger buffer for Bluetooth
        )
        
        logger.info("Playing test tone...")
        
        # Write in chunks to avoid buffer issues
        chunk_size = 2048
        audio_bytes = audio_data.tobytes()
        for i in range(0, len(audio_bytes), chunk_size):
            chunk = audio_bytes[i:i+chunk_size]
            if chunk:
                stream.write(chunk)
                time.sleep(0.01)  # Small delay between chunks
        
        stream.stop_stream()
        stream.close()
        logger.info("✓ Test tone played successfully")
        
    except Exception as e:
        logger.error(f"✗ Playback failed: {e}")
    finally:
        p.terminate()


async def test_simulated_stream_playback():
    """Simulate the exact flow used by pommai_client_fastrtc"""
    import numpy as np
    from collections import deque
    
    # Simulate audio queue like in FastRTC connection
    audio_queue = asyncio.Queue()
    
    # Generate test PCM16 chunks (1024 bytes each like ElevenLabs)
    sample_rate = 16000
    chunk_duration = 1024 / (sample_rate * 2)  # 1024 bytes = 512 samples at 16-bit
    total_duration = 3.0
    frequency = 440
    
    # Generate complete audio
    samples = int(sample_rate * total_duration)
    t = np.linspace(0, total_duration, samples)
    audio_data = (np.sin(2 * np.pi * frequency * t) * 0.3 * 32767).astype(np.int16)
    audio_bytes = audio_data.tobytes()
    
    # Queue chunks of 1024 bytes
    logger.info("\nQueuing audio chunks (1024 bytes each)...")
    for i in range(0, len(audio_bytes), 1024):
        chunk = audio_bytes[i:i+1024]
        await audio_queue.put({'data': chunk, 'isFinal': False})
    await audio_queue.put({'data': b'', 'isFinal': True})
    logger.info(f"Queued {audio_queue.qsize()} chunks")
    
    # Playback simulation
    p = pyaudio.PyAudio()
    bt_device_index = 2
    
    try:
        stream = p.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=sample_rate,
            output=True,
            output_device_index=bt_device_index,
            frames_per_buffer=2048
        )
        
        logger.info("Starting playback from queue...")
        chunks_played = 0
        
        # Buffer for accumulating small chunks
        buffer = bytearray()
        min_write_size = 2048  # Minimum size to write to stream
        
        while True:
            try:
                chunk = await asyncio.wait_for(audio_queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                logger.warning("Timeout waiting for chunk")
                break
                
            if chunk.get('isFinal'):
                # Flush remaining buffer
                if buffer:
                    logger.info(f"Flushing final buffer: {len(buffer)} bytes")
                    # Pad to even number if needed
                    if len(buffer) % 2 == 1:
                        buffer.append(0)
                    stream.write(bytes(buffer))
                logger.info("Final marker received")
                break
                
            audio_data = chunk.get('data', b'')
            if audio_data:
                buffer.extend(audio_data)
                
                # Write when we have enough data
                while len(buffer) >= min_write_size:
                    write_chunk = bytes(buffer[:min_write_size])
                    buffer = buffer[min_write_size:]
                    stream.write(write_chunk)
                    chunks_played += 1
                    if chunks_played == 1:
                        logger.info("✓ First chunk played successfully")
        
        stream.stop_stream()
        stream.close()
        logger.info(f"✓ Played {chunks_played} chunks total")
        
    except Exception as e:
        logger.error(f"✗ Stream playback failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        p.terminate()


async def main():
    """Run all diagnostics"""
    logger.info("=== ElevenLabs Bluetooth Audio Diagnostic ===\n")
    
    # Check Bluetooth status
    check_bluetooth_audio()
    
    # Test direct playback
    test_direct_bluetooth_playback()
    
    # Test stream playback (simulates pommai client)
    await test_simulated_stream_playback()
    
    logger.info("\n=== Diagnostic Complete ===")
    logger.info("\nRecommendations:")
    logger.info("1. Ensure Bluetooth speaker is connected and paired")
    logger.info("2. Verify BlueALSA service is running: sudo systemctl status bluealsa")
    logger.info("3. Check audio routing: alsamixer")
    logger.info("4. Test with: speaker-test -c 1 -r 16000 -f S16_LE")
    logger.info("5. If using index 2 fails, try index 0 or 1")


if __name__ == "__main__":
    asyncio.run(main())
