#!/usr/bin/env node
/**
 * Lateral Thinking Demo Script
 * 
 * Demonstrates the complete lateral thinking workflow with multiple
 * real-world scenarios. Run with mock LLM (no API key needed) or
 * real LLM providers.
 * 
 * Usage:
 *   node lib/lateral-thinking/demo.js                    # Mock mode
 *   node lib/lateral-thinking/demo.js --provider anthropic  # Real Claude
 *   node lib/lateral-thinking/demo.js --provider openai     # Real GPT
 */

import { LateralThinkingSession } from './index.js';
import { LLMClient } from './llm/client.js';
import chalk from 'chalk';

// Parse command line arguments
const args = process.argv.slice(2);
const providerArg = args.find(arg => arg.startsWith('--provider='));
const provider = providerArg ? providerArg.split('=')[1] : 'mock';

console.log(chalk.bold.cyan('\n🎨 Lateral Thinking Demo\n'));
console.log(chalk.gray('='.repeat(60)));

// Create LLM client
const llmClient = new LLMClient({
  provider,
  model: provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4',
  temperature: 0.7,
  maxTokens: 500
});

console.log(chalk.yellow(`\n📡 LLM Provider: ${provider}`));
if (provider !== 'mock') {
  const keyName = provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
  console.log(chalk.gray(`   Using ${keyName} from environment`));
}
console.log(chalk.gray('='.repeat(60)));

// Demo scenarios
const scenarios = [
  {
    name: 'Mobile Authentication',
    emoji: '🔐',
    context: {
      problem: 'Implement user authentication for mobile app',
      baseline: 'JWT tokens with username/password login',
      constraints: [
        'Must work offline',
        'Native iOS and Android support',
        'GDPR compliant'
      ],
      goals: [
        'Minimize user friction',
        'Strong security',
        'Login time < 1 second'
      ],
      team: {
        capabilities: ['React Native', 'Node.js', 'PostgreSQL']
      },
      timeline: 'Quick - 2 weeks',
      riskTolerance: 'medium'
    }
  },
  {
    name: 'E-Commerce Checkout',
    emoji: '🛒',
    context: {
      problem: 'Reduce shopping cart abandonment rate',
      baseline: 'Multi-step checkout: address → payment → review → confirm',
      constraints: [
        'PCI compliance required',
        'International shipping support',
        'Mobile-first design'
      ],
      goals: [
        'Increase conversion by 20%',
        'Maintain data security',
        'Support guest checkout'
      ],
      timeline: '3 weeks',
      riskTolerance: 'low'
    }
  },
  {
    name: 'API Scaling',
    emoji: '⚡',
    context: {
      problem: 'Scale API to handle 10x traffic increase',
      baseline: 'Single Node.js server with PostgreSQL database',
      constraints: [
        'Budget: $5000/month',
        'Zero downtime migration',
        'Maintain <200ms latency'
      ],
      goals: [
        'Handle 100k requests/second',
        'Auto-scale with demand',
        'Cost-efficient'
      ],
      team: {
        capabilities: ['Node.js', 'AWS', 'Docker', 'Redis']
      },
      timeline: '4 weeks',
      riskTolerance: 'medium'
    }
  }
];

/**
 * Run demo for a specific scenario
 */
async function runScenario(scenario, index) {
  console.log(chalk.bold.cyan(`\n\n${scenario.emoji} Scenario ${index + 1}: ${scenario.name}`));
  console.log(chalk.gray('─'.repeat(60)));
  
  console.log(chalk.white('\n📋 Problem:'), chalk.yellow(scenario.context.problem));
  console.log(chalk.white('📊 Baseline:'), chalk.gray(scenario.context.baseline));
  
  if (scenario.context.constraints) {
    console.log(chalk.white('\n⚠️  Constraints:'));
    scenario.context.constraints.forEach(c => {
      console.log(chalk.gray(`   • ${c}`));
    });
  }
  
  if (scenario.context.goals) {
    console.log(chalk.white('\n🎯 Goals:'));
    scenario.context.goals.forEach(g => {
      console.log(chalk.gray(`   • ${g}`));
    });
  }
  
  console.log(chalk.cyan('\n\n🚀 Running lateral thinking session...\n'));
  
  // Create session
  const session = new LateralThinkingSession({
    llmClient,
    tokenBudget: 3000,
    techniques: ['scamper', 'provocations'],
    ideasPerTechnique: 3,
    presentTopN: 3
  });
  
  try {
    // Run session
    const startTime = Date.now();
    const results = await session.run(scenario.context);
    const duration = Date.now() - startTime;
    
    // Display results
    console.log(chalk.bold.green('✅ Session Complete\n'));
    
    console.log(chalk.white('📊 Summary:'));
    console.log(chalk.gray(`   Ideas Generated: ${results.metrics.ideasGenerated}`));
    console.log(chalk.gray(`   After Clustering: ${results.metrics.ideasAfterClustering}`));
    console.log(chalk.gray(`   Top Options: ${results.metrics.topOptionsPresented}`));
    console.log(chalk.gray(`   Time: ${duration}ms`));
    
    console.log(chalk.bold.white('\n\n💡 Top Alternative Approaches:\n'));
    
    results.topOptions.forEach((option, i) => {
      console.log(chalk.bold.cyan(`\n${i + 1}. ${option.title}`));
      console.log(chalk.gray(`   ${option.confidence}`));
      console.log(chalk.white(`\n   ${option.description}`));
      
      console.log(chalk.white('\n   📈 Scores:'));
      console.log(chalk.gray(`      Total: ${(option.scores.total * 100).toFixed(0)}%`));
      console.log(chalk.gray(`      Feasibility: ${(option.scores.feasibility * 100).toFixed(0)}%`));
      console.log(chalk.gray(`      Impact: ${(option.scores.impact * 100).toFixed(0)}%`));
      console.log(chalk.gray(`      Novelty: ${(option.scores.novelty * 100).toFixed(0)}%`));
      
      console.log(chalk.white('\n   ✨ Why Interesting:'));
      console.log(chalk.gray(`      ${option.why}`));
      
      console.log(chalk.white('\n   ⚠️  Considerations:'));
      console.log(chalk.gray(`      ${option.caution}`));
      
      console.log(chalk.white('\n   📝 Next Steps:'));
      option.nextSteps.slice(0, 3).forEach(step => {
        console.log(chalk.gray(`      • ${step}`));
      });
    });
    
    // Show baseline comparison
    if (results.baseline) {
      console.log(chalk.bold.white('\n\n📊 Standard Approach (Baseline):\n'));
      console.log(chalk.gray(`   ${results.baseline.approach || results.baseline}`));
    }
    
    // Show available actions
    console.log(chalk.bold.white('\n\n⚡ Suggested Next Actions:\n'));
    results.actions.slice(0, 4).forEach(action => {
      console.log(chalk.cyan(`   • ${action.label}`));
      console.log(chalk.gray(`     ${action.description}`));
    });
    
  } catch (error) {
    console.log(chalk.bold.red('\n❌ Session Failed\n'));
    console.log(chalk.red(`   Error: ${error.message}`));
    
    if (provider !== 'mock') {
      console.log(chalk.yellow('\n   💡 Tip: Check your API key is set correctly'));
      const keyName = provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
      console.log(chalk.gray(`      export ${keyName}="your-key-here"`));
    }
  }
}

/**
 * Run all demo scenarios
 */
async function runDemo() {
  console.log(chalk.bold.white('\nRunning demos for 3 real-world scenarios...\n'));
  
  for (let i = 0; i < scenarios.length; i++) {
    await runScenario(scenarios[i], i);
    
    if (i < scenarios.length - 1) {
      console.log(chalk.gray('\n\n' + '═'.repeat(60)));
      
      // Brief pause between scenarios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(chalk.bold.green('\n\n✨ Demo Complete!\n'));
  console.log(chalk.gray('='.repeat(60)));
  
  console.log(chalk.white('\n📚 Next Steps:\n'));
  console.log(chalk.gray('   1. Review the generated alternatives'));
  console.log(chalk.gray('   2. Deep dive on interesting options'));
  console.log(chalk.gray('   3. Combine ideas for hybrid approaches'));
  console.log(chalk.gray('   4. Create proof-of-concepts\n'));
  
  if (provider === 'mock') {
    console.log(chalk.yellow('💡 To use real LLM:'));
    console.log(chalk.gray('   node lib/lateral-thinking/demo.js --provider=anthropic'));
    console.log(chalk.gray('   (Set ANTHROPIC_API_KEY environment variable first)\n'));
  }
}

// Run the demo
runDemo().catch(error => {
  console.error(chalk.red('\n❌ Fatal Error:'), error);
  process.exit(1);
});

