# Performance Monitoring Guide
**Created:** 2025-11-12  
**Task:** 12.5 - Monitor, Document, and Iterate on Performance Improvements  
**Status:** Active

---

## Overview

This guide provides comprehensive instructions for monitoring, maintaining, and improving system performance over time. It establishes processes for continuous performance monitoring, regression detection, and iterative optimization.

---

## Performance Baselines

### Current Performance (as of 2025-11-12)

| Component | Metric | Baseline | Target | Status |
|-----------|--------|----------|--------|--------|
| **CLI Commands** | Average Response | 48ms | <1000ms | ✅ 21x faster |
| | Maximum Response | 82ms | <1000ms | ✅ 12x faster |
| **Project Switching** | Average Time | 111ms | <1000ms | ✅ 9x faster |
| | Maximum Time | 144ms | <1000ms | ✅ 7x faster |
| **Dashboard** | Build Time | 633ms | <2000ms | ✅ 3x faster |
| | Bundle Size | 212 kB | <500 kB | ✅ 2x under |
| | Load Time (est) | <1000ms | <2000ms | ✅ 2x faster |

---

## Regression Thresholds

### Alert Levels

#### 🟢 **Green** - Normal Operation
- Performance within baseline
- No action required
- Continue monitoring

#### 🟡 **Yellow** - Warning
- Performance 1.5-2x slower than baseline
- **Action:** Investigate within 1 week
- **Notification:** Log warning, notify team

#### 🟠 **Orange** - Alert
- Performance 2-3x slower than baseline
- **Action:** Investigate immediately, block PRs if needed
- **Notification:** Alert team, create ticket

#### 🔴 **Red** - Critical
- Performance >3x slower than baseline or exceeds target
- **Action:** Block deployments, emergency fix required
- **Notification:** Immediate team alert, escalate

### Specific Thresholds

#### CLI Commands

| Metric | Green | Yellow | Orange | Red |
|--------|-------|--------|--------|-----|
| Average | <75ms | 75-100ms | 100-200ms | >200ms |
| Maximum | <120ms | 120-150ms | 150-300ms | >300ms |
| Failure Rate | 0% | <1% | 1-5% | >5% |

#### Project Switching

| Metric | Green | Yellow | Orange | Red |
|--------|-------|--------|--------|-----|
| Average | <150ms | 150-200ms | 200-500ms | >500ms |
| Maximum | <200ms | 200-250ms | 250-500ms | >500ms |
| 95th % | <200ms | 200-250ms | 250-500ms | >500ms |

#### Dashboard

| Metric | Green | Yellow | Orange | Red |
|--------|-------|--------|--------|-----|
| Build Time | <1000ms | 1000-1500ms | 1500-3000ms | >3000ms |
| Bundle (JS) | <300 kB | 300-400 kB | 400-600 kB | >600 kB |
| Load Time | <1500ms | 1500-1750ms | 1750-2000ms | >2000ms |

---

## Monitoring Tools

### 1. Automated Performance Testing

#### CLI Performance Test

**Script:** `tools/profile-cli-commands.sh`

**Usage:**
```bash
cd /path/to/project
./tools/profile-cli-commands.sh
```

**Output:**
- Detailed text report: `test-results/performance/cli-performance-TIMESTAMP.txt`
- CSV data: `test-results/performance/cli-performance-TIMESTAMP.csv`

**Frequency:** 
- Before each release
- After major refactors
- Weekly in CI/CD (optional)

**Interpretation:**
```bash
# Check for regressions
grep "FAIL" test-results/performance/cli-performance-*.txt

# View average times
grep "Average:" test-results/performance/cli-performance-*.txt

# Compare to baseline (48ms avg, 82ms max)
# Alert if average >100ms or max >150ms
```

---

#### Project Switching Test

**Script:** `tools/profile-switch.sh` (from Tasks 57-58)

**Usage:**
```bash
cd /path/to/project
./tools/profile-switch.sh
```

**Output:**
- Performance report with timing breakdown
- Statistical analysis (min, max, avg, median)

**Frequency:**
- Before each release
- After context management changes
- Monthly in production

**Interpretation:**
```bash
# Check average time
# Alert if >200ms (2x baseline)
# Critical if >500ms (5x target)

# Check consistency
# Alert if >20% variance across iterations
```

---

#### Dashboard Build Test

**Command:** `npm run build` (in dashboard/)

**Usage:**
```bash
cd dashboard
npm run build
```

**Metrics to Track:**
- Build time (from output)
- Bundle sizes (from output)
- Number of modules (from output)

**Frequency:**
- Before each dashboard release
- After dependency updates
- After significant code changes

**Interpretation:**
```bash
# Check build time
# Alert if >1500ms (2x baseline)

# Check bundle size
# Alert if >400 kB (2x baseline)

# Example output:
# vite v7.2.2 building for production...
# ✓ 37 modules transformed.
# dist/assets/index-XXX.js   212.49 kB │ gzip: 66.16 kB
# ✓ built in 633ms
```

---

### 2. Runtime Performance Monitoring

#### Dashboard Load Time (Browser)

**Instrumentation:** `dashboard/src/main.tsx`

**Access Measurement:**
```javascript
// In browser console after dashboard loads
window.__dashboardLoadTime  // Returns load time in ms
```

**Manual Testing:**
1. Open dashboard in browser
2. Open DevTools Console
3. Refresh page (Cmd+R / Ctrl+R)
4. Check console for: `⚡ Dashboard Initial Load: XXms`
5. Verify status message (✅ PASS or ⚠️ WARNING)

**Chrome DevTools Performance:**
1. Open DevTools → Performance tab
2. Click Record
3. Refresh page
4. Stop recording
5. Analyze:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Total Blocking Time (TBT)

**Target Metrics:**
- FCP: <500ms
- LCP: <1000ms
- TBT: <100ms
- Total Load: <1000ms

---

#### React Component Profiling

**Tool:** React DevTools Profiler

**Usage:**
1. Install React DevTools browser extension
2. Open dashboard
3. Open DevTools → Profiler tab
4. Click Record
5. Interact with dashboard (navigate, update data, etc.)
6. Stop recording
7. Analyze component render times

**Target:** All components <100ms per render

**Common Issues:**
- Excessive re-renders (check with "Highlight updates" in React DevTools)
- Large component trees (consider code splitting)
- Expensive computations (use `useMemo`, `useCallback`)

---

### 3. Production Monitoring (Future)

#### Application Performance Monitoring (APM)

**Recommended Tools:**
- **New Relic:** Full-stack monitoring
- **Datadog:** Infrastructure + application monitoring
- **Sentry:** Error tracking with performance data
- **Custom:** Lightweight custom solution

**Key Metrics to Track:**
1. CLI command response times (P50, P95, P99)
2. Project switch latency
3. Dashboard load times
4. Error rates
5. User-perceived performance

#### Custom Instrumentation

**Example Implementation:**
```javascript
// In CLI commands
const startTime = Date.now();
try {
  // Command logic
  const result = await executeCommand();
  const duration = Date.now() - startTime;
  
  // Log to monitoring service
  logMetric('cli.command.duration', duration, {
    command: 'list-projects',
    status: 'success'
  });
  
  return result;
} catch (error) {
  const duration = Date.now() - startTime;
  logMetric('cli.command.duration', duration, {
    command: 'list-projects',
    status: 'error'
  });
  throw error;
}
```

---

## Continuous Integration Setup

### GitHub Actions Performance Workflow

**File:** `.github/workflows/performance.yml`

```yaml
name: Performance Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  performance-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run CLI Performance Tests
        run: |
          chmod +x ./tools/profile-cli-commands.sh
          ./tools/profile-cli-commands.sh
      
      - name: Check CLI Performance Thresholds
        run: |
          # Parse results and check against thresholds
          AVG_TIME=$(grep "Overall Average:" test-results/performance/cli-performance-*.txt | awk '{print $3}' | sed 's/ms//')
          if [ $AVG_TIME -gt 100 ]; then
            echo "❌ Performance regression detected! Average: ${AVG_TIME}ms > 100ms"
            exit 1
          fi
          echo "✅ Performance check passed. Average: ${AVG_TIME}ms"
      
      - name: Build Dashboard
        run: |
          cd dashboard
          npm ci
          npm run build
      
      - name: Check Dashboard Build Performance
        run: |
          cd dashboard
          # Build time check (if captured in output)
          # Bundle size check
          JS_SIZE=$(du -k dist/assets/*.js | awk '{print $1}')
          if [ $JS_SIZE -gt 400 ]; then
            echo "⚠️  Bundle size warning: ${JS_SIZE} kB > 400 kB"
          fi
      
      - name: Upload Performance Results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: test-results/performance/
```

---

## Performance Review Process

### Quarterly Performance Review

**Schedule:** Every 3 months (Next: 2026-02-12)

**Agenda:**

#### 1. Collect Current Metrics (30 min)
- Run all performance test suites
- Document current baselines
- Compare to previous quarter

#### 2. Analyze Trends (30 min)
- Review performance over time
- Identify degradation patterns
- Check for improvements

#### 3. Identify Issues (20 min)
- List any performance regressions
- Prioritize by impact
- Document root causes (if known)

#### 4. Plan Improvements (30 min)
- Propose optimization opportunities
- Estimate effort and impact
- Create tasks for next quarter

#### 5. Update Documentation (10 min)
- Update baseline metrics
- Revise thresholds if needed
- Document decisions

**Deliverables:**
- Performance Review Report (markdown)
- Updated baseline metrics
- Task list for optimizations (if any)

---

### Ad-Hoc Performance Investigations

**When to Investigate:**
- Yellow/Orange/Red alerts triggered
- User reports of slowness
- After major feature additions
- Significant dependency updates

**Investigation Process:**

#### 1. Reproduce the Issue
```bash
# Run relevant performance test
./tools/profile-cli-commands.sh  # For CLI
# or
cd dashboard && npm run build     # For dashboard
```

#### 2. Compare to Baseline
```bash
# Check against documented baselines
# Docs/Performance_Monitoring_Guide.md
```

#### 3. Profile the Code
```bash
# For Node.js CLI
NODE_OPTIONS='--inspect' node bin/diet103.js <command>
# Then use Chrome DevTools → chrome://inspect

# For dashboard
# Use React DevTools Profiler + Chrome DevTools Performance
```

#### 4. Identify Bottleneck
- Look for slow functions
- Check I/O operations
- Review algorithm complexity
- Check for memory leaks

#### 5. Implement Fix
- Apply targeted optimization
- Test fix with performance suite
- Verify no regressions
- Document changes

#### 6. Validate
```bash
# Re-run performance tests
./tools/profile-cli-commands.sh

# Verify metrics improved
# Update documentation
```

---

## Performance Optimization Workflow

### When to Optimize

**Optimize if:**
- ✅ Orange/Red alert triggered
- ✅ User-facing performance issue
- ✅ Approaching target thresholds
- ✅ Significant feature degradation

**Do NOT optimize if:**
- ❌ Green zone (within baseline)
- ❌ Marginal gains (<10% improvement)
- ❌ Adds significant complexity
- ❌ No user impact

### Optimization Process

1. **Measure First**
   - Establish baseline
   - Identify specific bottleneck
   - Set improvement target

2. **Optimize**
   - Make targeted changes
   - Keep changes minimal
   - Test frequently

3. **Measure After**
   - Run performance suite
   - Compare to baseline
   - Verify improvement

4. **Validate**
   - Run full test suite
   - Check for regressions
   - Test in production (if safe)

5. **Document**
   - Update baselines
   - Document optimization
   - Share learnings

---

## Common Performance Issues

### CLI Performance

#### Issue: Slow Command Startup
**Symptoms:** All commands slow (100-200ms)
**Causes:**
- Node.js startup overhead
- Large module graphs
- Expensive top-level imports

**Solutions:**
- Lazy load heavy modules
- Use dynamic imports
- Minimize top-level code

**Example:**
```javascript
// Bad: Top-level import of heavy library
import heavyLibrary from 'heavy-library';

export function myCommand() {
  return heavyLibrary.process();
}

// Good: Lazy load when needed
export async function myCommand() {
  const heavyLibrary = await import('heavy-library');
  return heavyLibrary.default.process();
}
```

---

#### Issue: Slow File Operations
**Symptoms:** Commands that read files are slow
**Causes:**
- Sequential file reads
- Synchronous I/O
- No caching

**Solutions:**
- Parallelize reads with `Promise.all()`
- Use async I/O
- Cache frequently accessed files

**Example:**
```javascript
// Bad: Sequential reads
const file1 = await fs.readFile('file1.json');
const file2 = await fs.readFile('file2.json');

// Good: Parallel reads
const [file1, file2] = await Promise.all([
  fs.readFile('file1.json'),
  fs.readFile('file2.json')
]);
```

---

### Dashboard Performance

#### Issue: Slow Initial Load
**Symptoms:** >2 second load time
**Causes:**
- Large bundle size
- Blocking resources
- No code splitting

**Solutions:**
- Code splitting
- Lazy load routes
- Optimize bundle

**Example:**
```typescript
// Bad: Import everything upfront
import Dashboard from './Dashboard';
import Settings from './Settings';

// Good: Lazy load routes
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
```

---

#### Issue: Slow Component Renders
**Symptoms:** UI feels sluggish
**Causes:**
- Excessive re-renders
- Expensive computations
- Large component trees

**Solutions:**
- Memoization (`React.memo`, `useMemo`, `useCallback`)
- Virtual scrolling for lists
- Component splitting

**Example:**
```typescript
// Bad: Expensive computation on every render
function MyComponent({ data }) {
  const processed = expensiveOperation(data);  // Runs every render!
  return <div>{processed}</div>;
}

// Good: Memoize expensive operations
function MyComponent({ data }) {
  const processed = useMemo(
    () => expensiveOperation(data),
    [data]  // Only recompute when data changes
  );
  return <div>{processed}</div>;
}
```

---

### Project Switching Performance

#### Issue: Slow Context Loading
**Symptoms:** Project switch >500ms
**Causes:**
- Sequential file loads
- Heavy validation
- No caching

**Solutions:**
- Parallel file operations (already implemented)
- Cache validation results
- Defer non-critical loads

---

## Performance Testing Checklist

### Pre-Release Checklist

- [ ] Run CLI performance tests
  ```bash
  ./tools/profile-cli-commands.sh
  ```

- [ ] Verify all commands <1 second
  ```bash
  grep "FAIL" test-results/performance/*.txt
  # Should return nothing
  ```

- [ ] Build dashboard and check size
  ```bash
  cd dashboard && npm run build
  # Verify build time <1500ms
  # Verify bundle <400 kB
  ```

- [ ] Test dashboard load time manually
  - Open in browser
  - Check console for load time
  - Verify <2 seconds

- [ ] Review performance trends
  - Compare to previous release
  - Check for regressions
  - Document any changes

- [ ] Update baselines (if needed)
  - If performance improved significantly
  - Document new baselines
  - Update thresholds

---

## Documentation Maintenance

### Regular Updates

**Monthly:**
- Review and update baseline metrics (if changed)
- Check for broken links
- Verify tool scripts still work

**Quarterly:**
- Full performance review
- Update recommendations
- Revise thresholds based on data

**After Major Changes:**
- Update affected sections
- Re-run all tests
- Document new baselines

---

## Contact & Support

### Performance Issues

**Report Performance Issues:**
1. Run relevant performance test
2. Capture output
3. Create GitHub issue with:
   - Test results
   - Environment details
   - Steps to reproduce
   - Impact on users

**Performance Team:**
- Lead: TBD
- Contributors: Development team
- Escalation: Project lead

---

## Appendix

### Related Documentation

- **Performance Audit:** `.taskmaster/docs/performance-audit-2025-11-12.md`
- **Performance Analysis:** `.taskmaster/docs/performance-analysis-report-2025-11-12.md`
- **Performance Validation:** `.taskmaster/docs/performance-validation-report-2025-11-12.md`
- **Task 57 Report:** `Docs/Performance_Analysis_Report.md`
- **Task 58 Report:** `Docs/Performance_Optimizations_Task58.md`

### Performance Tools

**Available Scripts:**
- `tools/profile-cli-commands.sh` - CLI performance testing
- `tools/profile-switch.sh` - Project switching performance
- Dashboard instrumentation: `dashboard/src/main.tsx`

**External Tools:**
- Chrome DevTools Performance
- React DevTools Profiler
- Node.js --inspect flag
- Lighthouse (for dashboard)

### Performance Metrics History

| Date | CLI Avg | Switch Avg | Dashboard Build | Notes |
|------|---------|------------|-----------------|-------|
| 2025-11-07 | - | 90ms | - | Task 57 baseline |
| 2025-11-07 | - | 111ms | - | Task 58 optimizations |
| 2025-11-12 | 48ms | 111ms | 633ms | Task 12 complete baseline |

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-12  
**Next Review:** 2026-02-12  
**Maintained By:** Development Team

