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
                connected_attr = getattr(self.connection, 'is_connected', None) if self.connection else None
                connected = connected_attr() if callable(connected_attr) else bool(connected_attr)
                if self.connection and connected:
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
            
            # Unified sync using cache.get_unsynced_items()
            synced_count = await self._sync_pending()
            if synced_count:
                self.sync_stats['successful_syncs'] += 1
                self.sync_stats['items_synced'] += synced_count
                self.last_sync_time = datetime.now()
            
            duration = time.time() - start_time
            logger.info(f"Sync completed in {duration:.2f} seconds; items: {synced_count}")
            
        except Exception as e:
            logger.error(f"Sync operation failed: {e}")
            self.sync_stats['failed_syncs'] += 1
            self.sync_stats['last_error'] = str(e)
            raise
    
    async def _sync_pending(self) -> int:
        """Sync pending conversations and offline queue items in a single batch.
        Returns the number of items marked synced on success."""
        items = await self.cache.get_unsynced_items(limit=self.batch_size)
        if not items:
            # Try to sync metrics even if no conversations/offline items
            metrics = await self.cache.get_unsynced_metrics(limit=self.batch_size)
            if not metrics:
                return 0
        else:
            metrics = await self.cache.get_unsynced_metrics(limit=max(0, self.batch_size - len(items)))
        
        # Group items
        conversations = [i['data'] for i in items if i.get('type') == DataType.CONVERSATION.value]
        offline_items = [
            {
                'id': i.get('id'),
                'type': i.get('type'),
                'data': i.get('data'),
                'priority': i.get('priority', 0)
            }
            for i in items if i.get('type') != DataType.CONVERSATION.value
        ]
        
        payload = {
            'type': 'sync_batch',
            'device_id': getattr(getattr(self.connection, 'config', None), 'device_id', None),
            'conversations': conversations,
            'offline': offline_items,
            'metrics': metrics,
        }
        
        # Ensure connectivity
        connected_attr = getattr(self.connection, 'is_connected', None) if self.connection else None
        connected = connected_attr() if callable(connected_attr) else bool(connected_attr)
        if not connected:
            raise RuntimeError('Not connected; cannot sync')
        
        # Send to server; no ack channel is available, so we optimistically mark synced on successful send
        await self.connection.send_message(payload)
        
        # Mark items as synced in cache
        if items:
            await self.cache.mark_synced(items)
        if metrics:
            await self.cache.mark_metrics_synced([m['id'] for m in metrics])
        total = len(items) + len(metrics)
        logger.info(f"Marked {total} items as synced (conversations/offline: {len(items)}, metrics: {len(metrics)})")
        return total
    
    async def force_sync(self):
        """Force an immediate sync"""
        logger.info("Force sync requested")
        
        connected_attr = getattr(self.connection, 'is_connected', None) if self.connection else None
        connected = connected_attr() if callable(connected_attr) else bool(connected_attr)
        if self.connection and connected:
            await self._perform_sync()
        else:
            logger.warning("Cannot force sync - no connection available")
    
    def get_sync_status(self) -> Dict[str, Any]:
        """Get current sync status and statistics"""
        connected_attr = getattr(self.connection, 'is_connected', None) if self.connection else None
        connected = connected_attr() if callable(connected_attr) else bool(connected_attr)
        return {
            'is_running': self.is_running,
            'last_sync_time': self.last_sync_time.isoformat(),
            'next_sync_time': (self.last_sync_time + timedelta(seconds=self.sync_interval)).isoformat(),
            'statistics': self.sync_stats,
            'connection_available': connected
        }
    
    async def sync_toy_configuration(self, toy_id: str):
        """Request and cache the latest toy configuration"""
        try:
            await self.connection.send_message({
                'type': 'get_toy_config',
                'toyId': toy_id
            })
            # Without a generic message queue, we rely on server pushing config_update
            # which the main client handles; return True to indicate request was sent.
            logger.info(f"Requested toy configuration for {toy_id}")
            return True
        except Exception as e:
            logger.error(f"Error syncing toy configuration: {e}")
            return False
