#!/usr/bin/env python3
"""
Sync Manager Module for Pommai Smart Toy
Handles background synchronization of cached data to cloud
"""

import asyncio
import logging
import json
import time
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from enum import Enum

from conversation_cache import ConversationCache, SyncStatus, DataType

logger = logging.getLogger(__name__)


class SyncPriority(Enum):
    """Priority levels for sync operations"""
    HIGH = 0      # Safety events, urgent data
    NORMAL = 1    # Regular conversations
    LOW = 2       # Metrics, non-critical data


class SyncManager:
    """Manages background synchronization of cached data to cloud"""
    
    def __init__(self, cache: ConversationCache, connection):
        self.cache = cache
        self.connection = connection
        self.is_running = False
        self.sync_task = None
        self.last_sync_time = datetime.now()
        
        # Sync configuration
        self.sync_interval = 300  # 5 minutes
        self.batch_size = 50
        self.max_retries = 3
        self.retry_delay = 30  # seconds
        
        # Statistics
        self.sync_stats = {
            'successful_syncs': 0,
            'failed_syncs': 0,
            'items_synced': 0,
            'last_error': None
        }
    
    async def start(self):
        """Start the sync manager"""
        if self.is_running:
            logger.warning("Sync manager already running")
            return
        
        self.is_running = True
        self.sync_task = asyncio.create_task(self._sync_loop())
        logger.info("Sync manager started")
    
    async def stop(self):
        """Stop the sync manager"""
        self.is_running = False
        
        if self.sync_task:
            self.sync_task.cancel()
            try:
                await self.sync_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Sync manager stopped")
    
    async def _sync_loop(self):
        """Main sync loop"""
        while self.is_running:
            try:
                # Check if we have network connection
                if self.connection and self.connection.is_authenticated:
                    await self._perform_sync()
                else:
                    logger.debug("No connection available, skipping sync")
                
                # Wait for next sync interval
                await asyncio.sleep(self.sync_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Sync loop error: {e}")
                self.sync_stats['last_error'] = str(e)
                await asyncio.sleep(self.retry_delay)
    
    async def _perform_sync(self):
        """Perform a sync operation"""
        try:
            logger.info("Starting sync operation")
            start_time = time.time()
            
            # Sync different data types in priority order
            await self._sync_safety_events()
            await self._sync_conversations()
            await self._sync_usage_metrics()
            await self._sync_error_logs()
            
            # Update statistics
            self.sync_stats['successful_syncs'] += 1
            self.last_sync_time = datetime.now()
            
            duration = time.time() - start_time
            logger.info(f"Sync completed in {duration:.2f} seconds")
            
        except Exception as e:
            logger.error(f"Sync operation failed: {e}")
            self.sync_stats['failed_syncs'] += 1
            self.sync_stats['last_error'] = str(e)
            raise
    
    async def _sync_safety_events(self):
        """Sync safety events (highest priority)"""
        try:
            events = await self.cache.get_unsynced_safety_events(limit=self.batch_size)
            
            if not events:
                return
            
            logger.info(f"Syncing {len(events)} safety events")
            
            # Prepare batch
            batch_data = {
                'type': 'safety_events_batch',
                'device_id': self.connection.config.DEVICE_ID,
                'events': [
                    {
                        'id': event['id'],
                        'event_type': event['event_type'],
                        'severity': event['severity'],
                        'content': event['content'],
                        'toy_id': event['toy_id'],
                        'timestamp': event['timestamp'],
                        'is_urgent': event['is_urgent']
                    }
                    for event in events
                ]
            }
            
            # Send to server
            await self.connection.send_message(batch_data)
            
            # Wait for acknowledgment
            response = await self._wait_for_response('safety_events_ack', timeout=10)
            
            if response and response.get('success'):
                # Mark as synced
                event_ids = [e['id'] for e in events]
                await self.cache.mark_safety_events_synced(event_ids)
                self.sync_stats['items_synced'] += len(events)
                logger.info(f"Successfully synced {len(events)} safety events")
            else:
                logger.error("Failed to sync safety events - no acknowledgment")
                
        except Exception as e:
            logger.error(f"Error syncing safety events: {e}")
    
    async def _sync_conversations(self):
        """Sync conversation history"""
        try:
            conversations = await self.cache.get_unsynced_conversations(limit=self.batch_size)
            
            if not conversations:
                return
            
            logger.info(f"Syncing {len(conversations)} conversations")
            
            # Prepare batch
            batch_data = {
                'type': 'conversations_batch',
                'device_id': self.connection.config.DEVICE_ID,
                'conversations': [
                    {
                        'id': conv['conversation_id'],
                        'timestamp': conv['timestamp'],
                        'user_input': conv['user_input'],
                        'toy_response': conv['toy_response'],
                        'toy_id': conv['toy_id'],
                        'was_offline': conv['was_offline'],
                        'is_safe': conv['is_safe'],
                        'duration_seconds': conv.get('duration_seconds', 0)
                    }
                    for conv in conversations
                ]
            }
            
            # Send to server
            await self.connection.send_message(batch_data)
            
            # Wait for acknowledgment
            response = await self._wait_for_response('conversations_ack', timeout=10)
            
            if response and response.get('success'):
                # Mark as synced
                conv_ids = [c['conversation_id'] for c in conversations]
                await self.cache.mark_conversations_synced(conv_ids)
                self.sync_stats['items_synced'] += len(conversations)
                logger.info(f"Successfully synced {len(conversations)} conversations")
            else:
                logger.error("Failed to sync conversations - no acknowledgment")
                
        except Exception as e:
            logger.error(f"Error syncing conversations: {e}")
    
    async def _sync_usage_metrics(self):
        """Sync usage metrics"""
        try:
            metrics = await self.cache.get_unsynced_metrics(limit=self.batch_size)
            
            if not metrics:
                return
            
            logger.info(f"Syncing {len(metrics)} usage metrics")
            
            # Prepare batch
            batch_data = {
                'type': 'metrics_batch',
                'device_id': self.connection.config.DEVICE_ID,
                'metrics': [
                    {
                        'id': metric['id'],
                        'metric_type': metric['metric_type'],
                        'metric_value': metric['metric_value'],
                        'toy_id': metric['toy_id'],
                        'timestamp': metric['timestamp'],
                        'metadata': json.loads(metric.get('metadata', '{}'))
                    }
                    for metric in metrics
                ]
            }
            
            # Send to server
            await self.connection.send_message(batch_data)
            
            # Wait for acknowledgment
            response = await self._wait_for_response('metrics_ack', timeout=10)
            
            if response and response.get('success'):
                # Mark as synced
                metric_ids = [m['id'] for m in metrics]
                await self.cache.mark_metrics_synced(metric_ids)
                self.sync_stats['items_synced'] += len(metrics)
                logger.info(f"Successfully synced {len(metrics)} metrics")
            else:
                logger.error("Failed to sync metrics - no acknowledgment")
                
        except Exception as e:
            logger.error(f"Error syncing metrics: {e}")
    
    async def _sync_error_logs(self):
        """Sync error logs"""
        try:
            # Get error logs from offline queue
            errors = await self.cache.get_offline_queue_items(
                data_type='error_log',
                limit=self.batch_size
            )
            
            if not errors:
                return
            
            logger.info(f"Syncing {len(errors)} error logs")
            
            # Prepare batch
            batch_data = {
                'type': 'error_logs_batch',
                'device_id': self.connection.config.DEVICE_ID,
                'errors': [json.loads(e['payload']) for e in errors]
            }
            
            # Send to server
            await self.connection.send_message(batch_data)
            
            # Wait for acknowledgment
            response = await self._wait_for_response('error_logs_ack', timeout=10)
            
            if response and response.get('success'):
                # Mark as synced
                error_ids = [e['id'] for e in errors]
                await self.cache.mark_offline_queue_synced(error_ids)
                self.sync_stats['items_synced'] += len(errors)
                logger.info(f"Successfully synced {len(errors)} error logs")
            else:
                logger.error("Failed to sync error logs - no acknowledgment")
                
        except Exception as e:
            logger.error(f"Error syncing error logs: {e}")
    
    async def _wait_for_response(self, response_type: str, timeout: float = 5.0) -> Optional[Dict[str, Any]]:
        """Wait for a specific response type from server"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            message = await self.connection.get_message()
            
            if message and message.get('type') == response_type:
                return message
            
            await asyncio.sleep(0.1)
        
        return None
    
    async def force_sync(self):
        """Force an immediate sync"""
        logger.info("Force sync requested")
        
        if self.connection and self.connection.is_authenticated:
            await self._perform_sync()
        else:
            logger.warning("Cannot force sync - no connection available")
    
    def get_sync_status(self) -> Dict[str, Any]:
        """Get current sync status and statistics"""
        return {
            'is_running': self.is_running,
            'last_sync_time': self.last_sync_time.isoformat(),
            'next_sync_time': (self.last_sync_time + timedelta(seconds=self.sync_interval)).isoformat(),
            'statistics': self.sync_stats,
            'connection_available': self.connection and self.connection.is_authenticated
        }
    
    async def sync_toy_configuration(self, toy_id: str):
        """Sync a specific toy configuration"""
        try:
            # Request latest configuration from server
            await self.connection.send_message({
                'type': 'get_toy_config',
                'toyId': toy_id
            })
            
            response = await self._wait_for_response('toy_config', timeout=10)
            
            if response and 'config' in response:
                # Update local cache
                await self.cache.save_toy_configuration(response['config'])
                logger.info(f"Successfully synced toy configuration for {toy_id}")
                return True
            else:
                logger.error(f"Failed to sync toy configuration for {toy_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error syncing toy configuration: {e}")
            return False
