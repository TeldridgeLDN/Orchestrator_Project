#!/usr/bin/env node
/**
 * Natural Language Pattern Tester
 * 
 * Tests natural language detection for Taskmaster critical evaluation
 * Usage: node test-natural-language.js
 */

// Patterns from taskmasterCriticalReview.js
const taskmasterPatterns = [
  // CLI commands
  /task-master\s+parse-prd/i,
  /tm-parse-prd/i,
  /task-master\s+add-task/i,
  /tm-add-task/i,
  
  // Natural language patterns
  /parse\s+(the\s+)?prd/i,
  /parse\s+(a\s+)?prds?\b/i,
  /add\s+(a\s+)?(new\s+)?task/i,
  /create\s+(a\s+)?(new\s+)?task/i,
  /generate\s+tasks?\b/i,
  /add\s+.*\s+task\s+to\s+taskmaster/i,
  /create\s+.*\s+task\s+in\s+taskmaster/i,
  /taskmaster\s+add\s+task/i,
  /add\s+task\s+for\s+/i,
  /add\s+task:\s*/i,
  
  // MCP tool calls
  /mcp.*parse_prd/i,
  /mcp.*add_task/i
];

// Test cases
const testCases = [
  // User's specific example
  { text: 'Add authentication task to taskmaster', shouldMatch: true, category: '🎯 User Example' },
  
  // Natural language variations
  { text: 'Add a task to taskmaster', shouldMatch: true, category: '✅ Add to Taskmaster' },
  { text: 'Add user profile task to taskmaster', shouldMatch: true, category: '✅ Add to Taskmaster' },
  { text: 'Add API endpoint task to taskmaster', shouldMatch: true, category: '✅ Add to Taskmaster' },
  
  // Create variations
  { text: 'Create a new task', shouldMatch: true, category: '✅ Create Task' },
  { text: 'Create task for login', shouldMatch: true, category: '✅ Create Task' },
  { text: 'create a task', shouldMatch: true, category: '✅ Create Task' },
  { text: 'CREATE TASK', shouldMatch: true, category: '✅ Create Task' },
  
  // Add task variations
  { text: 'Add task', shouldMatch: true, category: '✅ Add Task' },
  { text: 'add new task', shouldMatch: true, category: '✅ Add Task' },
  { text: 'Add a task', shouldMatch: true, category: '✅ Add Task' },
  
  // Colon notation
  { text: 'Add task: Implement JWT authentication', shouldMatch: true, category: '✅ Colon Notation' },
  { text: 'add task: user registration', shouldMatch: true, category: '✅ Colon Notation' },
  
  // PRD parsing
  { text: 'Parse the PRD', shouldMatch: true, category: '✅ PRD Parsing' },
  { text: 'parse prd file', shouldMatch: true, category: '✅ PRD Parsing' },
  { text: 'Parse a PRD', shouldMatch: true, category: '✅ PRD Parsing' },
  
  // Generate
  { text: 'Generate tasks', shouldMatch: true, category: '✅ Generate' },
  { text: 'generate task from spec', shouldMatch: true, category: '✅ Generate' },
  
  // CLI commands
  { text: 'task-master add-task --prompt="auth"', shouldMatch: true, category: '✅ CLI' },
  { text: 'tm-add-task', shouldMatch: true, category: '✅ CLI' },
  { text: 'task-master parse-prd prd.txt', shouldMatch: true, category: '✅ CLI' },
  { text: 'tm-parse-prd', shouldMatch: true, category: '✅ CLI' },
  
  // Should NOT match (view/status commands)
  { text: 'Show tasks', shouldMatch: false, category: '❌ View Commands' },
  { text: 'List tasks', shouldMatch: false, category: '❌ View Commands' },
  { text: 'task-master list', shouldMatch: false, category: '❌ View Commands' },
  { text: 'Update task 5', shouldMatch: false, category: '❌ Status Commands' },
  { text: 'Mark task done', shouldMatch: false, category: '❌ Status Commands' },
  { text: 'task-master set-status', shouldMatch: false, category: '❌ Status Commands' },
  
  // Should NOT match (wrong tense/form)
  { text: 'Added a task yesterday', shouldMatch: false, category: '❌ Past Tense' },
  { text: 'I will add a task later', shouldMatch: false, category: '❌ Future Tense' },
  { text: 'task addition', shouldMatch: false, category: '❌ Wrong Form' },
];

// Helper to test a single phrase
function testPhrase(text) {
  return taskmasterPatterns.some(pattern => pattern.test(text));
}

// Run tests
console.log('\n🧪 NATURAL LANGUAGE DETECTION TEST\n');
console.log('═'.repeat(80) + '\n');

let passed = 0;
let failed = 0;
const failures = [];

// Group by category
const grouped = testCases.reduce((acc, test) => {
  if (!acc[test.category]) acc[test.category] = [];
  acc[test.category].push(test);
  return acc;
}, {});

// Test each category
Object.entries(grouped).forEach(([category, tests]) => {
  console.log(`\n${category}\n${'─'.repeat(80)}`);
  
  tests.forEach(test => {
    const result = testPhrase(test.text);
    const success = result === test.shouldMatch;
    
    if (success) {
      passed++;
      console.log(`  ✅ "${test.text}"`);
    } else {
      failed++;
      failures.push({ ...test, got: result });
      const expected = test.shouldMatch ? 'MATCH' : 'NO MATCH';
      const got = result ? 'MATCHED' : 'NO MATCH';
      console.log(`  ❌ "${test.text}"`);
      console.log(`     Expected: ${expected}, Got: ${got}`);
    }
  });
});

// Summary
console.log('\n' + '═'.repeat(80));
console.log('\n📊 SUMMARY\n');
console.log(`  Total Tests:  ${testCases.length}`);
console.log(`  ✅ Passed:     ${passed}`);
console.log(`  ❌ Failed:     ${failed}`);
console.log(`  Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.log('\n❌ FAILURES:\n');
  failures.forEach(f => {
    console.log(`  "${f.text}"`);
    console.log(`    Expected: ${f.shouldMatch ? 'MATCH' : 'NO MATCH'}`);
    console.log(`    Got:      ${f.got ? 'MATCH' : 'NO MATCH'}`);
  });
}

console.log('\n' + '═'.repeat(80));

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);

