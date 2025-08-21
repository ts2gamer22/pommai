#!/usr/bin/env python3
"""
Button Test Script for Pommai Raspberry Pi Client
Tests button functionality including single, double, triple, and long press
"""

import asyncio
import sys
import os
import time
import logging
import RPi.GPIO as GPIO

# Add parent directory to path to import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from button_handler import ButtonHandler, ButtonPatternDetector
from led_controller import LEDController, LEDPattern


class TestButtonCallbacks:
    """Test callbacks for button events with LED feedback"""
    
    def __init__(self, led_controller: LEDController):
        self.led_controller = led_controller
        self.press_count = 0
        self.total_presses = 0
        
    async def on_press(self):
        """Immediate button press feedback"""
        print(f"[{time.strftime('%H:%M:%S')}] Button PRESSED")
        # Quick white flash
        await self.led_controller.flash_color(255, 255, 255, duration=0.05, count=1)
        
    async def on_release(self, duration: float):
        """Button release with duration"""
        print(f"[{time.strftime('%H:%M:%S')}] Button RELEASED (held for {duration:.2f}s)")
        
    async def on_single_press(self):
        """Single press detected"""
        self.press_count += 1
        self.total_presses += 1
        print(f"\n>>> SINGLE PRESS detected! (Press #{self.press_count})")
        await self.led_controller.set_pattern(LEDPattern.LISTENING)
        await asyncio.sleep(2)
        await self.led_controller.set_pattern(LEDPattern.IDLE)
        
    async def on_double_press(self):
        """Double press detected"""
        self.total_presses += 2
        print(f"\n>>> DOUBLE PRESS detected!")
        await self.led_controller.set_pattern(LEDPattern.CELEBRATION)
        await asyncio.sleep(3)
        await self.led_controller.set_pattern(LEDPattern.IDLE)
        
    async def on_triple_press(self):
        """Triple press detected"""
        self.total_presses += 3
        print(f"\n>>> TRIPLE PRESS detected! (Entering safe mode)")
        await self.led_controller.set_pattern(LEDPattern.SAFE_MODE)
        await asyncio.sleep(5)
        await self.led_controller.set_pattern(LEDPattern.IDLE)
        
    async def on_long_press(self):
        """Long press detected"""
        self.total_presses += 1
        print(f"\n>>> LONG PRESS detected! (Configuration mode)")
        await self.led_controller.set_pattern(LEDPattern.LOADING_TOY)
        await asyncio.sleep(5)
        await self.led_controller.set_pattern(LEDPattern.IDLE)


async def test_button_patterns(button_handler: ButtonHandler, led_controller: LEDController):
    """Test advanced button patterns"""
    print("\n\nAdvanced Pattern Detection Test")
    print("===============================")
    print("Try these patterns:")
    print("  - 'SSL' = Single, Single, Long -> Factory Reset")
    print("  - 'DDL' = Double, Double, Long -> Developer Mode")
    print("  - 'TTT' = Triple, Triple, Triple -> Emergency Shutdown")
    
    pattern_detector = ButtonPatternDetector(button_handler)
    
    # Register custom patterns
    async def factory_reset():
        print("\n!!! FACTORY RESET PATTERN DETECTED !!!")
        await led_controller.set_pattern(LEDPattern.ERROR)
        await asyncio.sleep(3)
        await led_controller.set_pattern(LEDPattern.IDLE)
    
    async def developer_mode():
        print("\n!!! DEVELOPER MODE PATTERN DETECTED !!!")
        await led_controller.set_pattern(LEDPattern.THINKING)
        await asyncio.sleep(3)
        await led_controller.set_pattern(LEDPattern.IDLE)
    
    async def emergency_shutdown():
        print("\n!!! EMERGENCY SHUTDOWN PATTERN DETECTED !!!")
        for _ in range(5):
            await led_controller.flash_color(255, 0, 0, duration=0.2, count=1)
            await asyncio.sleep(0.2)
        await led_controller.set_pattern(LEDPattern.IDLE)
    
    pattern_detector.register_pattern("SSL", factory_reset)
    pattern_detector.register_pattern("DDL", developer_mode)
    pattern_detector.register_pattern("TTT", emergency_shutdown)
    
    print("\nPattern detection ready. Try the patterns above...")
    
    # Wait for pattern testing
    await asyncio.sleep(30)


async def main():
    """Main test function"""
    logging.basicConfig(level=logging.INFO)
    
    # GPIO setup
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    
    # Button pin
    BUTTON_PIN = 17
    
    # LED pins
    led_pins = {
        'red': 5,
        'green': 6,
        'blue': 13
    }
    
    # Setup PWM for LEDs
    pwm_controllers = {}
    for color, pin in led_pins.items():
        GPIO.setup(pin, GPIO.OUT)
        pwm = GPIO.PWM(pin, 1000)
        pwm.start(0)
        pwm_controllers[color] = pwm
    
    # Create controllers
    led_controller = LEDController(pwm_controllers)
    button_handler = ButtonHandler(BUTTON_PIN)
    
    # Create test callbacks
    callbacks = TestButtonCallbacks(led_controller)
    
    # Set callbacks
    button_handler.set_callbacks(
        on_press=callbacks.on_press,
        on_release=callbacks.on_release,
        on_single_press=callbacks.on_single_press,
        on_double_press=callbacks.on_double_press,
        on_triple_press=callbacks.on_triple_press,
        on_long_press=callbacks.on_long_press
    )
    
    try:
        print("\nPommai Button Test")
        print("==================")
        print("\nButton is on GPIO 17")
        print("\nTest the following:")
        print("  - Single press: Quick press and release")
        print("  - Double press: Two quick presses")
        print("  - Triple press: Three quick presses (enters safe mode)")
        print("  - Long press: Hold for 3+ seconds (configuration mode)")
        print("\nPress Ctrl+C to exit\n")
        
        # Set idle pattern
        await led_controller.set_pattern(LEDPattern.IDLE)
        
        # Basic test for 60 seconds
        print("Basic button test (60 seconds)...")
        await asyncio.sleep(60)
        
        # Test patterns if desired
        print("\nWould you like to test advanced patterns? (y/n)")
        # In a real test, you'd wait for input, but for now we'll skip
        # await test_button_patterns(button_handler, led_controller)
        
        print(f"\n\nTest Summary:")
        print(f"Total button presses: {callbacks.total_presses}")
        print(f"Single presses: {callbacks.press_count}")
        
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n\nError during test: {e}")
        logging.exception("Test error")
    finally:
        # Cleanup
        await led_controller.set_pattern(None)
        button_handler.cleanup()
        for pwm in pwm_controllers.values():
            pwm.stop()
        GPIO.cleanup()
        print("GPIO cleanup complete")


if __name__ == "__main__":
    print("Pommai Button Handler Test")
    print("==========================\n")
    
    asyncio.run(main())
