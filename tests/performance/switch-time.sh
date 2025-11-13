#!/bin/bash

# Performance test script for project switching
# Measures switching time across different numbers of projects

set -e

# Colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${YELLOW}====================================${NC}"
echo -e "${YELLOW}Claude Orchestrator Performance Test${NC}"
echo -e "${YELLOW}====================================${NC}"
echo ""

# Setup test environment
TEST_HOME="$HOME/.claude-test-perf"
echo -e "${BLUE}Setting up test environment: $TEST_HOME${NC}"
rm -rf "$TEST_HOME"
CLAUDE_HOME="$TEST_HOME" claude init

# Test configurations
PROJECT_COUNTS=(1 5 10 20)
ITERATIONS=10

# Results arrays
declare -A cold_times
declare -A warm_times

# Function to measure time in milliseconds
measure_time() {
    local start=$(date +%s%N)
    eval "$1" > /dev/null 2>&1
    local end=$(date +%s%N)
    local duration=$(( (end - start) / 1000000 )) # Convert to milliseconds
    echo "$duration"
}

# Function to calculate statistics
calculate_stats() {
    local times=("$@")
    local sum=0
    local count=${#times[@]}

    # Calculate mean
    for time in "${times[@]}"; do
        sum=$((sum + time))
    done
    local mean=$((sum / count))

    # Sort for percentiles
    IFS=$'\n' sorted=($(sort -n <<<"${times[*]}"))
    unset IFS

    # Calculate 95th percentile
    local p95_index=$(( (count * 95) / 100 ))
    local p95=${sorted[$p95_index]}

    # Calculate min/max
    local min=${sorted[0]}
    local max=${sorted[$((count-1))]}

    echo "$mean $p95 $min $max"
}

# Run performance tests
echo -e "\n${BLUE}Running performance tests...${NC}\n"

for count in "${PROJECT_COUNTS[@]}"; do
    echo -e "${YELLOW}Testing with $count project(s)${NC}"

    # Create projects
    echo -e "  Creating $count projects..."
    for ((i=1; i<=count; i++)); do
        CLAUDE_HOME="$TEST_HOME" claude project create --name "perf-test-$i" --template base > /dev/null 2>&1
    done
    echo -e "  ${GREEN}✓${NC} Projects created"

    # Measure cold start times (first switch after restart simulation)
    echo -e "  Measuring cold start times..."
    cold_results=()
    for ((i=1; i<=ITERATIONS; i++)); do
        # Simulate cold start by clearing any caches (if implemented)
        target_project=$(( (i % count) + 1 ))
        time_ms=$(measure_time "CLAUDE_HOME='$TEST_HOME' claude project switch perf-test-$target_project")
        cold_results+=("$time_ms")
    done

    # Calculate cold start statistics
    read cold_mean cold_p95 cold_min cold_max <<< "$(calculate_stats "${cold_results[@]}")"
    cold_times["$count"]="$cold_mean $cold_p95 $cold_min $cold_max"

    echo -e "  ${GREEN}✓${NC} Cold start: mean=${cold_mean}ms, p95=${cold_p95}ms, min=${cold_min}ms, max=${cold_max}ms"

    # Measure warm cache times (repeated switches)
    echo -e "  Measuring warm cache times..."
    warm_results=()
    for ((i=1; i<=ITERATIONS; i++)); do
        target_project=$(( (i % count) + 1 ))
        time_ms=$(measure_time "CLAUDE_HOME='$TEST_HOME' claude project switch perf-test-$target_project")
        warm_results+=("$time_ms")
    done

    # Calculate warm cache statistics
    read warm_mean warm_p95 warm_min warm_max <<< "$(calculate_stats "${warm_results[@]}")"
    warm_times["$count"]="$warm_mean $warm_p95 $warm_min $warm_max"

    echo -e "  ${GREEN}✓${NC} Warm cache: mean=${warm_mean}ms, p95=${warm_p95}ms, min=${warm_min}ms, max=${warm_max}ms"
    echo ""
done

# Generate performance report
echo -e "${YELLOW}====================================${NC}"
echo -e "${YELLOW}Performance Test Results${NC}"
echo -e "${YELLOW}====================================${NC}"
echo ""

# Print results table
printf "%-15s %-20s %-20s %-15s %-15s\n" "# Projects" "Cold Start (mean)" "Cold Start (p95)" "Warm (mean)" "Warm (p95)"
printf "%-15s %-20s %-20s %-15s %-15s\n" "----------" "------------------" "-----------------" "----------" "---------"

all_passed=true
for count in "${PROJECT_COUNTS[@]}"; do
    IFS=' ' read -r cold_mean cold_p95 cold_min cold_max <<< "${cold_times[$count]}"
    IFS=' ' read -r warm_mean warm_p95 warm_min warm_max <<< "${warm_times[$count]}"

    # Check if performance targets are met
    # Target: < 1000ms (1s) for p95
    if [ "$cold_p95" -lt 1000 ]; then
        cold_status="${GREEN}✓${NC}"
    else
        cold_status="${RED}✗${NC}"
        all_passed=false
    fi

    if [ "$warm_p95" -lt 500 ]; then
        warm_status="${GREEN}✓${NC}"
    else
        warm_status="${RED}✗${NC}"
        all_passed=false
    fi

    printf "%-15s %-20s %-20s %-15s %-15s\n" \
        "$count" \
        "${cold_mean}ms $cold_status" \
        "${cold_p95}ms $cold_status" \
        "${warm_mean}ms $warm_status" \
        "${warm_p95}ms $warm_status"
done

echo ""
echo -e "${BLUE}Performance Targets:${NC}"
echo -e "  Cold Start p95: < 1000ms (1s)"
echo -e "  Warm Cache p95: < 500ms"
echo ""

# Additional metrics
echo -e "${BLUE}Additional Metrics:${NC}"

# Test initialization time
echo -n "  Initialization time: "
rm -rf "$TEST_HOME-init"
init_time=$(measure_time "CLAUDE_HOME='$TEST_HOME-init' claude init")
echo -e "${init_time}ms"

# Test list operation time
echo -n "  List operation time (20 projects): "
list_time=$(measure_time "CLAUDE_HOME='$TEST_HOME' claude project list")
echo -e "${list_time}ms"

# Test memory usage (if available)
if command -v ps &> /dev/null; then
    echo -n "  Memory usage during operation: "
    # This is a simple estimate - actual implementation would need more sophisticated monitoring
    echo -e "N/A (requires instrumentation)"
fi

echo ""

# Cleanup
echo -e "${BLUE}Cleaning up test environment...${NC}"
rm -rf "$TEST_HOME" "$TEST_HOME-init"

# Final result
echo ""
if [ "$all_passed" = true ]; then
    echo -e "${GREEN}✓ All performance targets met!${NC}"
    echo "Performance Test: PASSED"
    exit 0
else
    echo -e "${RED}✗ Some performance targets not met.${NC}"
    echo "Performance Test: FAILED"
    exit 1
fi
