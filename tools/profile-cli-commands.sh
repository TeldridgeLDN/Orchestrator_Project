#!/bin/bash

# Profile CLI Commands Performance Test
# Task 12.2: Profile and Analyze Current System Performance
# Date: 2025-11-12

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ITERATIONS=5
OUTPUT_DIR="./test-results/performance"
RESULTS_FILE="${OUTPUT_DIR}/cli-performance-$(date +%Y%m%d-%H%M%S).txt"
CSV_FILE="${OUTPUT_DIR}/cli-performance-$(date +%Y%m%d-%H%M%S).csv"

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Initialize results file
echo "CLI Performance Profiling Results" > "${RESULTS_FILE}"
echo "Generated: $(date)" >> "${RESULTS_FILE}"
echo "Iterations: ${ITERATIONS}" >> "${RESULTS_FILE}"
echo "=====================================" >> "${RESULTS_FILE}"
echo "" >> "${RESULTS_FILE}"

# Initialize CSV
echo "Command,Iteration,Time(ms),Status" > "${CSV_FILE}"

# Function to measure command execution time
measure_command() {
    local cmd="$1"
    local label="$2"
    local times=()
    
    echo -e "${BLUE}Profiling: ${label}${NC}"
    echo "Command: ${cmd}" >> "${RESULTS_FILE}"
    echo "" >> "${RESULTS_FILE}"
    
    for i in $(seq 1 ${ITERATIONS}); do
        echo -ne "  Run ${i}/${ITERATIONS}..."
        
        # Measure execution time
        local start=$(node -e "console.log(Date.now())")
        
        # Run command and capture exit code
        if eval "${cmd}" > /dev/null 2>&1; then
            local status="SUCCESS"
        else
            local status="FAILED"
        fi
        
        local end=$(node -e "console.log(Date.now())")
        local duration=$((end - start))
        
        times+=($duration)
        echo "${label},${i},${duration},${status}" >> "${CSV_FILE}"
        
        if [ $duration -gt 1000 ]; then
            echo -e " ${RED}${duration}ms ⚠️${NC}"
        elif [ $duration -gt 500 ]; then
            echo -e " ${YELLOW}${duration}ms${NC}"
        else
            echo -e " ${GREEN}${duration}ms ✓${NC}"
        fi
    done
    
    # Calculate statistics
    local sum=0
    local min=${times[0]}
    local max=${times[0]}
    
    for time in "${times[@]}"; do
        sum=$((sum + time))
        [ $time -lt $min ] && min=$time
        [ $time -gt $max ] && max=$time
    done
    
    local avg=$((sum / ${#times[@]}))
    
    # Sort for median
    IFS=$'\n' sorted=($(sort -n <<<"${times[*]}"))
    local median=${sorted[$((${#sorted[@]} / 2))]}
    
    # Print statistics
    echo "" >> "${RESULTS_FILE}"
    echo "  Minimum: ${min}ms" >> "${RESULTS_FILE}"
    echo "  Maximum: ${max}ms" >> "${RESULTS_FILE}"
    echo "  Average: ${avg}ms" >> "${RESULTS_FILE}"
    echo "  Median:  ${median}ms" >> "${RESULTS_FILE}"
    
    # Check against target
    local target=1000
    if [ $avg -lt $target ]; then
        echo "  Status:  ✅ PASS (<${target}ms)" >> "${RESULTS_FILE}"
        echo -e "  Result: ${GREEN}✅ PASS${NC} (avg: ${avg}ms, target: <${target}ms)"
    else
        echo "  Status:  ❌ FAIL (>=${target}ms)" >> "${RESULTS_FILE}"
        echo -e "  Result: ${RED}❌ FAIL${NC} (avg: ${avg}ms, target: <${target}ms)"
    fi
    
    echo "" >> "${RESULTS_FILE}"
    echo "---" >> "${RESULTS_FILE}"
    echo "" >> "${RESULTS_FILE}"
    
    echo ""
}

# Main profiling sequence
echo -e "${BLUE}Starting CLI Performance Profiling...${NC}"
echo ""

# High Priority Commands (Frequent Use)
echo -e "${BLUE}=== High Priority Commands ===${NC}"
echo ""

# Note: We'll measure time using Node.js since 'time' command output varies by system

measure_command "node bin/diet103.js list-projects" "list-projects"
measure_command "node bin/diet103.js current" "current"
measure_command "node bin/diet103.js health" "health"
measure_command "node bin/diet103.js scenario list" "scenario list"
measure_command "node bin/diet103.js validate ." "validate (current dir)"

# Medium Priority Commands (Moderate Use)
echo ""
echo -e "${BLUE}=== Medium Priority Commands ===${NC}"
echo ""

measure_command "node bin/diet103.js --help" "help command"
measure_command "node bin/diet103.js --version" "version command"

# Summary
echo ""
echo -e "${BLUE}=== Performance Summary ===${NC}"
echo ""
echo "Results saved to:"
echo "  📊 Detailed: ${RESULTS_FILE}"
echo "  📈 CSV Data: ${CSV_FILE}"
echo ""
echo -e "${GREEN}Profiling complete!${NC}"
echo ""

# Display summary from results file
echo "Performance Summary:" >> "${RESULTS_FILE}"
echo "" >> "${RESULTS_FILE}"
grep -E "(Command:|Average:|Status:)" "${RESULTS_FILE}" | tail -n 21

# Display quick stats
echo "Quick Stats:"
echo "  Total commands profiled: $(grep -c "Command:" "${RESULTS_FILE}")"
echo "  Commands passing (<1s): $(grep -c "✅ PASS" "${RESULTS_FILE}")"
echo "  Commands failing (>=1s): $(grep -c "❌ FAIL" "${RESULTS_FILE}")"

