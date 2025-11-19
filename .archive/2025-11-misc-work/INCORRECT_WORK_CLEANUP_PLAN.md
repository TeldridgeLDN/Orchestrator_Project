# Cleanup Plan: Incorrectly Implemented Landing Page Work

**Date**: November 13, 2025  
**Issue**: Implemented landing page icon system in Orchestrator_Project instead of working on data-vis project Task 4

---

## What Was Incorrectly Implemented

### Files Created/Modified in Orchestrator_Project:
1. **dashboard/src/components/LandingPage.tsx** - Full landing page component (365 lines)
2. **dashboard/src/components/Icon.tsx** - Reusable icon component
3. **dashboard/src/components/Icon.types.ts** - TypeScript types
4. **dashboard/src/components/Icon.README.md** - Component documentation
5. **dashboard/src/components/IconTest.tsx** - Test component
6. **dashboard/src/lib/icons.tsx** - Centralized icon exports (167 lines)
7. **dashboard/src/lib/utils.ts** - Utility functions
8. **dashboard/tailwind.config.js** - Modified with icon system
9. **dashboard/src/index.css** - Added CSS variables
10. **dashboard/src/App.tsx** - Added view switcher
11. **dashboard/LANDING_PAGE_IMPLEMENTATION_COMPLETE.md** - Documentation

### Dependencies Installed:
- `lucide-react@0.553.0`
- `clsx@2.1.1`
- `tailwind-merge@2.7.0`

### TaskMaster Work:
- Completed Tasks 1-5 in **portfolio-redesign** tag (wrong project)
- All subtasks marked as done

---

## Decision Options

### Option 1: Keep the Work (Recommended)
**Rationale**: The landing page work is actually useful for the Orchestrator dashboard. We can:
- Use it as a welcome/landing screen for the Orchestrator Dashboard
- Integrate it with the Epic Dashboard (Task 91)
- The icon system is valuable for the actual dashboard visualizations

**Actions**:
1. ✅ Keep all files and dependencies
2. Switch focus to data-vis project
3. Document this as "Orchestrator Welcome Screen" feature
4. Tag as `enhancements` or `dashboard-ui` in Orchestrator project
5. Continue with correct work in data-vis

**Pros**:
- No wasted work
- Useful for Orchestrator UI
- Clean, professional landing page
- Icon system can be used in dashboard

**Cons**:
- Not originally planned
- Took time away from data-vis project

---

### Option 2: Revert Everything
**Rationale**: Start fresh, stay focused on core Orchestrator functionality

**Actions**:
1. Git revert all landing page commits
2. Remove installed dependencies (lucide-react, clsx, tailwind-merge)
3. Delete all landing page files
4. Reset TaskMaster portfolio-redesign tag
5. Immediately switch to data-vis project

**Pros**:
- Clean slate
- No scope creep in Orchestrator
- Maintains project focus

**Cons**:
- Wastes 2+ hours of quality work
- Loses useful UI components
- Need to redo work if landing page needed later

---

### Option 3: Move Work to Separate Branch
**Rationale**: Preserve work but don't merge to main

**Actions**:
1. Create `feature/landing-page-ui` branch
2. Commit all landing page work there
3. Reset main branch to pre-landing-page state
4. Keep branch for future reference/integration
5. Switch to data-vis project

**Pros**:
- Work is preserved
- Main branch stays clean
- Can merge later if needed

**Cons**:
- Still time wasted
- Branch may become stale

---

## Recommended Approach: **Option 1 (Keep the Work)**

### Immediate Actions:

1. **Accept the landing page as bonus feature**
   - Rename to "Orchestrator Welcome Screen"
   - Document in README as optional UI enhancement
   - Tag TaskMaster work as `dashboard-ui` instead of `portfolio-redesign`

2. **Switch to correct project**
   ```bash
   cd /Users/tomeldridge/data-vis
   ```

3. **Verify project context**
   ```bash
   task-master show 4  # Should show FT Visual Vocabulary integration
   ```

4. **Begin correct work**
   - Work on data-vis Task 4: Integrate FT Visual Vocabulary templates
   - Use existing `/Users/tomeldridge/data-vis/templates/ft-visual-vocabulary/` directory

5. **Implement Task 105** (Project Detection System)
   - Create project mapping utility
   - Add safeguards to prevent future confusion

---

## Lessons Learned

### For Agent:
1. ✅ **Always verify project root** when user mentions project names
2. ✅ **Check PRD** to confirm project intent before starting work
3. ✅ **List available projects** if user reference is ambiguous
4. ✅ **Confirm working directory** matches intended project
5. ✅ **Display project name** in all task status outputs

### For User:
1. Specify full project paths when possible: `/Users/tomeldridge/data-vis`
2. Confirm project context if agent seems confused
3. Request project list if uncertain which exists

---

## Next Steps

1. **Keep the landing page work** - It's good quality and useful for Orchestrator
2. **Switch to data-vis project** - `/Users/tomeldridge/data-vis`
3. **Start Task 4** - Integrate FT Visual Vocabulary templates
4. **Implement Task 105** - Build project detection system to prevent recurrence

---

**Status**: Awaiting user decision on cleanup approach

