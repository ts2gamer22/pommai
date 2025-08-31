# FastRTC WebSocket and Python Integration Documentation

## Overview
FastRTC is a Python library that provides real-time audio and video streaming over WebRTC and WebSockets. It integrates with Gradio for UI and FastAPI for server implementation.

## Key Components

### 1. Python Stream Handler Setup

#### Basic Audio Echo Stream
```python
from fastrtc import Stream, ReplyOnPause
from fastapi import FastAPI

def echo(audio):
    yield audio

app = FastAPI()

stream = Stream(ReplyOnPause(echo), modality="audio", mode="send-receive")
stream.mount(app)

# run with `uvicorn main:app`
```

#### Synchronous StreamHandler Implementation
```python
import gradio as gr
from fastrtc import StreamHandler
from queue import Queue
import numpy as np

class EchoHandler(StreamHandler):
    def __init__(self) -> None:
        super().__init__()
        self.queue = Queue()

    def receive(self, frame: tuple[int, np.ndarray]) -> None:
        self.queue.put(frame)

    def emit(self) -> None:
        return self.queue.get()
    
    def copy(self) -> StreamHandler:
        return EchoHandler()
    
    def shutdown(self) -> None:
        pass
    
    def start_up(self) -> None:
        pass

stream = Stream(
    handler=EchoHandler(),
    modality="audio",
    mode="send-receive"
)
```

#### Asynchronous StreamHandler Implementation
```python
from fastrtc import AsyncStreamHandler, wait_for_item, Stream
import asyncio
import numpy as np

class AsyncEchoHandler(AsyncStreamHandler):
    """Simple Async Echo Handler"""

    def __init__(self) -> None:
        super().__init__(input_sample_rate=24000)
        self.queue = asyncio.Queue()

    async def receive(self, frame: tuple[int, np.ndarray]) -> None:
        await self.queue.put(frame)

    async def emit(self) -> None:
        return await wait_for_item(self.queue)

    def copy(self):
        return AsyncEchoHandler()

    async def shutdown(self):
        pass

    async def start_up(self) -> None:
        pass
```

### 2. WebSocket Connection (JavaScript Client)

#### Establishing WebSocket Connection for Audio Streaming
```javascript
// Setup audio context and stream
const audioContext = new AudioContext();
const stream = await navigator.mediaDevices.getUserMedia({
    audio: true
});

// Create WebSocket connection
const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket/offer`);

ws.onopen = () => {
    // Send initial start message with unique ID
    ws.send(JSON.stringify({
        event: "start",
        websocket_id: generateId()  // Implement your own ID generator
    }));

    // Setup audio processing
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(2048, 1, 1);
    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const mulawData = convertToMulaw(inputData, audioContext.sampleRate);
        const base64Audio = btoa(String.fromCharCode.apply(null, mulawData));
        
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                event: "media",
                media: {
                    payload: base64Audio
                }
            }));
        }
    };
};

// Handle incoming audio
const outputContext = new AudioContext({ sampleRate: 24000 });
let audioQueue = [];
let isPlaying = false;

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.event === "media") {
        // Process received audio
        const audioData = atob(data.media.payload);
        const mulawData = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
            mulawData[i] = audioData.charCodeAt(i);
        }

        // Convert mu-law to linear PCM
        const linearData = alawmulaw.mulaw.decode(mulawData);
        const audioBuffer = outputContext.createBuffer(1, linearData.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < linearData.length; i++) {
            channelData[i] = linearData[i] / 32768.0;
        }

        audioQueue.push(audioBuffer);
        if (!isPlaying) {
            playNextBuffer();
        }
    }
};

function playNextBuffer() {
    if (audioQueue.length === 0) {
        isPlaying = false;
        return;
    }

    isPlaying = true;
    const bufferSource = outputContext.createBufferSource();
    bufferSource.buffer = audioQueue.shift();
    bufferSource.connect(outputContext.destination);
    bufferSource.onended = playNextBuffer;
    bufferSource.start();
}
```

### 3. Input/Output Handling

#### Python Backend - Receiving Frontend Input
```python
from pydantic import BaseModel

class InputData(BaseModel):
    webrtc_id: str
    inputs: dict

@stream.post("/input_hook")
async def _(data: InputData):
    stream.set_inputs(data.webrtc_id, data.inputs)
```

#### Python Backend - Streaming Output via SSE
```python
from fastapi.responses import StreamingResponse

@stream.get("/outputs")
async def stream_updates(webrtc_id: str):
    async def output_stream():
        async for output in stream.output_stream(webrtc_id):
            # Output is the AdditionalOutputs instance
            yield f"data: {output.args[0]}\n\n"

    return StreamingResponse(
        output_stream(), 
        media_type="text/event-stream"
    )
```

#### JavaScript Client - Handle Server Input Requests
```javascript
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle send_input messages
    if (data?.type === "send_input") {
        fetch('/input_hook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                webrtc_id: websocket_id,
                inputs: your_input_data 
            })
        });
    }
    // ... existing audio handling code ...
};
```

#### JavaScript Client - Receive Additional Outputs via SSE
```javascript
const eventSource = new EventSource('/outputs?webrtc_id=' + websocket_id);
eventSource.addEventListener("output", (event) => {
    const eventJson = JSON.parse(event.data);
    // Handle the output data here
    console.log("Received output:", eventJson);
});
```

### 4. ReplyOnPause for Audio Response Generation

```python
from fastrtc import ReplyOnPause, Stream

def response(audio: tuple[int, np.ndarray]):
    sample_rate, audio_array = audio
    # Generate response
    for audio_chunk in generate_response(sample_rate, audio_array):
        yield (sample_rate, audio_chunk)

stream = Stream(
    handler=ReplyOnPause(response),
    modality="audio",
    mode="send-receive"
)
```

#### With Startup Function
```python
from fastrtc import get_tts_model, Stream, ReplyOnPause

tts_client = get_tts_model()

def echo(audio: tuple[int, np.ndarray]):
    yield audio

def startup():
    for chunk in tts_client.stream_tts_sync("Welcome to the echo audio demo!"):
        yield chunk

stream = Stream(
    handler=ReplyOnPause(echo, startup_fn=startup),
    modality="audio",
    mode="send-receive",
)
```

### 5. LLM Voice Chat Integration

```python
import os
from fastrtc import ReplyOnPause, Stream, get_stt_model, get_tts_model
from openai import OpenAI

# Initialize clients and models
sambanova_client = OpenAI(
    api_key=os.getenv("SAMBANOVA_API_KEY"), 
    base_url="https://api.sambanova.ai/v1"
)
stt_model = get_stt_model()
tts_model = get_tts_model()

def echo(audio):
    # Speech to text
    prompt = stt_model.stt(audio)
    
    # LLM processing
    response = sambanova_client.chat.completions.create(
        model="Meta-Llama-3.2-3B-Instruct",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
    )
    prompt = response.choices[0].message.content
    
    # Text to speech
    for audio_chunk in tts_model.stream_tts_sync(prompt):
        yield audio_chunk

stream = Stream(ReplyOnPause(echo), modality="audio", mode="send-receive")
```

### 6. Video Streaming

```python
from fastrtc import Stream
import gradio as gr

def detection(image, conf_threshold=0.3):
    processed_frame = process_frame(image, conf_threshold)
    return processed_frame

stream = Stream(
    handler=detection,
    modality="video",
    mode="send-receive",
    additional_inputs=[
        gr.Slider(minimum=0, maximum=1, step=0.01, value=0.3)
    ],
)
```

### 7. Additional Outputs

```python
from fastrtc import Stream, AdditionalOutputs
import gradio as gr

def detection(image, conf_threshold=0.3):
    processed_frame, n_objects = process_frame(image, conf_threshold)
    return processed_frame, AdditionalOutputs(n_objects)

stream = Stream(
    handler=detection,
    modality="video",
    mode="send-receive",
    additional_inputs=[
        gr.Slider(minimum=0, maximum=1, step=0.01, value=0.3)
    ],
    additional_outputs=[gr.Number()],
    additional_outputs_handler=lambda component, n_objects: n_objects
)
```

### 8. Telephone Integration (Twilio)

```python
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Connect

@app.post("/call")
async def start_call(req: Request):
    body = await req.json()
    from_no = body.get("from")
    to_no = body.get("to")
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    client = Client(account_sid, auth_token)

    call = client.calls.create(
        to=to_no,
        from_=from_no,
        url="https://[your_ngrok_subdomain].ngrok.app/incoming-call"
    )
    return {"sid": f"{call.sid}"}

@app.api_route("/incoming-call", methods=["GET", "POST"])
async def handle_incoming_call(req: Request):
    response = VoiceResponse()
    response.say("Connecting to AI assistant")
    connect = Connect()
    connect.stream(url=f'wss://{req.url.hostname}/media-stream')
    response.append(connect)
    return HTMLResponse(content=str(response), media_type="application/xml")

@app.websocket("/media-stream")
async def handle_media_stream(websocket: WebSocket):
    await stream.telephone_handler(websocket)
```

### 9. WebRTC Configuration

```python
from fastrtc import Stream

# Configure TURN server for WebRTC
rtc_configuration = {
    "iceServers": [
        {
            "urls": "turn:35.173.254.80:80",
            "username": "<my-username>",
            "credential": "<my-password>"
        }
    ]
}

Stream(
    handler=...,
    rtc_configuration=rtc_configuration,
    modality="audio",
    mode="send-receive"
)
```

### 10. Error Handling

```python
from fastrtc import WebRTCError

def generation(num_steps):
    for _ in range(num_steps):
        # Process audio
        yield audio_chunk
    raise WebRTCError("This is a test error")
```

### 11. Concurrency Limit Handling

Server response when concurrency limit is reached:
```json
{
    "status": "failed",
    "meta": {
        "error": "concurrency_limit_reached",
        "limit": 10
    }
}
```

JavaScript client handling:
```javascript
if (serverResponse.status === 'failed') {
    if (serverResponse.meta.error === 'concurrency_limit_reached') {
        showError(`Too many connections. Maximum limit is ${serverResponse.meta.limit}`);
    } else {
        showError(serverResponse.meta.error);
    }
    stop();
    return;
}
```

## Key Concepts

### Audio Encoding
- Audio is encoded using mu-law format for efficient transmission
- Sample rate typically 24000 Hz for output
- Conversion between Float32Array and Int16Array required

### Message Protocol
WebSocket messages follow this structure:
- `event: "start"` - Initialize connection
- `event: "media"` - Audio data transmission
- `event: "stop"` - Terminate connection
- `type: "send_input"` - Server requesting input

### Stream Modes
- `send` - Client sends audio/video only
- `receive` - Client receives audio/video only  
- `send-receive` - Bidirectional streaming

### Modalities
- `audio` - Audio streaming
- `video` - Video streaming
- `audio-video` - Combined audio and video

## Best Practices

1. **Connection Management**: Always handle connection state changes and implement proper cleanup
2. **Audio Buffering**: Use queue mechanism for smooth audio playback
3. **Error Handling**: Implement timeout warnings and connection failure handling
4. **Resource Cleanup**: Stop tracks and close connections on page unload
5. **Concurrency**: Handle server concurrency limits gracefully
6. **TURN Servers**: Configure TURN servers for NAT traversal in production
