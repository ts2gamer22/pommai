#!/usr/bin/env python3
"""
Debug Audio Flow - Trace why audio isn't being processed by AI
"""

import asyncio
import json
import logging
import os
import time
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_audio_flow():
    """Test the complete audio processing flow"""
    
    print("🔍 Audio Flow Diagnostic Test")
    print("=" * 50)
    
    # Import the client components
    try:
        from src.fastrtc_connection import FastRTCConnection, FastRTCConfig
        from src.pommai_client_fastrtc import PommaiClientFastRTC, Config
        logger.info("✅ Successfully imported client components")
    except ImportError as e:
        logger.error(f"❌ Failed to import client components: {e}")
        return
    
    # Create config
    config = Config()
    logger.info(f"📋 Config loaded:")
    logger.info(f"   Gateway URL: {config.FASTRTC_GATEWAY_URL}")
    logger.info(f"   Device ID: {config.DEVICE_ID}")
    logger.info(f"   Toy ID: {config.TOY_ID}")
    
    # Test 1: Basic WebSocket connection
    print("\n1. Testing WebSocket Connection...")
    print("-" * 30)
    
    try:
        import websockets
        
        # Build WebSocket URL
        gateway_url = config.FASTRTC_GATEWAY_URL
        if not gateway_url.endswith('/ws'):
            gateway_url = gateway_url.rstrip('/') + '/ws'
        
        ws_url = f"{gateway_url}/{config.DEVICE_ID}/{config.TOY_ID}"
        logger.info(f"Connecting to: {ws_url}")
        
        async with websockets.connect(ws_url, subprotocols=['fastrtc']) as ws:
            logger.info("✅ WebSocket connected successfully")
            
            # Send configuration
            config_msg = {
                'type': 'config',
                'deviceId': config.DEVICE_ID,
                'toyId': config.TOY_ID,
                'audioFormat': 'pcm16',
                'sampleRate': 16000,
                'timestamp': time.time()
            }
            
            await ws.send(json.dumps(config_msg))
            logger.info("✅ Configuration sent")
            
            # Test 2: Send test audio and check processing
            print("\n2. Testing Audio Processing...")
            print("-" * 30)
            
            # Generate test PCM16 audio (1 second of 440Hz tone)
            import numpy as np
            
            sample_rate = 16000
            duration = 1.0  # 1 second
            frequency = 440  # A4 note
            
            t = np.linspace(0, duration, int(sample_rate * duration), False)
            wave = np.sin(frequency * 2 * np.pi * t) * 0.3  # Reduced amplitude
            pcm_data = (wave * 32767).astype(np.int16).tobytes()
            
            logger.info(f"Generated test audio: {len(pcm_data)} bytes")
            
            # Start streaming
            await ws.send(json.dumps({
                'type': 'start_streaming',
                'timestamp': time.time()
            }))
            logger.info("✅ Started streaming mode")
            
            # Send audio in chunks
            chunk_size = 640  # 20ms at 16kHz
            chunks_sent = 0
            
            for i in range(0, len(pcm_data), chunk_size):
                chunk = pcm_data[i:i+chunk_size]
                is_final = (i + chunk_size >= len(pcm_data))
                
                msg = {
                    'type': 'audio_chunk',
                    'payload': {
                        'data': chunk.hex(),
                        'format': 'pcm16',
                        'sampleRate': 16000,
                        'isFinal': is_final
                    },
                    'timestamp': time.time()
                }
                
                await ws.send(json.dumps(msg))
                chunks_sent += 1
                
                if chunks_sent % 10 == 0:
                    logger.info(f"Sent {chunks_sent} audio chunks...")
                
                # Small delay to simulate real-time
                await asyncio.sleep(0.02)
            
            logger.info(f"✅ Sent {chunks_sent} audio chunks total")
            
            # Stop streaming
            await ws.send(json.dumps({
                'type': 'stop_streaming',
                'timestamp': time.time()
            }))
            logger.info("✅ Stopped streaming mode")
            
            # Test 3: Wait for AI response
            print("\n3. Waiting for AI Response...")
            print("-" * 30)
            
            timeout = 15  # 15 seconds timeout
            start_time = time.time()
            responses_received = 0
            
            while time.time() - start_time < timeout:
                try:
                    message = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    data = json.loads(message)
                    
                    msg_type = data.get('type')
                    responses_received += 1
                    
                    logger.info(f"📥 Received: {msg_type}")
                    
                    if msg_type == 'text_response':
                        text = data.get('payload', {}).get('text', '')
                        logger.info(f"🤖 AI Response: {text}")
                        
                    elif msg_type == 'audio_response':
                        metadata = data.get('payload', {}).get('metadata', {})
                        audio_data = data.get('payload', {}).get('data', '')
                        logger.info(f"🔊 Audio Response: format={metadata.get('format')}, "
                                  f"size={len(audio_data)//2}B, final={metadata.get('isFinal')}")
                        
                    elif msg_type == 'error':
                        error = data.get('error', 'Unknown error')
                        logger.error(f"❌ Server Error: {error}")
                        
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    logger.error(f"❌ Error receiving message: {e}")
            
            logger.info(f"📊 Total responses received: {responses_received}")
            
            if responses_received == 0:
                logger.error("❌ No responses received - AI pipeline not processing audio!")
            else:
                logger.info("✅ AI pipeline is responding")
                
    except Exception as e:
        logger.error(f"❌ WebSocket test failed: {e}")
    
    # Test 4: Check server logs (if accessible)
    print("\n4. Recommendations...")
    print("-" * 20)
    
    print("\n🔍 Based on the test results:")
    
    if responses_received == 0:
        print("❌ ISSUE: Audio is not being processed by the AI pipeline")
        print("\n💡 Possible causes:")
        print("1. Audio format mismatch (check server expects PCM16)")
        print("2. Audio too short/quiet for speech detection")
        print("3. Server-side processing errors")
        print("4. Convex backend configuration issues")
        print("\n🛠️ Next steps:")
        print("1. Check FastRTC gateway server logs")
        print("2. Verify ElevenLabs/Convex API keys")
        print("3. Test with longer, clearer audio")
        
    else:
        print("✅ Audio processing pipeline is working!")
        print("The issue might be in the client-side audio playback")

if __name__ == "__main__":
    asyncio.run(test_audio_flow())
