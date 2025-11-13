import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000, // 10 second timeout for async tests
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        '**/*.config.js',
        '**/__tests__/**',
        'lib/scenario_validator.py', // Python file
        'lib/podcast-learning/node_modules/**'
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80
    }
  }
});

