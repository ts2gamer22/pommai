#!/usr/bin/env python3
"""
LED Controller for Pommai Raspberry Pi Client
Manages all LED patterns and visual feedback for the ReSpeaker 2-Mics HAT
"""

import asyncio
import math
import time
import logging
from enum import Enum
from typing import Optional, Dict, Tuple
import RPi.GPIO as GPIO


class LEDPattern(Enum):
    """Predefined LED patterns for different states"""
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    ERROR = "error"
    CONNECTION_LOST = "connection_lost"
    LOADING_TOY = "loading_toy"
    SWITCHING_TOY = "switching_toy"
    GUARDIAN_ALERT = "guardian_alert"
    SAFE_MODE = "safe_mode"
    LOW_BATTERY = "low_battery"
    CELEBRATION = "celebration"
    THINKING = "thinking"
    OFFLINE = "offline"


class ColorMixer:
    """Helper class for RGB color mixing and conversions"""
    
    @staticmethod
    def rgb_to_duty_cycle(r: int, g: int, b: int) -> Dict[str, int]:
        """Convert RGB (0-255) to duty cycle (0-100)"""
        return {
            'red': int(r * 100 / 255),
            'green': int(g * 100 / 255),
            'blue': int(b * 100 / 255)
        }
    
    @staticmethod
    def hsv_to_rgb(h: float, s: float, v: float) -> Tuple[int, int, int]:
        """Convert HSV to RGB for smooth color transitions"""
        import colorsys
        r, g, b = colorsys.hsv_to_rgb(h, s, v)
        return int(r * 255), int(g * 255), int(b * 255)
    
    @staticmethod
    def interpolate_color(start: Tuple[int, int, int], end: Tuple[int, int, int], progress: float) -> Tuple[int, int, int]:
        """Linear interpolation between two colors"""
        r = int(start[0] + (end[0] - start[0]) * progress)
        g = int(start[1] + (end[1] - start[1]) * progress)
        b = int(start[2] + (end[2] - start[2]) * progress)
        return r, g, b


class LEDController:
    """Main LED controller with async pattern support"""
    
    def __init__(self, pwm_controllers: Dict[str, GPIO.PWM]):
        self.pwm_controllers = pwm_controllers
        self.current_pattern = None
        self.pattern_task: Optional[asyncio.Task] = None
        self.brightness_scale = 1.0  # Global brightness control
        self.low_power_mode = False
        
    async def set_pattern(self, pattern: LEDPattern, **kwargs):
        """Set LED pattern with smooth transitions"""
        # Cancel current pattern if running
        if self.pattern_task and not self.pattern_task.done():
            self.pattern_task.cancel()
            try:
                await self.pattern_task
            except asyncio.CancelledError:
                pass
        
        # Clear LEDs briefly for transition
        await self._all_leds_off()
        await asyncio.sleep(0.05)
        
        self.current_pattern = pattern
        
        # Map patterns to methods
        pattern_methods = {
            LEDPattern.IDLE: self._pattern_idle_breathing,
            LEDPattern.LISTENING: self._pattern_listening_pulse,
            LEDPattern.PROCESSING: self._pattern_processing_swirl,
            LEDPattern.SPEAKING: self._pattern_speaking_solid,
            LEDPattern.ERROR: self._pattern_error_flash,
            LEDPattern.CONNECTION_LOST: self._pattern_connection_lost,
            LEDPattern.LOADING_TOY: self._pattern_loading_toy,
            LEDPattern.SWITCHING_TOY: self._pattern_switching_toy,
            LEDPattern.GUARDIAN_ALERT: self._pattern_guardian_alert,
            LEDPattern.SAFE_MODE: self._pattern_safe_mode,
            LEDPattern.LOW_BATTERY: self._pattern_low_battery,
            LEDPattern.CELEBRATION: self._pattern_celebration,
            LEDPattern.THINKING: self._pattern_thinking,
            LEDPattern.OFFLINE: self._pattern_offline,
        }
        
        method = pattern_methods.get(pattern)
        if method:
            self.pattern_task = asyncio.create_task(method(**kwargs))
        else:
            logging.warning(f"Unknown LED pattern: {pattern}")
    
    def set_brightness(self, scale: float):
        """Adjust overall LED brightness (0.0 to 1.0)"""
        self.brightness_scale = max(0.0, min(1.0, scale))
    
    def enable_low_power_mode(self):
        """Reduce LED brightness to save battery"""
        self.low_power_mode = True
        self.brightness_scale = 0.3
    
    def disable_low_power_mode(self):
        """Restore normal LED brightness"""
        self.low_power_mode = False
        self.brightness_scale = 1.0
    
    def _apply_brightness(self, duty_cycle: int) -> int:
        """Apply brightness scaling to duty cycle"""
        scaled = duty_cycle * self.brightness_scale
        if self.low_power_mode:
            scaled = min(scaled, 30)  # Cap at 30% in low power
        return int(scaled)
    
    async def _set_color(self, r: int, g: int, b: int):
        """Set LED color with brightness adjustment"""
        duty_cycles = ColorMixer.rgb_to_duty_cycle(r, g, b)
        for color, duty in duty_cycles.items():
            adjusted_duty = self._apply_brightness(duty)
            self.pwm_controllers[color].ChangeDutyCycle(adjusted_duty)
    
    async def _all_leds_off(self):
        """Turn off all LEDs"""
        for pwm in self.pwm_controllers.values():
            pwm.ChangeDutyCycle(0)
    
    # Pattern Implementations
    
    async def _pattern_idle_breathing(self):
        """Gentle breathing effect in blue"""
        try:
            while True:
                # Breathe in
                for brightness in range(0, 30, 2):
                    await self._set_color(0, 0, int(brightness * 255 / 100))
                    await asyncio.sleep(0.05)
                
                # Hold
                await asyncio.sleep(0.2)
                
                # Breathe out
                for brightness in range(30, 0, -2):
                    await self._set_color(0, 0, int(brightness * 255 / 100))
                    await asyncio.sleep(0.05)
                
                # Pause
                await asyncio.sleep(0.5)
                
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_listening_pulse(self):
        """Fast pulsing blue to indicate recording"""
        try:
            while True:
                # Double pulse
                for _ in range(2):
                    await self._set_color(0, 0, 255)
                    await asyncio.sleep(0.1)
                    await self._set_color(0, 0, 51)  # 20% blue
                    await asyncio.sleep(0.1)
                
                # Pause between pulse sets
                await asyncio.sleep(0.3)
                
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_processing_swirl(self):
        """Rainbow swirl effect while thinking"""
        try:
            phase = 0
            while True:
                # Calculate RGB values using sine waves
                red = int(127 * (1 + math.sin(phase)))
                green = int(127 * (1 + math.sin(phase + 2.094)))  # 120 degrees
                blue = int(127 * (1 + math.sin(phase + 4.189)))   # 240 degrees
                
                await self._set_color(red, green, blue)
                
                # Advance phase
                phase += 0.1
                await asyncio.sleep(0.05)
                
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_speaking_solid(self):
        """Solid green while speaking"""
        try:
            await self._set_color(0, 204, 0)  # Nice green
            
            # Keep solid until cancelled
            while True:
                await asyncio.sleep(1)
                
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_error_flash(self):
        """Fast red flashing for errors"""
        try:
            while True:
                await self._set_color(255, 0, 0)
                await asyncio.sleep(0.1)
                await self._set_color(0, 0, 0)
                await asyncio.sleep(0.1)
                
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_connection_lost(self):
        """Slow amber pulse for connection issues"""
        try:
            while True:
                # Pulse up
                for brightness in range(0, 80, 5):
                    r = int(brightness * 255 / 100)
                    g = int(brightness * 128 / 100)  # Half green for amber
                    await self._set_color(r, g, 0)
                    await asyncio.sleep(0.03)
                
                # Pulse down
                for brightness in range(80, 0, -5):
                    r = int(brightness * 255 / 100)
                    g = int(brightness * 128 / 100)
                    await self._set_color(r, g, 0)
                    await asyncio.sleep(0.03)
                
                await asyncio.sleep(0.5)
                
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_loading_toy(self):
        """Spinning white effect for loading"""
        try:
            colors = [(255, 255, 255), (128, 128, 128), (64, 64, 64)]
            color_index = 0
            
            while True:
                await self._set_color(*colors[color_index])
                color_index = (color_index + 1) % len(colors)
                await asyncio.sleep(0.2)
                
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_switching_toy(self):
        """Color transition effect for toy switching"""
        try:
            # Transition through toy personality colors
            colors = [
                (255, 0, 0),    # Red
                (255, 165, 0),  # Orange
                (255, 255, 0),  # Yellow
                (0, 255, 0),    # Green
                (0, 255, 255),  # Cyan
                (0, 0, 255),    # Blue
                (128, 0, 128),  # Purple
            ]
            
            while True:
                for i in range(len(colors)):
                    start_color = colors[i]
                    end_color = colors[(i + 1) % len(colors)]
                    
                    # Smooth transition
                    for step in range(20):
                        progress = step / 20
                        color = ColorMixer.interpolate_color(start_color, end_color, progress)
                        await self._set_color(*color)
                        await asyncio.sleep(0.05)
                        
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_guardian_alert(self):
        """Amber pulse for guardian mode alerts"""
        try:
            while True:
                # Quick double pulse
                for _ in range(2):
                    await self._set_color(255, 128, 0)  # Amber
                    await asyncio.sleep(0.15)
                    await self._set_color(0, 0, 0)
                    await asyncio.sleep(0.1)
                
                await asyncio.sleep(0.7)
                
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_safe_mode(self):
        """Slow green breathing for safe mode"""
        try:
            while True:
                # Breathe in
                for brightness in range(10, 50, 3):
                    await self._set_color(0, int(brightness * 255 / 100), 0)
                    await asyncio.sleep(0.08)
                
                # Breathe out
                for brightness in range(50, 10, -3):
                    await self._set_color(0, int(brightness * 255 / 100), 0)
                    await asyncio.sleep(0.08)
                
                await asyncio.sleep(0.3)
                
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_low_battery(self):
        """Red pulse for low battery warning"""
        try:
            while True:
                # Single slow pulse
                await self._set_color(255, 0, 0)
                await asyncio.sleep(0.5)
                await self._set_color(0, 0, 0)
                await asyncio.sleep(2.0)  # Long pause between pulses
                
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_celebration(self):
        """Fun rainbow celebration effect"""
        try:
            while True:
                # Fast rainbow cycle
                for hue in range(0, 360, 10):
                    r, g, b = ColorMixer.hsv_to_rgb(hue / 360, 1.0, 1.0)
                    await self._set_color(r, g, b)
                    await asyncio.sleep(0.03)
                    
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_thinking(self):
        """Gentle purple swirl for thinking"""
        try:
            phase = 0
            while True:
                # Purple variations
                brightness = 50 + 30 * math.sin(phase)
                await self._set_color(int(brightness), 0, int(brightness * 1.5))
                phase += 0.05
                await asyncio.sleep(0.05)
                
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    async def _pattern_offline(self):
        """Dim white pulse for offline mode"""
        try:
            while True:
                # Very dim white pulse
                for brightness in range(0, 20, 2):
                    await self._set_color(brightness, brightness, brightness)
                    await asyncio.sleep(0.1)
                
                for brightness in range(20, 0, -2):
                    await self._set_color(brightness, brightness, brightness)
                    await asyncio.sleep(0.1)
                
                await asyncio.sleep(1.0)
                
        except asyncio.CancelledError:
            await self._all_leds_off()
            raise
    
    # Special Effects
    
    async def flash_color(self, r: int, g: int, b: int, duration: float = 0.1, count: int = 1):
        """Flash a specific color"""
        for _ in range(count):
            await self._set_color(r, g, b)
            await asyncio.sleep(duration)
            await self._all_leds_off()
            await asyncio.sleep(duration)
    
    async def fade_to_color(self, r: int, g: int, b: int, duration: float = 1.0):
        """Fade from current color to target color"""
        steps = 50
        step_duration = duration / steps
        
        # This is simplified - in production, track current color
        for step in range(steps):
            progress = step / steps
            brightness = int(progress * 100)
            await self._set_color(
                int(r * progress),
                int(g * progress),
                int(b * progress)
            )
            await asyncio.sleep(step_duration)
