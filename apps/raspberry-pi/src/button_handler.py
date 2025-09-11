#!/usr/bin/env python3
"""
Button Handler for Pommai Raspberry Pi Client
- Proper GPIO setup (BCM mode + pull-up)
- Debounce, multi-press (single/double/triple), and long-press detection
- Thread-safe handoff from RPi.GPIO callback thread to asyncio event loop
"""

import asyncio
import time
import logging
from typing import Optional, Callable

try:
    import RPi.GPIO as GPIO
except Exception:
    # Minimal stub for non-Pi environments (unit tests, linting)
    class _GPIOStub:
        BCM = 'BCM'
        OUT = 'OUT'
        IN = 'IN'
        LOW = 0
        HIGH = 1
        BOTH = 'BOTH'
        PUD_UP = 'PUD_UP'
        def setmode(self, *args, **kwargs): pass
        def setwarnings(self, *args, **kwargs): pass
        def setup(self, *args, **kwargs): pass
        def add_event_detect(self, *args, **kwargs): pass
        def remove_event_detect(self, *args, **kwargs): pass
        def input(self, *args, **kwargs): return self.HIGH
        def cleanup(self, *args, **kwargs): pass
    GPIO = _GPIOStub()

LOGGER = logging.getLogger(__name__)

# Default BCM pin for button (matches your gpio-control.md)
DEFAULT_BUTTON_PIN = 17  # BCM 17


class ButtonHandler:
    """Advanced button handler with multiple interaction patterns."""

    def __init__(
        self,
        button_pin: int = DEFAULT_BUTTON_PIN,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        debounce_time: float = 0.05,         # 50 ms
        long_press_threshold: float = 3.0,   # 3 seconds
        multi_press_window: float = 0.5      # 500 ms
    ):
        self.button_pin = int(button_pin)
        self.loop = loop or asyncio.get_event_loop()

        # State
        self.is_pressed = False
        self.press_start_time: Optional[float] = None
        self.last_edge_time = 0.0
        self.press_count = 0
        self.long_press_triggered = False

        # Timers (asyncio tasks)
        self._long_press_task: Optional[asyncio.Task] = None
        self._multi_press_task: Optional[asyncio.Task] = None
        self._poll_task: Optional[asyncio.Task] = None

        # Config
        self.debounce_time = float(debounce_time)
        self.long_press_threshold = float(long_press_threshold)
        self.multi_press_window = float(multi_press_window)

        # Callbacks (may be sync or async)
        self.on_press_callback: Optional[Callable] = None
        self.on_release_callback: Optional[Callable] = None
        self.on_single_press_callback: Optional[Callable] = None
        self.on_double_press_callback: Optional[Callable] = None
        self.on_triple_press_callback: Optional[Callable] = None
        self.on_long_press_callback: Optional[Callable] = None

        # GPIO setup: BCM mode, input with pull-up, then edge detect
        try:
            # Check if GPIO mode is already set
            current_mode = GPIO.getmode()
            if current_mode is None:
                GPIO.setmode(GPIO.BCM)
            elif current_mode != GPIO.BCM:
                LOGGER.warning("GPIO mode already set to %s, expected BCM", current_mode)
            
            GPIO.setwarnings(False)
            
            # Setup the button pin as input with pull-up
            GPIO.setup(self.button_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
            LOGGER.debug("GPIO %d setup as input with pull-up", self.button_pin)
        except Exception as e:
            LOGGER.error("GPIO setup failed: %s", e)
            # Try to continue anyway in case it's already setup
            pass

        # Clear any stale detect before adding
        try:
            GPIO.remove_event_detect(self.button_pin)
        except Exception:
            pass

        try:
            GPIO.add_event_detect(
                self.button_pin,
                GPIO.BOTH,
                callback=self._gpio_callback,  # called in GPIO's own thread
                bouncetime=int(self.debounce_time * 1000)
            )
            LOGGER.info("Button handler initialized on GPIO %d (edge detect)", self.button_pin)
        except Exception as e:
            LOGGER.error("GPIO add_event_detect failed (using polling fallback): %s", e)
            # Start polling fallback
            self._poll_task = self.loop.create_task(self._poll_button_fallback())
            LOGGER.info("Button handler initialized on GPIO %d (polling fallback)", self.button_pin)

    def set_callbacks(
        self,
        on_press: Optional[Callable] = None,
        on_release: Optional[Callable] = None,
        on_single_press: Optional[Callable] = None,
        on_double_press: Optional[Callable] = None,
        on_triple_press: Optional[Callable] = None,
        on_long_press: Optional[Callable] = None,
    ):
        """Set callback functions for different button events (sync or async)."""
        self.on_press_callback = on_press
        self.on_release_callback = on_release
        self.on_single_press_callback = on_single_press
        self.on_double_press_callback = on_double_press
        self.on_triple_press_callback = on_triple_press
        self.on_long_press_callback = on_long_press

    # -------- GPIO callback (runs in RPi.GPIO thread) --------

    def _gpio_callback(self, channel):
        """Threaded GPIO interrupt callback; hand off to asyncio loop."""
        now = time.monotonic()

        # Software debounce
        if now - self.last_edge_time < self.debounce_time:
            return
        self.last_edge_time = now

        try:
            # With pull-up, LOW means pressed
            pressed = (GPIO.input(channel) == GPIO.LOW)
        except Exception:
            pressed = False

        # Hand off to main asyncio loop thread-safely
        self.loop.call_soon_threadsafe(self._schedule_edge, pressed, now)

    def _schedule_edge(self, pressed: bool, timestamp: float):
        """Runs in asyncio loop thread; schedules press/release handlers."""
        if pressed and not self.is_pressed:
            self.loop.create_task(self._handle_press(timestamp))
        elif not pressed and self.is_pressed:
            self.loop.create_task(self._handle_release(timestamp))

    # -------- Async handlers (run in asyncio loop) --------

    async def _handle_press(self, timestamp: float):
        self.is_pressed = True
        self.press_start_time = timestamp
        self.long_press_triggered = False
        LOGGER.debug("Button pressed")

        # Immediate callback
        if self.on_press_callback:
            await self._safe_callback(self.on_press_callback)

        # Start long-press timer
        self._cancel_task(self._long_press_task)
        self._long_press_task = self.loop.create_task(self._long_press_detector())

        # Count for multi-press
        self.press_count += 1

        # (Re)start multi-press window timer
        self._cancel_task(self._multi_press_task)
        self._multi_press_task = self.loop.create_task(self._multi_press_timeout())

    async def _handle_release(self, timestamp: float):
        self.is_pressed = False
        LOGGER.debug("Button released")

        # Stop long-press detector if still running
        self._cancel_task(self._long_press_task)

        # Compute press duration
        duration = 0.0
        if self.press_start_time is not None:
            duration = max(0.0, timestamp - self.press_start_time)

        # ALWAYS fire release callback to stop recording even after a long-press
        if self.on_release_callback:
            await self._safe_callback(self.on_release_callback, duration)

    async def _long_press_detector(self):
        try:
            await asyncio.sleep(self.long_press_threshold)
            if self.is_pressed:
                self.long_press_triggered = True
                # Reset multi-press counting if long-press fires
                self.press_count = 0
                self._cancel_task(self._multi_press_task)

                LOGGER.info("Long press detected")
                if self.on_long_press_callback:
                    await self._safe_callback(self.on_long_press_callback)
        except asyncio.CancelledError:
            pass

    async def _multi_press_timeout(self):
        try:
            await asyncio.sleep(self.multi_press_window)
            # Window ended; interpret presses
            count = self.press_count
            self.press_count = 0

            if count == 1:
                LOGGER.info("Single press detected")
                if self.on_single_press_callback:
                    await self._safe_callback(self.on_single_press_callback)
            elif count == 2:
                LOGGER.info("Double press detected")
                if self.on_double_press_callback:
                    await self._safe_callback(self.on_double_press_callback)
            elif count >= 3:
                LOGGER.info("Triple press detected (%d)", count)
                if self.on_triple_press_callback:
                    await self._safe_callback(self.on_triple_press_callback)
        except asyncio.CancelledError:
            pass

    # -------- Utils --------

    async def _poll_button_fallback(self, interval: float = 0.01):
        """Polling fallback to synthesize edges when kernel edge detect is unavailable."""
        last = None
        while True:
            try:
                pressed = (GPIO.input(self.button_pin) == GPIO.LOW)
            except Exception:
                await asyncio.sleep(0.1)
                continue
            now = time.monotonic()
            if last is None:
                last = pressed
            elif pressed != last:
                if now - self.last_edge_time >= self.debounce_time:
                    self.last_edge_time = now
                    self._schedule_edge(pressed, now)
                last = pressed
            await asyncio.sleep(interval)

    def _cancel_task(self, task: Optional[asyncio.Task]):
        if task and not task.done():
            task.cancel()

    async def _safe_callback(self, callback: Callable, *args):
        try:
            if asyncio.iscoroutinefunction(callback):
                await callback(*args)
            else:
                try:
                    callback(*args)
                except TypeError:
                    # Fallback: some callbacks may not accept duration param
                    callback()
        except Exception as e:
            LOGGER.error("Button callback error: %s", e)

    def cleanup(self):
        """Cleanup GPIO resources and cancel timers."""
        try:
            GPIO.remove_event_detect(self.button_pin)
        except Exception:
            pass
        self._cancel_task(self._long_press_task)
        self._cancel_task(self._multi_press_task)
        self._cancel_task(self._poll_task)


class ButtonPatternDetector:
    """Optional: detect press-sequence patterns (e.g., 'SSL', 'DL', etc.)."""

    def __init__(self, button_handler: ButtonHandler):
        self.button_handler = button_handler
        self.sequence = []
        self.sequence_timeout = 2.0  # seconds
        self._sequence_task: Optional[asyncio.Task] = None
        self.patterns: dict[str, Callable] = {}

        # Wrap existing callbacks to collect sequence
        orig_single = button_handler.on_single_press_callback
        orig_double = button_handler.on_double_press_callback
        orig_triple = button_handler.on_triple_press_callback
        orig_long = button_handler.on_long_press_callback

        async def single_wrapper():
            self._add('S')
            if orig_single:
                await self._maybe_await(orig_single)

        async def double_wrapper():
            self._add('D')
            if orig_double:
                await self._maybe_await(orig_double)

        async def triple_wrapper():
            self._add('T')
            if orig_triple:
                await self._maybe_await(orig_triple)

        async def long_wrapper():
            self._add('L')
            if orig_long:
                await self._maybe_await(orig_long)

        button_handler.on_single_press_callback = single_wrapper
        button_handler.on_double_press_callback = double_wrapper
        button_handler.on_triple_press_callback = triple_wrapper
        button_handler.on_long_press_callback = long_wrapper

    def register_pattern(self, pattern: str, callback: Callable):
        """
        Pattern symbols:
        - S: Single press
        - D: Double press
        - T: Triple press
        - L: Long press
        Example: "SSL" = Single, Single, Long
        """
        self.patterns[pattern] = callback
        LOGGER.info("Registered button pattern: %s", pattern)

    def _add(self, sym: str):
        self.sequence.append(sym)
        # Restart timeout
        if self._sequence_task and not self._sequence_task.done():
            self._sequence_task.cancel()
        self._sequence_task = asyncio.create_task(self._sequence_timeout())

        current = ''.join(self.sequence)
        for pattern, cb in self.patterns.items():
            if current.endswith(pattern):
                LOGGER.info("Pattern detected: %s", pattern)
                asyncio.create_task(self._maybe_await(cb))
                self.sequence.clear()
                if self._sequence_task and not self._sequence_task.done():
                    self._sequence_task.cancel()
                break

    async def _sequence_timeout(self):
        try:
            await asyncio.sleep(self.sequence_timeout)
            self.sequence.clear()
        except asyncio.CancelledError:
            pass

    async def _maybe_await(self, cb: Callable):
        try:
            if asyncio.iscoroutinefunction(cb):
                await cb()
            else:
                cb()
        except Exception as e:
            LOGGER.error("Pattern callback error: %s", e)
