#!/usr/bin/env node
/**
 * Test script for skill-rules.json regex patterns
 * Validates that all patterns correctly match and extract parameters
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load skill-rules.json
const skillRulesPath = path.join(os.homedir(), '.claude', 'skill-rules.json');
const skillRules = JSON.parse(fs.readFileSync(skillRulesPath, 'utf-8'));

// Test cases for each pattern
const testCases = [
  // Switch project tests
  {
    category: 'project_orchestrator',
    pattern: 'switch_project',
    tests: [
      { input: 'switch to shopify project', expected: { project_name: 'shopify' } },
      { input: 'change to project blog', expected: { project_name: 'blog' } },
      { input: 'switch project documentation', expected: { project_name: 'documentation' } },
      { input: 'SWITCH TO PROJECT test123', expected: { project_name: 'test123' } }
    ]
  },
  // Create project tests
  {
    category: 'project_orchestrator',
    pattern: 'create_project',
    tests: [
      { input: 'create project blog', expected: { project_name: 'blog', template_name: undefined } },
      { input: 'make project ecommerce using shopify template', expected: { project_name: 'ecommerce', template_name: 'shopify' } },
      { input: 'new project docs', expected: { project_name: 'docs', template_name: undefined } }
    ]
  },
  // List projects tests
  {
    category: 'project_orchestrator',
    pattern: 'list_projects',
    tests: [
      { input: 'list projects', expected: {} },
      { input: 'show my projects', expected: {} },
      { input: 'display all projects', expected: {} },
      { input: 'LIST PROJECTS', expected: {} }
    ]
  },
  // Remove project tests
  {
    category: 'project_orchestrator',
    pattern: 'remove_project',
    tests: [
      { input: 'remove project blog', expected: { project_name: 'blog' } },
      { input: 'delete project test', expected: { project_name: 'test' } },
      { input: 'destroy project temp', expected: { project_name: 'temp' } }
    ]
  },
  // Validate project tests
  {
    category: 'project_orchestrator',
    pattern: 'validate_project',
    tests: [
      { input: 'validate project blog', expected: { project_name: 'blog' } },
      { input: 'check project ecommerce', expected: { project_name: 'ecommerce' } },
      { input: 'verify project documentation', expected: { project_name: 'documentation' } },
      { input: 'validate project', expected: { project_name: undefined } }
    ]
  },
  // Get active project tests
  {
    category: 'project_orchestrator',
    pattern: 'get_active_project',
    tests: [
      { input: 'what is the current project', expected: {} },
      { input: 'which is the active project', expected: {} },
      { input: "what's the current project", expected: {} }
    ]
  },
  // Register project tests
  {
    category: 'project_orchestrator',
    pattern: 'register_project',
    tests: [
      { input: 'register project at /Users/you/my-project', expected: { project_path: '/Users/you/my-project' } },
      { input: 'register project ./my-project', expected: { project_path: './my-project' } }
    ]
  },
  // List skills tests
  {
    category: 'skill_management',
    pattern: 'list_skills',
    tests: [
      { input: 'list skills', expected: {} },
      { input: 'show available skills', expected: {} },
      { input: 'what skills are available', expected: {} }
    ]
  },
  // Activate skill tests
  {
    category: 'skill_management',
    pattern: 'activate_skill',
    tests: [
      { input: 'activate the shopify skill', expected: { skill_name: 'shopify' } },
      { input: 'enable seo skill', expected: { skill_name: 'seo' } },
      { input: 'load web_dev skill', expected: { skill_name: 'web_dev' } }
    ]
  },
  // Context management tests
  {
    category: 'context_management',
    pattern: 'refresh_context',
    tests: [
      { input: 'refresh context', expected: {} },
      { input: 'reload project context', expected: {} }
    ]
  },
  {
    category: 'context_management',
    pattern: 'clear_cache',
    tests: [
      { input: 'clear cache', expected: {} },
      { input: 'clear project cache', expected: {} }
    ]
  }
];

// Run tests
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

console.log('🧪 Testing skill-rules.json patterns\n');
console.log('=' .repeat(80));

testCases.forEach(({ category, pattern: patternName, tests }) => {
  const categoryData = skillRules[category];
  if (!categoryData) {
    console.error(`❌ Category '${category}' not found in skill-rules.json`);
    return;
  }

  const patternData = categoryData.patterns.find(p => p.name === patternName);
  if (!patternData) {
    console.error(`❌ Pattern '${patternName}' not found in category '${category}'`);
    return;
  }

  console.log(`\n📋 Testing: ${category}.${patternName}`);
  console.log(`   Regex: ${patternData.regex}`);
  console.log(`   Action: ${patternData.action || 'N/A'}`);
  console.log('-'.repeat(80));

  // Extract flags from regex pattern (e.g., (?i) for case-insensitive)
  let regexPattern = patternData.regex;
  let flags = '';
  
  // Check for inline flags like (?i)
  if (regexPattern.startsWith('(?i)')) {
    flags = 'i';
    regexPattern = regexPattern.substring(4); // Remove (?i)
  }
  
  const regex = new RegExp(regexPattern, flags);

  tests.forEach(({ input, expected }) => {
    totalTests++;
    const match = input.match(regex);

    if (!match) {
      console.log(`   ❌ FAIL: "${input}"`);
      console.log(`      Expected match but got none`);
      failedTests++;
      return;
    }

    // Extract parameters based on pattern extraction config
    const extracted = {};
    if (patternData.extraction) {
      Object.entries(patternData.extraction).forEach(([key, value]) => {
        // Handle multiple group options (e.g., "$2|$3|$4")
        if (value.includes('|')) {
          const groupNums = value.split('|').map(g => parseInt(g.replace('$', ''), 10));
          // Find first non-undefined match
          extracted[key] = groupNums.map(num => match[num]).find(v => v !== undefined);
        } else {
          // Extract group number from $N syntax
          const groupNum = parseInt(value.replace('$', ''), 10);
          extracted[key] = match[groupNum];
        }
      });
    }

    // Check if extracted values match expected
    let matches = true;
    Object.entries(expected).forEach(([key, value]) => {
      if (extracted[key] !== value) {
        matches = false;
      }
    });

    if (matches) {
      console.log(`   ✅ PASS: "${input}"`);
      if (Object.keys(extracted).length > 0) {
        console.log(`      Extracted: ${JSON.stringify(extracted)}`);
      }
      passedTests++;
    } else {
      console.log(`   ❌ FAIL: "${input}"`);
      console.log(`      Expected: ${JSON.stringify(expected)}`);
      console.log(`      Got: ${JSON.stringify(extracted)}`);
      failedTests++;
    }
  });
});

// Summary
console.log('\n' + '='.repeat(80));
console.log(`\n📊 Test Summary:`);
console.log(`   Total: ${totalTests}`);
console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${failedTests}`);
console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the patterns.');
  process.exit(1);
}

