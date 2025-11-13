/**
 * Tests for Conflict Resolver
 * 
 * Tests conflict detection and resolution strategies
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConflictResolver,
  ConflictStrategy,
  ConflictType,
  resolveConflicts
} from '../conflict-resolver.js';

describe('ConflictResolver', () => {
  let resolver;
  let localConfig;
  let remoteConfig;

  beforeEach(() => {
    resolver = new ConflictResolver();

    localConfig = {
      projects: {
        proj1: { name: 'Project 1', path: '/local/path' }
      },
      active_project: 'proj1',
      lastModified: 1000
    };

    remoteConfig = {
      projects: {
        proj1: { name: 'Project 1', path: '/remote/path' }
      },
      active_project: 'proj1',
      lastModified: 2000
    };
  });

  describe('Simple Strategies', () => {
    it('should resolve with REMOTE_WINS strategy', () => {
      resolver = new ConflictResolver({ strategy: ConflictStrategy.REMOTE_WINS });

      const result = resolver.resolve(localConfig, remoteConfig);

      expect(result.resolved).toEqual(remoteConfig);
      expect(result.strategy).toBe(ConflictStrategy.REMOTE_WINS);
    });

    it('should resolve with LOCAL_WINS strategy', () => {
      resolver = new ConflictResolver({ strategy: ConflictStrategy.LOCAL_WINS });

      const result = resolver.resolve(localConfig, remoteConfig);

      expect(result.resolved).toEqual(localConfig);
      expect(result.strategy).toBe(ConflictStrategy.LOCAL_WINS);
    });

    it('should resolve with MOST_RECENT strategy', () => {
      resolver = new ConflictResolver({ strategy: ConflictStrategy.MOST_RECENT });

      const result = resolver.resolve(localConfig, remoteConfig);

      // Remote is more recent (2000 > 1000)
      expect(result.resolved).toEqual(remoteConfig);
    });

    it('should use local when local is more recent', () => {
      resolver = new ConflictResolver({ strategy: ConflictStrategy.MOST_RECENT });

      localConfig.lastModified = 3000;

      const result = resolver.resolve(localConfig, remoteConfig);

      expect(result.resolved).toEqual(localConfig);
    });
  });

  describe('No Conflicts', () => {
    it('should handle identical configs', () => {
      const config = { a: 1, b: 2 };

      const result = resolver.resolve(config, config);

      expect(result.resolved).toEqual(config);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should handle non-conflicting additions', () => {
      const local = { a: 1, b: 2 };
      const remote = { a: 1, b: 2, c: 3 };

      const result = resolver.resolve(local, remote);

      expect(result.resolved).toEqual({ a: 1, b: 2, c: 3 });
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('Primitive Conflicts', () => {
    it('should detect primitive value conflicts', () => {
      const local = { value: 'local' };
      const remote = { value: 'remote' };

      const result = resolver.resolve(local, remote);

      expect(result.hasConflicts()).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]).toMatchObject({
        path: 'value',
        type: ConflictType.MODIFIED_BOTH,
        localValue: 'local',
        remoteValue: 'remote'
      });
    });

    it('should auto-resolve primitive conflicts with remote value', () => {
      const local = { value: 'local' };
      const remote = { value: 'remote' };

      const result = resolver.resolve(local, remote);

      expect(result.resolved.value).toBe('remote');
      expect(result.autoResolved).toBe(1);
    });

    it('should return null for manual resolution', () => {
      resolver = new ConflictResolver({ strategy: ConflictStrategy.MANUAL });

      const local = { value: 'local' };
      const remote = { value: 'remote' };

      const result = resolver.resolve(local, remote);

      expect(result.conflicts[0].resolution).toBeNull();
      expect(result.needsManualResolution()).toBe(true);
    });
  });

  describe('Object Conflicts', () => {
    it('should deep merge nested objects', () => {
      const local = {
        nested: {
          a: 1,
          b: 2,
          local_only: 'local'
        }
      };

      const remote = {
        nested: {
          a: 1,
          b: 3,
          remote_only: 'remote'
        }
      };

      const result = resolver.resolve(local, remote);

      expect(result.resolved.nested).toMatchObject({
        a: 1,
        b: 3, // Remote wins for primitives
        local_only: 'local',
        remote_only: 'remote'
      });
    });

    it('should detect conflicts in nested objects', () => {
      const local = {
        nested: { value: 'local' }
      };

      const remote = {
        nested: { value: 'remote' }
      };

      const result = resolver.resolve(local, remote);

      expect(result.hasConflicts()).toBe(true);
      expect(result.conflicts[0].path).toBe('nested.value');
    });

    it('should handle deeply nested conflicts', () => {
      const local = {
        a: { b: { c: { d: 'local' } } }
      };

      const remote = {
        a: { b: { c: { d: 'remote' } } }
      };

      const result = resolver.resolve(local, remote);

      expect(result.conflicts[0].path).toBe('a.b.c.d');
      expect(result.resolved.a.b.c.d).toBe('remote');
    });
  });

  describe('Array Conflicts', () => {
    it('should detect array conflicts', () => {
      const local = { items: [1, 2, 3] };
      const remote = { items: [1, 2, 4] };

      const result = resolver.resolve(local, remote);

      expect(result.hasConflicts()).toBe(true);
      expect(result.conflicts[0]).toMatchObject({
        path: 'items',
        type: ConflictType.ARRAY_DIVERGED
      });
    });

    it('should merge arrays with union strategy', () => {
      resolver = new ConflictResolver({ arrayMergeStrategy: 'union' });

      const local = { items: [1, 2, 3] };
      const remote = { items: [2, 3, 4] };

      const result = resolver.resolve(local, remote);

      expect(result.resolved.items).toEqual([1, 2, 3, 4]);
    });

    it('should use local array with local strategy', () => {
      resolver = new ConflictResolver({ arrayMergeStrategy: 'local' });

      const local = { items: [1, 2, 3] };
      const remote = { items: [4, 5, 6] };

      const result = resolver.resolve(local, remote);

      expect(result.resolved.items).toEqual([1, 2, 3]);
    });

    it('should use remote array with remote strategy', () => {
      resolver = new ConflictResolver({ arrayMergeStrategy: 'remote' });

      const local = { items: [1, 2, 3] };
      const remote = { items: [4, 5, 6] };

      const result = resolver.resolve(local, remote);

      expect(result.resolved.items).toEqual([4, 5, 6]);
    });

    it('should handle array of objects union', () => {
      resolver = new ConflictResolver({ arrayMergeStrategy: 'union' });

      const local = { items: [{ id: 1 }, { id: 2 }] };
      const remote = { items: [{ id: 2 }, { id: 3 }] };

      const result = resolver.resolve(local, remote);

      expect(result.resolved.items).toHaveLength(3);
    });
  });

  describe('Type Change Conflicts', () => {
    it('should detect type changes', () => {
      const local = { value: 'string' };
      const remote = { value: 123 };

      const result = resolver.resolve(local, remote);

      expect(result.hasConflicts()).toBe(true);
      expect(result.conflicts[0].type).toBe(ConflictType.TYPE_CHANGE);
    });

    it('should prefer remote for type changes', () => {
      const local = { value: 'string' };
      const remote = { value: 123 };

      const result = resolver.resolve(local, remote);

      expect(result.resolved.value).toBe(123);
    });

    it('should handle object to array type change', () => {
      const local = { value: { a: 1 } };
      const remote = { value: [1, 2, 3] };

      const result = resolver.resolve(local, remote);

      expect(Array.isArray(result.resolved.value)).toBe(true);
    });
  });

  describe('Deletion Conflicts', () => {
    it('should detect deleted local with base', () => {
      const local = {};
      const remote = { deleted_field: 'value' };
      const base = { deleted_field: 'original' };

      const result = resolver.resolve(local, remote, base);

      expect(result.hasConflicts()).toBe(true);
      expect(result.conflicts[0].type).toBe(ConflictType.DELETED_LOCAL);
    });

    it('should detect deleted remote with base', () => {
      const local = { deleted_field: 'value' };
      const remote = {};
      const base = { deleted_field: 'original' };

      const result = resolver.resolve(local, remote, base);

      expect(result.hasConflicts()).toBe(true);
      expect(result.conflicts[0].type).toBe(ConflictType.DELETED_REMOTE);
    });

    it('should auto-resolve deleted local conflicts', () => {
      const local = {};
      const remote = { field: 'value' };
      const base = { field: 'original' };

      const result = resolver.resolve(local, remote, base);

      // AUTO strategy should prefer remote (restore deleted field)
      expect(result.resolved.field).toBe('value');
    });

    it('should auto-resolve deleted remote conflicts', () => {
      const local = { field: 'value' };
      const remote = {};
      const base = { field: 'original' };

      const result = resolver.resolve(local, remote, base);

      // AUTO strategy should preserve local (keep modified field)
      expect(result.resolved.field).toBe('value');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple conflicts at different levels', () => {
      const local = {
        a: 'local',
        b: { nested: 'local' },
        c: [1, 2, 3]
      };

      const remote = {
        a: 'remote',
        b: { nested: 'remote' },
        c: [4, 5, 6]
      };

      const result = resolver.resolve(local, remote);

      expect(result.conflicts.length).toBeGreaterThan(1);
      expect(result.hasConflicts()).toBe(true);
    });

    it('should handle mixed additions and modifications', () => {
      const local = {
        existing: 'local_modified',
        local_only: 'local'
      };

      const remote = {
        existing: 'remote_modified',
        remote_only: 'remote'
      };

      const result = resolver.resolve(local, remote);

      expect(result.resolved).toMatchObject({
        existing: 'remote_modified',
        local_only: 'local',
        remote_only: 'remote'
      });
    });

    it('should handle real-world config structure', () => {
      const local = {
        projects: {
          proj1: { name: 'Project 1', path: '/local/path1' },
          proj2: { name: 'Project 2', path: '/local/path2' }
        },
        groups: {
          group1: { name: 'Group 1', projects: ['proj1'] }
        },
        active_project: 'proj1'
      };

      const remote = {
        projects: {
          proj1: { name: 'Project 1', path: '/remote/path1' },
          proj3: { name: 'Project 3', path: '/remote/path3' }
        },
        groups: {
          group1: { name: 'Group 1', projects: ['proj1', 'proj3'] }
        },
        active_project: 'proj3'
      };

      const result = resolver.resolve(local, remote);

      // Should merge all projects
      expect(Object.keys(result.resolved.projects)).toContain('proj1');
      expect(Object.keys(result.resolved.projects)).toContain('proj2');
      expect(Object.keys(result.resolved.projects)).toContain('proj3');

      // Should use remote for conflicting values
      expect(result.resolved.active_project).toBe('proj3');
    });
  });

  describe('Helper Function', () => {
    it('should work with resolveConflicts helper', () => {
      const local = { value: 'local' };
      const remote = { value: 'remote' };

      const result = resolveConflicts(local, remote, {
        strategy: ConflictStrategy.LOCAL_WINS
      });

      expect(result.resolved).toEqual(local);
    });

    it('should pass options correctly', () => {
      const local = { items: [1, 2] };
      const remote = { items: [3, 4] };

      const result = resolveConflicts(local, remote, {
        strategy: ConflictStrategy.AUTO,
        arrayMergeStrategy: 'union'
      });

      expect(result.resolved.items).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Conflict Statistics', () => {
    it('should track conflict statistics', () => {
      const local = {
        a: 'local',
        b: 'local',
        c: 'same'
      };

      const remote = {
        a: 'remote',
        b: 'remote',
        c: 'same'
      };

      const result = resolver.resolve(local, remote);

      expect(result.conflicts).toHaveLength(2);
      expect(result.autoResolved).toBe(2);
      expect(result.manualRequired).toBe(0);
    });

    it('should track manual resolution requirements', () => {
      resolver = new ConflictResolver({ strategy: ConflictStrategy.MANUAL });

      const local = { a: 'local', b: 'local' };
      const remote = { a: 'remote', b: 'remote' };

      const result = resolver.resolve(local, remote);

      expect(result.manualRequired).toBe(2);
      expect(result.needsManualResolution()).toBe(true);
    });
  });
});

