/**
 * Tests for Command Corrections Storage
 * 
 * @module utils/__tests__/command-corrections-store.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  recordCorrection,
  getCorrectionsForInput,
  getMostCommonCorrection,
  getAllCorrections,
  getStatistics,
  clearCorrections,
  deleteCorrection,
  exportCorrections,
  importCorrections,
  getConfig,
  updateConfig,
  clearCache,
  __testing__
} from '../command-corrections-store.js';

const {
  normalizePattern,
  createEmptyStore,
  generateCorrectionId,
  getCorrectionsPath
} = __testing__;

describe('Command Corrections Store', () => {
  
  // Use temp directory for tests
  const testDir = path.join(os.tmpdir(), 'orchestrator-test-corrections');
  
  beforeEach(async () => {
    // Clear cache
    clearCache();
    
    // Setup test directory
    updateConfig({
      storage: {
        directory: testDir,
        filename: 'test-corrections.json'
      }
    });
    
    // Ensure clean state
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
    
    await clearCorrections();
  });
  
  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
    
    clearCache();
  });
  
  describe('normalizePattern', () => {
    
    it('should convert to lowercase', () => {
      expect(normalizePattern('HELLO WORLD')).toBe('hello world');
      expect(normalizePattern('Switch To Project')).toBe('switch to project');
    });
    
    it('should trim whitespace', () => {
      expect(normalizePattern('  hello  ')).toBe('hello');
      expect(normalizePattern('\thello\n')).toBe('hello');
    });
    
    it('should normalize multiple spaces', () => {
      expect(normalizePattern('hello    world')).toBe('hello world');
      expect(normalizePattern('a  b  c')).toBe('a b c');
    });
    
    it('should handle combined normalization', () => {
      expect(normalizePattern('  HELLO   WORLD  ')).toBe('hello world');
    });
  });
  
  describe('createEmptyStore', () => {
    
    it('should create valid structure', () => {
      const store = createEmptyStore();
      
      expect(store).toHaveProperty('version');
      expect(store).toHaveProperty('created');
      expect(store).toHaveProperty('updated');
      expect(store).toHaveProperty('corrections');
      expect(store).toHaveProperty('metadata');
    });
    
    it('should have empty corrections array', () => {
      const store = createEmptyStore();
      
      expect(Array.isArray(store.corrections)).toBe(true);
      expect(store.corrections.length).toBe(0);
    });
    
    it('should have zero metadata counts', () => {
      const store = createEmptyStore();
      
      expect(store.metadata.totalCorrections).toBe(0);
      expect(store.metadata.uniquePatterns).toBe(0);
    });
  });
  
  describe('recordCorrection', () => {
    
    it('should record a new correction', async () => {
      const result = await recordCorrection('switch projct', 'cmd1', 'cmd2');
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('input', 'switch projct');
      expect(result).toHaveProperty('topMatchId', 'cmd1');
      expect(result).toHaveProperty('selectedId', 'cmd2');
      expect(result).toHaveProperty('frequency', 1);
    });
    
    it('should normalize input pattern', async () => {
      const result = await recordCorrection('  SWITCH  PROJCT  ', 'cmd1', 'cmd2');
      
      expect(result.input).toBe('switch projct');
    });
    
    it('should increment frequency for duplicate corrections', async () => {
      await recordCorrection('switch projct', 'cmd1', 'cmd2');
      const result = await recordCorrection('switch projct', 'cmd1', 'cmd2');
      
      expect(result.frequency).toBe(2);
    });
    
    it('should update lastSeen for duplicates', async () => {
      const first = await recordCorrection('switch projct', 'cmd1', 'cmd2');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const second = await recordCorrection('switch projct', 'cmd1', 'cmd2');
      
      expect(new Date(second.lastSeen).getTime()).toBeGreaterThan(
        new Date(first.firstSeen).getTime()
      );
    });
    
    it('should store metadata context', async () => {
      const result = await recordCorrection('test', 'cmd1', 'cmd2', {
        context: { session: 'abc123' }
      });
      
      expect(result.contexts).toBeDefined();
      expect(result.contexts.length).toBe(1);
      expect(result.contexts[0]).toHaveProperty('session', 'abc123');
    });
    
    it('should keep only last 10 contexts', async () => {
      for (let i = 0; i < 15; i++) {
        await recordCorrection('test', 'cmd1', 'cmd2', {
          context: { index: i }
        });
      }
      
      const corrections = await getCorrectionsForInput('test');
      expect(corrections[0].contexts.length).toBe(10);
    });
  });
  
  describe('getCorrectionsForInput', () => {
    
    it('should return corrections for specific input', async () => {
      await recordCorrection('switch projct', 'cmd1', 'cmd2');
      await recordCorrection('list projects', 'cmd3', 'cmd4');
      
      const corrections = await getCorrectionsForInput('switch projct');
      
      expect(corrections.length).toBe(1);
      expect(corrections[0].input).toBe('switch projct');
    });
    
    it('should return empty array for unknown input', async () => {
      const corrections = await getCorrectionsForInput('unknown');
      
      expect(Array.isArray(corrections)).toBe(true);
      expect(corrections.length).toBe(0);
    });
    
    it('should sort by frequency descending', async () => {
      await recordCorrection('test', 'cmd1', 'cmd2');
      await recordCorrection('test', 'cmd1', 'cmd2');
      await recordCorrection('test', 'cmd1', 'cmd3');
      await recordCorrection('test', 'cmd1', 'cmd3');
      await recordCorrection('test', 'cmd1', 'cmd3');
      
      const corrections = await getCorrectionsForInput('test');
      
      expect(corrections[0].selectedId).toBe('cmd3');
      expect(corrections[0].frequency).toBe(3);
      expect(corrections[1].selectedId).toBe('cmd2');
      expect(corrections[1].frequency).toBe(2);
    });
    
    it('should normalize input when querying', async () => {
      await recordCorrection('test input', 'cmd1', 'cmd2');
      
      const corrections = await getCorrectionsForInput('  TEST  INPUT  ');
      
      expect(corrections.length).toBe(1);
    });
  });
  
  describe('getMostCommonCorrection', () => {
    
    it('should return most frequent correction', async () => {
      await recordCorrection('test', 'cmd1', 'cmd2');
      await recordCorrection('test', 'cmd1', 'cmd3');
      await recordCorrection('test', 'cmd1', 'cmd3');
      
      const most = await getMostCommonCorrection('test');
      
      expect(most.selectedId).toBe('cmd3');
      expect(most.frequency).toBe(2);
    });
    
    it('should return null for unknown input', async () => {
      const most = await getMostCommonCorrection('unknown');
      
      expect(most).toBeNull();
    });
  });
  
  describe('getAllCorrections', () => {
    
    it('should return all corrections', async () => {
      await recordCorrection('test1', 'cmd1', 'cmd2');
      await recordCorrection('test2', 'cmd1', 'cmd2');
      await recordCorrection('test3', 'cmd1', 'cmd2');
      
      const all = await getAllCorrections();
      
      expect(all.length).toBe(3);
    });
    
    it('should filter by minimum frequency', async () => {
      await recordCorrection('test1', 'cmd1', 'cmd2');
      await recordCorrection('test1', 'cmd1', 'cmd2');
      await recordCorrection('test2', 'cmd1', 'cmd2');
      
      const filtered = await getAllCorrections({ minFrequency: 2 });
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].input).toBe('test1');
    });
    
    it('should sort by frequency', async () => {
      await recordCorrection('test1', 'cmd1', 'cmd2');
      await recordCorrection('test2', 'cmd1', 'cmd2');
      await recordCorrection('test2', 'cmd1', 'cmd2');
      await recordCorrection('test3', 'cmd1', 'cmd2');
      await recordCorrection('test3', 'cmd1', 'cmd2');
      await recordCorrection('test3', 'cmd1', 'cmd2');
      
      const sorted = await getAllCorrections({ sortBy: 'frequency' });
      
      expect(sorted[0].input).toBe('test3');
      expect(sorted[1].input).toBe('test2');
      expect(sorted[2].input).toBe('test1');
    });
    
    it('should limit results', async () => {
      for (let i = 0; i < 10; i++) {
        await recordCorrection(`test${i}`, 'cmd1', 'cmd2');
      }
      
      const limited = await getAllCorrections({ limit: 5 });
      
      expect(limited.length).toBe(5);
    });
  });
  
  describe('getStatistics', () => {
    
    it('should return statistics', async () => {
      await recordCorrection('test1', 'cmd1', 'cmd2');
      await recordCorrection('test1', 'cmd1', 'cmd2');
      await recordCorrection('test2', 'cmd1', 'cmd2');
      
      const stats = await getStatistics();
      
      expect(stats).toHaveProperty('totalCorrections');
      expect(stats).toHaveProperty('totalFrequency');
      expect(stats).toHaveProperty('uniquePatterns');
      expect(stats).toHaveProperty('averageFrequency');
      expect(stats).toHaveProperty('topPatterns');
    });
    
    it('should count unique patterns correctly', async () => {
      await recordCorrection('test1', 'cmd1', 'cmd2');
      await recordCorrection('test1', 'cmd1', 'cmd3');
      await recordCorrection('test2', 'cmd1', 'cmd2');
      
      const stats = await getStatistics();
      
      expect(stats.uniquePatterns).toBe(2);
    });
    
    it('should calculate total frequency', async () => {
      await recordCorrection('test1', 'cmd1', 'cmd2');
      await recordCorrection('test1', 'cmd1', 'cmd2');
      await recordCorrection('test2', 'cmd1', 'cmd2');
      
      const stats = await getStatistics();
      
      expect(stats.totalFrequency).toBe(3);
    });
  });
  
  describe('deleteCorrection', () => {
    
    it('should delete specific correction', async () => {
      const corr = await recordCorrection('test', 'cmd1', 'cmd2');
      
      const deleted = await deleteCorrection(corr.id);
      
      expect(deleted).toBe(true);
      
      const corrections = await getCorrectionsForInput('test');
      expect(corrections.length).toBe(0);
    });
    
    it('should return false for non-existent ID', async () => {
      const deleted = await deleteCorrection('non-existent-id');
      
      expect(deleted).toBe(false);
    });
  });
  
  describe('clearCorrections', () => {
    
    it('should clear all corrections', async () => {
      await recordCorrection('test1', 'cmd1', 'cmd2');
      await recordCorrection('test2', 'cmd1', 'cmd2');
      
      await clearCorrections();
      
      const all = await getAllCorrections();
      expect(all.length).toBe(0);
    });
  });
  
  describe('export and import', () => {
    
    it('should export corrections', async () => {
      await recordCorrection('test', 'cmd1', 'cmd2');
      
      const exported = await exportCorrections();
      
      expect(exported).toHaveProperty('corrections');
      expect(exported.corrections.length).toBe(1);
    });
    
    it('should import corrections (replace)', async () => {
      await recordCorrection('original', 'cmd1', 'cmd2');
      
      const data = createEmptyStore();
      data.corrections = [{
        id: 'test-id',
        input: 'imported',
        topMatchId: 'cmd3',
        selectedId: 'cmd4',
        frequency: 5,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      }];
      
      await importCorrections(data, false);
      
      const all = await getAllCorrections();
      expect(all.length).toBe(1);
      expect(all[0].input).toBe('imported');
    });
    
    it('should import corrections (merge)', async () => {
      await recordCorrection('original', 'cmd1', 'cmd2');
      
      const data = createEmptyStore();
      data.corrections = [{
        id: 'test-id',
        input: 'imported',
        topMatchId: 'cmd3',
        selectedId: 'cmd4',
        frequency: 5,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      }];
      
      await importCorrections(data, true);
      
      const all = await getAllCorrections();
      expect(all.length).toBe(2);
    });
  });
  
  describe('generateCorrectionId', () => {
    
    it('should generate unique IDs', () => {
      const id1 = generateCorrectionId();
      const id2 = generateCorrectionId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^corr_/);
      expect(id2).toMatch(/^corr_/);
    });
  });
  
  describe('persistence', () => {
    
    it('should persist corrections to file', async () => {
      await recordCorrection('test', 'cmd1', 'cmd2');
      
      // Clear cache to force reload
      clearCache();
      
      const corrections = await getCorrectionsForInput('test');
      expect(corrections.length).toBe(1);
    });
    
    it('should create storage directory if not exists', async () => {
      // Directory was cleaned in beforeEach
      await recordCorrection('test', 'cmd1', 'cmd2');
      
      const filePath = getCorrectionsPath();
      const stats = await fs.stat(filePath);
      expect(stats.isFile()).toBe(true);
    });
  });
  
});

