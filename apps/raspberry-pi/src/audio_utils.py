#!/usr/bin/env python3
"""
Audio device detection utilities for Pommai Raspberry Pi client
Provides smart audio device selection with Bluetooth priority
"""

import pyaudio
import logging
import subprocess
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)

def get_audio_device_indices() -> Dict[str, Optional[int]]:
    """
    Find best audio devices with Bluetooth priority.
    Based on test results, Bluetooth is typically at index 2.
    
    Returns:
        Dict with 'input' and 'output' device indices
    """
    p = pyaudio.PyAudio()
    
    mic_index = None
    bt_speaker_index = None
    hat_speaker_index = None
    
    logger.info("Scanning for audio devices...")
    
    for i in range(p.get_device_count()):
        try:
            info = p.get_device_info_by_index(i)
            name = info.get('name', '').lower()
            channels_in = info.get('maxInputChannels', 0)
            channels_out = info.get('maxOutputChannels', 0)
            
            # Log device info for debugging
            if channels_in > 0 or channels_out > 0:
                logger.debug(f"Device {i}: {info['name']} (In:{channels_in}, Out:{channels_out})")
            
            # Find microphone (ReSpeaker or WM8960)
            if channels_in > 0:
                if any(keyword in name for keyword in ['seeed', 'respeaker', 'wm8960', 'capture']):
                    if mic_index is None:  # Take first matching input device
                        mic_index = i
                        logger.info(f"Found ReSpeaker Mic: index={i}, name='{info['name']}'")
            
            # Find speakers
            if channels_out > 0:
                # Check for Bluetooth device (based on test, it's at index 2)
                # BlueALSA devices typically show up as "bluealsa" or at specific indices
                if i == 2 or 'bluealsa' in name or 'bluetooth' in name:
                    bt_speaker_index = i
                    logger.info(f"Found Bluetooth Speaker: index={i}, name='{info['name']}'")
                # Check for ReSpeaker/WM8960 output
                elif any(keyword in name for keyword in ['seeed', 'respeaker', 'wm8960', 'playback']) or i == 0:
                    if hat_speaker_index is None:  # Take first matching output device
                        hat_speaker_index = i
                        logger.info(f"Found ReSpeaker Speaker: index={i}, name='{info['name']}'")
                    
        except Exception as e:
            logger.debug(f"Error checking device {i}: {e}")
            continue
    
    p.terminate()
    
    # Determine output device: prefer Bluetooth if available
    output_device = bt_speaker_index if bt_speaker_index is not None else hat_speaker_index
    
    # Log final selection
    if output_device is not None:
        device_type = 'Bluetooth' if output_device == bt_speaker_index else 'ReSpeaker HAT'
        logger.info(f"Selected Output: index={output_device} ({device_type})")
    else:
        logger.warning("No preferred output device found, will use system default")
    
    if mic_index is None:
        logger.warning("No ReSpeaker microphone found, will use system default")
    else:
        logger.info(f"Selected Input: index={mic_index}")
    
    return {
        "input": mic_index,
        "output": output_device
    }


def check_bluetooth_connection() -> Tuple[bool, Optional[str]]:
    """
    Check if a Bluetooth audio device is connected
    
    Returns:
        Tuple of (is_connected, device_name)
    """
    try:
        # Check BlueALSA for connected devices
        result = subprocess.run(
            ["bluetoothctl", "devices", "Connected"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0 and result.stdout:
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if line.strip():
                    # Parse device info
                    parts = line.split(' ', 2)
                    if len(parts) >= 3:
                        device_name = parts[2]
                        logger.info(f"Bluetooth device connected: {device_name}")
                        return True, device_name
        
        return False, None
        
    except Exception as e:
        logger.warning(f"Could not check Bluetooth status: {e}")
        return False, None


def convert_mp3_to_pcm(mp3_data: bytes, sample_rate: int = 16000) -> bytes:
    """
    Convert MP3 audio data to PCM16 format using ffmpeg
    
    Args:
        mp3_data: MP3 audio bytes
        sample_rate: Target sample rate (default 16000 Hz)
    
    Returns:
        PCM16 audio bytes
    """
    try:
        # Use ffmpeg to convert MP3 to PCM16
        process = subprocess.Popen(
            [
                'ffmpeg',
                '-i', 'pipe:0',  # Input from stdin
                '-f', 's16le',    # Output format: signed 16-bit little-endian
                '-ar', str(sample_rate),  # Sample rate
                '-ac', '1',       # Mono
                '-loglevel', 'error',
                'pipe:1'          # Output to stdout
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        pcm_data, error = process.communicate(input=mp3_data)
        
        if process.returncode != 0:
            logger.error(f"ffmpeg conversion error: {error.decode()}")
            return b''
        
        return pcm_data
        
    except FileNotFoundError:
        logger.error("ffmpeg not found. Install with: sudo apt-get install ffmpeg")
        return b''
    except Exception as e:
        logger.error(f"MP3 to PCM conversion error: {e}")
        return b''


def test_audio_output(device_index: Optional[int] = None, duration: float = 1.0):
    """
    Test audio output with a beep sound
    
    Args:
        device_index: Output device index (None for default)
        duration: Duration of test sound in seconds
    """
    import numpy as np
    
    p = pyaudio.PyAudio()
    
    # Generate a 440Hz sine wave
    sample_rate = 16000
    frequency = 440
    samples = int(sample_rate * duration)
    t = np.linspace(0, duration, samples)
    audio_data = (np.sin(2 * np.pi * frequency * t) * 0.3 * 32767).astype(np.int16)
    
    try:
        stream = p.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=sample_rate,
            output=True,
            output_device_index=device_index,
            frames_per_buffer=1024
        )
        
        logger.info(f"Playing test tone on device {device_index}...")
        stream.write(audio_data.tobytes())
        
        stream.stop_stream()
        stream.close()
        
    except Exception as e:
        logger.error(f"Audio test failed: {e}")
    finally:
        p.terminate()


def ensure_bluealsa_running() -> bool:
    """
    Ensure BlueALSA service is running
    
    Returns:
        True if BlueALSA is running or was started successfully
    """
    try:
        # Check if bluealsa is running
        result = subprocess.run(
            ["systemctl", "is-active", "bluealsa"],
            capture_output=True,
            text=True
        )
        
        if result.stdout.strip() == "active":
            logger.info("BlueALSA service is running")
            return True
        
        # Try to start it
        logger.info("Starting BlueALSA service...")
        subprocess.run(["sudo", "systemctl", "start", "bluealsa"], check=False)
        
        # Check again
        result = subprocess.run(
            ["systemctl", "is-active", "bluealsa"],
            capture_output=True,
            text=True
        )
        
        if result.stdout.strip() == "active":
            logger.info("BlueALSA service started successfully")
            return True
        else:
            logger.warning("Failed to start BlueALSA service")
            return False
            
    except Exception as e:
        logger.warning(f"Could not check/start BlueALSA: {e}")
        return False
