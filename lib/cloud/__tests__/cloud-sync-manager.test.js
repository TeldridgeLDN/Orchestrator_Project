/**
 * Tests for Cloud Sync Manager
 * 
 * Tests upload/download mechanisms with encryption integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CloudSyncManager } from '../cloud-sync-manager.js';
import { FirebaseCloudProvider } from '../firebase-provider.js';
import { SyncStateManager } from '../sync-state-manager.js';
import * as encryption from '../../utils/sync-encryption.js';

// Mock Firebase provider
vi.mock('../firebase-provider.js', () => ({
  FirebaseCloudProvider: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    getUser: vi.fn().mockResolvedValue({ userId: 'test-user' }),
    createUser: vi.fn().mockResolvedValue(undefined),
    getUserConfig: vi.fn().mockResolvedValue(null),
    updateUserConfig: vi.fn().mockResolvedValue(undefined),
    registerDevice: vi.fn().mockResolvedValue(undefined),
    addHistoryEntry: vi.fn().mockResolvedValue(undefined),
    updateDeviceStats: vi.fn().mockResolvedValue(undefined),
    getHistory: vi.fn().mockResolvedValue([]),
    getAllDevices: vi.fn().mockResolvedValue([])
  }))
}));

// Mock encryption utilities
vi.mock('../../utils/sync-encryption.js', async () => {
  const actual = await vi.importActual('../../utils/sync-encryption.js');
  return {
    ...actual,
    loadOrCreateKey: vi.fn().mockResolvedValue({
      key: Buffer.from('test-encryption-key-32-bytes!!'),
      keyId: 'test-key-id'
    }),
    encryptData: vi.fn().mockImplementation(async (data) => ({
      data: Buffer.from(data).toString('base64'),
      iv: 'test-iv',
      authTag: 'test-auth-tag',
      algorithm: 'aes-256-gcm'
    })),
    decryptData: vi.fn().mockImplementation(async (encrypted) => {
      return Buffer.from(encrypted.data, 'base64').toString('utf8');
    }),
    calculateHash: vi.fn().mockImplementation((data) => {
      return `hash-${data.length}`;
    })
  };
});

describe('CloudSyncManager', () => {
  let manager;
  let mockProvider;
  let testConfig;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Create manager
    manager = new CloudSyncManager({
      firebaseConfig: { apiKey: 'test-key' },
      deviceName: 'test-device',
      encryptionEnabled: true
    });

    mockProvider = manager.provider;

    // Test config
    testConfig = {
      projects: {
        'project1': { name: 'Project 1' }
      },
      active_project: 'project1',
      lastModified: Date.now()
    };
  });

  afterEach(async () => {
    if (manager) {
      await manager.close();
    }
  });

  describe('Initialization', () => {
    it('should initialize with user ID', async () => {
      await manager.initialize('test-user', 'test-passphrase');

      expect(manager.initialized).toBe(true);
      expect(manager.options.userId).toBe('test-user');
      expect(mockProvider.initialize).toHaveBeenCalled();
      expect(mockProvider.getOrCreateUser).toHaveBeenCalledWith('test-user', expect.any(Object));
      expect(mockProvider.registerDevice).toHaveBeenCalled();
    });

    it('should skip duplicate initialization', async () => {
      await manager.initialize('test-user');
      await manager.initialize('test-user');

      expect(mockProvider.initialize).toHaveBeenCalledOnce();
    });

    it('should initialize encryption when enabled', async () => {
      await manager.initialize('test-user', 'test-passphrase');

      expect(encryption.loadOrCreateKey).toHaveBeenCalledWith('test-passphrase');
      expect(manager.encryptionKey).toBeTruthy();
      expect(manager.keyId).toBe('test-key-id');
    });

    it('should skip encryption when disabled', async () => {
      manager.options.encryptionEnabled = false;
      await manager.initialize('test-user');

      expect(encryption.loadOrCreateKey).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockProvider.initialize.mockRejectedValueOnce(new Error('Init failed'));

      await expect(manager.initialize('test-user'))
        .rejects.toThrow('Init failed');
    });
  });

  describe('Upload Operations', () => {
    beforeEach(async () => {
      await manager.initialize('test-user', 'test-passphrase');
    });

    it('should upload config successfully', async () => {
      mockProvider.getUserConfig.mockResolvedValueOnce({ version: 1 });

      const result = await manager.upload(testConfig);

      expect(result.success).toBe(true);
      expect(result.version).toBe(2);
      expect(result.encrypted).toBe(true);
      expect(mockProvider.updateUserConfig).toHaveBeenCalled();
      expect(mockProvider.addHistoryEntry).toHaveBeenCalled();
      expect(mockProvider.updateDeviceStats).toHaveBeenCalled();
    });

    it('should encrypt data when encryption is enabled', async () => {
      mockProvider.getUserConfig.mockResolvedValueOnce({ version: 1 });

      await manager.upload(testConfig);

      expect(encryption.encryptData).toHaveBeenCalled();
      
      const uploadCall = mockProvider.updateUserConfig.mock.calls[0][1];
      expect(uploadCall.encryption).toBeDefined();
      expect(uploadCall.encryption.algorithm).toBe('aes-256-gcm');
    });

    it('should not encrypt when encryption is disabled', async () => {
      manager.options.encryptionEnabled = false;
      mockProvider.getUserConfig.mockResolvedValueOnce({ version: 1 });

      await manager.upload(testConfig);

      expect(encryption.encryptData).not.toHaveBeenCalled();
      
      const uploadCall = mockProvider.updateUserConfig.mock.calls[0][1];
      expect(uploadCall.encryption).toBeNull();
    });

    it('should increment version number', async () => {
      mockProvider.getUserConfig.mockResolvedValueOnce({ version: 5 });

      const result = await manager.upload(testConfig);

      expect(result.version).toBe(6);
      
      const uploadCall = mockProvider.updateUserConfig.mock.calls[0][1];
      expect(uploadCall.version).toBe(6);
    });

    it('should create version 1 when no remote config exists', async () => {
      mockProvider.getUserConfig.mockResolvedValueOnce(null);

      const result = await manager.upload(testConfig);

      expect(result.version).toBe(1);
    });

    it('should include metadata in upload', async () => {
      mockProvider.getUserConfig.mockResolvedValueOnce({ version: 1 });

      await manager.upload(testConfig);

      const uploadCall = mockProvider.updateUserConfig.mock.calls[0][1];
      expect(uploadCall.metadata).toBeDefined();
      expect(uploadCall.metadata.projectCount).toBe(1);
      expect(uploadCall.metadata.activeProject).toBe('project1');
    });

    it('should update device statistics', async () => {
      mockProvider.getUserConfig.mockResolvedValueOnce({ version: 1 });

      await manager.upload(testConfig);

      expect(mockProvider.updateDeviceStats).toHaveBeenCalledWith(
        'test-user',
        expect.any(String),
        { uploadsCount: 1 }
      );
    });

    it('should handle upload errors', async () => {
      mockProvider.getUserConfig.mockRejectedValueOnce(new Error('Upload failed'));

      await expect(manager.upload(testConfig))
        .rejects.toThrow('Upload failed');

      expect(manager.stateManager.getState().currentState).toBe('error');
    });

    it('should require initialization', async () => {
      const uninitManager = new CloudSyncManager();

      await expect(uninitManager.upload(testConfig))
        .rejects.toThrow('not initialized');
    });
  });

  describe('Download Operations', () => {
    beforeEach(async () => {
      await manager.initialize('test-user', 'test-passphrase');
    });

    it('should download config successfully', async () => {
      const remoteData = {
        version: 3,
        lastModified: Date.now(),
        data: Buffer.from(JSON.stringify(testConfig)).toString('base64'),
        hash: encryption.calculateHash(JSON.stringify(testConfig)),
        encryption: {
          algorithm: 'aes-256-gcm',
          iv: 'test-iv',
          authTag: 'test-auth-tag',
          keyId: 'test-key-id'
        },
        metadata: {
          projectCount: 1
        }
      };

      mockProvider.getUserConfig.mockResolvedValueOnce(remoteData);

      const result = await manager.download();

      expect(result.success).toBe(true);
      expect(result.config).toEqual(testConfig);
      expect(result.version).toBe(3);
      expect(encryption.decryptData).toHaveBeenCalled();
    });

    it('should handle no remote config', async () => {
      mockProvider.getUserConfig.mockResolvedValueOnce(null);

      const result = await manager.download();

      expect(result.success).toBe(true);
      expect(result.config).toBeNull();
      expect(result.version).toBe(0);
      expect(result.message).toContain('No remote');
    });

    it('should decrypt data when encryption is enabled', async () => {
      const remoteData = {
        version: 1,
        lastModified: Date.now(),
        data: Buffer.from(JSON.stringify(testConfig)).toString('base64'),
        hash: encryption.calculateHash(JSON.stringify(testConfig)),
        encryption: {
          algorithm: 'aes-256-gcm',
          iv: 'test-iv',
          authTag: 'test-auth-tag'
        }
      };

      mockProvider.getUserConfig.mockResolvedValueOnce(remoteData);

      await manager.download();

      expect(encryption.decryptData).toHaveBeenCalled();
    });

    it('should not decrypt when encryption is disabled', async () => {
      manager.options.encryptionEnabled = false;
      const remoteData = {
        version: 1,
        lastModified: Date.now(),
        data: JSON.stringify(testConfig),
        hash: encryption.calculateHash(JSON.stringify(testConfig))
      };

      mockProvider.getUserConfig.mockResolvedValueOnce(remoteData);

      await manager.download();

      expect(encryption.decryptData).not.toHaveBeenCalled();
    });

    it('should verify hash integrity', async () => {
      const remoteData = {
        version: 1,
        lastModified: Date.now(),
        data: Buffer.from(JSON.stringify(testConfig)).toString('base64'),
        hash: 'wrong-hash',
        encryption: {
          algorithm: 'aes-256-gcm',
          iv: 'test-iv',
          authTag: 'test-auth-tag'
        }
      };

      mockProvider.getUserConfig.mockResolvedValueOnce(remoteData);

      await expect(manager.download())
        .rejects.toThrow('hash mismatch');
    });

    it('should update device statistics', async () => {
      const remoteData = {
        version: 1,
        lastModified: Date.now(),
        data: Buffer.from(JSON.stringify(testConfig)).toString('base64'),
        hash: encryption.calculateHash(JSON.stringify(testConfig)),
        encryption: {}
      };

      mockProvider.getUserConfig.mockResolvedValueOnce(remoteData);

      await manager.download();

      expect(mockProvider.updateDeviceStats).toHaveBeenCalledWith(
        'test-user',
        expect.any(String),
        { downloadsCount: 1 }
      );
    });

    it('should handle download errors', async () => {
      mockProvider.getUserConfig.mockRejectedValueOnce(new Error('Download failed'));

      await expect(manager.download())
        .rejects.toThrow('Download failed');

      expect(manager.stateManager.getState().currentState).toBe('error');
    });

    it('should require initialization', async () => {
      const uninitManager = new CloudSyncManager();

      await expect(uninitManager.download())
        .rejects.toThrow('not initialized');
    });
  });

  describe('Bidirectional Sync', () => {
    beforeEach(async () => {
      await manager.initialize('test-user', 'test-passphrase');
    });

    it('should upload when no remote config exists', async () => {
      mockProvider.getUserConfig.mockResolvedValueOnce(null);

      const uploadSpy = vi.spyOn(manager, 'upload');

      await manager.sync(testConfig);

      expect(uploadSpy).toHaveBeenCalledWith(testConfig);
    });

    it('should do nothing when configs are identical', async () => {
      const configString = JSON.stringify(testConfig);
      const remoteData = {
        version: 1,
        lastModified: Date.now(),
        data: Buffer.from(configString).toString('base64'),
        hash: encryption.calculateHash(configString),
        encryption: {}
      };

      mockProvider.getUserConfig.mockResolvedValueOnce(remoteData);

      const result = await manager.sync(testConfig);

      expect(result.action).toBe('none');
      expect(result.message).toContain('in sync');
    });

    it('should upload when local is newer', async () => {
      const oldConfig = { ...testConfig, lastModified: Date.now() - 10000 };
      const newConfig = { ...testConfig, lastModified: Date.now() };

      const remoteData = {
        version: 1,
        lastModified: oldConfig.lastModified,
        data: Buffer.from(JSON.stringify(oldConfig)).toString('base64'),
        hash: encryption.calculateHash(JSON.stringify(oldConfig)),
        encryption: {}
      };

      mockProvider.getUserConfig.mockResolvedValueOnce(remoteData);

      const uploadSpy = vi.spyOn(manager, 'upload');

      await manager.sync(newConfig);

      expect(uploadSpy).toHaveBeenCalledWith(newConfig);
    });

    it('should download when remote is newer', async () => {
      const oldConfig = { ...testConfig, lastModified: Date.now() - 10000 };
      const newConfig = { ...testConfig, lastModified: Date.now() };

      const remoteData = {
        version: 1,
        lastModified: newConfig.lastModified,
        data: Buffer.from(JSON.stringify(newConfig)).toString('base64'),
        hash: encryption.calculateHash(JSON.stringify(newConfig)),
        encryption: {}
      };

      mockProvider.getUserConfig.mockResolvedValueOnce(remoteData);

      const result = await manager.sync(oldConfig);

      expect(result.config).toEqual(newConfig);
    });

    it('should force upload when specified', async () => {
      const remoteData = {
        version: 1,
        lastModified: Date.now(),
        data: Buffer.from(JSON.stringify({ different: 'config' })).toString('base64'),
        hash: 'different-hash',
        encryption: {}
      };

      mockProvider.getUserConfig.mockResolvedValueOnce(remoteData);

      const uploadSpy = vi.spyOn(manager, 'upload');

      await manager.sync(testConfig, { force: 'upload' });

      expect(uploadSpy).toHaveBeenCalledWith(testConfig);
    });

    it('should force download when specified', async () => {
      const remoteConfig = { different: 'config' };
      const remoteData = {
        version: 1,
        lastModified: Date.now(),
        data: Buffer.from(JSON.stringify(remoteConfig)).toString('base64'),
        hash: encryption.calculateHash(JSON.stringify(remoteConfig)),
        encryption: {}
      };

      mockProvider.getUserConfig.mockResolvedValueOnce(remoteData);

      const result = await manager.sync(testConfig, { force: 'download' });

      expect(result.config).toEqual(remoteConfig);
    });

    it('should handle sync errors', async () => {
      mockProvider.getUserConfig.mockRejectedValueOnce(new Error('Sync failed'));

      await expect(manager.sync(testConfig))
        .rejects.toThrow('Sync failed');

      expect(manager.stateManager.getState().currentState).toBe('error');
    });
  });

  describe('Status and Management', () => {
    it('should return status information', async () => {
      await manager.initialize('test-user');

      const status = manager.getStatus();

      expect(status).toMatchObject({
        initialized: true,
        userId: 'test-user',
        deviceId: expect.any(String),
        encryptionEnabled: true,
        lastSyncVersion: 0
      });
      expect(status.state).toBeDefined();
      expect(status.stats).toBeDefined();
    });

    it('should get sync history', async () => {
      await manager.initialize('test-user');

      await manager.getHistory({ limit: 10 });

      expect(mockProvider.getHistory).toHaveBeenCalledWith('test-user', { limit: 10 });
    });

    it('should get devices', async () => {
      await manager.initialize('test-user');

      await manager.getDevices();

      expect(mockProvider.getAllDevices).toHaveBeenCalledWith('test-user');
    });

    it('should set online/offline status', async () => {
      await manager.initialize('test-user');

      manager.setOnlineStatus(false);

      expect(manager.stateManager.isOnline).toBe(false);
    });

    it('should close cleanly', async () => {
      await manager.initialize('test-user');
      await manager.close();

      expect(mockProvider.close).toHaveBeenCalled();
      expect(manager.initialized).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should generate unique device IDs', () => {
      const id1 = manager._generateDeviceId();
      const id2 = manager._generateDeviceId();

      expect(id1).toMatch(/^device_[a-f0-9-]+$/);
      expect(id2).toMatch(/^device_[a-f0-9-]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should extract metadata correctly', () => {
      const config = {
        projects: { p1: {}, p2: {} },
        groups: { g1: {} },
        active_project: 'p1',
        active_group: 'g1'
      };

      const metadata = manager._extractMetadata(config);

      expect(metadata).toEqual({
        projectCount: 2,
        groupCount: 1,
        activeProject: 'p1',
        activeGroup: 'g1'
      });
    });

    it('should detect changed paths', () => {
      const oldConfig = {
        projects: { p1: { name: 'Old' } },
        groups: { g1: {} }
      };

      const newConfig = {
        projects: { p1: { name: 'New' }, p2: {} },
        settings: {}
      };

      const changed = manager._getChangedPaths(newConfig, oldConfig);

      expect(changed).toContain('projects');
      expect(changed).toContain('settings');
      expect(changed).toContain('-groups');
    });
  });
});

