"""TTS Provider Abstraction Layer for multiple TTS services"""

import os
import json
import aiohttp
import logging
import threading
import asyncio
from abc import ABC, abstractmethod
from typing import AsyncIterator, Dict, Any, Optional
from enum import Enum

# ElevenLabs official SDK
try:
    from elevenlabs.client import ElevenLabs
except Exception:
    ElevenLabs = None  # Will be validated at runtime

logger = logging.getLogger(__name__)

class TTSProvider(Enum):
    ELEVENLABS = "elevenlabs"
    MINIMAX = "minimax"
    
class BaseTTSProvider(ABC):
    """Abstract base class for TTS providers"""
    
    @abstractmethod
    async def stream_tts(self, text: str, voice_config: Dict[str, Any]) -> AsyncIterator[bytes]:
        """Stream TTS audio chunks"""
        pass
    
    @abstractmethod
    def get_audio_format(self) -> str:
        """Return the audio format this provider outputs"""
        pass

class ElevenLabsProvider(BaseTTSProvider):
    """ElevenLabs TTS Provider with streaming support (official SDK)"""
    
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY not found in environment")
        if ElevenLabs is None:
            raise ImportError("elevenlabs SDK is not installed. Add 'ElevenLabs' to requirements.")
        
        # Client
        self.client = ElevenLabs(api_key=self.api_key)
        
        # Defaults
        # Model: prioritize ultra-low latency
        self.model_id_default = os.getenv("ELEVENLABS_TTS_MODEL_ID", "eleven_flash_v2_5")
        self.voice_id_default = os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")
        
        # Default to 16kHz for better Pi compatibility (can be overridden via env var)
        self.sample_rate = 16000
        
    def _iter_stream(self, text: str, voice_id: str, model_id: str, output_format: str):
        """Synchronous iterator that yields raw PCM bytes from ElevenLabs SDK."""
        try:
            # First try the standard streaming endpoint with requests for better control
            import requests
            import time
            
            # Note: /stream endpoint always returns MP3, use non-streaming for PCM
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            headers = {
                "xi-api-key": self.api_key,
                "Content-Type": "application/json"
            }
            
            # CRITICAL: Add Accept header for PCM output
            # ElevenLabs requires specific Accept header format for raw PCM
            if output_format.startswith("pcm_"):
                # Use audio/basic for raw PCM (this is what ElevenLabs expects)
                headers["Accept"] = "audio/basic"
            
            # Add output_format as query parameter for PCM
            if output_format.startswith("pcm_"):
                url += f"?output_format={output_format}"
            
            request_id = f"req_{int(time.time()*1000)}"
            
            data = {
                "text": text,
                "model_id": model_id,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                },
                "optimize_streaming_latency": 3
            }
            
            logger.info(f"[{request_id}] Making ElevenLabs API request: {url}")
            logger.info(f"[{request_id}] Request headers: {headers}")
            logger.info(f"[{request_id}] Output format: {output_format}")
            logger.info(f"[{request_id}] Text length: {len(text)} chars")
            
            response = requests.post(url, json=data, headers=headers, stream=True)
            response.raise_for_status()
            
            # Validate Content-Type to ensure we got PCM, not MP3
            content_type = response.headers.get('Content-Type', '')
            content_length = response.headers.get('Content-Length', 'streaming')
            logger.info(f"[{request_id}] ElevenLabs response - Content-Type: {content_type}, Content-Length: {content_length}")
            
            if output_format.startswith("pcm_"):
                # ElevenLabs returns audio/basic for PCM format
                valid_pcm_types = ["audio/pcm", "audio/basic", "application/octet-stream"]
                if not any(ct in content_type.lower() for ct in valid_pcm_types):
                    logger.error(f"Expected PCM but got Content-Type: {content_type}. Check Accept header.")
                    raise ValueError(f"Expected PCM audio but received {content_type}")
            
            # Stream chunks as they arrive - use larger chunk size
            # Buffer small chunks to avoid issues
            chunk_num = 0
            total_bytes = 0
            for chunk in response.iter_content(chunk_size=4096):  # 4KB chunks
                if chunk:  # Don't filter - let the buffering in stream_tts handle it
                    chunk_num += 1
                    total_bytes += len(chunk)
                    if chunk_num <= 3 or chunk_num % 10 == 0:  # Log first few and every 10th
                        logger.debug(f"[{request_id}] Raw chunk #{chunk_num}: {len(chunk)} bytes (total: {total_bytes})")
                    yield chunk
            
            logger.info(f"[{request_id}] Stream complete: {chunk_num} chunks, {total_bytes} bytes")
                    
        except Exception as e:
            logger.error(f"ElevenLabs streaming request failed: {e}", exc_info=True)
            raise
    
    async def stream_tts(self, text: str, voice_config: Dict[str, Any]) -> AsyncIterator[bytes]:
        """Async stream using a background thread to bridge SDK's sync iterator."""
        # Resolve model/voice and output format
        voice_id = voice_config.get('voiceId', self.voice_id_default)
        model_id = voice_config.get('modelId', self.model_id_default)
        # Default to 16kHz for Pi compatibility
        output_format = os.getenv("ELEVENLABS_OUTPUT_FORMAT", "pcm_16000")
        try:
            if output_format.startswith("pcm_"):
                self.sample_rate = int(output_format.split("_")[1])
        except Exception:
            self.sample_rate = 16000
            output_format = "pcm_16000"
        
        stream_id = f"stream_{int(asyncio.get_event_loop().time()*1000)}"
        logger.info(f"[{stream_id}] ElevenLabs streaming TTS: voice_id={voice_id}, model_id={model_id}, output_format={output_format}, text_length={len(text)}")
        
        # Bridge to async via queue + thread
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        stop_sentinel = object()
        loop = asyncio.get_running_loop()
        
        def producer():
            chunk_count = 0
            total_bytes = 0
            buffer = bytearray()  # Buffer to accumulate small chunks
            MIN_CHUNK_SIZE = 1024  # Minimum chunk size to send (1KB)
            
            try:
                logger.info(f"[{stream_id}] Starting ElevenLabs producer thread for text: '{text[:50]}...'")
                for b in self._iter_stream(text, voice_id, model_id, output_format):
                    if not b or len(b) == 0:
                        continue
                    
                    total_bytes += len(b)
                    buffer.extend(b)
                    
                    # Send chunks of at least MIN_CHUNK_SIZE
                    while len(buffer) >= MIN_CHUNK_SIZE:
                        chunk_to_send = bytes(buffer[:MIN_CHUNK_SIZE])
                        buffer = buffer[MIN_CHUNK_SIZE:]
                        chunk_count += 1
                        if chunk_count <= 3 or chunk_count % 10 == 0:
                            logger.debug(f"[{stream_id}] ElevenLabs chunk #{chunk_count}: {len(chunk_to_send)} bytes")
                        try:
                            fut = asyncio.run_coroutine_threadsafe(q.put(chunk_to_send), loop)
                            fut.result()  # Block thread until queued (provides backpressure)
                        except Exception as ex:
                            logger.error(f"Queue put error: {ex}")
                            return
                
                # Send any remaining data in buffer
                if len(buffer) > 0:
                    chunk_count += 1
                    remaining = bytes(buffer)
                    logger.debug(f"ElevenLabs final chunk #{chunk_count}: {len(remaining)} bytes")
                    try:
                        fut = asyncio.run_coroutine_threadsafe(q.put(remaining), loop)
                        fut.result()
                    except Exception as ex:
                        logger.error(f"Queue put error: {ex}")
                
                logger.info(f"[{stream_id}] ElevenLabs producer completed: {chunk_count} chunks, {total_bytes} bytes total")
            except Exception as e:
                logger.error(f"ElevenLabs streaming error: {e}", exc_info=True)
            finally:
                try:
                    asyncio.run_coroutine_threadsafe(q.put(stop_sentinel), loop).result()
                except Exception:
                    pass
        
        threading.Thread(target=producer, daemon=True).start()
        
        chunks_yielded = 0
        bytes_yielded = 0
        while True:
            item = await q.get()
            if item is stop_sentinel:
                logger.info(f"[{stream_id}] ElevenLabs stream complete: yielded {chunks_yielded} chunks, {bytes_yielded} bytes")
                break
            chunks_yielded += 1
            bytes_yielded += len(item)
            logger.debug(f"Yielding chunk #{chunks_yielded}: {len(item)} bytes")
            yield item
    
    def get_audio_format(self) -> str:
        # Always return pcm16 as the format identifier
        # The actual sample rate is communicated separately via sampleRate field
        return "pcm16"

    def get_sample_rate(self) -> int:
        return getattr(self, 'sample_rate', 16000)

class MinimaxProvider(BaseTTSProvider):
    """Minimax TTS Provider with streaming support"""
    
    def __init__(self):
        self.api_key = os.getenv("MINIMAX_API_KEY")
        self.group_id = os.getenv("MINIMAX_GROUP_ID")
        if not self.api_key or not self.group_id:
            raise ValueError("MINIMAX_API_KEY or MINIMAX_GROUP_ID not found in environment")
        self.sample_rate = 16000
    
    async def stream_tts(self, text: str, voice_config: Dict[str, Any]) -> AsyncIterator[bytes]:
        """Stream TTS from Minimax API"""
        # Minimax voice IDs - can be customized
        voice_id = voice_config.get('voiceId', 'female-shaonv')  # Default young female voice
        
        url = "https://api.minimax.chat/v1/t2a_v2"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Format request according to Minimax API docs
        data = {
            "model": "speech-01-turbo",
            "text": text,
            "group_id": self.group_id,
            "voice_setting": {
                "voice_id": voice_id,  # female-shaonv, male-qn-qingse, etc.
                "speed": voice_config.get('speed', 1.0),  # 0.5 to 2.0
                "vol": voice_config.get('volume', 1.0),   # 0.1 to 10
                "pitch": voice_config.get('pitch', 0),    # -12 to 12
                "emotion": voice_config.get('emotion', 'happy')  # happy, sad, angry, etc.
            },
            "stream": True,  # Enable streaming
            "audio_setting": {
                "format": "pcm",  # pcm, mp3, wav
                "sample_rate": 16000,  # 8000, 16000, 24000, 32000, 48000
                "channel": 1,  # 1 for mono, 2 for stereo
                "bits_per_sample": 16  # 8 or 16
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=data, headers=headers, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Minimax API error: {response.status} - {error_text}")
                    raise Exception(f"Minimax API error: {response.status}")
                
                # Minimax uses SSE (Server-Sent Events) for streaming
                buffer = b''
                async for chunk in response.content.iter_any():
                    buffer += chunk
                    lines = buffer.split(b'\n')
                    
                    # Process complete lines, keep incomplete for next iteration
                    for i in range(len(lines) - 1):
                        line = lines[i]
                        if line.startswith(b'data: '):
                            try:
                                data_str = line[6:].decode('utf-8')
                                if data_str.strip() == '[DONE]':
                                    return
                                
                                data = json.loads(data_str)
                                if 'audio' in data and data['audio']:
                                    # Decode base64 audio chunk
                                    import base64
                                    audio_chunk = base64.b64decode(data['audio'])
                                    yield audio_chunk
                            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                                logger.debug(f"Failed to parse SSE line: {e}")
                                continue
                    
                    # Keep the last incomplete line in buffer
                    buffer = lines[-1]
    
    def get_audio_format(self) -> str:
        return "pcm16"

    def get_sample_rate(self) -> int:
        return getattr(self, 'sample_rate', 16000)

class TTSProviderFactory:
    """Factory for creating TTS providers"""
    
    _providers: Dict[TTSProvider, BaseTTSProvider] = {}
    
    @classmethod
    def get_provider(cls, provider_type: TTSProvider) -> BaseTTSProvider:
        """Get or create a TTS provider instance"""
        if provider_type not in cls._providers:
            if provider_type == TTSProvider.ELEVENLABS:
                cls._providers[provider_type] = ElevenLabsProvider()
            elif provider_type == TTSProvider.MINIMAX:
                cls._providers[provider_type] = MinimaxProvider()
            else:
                raise ValueError(f"Unknown TTS provider: {provider_type}")
        
        return cls._providers[provider_type]
    
    @classmethod
    def get_available_providers(cls) -> list[str]:
        """Get list of available TTS providers based on environment variables"""
        available = []
        
        if os.getenv("ELEVENLABS_API_KEY"):
            available.append(TTSProvider.ELEVENLABS.value)
        
        if os.getenv("MINIMAX_API_KEY") and os.getenv("MINIMAX_GROUP_ID"):
            available.append(TTSProvider.MINIMAX.value)
        
        return available

class TTSStreamer:
    """High-level TTS streaming handler"""
    
    def __init__(self, default_provider: TTSProvider = TTSProvider.ELEVENLABS):
        self.default_provider = default_provider
    
    async def stream_to_client(self, 
                              ws,  # WebSocket connection
                              text: str, 
                              toy_config: Dict[str, Any],
                              provider_override: Optional[TTSProvider] = None) -> None:
        """Stream TTS audio to client over WebSocket"""
        
        # Determine which provider to use
        provider_type = provider_override or TTSProvider(toy_config.get('ttsProvider', self.default_provider.value))
        
        try:
            provider = TTSProviderFactory.get_provider(provider_type)
            audio_format = provider.get_audio_format()
            
            logger.info(f"Streaming TTS using {provider_type.value} for text: '{text[:50]}...'")
            
            # Stream audio chunks to client
            chunks_sent = 0
            bytes_sent = 0
            async for chunk in provider.stream_tts(text, toy_config):
                if ws.closed:
                    logger.warning("WebSocket closed during TTS streaming")
                    break
                
                chunks_sent += 1
                bytes_sent += len(chunk)
                
                # Send audio chunk to client
                response_message = {
                    "type": "audio_response",
                    "payload": {
                        "data": chunk.hex(),
                        "metadata": {
                            "format": audio_format,            # 'pcm16'
                            "endian": "le",                   # little-endian
                            "channels": 1,                    # mono
                            "provider": provider_type.value,
                            "sampleRate": getattr(provider, 'sample_rate', 16000),
                            "isFinal": False
                        }
                    }
                }
                await ws.send_str(json.dumps(response_message))
                logger.debug(f"Sent audio chunk #{chunks_sent}: {len(chunk)} bytes")
            
            logger.info(f"TTS streaming stats: sent {chunks_sent} chunks, {bytes_sent} bytes total")
            
            # Send final marker
            if not ws.closed:
                await ws.send_str(json.dumps({
                    "type": "audio_response",
                    "payload": {
                        "data": "",
                        "metadata": {
                            "format": audio_format,
                            "endian": "le",
                            "channels": 1,
                            "provider": provider_type.value,
                            "sampleRate": getattr(provider, 'sample_rate', 16000),
                            "isFinal": True
                        }
                    }
                }))
                
        except Exception as e:
            logger.error(f"TTS streaming error with {provider_type.value}: {e}")
            
            # Try fallback provider if available
            if provider_type != self.default_provider:
                logger.info(f"Attempting fallback to {self.default_provider.value}")
                await self.stream_to_client(ws, text, toy_config, self.default_provider)
            else:
                # Send error to client
                if not ws.closed:
                    await ws.send_str(json.dumps({
                        "type": "error",
                        "payload": {
                            "error": "TTS_FAILED",
                            "message": "Text-to-speech service unavailable"
                        }
                    }))