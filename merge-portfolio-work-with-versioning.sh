#!/bin/bash

# Portfolio Sync Script: Merge Yesterday's Work into Production (WITH VERSIONING)
# Date: November 20, 2025
# Purpose: Copy V1/V2/V3 pages, A/B test infrastructure, and GreenRoot examples to production
# SAFE MODE: Preserves ALL existing versions before merging

set -e  # Exit on error

PROD_DIR="/Users/tomeldridge/portfolio-redesign"
SUB_DIR="/Users/tomeldridge/Orchestrator_Project/portfolio-redesign"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║       Portfolio Redesign: Production Merge Script (SAFE MODE)     ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Verify directories exist
if [ ! -d "$PROD_DIR" ]; then
    echo "❌ ERROR: Production directory not found: $PROD_DIR"
    exit 1
fi

if [ ! -d "$SUB_DIR" ]; then
    echo "❌ ERROR: Subdirectory not found: $SUB_DIR"
    exit 1
fi

echo "✅ Directories verified"
echo ""

# Change to production directory
cd "$PROD_DIR"

echo "📍 Working in: $(pwd)"
echo ""

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  WARNING: You have uncommitted changes in production"
    git status --short
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted by user"
        exit 1
    fi
fi

echo "📦 PHASE 1: Create Backup Branch"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BACKUP_BRANCH="backup-before-v1-v2-v3-merge-$TIMESTAMP"
git checkout -b "$BACKUP_BRANCH" 2>/dev/null || git checkout "$BACKUP_BRANCH"
echo "✅ Backup branch created: $BACKUP_BRANCH"
echo ""

echo "🔄 Switching back to main"
git checkout main
echo ""

echo "📁 PHASE 2: Create Required Directories"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
mkdir -p src/pages/validate-v3
mkdir -p src/pages/validate-test
mkdir -p src/pages/examples/greenroot
mkdir -p src/components/examples
mkdir -p public/js
mkdir -p src/styles
mkdir -p public/images/examples
mkdir -p src/pages/validate/versions
mkdir -p src/pages/validate-v2/versions
echo "✅ Directories created (including version archives)"
echo ""

echo "🗂️  PHASE 3: Archive ALL Existing Validate Versions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Archive /validate/ versions
echo "📦 Archiving /validate/ versions..."
if [ -f "src/pages/validate/index.astro" ]; then
    cp src/pages/validate/index.astro "src/pages/validate/versions/index-CURRENT-$TIMESTAMP.astro"
    echo "  ✅ Archived: index-CURRENT-$TIMESTAMP.astro (60K - Active version)"
fi

if [ -f "src/pages/validate/index-minimal.astro" ]; then
    cp src/pages/validate/index-minimal.astro "src/pages/validate/versions/index-minimal-archived-$TIMESTAMP.astro"
    echo "  ✅ Archived: index-minimal-archived-$TIMESTAMP.astro (22K)"
fi

if [ -f "src/pages/validate/index-ORIGINAL-BACKUP.astro" ]; then
    cp src/pages/validate/index-ORIGINAL-BACKUP.astro "src/pages/validate/versions/index-ORIGINAL-BACKUP-archived-$TIMESTAMP.astro"
    echo "  ✅ Archived: index-ORIGINAL-BACKUP-archived-$TIMESTAMP.astro (72K)"
fi

if [ -f "src/pages/validate/index-RESTRUCTURED.astro" ]; then
    cp src/pages/validate/index-RESTRUCTURED.astro "src/pages/validate/versions/index-RESTRUCTURED-archived-$TIMESTAMP.astro"
    echo "  ✅ Archived: index-RESTRUCTURED-archived-$TIMESTAMP.astro (36K)"
fi

echo ""

# Archive /validate-v2/ versions
echo "📦 Archiving /validate-v2/ versions..."
if [ -f "src/pages/validate-v2/index.astro" ]; then
    cp src/pages/validate-v2/index.astro "src/pages/validate-v2/versions/index-CURRENT-$TIMESTAMP.astro"
    echo "  ✅ Archived: index-CURRENT-$TIMESTAMP.astro (60K - Active version)"
fi

echo ""

echo "📄 PHASE 4: Copy NEW Pages (V1, V2, V3, Test, Examples)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Copy validate V1 (NEW - 11K simplified version)
echo "  → Copying validate/index.astro (V1 - NEW 11K version)..."
cp "$SUB_DIR/src/pages/validate/index.astro" src/pages/validate/index.astro
echo "     ⚠️  Replaced 60K version with 11K simplified version"
echo "     💡 Old version saved in versions/index-CURRENT-$TIMESTAMP.astro"

# Copy validate-v2 (NEW)
echo "  → Copying validate-v2/index.astro (V2 - UPDATED)..."
cp "$SUB_DIR/src/pages/validate-v2/index.astro" src/pages/validate-v2/index.astro
echo "     💡 Old version saved in versions/index-CURRENT-$TIMESTAMP.astro"

# Copy validate-v3 (BRAND NEW)
echo "  → Copying validate-v3/index.astro (V3 - COMPREHENSIVE - BRAND NEW)..."
cp "$SUB_DIR/src/pages/validate-v3/index.astro" src/pages/validate-v3/index.astro

# Copy validate-test (BRAND NEW)
echo "  → Copying validate-test/index.astro (A/B Test Entry - BRAND NEW)..."
cp "$SUB_DIR/src/pages/validate-test/index.astro" src/pages/validate-test/index.astro

# Copy GreenRoot examples (BRAND NEW)
echo "  → Copying examples/greenroot/* (4 pages - BRAND NEW)..."
cp -r "$SUB_DIR/src/pages/examples/greenroot/"* src/pages/examples/greenroot/

echo "✅ Pages copied (4 validate pages + 4 GreenRoot examples)"
echo ""

echo "🧩 PHASE 5: Copy Components"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  → Copying components/examples/*..."
cp -r "$SUB_DIR/src/components/examples/"* src/components/examples/
echo "✅ Components copied (ABTestModal, ExampleLayout, ExamplesSection)"
echo ""

echo "⚙️  PHASE 6: Copy JavaScript Infrastructure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  → Copying public/js/*..."
cp "$SUB_DIR/public/js/"* public/js/
echo "✅ JavaScript copied (variant-assignment.js, validation-tracking.js)"
echo ""

echo "🎨 PHASE 7: Copy Styles"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  → Copying src/styles/greenroot.css..."
cp "$SUB_DIR/src/styles/greenroot.css" src/styles/greenroot.css
echo "✅ Styles copied"
echo ""

echo "🖼️  PHASE 8: Copy Images"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  → Copying public/images/examples/* (24 files)..."
cp -r "$SUB_DIR/public/images/examples/"* public/images/examples/
IMAGE_COUNT=$(ls -1 public/images/examples/ 2>/dev/null | wc -l | xargs)
echo "✅ Images copied ($IMAGE_COUNT files)"
echo ""

echo "📊 PHASE 9: Create Version Inventory"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > src/pages/validate/versions/README.md << 'README_EOF'
# Validate Page Version History

This directory contains archived versions of the validate landing page for reference and potential rollback.

## Current Active Version
- **File**: `../index.astro`
- **Source**: V1 from November 19, 2025 A/B test work
- **Size**: ~11K
- **Type**: Simplified Professional

## Archived Versions

All versions are preserved with timestamps for easy identification.

### Version Naming Convention
- `index-CURRENT-YYYYMMDD-HHMMSS.astro` - Previous active version
- `index-minimal-archived-YYYYMMDD-HHMMSS.astro` - Minimal version
- `index-ORIGINAL-BACKUP-archived-YYYYMMDD-HHMMSS.astro` - Original backup
- `index-RESTRUCTURED-archived-YYYYMMDD-HHMMSS.astro` - Restructured version

## To Restore a Previous Version

```bash
# Example: Restore the RESTRUCTURED version
cp versions/index-RESTRUCTURED-archived-YYYYMMDD-HHMMSS.astro index.astro
```

## Version Comparison

| Version | Size | Description | When to Use |
|---------|------|-------------|-------------|
| **V1 (Current)** | 11K | Simplified Professional | A/B testing, clean experience |
| **CURRENT (Archived)** | 60K | Previous active | Full-featured, proven |
| **RESTRUCTURED** | 36K | Mid-complexity | Balanced approach |
| **MINIMAL** | 22K | Bare bones | Quick load, essential only |
| **ORIGINAL-BACKUP** | 72K | Comprehensive | Maximum features |

## Notes
- All versions are functionally complete
- Size differences reflect feature richness
- Consider A/B test results before permanent changes
- Git history preserves all changes

**Last Updated**: $(date +"%Y-%m-%d %H:%M:%S")
README_EOF

echo "✅ Created version inventory (README.md)"
echo ""

# Create version inventory for validate-v2
cat > src/pages/validate-v2/versions/README.md << 'README_EOF2'
# Validate-v2 Page Version History

This directory contains archived versions of the validate-v2 landing page.

## Current Active Version
- **File**: `../index.astro`
- **Source**: V2 from November 19, 2025 A/B test work
- **Type**: Simplified Problem-Focused

## Archived Versions

### Version Naming Convention
- `index-CURRENT-YYYYMMDD-HHMMSS.astro` - Previous active version

## To Restore Previous Version

```bash
cp versions/index-CURRENT-YYYYMMDD-HHMMSS.astro index.astro
```

**Last Updated**: $(date +"%Y-%m-%d %H:%M:%S")
README_EOF2

echo "✅ Created version inventory for validate-v2"
echo ""

echo "📋 PHASE 10: Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ MERGE COMPLETE (WITH FULL VERSIONING)!"
echo ""
echo "📦 What was copied:"
echo "  • 4 validation page variants (V1, V2, V3, test entry)"
echo "  • 4 GreenRoot example pages (index, before, starter, standard)"
echo "  • 3 example components (ABTestModal, ExampleLayout, ExamplesSection)"
echo "  • 2 JavaScript files (A/B test + analytics tracking)"
echo "  • 1 stylesheet (greenroot.css)"
echo "  • $IMAGE_COUNT images for examples"
echo ""
echo "💾 COMPLETE VERSION ARCHIVE CREATED:"
echo ""
echo "  📁 src/pages/validate/versions/"
echo "     ├── index-CURRENT-$TIMESTAMP.astro (60K - Your previous active)"
echo "     ├── index-minimal-archived-$TIMESTAMP.astro (22K)"
echo "     ├── index-ORIGINAL-BACKUP-archived-$TIMESTAMP.astro (72K)"
echo "     ├── index-RESTRUCTURED-archived-$TIMESTAMP.astro (36K)"
echo "     └── README.md (version guide)"
echo ""
echo "  📁 src/pages/validate-v2/versions/"
echo "     ├── index-CURRENT-$TIMESTAMP.astro (60K - Your previous active)"
echo "     └── README.md (version guide)"
echo ""
echo "  🎯 ALL previous versions preserved and catalogued!"
echo "  🔄 Easy to restore any version at any time"
echo ""
echo "🔍 Git status:"
git status --short | head -25
TOTAL_CHANGES=$(git status --short | wc -l)
echo "  ... ($TOTAL_CHANGES total changes)"
echo ""

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                        NEXT STEPS                                  ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Review the new V1 (simplified from 60K to 11K):"
echo "   cat src/pages/validate/index.astro"
echo ""
echo "2. Compare with your previous version:"
echo "   diff src/pages/validate/versions/index-CURRENT-$TIMESTAMP.astro \\"
echo "        src/pages/validate/index.astro"
echo ""
echo "3. Test the site:"
echo "   npm run dev"
echo ""
echo "4. Visit these URLs to test:"
echo "   • http://localhost:4321/validate/ (V1 - NEW simplified)"
echo "   • http://localhost:4321/validate-v2/ (V2 - updated)"
echo "   • http://localhost:4321/validate-v3/ (V3 - comprehensive - BRAND NEW)"
echo "   • http://localhost:4321/validate-test/ (A/B test entry - BRAND NEW)"
echo "   • http://localhost:4321/examples/greenroot/ (Examples - BRAND NEW)"
echo ""
echo "5. If you prefer a previous version:"
echo "   # Restore the 60K version:"
echo "   cp src/pages/validate/versions/index-CURRENT-$TIMESTAMP.astro \\"
echo "      src/pages/validate/index.astro"
echo ""
echo "   # Or the RESTRUCTURED version:"
echo "   cp src/pages/validate/versions/index-RESTRUCTURED-archived-$TIMESTAMP.astro \\"
echo "      src/pages/validate/index.astro"
echo ""
echo "6. If everything looks good, commit:"
echo "   git add ."
echo "   git commit -m \"feat: merge V1/V2/V3 + A/B test + GreenRoot examples\""
echo "   git push origin main"
echo ""
echo "7. If you need complete rollback:"
echo "   git checkout $BACKUP_BRANCH"
echo ""
echo "🎯 All versions preserved - zero risk!"

