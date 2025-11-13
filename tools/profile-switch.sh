#!/bin/bash
#
# Profile Project Switch Performance
#
# This script profiles the Claude orchestrator's project switching performance
# to identify bottlenecks and ensure sub-second switching times.
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLAUDE_CLI="${HOME}/.claude/bin/claude"
PROFILE_DIR="${HOME}/Projects"
TEST_PROJECT_1="profile-test-1"
TEST_PROJECT_2="profile-test-2"
ITERATIONS=10
RESULTS_FILE="/tmp/profile-results-$(date +%Y%m%d-%H%M%S).txt"

echo "════════════════════════════════════════════════════════════════"
echo "  Claude Orchestrator - Performance Profiling"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check if CLI exists
if [[ ! -f "$CLAUDE_CLI" ]]; then
  echo -e "${RED}✗ Error: Claude CLI not found at $CLAUDE_CLI${NC}"
  echo "  Please ensure the orchestrator is installed."
  exit 1
fi

# Make CLI executable if needed
if [[ ! -x "$CLAUDE_CLI" ]]; then
  chmod +x "$CLAUDE_CLI"
fi

# Function to clean up test projects
cleanup_test_projects() {
  echo -e "${BLUE}→ Cleaning up test projects...${NC}"
  $CLAUDE_CLI project remove "$TEST_PROJECT_1" --force 2>/dev/null || true
  $CLAUDE_CLI project remove "$TEST_PROJECT_2" --force 2>/dev/null || true
  rm -rf "${PROFILE_DIR}/${TEST_PROJECT_1}" 2>/dev/null || true
  rm -rf "${PROFILE_DIR}/${TEST_PROJECT_2}" 2>/dev/null || true
}

# Cleanup on exit
trap cleanup_test_projects EXIT

# Step 1: Create test projects
echo -e "${BLUE}→ Creating test projects...${NC}"
echo ""

# Remove existing projects first
cleanup_test_projects

# Create project 1
echo "Creating ${TEST_PROJECT_1}..."
$CLAUDE_CLI project create "$TEST_PROJECT_1" --template base > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
  echo -e "${GREEN}  ✓ Created ${TEST_PROJECT_1}${NC}"
else
  echo -e "${RED}  ✗ Failed to create ${TEST_PROJECT_1}${NC}"
  exit 1
fi

# Create project 2
echo "Creating ${TEST_PROJECT_2}..."
$CLAUDE_CLI project create "$TEST_PROJECT_2" --template base > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
  echo -e "${GREEN}  ✓ Created ${TEST_PROJECT_2}${NC}"
else
  echo -e "${RED}  ✗ Failed to create ${TEST_PROJECT_2}${NC}"
  exit 1
fi

echo ""

# Step 2: Warm up cache
echo -e "${BLUE}→ Warming up cache...${NC}"
$CLAUDE_CLI project switch "$TEST_PROJECT_1" > /dev/null 2>&1
$CLAUDE_CLI project switch "$TEST_PROJECT_2" > /dev/null 2>&1
echo -e "${GREEN}  ✓ Cache warmed${NC}"
echo ""

# Step 3: Profile switching performance
echo "════════════════════════════════════════════════════════════════"
echo "  Performance Profiling - ${ITERATIONS} iterations"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Initialize results file
cat > "$RESULTS_FILE" <<EOF
Claude Orchestrator Performance Profile
Generated: $(date)
Host: $(hostname)
OS: $(uname -s) $(uname -r)
Node: $(node --version 2>/dev/null || echo "N/A")

═══════════════════════════════════════════════════════════════
RAW TIMINGS
═══════════════════════════════════════════════════════════════

EOF

# Array to store timings
declare -a timings_1=()
declare -a timings_2=()

# Run profiling iterations
for i in $(seq 1 $ITERATIONS); do
  echo -e "${YELLOW}Run $i/$ITERATIONS${NC}"

  # Profile switch to project 1
  echo "  → Switching to ${TEST_PROJECT_1}..."
  START=$(node -e "console.log(Date.now())")
  $CLAUDE_CLI project switch "$TEST_PROJECT_1" > /dev/null 2>&1
  END=$(node -e "console.log(Date.now())")
  TIME_1=$((END - START))
  timings_1+=($TIME_1)
  echo "    Time: ${TIME_1}ms"
  echo "Run $i - Switch to $TEST_PROJECT_1: ${TIME_1}ms" >> "$RESULTS_FILE"

  # Profile switch to project 2
  echo "  → Switching to ${TEST_PROJECT_2}..."
  START=$(node -e "console.log(Date.now())")
  $CLAUDE_CLI project switch "$TEST_PROJECT_2" > /dev/null 2>&1
  END=$(node -e "console.log(Date.now())")
  TIME_2=$((END - START))
  timings_2+=($TIME_2)
  echo "    Time: ${TIME_2}ms"
  echo "Run $i - Switch to $TEST_PROJECT_2: ${TIME_2}ms" >> "$RESULTS_FILE"

  echo ""
done

# Step 4: Calculate statistics
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Performance Analysis"
echo "════════════════════════════════════════════════════════════════"
echo ""

cat >> "$RESULTS_FILE" <<EOF

═══════════════════════════════════════════════════════════════
STATISTICAL ANALYSIS
═══════════════════════════════════════════════════════════════

EOF

# Function to calculate statistics
calculate_stats() {
  local name=$1
  shift
  local timings=("$@")

  # Calculate min, max, avg
  local min=${timings[0]}
  local max=${timings[0]}
  local sum=0

  for time in "${timings[@]}"; do
    sum=$((sum + time))
    if [[ $time -lt $min ]]; then
      min=$time
    fi
    if [[ $time -gt $max ]]; then
      max=$time
    fi
  done

  local avg=$((sum / ${#timings[@]}))

  # Calculate median (simplified)
  IFS=$'\n' sorted=($(sort -n <<<"${timings[*]}"))
  unset IFS
  local mid=$((${#sorted[@]} / 2))
  local median=${sorted[$mid]}

  # Output
  echo -e "${BLUE}$name:${NC}"
  echo "  Minimum:  ${min}ms"
  echo "  Maximum:  ${max}ms"
  echo "  Average:  ${avg}ms"
  echo "  Median:   ${median}ms"

  # Check against target (<1000ms)
  if [[ $avg -lt 1000 ]]; then
    echo -e "  Status:   ${GREEN}✓ PASS${NC} (target: <1000ms)"
  else
    echo -e "  Status:   ${RED}✗ FAIL${NC} (target: <1000ms)"
  fi

  # Write to file
  cat >> "$RESULTS_FILE" <<STATS

$name:
  Minimum:  ${min}ms
  Maximum:  ${max}ms
  Average:  ${avg}ms
  Median:   ${median}ms
  Target:   <1000ms (sub-second)
  Status:   $(if [[ $avg -lt 1000 ]]; then echo "PASS"; else echo "FAIL"; fi)

STATS

  echo ""
}

calculate_stats "Switch to $TEST_PROJECT_1" "${timings_1[@]}"
calculate_stats "Switch to $TEST_PROJECT_2" "${timings_2[@]}"

# Step 5: Identify potential bottlenecks
echo "════════════════════════════════════════════════════════════════"
echo "  Potential Bottlenecks"
echo "════════════════════════════════════════════════════════════════"
echo ""

cat >> "$RESULTS_FILE" <<EOF

═══════════════════════════════════════════════════════════════
POTENTIAL BOTTLENECKS
═══════════════════════════════════════════════════════════════

Based on the implementation analysis, potential bottlenecks include:

EOF

echo "Based on implementation analysis, common bottlenecks:"
echo ""
echo "1. File I/O Operations"
echo "   - Loading config.json"
echo "   - Loading metadata.json"
echo "   - Loading skill-rules.json"
echo "   - Loading Claude.md"
echo ""
echo "2. JSON Parsing"
echo "   - config.json validation with Ajv"
echo "   - metadata parsing"
echo "   - skill-rules parsing"
echo ""
echo "3. Context Management"
echo "   - Skill cache operations"
echo "   - Activation state management"
echo "   - Context caching (if enabled)"
echo ""
echo "4. Validation Operations"
echo "   - Project structure validation"
echo "   - Path validation"
echo "   - Schema validation"
echo ""

cat >> "$RESULTS_FILE" <<EOF
1. File I/O Operations
   - Multiple synchronous file reads
   - Config, metadata, skill-rules, Claude.md

2. JSON Parsing & Validation
   - Ajv schema validation overhead
   - Multiple JSON.parse operations

3. Context Management
   - Skill cache operations
   - State tracking overhead

4. Validation
   - Project structure checks
   - Path validation
   - Schema validation

EOF

# Step 6: Recommendations
echo "════════════════════════════════════════════════════════════════"
echo "  Recommendations"
echo "════════════════════════════════════════════════════════════════"
echo ""

cat >> "$RESULTS_FILE" <<EOF

═══════════════════════════════════════════════════════════════
RECOMMENDATIONS
═══════════════════════════════════════════════════════════════

EOF

# Calculate overall average
total=0
count=0
for time in "${timings_1[@]}" "${timings_2[@]}"; do
  total=$((total + time))
  count=$((count + 1))
done
overall_avg=$((total / count))

echo "Overall Average Switch Time: ${overall_avg}ms"
echo ""

if [[ $overall_avg -lt 1000 ]]; then
  echo -e "${GREEN}✓ Performance Target MET${NC}"
  echo "  The orchestrator achieves sub-second switching times."
  echo ""
  echo "Optimization opportunities:"
  echo "  • Consider lazy loading for rarely-used data"
  echo "  • Implement streaming JSON parsing for large files"
  echo "  • Add caching for validation results"

  cat >> "$RESULTS_FILE" <<EOF
✓ Performance target MET (${overall_avg}ms < 1000ms)

The orchestrator successfully achieves sub-second switching times.

Optimization Opportunities:
  • Lazy loading for rarely-used data
  • Streaming JSON parsing for large files
  • Validation result caching
  • Async file operations where possible

EOF

else
  echo -e "${RED}✗ Performance Target MISSED${NC}"
  echo "  Current: ${overall_avg}ms, Target: <1000ms"
  echo ""
  echo "Priority optimizations:"
  echo "  1. Parallelize file I/O operations"
  echo "  2. Cache parsed JSON data"
  echo "  3. Defer validation to background"
  echo "  4. Implement incremental loading"

  cat >> "$RESULTS_FILE" <<EOF
✗ Performance target MISSED (${overall_avg}ms > 1000ms)

Priority Optimizations Required:
  1. Parallelize independent file I/O operations
  2. Implement aggressive JSON caching
  3. Defer non-critical validation
  4. Use incremental/lazy loading patterns
  5. Profile with detailed instrumentation (see Task 58)

EOF

fi

echo ""

# Step 7: Results summary
echo "════════════════════════════════════════════════════════════════"
echo "  Results"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✓ Profiling complete${NC}"
echo ""
echo "Results saved to:"
echo "  → $RESULTS_FILE"
echo ""
echo "Next steps:"
echo "  1. Review detailed results: cat $RESULTS_FILE"
echo "  2. If target missed, implement optimizations (Task 58)"
echo "  3. Add detailed instrumentation for bottleneck analysis"
echo "  4. Profile on different hardware configurations"
echo ""

# Final status
cat >> "$RESULTS_FILE" <<EOF

═══════════════════════════════════════════════════════════════
CONCLUSION
═══════════════════════════════════════════════════════════════

Overall Average: ${overall_avg}ms
Target: <1000ms (sub-second)
Status: $(if [[ $overall_avg -lt 1000 ]]; then echo "✓ PASS"; else echo "✗ FAIL"; fi)

Test Environment:
  - Host: $(hostname)
  - OS: $(uname -s)
  - Node: $(node --version 2>/dev/null || echo "N/A")
  - Iterations: $ITERATIONS
  - Test Date: $(date)

Next Actions:
  $(if [[ $overall_avg -lt 1000 ]]; then
      echo "• Document baseline performance"
      echo "• Monitor for regressions"
      echo "• Consider further optimizations for edge cases"
    else
      echo "• Implement priority optimizations"
      echo "• Add detailed timing instrumentation"
      echo "• Re-profile after optimizations"
      echo "• Consider async operations"
    fi)

═══════════════════════════════════════════════════════════════
EOF

echo "════════════════════════════════════════════════════════════════"
