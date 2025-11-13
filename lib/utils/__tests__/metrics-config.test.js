/**
 * Unit tests for metrics configuration utility
 * 
 * Tests configuration management for metrics collection including
 * enable/disable toggles, retention settings, and privacy controls.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readConfig, writeConfig } from '../config.js';
import metricsConfigModule, {
  getMetricsConfig,
  updateMetricsConfig,
  setMetricsEnabled,
  setRetentionPeriod,
  setAnonymization,
  addExcludePattern,
  removeExcludePattern,
  setCollectionScope,
  isMetricsEnabled,
  isCollectionEnabled,
  shouldExclude,
  getRetentionPeriod,
  resetMetricsConfig
} from '../metrics-config.js';

const DEFAULT_METRICS_CONFIG = metricsConfigModule.DEFAULT_METRICS_CONFIG;

describe('Metrics Configuration', () => {
  
  let originalConfig;
  
  beforeEach(async () => {
    // Save original config
    originalConfig = await readConfig();
    
    // Reset to defaults
    await resetMetricsConfig();
  });

  afterEach(async () => {
    // Restore original config
    if (originalConfig) {
      await writeConfig(originalConfig);
    }
  });

  // ==================== Basic Configuration Tests ====================

  describe('getMetricsConfig', () => {
    it('should return default configuration', async () => {
      const config = await getMetricsConfig();
      
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('retentionDays');
      expect(config).toHaveProperty('privacy');
      expect(config).toHaveProperty('collection');
      expect(config).toHaveProperty('archiving');
    });

    it('should merge with defaults for missing fields', async () => {
      const config = await getMetricsConfig();
      
      expect(config.enabled).toBe(DEFAULT_METRICS_CONFIG.enabled);
      expect(config.retentionDays).toBe(DEFAULT_METRICS_CONFIG.retentionDays);
    });
  });

  describe('updateMetricsConfig', () => {
    it('should update configuration', async () => {
      const updates = { enabled: false, retentionDays: 60 };
      const result = await updateMetricsConfig(updates);
      
      expect(result.enabled).toBe(false);
      expect(result.retentionDays).toBe(60);
    });

    it('should deep merge nested objects', async () => {
      const updates = {
        privacy: { anonymizeData: true }
      };
      
      const result = await updateMetricsConfig(updates);
      
      expect(result.privacy.anonymizeData).toBe(true);
      expect(result.privacy.excludePatterns).toBeDefined();
    });
  });

  // ==================== Enable/Disable Tests ====================

  describe('setMetricsEnabled', () => {
    it('should enable metrics collection', async () => {
      await setMetricsEnabled(true);
      
      const enabled = await isMetricsEnabled();
      expect(enabled).toBe(true);
    });

    it('should disable metrics collection', async () => {
      await setMetricsEnabled(false);
      
      const enabled = await isMetricsEnabled();
      expect(enabled).toBe(false);
    });
  });

  describe('isMetricsEnabled', () => {
    it('should return enabled state', async () => {
      await setMetricsEnabled(true);
      expect(await isMetricsEnabled()).toBe(true);
      
      await setMetricsEnabled(false);
      expect(await isMetricsEnabled()).toBe(false);
    });
  });

  // ==================== Retention Period Tests ====================

  describe('setRetentionPeriod', () => {
    it('should set retention period', async () => {
      await setRetentionPeriod(45);
      
      const period = await getRetentionPeriod();
      expect(period).toBe(45);
    });

    it('should reject invalid retention periods', async () => {
      await expect(
        setRetentionPeriod(0)
      ).rejects.toThrow('at least 1 day');
      
      await expect(
        setRetentionPeriod(-10)
      ).rejects.toThrow('at least 1 day');
    });
  });

  describe('getRetentionPeriod', () => {
    it('should return configured retention period', async () => {
      await setRetentionPeriod(90);
      
      const period = await getRetentionPeriod();
      expect(period).toBe(90);
    });
  });

  // ==================== Privacy Tests ====================

  describe('setAnonymization', () => {
    it('should enable anonymization', async () => {
      await setAnonymization(true);
      
      const config = await getMetricsConfig();
      expect(config.privacy.anonymizeData).toBe(true);
    });

    it('should disable anonymization', async () => {
      await setAnonymization(false);
      
      const config = await getMetricsConfig();
      expect(config.privacy.anonymizeData).toBe(false);
    });
  });

  describe('addExcludePattern', () => {
    it('should add exclude pattern', async () => {
      await addExcludePattern('test-.*');
      
      const config = await getMetricsConfig();
      expect(config.privacy.excludePatterns).toContain('test-.*');
    });

    it('should not add duplicate patterns', async () => {
      await addExcludePattern('duplicate');
      await addExcludePattern('duplicate');
      
      const config = await getMetricsConfig();
      const count = config.privacy.excludePatterns.filter(p => p === 'duplicate').length;
      expect(count).toBe(1);
    });
  });

  describe('removeExcludePattern', () => {
    it('should remove exclude pattern', async () => {
      await addExcludePattern('to-remove');
      await removeExcludePattern('to-remove');
      
      const config = await getMetricsConfig();
      expect(config.privacy.excludePatterns).not.toContain('to-remove');
    });

    it('should handle removing non-existent pattern', async () => {
      await expect(
        removeExcludePattern('non-existent')
      ).resolves.not.toThrow();
    });
  });

  describe('shouldExclude', () => {
    it('should exclude when metrics are disabled', async () => {
      await setMetricsEnabled(false);
      
      const excluded = await shouldExclude('anything');
      expect(excluded).toBe(true);
    });

    it('should exclude matching patterns', async () => {
      await addExcludePattern('test-.*');
      
      expect(await shouldExclude('test-skill')).toBe(true);
      expect(await shouldExclude('test-hook')).toBe(true);
      expect(await shouldExclude('other-skill')).toBe(false);
    });

    it('should not exclude non-matching names', async () => {
      await addExcludePattern('exclude-.*');
      
      const excluded = await shouldExclude('include-this');
      expect(excluded).toBe(false);
    });

    it('should handle invalid regex patterns gracefully', async () => {
      await addExcludePattern('[invalid');
      
      const excluded = await shouldExclude('test');
      expect(excluded).toBe(false);
    });
  });

  // ==================== Collection Scope Tests ====================

  describe('setCollectionScope', () => {
    it('should set collection scope', async () => {
      await setCollectionScope({
        skills: false,
        hooks: true,
        commands: true
      });
      
      const config = await getMetricsConfig();
      expect(config.collection.skills).toBe(false);
      expect(config.collection.hooks).toBe(true);
      expect(config.collection.commands).toBe(true);
    });

    it('should partially update scope', async () => {
      await setCollectionScope({ skills: false });
      
      const config = await getMetricsConfig();
      expect(config.collection.skills).toBe(false);
      expect(config.collection.hooks).toBe(true); // Still default
    });
  });

  describe('isCollectionEnabled', () => {
    it('should return collection status for type', async () => {
      await setCollectionScope({
        skills: true,
        hooks: false
      });
      
      expect(await isCollectionEnabled('skills')).toBe(true);
      expect(await isCollectionEnabled('hooks')).toBe(false);
    });

    it('should return false when metrics are disabled', async () => {
      await setMetricsEnabled(false);
      
      expect(await isCollectionEnabled('skills')).toBe(false);
      expect(await isCollectionEnabled('hooks')).toBe(false);
    });
  });

  // ==================== Reset Tests ====================

  describe('resetMetricsConfig', () => {
    it('should reset to default configuration', async () => {
      // Make some changes
      await setMetricsEnabled(false);
      await setRetentionPeriod(90);
      await setAnonymization(true);
      
      // Reset
      await resetMetricsConfig();
      
      // Verify defaults
      const config = await getMetricsConfig();
      expect(config.enabled).toBe(DEFAULT_METRICS_CONFIG.enabled);
      expect(config.retentionDays).toBe(DEFAULT_METRICS_CONFIG.retentionDays);
      expect(config.privacy.anonymizeData).toBe(DEFAULT_METRICS_CONFIG.privacy.anonymizeData);
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration', () => {
    it('should persist configuration across reads', async () => {
      await setMetricsEnabled(false);
      await setRetentionPeriod(60);
      
      // Read fresh config
      const config = await getMetricsConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.retentionDays).toBe(60);
    });

    it('should handle complex workflows', async () => {
      // Configure metrics
      await setMetricsEnabled(true);
      await setRetentionPeriod(45);
      await setAnonymization(true);
      await addExcludePattern('private-.*');
      await setCollectionScope({
        skills: true,
        hooks: true,
        commands: false
      });
      
      // Verify configuration
      const config = await getMetricsConfig();
      expect(config.enabled).toBe(true);
      expect(config.retentionDays).toBe(45);
      expect(config.privacy.anonymizeData).toBe(true);
      expect(config.privacy.excludePatterns).toContain('private-.*');
      expect(config.collection.skills).toBe(true);
      expect(config.collection.commands).toBe(false);
      
      // Verify behavior
      expect(await isMetricsEnabled()).toBe(true);
      expect(await isCollectionEnabled('skills')).toBe(true);
      expect(await isCollectionEnabled('commands')).toBe(false);
      expect(await shouldExclude('private-skill')).toBe(true);
      expect(await shouldExclude('public-skill')).toBe(false);
    });
  });
});

