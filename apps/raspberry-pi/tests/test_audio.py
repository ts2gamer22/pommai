#!/usr/bin/env python3
"""
Audio Test Script for Pommai Raspberry Pi Client
Tests audio input/output with ReSpeaker 2-Mics HAT
"""

import pyaudio
import numpy as np
import time
import sys
import wave


def list_audio_devices():
    """List all available audio devices"""
    print("\nAvailable Audio Devices")
    print("=======================")
    
    p = pyaudio.PyAudio()
    
    print("\nInput Devices:")
    for i in range(p.get_device_count()):
        info = p.get_device_info_by_index(i)
        if info['maxInputChannels'] > 0:
            marker = " <-- ReSpeaker" if 'seeed' in info['name'].lower() or 'respeaker' in info['name'].lower() else ""
            print(f"  [{i}] {info['name']} - {info['maxInputChannels']} channels{marker}")
    
    print("\nOutput Devices:")
    for i in range(p.get_device_count()):
        info = p.get_device_info_by_index(i)
        if info['maxOutputChannels'] > 0:
            marker = " <-- ReSpeaker" if 'seeed' in info['name'].lower() or 'respeaker' in info['name'].lower() else ""
            print(f"  [{i}] {info['name']} - {info['maxOutputChannels']} channels{marker}")
    
    p.terminate()


def find_respeaker_device():
    """Find ReSpeaker device index"""
    p = pyaudio.PyAudio()
    respeaker_index = None
    
    for i in range(p.get_device_count()):
        info = p.get_device_info_by_index(i)
        if 'seeed' in info['name'].lower() or 'respeaker' in info['name'].lower():
            respeaker_index = i
            print(f"\nFound ReSpeaker at index {i}: {info['name']}")
            break
    
    p.terminate()
    return respeaker_index


def test_audio_levels(duration=5):
    """Monitor audio input levels"""
    print(f"\nAudio Level Monitor ({duration} seconds)")
    print("=====================================")
    print("Speak into the microphone to see levels...")
    
    CHUNK = 1024
    RATE = 16000
    CHANNELS = 1
    
    p = pyaudio.PyAudio()
    respeaker_index = find_respeaker_device()
    
    stream = p.open(
        format=pyaudio.paInt16,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        input_device_index=respeaker_index,
        frames_per_buffer=CHUNK
    )
    
    start_time = time.time()
    max_level = 0
    
    try:
        while time.time() - start_time < duration:
            data = stream.read(CHUNK, exception_on_overflow=False)
            audio_array = np.frombuffer(data, dtype=np.int16)
            
            # Calculate RMS (Root Mean Square) for volume level
            rms = np.sqrt(np.mean(audio_array**2))
            
            # Normalize to 0-100 scale
            level = min(100, int(rms / 32768 * 200))
            
            # Update max level
            if level > max_level:
                max_level = level
            
            # Display level bar
            bar = '█' * (level // 2)
            spaces = ' ' * (50 - len(bar))
            print(f"\rLevel: [{bar}{spaces}] {level:3d}% (Max: {max_level}%)", end='', flush=True)
            
    except KeyboardInterrupt:
        pass
    finally:
        print("\n")
        stream.stop_stream()
        stream.close()
        p.terminate()


def test_recording(filename="test_recording.wav", duration=5):
    """Test audio recording"""
    print(f"\nRecording Test ({duration} seconds)")
    print("==================================")
    print(f"Recording to: {filename}")
    print("Speak now...")
    
    CHUNK = 1024
    RATE = 16000
    CHANNELS = 1
    
    p = pyaudio.PyAudio()
    respeaker_index = find_respeaker_device()
    
    stream = p.open(
        format=pyaudio.paInt16,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        input_device_index=respeaker_index,
        frames_per_buffer=CHUNK
    )
    
    frames = []
    
    for i in range(0, int(RATE / CHUNK * duration)):
        data = stream.read(CHUNK)
        frames.append(data)
        
        # Show progress
        progress = int((i + 1) / (RATE / CHUNK * duration) * 100)
        print(f"\rRecording... {progress}%", end='', flush=True)
    
    print("\nRecording complete!")
    
    stream.stop_stream()
    stream.close()
    p.terminate()
    
    # Save recording
    wf = wave.open(filename, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(pyaudio.paInt16))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()
    
    print(f"Saved to {filename}")
    return filename


def test_playback(filename="test_recording.wav"):
    """Test audio playback"""
    print(f"\nPlayback Test")
    print("=============")
    print(f"Playing: {filename}")
    
    try:
        wf = wave.open(filename, 'rb')
    except FileNotFoundError:
        print(f"File {filename} not found. Record something first!")
        return
    
    p = pyaudio.PyAudio()
    respeaker_index = find_respeaker_device()
    
    stream = p.open(
        format=p.get_format_from_width(wf.getsampwidth()),
        channels=wf.getnchannels(),
        rate=wf.getframerate(),
        output=True,
        output_device_index=respeaker_index
    )
    
    CHUNK = 1024
    data = wf.readframes(CHUNK)
    
    while data:
        stream.write(data)
        data = wf.readframes(CHUNK)
    
    stream.stop_stream()
    stream.close()
    p.terminate()
    wf.close()
    
    print("Playback complete!")


def test_echo(duration=10):
    """Test real-time echo (mic -> speaker)"""
    print(f"\nEcho Test ({duration} seconds)")
    print("=============================")
    print("Speak into the mic to hear echo...")
    print("WARNING: May cause feedback if speaker is too loud!")
    
    CHUNK = 512
    RATE = 16000
    CHANNELS = 1
    
    p = pyaudio.PyAudio()
    respeaker_index = find_respeaker_device()
    
    # Open streams
    input_stream = p.open(
        format=pyaudio.paInt16,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        input_device_index=respeaker_index,
        frames_per_buffer=CHUNK
    )
    
    output_stream = p.open(
        format=pyaudio.paInt16,
        channels=CHANNELS,
        rate=RATE,
        output=True,
        output_device_index=respeaker_index,
        frames_per_buffer=CHUNK
    )
    
    start_time = time.time()
    
    try:
        while time.time() - start_time < duration:
            data = input_stream.read(CHUNK, exception_on_overflow=False)
            
            # Optional: Add volume reduction to prevent feedback
            audio_array = np.frombuffer(data, dtype=np.int16)
            audio_array = (audio_array * 0.5).astype(np.int16)  # 50% volume
            
            output_stream.write(audio_array.tobytes())
            
    except KeyboardInterrupt:
        pass
    finally:
        input_stream.stop_stream()
        output_stream.stop_stream()
        input_stream.close()
        output_stream.close()
        p.terminate()
    
    print("\nEcho test complete!")


def main():
    """Main test menu"""
    print("\nPommai Audio Test Suite")
    print("=======================")
    print("Testing ReSpeaker 2-Mics Pi HAT")
    
    while True:
        print("\n\nTest Menu:")
        print("1. List audio devices")
        print("2. Monitor audio levels")
        print("3. Test recording")
        print("4. Test playback")
        print("5. Test echo (mic to speaker)")
        print("6. Run all tests")
        print("0. Exit")
        
        try:
            choice = input("\nSelect test (0-6): ").strip()
            
            if choice == '0':
                break
            elif choice == '1':
                list_audio_devices()
            elif choice == '2':
                test_audio_levels(duration=10)
            elif choice == '3':
                test_recording(duration=5)
            elif choice == '4':
                test_playback()
            elif choice == '5':
                test_echo(duration=10)
            elif choice == '6':
                # Run all tests
                list_audio_devices()
                input("\nPress Enter to continue...")
                
                test_audio_levels(duration=5)
                input("\nPress Enter to continue...")
                
                recorded_file = test_recording(duration=3)
                input("\nPress Enter to continue...")
                
                test_playback(recorded_file)
                input("\nPress Enter to continue...")
                
                test_echo(duration=5)
                print("\n\nAll tests complete!")
            else:
                print("Invalid choice!")
                
        except KeyboardInterrupt:
            print("\n\nTest interrupted!")
            break
        except Exception as e:
            print(f"\nError: {e}")
    
    print("\nGoodbye!")


if __name__ == "__main__":
    main()
