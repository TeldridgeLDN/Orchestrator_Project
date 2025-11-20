# Portfolio Projects Sync Analysis
**Date**: November 20, 2025  
**Issue**: Two separate portfolio-redesign projects exist and are out of sync

---

## 📍 Project Locations

### 🏭 **PRODUCTION** (Original)
**Path**: `/Users/tomeldridge/portfolio-redesign/`  
**Git Status**: Connected to origin/main  
**Last Commit**: `52de0da` - "V2 validation page with commercial-first CTA + UI/UX improvements"  
**Age**: Established project with full structure

### 🆕 **SUBDIRECTORY** (Yesterday's Work)
**Path**: `/Users/tomeldridge/Orchestrator_Project/portfolio-redesign/`  
**Git Status**: Part of Orchestrator_Project repo  
**Last Commit**: `eeeed2c` - "Major documentation cleanup"  
**Age**: Created November 19, 2025 during Task 127-128 session

---

## 🔍 Key Differences

### Pages Structure

| Location | Production | Subdirectory |
|----------|-----------|--------------|
| `/validate/` | ✅ Multiple versions (index.astro, index-minimal.astro, ORIGINAL-BACKUP, RESTRUCTURED, thank-you) | ✅ Single index.astro (V1) |
| `/validate-v2/` | ✅ Exists (one file) | ✅ Exists (V2) |
| `/validate-v3/` | ❌ Missing | ✅ **NEW** - Comprehensive version |
| `/validate-test/` | ❌ Missing | ✅ **NEW** - A/B test entry page |
| `/examples/greenroot/` | ❌ Missing | ✅ **NEW** - Before/Starter/Standard + index |

### Components

| Component | Production | Subdirectory |
|-----------|-----------|--------------|
| General components | ✅ Full suite (AboutContent, ClientLogos, ContactContent, cards, animations, layout, etc.) | ❌ Only examples components |
| `/components/examples/` | ❌ Missing | ✅ **NEW** - ABTestModal.astro, ExampleLayout.astro, ExamplesSection.astro |

### JavaScript Infrastructure

| File | Production | Subdirectory |
|------|-----------|--------------|
| `public/js/variant-assignment.js` | ❌ Missing | ✅ **NEW** - A/B test routing logic |
| `public/js/validation-tracking.js` | ❌ Missing | ✅ **NEW** - Plausible Analytics placeholders |

### Images

| Directory | Production | Subdirectory |
|-----------|-----------|--------------|
| `public/images/examples/` | ❌ Missing | ✅ **NEW** - 24 images for GreenRoot examples |

### Styles

| File | Production | Subdirectory |
|------|-----------|--------------|
| `src/styles/greenroot.css` | ❌ Missing | ✅ **NEW** - GreenRoot brand styles |

---

## 📦 What Subdirectory Has That Production Needs

### **NEW Files to Copy** (Yesterday's Work)

#### 1. **Pages** (7 new/updated files)
```
src/pages/
├── validate/index.astro          (V1 - NEW VERSION)
├── validate-v2/index.astro       (V2 - ENHANCED VERSION)
├── validate-v3/index.astro       (V3 - COMPREHENSIVE - NEW)
├── validate-test/index.astro     (A/B TEST ENTRY - NEW)
└── examples/
    └── greenroot/
        ├── index.astro           (COMPARISON PAGE - NEW)
        ├── before.astro          (BEFORE VERSION - NEW)
        ├── starter.astro         (STARTER VERSION - NEW)
        └── standard.astro        (STANDARD VERSION - NEW)
```

#### 2. **Components** (3 new files)
```
src/components/examples/
├── ABTestModal.astro             (NEW)
├── ExampleLayout.astro           (NEW)
└── ExamplesSection.astro         (NEW)
```

#### 3. **JavaScript** (2 new files)
```
public/js/
├── variant-assignment.js         (NEW - A/B test logic)
└── validation-tracking.js        (NEW - Analytics tracking)
```

#### 4. **Styles** (1 new file)
```
src/styles/
└── greenroot.css                 (NEW - Brand styles)
```

#### 5. **Images** (24 new files)
```
public/images/examples/
├── greenroot-before-hero.jpg
├── greenroot-starter-hero.webp
├── greenroot-standard-hero.webp
├── greenroot-starter-screenshot.png
├── greenroot-standard-screenshot.png
├── soil-aroid-mix.png
├── soil-cactus-mix.jpg
├── soil-succulent-mix.jpg
├── soil-tropical-blend.jpg
├── testimonial-*.jpg (4 files)
├── blog-*.jpg (9 files)
└── [other supporting images]
```

---

## ⚠️ Conflicts to Resolve

### **1. `/validate/index.astro`**
- **Production**: Has multiple backup versions (ORIGINAL-BACKUP, RESTRUCTURED, minimal)
- **Subdirectory**: Single clean V1 version
- **Resolution**: Back up production version, replace with V1

### **2. `/validate-v2/index.astro`**
- **Both exist but likely different**
- **Resolution**: Compare and merge or replace

---

## 🎯 Recommended Migration Strategy

### **Phase 1: Backup Production**
```bash
cd /Users/tomeldridge/portfolio-redesign
git checkout -b backup-before-v1-v2-v3-merge
git push origin backup-before-v1-v2-v3-merge
```

### **Phase 2: Copy New Files**
```bash
# Create directories
mkdir -p src/pages/validate-v3
mkdir -p src/pages/validate-test
mkdir -p src/pages/examples/greenroot
mkdir -p src/components/examples
mkdir -p public/js
mkdir -p src/styles
mkdir -p public/images/examples

# Copy pages
cp /Users/tomeldridge/Orchestrator_Project/portfolio-redesign/src/pages/validate/index.astro \
   src/pages/validate/index-v1-new.astro

cp /Users/tomeldridge/Orchestrator_Project/portfolio-redesign/src/pages/validate-v2/index.astro \
   src/pages/validate-v2/index-new.astro

cp /Users/tomeldridge/Orchestrator_Project/portfolio-redesign/src/pages/validate-v3/index.astro \
   src/pages/validate-v3/

cp /Users/tomeldridge/Orchestrator_Project/portfolio-redesign/src/pages/validate-test/index.astro \
   src/pages/validate-test/

cp -r /Users/tomeldridge/Orchestrator_Project/portfolio-redesign/src/pages/examples/greenroot/* \
   src/pages/examples/greenroot/

# Copy components
cp -r /Users/tomeldridge/Orchestrator_Project/portfolio-redesign/src/components/examples/* \
   src/components/examples/

# Copy JS
cp /Users/tomeldridge/Orchestrator_Project/portfolio-redesign/public/js/* \
   public/js/

# Copy styles
cp /Users/tomeldridge/Orchestrator_Project/portfolio-redesign/src/styles/greenroot.css \
   src/styles/

# Copy images
cp -r /Users/tomeldridge/Orchestrator_Project/portfolio-redesign/public/images/examples/* \
   public/images/examples/
```

### **Phase 3: Review & Test**
```bash
# Compare the validate pages
diff src/pages/validate/index.astro src/pages/validate/index-v1-new.astro
diff src/pages/validate-v2/index.astro src/pages/validate-v2/index-new.astro

# Test the site
npm run dev

# Visit:
# - http://localhost:4321/validate/ (should still work)
# - http://localhost:4321/validate-v2/ (check if new version better)
# - http://localhost:4321/validate-v3/ (new comprehensive)
# - http://localhost:4321/validate-test/ (A/B test entry)
# - http://localhost:4321/examples/greenroot/ (new examples)
```

### **Phase 4: Finalize Merge**
```bash
# After testing, decide on final versions
# Then commit to production
git add .
git commit -m "feat: merge V1/V2/V3 validation pages + A/B test infrastructure + GreenRoot examples

- Add V3 comprehensive validation page
- Add A/B test infrastructure (variant-assignment.js, validation-tracking.js)
- Add GreenRoot example pages (before/starter/standard)
- Add examples components (ExamplesSection, ABTestModal, ExampleLayout)
- Update V1 and V2 with cosmetic improvements
- Add 24 example images for GreenRoot showcase
- Add validation-test entry page for A/B testing

Tasks: 127, 128.1, 128.2, 128.3"

git push origin main
```

### **Phase 5: Cleanup Subdirectory**
```bash
# After successful merge and testing
cd /Users/tomeldridge/Orchestrator_Project
rm -rf portfolio-redesign/
git add .
git commit -m "chore: remove portfolio-redesign subdirectory after merging to production"
```

---

## 📊 Impact Analysis

### **What Production Gains:**
1. ✅ V3 comprehensive validation page (NEW)
2. ✅ A/B testing infrastructure (NEW)
3. ✅ GreenRoot example pages showcase (NEW)
4. ✅ 3 new reusable components
5. ✅ Analytics tracking ready for Plausible
6. ✅ 24 professional images
7. ✅ Updated V1 and V2 with improvements

### **What Production Loses:**
- Nothing (all existing files preserved as backups)

### **Risk Level:**
- 🟢 **LOW** - Clean additive changes, no deletions
- All new files in new directories
- Existing validate pages backed up first
- Easy rollback via git

---

## 🚀 Next Steps

1. **Review this analysis**
2. **Run automated merge script** (see next document)
3. **Test in production portfolio**
4. **Commit and push**
5. **Delete subdirectory**
6. **Continue with Task 128.4** (Plausible Analytics) in production

---

**Ready for automated merge script creation!**

