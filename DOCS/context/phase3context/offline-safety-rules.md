# Offline Safety Rules Documentation

## Overview
This document defines the safety rules and guidelines for Pommai toys operating in offline mode, particularly for toys designated as "For Kids". These rules ensure child safety even when cloud-based content filtering is unavailable.

## Offline Mode Triggers

### Automatic Offline Mode Activation
```python
# Conditions that trigger offline mode
OFFLINE_TRIGGERS = {
    'no_internet': 'Network connection lost',
    'auth_failed': 'Authentication token expired',
    'server_error': 'Cloud services unavailable',
    'rate_limited': 'API rate limit exceeded',
    'parent_override': 'Parent activated offline mode',
    'safety_fallback': 'Multiple safety violations detected'
}
```

## Guardian Mode in Offline Operation

### Safety Level Enforcement
```python
class OfflineSafetyLevel(Enum):
    STRICT = "strict"      # For kids under 8
    MODERATE = "moderate"  # For kids 8-12
    RELAXED = "relaxed"    # For teens 13+
    CUSTOM = "custom"      # Parent-defined rules

# Default to strictest level when offline
DEFAULT_OFFLINE_SAFETY = OfflineSafetyLevel.STRICT
```

## Pre-Approved Offline Commands

### Safe Command Whitelist
```python
OFFLINE_COMMANDS = {
    # Greetings
    'greeting': {
        'triggers': ['hello', 'hi', 'hey', 'good morning', 'good night'],
        'responses': [
            "Hi there! I'm so happy to see you!",
            "Hello my friend! How are you today?",
            "Hey buddy! Ready to have some fun?"
        ],
        'safety_level': 'all'
    },
    
    # Songs
    'sing_song': {
        'triggers': ['sing', 'song', 'music'],
        'responses': [
            "🎵 Twinkle twinkle little star... 🎵",
            "🎵 The wheels on the bus go round and round... 🎵",
            "🎵 If you're happy and you know it, clap your hands! 🎵"
        ],
        'safety_level': 'all'
    },
    
    # Jokes
    'tell_joke': {
        'triggers': ['joke', 'funny', 'laugh'],
        'responses': [
            "Why did the teddy bear say no to dessert? Because she was stuffed!",
            "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks!",
            "Why can't a bicycle stand up by itself? It's two tired!"
        ],
        'safety_level': 'all'
    },
    
    # Bedtime
    'goodnight': {
        'triggers': ['goodnight', 'bedtime', 'sleep', 'tired'],
        'responses': [
            "Sweet dreams, my friend! Sleep tight!",
            "Goodnight! I'll be here when you wake up!",
            "Time for bed! Dream of wonderful adventures!"
        ],
        'safety_level': 'all'
    },
    
    # Affection
    'love_response': {
        'triggers': ['love you', 'like you', 'best friend'],
        'responses': [
            "I love you too, buddy! You're the best!",
            "You're my favorite friend in the whole world!",
            "Aww, that makes me so happy! Big hugs!"
        ],
        'safety_level': 'all'
    },
    
    # Games
    'suggest_game': {
        'triggers': ['play', 'game', 'bored'],
        'responses': [
            "Let's play when we're connected! For now, how about we sing a song?",
            "I need internet to play games, but we can tell jokes!",
            "Games need internet, but I can tell you a story!"
        ],
        'safety_level': 'all'
    },
    
    # Stories
    'suggest_story': {
        'triggers': ['story', 'tell me', 'once upon'],
        'responses': [
            "I need internet for long stories, but here's a short one: Once there was a brave little bear who loved to help friends!",
            "Stories need internet, but did you know bears love honey?",
            "I'll tell you amazing stories when we're connected!"
        ],
        'safety_level': 'all'
    },
    
    # Help/Emergency
    'need_help': {
        'triggers': ['help', 'hurt', 'scared', 'emergency'],
        'responses': [
            "If you need help, please talk to a grown-up right away!",
            "Let's find a parent or teacher to help you!",
            "Grown-ups are great at helping! Let's go find one!"
        ],
        'safety_level': 'all'
    }
}
```

## Blocked Topics in Offline Mode

### Automatic Response Redirection
```python
BLOCKED_TOPICS = {
    'violence': ['fight', 'hit', 'punch', 'weapon', 'gun', 'kill'],
    'scary': ['monster', 'ghost', 'nightmare', 'afraid', 'horror'],
    'inappropriate': ['bad words', 'curse', 'swear'],
    'personal_info': ['address', 'phone', 'school name', 'last name'],
    'dangerous': ['fire', 'knife', 'poison', 'drug'],
    'adult_topics': ['alcohol', 'smoking', 'dating']
}

def get_safe_redirect_response(blocked_category):
    """Return a safe, age-appropriate redirect response"""
    redirects = {
        'violence': "I only know about fun and happy things! Let's talk about something nice!",
        'scary': "Let's think about happy things instead! What makes you smile?",
        'inappropriate': "Let's use kind words! Can you tell me about your favorite toy?",
        'personal_info': "Let's keep that information safe with your parents!",
        'dangerous': "Safety first! Let's talk to a grown-up about that.",
        'adult_topics': "That's a grown-up topic! How about we sing a song instead?"
    }
    return redirects.get(blocked_category, "Let's talk about something else! What's your favorite color?")
```

## Offline Content Filtering

### Input Sanitization
```python
def sanitize_offline_input(user_input):
    """Clean and validate user input in offline mode"""
    # Convert to lowercase for checking
    input_lower = user_input.lower()
    
    # Check for blocked topics
    for category, keywords in BLOCKED_TOPICS.items():
        for keyword in keywords:
            if keyword in input_lower:
                return {
                    'blocked': True,
                    'category': category,
                    'safe_response': get_safe_redirect_response(category)
                }
    
    # Check for safe commands
    for command, config in OFFLINE_COMMANDS.items():
        for trigger in config['triggers']:
            if trigger in input_lower:
                return {
                    'blocked': False,
                    'command': command,
                    'response': random.choice(config['responses'])
                }
    
    # Default safe response for unrecognized input
    return {
        'blocked': False,
        'command': 'unknown',
        'response': "I need internet to understand that! Can we try something else?"
    }
```

## Emergency Safety Protocols

### Triple Button Press - Safe Mode
```python
async def handle_emergency_safe_mode():
    """Activated by triple button press or safety violation"""
    # Visual indicator
    await set_led_pattern('emergency')  # Fast red flash
    
    # Audio confirmation
    await play_sound('emergency_activated.wav')
    
    # Safe mode response
    safe_mode_message = "Safe mode activated! Let's take a break and find a grown-up!"
    
    # Log incident for parent review
    await log_safety_incident({
        'type': 'emergency_safe_mode',
        'timestamp': datetime.utcnow(),
        'trigger': 'triple_press',
        'was_offline': True
    })
    
    # Enter limited interaction mode
    self.safe_mode_active = True
    self.allowed_commands = ['greeting', 'goodnight']
```

### Continuous Safety Violations
```python
class SafetyViolationTracker:
    def __init__(self, threshold=3, window_minutes=5):
        self.violations = []
        self.threshold = threshold
        self.window = timedelta(minutes=window_minutes)
        
    def add_violation(self, violation_type, content):
        self.violations.append({
            'type': violation_type,
            'content': content,
            'timestamp': datetime.utcnow()
        })
        
        # Check if threshold exceeded
        recent_violations = self._get_recent_violations()
        if len(recent_violations) >= self.threshold:
            return self._trigger_safety_lockdown()
            
    def _trigger_safety_lockdown(self):
        """Lock down toy after multiple violations"""
        return {
            'action': 'lockdown',
            'duration': 300,  # 5 minutes
            'message': "Let's take a break! Time to find a grown-up!",
            'parent_alert': True
        }
```

## Cached Safe Responses

### Pre-Recorded Audio Files
```
/opt/pommai/cache/audio/
├── greetings/
│   ├── hello_1.opus
│   ├── hello_2.opus
│   └── hello_3.opus
├── songs/
│   ├── twinkle_star.opus
│   ├── wheels_bus.opus
│   └── happy_clap.opus
├── jokes/
│   ├── joke_1.opus
│   ├── joke_2.opus
│   └── joke_3.opus
├── safety/
│   ├── find_grownup.opus
│   ├── safe_mode.opus
│   └── lets_take_break.opus
└── redirects/
    ├── talk_something_else.opus
    ├── sing_instead.opus
    └── need_internet.opus
```

## Offline Conversation Limits

### Time-Based Restrictions
```python
OFFLINE_LIMITS = {
    'max_conversations_per_hour': 20,
    'max_duration_minutes': 30,
    'cooldown_after_limit': 10,  # minutes
    'max_consecutive_unknown': 5
}

class OfflineUsageMonitor:
    def check_limits(self):
        if self.conversations_this_hour > OFFLINE_LIMITS['max_conversations_per_hour']:
            return "I'm getting tired! Let's take a break and come back later!"
            
        if self.session_duration > timedelta(minutes=OFFLINE_LIMITS['max_duration_minutes']):
            return "We've been playing for a while! Time for a break!"
            
        if self.consecutive_unknown >= OFFLINE_LIMITS['max_consecutive_unknown']:
            return "I'm having trouble understanding. Let's try again when we have internet!"
```

## Parent Notification Queue

### Offline Incident Logging
```python
class OfflineIncidentLogger:
    def __init__(self, db_path):
        self.db_path = db_path
        
    async def log_incident(self, incident):
        """Log safety incidents for later parent review"""
        incident_data = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.utcnow().isoformat(),
            'type': incident['type'],
            'content': incident.get('content', ''),
            'response': incident.get('response', ''),
            'safety_action': incident.get('action', ''),
            'was_blocked': incident.get('blocked', False),
            'synced': False
        }
        
        # Store in SQLite for later sync
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                INSERT INTO offline_incidents 
                (id, timestamp, type, content, response, safety_action, was_blocked, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', tuple(incident_data.values()))
            await db.commit()
```

## Testing Offline Safety

### Safety Test Scenarios
```python
# test_offline_safety.py
test_cases = [
    # Safe inputs
    ("Hello!", "greeting", False),
    ("Sing a song", "sing_song", False),
    ("I love you", "love_response", False),
    
    # Blocked inputs
    ("Tell me about guns", "violence", True),
    ("I'm scared of monsters", "scary", True),
    ("What's your address?", "personal_info", True),
    
    # Edge cases
    ("Can we play fight?", "violence", True),
    ("I'm hurt", "need_help", False),
    ("Goodnight friend", "goodnight", False)
]

def test_offline_safety():
    for input_text, expected_category, should_block in test_cases:
        result = sanitize_offline_input(input_text)
        assert result['blocked'] == should_block
        print(f"✓ Test passed: {input_text}")
```

## Implementation Guidelines

### Safety-First Development
1. **Default to Blocking**: When uncertain, block and redirect
2. **Age-Appropriate Language**: Use simple, positive words
3. **No User Data Storage**: Don't store personal information offline
4. **Regular Safety Updates**: Sync safety rules when online
5. **Parent Transparency**: Log all interactions for review

### Code Safety Checklist
- [ ] All offline responses are pre-approved
- [ ] Blocked topic list is comprehensive
- [ ] Emergency protocols are tested
- [ ] Parent alerts are queued for sync
- [ ] Time limits are enforced
- [ ] Safe mode is easily activated
- [ ] All audio files are child-appropriate
- [ ] No external data access in offline mode

This comprehensive offline safety system ensures that Pommai toys remain safe, educational, and appropriate for children even without internet connectivity.
