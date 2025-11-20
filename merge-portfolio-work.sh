#!/bin/bash

# Portfolio Sync Script: Merge Yesterday's Work into Production
# Date: November 20, 2025
# Purpose: Copy V1/V2/V3 pages, A/B test infrastructure, and GreenRoot examples to production

set -e  # Exit on error

PROD_DIR="/Users/tomeldridge/portfolio-redesign"
SUB_DIR="/Users/tomeldridge/Orchestrator_Project/portfolio-redesign"

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║          Portfolio Redesign: Production Merge Script              ║"
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
git checkout -b backup-before-v1-v2-v3-merge 2>/dev/null || git checkout backup-before-v1-v2-v3-merge
echo "✅ Backup branch created/checked out"
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
echo "✅ Directories created"
echo ""

echo "📄 PHASE 3: Backup Existing Validate Pages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "src/pages/validate/index.astro" ]; then
    cp src/pages/validate/index.astro "src/pages/validate/index-BACKUP-$(date +%Y%m%d).astro"
    echo "✅ Backed up validate/index.astro"
fi

if [ -f "src/pages/validate-v2/index.astro" ]; then
    cp src/pages/validate-v2/index.astro "src/pages/validate-v2/index-BACKUP-$(date +%Y%m%d).astro"
    echo "✅ Backed up validate-v2/index.astro"
fi
echo ""

echo "📋 PHASE 4: Copy Pages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Copy validate V1 (overwrite existing)
echo "  → Copying validate/index.astro (V1)..."
cp "$SUB_DIR/src/pages/validate/index.astro" src/pages/validate/index.astro

# Copy validate-v2 (overwrite existing)
echo "  → Copying validate-v2/index.astro (V2)..."
cp "$SUB_DIR/src/pages/validate-v2/index.astro" src/pages/validate-v2/index.astro

# Copy validate-v3 (NEW)
echo "  → Copying validate-v3/index.astro (V3 - NEW)..."
cp "$SUB_DIR/src/pages/validate-v3/index.astro" src/pages/validate-v3/index.astro

# Copy validate-test (NEW)
echo "  → Copying validate-test/index.astro (A/B Test Entry - NEW)..."
cp "$SUB_DIR/src/pages/validate-test/index.astro" src/pages/validate-test/index.astro

# Copy GreenRoot examples (NEW)
echo "  → Copying examples/greenroot/* (NEW)..."
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
IMAGE_COUNT=$(ls -1 public/images/examples/ | wc -l)
echo "✅ Images copied ($IMAGE_COUNT files)"
echo ""

echo "📊 PHASE 9: Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ MERGE COMPLETE!"
echo ""
echo "📦 What was copied:"
echo "  • 4 validation page variants (V1, V2, V3, test entry)"
echo "  • 4 GreenRoot example pages (index, before, starter, standard)"
echo "  • 3 example components (ABTestModal, ExampleLayout, ExamplesSection)"
echo "  • 2 JavaScript files (A/B test + analytics tracking)"
echo "  • 1 stylesheet (greenroot.css)"
echo "  • $IMAGE_COUNT images for examples"
echo ""
echo "💾 Backup created:"
echo "  • src/pages/validate/index-BACKUP-$(date +%Y%m%d).astro"
echo "  • src/pages/validate-v2/index-BACKUP-$(date +%Y%m%d).astro"
echo ""
echo "🔍 Git status:"
git status --short | head -20
TOTAL_CHANGES=$(git status --short | wc -l)
echo "  ... ($TOTAL_CHANGES total changes)"
echo ""

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                        NEXT STEPS                                  ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Review changes:"
echo "   git diff src/pages/validate/index.astro"
echo "   git diff src/pages/validate-v2/index.astro"
echo ""
echo "2. Test the site:"
echo "   npm run dev"
echo ""
echo "3. Visit these URLs to test:"
echo "   • http://localhost:4321/validate/ (V1)"
echo "   • http://localhost:4321/validate-v2/ (V2)"
echo "   • http://localhost:4321/validate-v3/ (V3 - NEW)"
echo "   • http://localhost:4321/validate-test/ (A/B test entry - NEW)"
echo "   • http://localhost:4321/examples/greenroot/ (Examples - NEW)"
echo ""
echo "4. If everything looks good, commit:"
echo "   git add ."
echo "   git commit -m \"feat: merge V1/V2/V3 + A/B test + GreenRoot examples\""
echo "   git push origin main"
echo ""
echo "5. If you need to rollback:"
echo "   git checkout backup-before-v1-v2-v3-merge"
echo ""
echo "🎯 Ready to test!"

