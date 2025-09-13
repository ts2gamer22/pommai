"""
FastRTC Relay Gateway Server for Pommai AI Toy Platform
Pure WebSocket relay between Raspberry Pi clients and Convex backend.
With TTS streaming support for low-latency audio playback.
"""

import asyncio
import json
import os
import logging
import base64
from datetime import datetime
from typing import Dict, Optional, Any
from dataclasses import dataclass, field
import inspect

from aiohttp import web, WSMsgType
from convex import ConvexClient
from dotenv import load_dotenv
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST

try:
    from tts_providers import TTSStreamer, TTSProvider, TTSProviderFactory
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False
    logging.warning("TTS providers not available, will use Convex for TTS")

# Load environment variables
load_dotenv()

# Configure logging based on LOG_LEVEL env (DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL = (os.getenv("LOG_LEVEL", "INFO") or "INFO").upper()
_level = getattr(logging, LOG_LEVEL, logging.INFO)
logging.basicConfig(
    level=_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
# Keep aiohttp access logs at INFO unless explicitly asking for DEBUG
_access_logger = logging.getLogger('aiohttp.access')
if LOG_LEVEL == 'DEBUG':
    _access_logger.setLevel(logging.INFO)

# Configuration from environment
CONVEX_URL = os.getenv("CONVEX_URL", "https://your-app.convex.cloud")
CONVEX_DEPLOY_KEY = os.getenv("CONVEX_DEPLOY_KEY")
PORT = int(os.getenv("PORT", "8080"))
HOST = os.getenv("HOST", "0.0.0.0")

# Prometheus metrics
SESSIONS_TOTAL = Counter('fastrtc_sessions_total', 'Total sessions started')
ACTIVE_SESSIONS = Gauge('fastrtc_active_sessions', 'Current active sessions')
MESSAGES_TOTAL = Counter('fastrtc_messages_total', 'Messages received by type', ['type'])
AUDIO_BYTES_IN_TOTAL = Counter('fastrtc_audio_bytes_in_total', 'Total incoming audio bytes')
AUDIO_BYTES_OUT_TOTAL = Counter('fastrtc_audio_bytes_out_total', 'Total outgoing audio bytes')
CONVEX_PROCESSING_SECONDS = Histogram(
    'fastrtc_convex_processing_seconds',
    'Convex processing duration in seconds',
    buckets=(0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60)
)

@dataclass
class ClientSession:
    """Represents a connected Raspberry Pi client session"""
    session_id: str
    device_id: str
    toy_id: str
    ws: web.WebSocketResponse
    audio_buffer: bytearray = field(default_factory=bytearray)
    last_activity: datetime = field(default_factory=datetime.now)
    thread_id: Optional[str] = None


class FastRTCRelayGateway:
    """
    Pure relay gateway between Raspberry Pi clients and Convex backend.
    With optional TTS streaming for low-latency audio playback.
    """
    
    def __init__(self):
        # Initialize Convex client
        self.convex_client = ConvexClient(CONVEX_URL)
        if CONVEX_DEPLOY_KEY:
            self.convex_client.set_auth(CONVEX_DEPLOY_KEY)
        
        # Active client sessions
        self.sessions: Dict[str, ClientSession] = {}
        
        # Initialize TTS streamer if available
        self.tts_streamer = None
        if TTS_AVAILABLE:
            available_providers = TTSProviderFactory.get_available_providers()
            if available_providers:
                default_provider = TTSProvider.ELEVENLABS if 'elevenlabs' in available_providers else TTSProvider.MINIMAX
                self.tts_streamer = TTSStreamer(default_provider)
                logger.info(f"TTS streaming enabled with providers: {available_providers}")
            else:
                logger.warning("No TTS providers configured, will use Convex for TTS")
        
        logger.info(f"FastRTC Relay Gateway initialized")
        logger.info(f"Convex URL: {CONVEX_URL}")
        logger.info(f"Server will listen on {HOST}:{PORT}")
    
    async def handle_websocket(self, request: web.Request) -> web.WebSocketResponse:
        """
        Handle WebSocket connections from Raspberry Pi clients.
        This matches the endpoint the Pi expects: /ws/{device_id}/{toy_id}
        """
        device_id = request.match_info.get('device_id', 'unknown-device')
        toy_id = request.match_info.get('toy_id', 'unknown-toy')
        
        # Increase heartbeat interval to handle long AI processing
        ws = web.WebSocketResponse(
            heartbeat=45,  # Increased from 30 to 45 seconds
            autoping=True,  # Ensure automatic ping/pong
            compress=False  # Disable compression for lower latency
        )
        await ws.prepare(request)
        
        # Create session
        session_id = f"{device_id}-{datetime.now().timestamp()}"
        session = ClientSession(
            session_id=session_id,
            device_id=device_id,
            toy_id=toy_id,
            ws=ws
        )
        self.sessions[session_id] = session
        
        logger.info(f"Client connected: device={device_id}, toy={toy_id}, session={session_id}")
        SESSIONS_TOTAL.inc()
        ACTIVE_SESSIONS.inc()
        
        try:
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    await self.handle_client_message(session, msg.data)
                elif msg.type == WSMsgType.ERROR:
                    logger.error(f"WebSocket error: {ws.exception()}")
                    break
                    
        except Exception as e:
            logger.error(f"Session {session_id} error: {e}")
        finally:
            # Clean up session
            if len(session.audio_buffer) > 0:
                logger.warning(f"Client disconnected with %dB buffered audio and no final marker: session=%s", len(session.audio_buffer), session_id)
            ACTIVE_SESSIONS.dec()
            del self.sessions[session_id]
            await ws.close()
            logger.info(f"Client disconnected: session={session_id}")
        
        return ws
    
    async def handle_client_message(self, session: ClientSession, message: str):
        """
        Process messages from Raspberry Pi client and forward to appropriate handler.
        
        Expected message types from Pi client (from fastrtc_connection.py):
        - handshake: Initial connection handshake
        - ping: Heartbeat keepalive
        - control: Control commands (start_streaming, stop_streaming)
        - audio_chunk: Audio data with metadata

        Robust error handling & logging
        - We log each incoming message type at DEBUG and errors with stacktraces at ERROR.
        - If JSON is invalid we return a typed error back to the client and continue.
        """
        try:
            data = json.loads(message)
            msg_type = data.get('type')
            MESSAGES_TOTAL.labels(msg_type or 'unknown').inc()
            
            logger.debug(f"Received message type: {msg_type} from {session.device_id}")
            
            if msg_type == 'handshake':
                # Acknowledge handshake from Pi
                await session.ws.send_str(json.dumps({
                    'type': 'handshake_ack',
                    'status': 'connected',
                    'session_id': session.session_id,
                    'timestamp': datetime.now().isoformat()
                }))
                logger.info(f"Handshake completed for {session.device_id}")
                
            elif msg_type == 'ping':
                # Respond to ping with pong
                await session.ws.send_str(json.dumps({
                    'type': 'pong',
                    'timestamp': datetime.now().isoformat()
                }))
                
            elif msg_type == 'control':
                # Acknowledge control commands
                command = data.get('command')
                await session.ws.send_str(json.dumps({
                    'type': 'control_ack',
                    'command': command,
                    'ok': True
                }))
                logger.debug(f"Control command acknowledged: {command}")
                
            elif msg_type == 'audio_chunk':
                # Process audio chunk from Pi client
                await self.handle_audio_chunk(session, data.get('payload', {}))
                
            else:
                logger.warning(f"Unknown message type: {msg_type}")
                await session.ws.send_str(json.dumps({
                    'type': 'error',
                    'error': f'unknown_message_type: {msg_type}'
                }))
                
            # Update last activity
            session.last_activity = datetime.now()
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON from client: {e}", exc_info=True)
            await session.ws.send_str(json.dumps({
                'type': 'error',
                'error': 'invalid_json'
            }))
        except Exception as e:
            logger.error(f"Error handling client message: {e}", exc_info=True)
            await session.ws.send_str(json.dumps({
                'type': 'error',
                'error': str(e)
            }))
    
    async def handle_audio_chunk(self, session: ClientSession, payload: Dict[str, Any]):
        """
        Handle audio chunks from Pi client.
        
        The Pi sends audio as hex-encoded bytes in this format:
        {
            'data': hex_string,  # Audio data as hex string
            'metadata': {
                'isFinal': bool,  # True when recording ends
                'format': 'opus' | 'pcm16' | 'wav',
                'sampleRate': 16000,
                'timestamp': float
            }
        }
        
        Strategy:
        - Buffer bytes on each chunk
        - On final chunk:
            - If format == 'pcm16': wrap buffered bytes as a WAV container in-memory
            - If format == 'wav': forward as-is
            - If format == 'opus': forward raw bytes but warn (Whisper usually requires WAV/MP3/OGG/WebM)
        - Base64-encode and call Convex action
        """
        try:
            audio_hex = payload.get('data', '')
            metadata = payload.get('metadata', {})
            is_final = bool(metadata.get('isFinal', False))
            fmt = str(metadata.get('format', 'opus')).lower()
            sample_rate = int(metadata.get('sampleRate', 16000))
            
            # Handle empty audio data (could be final marker)
            if not audio_hex:
                if is_final:
                    # This is a final marker - process any buffered audio
                    if len(session.audio_buffer) > 0:
                        logger.info("Final marker received with empty data; processing %d bytes of buffered audio", len(session.audio_buffer))
                        # Don't return - continue to processing below
                    else:
                        logger.warning("Final marker received but no buffered audio to process")
                        return
                else:
                    # Non-final empty chunk - ignore
                    logger.debug("Empty non-final audio chunk received (ignored)")
                    return
            else:
                # We have audio data - convert and buffer it
                try:
                    audio_bytes = bytes.fromhex(audio_hex)
                    session.audio_buffer.extend(audio_bytes)
                    AUDIO_BYTES_IN_TOTAL.inc(len(audio_bytes))
                    logger.debug(f"WS audio_chunk: +{len(audio_bytes)}B, total={len(session.audio_buffer)}B, final={is_final}, format={fmt}")
                except ValueError as e:
                    logger.error(f"Invalid hex audio data: {e}")
                    return
            
            # Process when we get the final chunk
            if is_final and len(session.audio_buffer) > 0:
                logger.info(f"Processing complete audio: total={len(session.audio_buffer)}B, format={fmt}")
                
                # Decide how to forward to Convex (aim: WAV/Base64 if possible)
                forward_bytes: bytes
                forward_format: str
                if fmt == 'pcm16':
                    # Wrap PCM16 LE mono into a WAV container
                    try:
                        import io, wave, struct
                        pcm = bytes(session.audio_buffer)
                        buffer = io.BytesIO()
                        with wave.open(buffer, 'wb') as wf:
                            wf.setnchannels(1)
                            wf.setsampwidth(2)  # 16-bit PCM
                            wf.setframerate(sample_rate)
                            wf.writeframes(pcm)
                        forward_bytes = buffer.getvalue()
                        forward_format = 'wav'
                        logger.info(f"Packaged PCM16 -> WAV {len(forward_bytes)}B @ {sample_rate}Hz")
                    except Exception as e:
                        logger.error(f"Failed to package PCM16 to WAV: {e}")
                        # Fallback: send raw PCM (may fail in Convex)
                        forward_bytes = bytes(session.audio_buffer)
                        forward_format = 'pcm16'
                elif fmt in ('wav', 'wave'):
                    forward_bytes = bytes(session.audio_buffer)
                    forward_format = 'wav'
                elif fmt == 'opus':
                    # We don't re-containerize Opus here; forward as-is (likely unsupported by Whisper if raw)
                    logger.warning("Forwarding raw Opus bytes; Convex STT may require WAV/MP3/OGG/WebM")
                    forward_bytes = bytes(session.audio_buffer)
                    forward_format = 'opus'
                else:
                    logger.warning(f"Unsupported audio format '{fmt}', forwarding raw bytes")
                    forward_bytes = bytes(session.audio_buffer)
                    forward_format = fmt
                
                # Convert to Base64 for Convex
                audio_base64 = base64.b64encode(forward_bytes).decode('utf-8')
                
                # Clear buffer for next recording
                session.audio_buffer = bytearray()
                
                # Prepare arguments for Convex call
                action_args = {
                    "toyId": session.toy_id,
                    "audioData": audio_base64,
                    "sessionId": session.session_id,
                    "deviceId": session.device_id,
                    "metadata": {
                        "timestamp": int(datetime.now().timestamp() * 1000),
                        "format": forward_format,
                        "duration": metadata.get('duration', 0)
                    }
                }
                
                # Determine TTS behavior:
                # - If SKIP_TTS=true: Skip TTS entirely (for testing)
                # - If we have TTS streamer: Tell Convex to skip TTS (we'll stream it)
                # - Otherwise: Let Convex handle TTS
                skip_tts_env = os.getenv('SKIP_TTS', 'false').lower() == 'true'
                
                if skip_tts_env:
                    # Testing mode - skip TTS entirely
                    action_args["skipTTS"] = True
                    logger.info("SKIP_TTS=true, skipping TTS generation")
                elif self.tts_streamer:
                    # We have TTS streaming capability - tell Convex to skip
                    action_args["skipTTS"] = True
                    logger.info("TTS streaming enabled, Convex will skip TTS")
                else:
                    # No TTS streamer - let Convex handle TTS
                    action_args["skipTTS"] = False
                    logger.info("No TTS streamer, Convex will generate TTS")
                
                logger.debug("Scheduling background AI processing task: %s", json.dumps({**action_args, "audioData": f"<base64 {len(audio_base64)} chars>"}, indent=2))
                
                # Send processing status immediately to keep connection alive
                await session.ws.send_str(json.dumps({
                    'type': 'status',
                    'status': 'processing',
                    'message': 'Audio received, processing with AI...'
                }))
                
                # Schedule background task so the WS loop remains responsive to pings
                asyncio.create_task(self.process_and_respond_to_client(session, action_args))
        except Exception as e:
            logger.error(f"Error handling audio chunk: {e}")
    
    async def process_and_respond_to_client(self, session: ClientSession, action_args: Dict[str, Any]):
        """
        Run the Convex AI pipeline off the main WS loop and send the response when ready.
        - Uses timeout via CONVEX_ACTION_TIMEOUT (default 30s)
        - Runs synchronous client calls in a thread to avoid blocking the event loop
        - Checks if the client is still connected before sending
        - Streams TTS audio directly from provider for low latency
        """
        try:
            timeout_s = float(os.getenv("CONVEX_ACTION_TIMEOUT", "30"))
            started = datetime.now()
            logger.info("Calling Convex action 'aiPipeline:processVoiceInteraction' for toyId=%s", action_args.get("toyId"))

            # Send periodic status updates during processing
            async def send_status_updates():
                while not session.ws.closed:
                    await asyncio.sleep(10)  # Send update every 10 seconds
                    if not session.ws.closed:
                        await session.ws.send_str(json.dumps({
                            'type': 'status',
                            'status': 'processing',
                            'message': 'Still processing your request...'
                        }))
            
            status_task = asyncio.create_task(send_status_updates())
            
            try:
                # Log before calling Convex
                logger.debug("About to call Convex action with timeout=%ss", timeout_s)
                
                # Use HTTP API directly instead of Python SDK which seems to hang
                import aiohttp
                
                url = f"{CONVEX_URL}/api/action"
                headers = {
                    "Content-Type": "application/json",
                }
                
                payload = {
                    "path": "aiPipeline:processVoiceInteraction",
                    "args": action_args,
                    "format": "json"
                }
                
                if CONVEX_DEPLOY_KEY:
                    headers["Authorization"] = f"Convex {CONVEX_DEPLOY_KEY}"
                
                async with aiohttp.ClientSession() as http_session:
                    async with http_session.post(url, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=timeout_s)) as response:
                        if response.status == 200:
                            result = await response.json()
                            if "value" in result:
                                result = result["value"]
                        else:
                            error_text = await response.text()
                            logger.error(f"Convex HTTP error {response.status}: {error_text}")
                            result = {"success": False, "error": f"HTTP {response.status}: {error_text}"}
                
                logger.debug("Convex action completed successfully")
            finally:
                status_task.cancel()  # Stop sending status updates

            duration_delta = (datetime.now() - started)
            duration_ms = duration_delta.total_seconds() * 1000
            CONVEX_PROCESSING_SECONDS.observe(duration_delta.total_seconds())
            logger.info("Convex action result: success=%s processingTime=%s (gateway call %.0fms)", result.get('success'), result.get('processingTime'), duration_ms)

            if session.ws.closed:
                logger.warning("Client %s disconnected before AI response was ready.", session.device_id)
                return

            if result.get('success'):
                response_text = result.get('text', '')
                toy_config = result.get('toyConfig', {})  # Get toy voice configuration from Convex
                
                # Send text response first for immediate feedback
                await session.ws.send_str(json.dumps({
                    'type': 'text_response',
                    'payload': {
                        'text': response_text,
                        'timestamp': datetime.now().isoformat()
                    }
                }))
                
                # Handle TTS based on available options
                if self.tts_streamer and response_text and not os.getenv('SKIP_TTS', 'false').lower() == 'true':
                    # Stream TTS directly for low latency
                    logger.info(f"Streaming TTS for: '{response_text[:50]}...'")
                    
                    try:
                        await self.tts_streamer.stream_to_client(
                            ws=session.ws,
                            text=response_text,
                            toy_config=toy_config
                        )
                        logger.info("TTS streaming completed for %s", session.device_id)
                    except Exception as e:
                        logger.error(f"TTS streaming failed: {e}")
                        # Fallback: send error to client
                        await session.ws.send_str(json.dumps({
                            'type': 'error',
                            'payload': {
                                'error': 'TTS_FAILED',
                                'message': 'Text-to-speech service unavailable'
                            }
                        }))
                else:
                    # Use Convex TTS (higher latency but reliable fallback)
                    response_audio_base64 = result.get('audioData', '')
                    audio_format = result.get('format', 'mp3')
                    
                    if response_audio_base64:
                        try:
                            response_audio_bytes = base64.b64decode(response_audio_base64)
                            response_audio_hex = response_audio_bytes.hex()
                            AUDIO_BYTES_OUT_TOTAL.inc(len(response_audio_bytes))
                            
                            response_message = {
                                'type': 'audio_response',
                                'payload': {
                                    'data': response_audio_hex,
                                    'metadata': {
                                        'format': audio_format,
                                        'text': response_text,
                                        'sampleRate': 22050,
                                        'duration': result.get('duration'),
                                        'timestamp': datetime.now().isoformat(),
                                        'isFinal': True
                                    }
                                }
                            }
                            await session.ws.send_str(json.dumps(response_message))
                            logger.info("Relayed Convex TTS response to %s (audio=%dB, text='%s…')", 
                                      session.device_id, len(response_audio_hex)//2, response_text[:50])
                        except Exception as e:
                            logger.error(f"Failed to decode response audio: {e}", exc_info=True)
                    else:
                        logger.info("No TTS audio (SKIP_TTS=true or empty text)")
            else:
                error_msg = result.get('error', 'Unknown error from AI pipeline')
                logger.error("Convex AI pipeline error: %s", error_msg)
                await session.ws.send_str(json.dumps({'type': 'error', 'error': error_msg}))

        except asyncio.TimeoutError:
            logger.error("Convex action timed out after %.1fs (background)", timeout_s)
            if not session.ws.closed:
                await session.ws.send_str(json.dumps({'type': 'error', 'error': f'convex_timeout_after_{timeout_s}s'}))
        except Exception as e:
            logger.error("FAILED to call Convex action in background task: %s", e, exc_info=True)
            if not session.ws.closed:
                await session.ws.send_str(json.dumps({'type': 'error', 'error': f'Failed to process AI request: {str(e)}'}))

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
                session = self.sessions.get(session_id)
                if session and session.ws:
                    await session.ws.close()
                del self.sessions[session_id]


# Web application setup
app = web.Application()
gateway = FastRTCRelayGateway()

# Health check endpoint
async def health_check(request):
    """Simple health check endpoint for Docker and monitoring"""
    tts_status = "enabled" if gateway.tts_streamer else "disabled"
    tts_providers = TTSProviderFactory.get_available_providers() if TTS_AVAILABLE else []
    
    return web.json_response({
        'status': 'healthy',
        'type': 'relay',
        'sessions': len(gateway.sessions),
        'convex_url': CONVEX_URL,
        'tts_streaming': tts_status,
        'tts_providers': tts_providers,
        'timestamp': datetime.now().isoformat()
    })

# Metrics endpoint
async def metrics(request):
    output = generate_latest()
    return web.Response(body=output, content_type=CONTENT_TYPE_LATEST)

# Route configuration
app.router.add_get('/health', health_check)
app.router.add_get('/metrics', metrics)
app.router.add_get('/ws/{device_id}/{toy_id}', gateway.handle_websocket)

# Startup and cleanup
async def on_startup(app):
    """Initialize background tasks on startup"""
    app['cleanup_task'] = asyncio.create_task(gateway.cleanup_inactive_sessions())
    logger.info("Background tasks started")

async def on_cleanup(app):
    """Clean up on shutdown"""
    if 'cleanup_task' in app:
        app['cleanup_task'].cancel()
        try:
            await app['cleanup_task']
        except asyncio.CancelledError:
            pass
    
    # Close all active sessions
    for session in gateway.sessions.values():
        if session.ws:
            await session.ws.close()
    
    logger.info("Cleanup completed")

app.on_startup.append(on_startup)
app.on_cleanup.append(on_cleanup)

# Run the server
if __name__ == '__main__':
    logger.info(f"Starting FastRTC Relay Gateway on {HOST}:{PORT}")
    web.run_app(app, host=HOST, port=PORT)
