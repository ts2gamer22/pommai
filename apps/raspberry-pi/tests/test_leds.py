#!/usr/bin/env python3
"""
LED Pattern Test Script for Pommai Raspberry Pi Client
Tests all LED patterns and effects
"""

import asyncio
import sys
import os
import logging
import RPi.GPIO as GPIO

# Add parent directory to path to import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from led_controller import LEDController, LEDPattern, ColorMixer


async def test_all_patterns():
    """Test all LED patterns"""
    logging.basicConfig(level=logging.INFO)
    
    # GPIO setup
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    
    # LED pins from ReSpeaker HAT
    led_pins = {
        'red': 5,
        'green': 6,
        'blue': 13
    }
    
    # Setup PWM controllers
    pwm_controllers = {}
    for color, pin in led_pins.items():
        GPIO.setup(pin, GPIO.OUT)
        pwm = GPIO.PWM(pin, 1000)  # 1kHz
        pwm.start(0)
        pwm_controllers[color] = pwm
    
    # Create LED controller
    led_controller = LEDController(pwm_controllers)
    
    try:
        print("\nPommai LED Pattern Test")
        print("=======================")
        print("This will test all LED patterns.")
        print("Press Ctrl+C to skip to next pattern or exit.\n")
        
        # Test patterns
        patterns = [
            (LEDPattern.IDLE, "Idle - Blue breathing", 10),
            (LEDPattern.LISTENING, "Listening - Blue pulse", 8),
            (LEDPattern.PROCESSING, "Processing - Rainbow swirl", 8),
            (LEDPattern.SPEAKING, "Speaking - Solid green", 5),
            (LEDPattern.ERROR, "Error - Red flash", 5),
            (LEDPattern.CONNECTION_LOST, "Connection Lost - Amber pulse", 8),
            (LEDPattern.LOADING_TOY, "Loading Toy - White spinner", 8),
            (LEDPattern.SWITCHING_TOY, "Switching Toy - Color transition", 10),
            (LEDPattern.GUARDIAN_ALERT, "Guardian Alert - Amber double pulse", 8),
            (LEDPattern.SAFE_MODE, "Safe Mode - Green breathing", 8),
            (LEDPattern.LOW_BATTERY, "Low Battery - Red pulse", 8),
            (LEDPattern.CELEBRATION, "Celebration - Rainbow", 8),
            (LEDPattern.THINKING, "Thinking - Purple swirl", 8),
            (LEDPattern.OFFLINE, "Offline - Dim white pulse", 8),
        ]
        
        for pattern, description, duration in patterns:
            print(f"\nTesting: {description}")
            print(f"Duration: {duration} seconds")
            
            await led_controller.set_pattern(pattern)
            
            try:
                await asyncio.sleep(duration)
            except KeyboardInterrupt:
                print("  Skipping...")
                continue
        
        # Test special effects
        print("\n\nTesting Special Effects")
        print("=======================")
        
        print("\nWhite flash (3 times)")
        await led_controller.flash_color(255, 255, 255, duration=0.1, count=3)
        await asyncio.sleep(1)
        
        print("\nFade to blue")
        await led_controller.fade_to_color(0, 0, 255, duration=2.0)
        await asyncio.sleep(1)
        
        print("\nFade to green")
        await led_controller.fade_to_color(0, 255, 0, duration=2.0)
        await asyncio.sleep(1)
        
        print("\nFade to red")
        await led_controller.fade_to_color(255, 0, 0, duration=2.0)
        await asyncio.sleep(1)
        
        # Test brightness control
        print("\n\nTesting Brightness Control")
        print("==========================")
        
        await led_controller.set_pattern(LEDPattern.IDLE)
        
        print("\nNormal brightness")
        await asyncio.sleep(3)
        
        print("\n50% brightness")
        led_controller.set_brightness(0.5)
        await asyncio.sleep(3)
        
        print("\n25% brightness")
        led_controller.set_brightness(0.25)
        await asyncio.sleep(3)
        
        print("\nLow power mode")
        led_controller.enable_low_power_mode()
        await asyncio.sleep(3)
        
        print("\nNormal mode")
        led_controller.disable_low_power_mode()
        led_controller.set_brightness(1.0)
        await asyncio.sleep(3)
        
        print("\n\nTest complete!")
        
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n\nError during test: {e}")
        logging.exception("Test error")
    finally:
        # Cleanup
        await led_controller.set_pattern(None)
        for pwm in pwm_controllers.values():
            pwm.stop()
        GPIO.cleanup()
        print("GPIO cleanup complete")


def test_color_mixer():
    """Test color mixing utilities"""
    print("\nColor Mixer Test")
    print("================")
    
    # Test RGB to duty cycle
    print("\nRGB to Duty Cycle:")
    test_colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (128, 128, 128)]
    for r, g, b in test_colors:
        duty = ColorMixer.rgb_to_duty_cycle(r, g, b)
        print(f"  RGB({r}, {g}, {b}) -> {duty}")
    
    # Test HSV to RGB
    print("\nHSV to RGB:")
    test_hsv = [(0, 1, 1), (0.33, 1, 1), (0.67, 1, 1), (0, 0, 0.5)]
    for h, s, v in test_hsv:
        r, g, b = ColorMixer.hsv_to_rgb(h, s, v)
        print(f"  HSV({h:.2f}, {s:.2f}, {v:.2f}) -> RGB({r}, {g}, {b})")
    
    # Test color interpolation
    print("\nColor Interpolation:")
    start = (255, 0, 0)  # Red
    end = (0, 0, 255)    # Blue
    for progress in [0, 0.25, 0.5, 0.75, 1.0]:
        color = ColorMixer.interpolate_color(start, end, progress)
        print(f"  Progress {progress:.2f}: {color}")


if __name__ == "__main__":
    print("Pommai LED Controller Test Suite")
    print("================================\n")
    
    # Test color mixer first
    test_color_mixer()
    
    # Then test LED patterns
    print("\nStarting LED pattern tests...")
    asyncio.run(test_all_patterns())
