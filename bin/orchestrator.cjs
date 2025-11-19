#!/usr/bin/env -S node --no-warnings

/**
 * Orchestrator CLI Entry Point
 * Routes commands to appropriate modules
 */

const path = require('path');
const { spawn } = require('child_process');

const command = process.argv[2];
const args = process.argv.slice(3);

// Route to appropriate module
switch (command) {
  case 'sync-rules':
  case 'rules-sync':
    // Route to sync-rules command
    const syncRulesPath = path.join(__dirname, '..', 'lib', 'rules', 'global-rules-loader.js');
    const syncProc = spawn('node', [syncRulesPath, ...args], { stdio: 'inherit' });
    syncProc.on('exit', code => process.exit(code || 0));
    break;

  case 'sync-skills':
  case 'skills-sync':
    // Route to sync-skills command
    const syncSkillsPath = path.join(__dirname, '..', 'lib', 'skills', 'global-skills-loader.js');
    const syncSkillsProc = spawn('node', [syncSkillsPath, ...args], { stdio: 'inherit' });
    syncSkillsProc.on('exit', code => process.exit(code || 0));
    break;

  case 'rule-sync':
    // Route to rule-sync CLI (existing)
    const ruleSyncPath = path.join(__dirname, '..', 'lib', 'rule-sync', 'cli.cjs');
    const proc = spawn('node', [ruleSyncPath, ...args], { stdio: 'inherit' });
    proc.on('exit', code => process.exit(code || 0));
    break;

  case 'knowledge':
    // Route to knowledge-sync command
    const knowledgePath = path.join(__dirname, '..', 'lib', 'commands', 'knowledge-sync.js');
    const knowledgeProc = spawn('node', [knowledgePath, ...args], { stdio: 'inherit' });
    knowledgeProc.on('exit', code => process.exit(code || 0));
    break;

  case 'help':
  case '--help':
  case '-h':
  case undefined:
    console.log(`
🎼 Orchestrator CLI

USAGE:
  orchestrator <command> [options]

COMMANDS:
  sync-rules   Sync global Orchestrator rules to all projects
  sync-skills  Sync global Orchestrator skills to all projects
  knowledge    Manage global knowledge base (patterns/skills/prompts)
  rule-sync    Manage rule synchronization (advanced)

DAILY USE:
  Use 'orch' for quick commands (see: orch help)

EXAMPLES:
  orchestrator sync-rules           # Setup global rules
  orchestrator sync-skills          # Setup global skills
  orchestrator knowledge push       # Share knowledge globally
  orchestrator knowledge list       # See global knowledge
  orchestrator rule-sync status     # Check rule sync status

Run 'orchestrator <command> help' for more info on a command.
    `);
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.error('Run: orchestrator help');
    process.exit(1);
}

