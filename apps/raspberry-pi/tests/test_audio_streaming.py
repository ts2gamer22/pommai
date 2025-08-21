#!/usr/bin/env python3
"""
Audio Streaming Test Script for Pommai Raspberry Pi Client
Tests the AudioStreamManager functionality
"""

import asyncio
import sys
import os
import time
import logging
import wave
import numpy as np

# Add parent directory to path to import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from audio_stream_manager import AudioStreamManager, AudioConfig, AudioState
from led_controller import LEDController, LEDPattern
import pyaudio
import RPi.GPIO as GPIO


class MockHardwareController:
    """Mock hardware controller for testing"""
    
    def __init__(self):
        self.audio = pyaudio.PyAudio()
        self.config = AudioConfig()
        
        # Find audio devices
        self.respeaker_index = self._find_respeaker()
        
        # Create streams
        self.input_stream = self.audio.open(
            format=self.config.format,
            channels=self.config.channels,
            rate=self.config.sample_rate,
            input=True,
            input_device_index=self.respeaker_index,
            frames_per_buffer=self.config.chunk_size
        )
        
        self.output_stream = self.audio.open(
            format=self.config.format,
            channels=self.config.channels,
            rate=self.config.sample_rate,
            output=True,
            output_device_index=self.respeaker_index,
            frames_per_buffer=self.config.chunk_size
        )
    
    def _find_respeaker(self):
        """Find ReSpeaker device"""
        for i in range(self.audio.get_device_count()):
            info = self.audio.get_device_info_by_index(i)
            if 'seeed' in info['name'].lower() or 'respeaker' in info['name'].lower():
                return i
        return None
    
    def cleanup(self):
        """Cleanup resources"""
        self.input_stream.stop_stream()
        self.input_stream.close()
        self.output_stream.stop_stream()
        self.output_stream.close()
        self.audio.terminate()


async def test_audio_levels(audio_manager: AudioStreamManager):
    """Test audio input levels"""
    print("\n1. Audio Level Test")
    print("===================")
    print("Speak into the microphone to test levels...")
    
    max_level = await audio_manager.test_audio_levels(duration=5.0)
    
    if max_level < 10:
        print("⚠️  WARNING: Very low audio levels detected. Check microphone connection.")
    elif max_level > 90:
        print("⚠️  WARNING: Audio levels very high. Risk of clipping.")
    else:
        print(f"✓ Audio levels OK (max: {max_level}%)")


async def test_recording(audio_manager: AudioStreamManager, led_controller: LEDController):
    """Test audio recording"""
    print("\n2. Recording Test")
    print("=================")
    print("Press Enter to start recording (5 seconds)...")
    input()
    
    # Set LED pattern
    await led_controller.set_pattern(LEDPattern.LISTENING)
    
    # Start recording
    await audio_manager.start_recording(streaming=False)
    
    # Wait 5 seconds
    for i in range(5, 0, -1):
        print(f"Recording... {i}")
        await asyncio.sleep(1)
    
    # Stop recording
    audio_data = await audio_manager.stop_recording()
    await led_controller.set_pattern(LEDPattern.IDLE)
    
    print(f"✓ Recorded {len(audio_data)} bytes ({len(audio_data) / 32000:.1f} seconds)")
    
    # Save recording
    filename = "test_recording.wav"
    save_wav(filename, audio_data, audio_manager.config)
    print(f"✓ Saved to {filename}")
    
    return audio_data


async def test_playback(audio_manager: AudioStreamManager, audio_data: bytes, led_controller: LEDController):
    """Test audio playback"""
    print("\n3. Playback Test")
    print("================")
    print("Playing back recorded audio...")
    
    # Set LED pattern
    await led_controller.set_pattern(LEDPattern.SPEAKING)
    
    # Play audio
    await audio_manager.play_audio_data(audio_data)
    
    await led_controller.set_pattern(LEDPattern.IDLE)
    print("✓ Playback complete")


async def test_streaming(audio_manager: AudioStreamManager, led_controller: LEDController):
    """Test real-time streaming"""
    print("\n4. Streaming Test")
    print("=================")
    print("Testing real-time audio streaming...")
    print("Press Enter to start (speak for 5 seconds)...")
    input()
    
    # Collect streamed chunks
    streamed_chunks = []
    
    async def on_audio_chunk(chunk: bytes, sequence: int):
        streamed_chunks.append((chunk, sequence))
        if sequence % 10 == 0:
            print(f"  Streamed chunk {sequence} ({len(chunk)} bytes)")
    
    # Set callback
    audio_manager.on_audio_chunk = on_audio_chunk
    
    # Set LED pattern
    await led_controller.set_pattern(LEDPattern.LISTENING)
    
    # Start streaming
    await audio_manager.start_recording(streaming=True)
    
    # Wait 5 seconds
    await asyncio.sleep(5)
    
    # Stop recording
    await audio_manager.stop_recording()
    await led_controller.set_pattern(LEDPattern.IDLE)
    
    print(f"✓ Streamed {len(streamed_chunks)} chunks")
    
    # Test playback of streamed chunks
    print("\nPlaying back streamed audio...")
    await led_controller.set_pattern(LEDPattern.SPEAKING)
    
    # Create async generator for chunks
    async def chunk_generator():
        for chunk, seq in streamed_chunks:
            yield {'data': chunk, 'sequence': seq}
        yield {'data': b'', 'is_final': True}
    
    await audio_manager.play_audio_stream(chunk_generator())
    await led_controller.set_pattern(LEDPattern.IDLE)
    
    print("✓ Streaming test complete")


async def test_silence_detection(audio_manager: AudioStreamManager):
    """Test silence detection"""
    print("\n5. Silence Detection Test")
    print("=========================")
    print("Start speaking, then stop for 2+ seconds...")
    
    silence_detected = False
    
    async def on_silence():
        nonlocal silence_detected
        silence_detected = True
        print("✓ Silence detected!")
    
    audio_manager.on_silence_detected = on_silence
    
    # Start recording
    await audio_manager.start_recording(streaming=False)
    
    # Wait for silence or timeout
    timeout = 10
    start_time = time.time()
    
    while not silence_detected and time.time() - start_time < timeout:
        await asyncio.sleep(0.1)
    
    await audio_manager.stop_recording()
    
    if not silence_detected:
        print("⚠️  No silence detected in 10 seconds")
    else:
        print("✓ Silence detection working")


async def test_buffer_management(audio_manager: AudioStreamManager):
    """Test buffer overflow/underflow handling"""
    print("\n6. Buffer Management Test")
    print("=========================")
    
    # Get initial stats
    initial_stats = audio_manager.get_stats()
    
    # Start recording for buffer test
    await audio_manager.start_recording(streaming=False)
    await asyncio.sleep(3)
    await audio_manager.stop_recording()
    
    # Get final stats
    final_stats = audio_manager.get_stats()
    
    print(f"Recording buffer usage: {final_stats['recording_buffer_size']} chunks")
    print(f"Overruns: {final_stats['overruns']}")
    print(f"Underruns: {final_stats['underruns']}")
    
    if final_stats['overruns'] > 0:
        print("⚠️  Audio overruns detected - may need to adjust buffer size")
    else:
        print("✓ No buffer overruns")


def save_wav(filename: str, audio_data: bytes, config: AudioConfig):
    """Save audio data as WAV file"""
    with wave.open(filename, 'wb') as wf:
        wf.setnchannels(config.channels)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(config.sample_rate)
        wf.writeframes(audio_data)


async def main():
    """Main test function"""
    logging.basicConfig(level=logging.INFO)
    
    print("\nPommai Audio Streaming Test Suite")
    print("=================================\n")
    
    # Setup hardware
    hardware = MockHardwareController()
    config = AudioConfig()
    
    # Setup LED controller
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    
    led_pins = {'red': 5, 'green': 6, 'blue': 13}
    pwm_controllers = {}
    
    for color, pin in led_pins.items():
        GPIO.setup(pin, GPIO.OUT)
        pwm = GPIO.PWM(pin, 1000)
        pwm.start(0)
        pwm_controllers[color] = pwm
    
    led_controller = LEDController(pwm_controllers)
    
    # Create audio manager
    audio_manager = AudioStreamManager(hardware, config)
    
    try:
        # Set idle pattern
        await led_controller.set_pattern(LEDPattern.IDLE)
        
        # Run tests
        await test_audio_levels(audio_manager)
        
        print("\nPress Enter to continue with recording test...")
        input()
        
        audio_data = await test_recording(audio_manager, led_controller)
        
        print("\nPress Enter to test playback...")
        input()
        
        await test_playback(audio_manager, audio_data, led_controller)
        
        print("\nPress Enter to test streaming...")
        input()
        
        await test_streaming(audio_manager, led_controller)
        
        print("\nPress Enter to test silence detection...")
        input()
        
        await test_silence_detection(audio_manager)
        
        print("\nPress Enter to test buffer management...")
        input()
        
        await test_buffer_management(audio_manager)
        
        # Print final stats
        print("\n\nFinal Statistics")
        print("================")
        stats = audio_manager.get_stats()
        for key, value in stats.items():
            print(f"{key}: {value}")
        
        print("\n✓ All tests complete!")
        
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n\nError during test: {e}")
        logging.exception("Test error")
    finally:
        # Cleanup
        await led_controller.set_pattern(None)
        hardware.cleanup()
        for pwm in pwm_controllers.values():
            pwm.stop()
        GPIO.cleanup()
        print("\nCleanup complete")


if __name__ == "__main__":
    asyncio.run(main())
