#!/bin/bash
# Diagnostic script to test npm test behavior

echo "=== Test Diagnostic Script ==="
echo "Working directory: $(pwd)"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Shell: $SHELL"
echo ""

echo "=== Checking vitest installation ==="
ls -la node_modules/.bin/vitest 2>&1 || echo "vitest not found"
echo ""

echo "=== Running npm test with timeout protection ==="
# Start test in background
npm test 2>&1 &
TEST_PID=$!

# Wait up to 30 seconds
for i in {1..30}; do
  if ! kill -0 $TEST_PID 2>/dev/null; then
    wait $TEST_PID
    EXIT_CODE=$?
    echo ""
    echo "=== Test completed after ~$i seconds ==="
    echo "Exit code: $EXIT_CODE"
    exit $EXIT_CODE
  fi
  sleep 1
  if [ $i -eq 5 ]; then
    echo "Test still running after 5 seconds..."
  fi
  if [ $i -eq 10 ]; then
    echo "Test still running after 10 seconds... (UNUSUAL)"
  fi
  if [ $i -eq 20 ]; then
    echo "Test still running after 20 seconds... (VERY UNUSUAL - likely hung)"
  fi
done

# If we get here, test is hung
echo ""
echo "=== TEST APPEARS TO BE HUNG (30+ seconds) ==="
echo "Killing process..."
kill -9 $TEST_PID 2>/dev/null
echo "Process killed"
exit 124  # Timeout exit code






