#!/usr/bin/env python3
"""
Button Handler for Pommai Raspberry Pi Client
Manages button input with debouncing, multi-press, and long-press detection
"""

import asyncio
import time
import logging
from typing import Optional, Callable
import RPi.GPIO as GPIO


class ButtonHandler:
    """Advanced button handler with multiple interaction patterns"""
    
    def __init__(self, button_pin: int):
        self.button_pin = button_pin
        self.is_pressed = False
        self.press_start_time = None
        
        # Debouncing parameters
        self.debounce_time = 0.05  # 50ms debounce
        self.last_event_time = 0
        
        # Long press detection
        self.long_press_threshold = 3.0  # 3 seconds for long press
        self.long_press_timer = None
        self.long_press_triggered = False
        
        # Multi-press detection
        self.multi_press_window = 0.5  # 500ms window for multi-press
        self.press_count = 0
        self.multi_press_timer = None
        
        # Callbacks
        self.on_press_callback = None
        self.on_release_callback = None
        self.on_single_press_callback = None
        self.on_double_press_callback = None
        self.on_triple_press_callback = None
        self.on_long_press_callback = None
        
        # Setup GPIO interrupt
        GPIO.add_event_detect(
            self.button_pin,
            GPIO.BOTH,
            callback=self._gpio_callback,
            bouncetime=50  # Hardware debounce
        )
        
        logging.info(f"Button handler initialized on GPIO {button_pin}")
    
    def set_callbacks(self,
                      on_press: Optional[Callable] = None,
                      on_release: Optional[Callable] = None,
                      on_single_press: Optional[Callable] = None,
                      on_double_press: Optional[Callable] = None,
                      on_triple_press: Optional[Callable] = None,
                      on_long_press: Optional[Callable] = None):
        """Set callback functions for different button events"""
        self.on_press_callback = on_press
        self.on_release_callback = on_release
        self.on_single_press_callback = on_single_press
        self.on_double_press_callback = on_double_press
        self.on_triple_press_callback = on_triple_press
        self.on_long_press_callback = on_long_press
    
    def _gpio_callback(self, channel):
        """GPIO interrupt callback"""
        current_time = time.time()
        
        # Software debounce check
        if current_time - self.last_event_time < self.debounce_time:
            return
        
        self.last_event_time = current_time
        
        # Read button state (LOW = pressed due to pull-up)
        button_pressed = GPIO.input(channel) == GPIO.LOW
        
        if button_pressed and not self.is_pressed:
            # Button pressed
            asyncio.create_task(self._handle_press(current_time))
        elif not button_pressed and self.is_pressed:
            # Button released
            asyncio.create_task(self._handle_release(current_time))
    
    async def _handle_press(self, timestamp: float):
        """Handle button press event"""
        self.is_pressed = True
        self.press_start_time = timestamp
        self.long_press_triggered = False
        
        logging.debug("Button pressed")
        
        # Call immediate press callback
        if self.on_press_callback:
            await self._safe_callback(self.on_press_callback)
        
        # Start long press detection
        self.long_press_timer = asyncio.create_task(self._long_press_detector())
        
        # Handle multi-press counting
        self.press_count += 1
        
        # Cancel existing multi-press timer
        if self.multi_press_timer:
            self.multi_press_timer.cancel()
        
        # Start new multi-press timer
        self.multi_press_timer = asyncio.create_task(self._multi_press_timeout())
    
    async def _handle_release(self, timestamp: float):
        """Handle button release event"""
        self.is_pressed = False
        
        # Cancel long press detection if still running
        if self.long_press_timer and not self.long_press_timer.done():
            self.long_press_timer.cancel()
        
        # Calculate press duration
        duration = 0
        if self.press_start_time:
            duration = timestamp - self.press_start_time
        
        logging.debug(f"Button released after {duration:.2f}s")
        
        # Call release callback with duration
        if self.on_release_callback and not self.long_press_triggered:
            await self._safe_callback(self.on_release_callback, duration)
    
    async def _long_press_detector(self):
        """Detect long press after threshold"""
        try:
            await asyncio.sleep(self.long_press_threshold)
            
            # If still pressed after threshold, trigger long press
            if self.is_pressed:
                self.long_press_triggered = True
                self.press_count = 0  # Reset multi-press counter
                
                logging.info("Long press detected")
                
                if self.on_long_press_callback:
                    await self._safe_callback(self.on_long_press_callback)
                
                # Cancel multi-press timer
                if self.multi_press_timer:
                    self.multi_press_timer.cancel()
                    
        except asyncio.CancelledError:
            pass
    
    async def _multi_press_timeout(self):
        """Handle multi-press detection after timeout"""
        try:
            await asyncio.sleep(self.multi_press_window)
            
            # Process accumulated presses
            if self.press_count == 1:
                logging.info("Single press detected")
                if self.on_single_press_callback:
                    await self._safe_callback(self.on_single_press_callback)
                    
            elif self.press_count == 2:
                logging.info("Double press detected")
                if self.on_double_press_callback:
                    await self._safe_callback(self.on_double_press_callback)
                    
            elif self.press_count >= 3:
                logging.info(f"Triple press detected ({self.press_count} presses)")
                if self.on_triple_press_callback:
                    await self._safe_callback(self.on_triple_press_callback)
            
            # Reset counter
            self.press_count = 0
            
        except asyncio.CancelledError:
            pass
    
    async def _safe_callback(self, callback: Callable, *args):
        """Safely execute callback function"""
        try:
            if asyncio.iscoroutinefunction(callback):
                await callback(*args)
            else:
                callback(*args)
        except Exception as e:
            logging.error(f"Button callback error: {e}")
    
    def cleanup(self):
        """Cleanup GPIO resources"""
        GPIO.remove_event_detect(self.button_pin)
        
        # Cancel any pending timers
        if self.long_press_timer:
            self.long_press_timer.cancel()
        if self.multi_press_timer:
            self.multi_press_timer.cancel()


class ButtonPatternDetector:
    """Advanced pattern detection for button sequences"""
    
    def __init__(self, button_handler: ButtonHandler):
        self.button_handler = button_handler
        self.sequence = []
        self.sequence_timeout = 2.0  # 2 seconds to complete sequence
        self.sequence_timer = None
        self.patterns = {}
        
        # Register our own callbacks
        original_single = button_handler.on_single_press_callback
        original_double = button_handler.on_double_press_callback
        original_triple = button_handler.on_triple_press_callback
        original_long = button_handler.on_long_press_callback
        
        async def single_wrapper():
            self._add_to_sequence('S')
            if original_single:
                await original_single()
        
        async def double_wrapper():
            self._add_to_sequence('D')
            if original_double:
                await original_double()
        
        async def triple_wrapper():
            self._add_to_sequence('T')
            if original_triple:
                await original_triple()
        
        async def long_wrapper():
            self._add_to_sequence('L')
            if original_long:
                await original_long()
        
        button_handler.on_single_press_callback = single_wrapper
        button_handler.on_double_press_callback = double_wrapper
        button_handler.on_triple_press_callback = triple_wrapper
        button_handler.on_long_press_callback = long_wrapper
    
    def register_pattern(self, pattern: str, callback: Callable):
        """Register a button sequence pattern
        
        Pattern format:
        - S: Single press
        - D: Double press
        - T: Triple press
        - L: Long press
        
        Example: "SSL" = Single, Single, Long
        """
        self.patterns[pattern] = callback
        logging.info(f"Registered button pattern: {pattern}")
    
    def _add_to_sequence(self, press_type: str):
        """Add press to sequence and check for patterns"""
        self.sequence.append(press_type)
        
        # Reset sequence timer
        if self.sequence_timer:
            self.sequence_timer.cancel()
        
        self.sequence_timer = asyncio.create_task(self._sequence_timeout())
        
        # Check if current sequence matches any pattern
        current_sequence = ''.join(self.sequence)
        
        for pattern, callback in self.patterns.items():
            if current_sequence.endswith(pattern):
                logging.info(f"Pattern detected: {pattern}")
                asyncio.create_task(self._safe_callback(callback))
                self.sequence = []  # Reset sequence
                if self.sequence_timer:
                    self.sequence_timer.cancel()
                break
    
    async def _sequence_timeout(self):
        """Clear sequence after timeout"""
        try:
            await asyncio.sleep(self.sequence_timeout)
            self.sequence = []
        except asyncio.CancelledError:
            pass
    
    async def _safe_callback(self, callback: Callable):
        """Safely execute callback function"""
        try:
            if asyncio.iscoroutinefunction(callback):
                await callback()
            else:
                callback()
        except Exception as e:
            logging.error(f"Pattern callback error: {e}")
