"""
FastRTC Gateway Server for Pommai AI Toy Platform
Handles real-time audio streaming, AI processing, and Convex integration
"""

import asyncio
import json
import os
import logging
import uuid
from datetime import datetime
from typing import Dict, Optional, Any
from dataclasses import dataclass, field

import aiohttp
from aiohttp import web, WSMsgType
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCDataChannel
from aiortc.contrib.media import MediaBlackhole, MediaPlayer, MediaRecorder
import av
import io
import soundfile as sf

# AI/ML imports
import torch
import whisper
from transformers import pipeline
from TTS.api import TTS
import numpy as np
from scipy import signal

# Convex client
from convex import ConvexClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
CONVEX_URL = os.getenv("CONVEX_URL", "https://your-app.convex.cloud")
CONVEX_DEPLOY_KEY = os.getenv("CONVEX_DEPLOY_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Audio processing configuration
SAMPLE_RATE = 16000
CHUNK_SIZE = 1024
VAD_THRESHOLD = 0.5  # Voice Activity Detection threshold

@dataclass
class SessionState:
    """Maintains state for each connected session"""
    session_id: str
    device_id: str
    toy_id: str
    thread_id: Optional[str] = None
    pc: Optional[RTCPeerConnection] = None
    audio_buffer: list = field(default_factory=list)
    is_recording: bool = False
    last_activity: datetime = field(default_factory=datetime.now)
    conversation_context: list = field(default_factory=list)
    safety_score: float = 1.0
    user_id: Optional[str] = None

class FastRTCGateway:
    """Main FastRTC Gateway Server"""
    
    def __init__(self):
        # Initialize Convex client
        self.convex_client = ConvexClient(CONVEX_URL)
        if CONVEX_DEPLOY_KEY:
            self.convex_client.set_auth(CONVEX_DEPLOY_KEY)
        
        # Initialize AI models
        self.init_ai_models()
        
        # Session management
        self.sessions: Dict[str, SessionState] = {}
        self.peer_connections = set()
        
        # Audio processing
        self.audio_processor = AudioProcessor()
        
        # Safety filter
        self.safety_filter = SafetyFilter()
        
        logger.info("FastRTC Gateway initialized")
    
    def init_ai_models(self):
        """Initialize AI models for STT, TTS, and safety"""
        try:
            # Speech-to-Text model (Whisper)
            logger.info("Loading Whisper model...")
            self.whisper_model = whisper.load_model("base")
            
            # Text-to-Speech model
            logger.info("Loading TTS model...")
            self.tts = TTS("tts_models/en/ljspeech/tacotron2-DDC")
            
            # Safety classifier
            logger.info("Loading safety classifier...")
            self.safety_classifier = pipeline(
                "text-classification",
                model="unitary/toxic-bert",
                device=0 if torch.cuda.is_available() else -1
            )
            
            logger.info("All AI models loaded successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AI models: {e}")
            raise
    
    async def create_session(self, request):
        """Create a new WebRTC session"""
        params = await request.json()
        
        session_id = str(uuid.uuid4())
        device_id = params.get("deviceId")
        toy_id = params.get("toyId")
        user_id = params.get("userId")
        
        if not device_id or not toy_id:
            return web.json_response({
                "error": "Missing deviceId or toyId"
            }, status=400)
        
        # Create or get thread from Convex
        try:
            thread_result = await self.convex_client.mutation(
                "agents:getOrCreateDeviceThread",
                {"deviceId": device_id, "toyId": toy_id}
            )
            thread_id = thread_result["threadId"]
        except Exception as e:
            logger.error(f"Failed to create thread: {e}")
            return web.json_response({
                "error": "Failed to create conversation thread"
            }, status=500)
        
        # Create session state
        session = SessionState(
            session_id=session_id,
            device_id=device_id,
            toy_id=toy_id,
            thread_id=thread_id,
            user_id=user_id
        )
        
        self.sessions[session_id] = session
        
        # Create peer connection
        pc = RTCPeerConnection()
        session.pc = pc
        self.peer_connections.add(pc)
        
        # Handle ICE connection state changes
        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            logger.info(f"Connection state: {pc.connectionState}")
            if pc.connectionState == "connected":
                logger.info(f"Session {session_id} connected")
            elif pc.connectionState == "failed":
                logger.warning(f"Session {session_id} failed")
                await self.cleanup_session(session_id)
        
        # Handle data channel for control messages
        @pc.on("datachannel")
        def on_datachannel(channel: RTCDataChannel):
            logger.info(f"Data channel created: {channel.label}")
            
            @channel.on("message")
            async def on_message(message):
                await self.handle_control_message(session_id, message)
        
        # Handle incoming audio track
        @pc.on("track")
        async def on_track(track):
            logger.info(f"Track received: {track.kind}")
            if track.kind == "audio":
                # Start processing audio
                asyncio.create_task(
                    self.process_audio_track(session_id, track)
                )
        
        # Create offer
        offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        
        return web.json_response({
            "sessionId": session_id,
            "threadId": thread_id,
            "offer": {
                "sdp": pc.localDescription.sdp,
                "type": pc.localDescription.type
            }
        })
    
    async def handle_answer(self, request):
        """Handle WebRTC answer from client"""
        params = await request.json()
        session_id = params.get("sessionId")
        answer = params.get("answer")
        
        if not session_id or session_id not in self.sessions:
            return web.json_response({
                "error": "Invalid session"
            }, status=400)
        
        session = self.sessions[session_id]
        if not session.pc:
            return web.json_response({
                "error": "No peer connection"
            }, status=400)
        
        # Set remote description
        await session.pc.setRemoteDescription(
            RTCSessionDescription(
                sdp=answer["sdp"],
                type=answer["type"]
            )
        )
        
        return web.json_response({"status": "connected"})
    
    async def process_audio_track(self, session_id: str, track):
        """Process incoming audio track"""
        session = self.sessions.get(session_id)
        if not session:
            return
        
        logger.info(f"Processing audio for session {session_id}")
        
        try:
            while True:
                frame = await track.recv()
                
                # Convert audio frame to numpy array
                audio_data = frame.to_ndarray()
                
                # Add to buffer
                session.audio_buffer.extend(audio_data.flatten())
                
                # Check if we have enough audio for processing
                if len(session.audio_buffer) >= SAMPLE_RATE * 2:  # 2 seconds
                    # Process accumulated audio
                    await self.process_audio_chunk(session_id)
                    
                    # Clear buffer
                    session.audio_buffer = []
                
                # Update last activity
                session.last_activity = datetime.now()
                
        except Exception as e:
            logger.error(f"Error processing audio: {e}")
    
    async def process_audio_chunk(self, session_id: str):
        """Process a chunk of audio through the AI pipeline"""
        session = self.sessions.get(session_id)
        if not session or not session.audio_buffer:
            return
        
        try:
            # Convert buffer to numpy array
            audio_array = np.array(session.audio_buffer, dtype=np.float32)
            
            # Apply Voice Activity Detection
            if not self.audio_processor.detect_voice(audio_array):
                logger.debug("No voice detected in audio chunk")
                return
            
            # Speech-to-Text
            logger.info("Transcribing audio...")
            transcript = await self.transcribe_audio(audio_array)
            
            if not transcript or len(transcript.strip()) < 3:
                return
            
            logger.info(f"Transcript: {transcript}")
            
            # Safety check
            safety_result = await self.safety_filter.check_text(transcript)
            session.safety_score = safety_result["score"]
            
            if not safety_result["is_safe"]:
                logger.warning(f"Unsafe content detected: {transcript}")
                # Send safe redirect response
                await self.send_audio_response(
                    session_id,
                    "Let's talk about something fun instead! What's your favorite game?"
                )
                return
            
            # Get AI response from Convex
            response = await self.get_ai_response(session, transcript)
            
            if response:
                # Convert response to speech
                await self.send_audio_response(session_id, response)
                
                # Update conversation context
                session.conversation_context.append({
                    "user": transcript,
                    "assistant": response,
                    "timestamp": datetime.now().isoformat()
                })
                
                # Keep only last 10 exchanges
                if len(session.conversation_context) > 10:
                    session.conversation_context = session.conversation_context[-10:]
            
        except Exception as e:
            logger.error(f"Error processing audio chunk: {e}")
    
    async def transcribe_audio(self, audio_array: np.ndarray) -> str:
        """Transcribe audio using Whisper"""
        try:
            # Normalize audio
            audio_array = audio_array / np.max(np.abs(audio_array))
            
            # Run Whisper
            result = self.whisper_model.transcribe(
                audio_array,
                language="en",
                fp16=False
            )
            
            return result["text"].strip()
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return ""
    
    async def get_ai_response(self, session: SessionState, transcript: str) -> Optional[str]:
        """Get AI response from Convex backend"""
        try:
            # Convert audio to base64 for Convex
            # Note: In production, we'd pass the actual audio data
            audio_base64 = ""  # Placeholder for audio data
            
            # Call new Convex AI pipeline
            result = await self.convex_client.action(
                "aiPipeline:processVoiceInteraction",
                {
                    "toyId": session.toy_id,
                    "audioData": audio_base64,
                    "sessionId": session.thread_id,
                    "deviceId": session.device_id,
                    "metadata": {
                        "timestamp": int(datetime.now().timestamp() * 1000),
                        "format": "opus",
                    }
                }
            )
            
            if result.get("success"):
                return result.get("text")
            else:
                logger.error(f"AI response failed: {result.get('error')}")
                return result.get("text", "I'm having trouble understanding. Can you try again?")
                
        except Exception as e:
            logger.error(f"Failed to get AI response: {e}")
            return None
    
    async def send_audio_response(self, session_id: str, text: str):
        """Convert text to speech and send to client (WebRTC path)"""
        session = self.sessions.get(session_id)
        if not session or not session.pc:
            return
        
        try:
            # Generate speech
            logger.info(f"Generating TTS for: {text[:50]}...")
            audio_path = f"/tmp/tts_{session_id}_{uuid.uuid4()}.wav"
            self.tts.tts_to_file(text=text, file_path=audio_path)
            
            # Create audio track and add to peer connection
            player = MediaPlayer(audio_path)
            audio_track = player.audio
            session.pc.addTrack(audio_track)
            
            # Clean up temp file after sending
            asyncio.create_task(self.cleanup_temp_file(audio_path, delay=5))
            
            logger.info("Audio response sent")
            
        except Exception as e:
            logger.error(f"Failed to send audio response: {e}")

    async def tts_to_wav_bytes(self, text: str) -> bytes:
        """Generate TTS audio for the given text and return WAV bytes.
        Falls back to file generation if direct synthesis fails.
        """
        try:
            # Prefer in-memory TTS if available
            try:
                wav = self.tts.tts(text)
                # Some TTS models may return (wav, sample_rate)
                sample_rate = getattr(self.tts, "output_sample_rate", 22050)
                if isinstance(wav, tuple) and len(wav) == 2:
                    wav, sample_rate = wav
                bio = io.BytesIO()
                sf.write(bio, np.asarray(wav, dtype=np.float32), int(sample_rate), format='WAV')
                return bio.getvalue()
            except Exception:
                # Fallback to file-based synthesis
                tmp_path = f"/tmp/tts_ws_{uuid.uuid4()}.wav"
                self.tts.tts_to_file(text=text, file_path=tmp_path)
                with open(tmp_path, "rb") as f:
                    data = f.read()
                asyncio.create_task(self.cleanup_temp_file(tmp_path, delay=1))
                return data
        except Exception as e:
            logger.error(f"TTS generation failed: {e}")
            return b""
    
    async def cleanup_temp_file(self, file_path: str, delay: int = 5):
        """Clean up temporary audio files"""
        await asyncio.sleep(delay)
        try:
            os.remove(file_path)
        except:
            pass
    
    async def handle_control_message(self, session_id: str, message: str):
        """Handle control messages from data channel"""
        try:
            data = json.loads(message)
            command = data.get("command")
            
            if command == "start_recording":
                session = self.sessions.get(session_id)
                if session:
                    session.is_recording = True
                    logger.info(f"Recording started for session {session_id}")
            
            elif command == "stop_recording":
                session = self.sessions.get(session_id)
                if session:
                    session.is_recording = False
                    logger.info(f"Recording stopped for session {session_id}")
            
            elif command == "ping":
                # Health check
                session = self.sessions.get(session_id)
                if session and session.pc:
                    # Send pong via data channel
                    for channel in session.pc.getTransceivers():
                        if isinstance(channel, RTCDataChannel):
                            channel.send(json.dumps({"type": "pong"}))
            
        except Exception as e:
            logger.error(f"Error handling control message: {e}")
    
    async def cleanup_session(self, session_id: str):
        """Clean up session resources"""
        session = self.sessions.get(session_id)
        if session:
            if session.pc:
                await session.pc.close()
                self.peer_connections.discard(session.pc)
            
            del self.sessions[session_id]
            logger.info(f"Session {session_id} cleaned up")
    
    async def cleanup_inactive_sessions(self):
        """Periodically clean up inactive sessions"""
        while True:
            await asyncio.sleep(60)  # Check every minute
            
            now = datetime.now()
            inactive_sessions = []
            
            for session_id, session in self.sessions.items():
                # Remove sessions inactive for more than 5 minutes
                if (now - session.last_activity).seconds > 300:
                    inactive_sessions.append(session_id)
            
            for session_id in inactive_sessions:
                logger.info(f"Cleaning up inactive session: {session_id}")
                await self.cleanup_session(session_id)


class AudioProcessor:
    """Audio processing utilities"""
    
    def detect_voice(self, audio_array: np.ndarray, threshold: float = 0.01) -> bool:
        """Simple Voice Activity Detection"""
        # Calculate RMS energy
        rms = np.sqrt(np.mean(audio_array ** 2))
        return rms > threshold
    
    def apply_noise_reduction(self, audio_array: np.ndarray) -> np.ndarray:
        """Apply basic noise reduction"""
        # Simple high-pass filter to remove low-frequency noise
        b, a = signal.butter(4, 100, 'hp', fs=SAMPLE_RATE)
        filtered = signal.filtfilt(b, a, audio_array)
        return filtered


class SafetyFilter:
    """Content safety filtering for child-appropriate responses"""
    
    def __init__(self):
        self.banned_words = self.load_banned_words()
        self.safety_threshold = 0.7
    
    def load_banned_words(self) -> set:
        """Load list of inappropriate words"""
        # In production, load from a comprehensive list
        return {
            "violence", "kill", "hurt", "death", "scary",
            "monster", "nightmare", "blood", "weapon"
        }
    
    async def check_text(self, text: str) -> dict:
        """Check if text is safe for children"""
        text_lower = text.lower()
        
        # Check for banned words
        for word in self.banned_words:
            if word in text_lower:
                return {
                    "is_safe": False,
                    "score": 0.0,
                    "reason": f"Contains inappropriate word: {word}"
                }
        
        # Additional ML-based safety check could go here
        # For now, return safe
        return {
            "is_safe": True,
            "score": 1.0,
            "reason": "Content is appropriate"
        }


# Web application setup
app = web.Application()
gateway = FastRTCGateway()

# Routes
app.router.add_post('/session/create', gateway.create_session)
app.router.add_post('/session/answer', gateway.handle_answer)

# WebSocket endpoint for Raspberry Pi clients
async def websocket_handler(request: web.Request):
    device_id = request.match_info.get('device_id', 'unknown-device')
    toy_id = request.match_info.get('toy_id', 'unknown-toy')

    ws = web.WebSocketResponse(heartbeat=30)
    await ws.prepare(request)

    session_id = f"ws-{device_id}-{uuid.uuid4()}"
    logger.info(f"WebSocket session created: {session_id} (device={device_id}, toy={toy_id})")

    session = SessionState(
        session_id=session_id,
        device_id=device_id,
        toy_id=toy_id,
    )
    gateway.sessions[session_id] = session

    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                except Exception:
                    await ws.send_str(json.dumps({"type": "error", "error": "invalid_json"}))
                    continue

                msg_type = data.get("type")
                if msg_type == "handshake":
                    await ws.send_str(json.dumps({"type": "handshake_ack", "status": "connected"}))
                elif msg_type == "ping":
                    await ws.send_str(json.dumps({"type": "pong"}))
                elif msg_type == "control":
                    # Acknowledge control commands
                    await ws.send_str(json.dumps({"type": "control_ack", "ok": True, "command": data.get("command")}))
                elif msg_type == "audio_chunk":
                    payload = data.get("payload", {})
                    audio_hex = payload.get("data")
                    metadata = payload.get("metadata", {})
                    if not audio_hex:
                        continue
                    try:
                        audio_bytes = bytes.fromhex(audio_hex)
                    except Exception:
                        logger.warning("Invalid audio hex payload")
                        continue

                    fmt = str(metadata.get("format", "pcm16")).lower()
                    try:
                        if fmt == "pcm16":
                            audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                        elif fmt == "float32":
                            audio_array = np.frombuffer(audio_bytes, dtype=np.float32)
                        else:
                            logger.warning(f"Unsupported audio format for WS: {fmt}")
                            continue
                    except Exception as e:
                        logger.warning(f"Audio decode failed: {e}")
                        continue

                    # Append to session buffer
                    session.audio_buffer.extend(audio_array.flatten())

                    # Decide when to process (on final chunk or >= 2s of audio)
                    is_final = bool(metadata.get("isFinal", False))
                    if is_final or len(session.audio_buffer) >= SAMPLE_RATE * 2:
                        try:
                            transcript = await gateway.transcribe_audio(np.array(session.audio_buffer, dtype=np.float32))
                        except Exception as e:
                            logger.error(f"WS transcription error: {e}")
                            transcript = ""

                        # Reset buffer regardless of transcription result
                        session.audio_buffer = []

                        if not transcript or len(transcript.strip()) < 1:
                            continue

                        # Safety check
                        safety_result = await gateway.safety_filter.check_text(transcript)
                        if not safety_result.get("is_safe", True):
                            response_text = "Let's talk about something fun instead! What's your favorite game?"
                        else:
                            # Get AI response via Convex
                            response_text = await gateway.get_ai_response(session, transcript)
                            if not response_text:
                                response_text = "I'm having trouble understanding. Can you try again?"

                        # Generate TTS and send back to client as hex in JSON
                        tts_bytes = await gateway.tts_to_wav_bytes(response_text)
                        if tts_bytes:
                            reply = {
                                "type": "audio_response",
                                "payload": {
                                    "data": tts_bytes.hex(),
                                    "metadata": {
                                        "format": "wav",
                                        "sampleRate": 22050
                                    }
                                }
                            }
                            await ws.send_str(json.dumps(reply))
                else:
                    await ws.send_str(json.dumps({"type": "error", "error": f"unknown_message_type:{msg_type}"}))

            elif msg.type == WSMsgType.ERROR:
                logger.error(f"WS connection closed with exception {ws.exception()}")
                break
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
    finally:
        await gateway.cleanup_session(session_id)
        await ws.close()

    return ws

# Health check
async def health_check(request):
    return web.json_response({
        "status": "healthy",
        "sessions": len(gateway.sessions),
        "timestamp": datetime.now().isoformat()
    })

app.router.add_get('/health', health_check)
app.router.add_get('/ws/{device_id}/{toy_id}', websocket_handler)

# CORS middleware
async def cors_middleware(app, handler):
    async def middleware_handler(request):
        if request.method == 'OPTIONS':
            return web.Response(status=200, headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            })
        
        response = await handler(request)
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
    
    return middleware_handler

app.middlewares.append(cors_middleware)

# Startup and cleanup
async def on_startup(app):
    # Start background tasks
    asyncio.create_task(gateway.cleanup_inactive_sessions())
    logger.info("FastRTC Gateway started")

async def on_cleanup(app):
    # Close all peer connections
    for pc in gateway.peer_connections:
        await pc.close()
    logger.info("FastRTC Gateway stopped")

app.on_startup.append(on_startup)
app.on_cleanup.append(on_cleanup)

if __name__ == '__main__':
    web.run_app(app, host='0.0.0.0', port=8080)
