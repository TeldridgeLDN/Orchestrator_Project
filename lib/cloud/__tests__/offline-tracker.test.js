/**
 * Tests for Offline Change Tracker
 * 
 * Tests change detection, persistence, and offline mode
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import {
  OfflineTracker,
  ChangeType,
  ChangeEntry
} from '../offline-tracker.js';

describe('OfflineTracker', () => {
  let tracker;
  const testStoragePath = './.cache/test-offline-changes.json';

  beforeEach(async () => {
    tracker = new OfflineTracker({
      storagePath: testStoragePath,
      autoSave: false // Disable for tests
    });

    await tracker.initialize();
  });

  afterEach(async () => {
    // Clean up test storage
    if (existsSync(testStoragePath)) {
      await unlink(testStoragePath);
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(tracker.initialized).toBe(true);
      expect(tracker.isOnline).toBe(true);
      expect(tracker.changes).toEqual([]);
    });

    it('should skip duplicate initialization', async () => {
      await tracker.initialize();
      await tracker.initialize();

      expect(tracker.initialized).toBe(true);
    });

    it('should create storage directory if missing', async () => {
      const tracker2 = new OfflineTracker({
        storagePath: './.cache/nested/deep/changes.json'
      });

      await tracker2.initialize();

      expect(tracker2.initialized).toBe(true);
    });
  });

  describe('Change Tracking - Full Snapshot', () => {
    it('should track full config snapshot', async () => {
      const config = { projects: { p1: { name: 'Project 1' } } };

      const changes = await tracker.trackChange(config);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe(ChangeType.REPLACE);
      expect(changes[0].path).toBe('$root');
      expect(changes[0].value).toEqual(config);
    });

    it('should not track duplicate snapshots', async () => {
      const config = { value: 'test' };

      await tracker.trackChange(config);
      const changes = await tracker.trackChange(config);

      expect(changes).toHaveLength(0);
      expect(tracker.changes).toHaveLength(1);
    });

    it('should track multiple config changes', async () => {
      const config1 = { value: 'test1' };
      const config2 = { value: 'test2' };
      const config3 = { value: 'test3' };

      await tracker.trackChange(config1);
      await tracker.trackChange(config2);
      await tracker.trackChange(config3);

      expect(tracker.changes).toHaveLength(3);
    });
  });

  describe('Change Tracking - Granular', () => {
    beforeEach(async () => {
      tracker = new OfflineTracker({
        storagePath: testStoragePath,
        trackFullSnapshot: false,
        autoSave: false
      });
      await tracker.initialize();
    });

    it('should detect created fields', async () => {
      const config = { newField: 'value' };

      const changes = await tracker.trackChange(config);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe(ChangeType.CREATE);
    });

    it('should detect updated fields', async () => {
      const config1 = { field: 'value1' };
      const config2 = { field: 'value2' };

      await tracker.trackChange(config1);
      const changes = await tracker.trackChange(config2);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe(ChangeType.UPDATE);
      expect(changes[0].path).toBe('field');
      expect(changes[0].value).toBe('value2');
    });

    it('should detect deleted fields', async () => {
      const config1 = { field: 'value', keep: 'this' };
      const config2 = { keep: 'this' };

      await tracker.trackChange(config1);
      const changes = await tracker.trackChange(config2);

      expect(changes.some(c => c.type === ChangeType.DELETE && c.path === 'field')).toBe(true);
    });

    it('should detect nested changes', async () => {
      const config1 = { nested: { deep: { value: 'old' } } };
      const config2 = { nested: { deep: { value: 'new' } } };

      await tracker.trackChange(config1);
      const changes = await tracker.trackChange(config2);

      expect(changes).toHaveLength(1);
      expect(changes[0].path).toBe('nested.deep.value');
      expect(changes[0].value).toBe('new');
    });

    it('should handle complex config changes', async () => {
      const config1 = {
        projects: { p1: { name: 'Project 1' } },
        groups: { g1: { name: 'Group 1' } },
        active: 'p1'
      };

      const config2 = {
        projects: {
          p1: { name: 'Project 1 Updated' },
          p2: { name: 'Project 2' }
        },
        groups: { g1: { name: 'Group 1' } },
        active: 'p2'
      };

      await tracker.trackChange(config1);
      const changes = await tracker.trackChange(config2);

      expect(changes.length).toBeGreaterThan(1);
      expect(changes.some(c => c.path === 'active')).toBe(true);
      expect(changes.some(c => c.path.includes('p2'))).toBe(true);
    });
  });

  describe('Pending Changes', () => {
    it('should track pending changes', async () => {
      await tracker.trackChange({ value: 'test' });

      const pending = tracker.getPendingChanges();

      expect(pending).toHaveLength(1);
      expect(pending[0].synced).toBe(false);
    });

    it('should mark changes as synced', async () => {
      const changes = await tracker.trackChange({ value: 'test' });
      const changeId = changes[0].id;

      await tracker.markSynced([changeId]);

      const pending = tracker.getPendingChanges();
      expect(pending).toHaveLength(0);
      expect(tracker.changes[0].synced).toBe(true);
    });

    it('should mark multiple changes as synced', async () => {
      const changes1 = await tracker.trackChange({ value: 'test1' });
      const changes2 = await tracker.trackChange({ value: 'test2' });

      await tracker.markSynced([changes1[0].id, changes2[0].id]);

      const pending = tracker.getPendingChanges();
      expect(pending).toHaveLength(0);
    });
  });

  describe('Change Management', () => {
    it('should clear synced changes', async () => {
      const changes = await tracker.trackChange({ value: 'test1' });
      await tracker.trackChange({ value: 'test2' });

      await tracker.markSynced([changes[0].id]);
      const cleared = await tracker.clearSynced();

      expect(cleared).toBe(1);
      expect(tracker.changes).toHaveLength(1);
    });

    it('should clear all changes', async () => {
      await tracker.trackChange({ value: 'test1' });
      await tracker.trackChange({ value: 'test2' });

      await tracker.clearAll();

      expect(tracker.changes).toHaveLength(0);
      expect(tracker.lastSnapshot).toBeNull();
    });

    it('should enforce max changes limit', async () => {
      tracker.options.maxChanges = 5;

      for (let i = 0; i < 10; i++) {
        await tracker.trackChange({ value: `test${i}` });
      }

      expect(tracker.changes).toHaveLength(5);
    });
  });

  describe('Online/Offline Status', () => {
    it('should track online/offline status', () => {
      expect(tracker.isOnline).toBe(true);

      tracker.setOnlineStatus(false);
      expect(tracker.isOnline).toBe(false);

      tracker.setOnlineStatus(true);
      expect(tracker.isOnline).toBe(true);
    });

    it('should emit online/offline events', () => {
      const onlineSpy = vi.fn();
      const offlineSpy = vi.fn();

      tracker.on('online', onlineSpy);
      tracker.on('offline', offlineSpy);

      tracker.setOnlineStatus(false);
      expect(offlineSpy).toHaveBeenCalled();

      tracker.setOnlineStatus(true);
      expect(onlineSpy).toHaveBeenCalled();
    });

    it('should not emit duplicate status events', () => {
      const offlineSpy = vi.fn();
      tracker.on('offline', offlineSpy);

      tracker.setOnlineStatus(false);
      tracker.setOnlineStatus(false);

      expect(offlineSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', async () => {
      await tracker.trackChange({ value: 'test1' });
      await tracker.trackChange({ value: 'test2' });

      const stats = tracker.getStats();

      expect(stats.totalChanges).toBe(2);
      expect(stats.pendingChanges).toBe(2);
      expect(stats.syncedChanges).toBe(0);
      expect(stats.isOnline).toBe(true);
      expect(stats.hasSnapshot).toBe(true);
    });

    it('should track oldest and newest pending changes', async () => {
      await tracker.trackChange({ value: 'test1' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await tracker.trackChange({ value: 'test2' });

      const stats = tracker.getStats();

      expect(stats.oldestPending).toBeLessThan(stats.newestPending);
    });
  });

  describe('Apply Changes', () => {
    beforeEach(async () => {
      tracker = new OfflineTracker({
        storagePath: testStoragePath,
        trackFullSnapshot: false,
        autoSave: false
      });
      await tracker.initialize();
    });

    it('should apply pending changes to base config', async () => {
      const base = { field: 'original', keep: 'this' };

      await tracker.trackChange(base);
      await tracker.trackChange({ field: 'updated', keep: 'this', new: 'field' });

      const result = tracker.applyPendingChanges({});

      expect(result.field).toBe('updated');
      expect(result.new).toBe('field');
    });

    it('should apply full snapshot changes', async () => {
      tracker = new OfflineTracker({
        storagePath: testStoragePath,
        trackFullSnapshot: true,
        autoSave: false
      });
      await tracker.initialize();

      const newConfig = { completely: 'different' };
      await tracker.trackChange(newConfig);

      const result = tracker.applyPendingChanges({ old: 'config' });

      expect(result).toEqual(newConfig);
      expect(result.old).toBeUndefined();
    });
  });

  describe('Events', () => {
    it('should emit changes-tracked event', async () => {
      const spy = vi.fn();
      tracker.on('changes-tracked', spy);

      await tracker.trackChange({ value: 'test' });

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toHaveLength(1);
    });

    it('should emit changes-synced event', async () => {
      const spy = vi.fn();
      tracker.on('changes-synced', spy);

      const changes = await tracker.trackChange({ value: 'test' });
      await tracker.markSynced([changes[0].id]);

      expect(spy).toHaveBeenCalled();
    });

    it('should emit changes-cleared event', async () => {
      const spy = vi.fn();
      tracker.on('changes-cleared', spy);

      await tracker.trackChange({ value: 'test' });
      await tracker.clearAll();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('ChangeEntry', () => {
    it('should create change entry with unique ID', () => {
      const entry1 = new ChangeEntry(ChangeType.UPDATE, 'path', 'value');
      const entry2 = new ChangeEntry(ChangeType.UPDATE, 'path', 'value');

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('should serialize to JSON', () => {
      const entry = new ChangeEntry(ChangeType.UPDATE, 'path', 'value');
      const json = entry.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('type');
      expect(json).toHaveProperty('path');
      expect(json).toHaveProperty('value');
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('synced');
    });

    it('should deserialize from JSON', () => {
      const entry = new ChangeEntry(ChangeType.UPDATE, 'path', 'value');
      const json = entry.toJSON();
      const restored = ChangeEntry.fromJSON(json);

      expect(restored.id).toBe(entry.id);
      expect(restored.type).toBe(entry.type);
      expect(restored.path).toBe(entry.path);
      expect(restored.value).toBe(entry.value);
    });
  });
});

