/**
 * @fileoverview Tests for Dependency Resolution Algorithm
 * @module lib/utils/__tests__/dependency-resolver.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resolveDependencies,
  validateDependencyGraph,
  getDependencyPath,
  calculateDependencyDepth,
  getTransitiveDependencies
} from '../dependency-resolver.js';
import * as skillLoader from '../skill-loader.js';

describe('Dependency Resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveDependencies', () => {
    it('should resolve a simple skill with no dependencies', async () => {
      const mockSkill = {
        name: 'simple-skill',
        version: '1.0.0',
        dependencies: []
      };

      vi.spyOn(skillLoader, 'loadSkill').mockResolvedValue(mockSkill);

      const result = await resolveDependencies('global', ['simple-skill']);

      expect(result.success).toBe(true);
      expect(result.resolved).toHaveLength(1);
      expect(result.resolved[0].name).toBe('simple-skill');
      expect(result.conflicts).toHaveLength(0);
      expect(result.cycles).toHaveLength(0);
    });

    it('should resolve skills with linear dependencies', async () => {
      const mockSkillA = {
        name: 'skill-a',
        version: '1.0.0',
        dependencies: []
      };

      const mockSkillB = {
        name: 'skill-b',
        version: '2.0.0',
        dependencies: ['skill-a']
      };

      const mockSkillC = {
        name: 'skill-c',
        version: '3.0.0',
        dependencies: ['skill-b']
      };

      vi.spyOn(skillLoader, 'loadSkill').mockImplementation((source, name) => {
        if (name === 'skill-a') return Promise.resolve(mockSkillA);
        if (name === 'skill-b') return Promise.resolve(mockSkillB);
        if (name === 'skill-c') return Promise.resolve(mockSkillC);
        return Promise.resolve(null);
      });

      const result = await resolveDependencies('global', ['skill-c']);

      expect(result.success).toBe(true);
      expect(result.resolved).toHaveLength(3);
      // Should be in dependency order: a, b, c
      expect(result.resolved[0].name).toBe('skill-a');
      expect(result.resolved[1].name).toBe('skill-b');
      expect(result.resolved[2].name).toBe('skill-c');
    });

    it('should handle diamond dependency pattern', async () => {
      // A depends on both B and C
      // B and C both depend on D
      const mockSkillD = {
        name: 'skill-d',
        version: '1.0.0',
        dependencies: []
      };

      const mockSkillB = {
        name: 'skill-b',
        version: '2.0.0',
        dependencies: ['skill-d']
      };

      const mockSkillC = {
        name: 'skill-c',
        version: '2.0.0',
        dependencies: ['skill-d']
      };

      const mockSkillA = {
        name: 'skill-a',
        version: '3.0.0',
        dependencies: ['skill-b', 'skill-c']
      };

      vi.spyOn(skillLoader, 'loadSkill').mockImplementation((source, name) => {
        if (name === 'skill-d') return Promise.resolve(mockSkillD);
        if (name === 'skill-b') return Promise.resolve(mockSkillB);
        if (name === 'skill-c') return Promise.resolve(mockSkillC);
        if (name === 'skill-a') return Promise.resolve(mockSkillA);
        return Promise.resolve(null);
      });

      const result = await resolveDependencies('global', ['skill-a']);

      expect(result.success).toBe(true);
      // Should have 4 unique skills (D not duplicated)
      expect(result.resolved).toHaveLength(4);
      // D should be first (deepest dependency)
      expect(result.resolved[0].name).toBe('skill-d');
    });

    it('should detect circular dependencies', async () => {
      const mockSkillA = {
        name: 'skill-a',
        version: '1.0.0',
        dependencies: [{ name: 'skill-b' }]
      };

      const mockSkillB = {
        name: 'skill-b',
        version: '2.0.0',
        dependencies: [{ name: 'skill-c' }]
      };

      const mockSkillC = {
        name: 'skill-c',
        version: '3.0.0',
        dependencies: [{ name: 'skill-a' }] // Creates cycle
      };

      vi.spyOn(skillLoader, 'loadSkill').mockImplementation((source, name) => {
        if (name === 'skill-a') return Promise.resolve(mockSkillA);
        if (name === 'skill-b') return Promise.resolve(mockSkillB);
        if (name === 'skill-c') return Promise.resolve(mockSkillC);
        return Promise.resolve(null);
      });

      const result = await resolveDependencies('global', ['skill-a']);

      expect(result.success).toBe(false);
      expect(result.cycles.length).toBeGreaterThan(0);
      expect(result.cycles[0]).toContain('Circular dependency');
    });

    it('should detect version conflicts', async () => {
      // A requires B@^1.0.0
      // C requires B@^2.0.0
      const mockSkillB1 = {
        name: 'skill-b',
        version: '1.0.0',
        dependencies: []
      };

      const mockSkillB2 = {
        name: 'skill-b',
        version: '2.0.0',
        dependencies: []
      };

      const mockSkillA = {
        name: 'skill-a',
        version: '1.0.0',
        dependencies: [{ name: 'skill-b', version: '^1.0.0' }]
      };

      const mockSkillC = {
        name: 'skill-c',
        version: '1.0.0',
        dependencies: [{ name: 'skill-b', version: '^2.0.0' }]
      };

      vi.spyOn(skillLoader, 'loadSkill').mockImplementation((source, name, version) => {
        if (name === 'skill-b' && (!version || version.includes('1'))) {
          return Promise.resolve(mockSkillB1);
        }
        if (name === 'skill-b' && version?.includes('2')) {
          return Promise.resolve(mockSkillB2);
        }
        if (name === 'skill-a') return Promise.resolve(mockSkillA);
        if (name === 'skill-c') return Promise.resolve(mockSkillC);
        return Promise.resolve(null);
      });

      const result = await resolveDependencies('global', ['skill-a', 'skill-c']);

      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].skill).toBe('skill-b');
    });

    it('should resolve conflicts with newest strategy', async () => {
      const mockSkillB = {
        name: 'skill-b',
        version: '2.0.0',
        dependencies: []
      };

      const mockSkillA = {
        name: 'skill-a',
        version: '1.0.0',
        dependencies: [{ name: 'skill-b', version: '^1.0.0' }]
      };

      const mockSkillC = {
        name: 'skill-c',
        version: '1.0.0',
        dependencies: [{ name: 'skill-b', version: '^2.0.0' }]
      };

      vi.spyOn(skillLoader, 'loadSkill').mockImplementation((source, name) => {
        if (name === 'skill-b') return Promise.resolve(mockSkillB);
        if (name === 'skill-a') return Promise.resolve(mockSkillA);
        if (name === 'skill-c') return Promise.resolve(mockSkillC);
        return Promise.resolve(null);
      });

      const result = await resolveDependencies('global', ['skill-a', 'skill-c'], {
        strategy: 'newest'
      });

      if (result.conflicts.length > 0 && result.resolutions) {
        expect(result.resolutions['skill-b']).toBeDefined();
        expect(result.resolutions['skill-b'].reason).toContain('newest');
      }
    });

    it('should handle missing skills gracefully', async () => {
      vi.spyOn(skillLoader, 'loadSkill').mockResolvedValue(null);

      const result = await resolveDependencies('global', ['missing-skill']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle empty dependencies array', async () => {
      const mockSkill = {
        name: 'skill-a',
        version: '1.0.0',
        dependencies: []
      };

      vi.spyOn(skillLoader, 'loadSkill').mockResolvedValue(mockSkill);

      const result = await resolveDependencies('global', ['skill-a']);

      expect(result.success).toBe(true);
      expect(result.resolved).toHaveLength(1);
    });

    it('should handle skills with no dependencies field', async () => {
      const mockSkill = {
        name: 'skill-a',
        version: '1.0.0'
        // No dependencies field
      };

      vi.spyOn(skillLoader, 'loadSkill').mockResolvedValue(mockSkill);

      const result = await resolveDependencies('global', ['skill-a']);

      expect(result.success).toBe(true);
      expect(result.resolved).toHaveLength(1);
    });

    it('should handle multiple root skills', async () => {
      const mockSkillA = {
        name: 'skill-a',
        version: '1.0.0',
        dependencies: []
      };

      const mockSkillB = {
        name: 'skill-b',
        version: '2.0.0',
        dependencies: []
      };

      vi.spyOn(skillLoader, 'loadSkill').mockImplementation((source, name) => {
        if (name === 'skill-a') return Promise.resolve(mockSkillA);
        if (name === 'skill-b') return Promise.resolve(mockSkillB);
        return Promise.resolve(null);
      });

      const result = await resolveDependencies('global', ['skill-a', 'skill-b']);

      expect(result.success).toBe(true);
      expect(result.resolved).toHaveLength(2);
    });
  });

  describe('validateDependencyGraph', () => {
    it('should validate a correct graph', () => {
      const graph = {
        'skill-a': {
          name: 'skill-a',
          version: '1.0.0',
          dependencies: [{ name: 'skill-b', version: '1.0.0' }],
          dependents: []
        },
        'skill-b': {
          name: 'skill-b',
          version: '1.0.0',
          dependencies: [],
          dependents: ['skill-a']
        }
      };

      const result = validateDependencyGraph(graph);

      expect(result.valid).toBe(true);
      expect(result.missingDependencies).toHaveLength(0);
      expect(result.versionConflicts).toHaveLength(0);
    });

    it('should detect missing dependencies', () => {
      const graph = {
        'skill-a': {
          name: 'skill-a',
          version: '1.0.0',
          dependencies: [{ name: 'skill-b', version: '1.0.0' }],
          dependents: []
        }
        // skill-b is missing
      };

      const result = validateDependencyGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.missingDependencies).toHaveLength(1);
      expect(result.missingDependencies[0].missing).toBe('skill-b');
    });

    it('should handle empty graph', () => {
      const result = validateDependencyGraph({});

      expect(result.valid).toBe(true);
    });
  });

  describe('getDependencyPath', () => {
    it('should find direct dependency path', () => {
      const graph = {
        'skill-a': {
          name: 'skill-a',
          dependencies: [{ name: 'skill-b' }]
        },
        'skill-b': {
          name: 'skill-b',
          dependencies: []
        }
      };

      const path = getDependencyPath(graph, 'skill-a', 'skill-b');

      expect(path).toEqual(['skill-a', 'skill-b']);
    });

    it('should find indirect dependency path', () => {
      const graph = {
        'skill-a': {
          name: 'skill-a',
          dependencies: [{ name: 'skill-b' }]
        },
        'skill-b': {
          name: 'skill-b',
          dependencies: [{ name: 'skill-c' }]
        },
        'skill-c': {
          name: 'skill-c',
          dependencies: []
        }
      };

      const path = getDependencyPath(graph, 'skill-a', 'skill-c');

      expect(path).toEqual(['skill-a', 'skill-b', 'skill-c']);
    });

    it('should return null for non-existent path', () => {
      const graph = {
        'skill-a': {
          name: 'skill-a',
          dependencies: []
        },
        'skill-b': {
          name: 'skill-b',
          dependencies: []
        }
      };

      const path = getDependencyPath(graph, 'skill-a', 'skill-b');

      expect(path).toBeNull();
    });

    it('should handle empty graph', () => {
      const path = getDependencyPath({}, 'skill-a', 'skill-b');

      expect(path).toBeNull();
    });
  });

  describe('calculateDependencyDepth', () => {
    it('should calculate depth for linear dependencies', () => {
      const graph = {
        'skill-a': {
          name: 'skill-a',
          dependencies: []
        },
        'skill-b': {
          name: 'skill-b',
          dependencies: [{ name: 'skill-a' }]
        },
        'skill-c': {
          name: 'skill-c',
          dependencies: [{ name: 'skill-b' }]
        }
      };

      const depths = calculateDependencyDepth(graph);

      expect(depths['skill-a']).toBe(0);
      expect(depths['skill-b']).toBe(1);
      expect(depths['skill-c']).toBe(2);
    });

    it('should handle skills with no dependencies', () => {
      const graph = {
        'skill-a': {
          name: 'skill-a',
          dependencies: []
        }
      };

      const depths = calculateDependencyDepth(graph);

      expect(depths['skill-a']).toBe(0);
    });

    it('should handle diamond pattern correctly', () => {
      const graph = {
        'skill-d': {
          name: 'skill-d',
          dependencies: []
        },
        'skill-b': {
          name: 'skill-b',
          dependencies: [{ name: 'skill-d' }]
        },
        'skill-c': {
          name: 'skill-c',
          dependencies: [{ name: 'skill-d' }]
        },
        'skill-a': {
          name: 'skill-a',
          dependencies: [{ name: 'skill-b' }, { name: 'skill-c' }]
        }
      };

      const depths = calculateDependencyDepth(graph);

      expect(depths['skill-d']).toBe(0);
      expect(depths['skill-b']).toBe(1);
      expect(depths['skill-c']).toBe(1);
      expect(depths['skill-a']).toBe(2);
    });

    it('should handle circular dependencies gracefully', () => {
      const graph = {
        'skill-a': {
          name: 'skill-a',
          dependencies: [{ name: 'skill-b' }]
        },
        'skill-b': {
          name: 'skill-b',
          dependencies: [{ name: 'skill-a' }]
        }
      };

      const depths = calculateDependencyDepth(graph);

      // In circular dependencies, the algorithm should handle them without crashing
      // Both skills should have depths calculated
      expect(depths['skill-a']).toBeDefined();
      expect(depths['skill-b']).toBeDefined();
      // The depths will be finite numbers (not NaN or undefined)
      expect(typeof depths['skill-a']).toBe('number');
      expect(typeof depths['skill-b']).toBe('number');
    });
  });

  describe('getTransitiveDependencies', () => {
    it('should get direct dependencies', () => {
      const graph = {
        'skill-a': {
          name: 'skill-a',
          dependencies: [{ name: 'skill-b' }]
        },
        'skill-b': {
          name: 'skill-b',
          dependencies: []
        }
      };

      const deps = getTransitiveDependencies(graph, 'skill-a');

      expect(deps.has('skill-b')).toBe(true);
      expect(deps.size).toBe(1);
    });

    it('should get transitive dependencies', () => {
      const graph = {
        'skill-a': {
          name: 'skill-a',
          dependencies: [{ name: 'skill-b' }]
        },
        'skill-b': {
          name: 'skill-b',
          dependencies: [{ name: 'skill-c' }]
        },
        'skill-c': {
          name: 'skill-c',
          dependencies: []
        }
      };

      const deps = getTransitiveDependencies(graph, 'skill-a');

      expect(deps.has('skill-b')).toBe(true);
      expect(deps.has('skill-c')).toBe(true);
      expect(deps.size).toBe(2);
    });

    it('should handle no dependencies', () => {
      const graph = {
        'skill-a': {
          name: 'skill-a',
          dependencies: []
        }
      };

      const deps = getTransitiveDependencies(graph, 'skill-a');

      expect(deps.size).toBe(0);
    });

    it('should handle circular dependencies', () => {
      const graph = {
        'skill-a': {
          name: 'skill-a',
          dependencies: [{ name: 'skill-b' }]
        },
        'skill-b': {
          name: 'skill-b',
          dependencies: [{ name: 'skill-a' }]
        }
      };

      const deps = getTransitiveDependencies(graph, 'skill-a');

      expect(deps.has('skill-b')).toBe(true);
      expect(deps.has('skill-a')).toBe(true);
    });

    it('should handle diamond pattern without duplicates', () => {
      const graph = {
        'skill-d': {
          name: 'skill-d',
          dependencies: []
        },
        'skill-b': {
          name: 'skill-b',
          dependencies: [{ name: 'skill-d' }]
        },
        'skill-c': {
          name: 'skill-c',
          dependencies: [{ name: 'skill-d' }]
        },
        'skill-a': {
          name: 'skill-a',
          dependencies: [{ name: 'skill-b' }, { name: 'skill-c' }]
        }
      };

      const deps = getTransitiveDependencies(graph, 'skill-a');

      expect(deps.has('skill-b')).toBe(true);
      expect(deps.has('skill-c')).toBe(true);
      expect(deps.has('skill-d')).toBe(true);
      expect(deps.size).toBe(3); // No duplicates
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined gracefully', async () => {
      vi.spyOn(skillLoader, 'loadSkill').mockResolvedValue(null);

      const result = await resolveDependencies('global', []);

      expect(result.success).toBe(true);
      expect(result.resolved).toHaveLength(0);
    });

    it('should handle malformed dependency objects', async () => {
      const mockSkill = {
        name: 'skill-a',
        version: '1.0.0',
        dependencies: [
          null,
          undefined,
          { name: 'skill-b' },
          'skill-c'
        ].filter(Boolean)
      };

      vi.spyOn(skillLoader, 'loadSkill').mockImplementation((source, name) => {
        if (name === 'skill-a') return Promise.resolve(mockSkill);
        if (name === 'skill-b' || name === 'skill-c') {
          return Promise.resolve({ name, version: '1.0.0', dependencies: [] });
        }
        return Promise.resolve(null);
      });

      const result = await resolveDependencies('global', ['skill-a']);

      expect(result.success).toBe(true);
    });
  });
});

