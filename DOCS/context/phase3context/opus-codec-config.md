# Opus Audio Codec Configuration Guide

## Overview
Opus is an open-source, royalty-free audio codec designed for interactive speech and audio transmission over the internet. For Pommai, Opus provides excellent voice quality at low bitrates, crucial for the Pi Zero 2W's limited resources.

## Why Opus for Pommai?

### Key Benefits
- **Low Latency**: <26.5ms algorithmic delay
- **Excellent Compression**: 10:1 ratio for voice
- **Packet Loss Resilience**: Built-in FEC (Forward Error Correction)
- **Dynamic Bitrate**: Adapts to network conditions
- **Low CPU Usage**: Optimized for ARM processors
- **Voice Optimized**: VOIP mode perfect for toy interaction

### Comparison with Alternatives
| Codec | Bitrate | Quality | Latency | CPU Usage |
|-------|---------|---------|---------|-----------|
| Opus | 24 kbps | Excellent | 26.5ms | Low |
| MP3 | 64 kbps | Good | 150ms | Medium |
| AAC | 48 kbps | Good | 100ms | High |
| G.722 | 64 kbps | Fair | 4ms | Very Low |
| PCM | 256 kbps | Perfect | 0ms | None |

## Installation

### System Dependencies
```bash
# Install Opus library
sudo apt install -y libopus0 libopus-dev libopusfile0

# Install Python bindings
pip install opuslib pyogg
```

### Alternative: PyOpus (Pure Python)
```bash
# For systems where opuslib fails
pip install pyopus
```

## Basic Configuration

### Opus Encoder Setup
```python
import opuslib

class OpusAudioCodec:
    def __init__(self):
        # Initialize encoder
        self.encoder = opuslib.Encoder(
            fs=16000,           # Sample rate
            channels=1,         # Mono
            application=opuslib.APPLICATION_VOIP  # Voice mode
        )
        
        # Initialize decoder
        self.decoder = opuslib.Decoder(
            fs=16000,
            channels=1
        )
        
        # Configure encoder parameters
        self._configure_encoder()
        
    def _configure_encoder(self):
        """Set optimal parameters for voice on Pi Zero 2W"""
        # Bitrate (24 kbps for good quality/size balance)
        self.encoder.bitrate = 24000
        
        # Complexity (5 = balanced for Pi Zero 2W)
        # Range: 0-10, higher = better quality but more CPU
        self.encoder.complexity = 5
        
        # Enable in-band Forward Error Correction
        self.encoder.inband_fec = True
        
        # Expected packet loss percentage
        self.encoder.packet_loss_perc = 10
        
        # Enable Discontinuous Transmission (silence detection)
        self.encoder.dtx = True
        
        # Signal type hint
        self.encoder.signal = opuslib.SIGNAL_VOICE
```

## Frame Size Selection

### Optimal Frame Sizes for Voice
```python
# Frame size in samples (at 16kHz)
FRAME_SIZES = {
    '2.5ms': 40,    # Ultra-low latency (not recommended)
    '5ms': 80,      # Very low latency
    '10ms': 160,    # Low latency
    '20ms': 320,    # Recommended for voice
    '40ms': 640,    # Good for music
    '60ms': 960,    # Maximum frame size
}

# Recommended configuration
RECOMMENDED_FRAME_SIZE = FRAME_SIZES['20ms']  # 320 samples
FRAMES_PER_PACKET = 3  # Send 60ms per network packet
```

### Frame Size vs Performance
```python
def calculate_frame_metrics(frame_size_ms, sample_rate=16000):
    """Calculate performance metrics for different frame sizes"""
    samples_per_frame = int(sample_rate * frame_size_ms / 1000)
    frames_per_second = 1000 / frame_size_ms
    
    return {
        'frame_size_ms': frame_size_ms,
        'samples_per_frame': samples_per_frame,
        'frames_per_second': frames_per_second,
        'latency_ms': frame_size_ms,
        'network_packets_per_second': frames_per_second
    }

# Compare different configurations
for size in [10, 20, 40, 60]:
    metrics = calculate_frame_metrics(size)
    print(f"{size}ms: {metrics}")
```

## Encoding Implementation

### Basic Encoding
```python
def encode_audio(self, pcm_data: bytes, frame_size: int = 320) -> bytes:
    """
    Encode PCM audio to Opus
    
    Args:
        pcm_data: Raw PCM audio (16-bit, 16kHz, mono)
        frame_size: Number of samples per frame
        
    Returns:
        Compressed Opus data
    """
    try:
        # Ensure correct data length
        expected_bytes = frame_size * 2  # 16-bit = 2 bytes per sample
        
        if len(pcm_data) != expected_bytes:
            raise ValueError(f"Expected {expected_bytes} bytes, got {len(pcm_data)}")
        
        # Encode
        opus_data = self.encoder.encode(pcm_data, frame_size)
        
        return opus_data
        
    except Exception as e:
        logging.error(f"Opus encoding error: {e}")
        return b''
```

### Streaming Encoder
```python
class OpusStreamEncoder:
    def __init__(self, chunk_size=1024, frame_size=320):
        self.chunk_size = chunk_size
        self.frame_size = frame_size
        self.buffer = bytearray()
        self.encoder = self._create_encoder()
        
    def _create_encoder(self):
        encoder = opuslib.Encoder(16000, 1, opuslib.APPLICATION_VOIP)
        encoder.bitrate = 24000
        encoder.complexity = 5
        encoder.inband_fec = True
        encoder.packet_loss_perc = 10
        return encoder
        
    async def encode_stream(self, audio_stream):
        """Encode audio stream in real-time"""
        async for chunk in audio_stream:
            self.buffer.extend(chunk)
            
            # Process complete frames
            while len(self.buffer) >= self.frame_size * 2:
                # Extract one frame
                frame_data = bytes(self.buffer[:self.frame_size * 2])
                self.buffer = self.buffer[self.frame_size * 2:]
                
                # Encode
                encoded = self.encoder.encode(frame_data, self.frame_size)
                
                yield {
                    'data': encoded,
                    'timestamp': time.time(),
                    'frame_size': self.frame_size
                }
```

## Decoding Implementation

### Basic Decoding
```python
def decode_audio(self, opus_data: bytes, frame_size: int = 320) -> bytes:
    """
    Decode Opus audio to PCM
    
    Args:
        opus_data: Compressed Opus data
        frame_size: Expected frame size in samples
        
    Returns:
        PCM audio data (16-bit, 16kHz, mono)
    """
    try:
        # Decode
        pcm_data = self.decoder.decode(opus_data, frame_size)
        
        return pcm_data
        
    except Exception as e:
        logging.error(f"Opus decoding error: {e}")
        # Return silence on error
        return b'\x00' * (frame_size * 2)
```

### Packet Loss Concealment
```python
class OpusDecoderWithPLC:
    """Decoder with Packet Loss Concealment"""
    
    def __init__(self):
        self.decoder = opuslib.Decoder(16000, 1)
        self.last_frame_size = 320
        
    def decode_with_plc(self, opus_data: bytes = None, frame_size: int = 320):
        """Decode with packet loss concealment"""
        if opus_data is None:
            # Packet lost - generate concealment
            pcm_data = self.decoder.decode(None, self.last_frame_size, fec=True)
        else:
            # Normal decode
            pcm_data = self.decoder.decode(opus_data, frame_size)
            self.last_frame_size = frame_size
            
        return pcm_data
```

## Advanced Configuration

### Dynamic Bitrate Adaptation
```python
class AdaptiveOpusEncoder:
    def __init__(self):
        self.encoder = self._create_encoder()
        self.network_quality = 1.0  # 0.0 = poor, 1.0 = excellent
        
    def adapt_bitrate(self, packet_loss_rate, rtt_ms):
        """Adapt bitrate based on network conditions"""
        # Calculate network quality score
        quality = 1.0 - (packet_loss_rate * 2)  # Heavy penalty for loss
        quality -= (rtt_ms - 50) / 1000  # Penalty for high RTT
        quality = max(0.0, min(1.0, quality))
        
        self.network_quality = quality
        
        # Adjust bitrate
        if quality > 0.8:
            self.encoder.bitrate = 32000  # High quality
        elif quality > 0.6:
            self.encoder.bitrate = 24000  # Normal quality
        elif quality > 0.4:
            self.encoder.bitrate = 16000  # Reduced quality
        else:
            self.encoder.bitrate = 12000  # Minimum quality
            
        # Adjust FEC
        self.encoder.packet_loss_perc = int(packet_loss_rate * 100)
        
        logging.info(f"Adapted bitrate to {self.encoder.bitrate} (quality: {quality:.2f})")
```

### Voice Activity Detection Integration
```python
class OpusVADEncoder:
    def __init__(self):
        self.encoder = self._create_encoder()
        self.vad_threshold = -40  # dBFS
        
    def encode_with_vad(self, pcm_data, frame_size=320):
        """Encode only if voice is detected"""
        # Calculate RMS energy
        import numpy as np
        audio_array = np.frombuffer(pcm_data, dtype=np.int16)
        rms = np.sqrt(np.mean(audio_array ** 2))
        
        # Convert to dBFS
        if rms > 0:
            db = 20 * np.log10(rms / 32768)
        else:
            db = -96
            
        # Check VAD
        if db > self.vad_threshold:
            # Voice detected - encode normally
            return self.encoder.encode(pcm_data, frame_size), True
        else:
            # Silence - use DTX
            return b'', False
```

## Memory Optimization

### Buffer Management
```python
class OpusBufferManager:
    def __init__(self, max_buffer_size=10):
        self.encode_buffer = collections.deque(maxlen=max_buffer_size)
        self.decode_buffer = collections.deque(maxlen=max_buffer_size)
        
    def add_encoded_frame(self, frame):
        """Add encoded frame with automatic overflow handling"""
        if len(self.encode_buffer) == self.encode_buffer.maxlen:
            logging.warning("Encode buffer full, dropping oldest frame")
        self.encode_buffer.append(frame)
        
    def get_memory_usage(self):
        """Calculate current memory usage"""
        encode_size = sum(len(frame) for frame in self.encode_buffer)
        decode_size = sum(len(frame) for frame in self.decode_buffer)
        
        return {
            'encode_buffer_kb': encode_size / 1024,
            'decode_buffer_kb': decode_size / 1024,
            'total_kb': (encode_size + decode_size) / 1024
        }
```

## Performance Benchmarking

### Compression Ratio Testing
```python
def benchmark_opus_compression():
    """Benchmark Opus compression performance"""
    import time
    
    encoder = opuslib.Encoder(16000, 1, opuslib.APPLICATION_VOIP)
    encoder.bitrate = 24000
    
    # Generate test audio (1 second of sine wave)
    import numpy as np
    t = np.linspace(0, 1, 16000)
    audio = (np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16)
    pcm_data = audio.tobytes()
    
    # Test different frame sizes
    results = []
    for frame_ms in [10, 20, 40, 60]:
        frame_size = int(16000 * frame_ms / 1000)
        
        compressed_size = 0
        encode_time = 0
        
        for i in range(0, len(audio), frame_size):
            chunk = pcm_data[i*2:(i+frame_size)*2]
            if len(chunk) == frame_size * 2:
                start = time.time()
                encoded = encoder.encode(chunk, frame_size)
                encode_time += time.time() - start
                compressed_size += len(encoded)
        
        results.append({
            'frame_ms': frame_ms,
            'compression_ratio': len(pcm_data) / compressed_size,
            'encode_time_ms': encode_time * 1000,
            'bitrate_kbps': (compressed_size * 8) / 1000
        })
    
    return results
```

## Integration with PyAudio

### Complete Audio Pipeline
```python
class OpusAudioPipeline:
    def __init__(self):
        self.encoder = OpusAudioCodec()
        self.audio = pyaudio.PyAudio()
        self.setup_streams()
        
    def setup_streams(self):
        self.input_stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=16000,
            input=True,
            frames_per_buffer=320
        )
        
        self.output_stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=16000,
            output=True,
            frames_per_buffer=320
        )
        
    async def process_audio(self):
        """Main audio processing loop"""
        while True:
            # Record
            pcm_data = self.input_stream.read(320, exception_on_overflow=False)
            
            # Encode
            opus_data = self.encoder.encode_audio(pcm_data, 320)
            
            # Send to network
            await self.send_to_network(opus_data)
            
            # Receive from network
            received_opus = await self.receive_from_network()
            
            # Decode
            pcm_output = self.encoder.decode_audio(received_opus, 320)
            
            # Play
            self.output_stream.write(pcm_output)
```

## Troubleshooting

### Common Issues

1. **Import Error**
   ```python
   # If opuslib fails, try:
   try:
       import opuslib
   except ImportError:
       import pyopus as opuslib
   ```

2. **Crackling Audio**
   - Increase buffer size
   - Reduce complexity setting
   - Check for CPU throttling

3. **High CPU Usage**
   ```python
   # Reduce complexity for Pi Zero 2W
   encoder.complexity = 3  # Lower value
   ```

4. **Network Issues**
   ```python
   # Enable more aggressive FEC
   encoder.inband_fec = True
   encoder.packet_loss_perc = 20
   ```

## Best Practices

1. **Always use 16kHz for voice** - Higher sample rates waste bandwidth
2. **Use 20ms frames** - Best balance of latency and efficiency
3. **Enable DTX** - Saves bandwidth during silence
4. **Monitor packet loss** - Adjust FEC dynamically
5. **Buffer at least 3 frames** - Smooth out network jitter
6. **Test with real network conditions** - Use traffic shaping

This configuration ensures optimal voice quality while maintaining low latency and efficient bandwidth usage on the Raspberry Pi Zero 2W.
