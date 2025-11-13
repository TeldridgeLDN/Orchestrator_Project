/**
 * @fileoverview Dependency Resolution Algorithm for Skill Imports
 * @module lib/utils/dependency-resolver
 * 
 * Provides sophisticated dependency resolution with:
 * - Dependency graph building
 * - Topological sorting
 * - Circular dependency detection
 * - Version conflict resolution
 * - Optimal import ordering
 * 
 * @see {@link https://github.com/diet103/orchestrator|Diet103 Orchestrator}
 */

import { satisfiesConstraint, compareVersions, areConstraintsCompatible, getLatestVersion } from './version-utils.js';
import { loadSkill } from './skill-loader.js';

/**
 * Dependency resolution result
 * @typedef {Object} ResolutionResult
 * @property {boolean} success - Whether resolution succeeded
 * @property {Array<Object>} resolved - Resolved dependencies in import order
 * @property {Array<Object>} conflicts - Version conflicts found
 * @property {Array<Array<string>>} cycles - Circular dependency cycles
 * @property {Object} graph - Dependency graph
 */

/**
 * Build dependency graph for a skill
 * 
 * @param {string} source - Source path for skills
 * @param {string} skillName - Name of the skill
 * @param {Object} visited - Map of visited skills
 * @param {Object} graph - Dependency graph being built
 * @param {Array<string>} path - Current path (for cycle detection)
 * @returns {Promise<void>}
 */
async function buildDependencyGraph(source, skillName, visited = {}, graph = {}, path = []) {
  // Check for circular dependency FIRST (before visited check)
  if (path.includes(skillName)) {
    const cycle = [...path.slice(path.indexOf(skillName)), skillName];
    throw new Error(`Circular dependency detected: ${cycle.join(' → ')}`);
  }
  
  // Check if already visited (but allow if in current path for cycle detection)
  if (visited[skillName]) {
    return;
  }
  
  // Load skill
  const skill = await loadSkill(source, skillName);
  if (!skill) {
    throw new Error(`Skill not found: ${skillName}`);
  }
  
  // Mark as visited
  visited[skillName] = true;
  
  // Add to graph
  if (!graph[skillName]) {
    graph[skillName] = {
      name: skillName,
      version: skill.version,
      dependencies: [],
      dependents: [],
      metadata: skill
    };
  }
  
  // Process dependencies
  if (skill.dependencies && skill.dependencies.length > 0) {
    for (const dep of skill.dependencies) {
      const depName = typeof dep === 'string' ? dep : dep.name;
      const depVersion = typeof dep === 'object' ? dep.version : undefined;
      const depSource = typeof dep === 'object' ? dep.source : source;
      
      // Add dependency link
      graph[skillName].dependencies.push({
        name: depName,
        version: depVersion,
        source: depSource
      });
      
      // Recursively build graph for dependency
      await buildDependencyGraph(
        depSource,
        depName,
        visited,
        graph,
        [...path, skillName]
      );
      
      // Add dependent link (reverse)
      if (!graph[depName]) {
        graph[depName] = {
          name: depName,
          dependencies: [],
          dependents: []
        };
      }
      graph[depName].dependents.push(skillName);
    }
  }
}

/**
 * Topological sort of dependency graph
 * 
 * @param {Object} graph - Dependency graph
 * @returns {Array<string>} Sorted list of skill names
 */
function topologicalSort(graph) {
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();
  
  function visit(node) {
    if (visited.has(node)) {
      return;
    }
    
    if (visiting.has(node)) {
      // Circular dependency - should have been caught earlier
      throw new Error(`Circular dependency involving ${node}`);
    }
    
    visiting.add(node);
    
    const nodeData = graph[node];
    if (nodeData && nodeData.dependencies) {
      for (const dep of nodeData.dependencies) {
        visit(dep.name);
      }
    }
    
    visiting.delete(node);
    visited.add(node);
    sorted.push(node);
  }
  
  // Visit all nodes
  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      visit(node);
    }
  }
  
  return sorted;
}

/**
 * Detect version conflicts in dependency graph
 * 
 * @param {Object} graph - Dependency graph
 * @returns {Array<Object>} Array of conflict descriptions
 */
function detectVersionConflicts(graph) {
  const conflicts = [];
  const versionRequirements = {}; // skillName -> [{ requiredBy, version, source }]
  
  // Collect all version requirements
  for (const [skillName, node] of Object.entries(graph)) {
    if (node.dependencies) {
      for (const dep of node.dependencies) {
        if (!versionRequirements[dep.name]) {
          versionRequirements[dep.name] = [];
        }
        versionRequirements[dep.name].push({
          requiredBy: skillName,
          version: dep.version || '*',
          source: dep.source
        });
      }
    }
  }
  
  // Check for conflicts
  for (const [skillName, requirements] of Object.entries(versionRequirements)) {
    if (requirements.length <= 1) {
      continue; // No conflict possible
    }
    
    // Check if all requirements are compatible
    const versions = requirements.filter(r => r.version && r.version !== '*');
    
    if (versions.length <= 1) {
      continue; // No conflict if only one or zero specific versions
    }
    
    // Check pairwise compatibility
    for (let i = 0; i < versions.length; i++) {
      for (let j = i + 1; j < versions.length; j++) {
        const v1 = versions[i];
        const v2 = versions[j];
        
        if (!areConstraintsCompatible(v1.version, v2.version)) {
          conflicts.push({
            skill: skillName,
            conflictingRequirements: [
              { requiredBy: v1.requiredBy, version: v1.version },
              { requiredBy: v2.requiredBy, version: v2.version }
            ]
          });
        }
      }
    }
  }
  
  return conflicts;
}

/**
 * Resolve version conflicts using a strategy
 * 
 * @param {Array<Object>} conflicts - Array of conflicts
 * @param {Object} graph - Dependency graph
 * @param {string} strategy - Resolution strategy ('newest', 'oldest', 'manual')
 * @returns {Object} Resolution decisions
 */
function resolveConflicts(conflicts, graph, strategy = 'newest') {
  const resolutions = {};
  
  for (const conflict of conflicts) {
    const skillName = conflict.skill;
    const requirements = conflict.conflictingRequirements;
    
    if (strategy === 'newest') {
      // Use the newest compatible version
      const versions = requirements.map(r => r.version);
      // For simplicity, just use the latest constraint
      resolutions[skillName] = {
        version: versions[versions.length - 1],
        reason: 'Selected newest version constraint'
      };
    } else if (strategy === 'oldest') {
      // Use the oldest version
      const versions = requirements.map(r => r.version);
      resolutions[skillName] = {
        version: versions[0],
        reason: 'Selected oldest version constraint'
      };
    } else {
      // Manual resolution required
      resolutions[skillName] = {
        version: null,
        reason: 'Manual resolution required',
        options: requirements
      };
    }
  }
  
  return resolutions;
}

/**
 * Flatten dependency tree to remove duplicates
 * 
 * @param {Array<string>} sortedSkills - Topologically sorted skills
 * @param {Object} graph - Dependency graph
 * @returns {Array<Object>} Flattened dependency list
 */
function flattenDependencies(sortedSkills, graph) {
  const flattened = [];
  const seen = new Set();
  
  for (const skillName of sortedSkills) {
    if (!seen.has(skillName)) {
      const node = graph[skillName];
      flattened.push({
        name: skillName,
        version: node.version,
        metadata: node.metadata,
        dependencies: node.dependencies.map(d => d.name)
      });
      seen.add(skillName);
    }
  }
  
  return flattened;
}

/**
 * Resolve skill dependencies
 * 
 * Main entry point for dependency resolution. Builds dependency graph,
 * detects conflicts and cycles, and returns optimal import order.
 * 
 * @param {string} source - Source path for skills
 * @param {Array<string>} skillNames - Names of skills to resolve
 * @param {Object} options - Resolution options
 * @param {string} [options.strategy='newest'] - Conflict resolution strategy
 * @param {boolean} [options.allowCircular=false] - Allow circular dependencies
 * @returns {Promise<ResolutionResult>} Resolution result
 */
export async function resolveDependencies(source, skillNames, options = {}) {
  const {
    strategy = 'newest',
    allowCircular = false
  } = options;
  
  const result = {
    success: false,
    resolved: [],
    conflicts: [],
    cycles: [],
    graph: {}
  };
  
  try {
    // Build dependency graph for all requested skills
    const visited = {};
    const graph = {};
    const cycleErrors = [];
    
    for (const skillName of skillNames) {
      try {
        await buildDependencyGraph(source, skillName, visited, graph, []);
      } catch (error) {
        if (error.message.includes('Circular dependency')) {
          cycleErrors.push(error.message);
        } else {
          throw error;
        }
      }
    }
    
    // If cycles detected, handle them
    if (cycleErrors.length > 0) {
      result.cycles = cycleErrors;
      if (!allowCircular) {
        result.success = false;
        return result;
      }
    }
    
    result.graph = graph;
    
    // Detect version conflicts
    result.conflicts = detectVersionConflicts(graph);
    
    // Resolve conflicts if any
    if (result.conflicts.length > 0) {
      const resolutions = resolveConflicts(result.conflicts, graph, strategy);
      result.resolutions = resolutions;
      
      // Check if any conflicts require manual resolution
      const manualRequired = Object.values(resolutions).some(r => !r.version);
      if (manualRequired && strategy !== 'manual') {
        result.success = false;
        result.error = 'Manual conflict resolution required';
        return result;
      }
    }
    
    // Topological sort for import order
    let sorted;
    try {
      sorted = topologicalSort(graph);
    } catch (error) {
      result.success = false;
      result.error = error.message;
      return result;
    }
    
    // Flatten dependencies
    result.resolved = flattenDependencies(sorted, graph);
    result.success = true;
    
    return result;
    
  } catch (error) {
    result.success = false;
    result.error = error.message;
    return result;
  }
}

/**
 * Validate a dependency graph for issues
 * 
 * @param {Object} graph - Dependency graph to validate
 * @returns {Object} Validation result with issues found
 */
export function validateDependencyGraph(graph) {
  const issues = {
    missingDependencies: [],
    versionConflicts: [],
    circularDependencies: [],
    valid: true
  };
  
  // Check for missing dependencies
  for (const [skillName, node] of Object.entries(graph)) {
    if (node.dependencies) {
      for (const dep of node.dependencies) {
        if (!graph[dep.name]) {
          issues.missingDependencies.push({
            skill: skillName,
            missing: dep.name
          });
          issues.valid = false;
        }
      }
    }
  }
  
  // Check for version conflicts
  const conflicts = detectVersionConflicts(graph);
  if (conflicts.length > 0) {
    issues.versionConflicts = conflicts;
    issues.valid = false;
  }
  
  return issues;
}

/**
 * Get dependency path between two skills
 * 
 * @param {Object} graph - Dependency graph
 * @param {string} from - Starting skill
 * @param {string} to - Target skill
 * @returns {Array<string>|null} Path from 'from' to 'to', or null if no path exists
 */
export function getDependencyPath(graph, from, to) {
  const visited = new Set();
  const queue = [[from]];
  
  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    
    if (current === to) {
      return path;
    }
    
    if (visited.has(current)) {
      continue;
    }
    
    visited.add(current);
    
    const node = graph[current];
    if (node && node.dependencies) {
      for (const dep of node.dependencies) {
        queue.push([...path, dep.name]);
      }
    }
  }
  
  return null;
}

/**
 * Calculate dependency depth for each skill
 * 
 * @param {Object} graph - Dependency graph
 * @returns {Object} Map of skill name to depth
 */
export function calculateDependencyDepth(graph) {
  const depths = {};
  const inProgress = new Set(); // Track currently processing nodes
  
  function getDepth(skillName, visited = new Set()) {
    // Already calculated
    if (depths[skillName] !== undefined) {
      return depths[skillName];
    }
    
    // Circular dependency detected - return 0
    if (inProgress.has(skillName)) {
      depths[skillName] = 0;
      return 0;
    }
    
    // Safety check for visited
    if (visited.has(skillName)) {
      depths[skillName] = 0;
      return 0;
    }
    
    // Mark as in progress
    inProgress.add(skillName);
    visited.add(skillName);
    
    const node = graph[skillName];
    if (!node || !node.dependencies || node.dependencies.length === 0) {
      depths[skillName] = 0;
      inProgress.delete(skillName);
      return 0;
    }
    
    const depthValues = [];
    for (const dep of node.dependencies) {
      const depDepth = getDepth(dep.name, new Set(visited));
      depthValues.push(depDepth);
    }
    
    const maxDepth = depthValues.length > 0 ? Math.max(...depthValues) : 0;
    depths[skillName] = maxDepth + 1;
    
    // Remove from in-progress
    inProgress.delete(skillName);
    
    return depths[skillName];
  }
  
  for (const skillName of Object.keys(graph)) {
    if (depths[skillName] === undefined) {
      getDepth(skillName);
    }
  }
  
  return depths;
}

/**
 * Get all transitive dependencies for a skill
 * 
 * @param {Object} graph - Dependency graph
 * @param {string} skillName - Name of the skill
 * @returns {Set<string>} Set of all transitive dependency names
 */
export function getTransitiveDependencies(graph, skillName) {
  const transitive = new Set();
  const visited = new Set();
  
  function collect(name) {
    if (visited.has(name)) {
      return;
    }
    
    visited.add(name);
    
    const node = graph[name];
    if (node && node.dependencies) {
      for (const dep of node.dependencies) {
        transitive.add(dep.name);
        collect(dep.name);
      }
    }
  }
  
  collect(skillName);
  return transitive;
}

