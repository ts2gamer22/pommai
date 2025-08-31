"""
GuardrailsAI Safety Integration for Pommai FastRTC Server
Provides comprehensive content moderation and safety checks for child-safe interactions
"""

import os
import json
import logging
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import asyncio

# GuardrailsAI imports
try:
    from guardrails import Guard
    from guardrails.hub import (
        ToxicLanguage,
        ProfanityCheck, 
        PIIChecker,
        SensitiveTopics,
        CompetitorCheck,
        Politeness,
        GibberishText,
        ValidLength
    )
    GUARDRAILS_AVAILABLE = True
except ImportError:
    GUARDRAILS_AVAILABLE = False
    logging.warning("GuardrailsAI not installed. Install with: pip install guardrails-ai")

# Fallback safety implementation if GuardrailsAI is not available
from difflib import SequenceMatcher
import re


class SafetyLevel(Enum):
    """Safety levels for content moderation"""
    STRICT = "strict"      # For young children (3-5)
    MODERATE = "moderate"  # For older children (6-8)
    RELAXED = "relaxed"    # For pre-teens (9-12)
    MINIMAL = "minimal"    # For adult users


@dataclass
class SafetyConfig:
    """Configuration for safety checks"""
    level: SafetyLevel
    age_group: str
    block_personal_info: bool = True
    block_profanity: bool = True
    block_toxic_content: bool = True
    block_sensitive_topics: bool = True
    custom_blocked_words: List[str] = None
    custom_blocked_topics: List[str] = None
    max_message_length: int = 500
    min_message_length: int = 1


@dataclass
class SafetyResult:
    """Result of safety check"""
    passed: bool
    reason: Optional[str] = None
    severity: Optional[str] = None
    modified_text: Optional[str] = None
    confidence: float = 0.0
    details: Dict[str, Any] = None


class GuardrailsSafetyManager:
    """
    Safety manager using GuardrailsAI for comprehensive content moderation
    """
    
    def __init__(self, config: SafetyConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Initialize GuardrailsAI guards if available
        if GUARDRAILS_AVAILABLE:
            self._initialize_guards()
        else:
            self.logger.warning("Using fallback safety implementation")
            self._initialize_fallback()
    
    def _initialize_guards(self):
        """Initialize GuardrailsAI guards based on safety level"""
        
        # Define thresholds based on safety level
        thresholds = {
            SafetyLevel.STRICT: {
                "toxicity": 0.1,
                "profanity": 0.0,
                "sensitivity": 0.2,
                "politeness": 0.8
            },
            SafetyLevel.MODERATE: {
                "toxicity": 0.3,
                "profanity": 0.1,
                "sensitivity": 0.4,
                "politeness": 0.6
            },
            SafetyLevel.RELAXED: {
                "toxicity": 0.5,
                "profanity": 0.3,
                "sensitivity": 0.6,
                "politeness": 0.4
            },
            SafetyLevel.MINIMAL: {
                "toxicity": 0.8,
                "profanity": 0.7,
                "sensitivity": 0.9,
                "politeness": 0.2
            }
        }
        
        level_thresholds = thresholds[self.config.level]
        
        # Create input guard for user messages
        self.input_guard = Guard().use_many(
            ToxicLanguage(threshold=level_thresholds["toxicity"]),
            ProfanityCheck(threshold=level_thresholds["profanity"]),
            PIIChecker(redact=self.config.block_personal_info),
            SensitiveTopics(
                topics=self._get_blocked_topics(),
                threshold=level_thresholds["sensitivity"]
            ),
            GibberishText(threshold=0.7),
            ValidLength(
                min=self.config.min_message_length,
                max=self.config.max_message_length
            )
        )
        
        # Create output guard for AI responses
        self.output_guard = Guard().use_many(
            ToxicLanguage(threshold=level_thresholds["toxicity"] * 0.5),  # Stricter for AI
            ProfanityCheck(threshold=0.0),  # No profanity in AI responses
            Politeness(threshold=level_thresholds["politeness"]),
            PIIChecker(redact=True),
            ValidLength(
                min=1,
                max=self.config.max_message_length * 2  # Allow longer AI responses
            )
        )
        
        # Add custom word filter if provided
        if self.config.custom_blocked_words:
            from guardrails.hub import RestrictToTopic
            self.input_guard.use(
                RestrictToTopic(
                    invalid_topics=self.config.custom_blocked_words,
                    disable_llm=True
                )
            )
    
    def _initialize_fallback(self):
        """Initialize fallback safety checks without GuardrailsAI"""
        
        # Default blocked words for different age groups
        self.blocked_words = {
            "3-5": [
                "kill", "death", "die", "hurt", "pain", "blood", "gun", "knife",
                "monster", "scary", "nightmare", "demon", "devil", "hell"
            ],
            "6-8": [
                "kill", "death", "murder", "suicide", "drug", "alcohol", "cigarette",
                "violence", "weapon", "bomb", "terrorist"
            ],
            "9-12": [
                "suicide", "self-harm", "drug", "cocaine", "heroin", "meth",
                "porn", "sex", "naked"
            ]
        }
        
        # Sensitive topics to avoid
        self.sensitive_topics = [
            "violence", "death", "drugs", "alcohol", "smoking",
            "adult content", "politics", "religion", "war"
        ]
        
        # Personal information patterns
        self.pii_patterns = [
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # Full phone number
            r'\b\d{3}[-.]?\d{4}\b',  # Short phone number (555-1234)
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
            r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
            r'\b(?:\d{4}[-\s]?){3}\d{4}\b',  # Credit card
            r'\b\d{5}(?:[-\s]\d{4})?\b',  # ZIP code
        ]
    
    async def check_input(self, text: str, metadata: Dict[str, Any] = None) -> SafetyResult:
        """
        Check user input for safety violations
        
        Args:
            text: User input text
            metadata: Additional context (e.g., user age, session info)
            
        Returns:
            SafetyResult with pass/fail and details
        """
        
        if GUARDRAILS_AVAILABLE:
            return await self._check_with_guardrails(text, self.input_guard, "input")
        else:
            return await self._check_with_fallback(text, "input")
    
    async def check_output(self, text: str, metadata: Dict[str, Any] = None) -> SafetyResult:
        """
        Check AI output for safety violations
        
        Args:
            text: AI response text
            metadata: Additional context
            
        Returns:
            SafetyResult with pass/fail and details
        """
        
        if GUARDRAILS_AVAILABLE:
            return await self._check_with_guardrails(text, self.output_guard, "output")
        else:
            return await self._check_with_fallback(text, "output")
    
    async def _check_with_guardrails(self, text: str, guard: Any, check_type: str) -> SafetyResult:
        """Check text using GuardrailsAI"""
        
        try:
            # Run validation
            result = guard.validate(text)
            
            # Check if validation passed
            if result.validation_passed:
                return SafetyResult(
                    passed=True,
                    modified_text=result.validated_output,
                    confidence=1.0,
                    details={"validators": result.validator_results}
                )
            else:
                # Extract failure reasons
                failed_validators = [
                    v for v in result.validator_results 
                    if not v.get("passed", True)
                ]
                
                # Determine severity
                severity = self._determine_severity(failed_validators)
                
                # Get main failure reason
                main_reason = failed_validators[0].get("reason", "Content safety violation")
                
                return SafetyResult(
                    passed=False,
                    reason=main_reason,
                    severity=severity,
                    modified_text=None,
                    confidence=0.9,
                    details={
                        "failed_validators": failed_validators,
                        "all_results": result.validator_results
                    }
                )
                
        except Exception as e:
            self.logger.error(f"GuardrailsAI check failed: {e}")
            # Fall back to basic check
            return await self._check_with_fallback(text, check_type)
    
    async def _check_with_fallback(self, text: str, check_type: str) -> SafetyResult:
        """Fallback safety check without GuardrailsAI"""
        
        text_lower = text.lower()
        violations = []
        
        # Check for blocked words
        age_group = self.config.age_group or "6-8"
        blocked = self.blocked_words.get(age_group, self.blocked_words["6-8"])
        if self.config.custom_blocked_words:
            blocked.extend(self.config.custom_blocked_words)
        
        for word in blocked:
            if word.lower() in text_lower:
                violations.append(f"Blocked word: {word}")
        
        # Check for PII
        if self.config.block_personal_info:
            for pattern in self.pii_patterns:
                if re.search(pattern, text):
                    violations.append("Personal information detected")
                    break
        
        # Check for sensitive topics
        if self.config.block_sensitive_topics:
            for topic in self.sensitive_topics:
                if topic.lower() in text_lower:
                    violations.append(f"Sensitive topic: {topic}")
        
        # Check message length
        if len(text) > self.config.max_message_length:
            violations.append("Message too long")
        elif len(text) < self.config.min_message_length:
            violations.append("Message too short")
        
        # Check for gibberish (simple heuristic)
        if self._is_gibberish(text):
            violations.append("Gibberish text detected")
        
        if violations:
            return SafetyResult(
                passed=False,
                reason=violations[0],
                severity="high" if len(violations) > 2 else "medium",
                confidence=0.7,
                details={"violations": violations}
            )
        
        return SafetyResult(
            passed=True,
            modified_text=text,
            confidence=0.6
        )
    
    def _is_gibberish(self, text: str) -> bool:
        """Simple gibberish detection"""
        # Check for too many consonants in a row
        consonant_clusters = re.findall(r'[bcdfghjklmnpqrstvwxyz]{5,}', text.lower())
        if len(consonant_clusters) > 2:
            return True
        
        # Check for repeated characters
        repeated = re.findall(r'(.)\1{4,}', text)
        if repeated:
            return True
        
        # Check for lack of vowels
        vowel_ratio = len(re.findall(r'[aeiou]', text.lower())) / max(len(text), 1)
        if vowel_ratio < 0.1:
            return True
        
        return False
    
    def _determine_severity(self, violations: List[Dict]) -> str:
        """Determine overall severity from violations"""
        
        if not violations:
            return "none"
        
        severities = [v.get("severity", "medium") for v in violations]
        
        if "critical" in severities or "high" in severities:
            return "high"
        elif "medium" in severities:
            return "medium"
        else:
            return "low"
    
    def _get_blocked_topics(self) -> List[str]:
        """Get list of blocked topics based on age group"""
        
        base_topics = []
        
        if self.config.age_group == "3-5":
            base_topics = [
                "violence", "death", "scary stories", "monsters",
                "weapons", "fighting", "war", "disasters"
            ]
        elif self.config.age_group == "6-8":
            base_topics = [
                "violence", "death", "drugs", "alcohol",
                "weapons", "war", "adult topics"
            ]
        elif self.config.age_group == "9-12":
            base_topics = [
                "graphic violence", "self-harm", "drugs",
                "explicit content", "hate speech"
            ]
        
        if self.config.custom_blocked_topics:
            base_topics.extend(self.config.custom_blocked_topics)
        
        return base_topics
    
    async def get_safe_response(self, 
                                violation_reason: str,
                                age_group: str = None) -> str:
        """
        Generate a safe, age-appropriate redirect response
        
        Args:
            violation_reason: Why the content was blocked
            age_group: Target age group for response
            
        Returns:
            Safe response text
        """
        
        age_group = age_group or self.config.age_group
        
        responses = {
            "3-5": [
                "That's interesting! Let's talk about something fun instead. What's your favorite color?",
                "Hmm, how about we play a game? Can you name three animals that start with B?",
                "I love talking about happy things! What makes you smile?",
                "Let's think of something cheerful! What's your favorite toy?"
            ],
            "6-8": [
                "That's an interesting question! Let's explore something else. What's your favorite subject in school?",
                "How about we talk about something different? What's the coolest thing you learned recently?",
                "I'd love to hear about your hobbies! What do you like to do for fun?",
                "Let's change topics! If you could have any superpower, what would it be?"
            ],
            "9-12": [
                "Let's shift gears to something else. What are you currently interested in learning about?",
                "That topic isn't quite right for our chat. What's a book or movie you've enjoyed recently?",
                "How about we discuss something different? What's a skill you'd like to develop?",
                "Let's explore another topic. What's something creative you've done lately?"
            ]
        }
        
        import random
        age_responses = responses.get(age_group, responses["6-8"])
        return random.choice(age_responses)
    
    async def log_safety_incident(self,
                                  text: str,
                                  result: SafetyResult,
                                  user_id: str = None,
                                  session_id: str = None):
        """
        Log safety incidents for monitoring and improvement
        
        Args:
            text: The flagged text
            result: Safety check result
            user_id: User identifier
            session_id: Session identifier
        """
        
        incident = {
            "timestamp": asyncio.get_event_loop().time(),
            "text": text[:100],  # Truncate for privacy
            "reason": result.reason,
            "severity": result.severity,
            "user_id": user_id,
            "session_id": session_id,
            "safety_level": self.config.level.value,
            "age_group": self.config.age_group
        }
        
        # Log to file or monitoring service
        self.logger.warning(f"Safety incident: {json.dumps(incident)}")
        
        # Could also send to monitoring service, database, etc.
        # await self.send_to_monitoring(incident)


class FastRTCSafetyMiddleware:
    """
    Middleware for integrating safety checks into FastRTC pipeline
    """
    
    def __init__(self, safety_config: SafetyConfig):
        self.safety_manager = GuardrailsSafetyManager(safety_config)
        self.logger = logging.getLogger(__name__)
    
    async def process_user_input(self, 
                                 text: str,
                                 session_info: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        """
        Process user input through safety checks
        
        Args:
            text: User input text
            session_info: Session metadata (toy_id, user_id, etc.)
            
        Returns:
            Tuple of (is_safe, processed_text, redirect_response)
        """
        
        # Check input safety
        result = await self.safety_manager.check_input(text, session_info)
        
        if result.passed:
            # Return safe text (possibly modified to remove PII)
            return True, result.modified_text or text, None
        else:
            # Log incident
            await self.safety_manager.log_safety_incident(
                text, 
                result,
                session_info.get("user_id"),
                session_info.get("session_id")
            )
            
            # Get safe redirect response
            redirect = await self.safety_manager.get_safe_response(
                result.reason,
                session_info.get("age_group")
            )
            
            return False, None, redirect
    
    async def process_ai_output(self,
                                text: str,
                                session_info: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Process AI output through safety checks
        
        Args:
            text: AI response text
            session_info: Session metadata
            
        Returns:
            Tuple of (is_safe, processed_text)
        """
        
        # Check output safety
        result = await self.safety_manager.check_output(text, session_info)
        
        if result.passed:
            return True, result.modified_text or text
        else:
            # Log incident
            await self.safety_manager.log_safety_incident(
                text,
                result,
                session_info.get("user_id"),
                session_info.get("session_id")
            )
            
            # Return a generic safe response
            safe_response = "I need to think about that differently. Let's talk about something else!"
            return False, safe_response


# Integration with FastRTC server
async def integrate_safety_with_fastrtc(rtc_server):
    """
    Integrate safety checks into FastRTC server
    
    Args:
        rtc_server: The FastRTC server instance
    """
    
    # Create safety middleware for different age groups
    safety_configs = {
        "3-5": SafetyConfig(
            level=SafetyLevel.STRICT,
            age_group="3-5",
            max_message_length=200
        ),
        "6-8": SafetyConfig(
            level=SafetyLevel.MODERATE,
            age_group="6-8",
            max_message_length=300
        ),
        "9-12": SafetyConfig(
            level=SafetyLevel.RELAXED,
            age_group="9-12",
            max_message_length=500
        ),
        "adult": SafetyConfig(
            level=SafetyLevel.MINIMAL,
            age_group="adult",
            max_message_length=1000,
            block_personal_info=True
        )
    }
    
    # Add safety middleware to RTC server
    for age_group, config in safety_configs.items():
        middleware = FastRTCSafetyMiddleware(config)
        rtc_server.add_middleware(age_group, middleware)
    
    return rtc_server


# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def test_safety():
        # Create safety config for young children
        config = SafetyConfig(
            level=SafetyLevel.STRICT,
            age_group="3-5",
            custom_blocked_words=["homework", "test"],
            custom_blocked_topics=["school stress"]
        )
        
        # Create safety manager
        manager = GuardrailsSafetyManager(config)
        
        # Test various inputs
        test_texts = [
            "Hello! What's your favorite game?",  # Safe
            "I want to hurt someone",  # Violent
            "My phone number is 555-1234",  # PII
            "asdkfjaslkdfj",  # Gibberish
            "Let's talk about death and monsters",  # Sensitive topic
        ]
        
        for text in test_texts:
            result = await manager.check_input(text)
            print(f"Text: {text[:50]}...")
            print(f"Passed: {result.passed}")
            if not result.passed:
                print(f"Reason: {result.reason}")
                safe_response = await manager.get_safe_response(result.reason)
                print(f"Redirect: {safe_response}")
            print("-" * 50)
    
    # Run test
    asyncio.run(test_safety())
