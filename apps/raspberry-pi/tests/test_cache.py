#!/usr/bin/env python3
"""
Test script for SQLite Conversation Cache
Tests caching, offline functionality, sync, and performance
"""

import asyncio
import sys
import os
import time
import logging
import json
import tempfile
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from conversation_cache import (
    ConversationCache, CacheConfig, CacheSyncManager,
    SyncStatus, DataType
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CacheTestSuite:
    """Test suite for conversation cache functionality"""
    
    def __init__(self):
        self.test_passed = 0
        self.test_failed = 0
        self.temp_dir = None
        
    async def run_all_tests(self):
        """Run all cache tests"""
        logger.info("=== Conversation Cache Test Suite ===\n")
        
        # Create temp directory for test database
        self.temp_dir = tempfile.TemporaryDirectory()
        
        # Run tests
        await self.test_database_initialization()
        await self.test_conversation_storage()
        await self.test_offline_responses()
        await self.test_toy_configuration()
        await self.test_safety_events()
        await self.test_metrics_logging()
        await self.test_sync_queue()
        await self.test_conversation_history()
        await self.test_popular_response_caching()
        await self.test_cleanup_and_backup()
        
        # Cleanup
        self.temp_dir.cleanup()
        
        # Print summary
        total = self.test_passed + self.test_failed
        logger.info(f"\n=== Test Summary ===")
        logger.info(f"Total tests: {total}")
        logger.info(f"Passed: {self.test_passed}")
        logger.info(f"Failed: {self.test_failed}")
        
        return self.test_failed == 0
    
    def log_test(self, name: str, passed: bool, details: str = ""):
        """Log test result"""
        if passed:
            self.test_passed += 1
            logger.info(f"✓ {name}: PASSED {details}")
        else:
            self.test_failed += 1
            logger.error(f"✗ {name}: FAILED {details}")
    
    async def test_database_initialization(self):
        """Test database creation and schema"""
        logger.info("\n1. Testing database initialization...")
        
        try:
            config = CacheConfig(
                db_path=os.path.join(self.temp_dir.name, "test_cache.db"),
                backup_path=os.path.join(self.temp_dir.name, "test_backup.db")
            )
            
            cache = ConversationCache(config)
            await cache.initialize()
            
            # Check if database file exists
            self.log_test("Database creation",
                         os.path.exists(config.db_path),
                         f"({config.db_path})")
            
            # Check if default responses were loaded
            response = await cache.get_offline_response("greeting")
            self.log_test("Default responses loaded",
                         response is not None,
                         f"(found {len(response) if response else 0} fields)")
            
        except Exception as e:
            self.log_test("Database initialization", False, str(e))
    
    async def test_conversation_storage(self):
        """Test saving and retrieving conversations"""
        logger.info("\n2. Testing conversation storage...")
        
        try:
            config = CacheConfig(
                db_path=os.path.join(self.temp_dir.name, "test_conv.db")
            )
            cache = ConversationCache(config)
            await cache.initialize()
            
            # Save conversation
            conv_id = await cache.save_conversation(
                user_input="What's the weather like?",
                toy_response="I need internet to check the weather!",
                toy_id="test-toy-001",
                was_offline=True,
                duration_seconds=2.5
            )
            
            self.log_test("Save conversation",
                         conv_id is not None,
                         f"(ID: {conv_id})")
            
            # Get conversation history
            history = await cache.get_conversation_history("test-toy-001")
            self.log_test("Retrieve history",
                         len(history) == 1,
                         f"({len(history)} conversations)")
            
            # Check conversation details
            if history:
                conv = history[0]
                self.log_test("Conversation details",
                             conv['was_offline'] == True and 
                             conv['duration_seconds'] == 2.5,
                             "(offline=True, duration=2.5s)")
            
        except Exception as e:
            self.log_test("Conversation storage", False, str(e))
    
    async def test_offline_responses(self):
        """Test offline response caching"""
        logger.info("\n3. Testing offline responses...")
        
        try:
            config = CacheConfig(
                db_path=os.path.join(self.temp_dir.name, "test_offline.db")
            )
            cache = ConversationCache(config)
            await cache.initialize()
            
            # Test each default response
            test_commands = [
                "greeting", "sing_song", "tell_joke", 
                "goodnight", "love_response", "need_help"
            ]
            
            found_count = 0
            for command in test_commands:
                response = await cache.get_offline_response(command)
                if response and response.get('text'):
                    found_count += 1
            
            self.log_test("Offline responses available",
                         found_count == len(test_commands),
                         f"({found_count}/{len(test_commands)} commands)")
            
            # Test usage tracking
            await cache.get_offline_response("greeting")
            await cache.get_offline_response("greeting")
            
            # Check usage count was updated
            import aiosqlite
            async with aiosqlite.connect(config.db_path) as db:
                cursor = await db.execute(
                    "SELECT usage_count FROM cached_responses WHERE command = ?",
                    ("greeting",)
                )
                count = (await cursor.fetchone())[0]
            
            self.log_test("Usage tracking",
                         count >= 2,
                         f"(usage_count={count})")
            
        except Exception as e:
            self.log_test("Offline responses", False, str(e))
    
    async def test_toy_configuration(self):
        """Test toy configuration caching"""
        logger.info("\n4. Testing toy configuration...")
        
        try:
            config = CacheConfig(
                db_path=os.path.join(self.temp_dir.name, "test_config.db")
            )
            cache = ConversationCache(config)
            await cache.initialize()
            
            # Save toy config
            toy_config = {
                'toy_id': 'test-toy-002',
                'name': 'Buddy Bear',
                'is_for_kids': True,
                'safety_level': 'strict',
                'wake_word': 'hey buddy',
                'voice_settings': {'speed': 1.0, 'pitch': 1.1},
                'knowledge_base': ['animals', 'nature'],
                'custom_responses': {'hello': 'Hi friend!'}
            }
            
            await cache.save_toy_configuration(toy_config)
            
            # Retrieve config
            loaded_config = await cache.get_toy_configuration('test-toy-002')
            
            self.log_test("Save toy config",
                         loaded_config is not None,
                         f"(name={loaded_config.get('name')})")
            
            # Verify complex fields
            self.log_test("Complex config fields",
                         loaded_config.get('voice_settings', {}).get('pitch') == 1.1 and
                         'animals' in loaded_config.get('knowledge_base', []),
                         "(voice & knowledge base)")
            
        except Exception as e:
            self.log_test("Toy configuration", False, str(e))
    
    async def test_safety_events(self):
        """Test safety event logging"""
        logger.info("\n5. Testing safety events...")
        
        try:
            config = CacheConfig(
                db_path=os.path.join(self.temp_dir.name, "test_safety.db")
            )
            cache = ConversationCache(config)
            await cache.initialize()
            
            # Log different types of safety events
            await cache.log_safety_event(
                event_type='blocked_content',
                severity='high',
                content='User asked about weapons',
                toy_id='test-toy-001',
                is_urgent=True,
                details={'category': 'violence', 'action': 'redirect'}
            )
            
            await cache.log_safety_event(
                event_type='time_limit_exceeded',
                severity='low',
                content='Session exceeded 30 minutes',
                toy_id='test-toy-001',
                is_urgent=False
            )
            
            # Check if events were logged
            import aiosqlite
            async with aiosqlite.connect(config.db_path) as db:
                cursor = await db.execute(
                    "SELECT COUNT(*) FROM safety_events WHERE toy_id = ?",
                    ("test-toy-001",)
                )
                count = (await cursor.fetchone())[0]
            
            self.log_test("Safety event logging",
                         count == 2,
                         f"({count} events logged)")
            
            # Check urgent event queuing
            unsynced = await cache.get_unsynced_items()
            urgent_items = [item for item in unsynced 
                           if item.get('priority', 0) >= 10]
            
            self.log_test("Urgent event priority",
                         len(urgent_items) > 0,
                         f"({len(urgent_items)} urgent items)")
            
        except Exception as e:
            self.log_test("Safety events", False, str(e))
    
    async def test_metrics_logging(self):
        """Test usage metrics"""
        logger.info("\n6. Testing metrics logging...")
        
        try:
            config = CacheConfig(
                db_path=os.path.join(self.temp_dir.name, "test_metrics.db")
            )
            cache = ConversationCache(config)
            await cache.initialize()
            
            # Log various metrics
            await cache.log_metric('session_duration', 125.5, 'test-toy-001')
            await cache.log_metric('wake_word_count', 3, 'test-toy-001')
            await cache.log_metric('cpu_usage', 25.3, 'test-toy-001',
                                 metadata={'timestamp': time.time()})
            
            # Get statistics
            stats = await cache.get_usage_statistics('test-toy-001')
            
            self.log_test("Metrics logging",
                         stats is not None,
                         f"(total_conversations={stats.get('total_conversations', 0)})")
            
        except Exception as e:
            self.log_test("Metrics logging", False, str(e))
    
    async def test_sync_queue(self):
        """Test offline sync queue"""
        logger.info("\n7. Testing sync queue...")
        
        try:
            config = CacheConfig(
                db_path=os.path.join(self.temp_dir.name, "test_sync.db")
            )
            cache = ConversationCache(config)
            await cache.initialize()
            
            # Queue different types of data
            await cache.queue_for_sync(
                DataType.CONVERSATION,
                {'conversation_id': 'test-123', 'text': 'Hello'},
                priority=5
            )
            
            await cache.queue_for_sync(
                DataType.SAFETY_EVENT,
                {'event': 'blocked', 'urgent': True},
                priority=10
            )
            
            # Get unsynced items
            items = await cache.get_unsynced_items(limit=10)
            
            self.log_test("Sync queue",
                         len(items) >= 2,
                         f"({len(items)} items queued)")
            
            # Check priority ordering
            if len(items) >= 2:
                # Higher priority items should come first
                priorities = [item.get('priority', 0) for item in items]
                is_ordered = all(priorities[i] >= priorities[i+1] 
                               for i in range(len(priorities)-1))
                
                self.log_test("Priority ordering",
                             is_ordered or len(set(priorities)) == 1,
                             f"(priorities: {priorities})")
            
            # Test marking as synced
            if items:
                await cache.mark_synced(items[:1])
                remaining = await cache.get_unsynced_items()
                
                self.log_test("Mark synced",
                             len(remaining) == len(items) - 1,
                             f"({len(remaining)} remaining)")
            
        except Exception as e:
            self.log_test("Sync queue", False, str(e))
    
    async def test_conversation_history(self):
        """Test conversation history retrieval"""
        logger.info("\n8. Testing conversation history...")
        
        try:
            config = CacheConfig(
                db_path=os.path.join(self.temp_dir.name, "test_history.db")
            )
            cache = ConversationCache(config)
            await cache.initialize()
            
            # Save multiple conversations
            toy_id = "test-toy-003"
            for i in range(5):
                await cache.save_conversation(
                    user_input=f"Question {i}",
                    toy_response=f"Answer {i}",
                    toy_id=toy_id,
                    was_offline=(i % 2 == 0),
                    duration_seconds=float(i + 1)
                )
                await asyncio.sleep(0.01)  # Ensure different timestamps
            
            # Get history
            history = await cache.get_conversation_history(toy_id, limit=3)
            
            self.log_test("History retrieval",
                         len(history) == 3,
                         f"({len(history)} conversations)")
            
            # Check ordering (newest first)
            if len(history) >= 2:
                timestamps = [h['timestamp'] for h in history]
                is_descending = all(timestamps[i] >= timestamps[i+1] 
                                  for i in range(len(timestamps)-1))
                
                self.log_test("History ordering",
                             is_descending,
                             "(newest first)")
            
            # Get statistics
            stats = await cache.get_usage_statistics(toy_id)
            
            self.log_test("Usage statistics",
                         stats['total_conversations'] == 5 and
                         stats['offline_conversations'] == 3,
                         f"(total=5, offline=3)")
            
        except Exception as e:
            self.log_test("Conversation history", False, str(e))
    
    async def test_popular_response_caching(self):
        """Test automatic caching of popular responses"""
        logger.info("\n9. Testing popular response caching...")
        
        try:
            config = CacheConfig(
                db_path=os.path.join(self.temp_dir.name, "test_popular.db")
            )
            cache = ConversationCache(config)
            await cache.initialize()
            
            # Simulate repeated conversations
            toy_id = "test-toy-004"
            common_question = "What's your favorite color?"
            common_response = "I love all the colors of the rainbow!"
            
            # Save the same conversation 6 times
            for i in range(6):
                await cache.save_conversation(
                    user_input=common_question,
                    toy_response=common_response,
                    toy_id=toy_id
                )
            
            # Try to cache as popular
            await cache.cache_popular_response(
                common_question,
                common_response,
                audio_path="responses/rainbow.opus"
            )
            
            # Check if it was cached
            import hashlib
            command_key = f"cached_{hashlib.md5(common_question.encode()).hexdigest()[:8]}"
            
            import aiosqlite
            async with aiosqlite.connect(config.db_path) as db:
                cursor = await db.execute(
                    "SELECT response_text FROM cached_responses WHERE command LIKE ?",
                    (f"cached_%",)
                )
                result = await cursor.fetchone()
            
            self.log_test("Popular response caching",
                         result is not None,
                         f"(cached: {result is not None})")
            
        except Exception as e:
            self.log_test("Popular response caching", False, str(e))
    
    async def test_cleanup_and_backup(self):
        """Test data cleanup and backup functionality"""
        logger.info("\n10. Testing cleanup and backup...")
        
        try:
            config = CacheConfig(
                db_path=os.path.join(self.temp_dir.name, "test_cleanup.db"),
                backup_path=os.path.join(self.temp_dir.name, "test_backup.db"),
                conversation_retention_days=1
            )
            cache = ConversationCache(config)
            await cache.initialize()
            
            # Create old data
            import aiosqlite
            async with aiosqlite.connect(config.db_path) as db:
                # Insert old conversation (35 days ago)
                await db.execute('''
                    INSERT INTO conversations 
                    (conversation_id, user_input, toy_response, toy_id, 
                     timestamp, sync_status)
                    VALUES (?, ?, ?, ?, datetime('now', '-35 days'), 'synced')
                ''', ('old-conv-1', 'Old question', 'Old answer', 'test-toy'))
                
                # Insert recent conversation
                await db.execute('''
                    INSERT INTO conversations 
                    (conversation_id, user_input, toy_response, toy_id)
                    VALUES (?, ?, ?, ?)
                ''', ('new-conv-1', 'New question', 'New answer', 'test-toy'))
                
                await db.commit()
            
            # Run cleanup
            await cache.cleanup_old_data()
            
            # Check if old data was removed
            async with aiosqlite.connect(config.db_path) as db:
                cursor = await db.execute("SELECT COUNT(*) FROM conversations")
                count = (await cursor.fetchone())[0]
            
            self.log_test("Data cleanup",
                         count == 1,
                         f"({count} conversations remaining)")
            
            # Test backup
            await cache.backup_to_persistent()
            
            self.log_test("Backup creation",
                         os.path.exists(config.backup_path),
                         f"({config.backup_path})")
            
            # Test restore
            if os.path.exists(config.backup_path):
                # Clear main database
                os.remove(config.db_path)
                
                # Restore from backup
                await cache.restore_from_backup()
                
                self.log_test("Backup restore",
                             os.path.exists(config.db_path),
                             "(database restored)")
            
        except Exception as e:
            self.log_test("Cleanup and backup", False, str(e))


async def test_sync_manager():
    """Test the cache sync manager"""
    logger.info("\n=== Testing Cache Sync Manager ===")
    
    # Mock sync callback
    sync_count = 0
    async def mock_sync_callback(items):
        nonlocal sync_count
        sync_count += 1
        logger.info(f"Mock sync called with {len(items)} items")
        return True  # Simulate successful sync
    
    # Create cache and sync manager
    config = CacheConfig(
        db_path="/tmp/test_sync_manager.db",
        sync_interval_seconds=2  # Fast sync for testing
    )
    cache = ConversationCache(config)
    await cache.initialize()
    
    sync_manager = CacheSyncManager(cache, mock_sync_callback)
    
    # Add some data to sync
    await cache.save_conversation(
        "Test question",
        "Test answer",
        "test-toy-sync",
        was_offline=False
    )
    
    # Start sync manager
    await sync_manager.start()
    
    # Wait for a sync cycle
    await asyncio.sleep(3)
    
    # Stop sync manager
    await sync_manager.stop()
    
    logger.info(f"Sync manager test completed (syncs: {sync_count})")
    
    # Cleanup
    os.remove(config.db_path)


async def main():
    """Run conversation cache tests"""
    print("\nPommai Conversation Cache Test")
    print("=" * 40)
    
    # Check if running on Raspberry Pi
    is_pi = os.path.exists('/sys/firmware/devicetree/base/model')
    if is_pi:
        with open('/sys/firmware/devicetree/base/model', 'r') as f:
            model = f.read()
            print(f"Running on: {model.strip()}")
    else:
        print("Running on: Development machine")
    
    print(f"Python: {sys.version.split()[0]}")
    print("=" * 40)
    
    # Run test suite
    test_suite = CacheTestSuite()
    success = await test_suite.run_all_tests()
    
    # Test sync manager
    await test_sync_manager()
    
    if success:
        print("\n✓ All tests passed!")
        return 0
    else:
        print("\n✗ Some tests failed!")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
