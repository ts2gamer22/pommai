# Audio Streaming Protocol Documentation

## Overview
This document specifies the audio streaming protocol between the Raspberry Pi client and the Convex cloud services. The protocol is optimized for low-latency, real-time voice interaction on resource-constrained devices.

## Audio Format Specifications

### Input Audio (Microphone → Cloud)
- **Format**: PCM (Pulse Code Modulation)
- **Sample Rate**: 16000 Hz (16 kHz)
- **Bit Depth**: 16-bit signed integer
- **Channels**: 1 (Mono)
- **Byte Order**: Little-endian
- **Raw Bitrate**: 256 kbps (before compression)

### Output Audio (Cloud → Speaker)
- **Format**: PCM
- **Sample Rate**: 16000 Hz
- **Bit Depth**: 16-bit signed integer
- **Channels**: 1 (Mono)
- **Byte Order**: Little-endian

## Opus Compression Configuration

### Encoder Settings
```python
import pyopus

encoder = pyopus.OpusEncoder(
    sample_rate=16000,
    channels=1,
    application=pyopus.APPLICATION_VOIP  # Optimized for voice
)

# Codec parameters
encoder.set_bitrate(24000)        # 24 kbps target
encoder.set_complexity(5)         # Balance quality/CPU (0-10)
encoder.set_packet_loss_perc(10)  # Handle 10% packet loss
encoder.set_inband_fec(True)      # Forward error correction
encoder.set_dtx(True)             # Discontinuous transmission
```

### Compression Efficiency
- **Uncompressed**: 256 kbps
- **Opus Compressed**: 24 kbps
- **Compression Ratio**: ~10.7:1
- **Latency Added**: <10ms

### Frame Size Configuration
```python
# Opus frame sizes (in samples)
FRAME_SIZE_2_5_MS = 40    # 2.5ms
FRAME_SIZE_5_MS = 80      # 5ms
FRAME_SIZE_10_MS = 160    # 10ms
FRAME_SIZE_20_MS = 320    # 20ms (recommended)
FRAME_SIZE_40_MS = 640    # 40ms
FRAME_SIZE_60_MS = 960    # 60ms

# Recommended for voice
RECOMMENDED_FRAME_SIZE = 320  # 20ms frames
```

## Streaming Architecture

### Audio Pipeline
```
Microphone → PyAudio → Buffer → Opus Encoder → WebSocket → Cloud
                                                              ↓
Speaker ← PyAudio ← Buffer ← Opus Decoder ← WebSocket ← Cloud Response
```

### Chunk Size Optimization
```python
# Audio chunk configuration
CHUNK_SIZE = 1024          # PyAudio buffer size
FRAMES_PER_CHUNK = 3       # Opus frames per network packet
NETWORK_CHUNK_SIZE = 960   # 60ms of audio per packet

# Buffer configuration
RECORDING_BUFFER_SIZE = 50      # ~3 seconds
PLAYBACK_BUFFER_SIZE = 10       # ~600ms
MIN_PLAYBACK_BUFFER = 3         # Start playback after 3 chunks
```

## PyAudio Configuration

### Input Stream (Recording)
```python
import pyaudio

audio = pyaudio.PyAudio()

# Find ReSpeaker device
respeaker_index = None
for i in range(audio.get_device_count()):
    info = audio.get_device_info_by_index(i)
    if 'seeed' in info['name'].lower() or 'respeaker' in info['name'].lower():
        respeaker_index = i
        break

input_stream = audio.open(
    format=pyaudio.paInt16,
    channels=1,
    rate=16000,
    input=True,
    input_device_index=respeaker_index,
    frames_per_buffer=1024,
    stream_callback=None  # Use blocking mode for simplicity
)
```

### Output Stream (Playback)
```python
output_stream = audio.open(
    format=pyaudio.paInt16,
    channels=1,
    rate=16000,
    output=True,
    output_device_index=respeaker_index,
    frames_per_buffer=1024,
    stream_callback=None
)
```

## Streaming State Machine

### States
```
IDLE → RECORDING → STREAMING → PROCESSING → RECEIVING → PLAYING → IDLE
         ↓            ↓           ↓            ↓          ↓
         └────────────────── ERROR ──────────────────────┘
```

### State Transitions
```python
class AudioState(Enum):
    IDLE = "idle"
    RECORDING = "recording"          # Capturing audio
    STREAMING = "streaming"          # Sending to cloud
    PROCESSING = "processing"        # Cloud processing
    RECEIVING = "receiving"          # Getting response
    PLAYING = "playing"             # Playing response
    ERROR = "error"
```

## Real-time Streaming Protocol

### Continuous Streaming Mode
```python
async def stream_audio_continuous():
    sequence = 0
    
    while self.is_recording:
        # Read raw audio
        raw_audio = self.input_stream.read(CHUNK_SIZE, exception_on_overflow=False)
        
        # Convert to numpy array
        audio_array = np.frombuffer(raw_audio, dtype=np.int16)
        
        # Compress with Opus
        compressed = self.opus_encoder.encode(
            audio_array.tobytes(), 
            FRAME_SIZE_20_MS
        )
        
        # Send over WebSocket
        await self.send_audio_chunk(compressed, sequence)
        sequence += 1
        
    # Send final marker
    await self.send_audio_chunk(b'', sequence, is_final=True)
```

### Streaming Playback
```python
async def play_audio_stream(audio_chunks):
    buffer = collections.deque(maxlen=PLAYBACK_BUFFER_SIZE)
    min_buffer_reached = False
    
    async for chunk in audio_chunks:
        # Decompress if needed
        if chunk.get('compressed'):
            pcm_data = self.opus_decoder.decode(
                chunk['data'], 
                FRAME_SIZE_20_MS
            )
        else:
            pcm_data = chunk['data']
            
        buffer.append(pcm_data)
        
        # Start playback once minimum buffer reached
        if not min_buffer_reached and len(buffer) >= MIN_PLAYBACK_BUFFER:
            min_buffer_reached = True
            
        if min_buffer_reached:
            # Play oldest chunk
            if buffer:
                audio_data = buffer.popleft()
                self.output_stream.write(audio_data)
    
    # Flush remaining buffer
    while buffer:
        audio_data = buffer.popleft()
        self.output_stream.write(audio_data)
```

## Latency Optimization

### Target Latencies
- **Audio Capture**: <20ms
- **Opus Encoding**: <10ms
- **Network (Pi → Cloud)**: <50ms
- **Cloud Processing**: <100ms
- **Network (Cloud → Pi)**: <50ms
- **Opus Decoding**: <10ms
- **Audio Playback**: <20ms
- **Total Target**: <260ms

### Optimization Strategies

1. **Parallel Processing**
   ```python
   # Use separate threads for audio I/O
   recording_thread = Thread(target=record_audio)
   playback_thread = Thread(target=play_audio)
   ```

2. **Adaptive Buffering**
   ```python
   # Adjust buffer based on network conditions
   if network_latency > 100:
       MIN_PLAYBACK_BUFFER = 5
   else:
       MIN_PLAYBACK_BUFFER = 3
   ```

3. **Jitter Buffer**
   ```python
   class JitterBuffer:
       def __init__(self, target_delay=100):
           self.buffer = {}
           self.target_delay = target_delay
           self.next_sequence = 0
           
       def add_packet(self, sequence, data):
           self.buffer[sequence] = data
           
       def get_packet(self):
           if self.next_sequence in self.buffer:
               data = self.buffer.pop(self.next_sequence)
               self.next_sequence += 1
               return data
           return None
   ```

## Error Handling

### Audio Underrun/Overrun
```python
try:
    audio_data = stream.read(CHUNK_SIZE, exception_on_overflow=False)
except Exception as e:
    if "overflow" in str(e):
        # Clear buffer and continue
        stream.read(stream.get_read_available(), exception_on_overflow=False)
    elif "underflow" in str(e):
        # Insert silence
        audio_data = b'\x00' * (CHUNK_SIZE * 2)  # 16-bit samples
```

### Network Interruption
```python
async def handle_network_error():
    # Switch to offline mode
    self.is_online = False
    
    # Buffer current recording
    self.offline_buffer.append(self.current_recording)
    
    # Use cached response
    response = await self.get_offline_response()
    await self.play_cached_audio(response)
```

## Memory Management

### Buffer Limits
```python
# Maximum buffer sizes to prevent memory overflow
MAX_RECORDING_BUFFER = 100  # ~6 seconds
MAX_PLAYBACK_BUFFER = 50    # ~3 seconds
MAX_OFFLINE_BUFFER = 10     # 10 conversations

# Circular buffer implementation
class CircularAudioBuffer:
    def __init__(self, max_size):
        self.buffer = collections.deque(maxlen=max_size)
        
    def add(self, audio_chunk):
        self.buffer.append(audio_chunk)
        
    def get_all(self):
        return b''.join(self.buffer)
```

## Testing and Validation

### Audio Quality Tests
1. **Silence Detection**: Verify no audio during silence
2. **Clipping Detection**: Check for audio saturation
3. **Latency Measurement**: Time from speech to response
4. **Packet Loss Simulation**: Test with 5%, 10%, 20% loss

### Test Commands
```bash
# Test audio recording
python -c "import pyaudio; print(pyaudio.PyAudio().get_device_count())"

# Test Opus encoding
python test_opus.py --input test.wav --output test.opus

# Measure round-trip latency
python measure_latency.py --iterations 100
```

## Performance Metrics

### Target Performance (Pi Zero 2W)
- **CPU Usage**: <30% during streaming
- **Memory Usage**: <50MB for audio pipeline
- **Network Bandwidth**: <5KB/s average
- **Battery Life**: >8 hours continuous use

### Monitoring
```python
import psutil

def monitor_performance():
    return {
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory_mb': psutil.Process().memory_info().rss / 1024 / 1024,
        'audio_buffer_size': len(self.recording_buffer),
        'network_latency': self.measure_latency()
    }
```
