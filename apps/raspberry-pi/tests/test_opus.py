#!/usr/bin/env python3
"""
Test script for Opus audio codec integration
Tests encoding, decoding, compression ratio, and network simulation
"""

import asyncio
import sys
import os
import time
import logging
import numpy as np
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from opus_audio_codec import OpusAudioCodec, OpusConfig, OpusStreamProcessor, NetworkQuality

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OpusTestSuite:
    """Test suite for Opus codec functionality"""
    
    def __init__(self):
        self.test_passed = 0
        self.test_failed = 0
        
    async def run_all_tests(self):
        """Run all Opus codec tests"""
        logger.info("=== Opus Codec Test Suite ===\n")
        
        # Basic tests
        await self.test_basic_encoding()
        await self.test_compression_ratio()
        await self.test_packet_loss_concealment()
        await self.test_adaptive_bitrate()
        await self.test_silence_detection()
        await self.test_stream_processing()
        await self.test_network_simulation()
        
        # Print summary
        total = self.test_passed + self.test_failed
        logger.info(f"\n=== Test Summary ===")
        logger.info(f"Total tests: {total}")
        logger.info(f"Passed: {self.test_passed}")
        logger.info(f"Failed: {self.test_failed}")
        
        return self.test_failed == 0
    
    def log_test(self, name: str, passed: bool, details: str = ""):
        """Log test result"""
        if passed:
            self.test_passed += 1
            logger.info(f"✓ {name}: PASSED {details}")
        else:
            self.test_failed += 1
            logger.error(f"✗ {name}: FAILED {details}")
    
    async def test_basic_encoding(self):
        """Test basic encoding and decoding"""
        logger.info("\n1. Testing basic encoding/decoding...")
        
        try:
            # Create codec
            codec = OpusAudioCodec()
            
            # Generate test audio (440Hz sine wave)
            duration = 0.02  # 20ms
            sample_rate = 16000
            t = np.linspace(0, duration, int(sample_rate * duration))
            audio = (np.sin(2 * np.pi * 440 * t) * 16384).astype(np.int16)
            pcm_data = audio.tobytes()
            
            # Encode
            encoded = codec.encode_chunk(pcm_data)
            self.log_test("Encoding", encoded is not None, 
                         f"({len(pcm_data)} → {len(encoded)} bytes)")
            
            # Decode
            decoded = codec.decode_chunk(encoded)
            self.log_test("Decoding", decoded is not None,
                         f"({len(decoded)} bytes)")
            
            # Check if decoded length matches original
            self.log_test("Length match", len(decoded) == len(pcm_data),
                         f"({len(decoded)} vs {len(pcm_data)})")
            
            # Calculate SNR
            original = np.frombuffer(pcm_data, dtype=np.int16)
            reconstructed = np.frombuffer(decoded, dtype=np.int16)
            error = original - reconstructed
            snr = 10 * np.log10(np.mean(original**2) / np.mean(error**2))
            
            self.log_test("Quality (SNR)", snr > 20,
                         f"({snr:.1f} dB)")
            
            codec.cleanup()
            
        except Exception as e:
            self.log_test("Basic encoding", False, str(e))
    
    async def test_compression_ratio(self):
        """Test compression efficiency"""
        logger.info("\n2. Testing compression ratio...")
        
        try:
            codec = OpusAudioCodec()
            
            # Test with different audio types
            test_cases = [
                ("Silence", np.zeros(320, dtype=np.int16)),
                ("White noise", np.random.randint(-16384, 16384, 320, dtype=np.int16)),
                ("Sine wave", (np.sin(2 * np.pi * 440 * np.linspace(0, 0.02, 320)) * 16384).astype(np.int16)),
                ("Speech-like", (np.sin(2 * np.pi * 200 * np.linspace(0, 0.02, 320)) * 
                               np.sin(2 * np.pi * 5 * np.linspace(0, 0.02, 320)) * 16384).astype(np.int16))
            ]
            
            for name, audio in test_cases:
                pcm_data = audio.tobytes()
                encoded = codec.encode_chunk(pcm_data)
                
                if encoded:
                    ratio = len(pcm_data) / len(encoded)
                    self.log_test(f"{name} compression", True,
                                 f"(ratio: {ratio:.2f}:1)")
            
            # Check overall metrics
            metrics = codec.get_metrics()
            overall_ratio = metrics['compression_ratio']
            self.log_test("Overall compression", overall_ratio > 5,
                         f"({overall_ratio:.2f}:1)")
            
            codec.cleanup()
            
        except Exception as e:
            self.log_test("Compression ratio", False, str(e))
    
    async def test_packet_loss_concealment(self):
        """Test packet loss concealment"""
        logger.info("\n3. Testing packet loss concealment...")
        
        try:
            codec = OpusAudioCodec()
            
            # Encode a sequence of frames
            frames = []
            for i in range(5):
                audio = (np.sin(2 * np.pi * 440 * np.linspace(i*0.02, (i+1)*0.02, 320)) * 16384).astype(np.int16)
                encoded = codec.encode_chunk(audio.tobytes())
                frames.append(encoded)
            
            # Simulate packet loss (frame 2 is lost)
            decoded_frames = []
            for i, frame in enumerate(frames):
                if i == 2:
                    # Simulate lost packet
                    decoded = codec.decode_with_plc(None)
                    self.log_test("PLC generation", len(decoded) > 0,
                                 f"({len(decoded)} bytes)")
                else:
                    decoded = codec.decode_with_plc(frame)
                
                decoded_frames.append(decoded)
            
            # Check continuity
            total_decoded = b''.join(decoded_frames)
            self.log_test("PLC continuity", len(total_decoded) == 320 * 2 * 5,
                         f"({len(total_decoded)} bytes)")
            
            # Check metrics
            metrics = codec.get_metrics()
            self.log_test("Packet loss tracking", metrics['packets_lost'] == 1,
                         f"({metrics['packets_lost']} lost)")
            
            codec.cleanup()
            
        except Exception as e:
            self.log_test("Packet loss concealment", False, str(e))
    
    async def test_adaptive_bitrate(self):
        """Test adaptive bitrate based on network conditions"""
        logger.info("\n4. Testing adaptive bitrate...")
        
        try:
            codec = OpusAudioCodec()
            
            # Test different network conditions
            test_conditions = [
                (0.0, 30, NetworkQuality.EXCELLENT, 32000),   # Perfect network
                (0.02, 50, NetworkQuality.GOOD, 24000),       # Good network
                (0.05, 100, NetworkQuality.FAIR, 16000),      # Fair network
                (0.15, 200, NetworkQuality.POOR, 12000)       # Poor network
            ]
            
            for packet_loss, rtt, expected_quality, expected_bitrate in test_conditions:
                codec.adapt_bitrate(packet_loss, rtt)
                
                metrics = codec.get_metrics()
                current_quality = metrics['network_quality']
                current_bitrate = metrics['current_bitrate']
                
                self.log_test(f"Adapt to {expected_quality.value}",
                            current_quality == expected_quality and current_bitrate == expected_bitrate,
                            f"(loss={packet_loss:.0%}, RTT={rtt}ms → {current_bitrate}bps)")
            
            codec.cleanup()
            
        except Exception as e:
            self.log_test("Adaptive bitrate", False, str(e))
    
    async def test_silence_detection(self):
        """Test silence detection with DTX"""
        logger.info("\n5. Testing silence detection...")
        
        try:
            # Create codec with DTX enabled
            config = OpusConfig(enable_dtx=True)
            codec = OpusAudioCodec(config)
            
            # Generate test stream with speech and silence
            async def generate_audio():
                # 1 second of tone
                for _ in range(50):  # 50 * 20ms = 1s
                    audio = (np.sin(2 * np.pi * 440 * np.linspace(0, 0.02, 320)) * 8192).astype(np.int16)
                    yield audio.tobytes()
                
                # 1 second of silence
                for _ in range(50):
                    yield np.zeros(320, dtype=np.int16).tobytes()
            
            # Process stream
            chunks_encoded = 0
            async for encoded_chunk in codec.encode_stream(generate_audio()):
                chunks_encoded += 1
            
            # Should encode fewer chunks due to DTX
            self.log_test("DTX silence suppression", chunks_encoded < 100,
                         f"({chunks_encoded} chunks encoded out of 100)")
            
            codec.cleanup()
            
        except Exception as e:
            self.log_test("Silence detection", False, str(e))
    
    async def test_stream_processing(self):
        """Test real-time stream processing"""
        logger.info("\n6. Testing stream processing...")
        
        try:
            processor = OpusStreamProcessor()
            
            # Simulated network functions
            network_buffer = asyncio.Queue()
            
            async def network_send(frame):
                await network_buffer.put(frame)
            
            async def network_recv():
                try:
                    return await asyncio.wait_for(network_buffer.get(), timeout=0.1)
                except asyncio.TimeoutError:
                    return None
            
            # Generate test audio stream
            async def audio_input():
                for i in range(10):  # 200ms of audio
                    audio = (np.sin(2 * np.pi * 440 * np.linspace(i*0.02, (i+1)*0.02, 320)) * 8192).astype(np.int16)
                    yield audio.tobytes()
                    await asyncio.sleep(0.02)  # Simulate real-time
            
            # Output queue
            output_queue = asyncio.Queue()
            
            # Process stream
            process_task = asyncio.create_task(
                processor.process_duplex_stream(
                    audio_input(),
                    output_queue,
                    network_send,
                    network_recv
                )
            )
            
            # Wait a bit then stop
            await asyncio.sleep(0.5)
            processor.stop()
            
            # Check results
            frames_sent = network_buffer.qsize()
            self.log_test("Stream processing", frames_sent > 0,
                         f"({frames_sent} frames processed)")
            
        except Exception as e:
            self.log_test("Stream processing", False, str(e))
    
    async def test_network_simulation(self):
        """Test with simulated network conditions"""
        logger.info("\n7. Testing network simulation...")
        
        try:
            codec = OpusAudioCodec()
            
            # Simulate streaming with packet loss
            sent_packets = []
            received_packets = []
            packet_loss_rate = 0.1  # 10% loss
            
            # Send phase
            for i in range(20):
                audio = (np.sin(2 * np.pi * 440 * np.linspace(i*0.02, (i+1)*0.02, 320)) * 8192).astype(np.int16)
                encoded = codec.encode_chunk(audio.tobytes())
                sent_packets.append((i, encoded))
            
            # Receive phase with simulated loss
            for seq, packet in sent_packets:
                if np.random.random() > packet_loss_rate:
                    # Packet received
                    decoded = codec.decode_with_plc(packet)
                else:
                    # Packet lost
                    decoded = codec.decode_with_plc(None)
                
                received_packets.append(decoded)
            
            # Check results
            total_sent = len(sent_packets)
            metrics = codec.get_metrics()
            actual_loss = metrics['packets_lost'] / total_sent
            
            self.log_test("Network simulation", 
                         abs(actual_loss - packet_loss_rate) < 0.05,
                         f"(target loss: {packet_loss_rate:.0%}, actual: {actual_loss:.0%})")
            
            # Check audio continuity
            total_decoded = b''.join(received_packets)
            expected_length = 320 * 2 * len(sent_packets)
            self.log_test("Audio continuity maintained",
                         len(total_decoded) == expected_length,
                         f"({len(total_decoded)} bytes)")
            
            codec.cleanup()
            
        except Exception as e:
            self.log_test("Network simulation", False, str(e))


async def main():
    """Run Opus codec tests"""
    print("\nPommai Opus Audio Codec Test")
    print("=" * 40)
    
    # Check if running on Raspberry Pi
    is_pi = os.path.exists('/sys/firmware/devicetree/base/model')
    if is_pi:
        with open('/sys/firmware/devicetree/base/model', 'r') as f:
            model = f.read()
            print(f"Running on: {model.strip()}")
    else:
        print("Running on: Development machine")
    
    print(f"Python: {sys.version.split()[0]}")
    print("=" * 40)
    
    # Run tests
    test_suite = OpusTestSuite()
    success = await test_suite.run_all_tests()
    
    if success:
        print("\n✓ All tests passed!")
        return 0
    else:
        print("\n✗ Some tests failed!")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
