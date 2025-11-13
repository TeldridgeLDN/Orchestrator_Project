/**
 * Tests for Sync State Manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  SyncStateManager, 
  SyncState, 
  SyncOperationType,
  SyncResultStatus 
} from '../sync-state-manager.js';

describe('SyncStateManager', () => {
  let manager;

  beforeEach(() => {
    manager = new SyncStateManager();
  });

  describe('Initialization', () => {
    it('should initialize with idle state', () => {
      expect(manager.getState()).toBe(SyncState.IDLE);
      expect(manager.isOnline).toBe(true);
      expect(manager.isSyncing()).toBe(false);
    });

    it('should initialize with empty queue', () => {
      expect(manager.getQueue()).toEqual([]);
    });

    it('should initialize statistics', () => {
      const stats = manager.getStats();
      expect(stats.totalSyncs).toBe(0);
      expect(stats.successfulSyncs).toBe(0);
      expect(stats.failedSyncs).toBe(0);
    });
  });

  describe('State Management', () => {
    it('should transition to syncing state', async () => {
      const operation = {
        type: SyncOperationType.UPLOAD,
        data: { test: 'data' }
      };

      await manager.startSync(operation);
      expect(manager.getState()).toBe(SyncState.SYNCING);
      expect(manager.isSyncing()).toBe(true);
    });

    it('should transition to uploading state', async () => {
      await manager.startSync({ type: SyncOperationType.UPLOAD });
      manager.transitionToUploading();
      expect(manager.getState()).toBe(SyncState.UPLOADING);
    });

    it('should transition to downloading state', async () => {
      await manager.startSync({ type: SyncOperationType.DOWNLOAD });
      manager.transitionToDownloading();
      expect(manager.getState()).toBe(SyncState.DOWNLOADING);
    });

    it('should transition to conflict resolution state', async () => {
      await manager.startSync({ type: SyncOperationType.BIDIRECTIONAL });
      manager.transitionToResolvingConflicts();
      expect(manager.getState()).toBe(SyncState.RESOLVING_CONFLICTS);
    });

    it('should transition to error state', () => {
      const errorHandler = vi.fn();
      manager.on('sync-error', errorHandler);
      
      const error = new Error('Test error');
      manager.transitionToError(error);
      expect(manager.getState()).toBe(SyncState.ERROR);
      expect(errorHandler).toHaveBeenCalledOnce();
    });

    it('should reject sync while already syncing', async () => {
      await manager.startSync({ type: SyncOperationType.UPLOAD });
      
      await expect(
        manager.startSync({ type: SyncOperationType.DOWNLOAD })
      ).rejects.toThrow('Cannot start sync while in syncing state');
    });

    it('should track state history', async () => {
      await manager.startSync({ type: SyncOperationType.UPLOAD });
      manager.transitionToUploading();
      
      const history = manager.getStateHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].to).toBe(SyncState.UPLOADING);
    });
  });

  describe('Sync Operations', () => {
    it('should start sync operation', async () => {
      const operation = {
        type: SyncOperationType.UPLOAD,
        data: { test: 'data' }
      };

      const result = await manager.startSync(operation);
      
      expect(result.id).toBeDefined();
      expect(result.type).toBe(SyncOperationType.UPLOAD);
      expect(result.status).toBe('in-progress');
      expect(result.startedAt).toBeDefined();
    });

    it('should complete sync operation successfully', async () => {
      await manager.startSync({ type: SyncOperationType.UPLOAD });
      
      manager.completeSync({
        status: SyncResultStatus.SUCCESS,
        message: 'Sync completed'
      });

      expect(manager.getState()).toBe(SyncState.IDLE);
      expect(manager.isSyncing()).toBe(false);
      
      const stats = manager.getStats();
      expect(stats.totalSyncs).toBe(1);
      expect(stats.successfulSyncs).toBe(1);
    });

    it('should handle failed sync operation', async () => {
      await manager.startSync({ type: SyncOperationType.UPLOAD });
      
      manager.completeSync({
        status: SyncResultStatus.FAILED,
        error: 'Network error'
      });

      const stats = manager.getStats();
      expect(stats.failedSyncs).toBe(1);
      expect(stats.lastError).toBeDefined();
      expect(stats.lastError.message).toBe('Network error');
    });

    it('should emit sync events', async () => {
      const startHandler = vi.fn();
      const completeHandler = vi.fn();

      manager.on('sync-start', startHandler);
      manager.on('sync-complete', completeHandler);

      await manager.startSync({ type: SyncOperationType.UPLOAD });
      manager.completeSync({ status: SyncResultStatus.SUCCESS });

      expect(startHandler).toHaveBeenCalledOnce();
      expect(completeHandler).toHaveBeenCalledOnce();
    });
  });

  describe('Online/Offline Handling', () => {
    it('should handle offline status', () => {
      manager.setOnlineStatus(false);
      expect(manager.isOnline).toBe(false);
      expect(manager.getState()).toBe(SyncState.OFFLINE);
    });

    it('should handle online status', () => {
      manager.setOnlineStatus(false);
      manager.setOnlineStatus(true);
      expect(manager.isOnline).toBe(true);
      expect(manager.getState()).toBe(SyncState.IDLE);
    });

    it('should emit online/offline events', () => {
      const onlineHandler = vi.fn();
      const offlineHandler = vi.fn();

      manager.on('online', onlineHandler);
      manager.on('offline', offlineHandler);

      manager.setOnlineStatus(false);
      manager.setOnlineStatus(true);

      expect(offlineHandler).toHaveBeenCalledOnce();
      expect(onlineHandler).toHaveBeenCalledOnce();
    });

    it('should queue operations when offline', async () => {
      manager.setOnlineStatus(false);
      
      const result = await manager.startSync({
        type: SyncOperationType.UPLOAD,
        data: { test: 'data' }
      });

      expect(result.status).toBe(SyncResultStatus.QUEUED);
      expect(manager.getQueue().length).toBe(1);
    });
  });

  describe('Queue Management', () => {
    it('should queue operations', () => {
      const operation = {
        type: SyncOperationType.UPLOAD,
        data: { test: 'data' }
      };

      const result = manager.queueOperation(operation);
      
      expect(result.status).toBe(SyncResultStatus.QUEUED);
      expect(result.operationId).toBeDefined();
      expect(manager.getQueue().length).toBe(1);
    });

    it('should enforce queue size limit', () => {
      const smallManager = new SyncStateManager({ maxQueueSize: 3 });
      
      for (let i = 0; i < 5; i++) {
        smallManager.queueOperation({
          type: SyncOperationType.UPLOAD,
          data: { index: i }
        });
      }

      expect(smallManager.getQueue().length).toBe(3);
    });

    it('should process queued operations', async () => {
      manager.setOnlineStatus(false);
      
      // Queue some operations
      await manager.startSync({ type: SyncOperationType.UPLOAD });
      await manager.startSync({ type: SyncOperationType.DOWNLOAD });

      // Set online but don't auto-process - manually call processQueue
      manager.autoProcessQueue = false;
      manager.setOnlineStatus(true);
      
      const results = await manager.processQueue();
      expect(results.length).toBe(2);
    });

    it('should emit queue events', () => {
      const queueHandler = vi.fn();
      manager.on('operation-queued', queueHandler);

      manager.queueOperation({
        type: SyncOperationType.UPLOAD
      });

      expect(queueHandler).toHaveBeenCalledOnce();
    });

    it('should clear queue', () => {
      manager.queueOperation({ type: SyncOperationType.UPLOAD });
      manager.queueOperation({ type: SyncOperationType.DOWNLOAD });
      
      const cleared = manager.clearQueue();
      
      expect(cleared).toBe(2);
      expect(manager.getQueue().length).toBe(0);
    });

    it('should remove specific operation from queue', () => {
      const result1 = manager.queueOperation({ type: SyncOperationType.UPLOAD });
      manager.queueOperation({ type: SyncOperationType.DOWNLOAD });
      
      const removed = manager.removeFromQueue(result1.operationId);
      
      expect(removed).toBe(true);
      expect(manager.getQueue().length).toBe(1);
    });

    it('should not process queue while offline', async () => {
      manager.queueOperation({ type: SyncOperationType.UPLOAD });
      manager.setOnlineStatus(false);
      
      const results = await manager.processQueue();
      expect(results.length).toBe(0);
    });

    it('should not process queue while syncing', async () => {
      manager.queueOperation({ type: SyncOperationType.UPLOAD });
      await manager.startSync({ type: SyncOperationType.DOWNLOAD });
      
      const results = await manager.processQueue();
      expect(results.length).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should track sync statistics', async () => {
      await manager.startSync({ type: SyncOperationType.UPLOAD });
      manager.completeSync({ status: SyncResultStatus.SUCCESS });

      await manager.startSync({ type: SyncOperationType.DOWNLOAD });
      manager.completeSync({ status: SyncResultStatus.FAILED, error: 'Error' });

      const stats = manager.getStats();
      expect(stats.totalSyncs).toBe(2);
      expect(stats.successfulSyncs).toBe(1);
      expect(stats.failedSyncs).toBe(1);
    });

    it('should track conflict resolution', async () => {
      await manager.startSync({ type: SyncOperationType.BIDIRECTIONAL });
      manager.transitionToResolvingConflicts();

      const stats = manager.getStats();
      expect(stats.conflictsResolved).toBe(1);
    });

    it('should reset statistics', () => {
      manager.stats.totalSyncs = 10;
      manager.resetStats();

      const stats = manager.getStats();
      expect(stats.totalSyncs).toBe(0);
    });

    it('should include current operation in stats', async () => {
      await manager.startSync({ type: SyncOperationType.UPLOAD });

      const stats = manager.getStats();
      expect(stats.currentOperation).toBeDefined();
      expect(stats.currentOperation.type).toBe(SyncOperationType.UPLOAD);
    });
  });

  describe('Error Handling', () => {
    it('should handle transition errors', () => {
      expect(() => {
        manager.transitionToUploading();
      }).toThrow('Cannot transition to uploading from idle');
    });

    it('should handle missing operation type', async () => {
      await expect(
        manager.startSync({})
      ).rejects.toThrow('Operation type is required');
    });

    it('should track last error', () => {
      const errorHandler = vi.fn();
      manager.on('sync-error', errorHandler);
      
      const error = new Error('Test error');
      manager.transitionToError(error);

      const stats = manager.getStats();
      expect(stats.lastError).toBeDefined();
      expect(stats.lastError.message).toBe('Test error');
      expect(errorHandler).toHaveBeenCalledOnce();
    });
  });

  describe('Auto-process Queue', () => {
    it('should auto-process queue when coming online', async () => {
      const processHandler = vi.fn();
      manager.on('queue-process', processHandler);

      manager.setOnlineStatus(false);
      await manager.startSync({ type: SyncOperationType.UPLOAD });
      manager.setOnlineStatus(true);

      // Give time for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(processHandler).toHaveBeenCalled();
    });

    it('should not auto-process if disabled', async () => {
      const noAutoManager = new SyncStateManager({ autoProcessQueue: false });
      const processHandler = vi.fn();
      noAutoManager.on('queue-process', processHandler);

      noAutoManager.setOnlineStatus(false);
      await noAutoManager.startSync({ type: SyncOperationType.UPLOAD });
      noAutoManager.setOnlineStatus(true);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(processHandler).not.toHaveBeenCalled();
    });
  });
});

