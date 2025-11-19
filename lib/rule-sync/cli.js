#!/usr/bin/env node

/**
 * Rule Sync CLI
 * 
 * diet103 compliant: <500 lines, thin wrapper
 * Orchestrates registry, version-check, and sync-pull
 */

const ProjectRegistry = require('./registry');
const VersionChecker = require('./version-check');
const SyncPull = require('./sync-pull');
const path = require('path');

class RuleSyncCLI {
  constructor() {
    this.registry = new ProjectRegistry();
    this.checker = new VersionChecker();
  }

  /**
   * Main command router
   */
  async run(args) {
    const command = args[0];
    const subArgs = args.slice(1);

    try {
      switch (command) {
        case 'register':
          await this.cmdRegister(subArgs);
          break;
        case 'unregister':
          await this.cmdUnregister(subArgs);
          break;
        case 'list':
          await this.cmdList(subArgs);
          break;
        case 'status':
          await this.cmdStatus(subArgs);
          break;
        case 'pull':
          await this.cmdPull(subArgs);
          break;
        case 'diff':
          await this.cmdDiff(subArgs);
          break;
        case 'help':
        case '--help':
        case '-h':
          this.showHelp();
          break;
        default:
          console.error(`Unknown command: ${command}`);
          console.error('Run: orchestrator rule-sync help');
          process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Register current or specified project
   */
  async cmdRegister(args) {
    const projectPath = args[0] || process.cwd();
    const options = this.parseFlags(args);

    const project = await this.registry.register(projectPath, options);
    console.log(`✅ Registered: ${project.name}`);
    console.log(`   Path: ${project.path}`);
    console.log(`   Rules Version: v${project.rulesVersion}`);
    console.log(`   Role: ${project.role}`);
  }

  /**
   * Unregister a project
   */
  async cmdUnregister(args) {
    if (!args[0]) {
      console.error('Usage: orchestrator rule-sync unregister <project-name>');
      process.exit(1);
    }

    await this.registry.unregister(args[0]);
    console.log(`✅ Unregistered: ${args[0]}`);
  }

  /**
   * List registered projects
   */
  async cmdList(args) {
    const flags = this.parseFlags(args);
    const projects = await this.registry.list(flags);

    if (projects.length === 0) {
      console.log('No registered projects');
      return;
    }

    console.log('📦 Registered Projects:');
    console.log('');

    for (const project of projects) {
      const badge = project.role === 'source' ? '⭐' : '';
      console.log(`${badge} ${project.name} (v${project.rulesVersion})`);
      console.log(`   Path: ${project.path}`);
      console.log(`   Role: ${project.role}`);
      if (project.lastSynced) {
        console.log(`   Last Synced: ${new Date(project.lastSynced).toLocaleString()}`);
      }
      console.log('');
    }
  }

  /**
   * Check status of current or specified project
   */
  async cmdStatus(args) {
    const flags = this.parseFlags(args);
    const targetPath = args.find(a => !a.startsWith('--')) || process.cwd();

    // Get source and target projects
    const source = await this.registry.getSource();
    const target = await this.registry.getByPath(targetPath);

    if (!target) {
      console.error('❌ Project not registered');
      console.log('   Run: orchestrator rule-sync register');
      process.exit(1);
    }

    // Check version status
    const result = await this.checker.check(source.path, target.path);

    // Quiet mode - just output status
    if (flags.quiet) {
      console.log(result.status);
      process.exit(result.updates.length > 0 ? 1 : 0);
    }

    // Full report
    console.log(this.checker.formatReport(result));
    process.exit(result.updates.length > 0 ? 1 : 0);
  }

  /**
   * Pull rules from source to target
   */
  async cmdPull(args) {
    const flags = this.parseFlags(args);
    const targetPath = args.find(a => !a.startsWith('--')) || process.cwd();

    // Get source and target
    const source = await this.registry.getSource();
    const target = await this.registry.getByPath(targetPath);

    if (!target) {
      console.error('❌ Project not registered');
      console.log('   Run: orchestrator rule-sync register');
      process.exit(1);
    }

    // Check what needs syncing
    const checkResult = await this.checker.check(source.path, target.path);

    if (checkResult.updates.length === 0) {
      console.log('✅ All rules up to date');
      return;
    }

    console.log(`📦 Syncing ${checkResult.updates.length} rule(s)...`);
    console.log('');

    // Create syncer
    const syncer = new SyncPull({
      dryRun: flags['dry-run'],
      verbose: flags.verbose || flags.v
    });

    // Pull updates
    const pullOptions = {};
    if (flags.only) pullOptions.only = flags.only.split(',');
    if (flags.exclude) pullOptions.exclude = flags.exclude.split(',');

    const results = await syncer.pull(
      source.path,
      target.path,
      checkResult.updates,
      pullOptions
    );

    console.log(syncer.formatSummary(results));

    // Update registry if successful
    if (!flags['dry-run'] && results.success.length > 0) {
      await this.registry.markSynced(target.name, source.rulesVersion);
    }

    process.exit(results.failed.length > 0 ? 1 : 0);
  }

  /**
   * Show diff for a specific rule
   */
  async cmdDiff(args) {
    if (!args[0]) {
      console.error('Usage: orchestrator rule-sync diff <rule-path>');
      process.exit(1);
    }

    const rulePath = args[0];
    const targetPath = args[1] || process.cwd();

    // Get source and target
    const source = await this.registry.getSource();
    const target = await this.registry.getByPath(targetPath);

    if (!target) {
      console.error('❌ Project not registered');
      process.exit(1);
    }

    // Show diff
    const syncer = new SyncPull();
    const diff = await syncer.showDiff(source.path, target.path, rulePath);

    console.log(`Diff for ${rulePath}:`);
    console.log('─'.repeat(60));
    console.log(diff);
  }

  /**
   * Parse command-line flags
   */
  parseFlags(args) {
    const flags = {};
    
    for (const arg of args) {
      if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=');
        flags[key] = value || true;
      } else if (arg.startsWith('-')) {
        flags[arg.slice(1)] = true;
      }
    }

    return flags;
  }

  /**
   * Show help message
   */
  showHelp() {
    console.log(`
📦 Orchestrator Rule Sync

USAGE:
  orchestrator rule-sync <command> [options]

COMMANDS:
  register [path]         Register project in rule sync system
  unregister <name>       Remove project from registry
  list                    List all registered projects
  status [path]           Check sync status of project
  pull [path]             Pull latest rules from source
  diff <rule-path>        Show diff for specific rule
  help                    Show this help message

REGISTRATION:
  orchestrator rule-sync register                 # Register current directory
  orchestrator rule-sync register /path/to/proj   # Register specific path
  orchestrator rule-sync register --role=source   # Register as source

STATUS:
  orchestrator rule-sync status              # Check current project
  orchestrator rule-sync status --quiet      # Just output status

PULL:
  orchestrator rule-sync pull                       # Pull all updates
  orchestrator rule-sync pull --dry-run             # Preview changes
  orchestrator rule-sync pull --only=primacy        # Only primacy rules
  orchestrator rule-sync pull --exclude=identity    # Exclude identity rules
  orchestrator rule-sync pull --verbose             # Show details

DIFF:
  orchestrator rule-sync diff .claude/rules/context-efficiency.md

EXAMPLES:
  # Setup new project
  cd ~/MyProject
  orchestrator rule-sync register
  orchestrator rule-sync pull

  # Check status
  orchestrator rule-sync status

  # Update rules
  orchestrator rule-sync pull --dry-run  # Preview
  orchestrator rule-sync pull            # Apply

FLAGS:
  --dry-run         Preview changes without applying
  --verbose, -v     Show detailed output
  --quiet           Minimal output
  --only=<filter>   Only sync matching rules
  --exclude=<filter> Exclude matching rules
  --force           Force sync even with customizations

For more info: https://github.com/orchestrator/rule-sync
`);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  const cli = new RuleSyncCLI();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    args.push('help');
  }

  cli.run(args).catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = RuleSyncCLI;

