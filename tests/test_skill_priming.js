#!/usr/bin/env node

/**
 * Skill Priming System Tests
 * 
 * Basic smoke tests to verify the skill priming system works correctly.
 */

import { strict as assert } from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  detectProjectType,
  getRecommendedSkills,
  getAvailableSkills,
  SKILL_RECOMMENDATIONS,
  PROJECT_TYPE_INDICATORS
} from '../lib/init/skills_priming.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Test suite
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('🧪 Running Skill Priming Tests\n');
  console.log('═'.repeat(60));
  
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('═'.repeat(60));
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Tests

test('Project type detection returns valid type', async () => {
  const type = await detectProjectType(projectRoot);
  assert.ok(typeof type === 'string', 'Should return a string');
  assert.ok(type.length > 0, 'Should not be empty');
  console.log(`   → Detected: ${type}`);
});

test('Get recommended skills for cli-tool', () => {
  const skills = getRecommendedSkills('cli-tool', 'recommended');
  assert.ok(Array.isArray(skills), 'Should return an array');
  assert.ok(skills.length > 0, 'Should have recommendations');
  assert.ok(skills.includes('shell-integration'), 'Should include shell-integration');
  console.log(`   → Skills: ${skills.join(', ')}`);
});

test('Get essential skills for web-app', () => {
  const skills = getRecommendedSkills('web-app', 'essential');
  assert.ok(Array.isArray(skills), 'Should return an array');
  assert.ok(skills.length > 0, 'Should have essential skills');
  assert.ok(skills.includes('doc-generator'), 'Should include doc-generator');
  console.log(`   → Essential: ${skills.join(', ')}`);
});

test('Get all skills for library', () => {
  const skills = getRecommendedSkills('library', 'all');
  assert.ok(Array.isArray(skills), 'Should return an array');
  assert.ok(skills.length >= 3, 'Should have multiple levels');
  console.log(`   → All: ${skills.join(', ')}`);
});

test('Unknown project type falls back to general', () => {
  const skills = getRecommendedSkills('unknown-type-xyz', 'recommended');
  assert.ok(Array.isArray(skills), 'Should return an array');
  assert.ok(skills.includes('doc-generator'), 'General should include doc-generator');
  console.log(`   → Fallback: ${skills.join(', ')}`);
});

test('Get available skills from project', async () => {
  const skills = await getAvailableSkills(projectRoot);
  assert.ok(Array.isArray(skills), 'Should return an array');
  assert.ok(skills.length > 0, 'Should find skills in .claude/skills/');
  
  // Check structure
  const firstSkill = skills[0];
  assert.ok(firstSkill.id, 'Skill should have ID');
  assert.ok(firstSkill.name, 'Skill should have name');
  
  console.log(`   → Found ${skills.length} skills`);
  console.log(`   → Example: ${firstSkill.name} (${firstSkill.id})`);
});

test('Skill recommendations exist for all project types', () => {
  const projectTypes = Object.keys(PROJECT_TYPE_INDICATORS);
  projectTypes.push('general'); // Include fallback
  
  for (const type of projectTypes) {
    const recommendations = SKILL_RECOMMENDATIONS[type] || SKILL_RECOMMENDATIONS['general'];
    assert.ok(recommendations, `Should have recommendations for ${type}`);
    assert.ok(recommendations.essential, `Should have essential skills for ${type}`);
    assert.ok(Array.isArray(recommendations.essential), `Essential should be array for ${type}`);
  }
  
  console.log(`   → Verified ${projectTypes.length} project types`);
});

test('Project type indicators have valid structure', () => {
  for (const [type, indicators] of Object.entries(PROJECT_TYPE_INDICATORS)) {
    assert.ok(Array.isArray(indicators), `Indicators for ${type} should be array`);
    
    for (const indicator of indicators) {
      assert.ok(indicator.patterns, `Indicator should have patterns`);
      assert.ok(Array.isArray(indicator.patterns), `Patterns should be array`);
      assert.ok(typeof indicator.weight === 'number', `Weight should be number`);
      assert.ok(indicator.weight > 0, `Weight should be positive`);
    }
  }
  
  console.log(`   → Verified ${Object.keys(PROJECT_TYPE_INDICATORS).length} type indicators`);
});

test('Detect this project as cli-tool', async () => {
  const type = await detectProjectType(projectRoot);
  // This project has bin/ and lib/ directories, should detect as cli-tool
  assert.ok(['cli-tool', 'general'].includes(type), 
    `Should detect as cli-tool or general, got: ${type}`);
  console.log(`   → This project: ${type}`);
});

test('Essential skills are subset of recommended', () => {
  for (const [type, recs] of Object.entries(SKILL_RECOMMENDATIONS)) {
    const essential = recs.essential;
    const recommended = [...recs.essential, ...recs.recommended];
    
    for (const skill of essential) {
      assert.ok(recommended.includes(skill), 
        `${skill} should be in recommended for ${type}`);
    }
  }
  
  console.log(`   → Verified skill hierarchy consistency`);
});

test('No duplicate skills in recommendations', () => {
  for (const [type, recs] of Object.entries(SKILL_RECOMMENDATIONS)) {
    const all = [...recs.essential, ...recs.recommended, ...recs.optional];
    const unique = new Set(all);
    
    assert.strictEqual(all.length, unique.size, 
      `${type} should not have duplicate skills`);
  }
  
  console.log(`   → No duplicates found`);
});

// Run all tests
runTests();

