/**
 * Feature Composer Integration Example
 *
 * This example demonstrates how to use the FeatureComposer in a Skill
 * to orchestrate multiple agentic features for a code review workflow.
 *
 * Scenario: Comprehensive Code Review Skill
 * This skill performs a multi-step code review process by composing:
 * - Slash commands for code analysis
 * - Sub-agents for security scanning
 * - MCP queries for task management
 */

import { FeatureComposer } from '../node_modules/.claude-lib/feature-composer.js';

/**
 * Comprehensive Code Review Skill
 *
 * This skill orchestrates multiple features to perform a thorough code review:
 * 1. Run code review slash command
 * 2. Invoke security audit sub-agent
 * 3. Check complexity metrics via MCP
 * 4. Update task status via MCP
 * 5. Generate summary report
 */
class CodeReviewSkill {
  constructor() {
    this.composer = new FeatureComposer({
      debug: true,
      logger: console
    });
  }

  /**
   * Perform comprehensive code review
   * @param {string} filePath - Path to file or directory to review
   * @param {string} taskId - Task Master task ID (optional)
   * @returns {Promise<Object>} Review results
   */
  async review(filePath, taskId = null) {
    console.log(`\n🔍 Starting comprehensive code review for: ${filePath}\n`);

    const results = {
      filePath,
      timestamp: new Date().toISOString(),
      steps: []
    };

    try {
      // Step 1: Run code review slash command
      console.log('📋 Step 1: Running code review analysis...');
      const reviewResult = await this.composer.executeSlashCommand('code-review', {
        path: filePath
      });

      results.steps.push({
        name: 'code-review',
        status: 'completed',
        result: reviewResult.expandedPrompt
      });

      console.log('✓ Code review analysis completed\n');

      // Step 2: Invoke security audit sub-agent
      console.log('🔒 Step 2: Running security audit...');
      const securityResult = await this.composer.invokeSubAgent(
        'security_audit_agent',
        `Perform security audit on ${filePath}. Focus on:
         - Authentication/authorization issues
         - Input validation vulnerabilities
         - SQL injection risks
         - XSS vulnerabilities
         - Sensitive data exposure`,
        {
          timeout: 120000,
          parseResponse: true
        }
      );

      results.steps.push({
        name: 'security-audit',
        status: securityResult.status,
        findings: securityResult.message
      });

      if (securityResult.status === 'SUCCESS') {
        console.log('✓ Security audit completed - no critical issues\n');
      } else if (securityResult.status === 'PARTIAL') {
        console.log('⚠ Security audit completed with warnings\n');
      } else {
        console.log('✗ Security audit found issues\n');
      }

      // Step 3: Check complexity metrics (if MCP available)
      console.log('📊 Step 3: Checking complexity metrics...');
      try {
        const metricsResult = await this.composer.queryMCP(
          'code-metrics',
          'analyze_complexity',
          { path: filePath }
        );

        results.steps.push({
          name: 'complexity-analysis',
          status: 'completed',
          metrics: metricsResult.data
        });

        console.log('✓ Complexity analysis completed\n');
      } catch (error) {
        console.log(`ℹ Skipping complexity analysis: ${error.message}\n`);
        results.steps.push({
          name: 'complexity-analysis',
          status: 'skipped',
          reason: 'MCP not available'
        });
      }

      // Step 4: Update task status (if task ID provided)
      if (taskId) {
        console.log('📝 Step 4: Updating task status...');
        try {
          const taskUpdate = await this.composer.queryMCP(
            'task-master-ai',
            'update_subtask',
            {
              id: taskId,
              notes: `Code review completed for ${filePath}. Security status: ${securityResult.status}`
            }
          );

          results.steps.push({
            name: 'task-update',
            status: 'completed',
            taskId
          });

          console.log('✓ Task updated\n');
        } catch (error) {
          console.log(`ℹ Could not update task: ${error.message}\n`);
          results.steps.push({
            name: 'task-update',
            status: 'skipped',
            reason: 'Task Master MCP not available'
          });
        }
      }

      // Generate summary
      results.summary = this.generateSummary(results);
      results.overallStatus = this.determineOverallStatus(results);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 REVIEW SUMMARY');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(results.summary);
      console.log(`\n✓ Overall Status: ${results.overallStatus}\n`);

      return results;

    } catch (error) {
      console.error('✗ Error during code review:', error.message);
      results.error = error.message;
      results.overallStatus = 'FAILED';
      return results;
    }
  }

  /**
   * Generate summary from review results
   * @param {Object} results - Review results
   * @returns {string} Summary text
   */
  generateSummary(results) {
    const completedSteps = results.steps.filter(s => s.status === 'completed').length;
    const totalSteps = results.steps.length;

    let summary = `Completed ${completedSteps}/${totalSteps} review steps for ${results.filePath}\n\n`;

    for (const step of results.steps) {
      const icon = step.status === 'completed' ? '✓' :
                   step.status === 'skipped' ? '⊘' : '✗';
      summary += `${icon} ${step.name}: ${step.status}\n`;
    }

    return summary;
  }

  /**
   * Determine overall review status
   * @param {Object} results - Review results
   * @returns {string} Overall status
   */
  determineOverallStatus(results) {
    const securityStep = results.steps.find(s => s.name === 'security-audit');

    if (!securityStep) return 'INCOMPLETE';
    if (securityStep.status === 'ERROR') return 'FAILED';
    if (securityStep.status === 'PARTIAL') return 'NEEDS_ATTENTION';

    return 'PASSED';
  }
}

/**
 * Example 2: Deployment Workflow Skill
 *
 * Orchestrates pre-deployment checks using feature composition
 */
class DeploymentWorkflowSkill {
  constructor() {
    this.composer = new FeatureComposer({ debug: false });
  }

  /**
   * Run pre-deployment checks
   * @param {string} version - Version being deployed
   * @returns {Promise<Object>} Deployment readiness results
   */
  async preDeploymentChecks(version) {
    console.log(`\n🚀 Running pre-deployment checks for version ${version}\n`);

    // Use compose() for sequential workflow with dependencies
    const results = await this.composer.compose([
      {
        type: 'command',
        name: 'run-tests',
        command: 'check',
        params: { scope: 'all' },
        onResult: async (result, previous) => {
          console.log('✓ Tests completed');
        }
      },
      {
        type: 'agent',
        name: 'security-scan',
        agent: 'security_audit_agent',
        input: 'Perform pre-deployment security scan',
        onResult: async (result, previous) => {
          if (result.status === 'ERROR') {
            throw new Error('Security scan failed - deployment blocked');
          }
          console.log('✓ Security scan passed');
        }
      },
      {
        type: 'command',
        name: 'build',
        command: 'build-and-fix',
        params: {},
        onResult: async (result, previous) => {
          console.log('✓ Build completed');
        }
      },
      {
        type: 'mcp',
        name: 'notify',
        mcp: 'slack-notifications',
        endpoint: 'send_message',
        data: {
          channel: '#deployments',
          message: `✓ Pre-deployment checks passed for version ${version}`
        },
        onResult: async (result, previous) => {
          console.log('✓ Notification sent');
        }
      }
    ]);

    console.log(`\n✓ All pre-deployment checks passed for version ${version}\n`);
    return results;
  }
}

/**
 * Example 3: Project Management Automation Skill
 *
 * Automates task management by composing MCP queries and commands
 */
class ProjectManagementSkill {
  constructor() {
    this.composer = new FeatureComposer({ debug: false });
  }

  /**
   * Complete a task with full workflow
   * @param {string} taskId - Task ID to complete
   * @returns {Promise<Object>} Task completion results
   */
  async completeTask(taskId) {
    console.log(`\n📋 Completing task ${taskId}\n`);

    // Get current task details
    const task = await this.composer.queryMCP(
      'task-master-ai',
      'get_task',
      { id: taskId }
    );

    console.log(`Task: ${task.data?.title || 'Unknown'}`);

    // Generate completion message
    const completionMessage = await this.composer.executeSlashCommand(
      'taskmaster-complete',
      { ARGUMENTS: taskId }
    );

    // Update task status
    const updateResult = await this.composer.queryMCP(
      'task-master-ai',
      'set_task_status',
      { id: taskId, status: 'done' }
    );

    // Get next task
    const nextTask = await this.composer.queryMCP(
      'task-master-ai',
      'next_task',
      {}
    );

    console.log(`✓ Task ${taskId} completed`);
    if (nextTask.data) {
      console.log(`Next task: ${nextTask.data.id} - ${nextTask.data.title}`);
    }

    return {
      completed: taskId,
      next: nextTask.data
    };
  }
}

// ============================================================================
// Demo Execution
// ============================================================================

async function runDemo() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  Feature Composer Integration Examples            ║');
  console.log('╚════════════════════════════════════════════════════╝');

  // Example 1: Code Review Skill
  console.log('\n📍 Example 1: Comprehensive Code Review Skill');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const reviewSkill = new CodeReviewSkill();

  try {
    const reviewResults = await reviewSkill.review('./src/auth', '1.2');
    console.log('Review completed successfully');
    console.log(`Overall status: ${reviewResults.overallStatus}`);
  } catch (error) {
    console.error('Review failed:', error.message);
  }

  // Example 2: Deployment Workflow Skill
  console.log('\n📍 Example 2: Deployment Workflow Skill');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const deploymentSkill = new DeploymentWorkflowSkill();

  try {
    const deploymentResults = await deploymentSkill.preDeploymentChecks('2.1.0');
    console.log('Pre-deployment checks completed');
  } catch (error) {
    console.error('Deployment checks failed:', error.message);
  }

  // Example 3: Project Management Skill
  console.log('\n📍 Example 3: Project Management Automation Skill');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const pmSkill = new ProjectManagementSkill();

  try {
    const taskResult = await pmSkill.completeTask('1.2');
    console.log('Task management workflow completed');
  } catch (error) {
    console.error('Task management failed:', error.message);
  }

  console.log('\n✓ All examples completed\n');
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { CodeReviewSkill, DeploymentWorkflowSkill, ProjectManagementSkill };
