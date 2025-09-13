#!/usr/bin/env python3
"""
Updated Pommai Smart Toy Client for Raspberry Pi Zero 2W
Using FastRTC Gateway for simplified real-time communication

This updated client:
- Uses FastRTCConnection for WebSocket communication
- Streams audio; consumes audio_response chunks from a queue
- Handles PCM16/Opus, channels, endianness, and resampling
- Adds robust debug logging and env-based overrides
"""

import asyncio
import json
import logging
import os
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, Any

# External dependencies
import pyaudio
import numpy as np
from dotenv import load_dotenv

# Local modules
from fastrtc_connection import FastRTCConnection, FastRTCConfig, ConnectionState
from led_controller import LEDController, LEDPattern
from button_handler import ButtonHandler
from audio_stream_manager import AudioStreamManager, AudioConfig
from opus_audio_codec import OpusAudioCodec, OpusConfig
from wake_word_detector import WakeWordDetector
from conversation_cache import ConversationCache, CacheConfig
from sync_manager import SyncManager

# Try to import audio utils for smart device detection
try:
    from audio_utils import get_audio_device_indices
    AUDIO_UTILS_AVAILABLE = True
except ImportError:
    AUDIO_UTILS_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.info("audio_utils not found, using default audio devices")

# Try to import RPi.GPIO (will fail on non-Pi systems)
try:
    import RPi.GPIO as GPIO
    ON_RASPBERRY_PI = True
except ImportError:
    ON_RASPBERRY_PI = False
    logging.warning("RPi.GPIO not available - running in simulation mode")

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def _get_env_with_fallback(primary, fallback_keys, default=None):
    """Read env var with fallbacks; log a warning if a legacy key is used."""
    val = os.getenv(primary)
    if val:
        return val
    for fk in fallback_keys:
        fb = os.getenv(fk)
        if fb:
            logger.warning(f"Using legacy env var {fk}; please set {primary} in .env")
            return fb
    return default if default is not None else ""


@dataclass
class Config:
    """Configuration for the updated Pommai client"""
    # FastRTC Gateway connection
    FASTRTC_GATEWAY_URL: str = _get_env_with_fallback('FASTRTC_GATEWAY_URL', ['CONVEX_URL'], 'ws://localhost:8080/ws')

    # Device identification
    DEVICE_ID: str = os.getenv('DEVICE_ID', 'rpi-toy-001')
    TOY_ID: str = _get_env_with_fallback('TOY_ID', ['POMMAI_TOY_ID'], 'default-toy')
    AUTH_TOKEN: str = _get_env_with_fallback('AUTH_TOKEN', ['POMMAI_USER_TOKEN'], '')

    # Audio settings
    SAMPLE_RATE: int = 16000
    CHUNK_SIZE: int = 320  # 20ms @ 16kHz aligns with Opus default frame
    CHANNELS: int = 1
    AUDIO_FORMAT: int = pyaudio.paInt16

    # Opus codec settings
    OPUS_BITRATE: int = 24000
    OPUS_COMPLEXITY: int = 5

    # GPIO pins (if on Raspberry Pi)
    BUTTON_PIN: int = 17
    LED_PINS: Dict[str, int] = field(default_factory=lambda: {
        'red': 5,
        'green': 6,
        'blue': 13
    })

    # Features
    ENABLE_WAKE_WORD: bool = os.getenv('ENABLE_WAKE_WORD', 'false').lower() == 'true'
    ENABLE_OFFLINE_MODE: bool = os.getenv('ENABLE_OFFLINE_MODE', 'true').lower() == 'true'

    # Performance
    MAX_RECONNECT_ATTEMPTS: int = 5
    RECONNECT_DELAY: float = 2.0


class ToyState(Enum):
    """State machine for toy operations"""
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    ERROR = "error"
    OFFLINE = "offline"
    CONNECTING = "connecting"


class HardwareController:
    """Manages PyAudio input/output streams for AudioStreamManager."""

    def __init__(self, sample_rate: int, channels: int, chunk_size: int,
                 input_device_index: Optional[int] = None,
                 output_device_index: Optional[int] = None,
                 output_sample_rate: Optional[int] = None):
        self._pa = pyaudio.PyAudio()
        self.input_stream = self._pa.open(
            format=pyaudio.paInt16,
            channels=channels,
            rate=sample_rate,
            input=True,
            input_device_index=input_device_index,
            frames_per_buffer=chunk_size
        )
        # Use a larger buffer for Bluetooth output to reduce underruns
        out_buffer = max(chunk_size, 4096)  # Increased buffer for Bluetooth stability
        self.output_stream = self._pa.open(
            format=pyaudio.paInt16,
            channels=channels,
            rate=output_sample_rate or sample_rate,
            output=True,
            output_device_index=output_device_index,
            frames_per_buffer=out_buffer
        )

    def cleanup(self):
        try:
            if self.input_stream:
                self.input_stream.stop_stream()
                self.input_stream.close()
        except Exception:
            pass
        try:
            if self.output_stream:
                self.output_stream.stop_stream()
                self.output_stream.close()
        except Exception:
            pass
        try:
            self._pa.terminate()
        except Exception:
            pass


class PommaiClientFastRTC:
    """Main client application using FastRTC connection"""

    def __init__(self, config: Config):
        self.config = config
        self.state = ToyState.IDLE

        # Initialize FastRTC connection
        wire_format = os.getenv('AUDIO_SEND_FORMAT', 'opus').strip().lower()
        if wire_format not in ('opus', 'pcm16', 'wav'):
            wire_format = 'opus'
        rtc_config = FastRTCConfig(
            gateway_url=config.FASTRTC_GATEWAY_URL,
            device_id=config.DEVICE_ID,
            toy_id=config.TOY_ID,
            auth_token=config.AUTH_TOKEN,
            reconnect_attempts=config.MAX_RECONNECT_ATTEMPTS,
            reconnect_delay=config.RECONNECT_DELAY,
            audio_format=wire_format,
            sample_rate=config.SAMPLE_RATE
        )
        self.connection = FastRTCConnection(rtc_config)

        # Initialize audio components with smart device detection
        if AUDIO_UTILS_AVAILABLE:
            try:
                audio_devices = get_audio_device_indices()
                input_device = audio_devices.get("input")
                output_device = audio_devices.get("output")
                logger.info(f"Audio devices detected - Input: {input_device}, Output: {output_device}")
            except Exception as e:
                logger.warning(f"Failed to detect audio devices: {e}, using defaults")
                input_device = None
                output_device = None
        else:
            input_device = None
            output_device = None
            logger.info("Using default ALSA audio routing")

        # Optional hardcoded overrides via env
        try:
            forced_out = os.getenv('POMMAI_FORCE_OUTPUT_DEVICE_INDEX') or os.getenv('FORCE_OUTPUT_DEVICE_INDEX')
            if forced_out:
                output_device = int(forced_out)
                logger.info(f"HARDCODE_DEBUG: Using Output Device Index override: {output_device}")
        except Exception as e:
            logger.warning(f"HARDCODE_DEBUG: Invalid FORCE_OUTPUT_DEVICE_INDEX: {e}")
        try:
            forced_in = os.getenv('POMMAI_FORCE_INPUT_DEVICE_INDEX') or os.getenv('FORCE_INPUT_DEVICE_INDEX')
            if forced_in:
                input_device = int(forced_in)
                logger.info(f"HARDCODE_DEBUG: Using Input Device Index override: {input_device}")
        except Exception as e:
            logger.warning(f"HARDCODE_DEBUG: Invalid FORCE_INPUT_DEVICE_INDEX: {e}")

        # Playback rate (consider 24000 for ElevenLabs or 48000 for Bluetooth)
        try:
            playback_rate_env = os.getenv('PLAYBACK_SAMPLE_RATE') or os.getenv('FORCE_PLAYBACK_SAMPLE_RATE')
            playback_sample_rate = int(playback_rate_env) if playback_rate_env else None
        except Exception:
            playback_sample_rate = None
        
        # If Bluetooth device detected and no rate forced, default to 48kHz for stability
        if output_device is not None and playback_sample_rate is None:
            # Check if this is likely a Bluetooth device
            try:
                p = pyaudio.PyAudio()
                info = p.get_device_info_by_index(output_device)
                device_name = info.get('name', '').lower()
                p.terminate()
                if 'bluealsa' in device_name or 'bluetooth' in device_name:
                    playback_sample_rate = 48000
                    logger.info("Bluetooth device detected, defaulting playback rate to 48000 Hz for stability")
            except Exception as e:
                logger.debug(f"Could not detect device type: {e}")

        self.hardware = HardwareController(
            sample_rate=config.SAMPLE_RATE,
            channels=config.CHANNELS,
            chunk_size=config.CHUNK_SIZE,
            input_device_index=input_device,
            output_device_index=output_device,
            output_sample_rate=playback_sample_rate
        )
        play_rate = playback_sample_rate or config.SAMPLE_RATE
        logger.info(f"AUDIO_DEVICE_SELECTION: Using Input Device Index: {input_device}")
        logger.info(f"AUDIO_DEVICE_SELECTION: Using Output Device Index: {output_device}")
        logger.info(f"AUDIO_DEVICE_SELECTION: Using Playback Sample Rate: {play_rate}")

        # Use 20ms playback chunks based on playback rate
        play_chunk_size = max(160, int(round(play_rate * 0.02)))
        if play_chunk_size % 2 == 1:
            play_chunk_size += 1
        self.audio_manager = AudioStreamManager(
            self.hardware,
            AudioConfig(sample_rate=play_rate, chunk_size=play_chunk_size, channels=config.CHANNELS)
        )

        self.opus_codec = OpusAudioCodec(OpusConfig(
            sample_rate=config.SAMPLE_RATE,
            channels=config.CHANNELS,
            bitrate=config.OPUS_BITRATE,
            complexity=config.OPUS_COMPLEXITY
        ))

        # Hardware controllers (Pi only)
        if ON_RASPBERRY_PI:
            try:
                GPIO.setmode(GPIO.BCM)
                GPIO.setwarnings(False)
                pwm_controllers = {}
                for color, pin in self.config.LED_PINS.items():
                    GPIO.setup(pin, GPIO.OUT)
                    pwm = GPIO.PWM(pin, 1000)
                    pwm.start(0)
                    pwm_controllers[color] = pwm
                self.led_controller = LEDController(pwm_controllers)
            except Exception as e:
                logger.error(f"LED controller init failed: {e}")
                self.led_controller = None

            try:
                self.button_handler = ButtonHandler(config.BUTTON_PIN)
                self.button_handler.set_callbacks(
                    on_press=self.on_button_press,
                    on_release=self.on_button_release
                )
            except Exception as e:
                logger.error(f"Button handler init failed: {e}")
                self.button_handler = None
        else:
            self.led_controller = None
            self.button_handler = None
            logger.info("Hardware controllers disabled (not on Raspberry Pi)")

        # Wake word detector (optional)
        self.wake_word_detector = None
        if config.ENABLE_WAKE_WORD:
            try:
                self.wake_word_detector = WakeWordDetector()
            except Exception as e:
                logger.error(f"Failed to initialize wake word detector: {e}")

        # Offline cache and sync manager with safe path
        self.cache: Optional[ConversationCache] = None
        if config.ENABLE_OFFLINE_MODE:
            try:
                cache_db = os.getenv('POMMAI_CACHE_DB') or '/home/pommai/cache/pommai_cache.db'
                cache_backup = os.getenv('POMMAI_CACHE_BACKUP') or '/home/pommai/cache/backup.db'
                try:
                    os.makedirs(os.path.dirname(cache_db), exist_ok=True)
                except Exception:
                    pass
                try:
                    os.makedirs(os.path.dirname(cache_backup), exist_ok=True)
                except Exception:
                    pass
                logger.info(f"CACHE: Using db_path={cache_db}, backup_path={cache_backup}")
                self.cache = ConversationCache(CacheConfig(db_path=cache_db, backup_path=cache_backup))
            except Exception as e:
                logger.error(f"ConversationCache init failed: {e} - disabling offline mode to continue.")
                self.cache = None
        self.sync_manager: Optional[SyncManager] = None

        # Audio recording state
        self.is_recording = False
        self.audio_buffer = []
        self.recording_task = None

        # Register message handlers (do NOT register 'audio_response' here)
        self._register_handlers()

    def _register_handlers(self):
        """Register message handlers for FastRTC connection."""
        # Audio chunks are enqueued by FastRTCConnection and read from get_audio_chunk()
        self.connection.on_message("text_response", self.handle_text_response)
        self.connection.on_message("audio_ready", self.handle_audio_ready)
        self.connection.on_message("config_update", self.handle_config_update)
        self.connection.on_message("error", self.handle_error)
        self.connection.on_message("toy_state", self.handle_toy_state)

    async def initialize(self) -> bool:
        """Initialize all components and connect to gateway"""
        logger.info("Initializing Pommai client with FastRTC...")

        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.LOADING_TOY)

        self.state = ToyState.CONNECTING

        connected = await self.connection.connect()
        if not connected:
            logger.error("Failed to connect to FastRTC gateway")
            self.state = ToyState.OFFLINE
            if self.led_controller:
                await self.led_controller.set_pattern(LEDPattern.ERROR)
            return False

        logger.info("Connected to FastRTC gateway successfully")

        # Initialize audio manager (no-op but future-proof)
        await self.audio_manager.initialize()

        # Initialize cache and start background sync
        if self.cache:
            try:
                await self.cache.initialize()
            except Exception as e:
                logger.error(f"Cache initialize failed: {e}. Disabling offline mode to continue.")
                self.cache = None
            if self.cache:
                self.sync_manager = SyncManager(self.cache, self.connection)
                await self.sync_manager.start()

        if self.wake_word_detector:
            asyncio.create_task(self.wake_word_loop())

        self.state = ToyState.IDLE
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.IDLE)

        return True

    async def on_button_press(self):
        if self.state != ToyState.IDLE:
            logger.warning(f"Button pressed in state {self.state}, ignoring")
            return
        logger.info("Button pressed - starting recording")
        await self.start_recording()

    async def on_button_release(self, duration: float = 0.0):
        if self.state != ToyState.LISTENING:
            return
        logger.info("Button released (%.2fs) - stopping recording", duration)
        await self.stop_recording()

    async def start_recording(self):
        if self.is_recording:
            return
        self.state = ToyState.LISTENING
        self.is_recording = True
        self.audio_buffer = []
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.LISTENING)
        await self.connection.start_streaming()
        self.recording_task = asyncio.create_task(self.record_audio())

    async def stop_recording(self):
        if not self.is_recording:
            return
        self.is_recording = False
        self.state = ToyState.PROCESSING
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.PROCESSING)

        if self.recording_task:
            try:
                await asyncio.wait_for(self.recording_task, timeout=1.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                self.recording_task.cancel()
                try:
                    await self.recording_task
                except asyncio.CancelledError:
                    pass

        await asyncio.sleep(0.1)

        # Send final marker
        if self.connection.config.audio_format == 'opus':
            if self.audio_buffer:
                audio_data = np.concatenate(self.audio_buffer)
                compressed = self.opus_codec.encode_chunk(audio_data.tobytes())
                if compressed:
                    await self.connection.send_audio_chunk(compressed, is_final=True)
                else:
                    await self.connection.send_audio_chunk(b"", is_final=True)
            else:
                await self.connection.send_audio_chunk(b"", is_final=True)
        else:
            await self.connection.send_audio_chunk(b"", is_final=True)
            logger.info("Sent final audio marker for PCM16 stream")

        await self.connection.stop_streaming()

        # Fallback trigger if no text_response arrives
        asyncio.create_task(self._monitor_audio_queue())

    async def record_audio(self):
        try:
            while self.is_recording:
                audio_chunk = await self.audio_manager.read_chunk()
                if audio_chunk is None:
                    continue

                # Debug mic chunk sizes
                if not hasattr(self, '_rec_chunk_count'):
                    self._rec_chunk_count = 0
                self._rec_chunk_count += 1
                if self._rec_chunk_count <= 3 or self._rec_chunk_count % 50 == 0:
                    try:
                        size_bytes = getattr(audio_chunk, 'nbytes', len(audio_chunk))
                    except Exception:
                        size_bytes = None
                    logger.debug(f"MIC_CHUNK: idx={self._rec_chunk_count}, size={size_bytes} bytes")

                # Buffer (for final opus send)
                self.audio_buffer.append(audio_chunk)

                if self.connection.config.audio_format == 'opus':
                    compressed = self.opus_codec.encode_chunk(audio_chunk.tobytes())
                    if compressed:
                        await self.connection.send_audio_chunk(compressed, is_final=False)
                else:
                    await self.connection.send_audio_chunk(audio_chunk.tobytes(), is_final=False)

                await asyncio.sleep(0.01)

        except asyncio.CancelledError:
            logger.debug("Recording task cancelled")
        except Exception as e:
            logger.error(f"Recording error: {e}")
            self.is_recording = False

    async def play_audio_from_queue(self):
        """Play audio chunks from the connection's queue with simple, format-aware passthrough."""
        if getattr(self, "_audio_playback_running", False):
            logger.warning("Audio playback already running; ignoring duplicate trigger")
            return
        
        self._audio_playback_running = True

        logger.info(f"PLAYBACK: Starting audio playback from queue (size: {self.connection.audio_queue.qsize()})")
        self.state = ToyState.SPEAKING
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.SPEAKING)

        try:
            async def audio_chunk_generator():
                pcm_accum = bytearray()
                min_buffer_size = 8192  # Accumulate before yielding for Bluetooth stability

                while True:
                    # Block until a chunk arrives; do not rely on timeouts
                    chunk = await self.connection.get_audio_chunk()
                    if not chunk:
                        # Connection may be temporarily idle; patiently wait
                        await asyncio.sleep(0.01)
                        continue

                    audio_data = chunk.get('data', b'')
                    metadata = chunk.get('metadata', {})
                    audio_format = metadata.get('format', 'opus')
                    is_final = metadata.get('isFinal', False)

                    pcm_data = b''
                    if audio_data:
                        if audio_format == 'pcm16':
                            # Trust the server: PCM is already 16kHz, mono, little-endian
                            pcm_data = audio_data
                        elif audio_format == 'opus':
                            # Decode Opus to PCM
                            pcm_data = self.opus_codec.decode_chunk(audio_data) or b''
                        else:
                            logger.warning(f"Unsupported audio format: {audio_format}")
                            pcm_data = b''

                    try:
                        logger.debug(f"DECODED_CHUNK: fmt={audio_format}, pcm_len={len(pcm_data)}, is_final={is_final}")
                    except Exception:
                        pass

                    if pcm_data:
                        pcm_accum.extend(pcm_data)
                        # Ensure even number of bytes (16-bit alignment)
                        if len(pcm_accum) % 2 == 1:
                            pcm_accum.append(0)
                        # Yield in larger chunks for Bluetooth stability
                        while len(pcm_accum) >= min_buffer_size:
                            chunk_to_yield = min(min_buffer_size, len(pcm_accum))
                            yield {'data': bytes(pcm_accum[:chunk_to_yield]), 'is_final': False}
                            del pcm_accum[:chunk_to_yield]

                    if is_final:
                        if len(pcm_accum) > 0:
                            # Pad final chunk to min_buffer_size for smoother end-of-stream on Bluetooth
                            if len(pcm_accum) < min_buffer_size:
                                padding_needed = min_buffer_size - len(pcm_accum)
                                pcm_accum.extend(b'\x00' * padding_needed)
                            yield {'data': bytes(pcm_accum), 'is_final': False}
                            pcm_accum.clear()
                        yield {'data': b'', 'is_final': True}
                        break

            try:
                active = self.hardware.output_stream.is_active()
            except Exception:
                active = None
            logger.info(f"PLAYBACK_LOOP: Starting. Output stream active: {active}")
            logger.info("PLAYBACK: Starting audio_manager.play_audio_stream()")
            await self.audio_manager.play_audio_stream(audio_chunk_generator())
            logger.info("PLAYBACK: Finished audio_manager.play_audio_stream()")

        except Exception as e:
            logger.error(f"Error processing audio stream: {e}", exc_info=True)
        finally:
            # Always reset the playback flag and state
            self._audio_playback_running = False
            self.state = ToyState.IDLE
            if self.led_controller:
                try:
                    await self.led_controller.set_pattern(LEDPattern.IDLE)
                except Exception as e:
                    logger.error(f"Failed to set LED pattern: {e}")

    async def handle_config_update(self, message: Dict[str, Any]):
        config = message.get('config', {})
        logger.info(f"Configuration update: {config}")
        if 'toyId' in config:
            self.config.TOY_ID = config['toyId']

    async def handle_error(self, message: Dict[str, Any]):
        error = message.get('error', 'Unknown error')
        logger.error(f"Server error: {error}")
        self.state = ToyState.ERROR
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.ERROR)
        await asyncio.sleep(2)
        self.state = ToyState.IDLE
        if self.led_controller:
            await self.led_controller.set_pattern(LEDPattern.IDLE)

    async def handle_toy_state(self, message: Dict[str, Any]):
        state = message.get('state')
        if state:
            logger.info(f"Toy state update: {state}")

    async def handle_audio_ready(self, message: Dict[str, Any]):
        # Deprecated: we only start playback from text_response to avoid races
        trigger_source = message.get('trigger', 'unknown')
        logger.debug(f"AUDIO_READY ignored (trigger={trigger_source}) - text_response is the sole trigger")

    async def handle_text_response(self, message: Dict[str, Any]):
        logger.info("HANDLER: handle_text_response called")
        payload = message.get('payload', {})
        text = payload.get('text', '')
        if text:
            logger.info(f"Received text response: {text[:50]}...")
        else:
            logger.warning("Received text_response with empty text")
        
        # Check if we need to reset a stuck playback state
        if getattr(self, "_audio_playback_running", False):
            # Check if audio_manager is actually playing
            if not self.audio_manager.is_playing:
                logger.warning("Playback flag was stuck, resetting it")
                self._audio_playback_running = False
        
        logger.info("TEXT_RESPONSE: Received; starting playback if not already running")
        if not getattr(self, "_audio_playback_running", False):
            asyncio.create_task(self.play_audio_from_queue())
        else:
            logger.debug("Audio playback already running (text_response)")

    async def _monitor_audio_queue(self):
        await asyncio.sleep(0.5)
        if getattr(self, "_audio_playback_running", False):
            return
        if self.connection.audio_queue.qsize() > 0:
            logger.info("Audio chunks detected in queue, starting playback")
            await self.play_audio_from_queue()

    async def wake_word_loop(self):
        logger.info("Wake word detection started")
        while True:
            try:
                if self.wake_word_detector and self.state == ToyState.IDLE:
                    detected = await self.wake_word_detector.detect()
                    if detected:
                        logger.info("Wake word detected!")
                        await self.start_recording()
                        await asyncio.sleep(5)
                        if self.is_recording:
                            await self.stop_recording()
                await asyncio.sleep(0.1)
            except Exception as e:
                logger.error(f"Wake word detection error: {e}")
                await asyncio.sleep(1)

    async def run(self):
        logger.info("Starting Pommai client...")
        if not await self.initialize():
            logger.error("Initialization failed")
            return
        try:
            while True:
                if not self.connection.is_connected():
                    if self.state != ToyState.OFFLINE:
                        self.state = ToyState.OFFLINE
                        if self.led_controller:
                            await self.led_controller.set_pattern(LEDPattern.OFFLINE)
                    await asyncio.sleep(5)
                    if await self.connection.connect():
                        self.state = ToyState.IDLE
                        if self.led_controller:
                            await self.led_controller.set_pattern(LEDPattern.IDLE)
                await asyncio.sleep(0.1)
        except KeyboardInterrupt:
            logger.info("Shutting down...")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        finally:
            await self.cleanup()

    async def cleanup(self):
        logger.info("Cleaning up...")
        if self.is_recording:
            await self.stop_recording()
        await self.connection.disconnect()
        if self.sync_manager:
            try:
                await self.sync_manager.stop()
            except Exception:
                pass
        if self.button_handler:
            try:
                self.button_handler.cleanup()
            except Exception:
                pass
        if self.led_controller:
            try:
                await self.led_controller.set_pattern(LEDPattern.IDLE)
            except Exception:
                pass
        try:
            await self.audio_manager.cleanup()
            self.hardware.cleanup()
        except Exception:
            pass
        logger.info("Cleanup complete")


async def main():
    config = Config()
    client = PommaiClientFastRTC(config)
    await client.run()


if __name__ == "__main__":
    asyncio.run(main())