#!/usr/bin/env node

/**
 * Critical Task Evaluator - Dual-Pass Task Generation System
 * 
 * This script implements automatic critical review of generated tasks
 * using a two-pass approach:
 * 
 * Pass 1: Standard task generation (main model)
 * Pass 2: Critical evaluation and refinement (critic model)
 * 
 * Usage:
 *   node critical-task-evaluator.js --tasks tasks.json
 *   node critical-task-evaluator.js --interactive
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

function loadConfig() {
  const configPath = path.join(process.cwd(), '.taskmaster', 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Taskmaster config not found. Run task-master init first.');
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function loadSystemPhilosophy() {
  const philosophyPath = path.join(process.cwd(), '.taskmaster', 'docs', 'SYSTEM_PHILOSOPHY.md');
  if (fs.existsSync(philosophyPath)) {
    return fs.readFileSync(philosophyPath, 'utf8');
  }
  return '';
}

// ============================================================================
// Critic Prompt System
// ============================================================================

function buildCriticPrompt(tasks, criteria, philosophy) {
  const enabledCriteria = Object.entries(criteria)
    .filter(([_, config]) => config.enabled)
    .sort((a, b) => b[1].weight - a[1].weight);

  const criteriaSection = enabledCriteria
    .map(([name, config], index) => `
${index + 1}. **${name.toUpperCase()}** (Weight: ${config.weight}/10)
   ${config.guideline}
`)
    .join('\n');

  return `You are a god-like programmer with decades of experience building production systems at scale.

Your role is to critically evaluate the proposed tasks with RUTHLESS focus on simplicity, user value, and adherence to system philosophy.

You have three powers:
1. **CANCEL** - Remove tasks that violate principles (over-engineering, YAGNI violations, premature optimization)
2. **SIMPLIFY** - Reduce complexity while maintaining value
3. **MERGE** - Combine redundant tasks

## EVALUATION CRITERIA

${criteriaSection}

## SYSTEM PHILOSOPHY

${philosophy.substring(0, 2000)}... (see SYSTEM_PHILOSOPHY.md for full context)

## PROPOSED TASKS

\`\`\`json
${JSON.stringify(tasks, null, 2)}
\`\`\`

## YOUR MISSION

Provide a critical evaluation with:

1. **Overall Assessment**: What's the main issue with this task list?

2. **Detailed Changes**: For each task you modify:
   - Action: CANCEL | SIMPLIFY | MERGE | KEEP
   - Original: Task ID and title
   - Rationale: Why this change? Which criteria?
   - New: Updated task (if SIMPLIFY/MERGE)

3. **Impact Summary**:
   - Tasks before/after
   - Estimated LOC before/after
   - External dependencies before/after
   - Maintenance burden: HIGH/MEDIUM/LOW

4. **Refined Task List**: The complete, improved task list in JSON format

## GUIDELINES

- Challenge EVERYTHING. Default to cancellation.
- Question frameworks, services, agents, databases.
- Prefer files over databases, hooks over frameworks.
- Ask: "Can this be <100 lines?" If yes, it should be.
- Look for YAGNI violations ("we might need", "for scalability")
- Merge similar tasks aggressively
- Ruthlessly cancel premature optimization/infrastructure
- Keep only high-value, well-justified tasks

## OUTPUT FORMAT

Provide your response in this exact format:

### OVERALL ASSESSMENT
[Your assessment here]

### DETAILED CHANGES

#### Task #[ID]: [Title]
**Action:** [CANCEL | SIMPLIFY | MERGE | KEEP]
**Rationale:** [Explanation with criteria]
**Estimated LOC:** [Before] → [After]
[If SIMPLIFY/MERGE, provide updated task]

### IMPACT SUMMARY
- **Tasks:** [X] → [Y] ([Z]% reduction)
- **Estimated LOC:** [X] → [Y] ([Z]% reduction)
- **External Dependencies:** [X] → [Y]
- **Maintenance Burden:** [HIGH|MEDIUM|LOW]

### REFINED TASKS
\`\`\`json
[Complete refined task list]
\`\`\`

Be brutally honest. Favor simplicity. Challenge assumptions. You're the last defense against complexity creep.`;
}

// ============================================================================
// AI Model Integration
// ============================================================================

async function callCriticModel(prompt, config) {
  const critic = config.models.critic;
  
  if (!critic.enabled) {
    console.log('⚠️  Critical review disabled in config');
    return null;
  }

  console.log(`🤖 Invoking critic model: ${critic.provider}/${critic.modelId}`);
  console.log(`📊 Max tokens: ${critic.maxTokens}, Temperature: ${critic.temperature}`);

  // For this implementation, we'll provide integration points
  // The actual API calls would go here based on provider
  
  switch (critic.provider) {
    case 'anthropic':
      return await callAnthropicAPI(prompt, critic);
    case 'openai':
      return await callOpenAIAPI(prompt, critic);
    case 'perplexity':
      return await callPerplexityAPI(prompt, critic);
    default:
      throw new Error(`Unsupported provider: ${critic.provider}`);
  }
}

async function callAnthropicAPI(prompt, config) {
  console.log('🔄 Calling Anthropic API...');
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not found in environment');
  }

  // Use native fetch API (Node.js 18+)
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.modelId,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callOpenAIAPI(prompt, config) {
  console.log('🔄 Calling OpenAI API...');
  // Similar implementation for OpenAI
  throw new Error('OpenAI integration not yet implemented');
}

async function callPerplexityAPI(prompt, config) {
  console.log('🔄 Calling Perplexity API...');
  // Similar implementation for Perplexity
  throw new Error('Perplexity integration not yet implemented');
}

// ============================================================================
// Report Generation
// ============================================================================

function generateEvaluationReport(original, refined, response, timestamp) {
  const report = {
    metadata: {
      timestamp,
      evaluator: 'critical-task-evaluator',
      version: '1.0.0'
    },
    summary: {
      originalTaskCount: original.length,
      refinedTaskCount: refined.length,
      reduction: Math.round((1 - refined.length / original.length) * 100)
    },
    changes: extractChanges(response),
    originalTasks: original,
    refinedTasks: refined,
    fullEvaluation: response
  };

  return report;
}

function extractChanges(response) {
  // Parse the structured response to extract changes
  const changes = [];
  const changePattern = /#### Task #(\d+): (.+?)\n\*\*Action:\*\* (.+?)\n\*\*Rationale:\*\* (.+?)(?=\n####|\n###|$)/gs;
  
  let match;
  while ((match = changePattern.exec(response)) !== null) {
    changes.push({
      taskId: match[1],
      title: match[2].trim(),
      action: match[3].trim(),
      rationale: match[4].trim()
    });
  }

  return changes;
}

function saveReport(report, outputPath) {
  const reportsDir = path.join(process.cwd(), '.taskmaster', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, outputPath);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved: ${reportPath}`);

  // Also generate a markdown version
  const mdPath = reportPath.replace('.json', '.md');
  fs.writeFileSync(mdPath, generateMarkdownReport(report));
  console.log(`📄 Markdown report saved: ${mdPath}`);

  return reportPath;
}

function generateMarkdownReport(report) {
  const { metadata, summary, changes, fullEvaluation } = report;

  return `# Critical Task Evaluation Report

**Date:** ${new Date(metadata.timestamp).toISOString()}  
**Evaluator:** ${metadata.evaluator} v${metadata.version}

---

## Executive Summary

- **Original Tasks:** ${summary.originalTaskCount}
- **Refined Tasks:** ${summary.refinedTaskCount}
- **Reduction:** ${summary.reduction}%

---

## Changes Summary

${changes.map((change, i) => `
### ${i + 1}. Task #${change.taskId}: ${change.title}

**Action:** ${change.action}

**Rationale:** ${change.rationale}
`).join('\n')}

---

## Full Evaluation

${fullEvaluation}

---

*Generated by Critical Task Evaluator*
`;
}

// ============================================================================
// Main Execution Flow
// ============================================================================

async function evaluateTasks(tasksPath, options = {}) {
  console.log('\n🔍 Critical Task Evaluator - Dual-Pass System\n');
  console.log('━'.repeat(60));

  // 1. Load configuration
  console.log('\n📋 Step 1: Loading configuration...');
  const config = loadConfig();
  const philosophy = loadSystemPhilosophy();

  if (!config.criticalReview?.enabled) {
    console.log('⚠️  Critical review is disabled in config');
    console.log('💡 Enable with: config.criticalReview.enabled = true');
    return;
  }

  // 2. Load tasks
  console.log('\n📋 Step 2: Loading tasks...');
  const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  
  // Handle both tagged and legacy formats
  let tasks;
  let currentTag = 'master';
  
  if (tasksData.master || tasksData['diet103-validation']) {
    // Tagged format - use current tag or master
    const stateFile = path.join(process.cwd(), '.taskmaster', 'state.json');
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      currentTag = state.currentTag || 'master';
    }
    tasks = tasksData[currentTag]?.tasks || [];
    console.log(`✅ Loaded ${tasks.length} tasks from ${tasksPath} (tag: ${currentTag})`);
  } else {
    // Legacy format - direct array
    tasks = tasksData;
    console.log(`✅ Loaded ${tasks.length} tasks from ${tasksPath}`);
  }

  // 3. Build critic prompt
  console.log('\n📋 Step 3: Building evaluation prompt...');
  const prompt = buildCriticPrompt(
    tasks,
    config.criticalReview.criteria,
    philosophy
  );
  console.log(`✅ Prompt ready (${prompt.length} chars)`);

  if (options.dryRun) {
    console.log('\n🔍 DRY RUN MODE - Showing prompt:\n');
    console.log('━'.repeat(60));
    console.log(prompt);
    console.log('━'.repeat(60));
    return;
  }

  // 4. Call critic model
  console.log('\n📋 Step 4: Invoking critic model...');
  console.log('⏳ This may take 30-60 seconds...\n');
  
  const response = await callCriticModel(prompt, config);

  if (!response) {
    console.log('❌ No response from critic model');
    return;
  }

  console.log('✅ Evaluation complete!');

  // 5. Extract refined tasks
  console.log('\n📋 Step 5: Extracting refined tasks...');
  const refinedTasks = extractRefinedTasks(response);
  console.log(`✅ Extracted ${refinedTasks.length} refined tasks`);

  // 6. Generate report
  if (config.criticalReview.generateReport) {
    console.log('\n📋 Step 6: Generating evaluation report...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const report = generateEvaluationReport(tasks, refinedTasks, response, timestamp);
    const reportPath = `critical-review-${timestamp}.json`;
    saveReport(report, reportPath);
  }

  // 7. Apply changes (if enabled)
  if (config.criticalReview.autoApply && !options.dryRun) {
    console.log('\n📋 Step 7: Applying refined tasks...');
    const backupPath = tasksPath.replace('.json', `.backup-${Date.now()}.json`);
    fs.copyFileSync(tasksPath, backupPath);
    console.log(`💾 Backup saved: ${backupPath}`);

    fs.writeFileSync(tasksPath, JSON.stringify(refinedTasks, null, 2));
    console.log(`✅ Tasks updated: ${tasksPath}`);
  } else {
    console.log('\n📋 Step 7: Skipping auto-apply (disabled in config)');
    console.log('💡 Review the report and manually apply changes if desired');
  }

  // 8. Summary
  console.log('\n' + '━'.repeat(60));
  console.log('✅ EVALUATION COMPLETE');
  console.log('━'.repeat(60));
  console.log(`\n📊 Original Tasks: ${tasks.length}`);
  console.log(`📊 Refined Tasks: ${refinedTasks.length}`);
  console.log(`📊 Reduction: ${Math.round((1 - refinedTasks.length / tasks.length) * 100)}%`);
  console.log('');
}

function extractRefinedTasks(response) {
  // Extract the JSON block from the response
  const jsonMatch = response.match(/```json\n([\s\S]+?)\n```/);
  if (!jsonMatch) {
    console.error('❌ Could not extract refined tasks from response');
    return [];
  }

  try {
    return JSON.parse(jsonMatch[1]);
  } catch (error) {
    console.error('❌ Error parsing refined tasks:', error.message);
    return [];
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    tasksPath: null,
    dryRun: false,
    interactive: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--tasks':
      case '-t':
        options.tasksPath = args[++i];
        break;
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--interactive':
      case '-i':
        options.interactive = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
      default:
        console.error(`Unknown option: ${args[i]}`);
        showHelp();
        process.exit(1);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Critical Task Evaluator - Dual-Pass Task Generation System

Usage:
  critical-task-evaluator [options]

Options:
  -t, --tasks <path>       Path to tasks.json file
  -d, --dry-run           Show prompt without calling API
  -i, --interactive       Interactive mode (paste tasks)
  -h, --help              Show this help message

Examples:
  # Evaluate tasks.json
  critical-task-evaluator --tasks .taskmaster/tasks/tasks.json

  # Dry run (show prompt only)
  critical-task-evaluator --tasks tasks.json --dry-run

  # Interactive mode
  critical-task-evaluator --interactive

Configuration:
  Edit .taskmaster/config.json to configure:
  - Critic model settings
  - Evaluation criteria weights
  - Auto-apply behavior
  - Report generation

Environment Variables:
  ANTHROPIC_API_KEY    Required for Anthropic models
  OPENAI_API_KEY       Required for OpenAI models
  PERPLEXITY_API_KEY   Required for Perplexity models
`);
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  try {
    const options = parseArgs();

    if (!options.tasksPath) {
      // Default to .taskmaster/tasks/tasks.json
      options.tasksPath = path.join(process.cwd(), '.taskmaster', 'tasks', 'tasks.json');
      
      if (!fs.existsSync(options.tasksPath)) {
        console.error('❌ No tasks.json found. Specify path with --tasks');
        process.exit(1);
      }
    }

    await evaluateTasks(options.tasksPath, options);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { evaluateTasks, buildCriticPrompt, generateEvaluationReport };

