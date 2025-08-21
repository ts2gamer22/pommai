# GPIO Control Documentation for ReSpeaker 2-Mics HAT

## Overview
This document details GPIO control for the ReSpeaker 2-Mics Pi HAT, including LED patterns, button handling, and hardware integration for visual feedback and user interaction.

## GPIO Pin Reference

### ReSpeaker 2-Mics HAT GPIO Mapping
```python
# GPIO Pin Definitions (BCM numbering)
GPIO_PINS = {
    # User Interface
    'BUTTON': 17,           # User button (push-to-talk)
    
    # RGB LEDs
    'LED_RED': 5,           # Red LED channel
    'LED_GREEN': 6,         # Green LED channel
    'LED_BLUE': 13,         # Blue LED channel
    
    # Audio Interface (I2S)
    'I2S_BCLK': 18,        # Bit clock
    'I2S_LRCLK': 19,       # Left/Right clock
    'I2S_DIN': 20,         # Data in (microphones)
    'I2S_DOUT': 21,        # Data out (speaker)
    
    # I2C (Audio Codec Control)
    'I2C_SDA': 2,          # I2C data
    'I2C_SCL': 3,          # I2C clock
}
```

## RPi.GPIO Library Setup

### Basic Initialization
```python
import RPi.GPIO as GPIO
import time
import threading
from enum import Enum

class GPIOController:
    def __init__(self):
        # Use BCM pin numbering
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        
        # Initialize pins
        self._setup_button()
        self._setup_leds()
        
    def _setup_button(self):
        """Configure button input with pull-up resistor"""
        GPIO.setup(GPIO_PINS['BUTTON'], GPIO.IN, pull_up_down=GPIO.PUD_UP)
        
    def _setup_leds(self):
        """Configure LED outputs"""
        self.led_pins = {
            'red': GPIO_PINS['LED_RED'],
            'green': GPIO_PINS['LED_GREEN'],
            'blue': GPIO_PINS['LED_BLUE']
        }
        
        # Set all LEDs as outputs and turn off
        for pin in self.led_pins.values():
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, GPIO.LOW)
        
        # Initialize PWM for smooth effects
        self.pwm_controllers = {}
        for color, pin in self.led_pins.items():
            pwm = GPIO.PWM(pin, 1000)  # 1kHz frequency
            pwm.start(0)  # Start with 0% duty cycle
            self.pwm_controllers[color] = pwm
```

## LED Pattern Implementation

### LED State Patterns
```python
class LEDPattern(Enum):
    """Predefined LED patterns for different states"""
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    ERROR = "error"
    CONNECTION_LOST = "connection_lost"
    LOADING_TOY = "loading_toy"
    GUARDIAN_ALERT = "guardian_alert"
    SAFE_MODE = "safe_mode"
    LOW_BATTERY = "low_battery"

class LEDController:
    def __init__(self, gpio_controller):
        self.gpio = gpio_controller
        self.current_pattern = None
        self.pattern_thread = None
        self.stop_pattern = threading.Event()
        
    def set_pattern(self, pattern: LEDPattern):
        """Change LED pattern"""
        # Stop current pattern
        if self.pattern_thread and self.pattern_thread.is_alive():
            self.stop_pattern.set()
            self.pattern_thread.join()
            
        # Reset stop event
        self.stop_pattern.clear()
        
        # Start new pattern
        self.current_pattern = pattern
        pattern_method = getattr(self, f'_pattern_{pattern.value}', None)
        if pattern_method:
            self.pattern_thread = threading.Thread(target=pattern_method)
            self.pattern_thread.daemon = True
            self.pattern_thread.start()
```

### Pattern Implementations

#### Idle Pattern (Breathing Blue)
```python
def _pattern_idle(self):
    """Gentle breathing effect in blue"""
    while not self.stop_pattern.is_set():
        # Breathe in
        for brightness in range(0, 30, 2):
            if self.stop_pattern.is_set():
                break
            self.gpio.pwm_controllers['blue'].ChangeDutyCycle(brightness)
            time.sleep(0.05)
        
        # Hold
        time.sleep(0.2)
        
        # Breathe out
        for brightness in range(30, 0, -2):
            if self.stop_pattern.is_set():
                break
            self.gpio.pwm_controllers['blue'].ChangeDutyCycle(brightness)
            time.sleep(0.05)
        
        # Pause
        time.sleep(0.5)
    
    # Turn off when done
    self._all_leds_off()
```

#### Listening Pattern (Pulsing Blue)
```python
def _pattern_listening(self):
    """Fast pulsing blue to indicate recording"""
    while not self.stop_pattern.is_set():
        # Double pulse
        for _ in range(2):
            self.gpio.pwm_controllers['blue'].ChangeDutyCycle(100)
            time.sleep(0.1)
            self.gpio.pwm_controllers['blue'].ChangeDutyCycle(20)
            time.sleep(0.1)
        
        # Pause between pulse sets
        time.sleep(0.3)
    
    self._all_leds_off()
```

#### Processing Pattern (Rainbow Swirl)
```python
def _pattern_processing(self):
    """Rainbow swirl effect while thinking"""
    import math
    phase = 0
    
    while not self.stop_pattern.is_set():
        # Calculate RGB values using sine waves
        red = int(50 * (1 + math.sin(phase)) / 2)
        green = int(50 * (1 + math.sin(phase + 2.094)) / 2)  # 120 degrees
        blue = int(50 * (1 + math.sin(phase + 4.189)) / 2)   # 240 degrees
        
        # Apply to LEDs
        self.gpio.pwm_controllers['red'].ChangeDutyCycle(red)
        self.gpio.pwm_controllers['green'].ChangeDutyCycle(green)
        self.gpio.pwm_controllers['blue'].ChangeDutyCycle(blue)
        
        # Advance phase
        phase += 0.1
        time.sleep(0.05)
    
    self._all_leds_off()
```

#### Speaking Pattern (Solid Green)
```python
def _pattern_speaking(self):
    """Solid green while speaking"""
    self.gpio.pwm_controllers['green'].ChangeDutyCycle(80)
    self.gpio.pwm_controllers['red'].ChangeDutyCycle(0)
    self.gpio.pwm_controllers['blue'].ChangeDutyCycle(0)
    
    # Stay solid until pattern changes
    self.stop_pattern.wait()
    self._all_leds_off()
```

#### Error Pattern (Fast Red Flash)
```python
def _pattern_error(self):
    """Fast red flashing for errors"""
    while not self.stop_pattern.is_set():
        self.gpio.pwm_controllers['red'].ChangeDutyCycle(100)
        time.sleep(0.1)
        self.gpio.pwm_controllers['red'].ChangeDutyCycle(0)
        time.sleep(0.1)
    
    self._all_leds_off()
```

#### Guardian Alert Pattern (Amber Pulse)
```python
def _pattern_guardian_alert(self):
    """Amber (red+green) pulse for guardian alerts"""
    while not self.stop_pattern.is_set():
        # Pulse up
        for brightness in range(0, 80, 5):
            if self.stop_pattern.is_set():
                break
            self.gpio.pwm_controllers['red'].ChangeDutyCycle(brightness)
            self.gpio.pwm_controllers['green'].ChangeDutyCycle(brightness // 2)
            time.sleep(0.02)
        
        # Pulse down
        for brightness in range(80, 0, -5):
            if self.stop_pattern.is_set():
                break
            self.gpio.pwm_controllers['red'].ChangeDutyCycle(brightness)
            self.gpio.pwm_controllers['green'].ChangeDutyCycle(brightness // 2)
            time.sleep(0.02)
    
    self._all_leds_off()
```

## Button Handling

### Button Event Detection
```python
class ButtonHandler:
    def __init__(self, gpio_controller, callback_manager):
        self.gpio = gpio_controller
        self.callbacks = callback_manager
        self.button_pin = GPIO_PINS['BUTTON']
        
        # Debouncing parameters
        self.debounce_time = 0.05  # 50ms
        self.last_press_time = 0
        self.press_start_time = None
        self.is_pressed = False
        
        # Long press detection
        self.long_press_threshold = 3.0  # 3 seconds
        self.long_press_timer = None
        
        # Multi-press detection
        self.multi_press_window = 0.5  # 500ms
        self.press_count = 0
        self.multi_press_timer = None
        
        # Setup interrupt
        GPIO.add_event_detect(
            self.button_pin,
            GPIO.BOTH,
            callback=self._button_event,
            bouncetime=50
        )
    
    def _button_event(self, channel):
        """Handle button press/release events"""
        current_time = time.time()
        
        # Debounce check
        if current_time - self.last_press_time < self.debounce_time:
            return
            
        self.last_press_time = current_time
        
        # Read button state (LOW = pressed due to pull-up)
        button_pressed = GPIO.input(channel) == GPIO.LOW
        
        if button_pressed and not self.is_pressed:
            self._handle_press(current_time)
        elif not button_pressed and self.is_pressed:
            self._handle_release(current_time)
    
    def _handle_press(self, timestamp):
        """Handle button press"""
        self.is_pressed = True
        self.press_start_time = timestamp
        
        # Start long press timer
        self.long_press_timer = threading.Timer(
            self.long_press_threshold,
            self._handle_long_press
        )
        self.long_press_timer.start()
        
        # Handle multi-press
        self.press_count += 1
        if self.multi_press_timer:
            self.multi_press_timer.cancel()
            
        self.multi_press_timer = threading.Timer(
            self.multi_press_window,
            self._handle_multi_press_timeout
        )
        self.multi_press_timer.start()
        
        # Immediate feedback
        self.callbacks.on_button_press()
    
    def _handle_release(self, timestamp):
        """Handle button release"""
        self.is_pressed = False
        
        # Cancel long press if active
        if self.long_press_timer:
            self.long_press_timer.cancel()
            
        # Calculate press duration
        if self.press_start_time:
            duration = timestamp - self.press_start_time
            self.callbacks.on_button_release(duration)
    
    def _handle_long_press(self):
        """Triggered after long press threshold"""
        if self.is_pressed:
            self.callbacks.on_long_press()
            # Reset multi-press counter
            self.press_count = 0
            if self.multi_press_timer:
                self.multi_press_timer.cancel()
    
    def _handle_multi_press_timeout(self):
        """Process multi-press after timeout"""
        if self.press_count == 1:
            self.callbacks.on_single_press()
        elif self.press_count == 2:
            self.callbacks.on_double_press()
        elif self.press_count >= 3:
            self.callbacks.on_triple_press()
        
        # Reset counter
        self.press_count = 0
```

### Button Callback Manager
```python
class ButtonCallbackManager:
    def __init__(self, state_machine, led_controller):
        self.state_machine = state_machine
        self.led_controller = led_controller
        
    def on_button_press(self):
        """Immediate button press feedback"""
        # Quick white flash
        for pwm in self.led_controller.gpio.pwm_controllers.values():
            pwm.ChangeDutyCycle(50)
        time.sleep(0.05)
        for pwm in self.led_controller.gpio.pwm_controllers.values():
            pwm.ChangeDutyCycle(0)
    
    def on_button_release(self, duration):
        """Handle button release based on press duration"""
        if duration < 0.5:
            # Short press - handled by multi-press logic
            pass
        elif duration < self.long_press_threshold:
            # Medium press - stop current action
            self.state_machine.stop_current_action()
    
    def on_single_press(self):
        """Single press - start listening"""
        if self.state_machine.current_state == ToyState.IDLE:
            self.state_machine.transition_to(ToyState.LISTENING)
        elif self.state_machine.current_state == ToyState.LISTENING:
            self.state_machine.transition_to(ToyState.PROCESSING)
    
    def on_double_press(self):
        """Double press - repeat last response"""
        self.state_machine.repeat_last_response()
    
    def on_triple_press(self):
        """Triple press - enter safe mode"""
        self.led_controller.set_pattern(LEDPattern.SAFE_MODE)
        self.state_machine.enter_safe_mode()
    
    def on_long_press(self):
        """Long press - configuration mode"""
        self.led_controller.set_pattern(LEDPattern.LOADING_TOY)
        self.state_machine.enter_config_mode()
```

## Advanced LED Effects

### Color Mixing
```python
class ColorMixer:
    """Helper class for RGB color mixing"""
    
    @staticmethod
    def rgb_to_duty_cycle(r, g, b):
        """Convert RGB (0-255) to duty cycle (0-100)"""
        return {
            'red': int(r * 100 / 255),
            'green': int(g * 100 / 255),
            'blue': int(b * 100 / 255)
        }
    
    @staticmethod
    def hsv_to_rgb(h, s, v):
        """Convert HSV to RGB for smooth color transitions"""
        import colorsys
        r, g, b = colorsys.hsv_to_rgb(h, s, v)
        return int(r * 255), int(g * 255), int(b * 255)
    
    @staticmethod
    def set_color(pwm_controllers, r, g, b):
        """Set LED color using RGB values"""
        duty_cycles = ColorMixer.rgb_to_duty_cycle(r, g, b)
        for color, duty in duty_cycles.items():
            pwm_controllers[color].ChangeDutyCycle(duty)
```

### Custom Effects
```python
def create_custom_effect(self, colors, duration=2.0, steps=50):
    """Create smooth transition between multiple colors"""
    if len(colors) < 2:
        return
        
    step_duration = duration / (len(colors) - 1) / steps
    
    for i in range(len(colors) - 1):
        start_color = colors[i]
        end_color = colors[i + 1]
        
        for step in range(steps):
            if self.stop_pattern.is_set():
                return
                
            # Linear interpolation
            r = start_color[0] + (end_color[0] - start_color[0]) * step / steps
            g = start_color[1] + (end_color[1] - start_color[1]) * step / steps
            b = start_color[2] + (end_color[2] - start_color[2]) * step / steps
            
            ColorMixer.set_color(self.gpio.pwm_controllers, r, g, b)
            time.sleep(step_duration)
```

## Power Management

### LED Brightness Control
```python
class PowerManager:
    def __init__(self, led_controller):
        self.led_controller = led_controller
        self.brightness_scale = 1.0  # 0.0 to 1.0
        self.low_power_mode = False
        
    def set_brightness(self, scale):
        """Adjust overall LED brightness"""
        self.brightness_scale = max(0.0, min(1.0, scale))
        
    def enable_low_power_mode(self):
        """Reduce LED brightness to save battery"""
        self.low_power_mode = True
        self.brightness_scale = 0.3
        
    def apply_brightness(self, duty_cycle):
        """Apply brightness scaling to duty cycle"""
        scaled = duty_cycle * self.brightness_scale
        if self.low_power_mode:
            scaled = min(scaled, 30)  # Cap at 30% in low power
        return int(scaled)
```

## Cleanup and Safety

### GPIO Cleanup
```python
class GPIOCleanup:
    def __init__(self, gpio_controller):
        self.gpio = gpio_controller
        
    def cleanup(self):
        """Safely cleanup GPIO resources"""
        try:
            # Turn off all LEDs
            for pwm in self.gpio.pwm_controllers.values():
                pwm.stop()
            
            # Reset all pins
            GPIO.cleanup()
            
        except Exception as e:
            logging.error(f"GPIO cleanup error: {e}")
    
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cleanup()
```

## Testing Scripts

### LED Test Script
```python
#!/usr/bin/env python3
# test_leds.py

import time
from gpio_control import GPIOController, LEDController, LEDPattern

def test_all_patterns():
    """Test all LED patterns"""
    gpio = GPIOController()
    led = LEDController(gpio)
    
    patterns = [
        LEDPattern.IDLE,
        LEDPattern.LISTENING,
        LEDPattern.PROCESSING,
        LEDPattern.SPEAKING,
        LEDPattern.ERROR,
        LEDPattern.GUARDIAN_ALERT
    ]
    
    for pattern in patterns:
        print(f"Testing pattern: {pattern.value}")
        led.set_pattern(pattern)
        time.sleep(5)
    
    # Cleanup
    led.set_pattern(None)
    gpio.cleanup()

if __name__ == "__main__":
    test_all_patterns()
```

### Button Test Script
```python
#!/usr/bin/env python3
# test_button.py

import time
from gpio_control import GPIOController, ButtonHandler

class TestCallbacks:
    def on_button_press(self):
        print("Button pressed!")
    
    def on_button_release(self, duration):
        print(f"Button released after {duration:.2f}s")
    
    def on_single_press(self):
        print("Single press detected")
    
    def on_double_press(self):
        print("Double press detected")
    
    def on_triple_press(self):
        print("Triple press detected")
    
    def on_long_press(self):
        print("Long press detected")

def test_button():
    """Test button functionality"""
    gpio = GPIOController()
    callbacks = TestCallbacks()
    button = ButtonHandler(gpio, callbacks)
    
    print("Press the button to test...")
    print("- Single press: Normal press")
    print("- Double press: Two quick presses")
    print("- Triple press: Three quick presses")
    print("- Long press: Hold for 3 seconds")
    print("- Ctrl+C to exit")
    
    try:
        while True:
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\nTest complete")
        gpio.cleanup()

if __name__ == "__main__":
    test_button()
```

## Best Practices

1. **Always use try-finally or context managers** for GPIO cleanup
2. **Implement debouncing** for reliable button detection
3. **Use PWM for smooth LED effects** instead of rapid on/off
4. **Keep LED patterns in separate threads** to avoid blocking
5. **Test on actual hardware** - GPIO behavior varies between Pi models
6. **Monitor CPU usage** - Complex LED patterns can consume resources
7. **Consider power consumption** - Reduce brightness on battery power

This comprehensive GPIO control system provides intuitive visual feedback and reliable user interaction for the Pommai smart toy.
