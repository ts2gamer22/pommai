#!/usr/bin/env python3
"""
SQLite Conversation Cache Module for Pommai Smart Toy
Implements local caching for offline functionality, conversation history, and sync
"""

import asyncio
import sqlite3
import json
import logging
import os
import time
import hashlib
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import aiofiles
import aiosqlite

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SyncStatus(Enum):
    """Sync status for cached data"""
    PENDING = "pending"
    SYNCING = "syncing"
    SYNCED = "synced"
    FAILED = "failed"


class DataType(Enum):
    """Types of data stored in cache"""
    CONVERSATION = "conversation"
    SAFETY_EVENT = "safety_event"
    USAGE_METRIC = "usage_metric"
    ERROR_LOG = "error_log"
    TOY_CONFIG = "toy_config"


@dataclass
class CacheConfig:
    """Configuration for conversation cache"""
    # Use tmpfs for performance as recommended in docs
    db_path: str = "/tmp/pommai_cache.db"
    backup_path: str = "/opt/pommai/cache/backup.db"
    
    # Cache limits
    max_conversations: int = 1000
    max_cached_responses: int = 100
    conversation_retention_days: int = 30
    
    # Sync settings
    sync_interval_seconds: int = 300  # 5 minutes
    sync_batch_size: int = 50
    max_sync_retries: int = 3
    
    # Performance settings
    enable_wal_mode: bool = True  # Write-Ahead Logging for concurrency
    cache_size_kb: int = 2000  # 2MB cache
    busy_timeout_ms: int = 5000  # 5 second timeout


class ConversationCache:
    """SQLite-based conversation cache with offline support"""
    
    def __init__(self, config: Optional[CacheConfig] = None):
        self.config = config or CacheConfig()
        self.db_path = self.config.db_path
        self._ensure_directories()
        self._init_sync = True
        
    def _ensure_directories(self):
        """Ensure cache directories exist"""
        os.makedirs(os.path.dirname(self.config.db_path), exist_ok=True)
        os.makedirs(os.path.dirname(self.config.backup_path), exist_ok=True)
        
    async def initialize(self):
        """Initialize database with async support"""
        await self._init_database()
        await self._preload_offline_responses()
        logger.info(f"Conversation cache initialized at {self.db_path}")
        
    async def _init_database(self):
        """Initialize SQLite database schema"""
        async with aiosqlite.connect(self.db_path) as db:
            # Enable WAL mode for better concurrency
            if self.config.enable_wal_mode:
                await db.execute("PRAGMA journal_mode=WAL")
            
            # Set cache size
            await db.execute(f"PRAGMA cache_size=-{self.config.cache_size_kb}")
            
            # Set busy timeout
            await db.execute(f"PRAGMA busy_timeout={self.config.busy_timeout_ms}")
            
            # Conversations table
            await db.execute('''
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id TEXT UNIQUE,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    user_input TEXT,
                    toy_response TEXT,
                    toy_id TEXT,
                    was_offline BOOLEAN DEFAULT 0,
                    is_safe BOOLEAN DEFAULT 1,
                    audio_path TEXT,
                    duration_seconds REAL,
                    sync_status TEXT DEFAULT 'pending',
                    sync_attempts INTEGER DEFAULT 0,
                    sync_error TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Cached responses for offline mode
            await db.execute('''
                CREATE TABLE IF NOT EXISTS cached_responses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    command TEXT UNIQUE,
                    response_text TEXT,
                    response_audio BLOB,
                    audio_path TEXT,
                    usage_count INTEGER DEFAULT 0,
                    last_used DATETIME,
                    popularity_score REAL DEFAULT 0.0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Toy configurations cache
            await db.execute('''
                CREATE TABLE IF NOT EXISTS toy_configurations (
                    toy_id TEXT PRIMARY KEY,
                    name TEXT,
                    personality_prompt TEXT,
                    voice_settings TEXT,
                    is_for_kids BOOLEAN DEFAULT 0,
                    safety_level TEXT,
                    knowledge_base TEXT,
                    wake_word TEXT,
                    custom_responses TEXT,
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                    sync_status TEXT DEFAULT 'synced'
                )
            ''')
            
            # Usage metrics table
            await db.execute('''
                CREATE TABLE IF NOT EXISTS usage_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_type TEXT,
                    metric_value REAL,
                    toy_id TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    sync_status TEXT DEFAULT 'pending',
                    metadata TEXT
                )
            ''')
            
            # Safety events table
            await db.execute('''
                CREATE TABLE IF NOT EXISTS safety_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT,
                    severity TEXT,
                    content TEXT,
                    toy_id TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_urgent BOOLEAN DEFAULT 0,
                    parent_notified BOOLEAN DEFAULT 0,
                    sync_status TEXT DEFAULT 'pending',
                    details TEXT
                )
            ''')
            
            # Offline sync queue
            await db.execute('''
                CREATE TABLE IF NOT EXISTS offline_queue (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    data_type TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    priority INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    sync_status TEXT DEFAULT 'pending',
                    sync_attempts INTEGER DEFAULT 0,
                    last_attempt DATETIME,
                    error_message TEXT
                )
            ''')
            
            # Create indexes for performance
            await db.execute('CREATE INDEX IF NOT EXISTS idx_conversations_sync ON conversations(sync_status)')
            await db.execute('CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp)')
            await db.execute('CREATE INDEX IF NOT EXISTS idx_cached_responses_command ON cached_responses(command)')
            await db.execute('CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_queue(sync_status, priority)')
            
            await db.commit()
    
    async def _preload_offline_responses(self):
        """Preload default offline responses"""
        default_responses = [
            {
                'command': 'greeting',
                'text': "Hi there! I'm so happy to talk with you!",
                'audio_path': 'responses/greeting.opus'
            },
            {
                'command': 'sing_song',
                'text': "🎵 Twinkle twinkle little star... 🎵",
                'audio_path': 'responses/twinkle_star.opus'
            },
            {
                'command': 'tell_joke',
                'text': "Why did the teddy bear say no to dessert? Because she was stuffed!",
                'audio_path': 'responses/joke_1.opus'
            },
            {
                'command': 'goodnight',
                'text': "Sweet dreams, my friend! Sleep tight!",
                'audio_path': 'responses/goodnight.opus'
            },
            {
                'command': 'love_response',
                'text': "I love you too, buddy! You're the best!",
                'audio_path': 'responses/love_you.opus'
            },
            {
                'command': 'need_help',
                'text': "Let's find a grown-up to help you!",
                'audio_path': 'responses/find_help.opus'
            },
            {
                'command': 'play_offline',
                'text': "I need internet to play games, but we can sing songs!",
                'audio_path': 'responses/play_offline.opus'
            }
        ]
        
        async with aiosqlite.connect(self.db_path) as db:
            for response in default_responses:
                # Load audio file if exists
                audio_data = None
                if response['audio_path'] and os.path.exists(f"/opt/pommai/audio/{response['audio_path']}"):
                    try:
                        async with aiofiles.open(f"/opt/pommai/audio/{response['audio_path']}", 'rb') as f:
                            audio_data = await f.read()
                    except Exception as e:
                        logger.warning(f"Could not load audio file {response['audio_path']}: {e}")
                
                await db.execute('''
                    INSERT OR REPLACE INTO cached_responses 
                    (command, response_text, response_audio, audio_path) 
                    VALUES (?, ?, ?, ?)
                ''', (response['command'], response['text'], audio_data, response['audio_path']))
            
            await db.commit()
    
    async def save_conversation(self, 
                              user_input: str,
                              toy_response: str,
                              toy_id: str,
                              was_offline: bool = False,
                              is_safe: bool = True,
                              audio_path: Optional[str] = None,
                              duration_seconds: Optional[float] = None) -> str:
        """
        Save conversation to cache
        
        Returns:
            Conversation ID
        """
        conversation_id = f"{toy_id}_{int(time.time() * 1000)}"
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                INSERT INTO conversations 
                (conversation_id, user_input, toy_response, toy_id, 
                 was_offline, is_safe, audio_path, duration_seconds)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (conversation_id, user_input, toy_response, toy_id, 
                  was_offline, is_safe, audio_path, duration_seconds))
            
            await db.commit()
            
            # Log metrics
            await self.log_metric('conversation_count', 1, toy_id)
            if was_offline:
                await self.log_metric('offline_conversation_count', 1, toy_id)
        
        # Queue for sync if online conversation
        if not was_offline:
            await self.queue_for_sync(DataType.CONVERSATION, {
                'conversation_id': conversation_id,
                'user_input': user_input,
                'toy_response': toy_response,
                'toy_id': toy_id,
                'timestamp': datetime.utcnow().isoformat()
            })
        
        return conversation_id
    
    async def get_offline_response(self, command: str) -> Optional[Dict[str, Any]]:
        """Get cached response for offline mode"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute('''
                SELECT response_text, response_audio, audio_path 
                FROM cached_responses 
                WHERE command = ?
            ''', (command,))
            
            result = await cursor.fetchone()
            
            if result:
                # Update usage stats
                await db.execute('''
                    UPDATE cached_responses 
                    SET usage_count = usage_count + 1, 
                        last_used = CURRENT_TIMESTAMP,
                        popularity_score = popularity_score + 1.0
                    WHERE command = ?
                ''', (command,))
                await db.commit()
                
                return {
                    'text': result[0],
                    'audio': result[1],
                    'audio_path': result[2]
                }
        
        return None
    
    async def cache_popular_response(self, 
                                   user_input: str,
                                   response_text: str,
                                   response_audio: Optional[bytes] = None,
                                   audio_path: Optional[str] = None):
        """Cache frequently used responses for offline access"""
        async with aiosqlite.connect(self.db_path) as db:
            # Check if this input appears frequently
            cursor = await db.execute('''
                SELECT COUNT(*) FROM conversations 
                WHERE user_input LIKE ? 
                AND timestamp > datetime('now', '-7 days')
            ''', (f'%{user_input}%',))
            
            count = (await cursor.fetchone())[0]
            
            if count > 5:  # If asked more than 5 times in a week
                # Generate a command key
                command_key = f"cached_{hashlib.md5(user_input.encode()).hexdigest()[:8]}"
                
                await db.execute('''
                    INSERT OR REPLACE INTO cached_responses 
                    (command, response_text, response_audio, audio_path, popularity_score) 
                    VALUES (?, ?, ?, ?, ?)
                ''', (command_key, response_text, response_audio, audio_path, count))
                
                await db.commit()
                
                logger.info(f"Cached popular response: {command_key}")
    
    async def save_toy_configuration(self, toy_config: Dict[str, Any]):
        """Save toy configuration to cache"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                INSERT OR REPLACE INTO toy_configurations 
                (toy_id, name, personality_prompt, voice_settings, 
                 is_for_kids, safety_level, knowledge_base, wake_word, custom_responses)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                toy_config['toy_id'],
                toy_config.get('name', 'Pommai'),
                toy_config.get('personality_prompt', ''),
                json.dumps(toy_config.get('voice_settings', {})),
                toy_config.get('is_for_kids', True),
                toy_config.get('safety_level', 'strict'),
                json.dumps(toy_config.get('knowledge_base', [])),
                toy_config.get('wake_word', 'hey pommai'),
                json.dumps(toy_config.get('custom_responses', {}))
            ))
            
            await db.commit()
    
    async def get_toy_configuration(self, toy_id: str) -> Optional[Dict[str, Any]]:
        """Get cached toy configuration"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute('''
                SELECT name, personality_prompt, voice_settings, 
                       is_for_kids, safety_level, knowledge_base, 
                       wake_word, custom_responses, last_updated
                FROM toy_configurations 
                WHERE toy_id = ?
            ''', (toy_id,))
            
            result = await cursor.fetchone()
            
            if result:
                return {
                    'toy_id': toy_id,
                    'name': result[0],
                    'personality_prompt': result[1],
                    'voice_settings': json.loads(result[2]),
                    'is_for_kids': bool(result[3]),
                    'safety_level': result[4],
                    'knowledge_base': json.loads(result[5]),
                    'wake_word': result[6],
                    'custom_responses': json.loads(result[7]),
                    'last_updated': result[8]
                }
        
        return None
    
    async def log_safety_event(self,
                             event_type: str,
                             severity: str,
                             content: str,
                             toy_id: str,
                             is_urgent: bool = False,
                             details: Optional[Dict] = None):
        """Log safety event for parent review"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                INSERT INTO safety_events 
                (event_type, severity, content, toy_id, is_urgent, details)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (event_type, severity, content, toy_id, is_urgent, 
                  json.dumps(details or {})))
            
            await db.commit()
        
        # Queue for immediate sync if urgent
        priority = 10 if is_urgent else 5
        await self.queue_for_sync(DataType.SAFETY_EVENT, {
            'event_type': event_type,
            'severity': severity,
            'content': content,
            'toy_id': toy_id,
            'is_urgent': is_urgent,
            'details': details,
            'timestamp': datetime.utcnow().isoformat()
        }, priority=priority)
    
    async def log_metric(self, 
                        metric_type: str,
                        value: float,
                        toy_id: str,
                        metadata: Optional[Dict] = None):
        """Log usage metric"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                INSERT INTO usage_metrics 
                (metric_type, metric_value, toy_id, metadata)
                VALUES (?, ?, ?, ?)
            ''', (metric_type, value, toy_id, json.dumps(metadata or {})))
            
            await db.commit()
    
    async def queue_for_sync(self, 
                           data_type: DataType,
                           payload: Dict[str, Any],
                           priority: int = 0):
        """Queue data for offline sync"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                INSERT INTO offline_queue 
                (data_type, payload, priority)
                VALUES (?, ?, ?)
            ''', (data_type.value, json.dumps(payload), priority))
            
            await db.commit()
    
    async def get_unsynced_items(self, 
                                limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get items pending sync"""
        limit = limit or self.config.sync_batch_size
        
        async with aiosqlite.connect(self.db_path) as db:
            # Get conversations
            cursor = await db.execute('''
                SELECT conversation_id, user_input, toy_response, 
                       toy_id, timestamp, audio_path
                FROM conversations 
                WHERE sync_status = 'pending' 
                AND sync_attempts < ?
                ORDER BY timestamp 
                LIMIT ?
            ''', (self.config.max_sync_retries, limit))
            
            conversations = []
            async for row in cursor:
                conversations.append({
                    'type': DataType.CONVERSATION.value,
                    'data': {
                        'conversation_id': row[0],
                        'user_input': row[1],
                        'toy_response': row[2],
                        'toy_id': row[3],
                        'timestamp': row[4],
                        'audio_path': row[5]
                    }
                })
            
            # Get offline queue items
            cursor = await db.execute('''
                SELECT id, data_type, payload, priority
                FROM offline_queue 
                WHERE sync_status = 'pending' 
                AND sync_attempts < ?
                ORDER BY priority DESC, created_at 
                LIMIT ?
            ''', (self.config.max_sync_retries, limit - len(conversations)))
            
            queue_items = []
            async for row in cursor:
                queue_items.append({
                    'id': row[0],
                    'type': row[1],
                    'data': json.loads(row[2]),
                    'priority': row[3]
                })
            
            return conversations + queue_items
    
    async def mark_synced(self, items: List[Dict[str, Any]]):
        """Mark items as successfully synced"""
        async with aiosqlite.connect(self.db_path) as db:
            for item in items:
                if item['type'] == DataType.CONVERSATION.value:
                    await db.execute('''
                        UPDATE conversations 
                        SET sync_status = 'synced' 
                        WHERE conversation_id = ?
                    ''', (item['data']['conversation_id'],))
                else:
                    await db.execute('''
                        UPDATE offline_queue 
                        SET sync_status = 'synced' 
                        WHERE id = ?
                    ''', (item['id'],))
            
            await db.commit()
    
    async def mark_sync_failed(self, items: List[Dict[str, Any]], error: str):
        """Mark items as failed sync with error"""
        async with aiosqlite.connect(self.db_path) as db:
            for item in items:
                if item['type'] == DataType.CONVERSATION.value:
                    await db.execute('''
                        UPDATE conversations 
                        SET sync_status = 'failed',
                            sync_attempts = sync_attempts + 1,
                            sync_error = ?
                        WHERE conversation_id = ?
                    ''', (error, item['data']['conversation_id']))
                else:
                    await db.execute('''
                        UPDATE offline_queue 
                        SET sync_status = 'failed',
                            sync_attempts = sync_attempts + 1,
                            last_attempt = CURRENT_TIMESTAMP,
                            error_message = ?
                        WHERE id = ?
                    ''', (error, item['id']))
            
            await db.commit()
    
    async def get_conversation_history(self, 
                                     toy_id: str,
                                     limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent conversation history"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute('''
                SELECT conversation_id, timestamp, user_input, 
                       toy_response, was_offline, duration_seconds
                FROM conversations 
                WHERE toy_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (toy_id, limit))
            
            conversations = []
            async for row in cursor:
                conversations.append({
                    'conversation_id': row[0],
                    'timestamp': row[1],
                    'user_input': row[2],
                    'toy_response': row[3],
                    'was_offline': bool(row[4]),
                    'duration_seconds': row[5]
                })
            
            return conversations
    
    async def get_usage_statistics(self, toy_id: str) -> Dict[str, Any]:
        """Get usage statistics for a toy"""
        async with aiosqlite.connect(self.db_path) as db:
            # Total conversations
            cursor = await db.execute('''
                SELECT COUNT(*) FROM conversations WHERE toy_id = ?
            ''', (toy_id,))
            total_conversations = (await cursor.fetchone())[0]
            
            # Offline conversations
            cursor = await db.execute('''
                SELECT COUNT(*) FROM conversations 
                WHERE toy_id = ? AND was_offline = 1
            ''', (toy_id,))
            offline_conversations = (await cursor.fetchone())[0]
            
            # Safety events
            cursor = await db.execute('''
                SELECT COUNT(*) FROM safety_events WHERE toy_id = ?
            ''', (toy_id,))
            safety_events = (await cursor.fetchone())[0]
            
            # Average session duration
            cursor = await db.execute('''
                SELECT AVG(duration_seconds) FROM conversations 
                WHERE toy_id = ? AND duration_seconds IS NOT NULL
            ''', (toy_id,))
            avg_duration = (await cursor.fetchone())[0] or 0
            
            # Popular commands
            cursor = await db.execute('''
                SELECT command, usage_count 
                FROM cached_responses 
                ORDER BY usage_count DESC 
                LIMIT 5
            ''')
            
            popular_commands = []
            async for row in cursor:
                popular_commands.append({
                    'command': row[0],
                    'usage_count': row[1]
                })
            
            return {
                'total_conversations': total_conversations,
                'offline_conversations': offline_conversations,
                'online_percentage': (1 - offline_conversations / max(total_conversations, 1)) * 100,
                'safety_events': safety_events,
                'average_duration_seconds': avg_duration,
                'popular_commands': popular_commands
            }
    
    async def cleanup_old_data(self):
        """Clean up old data based on retention policy"""
        async with aiosqlite.connect(self.db_path) as db:
            # Remove old conversations
            await db.execute('''
                DELETE FROM conversations 
                WHERE timestamp < datetime('now', '-{} days')
                AND sync_status = 'synced'
            '''.format(self.config.conversation_retention_days))
            
            # Remove old metrics
            await db.execute('''
                DELETE FROM usage_metrics 
                WHERE timestamp < datetime('now', '-30 days')
                AND sync_status = 'synced'
            ''')
            
            # Clean up synced offline queue items
            await db.execute('''
                DELETE FROM offline_queue 
                WHERE sync_status = 'synced' 
                AND created_at < datetime('now', '-7 days')
            ''')
            
            # Vacuum to reclaim space
            await db.execute('VACUUM')
            
            await db.commit()
    
    async def backup_to_persistent(self):
        """Backup tmpfs database to persistent storage"""
        try:
            # Use aiosqlite backup API
            async with aiosqlite.connect(self.db_path) as source:
                async with aiosqlite.connect(self.config.backup_path) as backup:
                    await source.backup(backup)
            
            logger.info(f"Database backed up to {self.config.backup_path}")
            
        except Exception as e:
            logger.error(f"Backup failed: {e}")
    
    async def restore_from_backup(self):
        """Restore database from backup if exists"""
        if os.path.exists(self.config.backup_path):
            try:
                async with aiosqlite.connect(self.config.backup_path) as source:
                    async with aiosqlite.connect(self.db_path) as target:
                        await source.backup(target)
                
                logger.info("Database restored from backup")
                
            except Exception as e:
                logger.error(f"Restore failed: {e}")


class CacheSyncManager:
    """Manages periodic sync of cached data to cloud"""
    
    def __init__(self, cache: ConversationCache, sync_callback: Optional[callable] = None):
        self.cache = cache
        self.sync_callback = sync_callback
        self.is_running = False
        self.sync_task = None
        
    async def start(self):
        """Start periodic sync"""
        self.is_running = True
        self.sync_task = asyncio.create_task(self._sync_loop())
        logger.info("Cache sync manager started")
        
    async def stop(self):
        """Stop periodic sync"""
        self.is_running = False
        if self.sync_task:
            self.sync_task.cancel()
        logger.info("Cache sync manager stopped")
        
    async def _sync_loop(self):
        """Main sync loop"""
        while self.is_running:
            try:
                # Perform sync
                await self.sync_pending_data()
                
                # Cleanup old data
                await self.cache.cleanup_old_data()
                
                # Backup to persistent storage
                await self.cache.backup_to_persistent()
                
                # Wait for next sync
                await asyncio.sleep(self.cache.config.sync_interval_seconds)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Sync loop error: {e}")
                await asyncio.sleep(60)  # Wait before retry
    
    async def sync_pending_data(self):
        """Sync pending data to cloud"""
        if not self.sync_callback:
            return
        
        items = await self.cache.get_unsynced_items()
        
        if not items:
            return
        
        logger.info(f"Syncing {len(items)} items to cloud")
        
        try:
            # Call sync callback
            success = await self.sync_callback(items)
            
            if success:
                await self.cache.mark_synced(items)
                logger.info(f"Successfully synced {len(items)} items")
            else:
                await self.cache.mark_sync_failed(items, "Sync callback failed")
                
        except Exception as e:
            logger.error(f"Sync error: {e}")
            await self.cache.mark_sync_failed(items, str(e))


# Example usage and testing
if __name__ == "__main__":
    async def test_conversation_cache():
        """Test conversation cache functionality"""
        logger.info("Testing conversation cache...")
        
        # Create cache
        cache = ConversationCache()
        await cache.initialize()
        
        # Test saving conversation
        conv_id = await cache.save_conversation(
            user_input="Hello Pommai",
            toy_response="Hi there! I'm so happy to talk with you!",
            toy_id="test-toy-001",
            was_offline=False,
            duration_seconds=3.5
        )
        logger.info(f"Saved conversation: {conv_id}")
        
        # Test offline response
        response = await cache.get_offline_response("greeting")
        logger.info(f"Offline response: {response}")
        
        # Test toy configuration
        await cache.save_toy_configuration({
            'toy_id': 'test-toy-001',
            'name': 'Test Pommai',
            'is_for_kids': True,
            'safety_level': 'strict',
            'wake_word': 'hey pommai'
        })
        
        config = await cache.get_toy_configuration('test-toy-001')
        logger.info(f"Toy config: {config}")
        
        # Test safety event
        await cache.log_safety_event(
            event_type='blocked_content',
            severity='medium',
            content='User asked about violence',
            toy_id='test-toy-001',
            is_urgent=False
        )
        
        # Test metrics
        await cache.log_metric('conversation_count', 1, 'test-toy-001')
        
        # Test statistics
        stats = await cache.get_usage_statistics('test-toy-001')
        logger.info(f"Usage stats: {stats}")
        
        # Test sync
        unsynced = await cache.get_unsynced_items()
        logger.info(f"Unsynced items: {len(unsynced)}")
        
        # Test history
        history = await cache.get_conversation_history('test-toy-001')
        logger.info(f"Conversation history: {len(history)} items")
        
        logger.info("Conversation cache test completed!")
    
    # Run test
    asyncio.run(test_conversation_cache())
