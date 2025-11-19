# Portfolio V2 Variation - Deployment Guide

## Quick Summary

Created commercial-first variation of your validation page to test which CTA strategy converts better for package sales.

**V1 (Current):** Balanced dual-path (equal prominence for packages + checklist)  
**V2 (New):** Commercial-first (packages primary, checklist secondary)

---

## Deploy V2 Variation

### Step 1: Build and Test Locally

```bash
cd ~/portfolio-redesign

# Start dev server (if not already running)
npm run dev

# Visit in browser:
# http://localhost:4321/validate/     ← V1 (original)
# http://localhost:4321/validate-v2/  ← V2 (new variation)
```

### Step 2: Compare Side-by-Side

Open both URLs in separate browser tabs and compare:

**Visual Check:**
- Hero headline (pain vs. price)
- CTA button prominence (equal vs. hierarchy)
- Checklist positioning (co-equal vs. downplayed)

**Functionality Check:**
- Primary CTA scrolls to #packages ✓
- Secondary CTA scrolls to #checklist ✓
- All links working ✓
- Mobile responsive ✓

### Step 3: Deploy to Production

```bash
# Commit the new variation
git add src/pages/validate-v2/
git commit -m "feat: Add V2 commercial-first CTA variation for A/B testing"

# Push to production (Netlify/Vercel will auto-deploy)
git push origin main
```

**Production URLs (after deployment):**
- V1: https://decide.strategyxdesign.co.uk/validate/
- V2: https://decide.strategyxdesign.co.uk/validate-v2/

---

## A/B Testing Setup

### Option A: Manual Split (Simple)

**Week 1-2:** Drive 50% of traffic to V1, 50% to V2
- Share V1 link in Reddit/communities
- Share V2 link in email/referrals

**Track manually:**
- V1 checklist conversions: ___
- V1 package inquiries: ___
- V2 checklist conversions: ___
- V2 package inquiries: ___

### Option B: Automated Split (Advanced)

**Using Plausible Analytics:**

```javascript
// Add to ValidateLayout.astro <head>
<script>
  // 50/50 split based on random number
  if (Math.random() < 0.5 && window.location.pathname === '/validate/') {
    window.location.href = '/validate-v2/';
  }
</script>
```

**Track custom events:**
```javascript
// When user clicks CTA
plausible('CTA_Click', { props: { variant: 'v1', type: 'packages' }});
plausible('CTA_Click', { props: { variant: 'v2', type: 'packages' }});
```

### Option C: Google Optimize (Enterprise)

1. Create experiment in Google Optimize
2. Set up URL-based variants:
   - Original: /validate/
   - Variant 1: /validate-v2/
3. Define goals (package inquiries, checklist downloads)
4. Let Google split traffic automatically

---

## What to Measure

### Primary Metrics (Revenue)
- **Package inquiry rate** (click "Choose Core/Premium")
- **Package purchase rate** (actual sales)
- **Revenue per 100 visitors**

### Secondary Metrics (Lead Gen)
- **Checklist opt-in rate** (email capture)
- **Total conversion rate** (any action)
- **Bounce rate** (engagement)

### Qualitative Metrics
- **User feedback** (which headline resonates?)
- **Time on page** (engagement depth)
- **Scroll depth** (do they reach packages section?)

---

## Decision Matrix

After 2-4 weeks of testing (minimum 1000 visitors per variation):

```
If V2 package sales > V1 by 30%+
└─> Make V2 the default, keep V1 as fallback for cold traffic

If V1 total conversions > V2 by 40%+
└─> Keep V1 as default, use V2 for warm traffic sources

If results are mixed:
└─> Segment by traffic source (see recommendations below)
```

---

## Traffic Source Recommendations

Based on visitor intent, route traffic strategically:

### Send to V1 (Lead Gen Focus)
- **Google Ads** (cold, high friction)
- **Social media** (cold, browsing)
- **Blog posts** (informational intent)
- **First-time visitors** (need trust building)

### Send to V2 (Commercial Focus)
- **Referrals** (warm, pre-qualified)
- **Email newsletter** (engaged audience)
- **Retargeting ads** (already familiar)
- **Reddit/community posts** (intent-driven)

---

## Quick Comparison Cheat Sheet

| Element | V1 | V2 |
|---------|----|----|
| **Headline** | "Don't Waste 6 Months..." | "Validation Sprints from £497" |
| **Primary CTA** | "Get Decision Confidence" | "View Validation Packages" |
| **Secondary CTA** | Equal-sized button | Small text link below |
| **Checklist Position** | Co-equal path | Backup qualifier |
| **Best For** | Cold traffic, list building | Warm traffic, immediate sales |

---

## Rollback Plan

If V2 performs poorly:

```bash
# Simply don't promote the /validate-v2/ URL
# Original /validate/ stays untouched

# Or delete V2 if needed:
rm -rf ~/portfolio-redesign/src/pages/validate-v2/
git commit -m "revert: Remove V2 variation, V1 performing better"
git push
```

No risk to production - V1 remains live and default.

---

## Next Actions

1. **Deploy V2** (git push after local testing)
2. **Start tracking** (set up analytics/custom events)
3. **Drive equal traffic** to both variations
4. **Wait 2-4 weeks** (statistical significance)
5. **Analyze results** (see PORTFOLIO_CTA_VARIATION_COMPARISON.md)
6. **Choose winner** and implement site-wide

---

## Questions to Answer

After testing, you'll know:
- ✅ Does price transparency help or hurt conversions?
- ✅ Do visitors want to choose their path (V1) or be guided (V2)?
- ✅ Is my checklist competing with my packages?
- ✅ What's my optimal CTA hierarchy for maximum revenue?

---

## File Locations

```
Original:  ~/portfolio-redesign/src/pages/validate/index.astro
Variation: ~/portfolio-redesign/src/pages/validate-v2/index.astro
Docs:      /Users/tomeldridge/Orchestrator_Project/PORTFOLIO_CTA_VARIATION_COMPARISON.md
```

---

*V2 variation created: 2025-11-19*  
*Ready for deployment and A/B testing*

