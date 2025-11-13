#!/bin/bash
# cleanup-documentation.sh
# Documentation Cleanup Script based on DOCUMENTATION_FRAMEWORK.md

echo "📚 Documentation Cleanup Script"
echo "Based on Docs/DOCUMENTATION_FRAMEWORK.md"
echo ""
echo "⚠️  This script will:"
echo "   - Archive 9 milestone documents"
echo "   - Delete 7 ephemeral files"
echo "   - Archive 2 implementation summaries"
echo "   - Rename 2 permanent documents"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Create archive directories
echo "Creating archive directories..."
mkdir -p Docs/archive/milestones
mkdir -p Docs/archive/implementations
mkdir -p Docs/archive/sessions

# Archive milestone documents
echo "Archiving milestone documents..."
count=0
for file in \
  EPIC_DASHBOARD_IMPLEMENTATION_COMPLETE.md \
  IMPLEMENTATION_COMPLETE_MODEL_SWITCHING.md \
  PODCAST_LEARNING_SETUP_COMPLETE.md \
  FILE_LIFECYCLE_INIT_COMPLETE.md \
  INSTALLATION_COMPLETE.md \
  IMPLEMENTATION_COMPLETE.md \
  DIET103_TASKS_COMPLETION_SUMMARY.md \
  TASK_71_COMPLETION_SUMMARY.md \
  IMPLEMENTATION_SUMMARY.md
do
  if [ -f "$file" ]; then
    mv "$file" Docs/archive/milestones/
    echo "  ✓ Archived: $file"
    ((count++))
  fi
done
echo "✓ Archived $count milestone documents"

# Delete task completion files
echo ""
echo "Deleting individual task completion files..."
count=0
for file in \
  SUBTASK_81_2_COMPLETE.md \
  SUBTASK_81_1_COMPLETE.md \
  TASK_19_COMPLETION_SUMMARY.md \
  TASK_24_COMPLETION_SUMMARY.md \
  TASK_44_IMPLEMENTATION_SUMMARY.md \
  CLEANUP_SUMMARY.md \
  SESSION_SUMMARY_2025-11-10.md
do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Deleted: $file"
    ((count++))
  fi
done
echo "✓ Deleted $count ephemeral files"

# Archive implementation summaries
echo ""
echo "Archiving implementation summaries..."
count=0
for file in \
  Docs/TASK_92.4_IMPLEMENTATION_SUMMARY.md \
  Docs/TASK_93_IMPLEMENTATION_SUMMARY.md
do
  if [ -f "$file" ]; then
    mv "$file" Docs/archive/implementations/
    echo "  ✓ Archived: $(basename $file)"
    ((count++))
  fi
done
echo "✓ Archived $count implementation summaries"

# Rename permanent docs for clarity
echo ""
echo "Renaming permanent documentation..."
count=0
if [ -f "WORKFLOW_SCENARIO_SYSTEM_SUMMARY.md" ]; then
  mv WORKFLOW_SCENARIO_SYSTEM_SUMMARY.md Docs/WORKFLOW_SCENARIO_SYSTEM.md
  echo "  ✓ Renamed: WORKFLOW_SCENARIO_SYSTEM_SUMMARY.md → Docs/WORKFLOW_SCENARIO_SYSTEM.md"
  ((count++))
fi
if [ -f "THIRD_PARTY_INTEGRATION_SUMMARY.md" ]; then
  mv THIRD_PARTY_INTEGRATION_SUMMARY.md Docs/THIRD_PARTY_INTEGRATION.md
  echo "  ✓ Renamed: THIRD_PARTY_INTEGRATION_SUMMARY.md → Docs/THIRD_PARTY_INTEGRATION.md"
  ((count++))
fi
echo "✓ Renamed $count permanent documents"

echo ""
echo "✅ Documentation cleanup complete!"
echo ""
echo "Summary:"
echo "  - Archived files to Docs/archive/"
echo "  - Deleted ephemeral files"
echo "  - Renamed permanent docs for clarity"
echo ""
echo "Next steps:"
echo "  1. Review archived files in Docs/archive/"
echo "  2. Extract any valuable content to permanent docs"
echo "  3. Commit changes: git add -A && git commit -m 'docs: Clean up documentation per framework'"
echo ""
echo "See: Docs/DOCUMENTATION_AUDIT_RECOMMENDATIONS.md for details"

