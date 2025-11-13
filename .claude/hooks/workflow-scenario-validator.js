#!/usr/bin/env node

/**
 * Workflow vs Scenario Validation Hook
 *
 * Purpose: Prevents cross-pollution by validating whether user is creating
 *          a workflow or scenario and warning if misclassified.
 *
 * Triggers: UserPromptSubmit
 * Blocks: No (informational only)
 */

const userPrompt = process.env.USER_PROMPT || '';

// Detection patterns
const createWorkflowPattern = /create.*workflow|new workflow|workflow.*for|build.*workflow|implement.*workflow/i;
const createScenarioPattern = /create.*scenario|new scenario|scenario.*for|build.*scenario|implement.*scenario/i;

// Business vs Technical keyword analysis
const businessKeywords = [
  'client', 'customer', 'revenue', 'onboarding', 'delivery',
  'payment', 'milestone', 'conversion', 'retention', 'signup',
  'subscription', 'order', 'fulfillment', 'checkout', 'journey'
];

const technicalKeywords = [
  'MCP', 'hook', 'agent', 'command', 'API', 'integration',
  'setup', 'configure', 'install', 'deploy', 'webhook',
  'endpoint', 'database', 'query', 'cache', 'authentication'
];

// Workflow composition indicators
const compositionKeywords = [
  'and then', 'followed by', 'after that', 'which triggers',
  'combines', 'orchestrates', 'uses multiple', 'integrates with'
];

// Branching indicators
const branchingKeywords = [
  'if', 'else', 'depending on', 'based on', 'when',
  'different paths', 'options', 'variations', 'branches'
];

function countKeywords(text, keywords) {
  const lowerText = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    return count + (lowerText.includes(keyword) ? 1 : 0);
  }, 0);
}

function analyzePrompt(prompt) {
  const businessCount = countKeywords(prompt, businessKeywords);
  const technicalCount = countKeywords(prompt, technicalKeywords);
  const compositionCount = countKeywords(prompt, compositionKeywords);
  const branchingCount = countKeywords(prompt, branchingKeywords);

  return {
    businessCount,
    technicalCount,
    compositionCount,
    branchingCount,
    looksLikeWorkflow: technicalCount > businessCount && compositionCount < 2,
    looksLikeScenario: businessCount > technicalCount || compositionCount >= 2 || branchingCount >= 2
  };
}

// Validate workflow creation
if (createWorkflowPattern.test(userPrompt)) {
  const analysis = analyzePrompt(userPrompt);

  console.log('\n📋 WORKFLOW Creation Detected');
  console.log('═'.repeat(50));

  console.log('\n✓ Validation Checklist for WORKFLOW:');
  console.log('   □ Single technical purpose? (should be YES)');
  console.log('   □ Reusable across scenarios? (should be YES)');
  console.log('   □ Linear flow (no major branching)? (should be YES)');
  console.log('   □ Uses 2-5 components? (should be YES)');
  console.log('   □ Domain-specific business logic? (should be NO)');

  // Warn if looks like scenario
  if (analysis.looksLikeScenario) {
    console.log('\n⚠️  WARNING: This appears to have SCENARIO characteristics:');

    if (analysis.businessCount > analysis.technicalCount) {
      console.log(`   • High business keyword count: ${analysis.businessCount} (vs ${analysis.technicalCount} technical)`);
    }

    if (analysis.compositionCount >= 2) {
      console.log(`   • Workflow composition detected: ${analysis.compositionCount} composition indicators`);
    }

    if (analysis.branchingCount >= 2) {
      console.log(`   • Branching logic detected: ${analysis.branchingCount} branching indicators`);
    }

    console.log('\n💡 SUGGESTION:');
    console.log('   Consider creating a SCENARIO instead that:');
    console.log('   1. Breaks technical parts into separate workflows');
    console.log('   2. Orchestrates workflows with business logic');
    console.log('   3. Uses decision tree for branching');
    console.log('\n   Command: "create scenario for [description]"');
  } else {
    console.log('\n✓ Analysis: Looks appropriate for WORKFLOW');
  }

  console.log('\n📖 Reference: Docs/workflows/templates/VALIDATION_RULES.md');
  console.log('═'.repeat(50) + '\n');
}

// Validate scenario creation
if (createScenarioPattern.test(userPrompt)) {
  const analysis = analyzePrompt(userPrompt);

  console.log('\n📋 SCENARIO Creation Detected');
  console.log('═'.repeat(50));

  console.log('\n✓ Validation Checklist for SCENARIO:');
  console.log('   □ Complete business process? (should be YES)');
  console.log('   □ Uses 3+ workflows? (should be YES)');
  console.log('   □ Has branching/decision points? (should be YES)');
  console.log('   □ Domain-specific? (should be YES)');
  console.log('   □ Single technical purpose? (should be NO)');

  // Warn if looks like workflow
  if (analysis.looksLikeWorkflow) {
    console.log('\n⚠️  WARNING: This appears to have WORKFLOW characteristics:');

    if (analysis.technicalCount > analysis.businessCount) {
      console.log(`   • High technical keyword count: ${analysis.technicalCount} (vs ${analysis.businessCount} business)`);
    }

    if (analysis.compositionCount < 2) {
      console.log('   • No workflow composition detected (single purpose)');
    }

    if (analysis.branchingCount < 2) {
      console.log('   • No branching logic detected (linear flow)');
    }

    console.log('\n💡 SUGGESTION:');
    console.log('   Consider creating a WORKFLOW instead:');
    console.log('   1. Focus on single technical purpose');
    console.log('   2. Make it reusable across scenarios');
    console.log('   3. Keep flow linear and sequential');
    console.log('\n   Command: "create workflow for [description]"');
  } else {
    console.log('\n✓ Analysis: Looks appropriate for SCENARIO');
  }

  console.log('\n📖 Reference: Docs/scenarios/templates/VALIDATION_RULES.md');
  console.log('═'.repeat(50) + '\n');
}

// Detect ambiguous creation requests
const ambiguousPattern = /create|build|implement|setup/i;
if (ambiguousPattern.test(userPrompt) &&
    !createWorkflowPattern.test(userPrompt) &&
    !createScenarioPattern.test(userPrompt)) {

  const analysis = analyzePrompt(userPrompt);

  // Only show if significant indicators present
  if (analysis.businessCount >= 2 || analysis.technicalCount >= 2) {
    console.log('\n💭 Workflow vs Scenario Guidance:');
    console.log('─'.repeat(50));

    if (analysis.looksLikeScenario) {
      console.log('   This request appears to be a SCENARIO:');
      console.log(`   • Business focus: ${analysis.businessCount} business keywords`);
      console.log(`   • Composition: ${analysis.compositionCount} workflows mentioned`);
      console.log(`   • Branching: ${analysis.branchingCount} decision points`);
      console.log('\n   Use: "create scenario for [description]"');
    } else if (analysis.looksLikeWorkflow) {
      console.log('   This request appears to be a WORKFLOW:');
      console.log(`   • Technical focus: ${analysis.technicalCount} technical keywords`);
      console.log('   • Single purpose (no composition detected)');
      console.log('   • Linear flow (no branching detected)');
      console.log('\n   Use: "create workflow for [description]"');
    }

    console.log('\n   See: Docs/workflows/templates/VALIDATION_RULES.md');
    console.log('─'.repeat(50) + '\n');
  }
}

process.exit(0);
