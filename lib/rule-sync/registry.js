#!/usr/bin/env node

/**
 * Project Registry Management
 * 
 * diet103 compliant: <500 lines, single responsibility
 * Manages ~/.orchestrator/projects.json CRUD operations
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const REGISTRY_PATH = path.join(os.homedir(), '.orchestrator', 'projects.json');

class ProjectRegistry {
  constructor() {
    this.registryPath = REGISTRY_PATH;
  }

  /**
   * Ensure registry directory and file exist
   */
  async initialize() {
    const dir = path.dirname(this.registryPath);
    
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }

    try {
      await fs.access(this.registryPath);
    } catch {
      // Create initial registry
      const initial = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        projects: {}
      };
      await fs.writeFile(this.registryPath, JSON.stringify(initial, null, 2));
    }
  }

  /**
   * Load registry from disk
   */
  async load() {
    await this.initialize();
    const content = await fs.readFile(this.registryPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Save registry to disk
   */
  async save(registry) {
    registry.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.registryPath, JSON.stringify(registry, null, 2));
  }

  /**
   * Register a new project
   */
  async register(projectPath, options = {}) {
    const registry = await this.load();
    const projectName = options.name || path.basename(projectPath);
    
    // Check if project already registered
    if (registry.projects[projectName]) {
      throw new Error(`Project "${projectName}" already registered`);
    }

    // Read project config if exists
    const configPath = path.join(projectPath, '.taskmaster', 'config.json');
    let configName = projectName;
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      configName = config.global?.projectName || projectName;
    } catch {
      // Config doesn't exist or can't read - use directory name
    }

    // Detect rules version
    const manifestPath = path.join(projectPath, '.claude', 'rules', '.rule-manifest.json');
    let rulesVersion = '0.0.0'; // No rules
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      rulesVersion = manifest.rulesVersion || '0.0.0';
    } catch {
      // No manifest - project needs sync
    }

    // Detect custom rules (project-specific, not in manifest)
    const customRules = options.customRules || [];

    registry.projects[projectName] = {
      name: projectName,
      path: projectPath,
      rulesVersion,
      role: options.role || 'consumer',
      registered: new Date().toISOString(),
      lastSynced: options.role === 'source' ? new Date().toISOString() : null,
      manifestPath: '.claude/rules/.rule-manifest.json',
      customRules
    };

    await this.save(registry);
    return registry.projects[projectName];
  }

  /**
   * Unregister a project
   */
  async unregister(projectName) {
    const registry = await this.load();
    
    if (!registry.projects[projectName]) {
      throw new Error(`Project "${projectName}" not registered`);
    }

    delete registry.projects[projectName];
    await this.save(registry);
  }

  /**
   * Get project info
   */
  async get(projectName) {
    const registry = await this.load();
    return registry.projects[projectName] || null;
  }

  /**
   * Get project by path
   */
  async getByPath(projectPath) {
    const registry = await this.load();
    const normalizedPath = path.resolve(projectPath);
    
    for (const [name, project] of Object.entries(registry.projects)) {
      if (path.resolve(project.path) === normalizedPath) {
        return project;
      }
    }
    return null;
  }

  /**
   * List all projects
   */
  async list(filters = {}) {
    const registry = await this.load();
    let projects = Object.values(registry.projects);

    if (filters.role) {
      projects = projects.filter(p => p.role === filters.role);
    }

    if (filters.outdated) {
      const sourceProject = projects.find(p => p.role === 'source');
      if (sourceProject) {
        projects = projects.filter(p => 
          p.role !== 'source' && p.rulesVersion !== sourceProject.rulesVersion
        );
      }
    }

    return projects;
  }

  /**
   * Update project metadata
   */
  async update(projectName, updates) {
    const registry = await this.load();
    
    if (!registry.projects[projectName]) {
      throw new Error(`Project "${projectName}" not registered`);
    }

    // Merge updates
    registry.projects[projectName] = {
      ...registry.projects[projectName],
      ...updates,
      name: projectName // Never allow name change via update
    };

    await this.save(registry);
    return registry.projects[projectName];
  }

  /**
   * Get source project (where rules originate)
   */
  async getSource() {
    const registry = await this.load();
    const sources = Object.values(registry.projects).filter(p => p.role === 'source');
    
    if (sources.length === 0) {
      throw new Error('No source project registered');
    }
    
    if (sources.length > 1) {
      console.warn('Multiple source projects found, using first one');
    }
    
    return sources[0];
  }

  /**
   * Get outdated projects (need sync)
   */
  async getOutdated() {
    const source = await this.getSource();
    const all = await this.list();
    
    return all.filter(p => 
      p.role !== 'source' && p.rulesVersion !== source.rulesVersion
    );
  }

  /**
   * Mark project as synced
   */
  async markSynced(projectName, version) {
    return this.update(projectName, {
      rulesVersion: version,
      lastSynced: new Date().toISOString()
    });
  }
}

module.exports = ProjectRegistry;

// CLI usage
if (require.main === module) {
  const registry = new ProjectRegistry();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  (async () => {
    try {
      switch (command) {
        case 'register':
          if (!args[0]) {
            console.error('Usage: registry.js register <path> [name]');
            process.exit(1);
          }
          const result = await registry.register(args[0], { name: args[1] });
          console.log(`✅ Registered: ${result.name} at ${result.path}`);
          break;

        case 'unregister':
          if (!args[0]) {
            console.error('Usage: registry.js unregister <name>');
            process.exit(1);
          }
          await registry.unregister(args[0]);
          console.log(`✅ Unregistered: ${args[0]}`);
          break;

        case 'list':
          const projects = await registry.list();
          console.log('📦 Registered Projects:');
          projects.forEach(p => {
            console.log(`  • ${p.name} (v${p.rulesVersion}) - ${p.path}`);
          });
          break;

        case 'get':
          if (!args[0]) {
            console.error('Usage: registry.js get <name>');
            process.exit(1);
          }
          const project = await registry.get(args[0]);
          if (project) {
            console.log(JSON.stringify(project, null, 2));
          } else {
            console.log(`Project "${args[0]}" not found`);
          }
          break;

        case 'source':
          const source = await registry.getSource();
          console.log(`📦 Source: ${source.name} (v${source.rulesVersion})`);
          break;

        case 'outdated':
          const outdated = await registry.getOutdated();
          if (outdated.length === 0) {
            console.log('✅ All projects up to date');
          } else {
            console.log('⚠️  Outdated projects:');
            outdated.forEach(p => {
              console.log(`  • ${p.name} (v${p.rulesVersion})`);
            });
          }
          break;

        default:
          console.error('Unknown command:', command);
          console.error('Available: register, unregister, list, get, source, outdated');
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })();
}

