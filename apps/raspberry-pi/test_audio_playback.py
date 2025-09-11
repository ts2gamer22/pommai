#!/usr/bin/env python3
"""
Simple Audio Playback Test for Raspberry Pi
Tests PCM16 audio playback through Bluetooth or default speaker
"""

import pyaudio
import numpy as np
import time
import sys
import logging

# Try to import audio utils for smart device detection
try:
    from src.audio_utils import get_audio_device_indices
    AUDIO_UTILS_AVAILABLE = True
except ImportError:
    AUDIO_UTILS_AVAILABLE = False
    print("audio_utils not found, using default audio devices")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_test_tone(frequency=440, duration=1.0, sample_rate=16000):
    """Generate a test tone (sine wave) as PCM16 bytes"""
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    # Generate sine wave
    wave = np.sin(frequency * 2 * np.pi * t)
    # Convert to 16-bit PCM
    pcm16 = (wave * 32767).astype(np.int16)
    return pcm16.tobytes()


def test_audio_playback():
    """Test audio playback with smart device detection"""
    
    print("=" * 60)
    print("Audio Playback Test for Raspberry Pi")
    print("=" * 60)
    
    # Initialize PyAudio
    p = pyaudio.PyAudio()
    
    # Detect audio devices
    input_device = None
    output_device = None
    
    if AUDIO_UTILS_AVAILABLE:
        try:
            audio_devices = get_audio_device_indices()
            input_device = audio_devices.get("input")
            output_device = audio_devices.get("output")
            print(f"✅ Audio devices detected:")
            print(f"   Input: {input_device}")
            print(f"   Output: {output_device}")
        except Exception as e:
            print(f"⚠️ Failed to detect audio devices: {e}")
            print("   Using system defaults")
    else:
        print("ℹ️ Using default ALSA audio routing")
    
    # List all available audio devices
    print("\n📋 Available audio devices:")
    for i in range(p.get_device_count()):
        info = p.get_device_info_by_index(i)
        print(f"   [{i}] {info['name']} - {info['maxOutputChannels']} output channels")
    
    # Audio parameters
    sample_rate = 16000
    channels = 1
    chunk_size = 1024
    
    try:
        # Open output stream
        print(f"\n🔊 Opening audio stream (device={output_device})...")
        stream = p.open(
            format=pyaudio.paInt16,
            channels=channels,
            rate=sample_rate,
            output=True,
            output_device_index=output_device,
            frames_per_buffer=chunk_size
        )
        
        print("✅ Audio stream opened successfully")
        
        # Test 1: Generate and play test tones
        print("\n🎵 Playing test tones...")
        frequencies = [440, 523, 659, 784]  # A4, C5, E5, G5
        tone_names = ["A4 (440Hz)", "C5 (523Hz)", "E5 (659Hz)", "G5 (784Hz)"]
        
        for freq, name in zip(frequencies, tone_names):
            print(f"   Playing {name}...")
            tone_data = generate_test_tone(freq, duration=0.5, sample_rate=sample_rate)
            stream.write(tone_data)
            time.sleep(0.1)  # Small gap between tones
        
        # Test 2: Play a simple PCM16 pattern
        print("\n🎵 Playing PCM16 test pattern...")
        # Create a simple alternating pattern
        pattern = np.array([16000, -16000] * 8000, dtype=np.int16)
        stream.write(pattern.tobytes())
        
        # Test 3: Play silence to verify no noise
        print("\n🔇 Playing silence (checking for noise)...")
        silence = np.zeros(sample_rate, dtype=np.int16)
        stream.write(silence.tobytes())
        time.sleep(1)
        
        print("\n✅ Audio playback test completed successfully!")
        print("   If you heard the tones, your audio output is working correctly.")
        print("   If not, check:")
        print("   - Bluetooth connection (if using Bluetooth speaker)")
        print("   - Volume levels")
        print("   - Audio routing configuration")
        
    except Exception as e:
        print(f"\n❌ Audio playback test failed: {e}")
        print("   This might indicate:")
        print("   - Audio device not available")
        print("   - Permission issues")
        print("   - Hardware problems")
        return False
        
    finally:
        # Clean up
        if 'stream' in locals():
            stream.stop_stream()
            stream.close()
        p.terminate()
    
    return True


def test_elevenlabs_simulation():
    """Simulate ElevenLabs PCM16 streaming"""
    print("\n" + "=" * 60)
    print("ElevenLabs PCM16 Simulation Test")
    print("=" * 60)
    
    # Initialize PyAudio
    p = pyaudio.PyAudio()
    
    # Detect output device
    output_device = None
    if AUDIO_UTILS_AVAILABLE:
        try:
            audio_devices = get_audio_device_indices()
            output_device = audio_devices.get("output")
        except:
            pass
    
    sample_rate = 16000  # ElevenLabs PCM16 at 16kHz
    channels = 1
    chunk_size = 320  # 20ms chunks
    
    try:
        # Open output stream
        stream = p.open(
            format=pyaudio.paInt16,
            channels=channels,
            rate=sample_rate,
            output=True,
            output_device_index=output_device,
            frames_per_buffer=chunk_size
        )
        
        print("🎤 Simulating ElevenLabs TTS stream...")
        print("   Format: PCM16")
        print(f"   Sample Rate: {sample_rate}Hz")
        print(f"   Chunk Size: {chunk_size} samples (20ms)")
        
        # Simulate streaming chunks
        print("\n📦 Streaming audio chunks:")
        
        # Generate a simple speech-like pattern
        for i in range(50):  # 50 chunks = 1 second
            # Create varying frequency to simulate speech
            freq = 200 + (i * 10) % 300
            t = np.linspace(0, 0.02, chunk_size, False)  # 20ms chunk
            wave = np.sin(freq * 2 * np.pi * t) * 0.5
            
            # Add some envelope to make it more speech-like
            envelope = np.hanning(chunk_size)
            wave = wave * envelope
            
            # Convert to PCM16
            pcm_chunk = (wave * 16000).astype(np.int16)
            
            # Play chunk
            stream.write(pcm_chunk.tobytes())
            
            if i % 10 == 0:
                print(f"   Chunk {i}/50 played...")
        
        print("\n✅ ElevenLabs simulation completed!")
        print("   This simulates how PCM16 audio from ElevenLabs should play.")
        
    except Exception as e:
        print(f"\n❌ ElevenLabs simulation failed: {e}")
        return False
        
    finally:
        if 'stream' in locals():
            stream.stop_stream()
            stream.close()
        p.terminate()
    
    return True


if __name__ == "__main__":
    print("Starting Raspberry Pi Audio Tests\n")
    
    # Run basic audio test
    success = test_audio_playback()
    
    if success:
        # Run ElevenLabs simulation
        test_elevenlabs_simulation()
    
    print("\n" + "=" * 60)
    print("All tests completed")
    print("=" * 60)
