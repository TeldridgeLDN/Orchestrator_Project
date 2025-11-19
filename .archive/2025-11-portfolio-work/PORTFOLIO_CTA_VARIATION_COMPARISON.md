# Portfolio CTA Strategy Comparison: V1 vs V2

**Date:** 2025-11-19  
**Purpose:** A/B test commercial-first vs. balanced dual-path CTA strategy  
**Live URLs:**
- **V1 (Current):** https://decide.strategyxdesign.co.uk/validate/
- **V2 (Commercial-First):** https://decide.strategyxdesign.co.uk/validate-v2/

---

## The Strategic Question

**Your Challenge:** "Is my CTA the checklist or is it to buy a package? Arguably I want people to buy, the checklist is a qualifier."

**The Answer:** You have TWO valid conversion paths, but which one should be **primary** in the hero?

---

## V1: Balanced Dual-Path (Current)

### Hero Strategy
```
Headline: "Don't Waste 6 Months Building What Nobody Wants"
Subheading: "Test your startup idea in 48 hours..."

[PRIMARY CTA]   "Get Decision Confidence, Not Hope" → #packages
[SECONDARY CTA] "Get Free Checklist →" → #checklist
```

### Conversion Funnel
```
Visitor lands
├─ Warm leads → See both CTAs equally → Might choose checklist (lower friction)
└─ Cold leads → Choose checklist → Enter nurture sequence
```

### Pros ✅
- Captures both warm and cold leads
- Pain-first headline (strong hook)
- Equal prominence = visitor choice

### Cons ❌
- Primary CTA uses abstract language ("Decision Confidence")
- Checklist CTA is equally prominent (splits attention)
- Warm leads might take "easier path" (checklist) instead of buying
- Lost immediate revenue from people ready to buy

### Expected Performance
- **Checklist conversions:** HIGH (40-50%)
- **Package sales:** MEDIUM (5-8%)
- **Revenue per visitor:** LOWER
- **Total conversions (any):** HIGH

---

## V2: Commercial-First (New Variation)

### Hero Strategy
```
Headline: "Validation Sprints from £497"
Subheading: "Don't waste 6 months building... Get a professional validation 
landing page in 48 hours. Real data. Real confidence."

[PRIMARY CTA]   "View Validation Packages" → #packages (Large, prominent)
[SECONDARY CTA] "Not ready? Start with free checklist →" (Small text link below)
```

### Conversion Funnel
```
Visitor lands
├─ Warm leads → See pricing up front → Direct to packages → HIGHER immediate sales
└─ Cold leads → "Not ready?" prompt → Choose checklist → Enter nurture
```

### Pros ✅
- Price transparency (filters tire-kickers)
- Warm leads see clear commercial path
- Checklist positioned as "backup" (captures cold leads without competing)
- Higher revenue per warm visitor

### Cons ❌
- Might scare off cold traffic (price up front)
- Lower total conversions (but higher revenue)
- Requires confidence in pricing value

### Expected Performance
- **Checklist conversions:** LOWER (20-30%)
- **Package sales:** HIGHER (12-18%)
- **Revenue per visitor:** HIGHER
- **Total conversions (any):** LOWER

---

## Visual Comparison

### V1 Hero (Balanced)
```
┌─────────────────────────────────────────────────┐
│ Don't Waste 6 Months Building What Nobody Wants│
│ Test your startup idea in 48 hours...          │
│                                                 │
│ [Get Decision Confidence, Not Hope]  ← Equal   │
│ [Get Free Checklist →]               ← Equal   │
└─────────────────────────────────────────────────┘
```

### V2 Hero (Commercial-First)
```
┌─────────────────────────────────────────────────┐
│         Validation Sprints from £497            │
│ Don't waste 6 months... Get a professional      │
│ validation landing page in 48 hours.            │
│                                                 │
│   [View Validation Packages]  ← BIG & BOLD     │
│                                                 │
│   Not ready to commit?                          │
│   Start with the free checklist →  ← Small link│
└─────────────────────────────────────────────────┘
```

---

## Key Differences

| Element | V1 (Balanced) | V2 (Commercial-First) |
|---------|---------------|----------------------|
| **Headline** | Pain-focused | Price-focused |
| **Primary CTA Text** | Abstract ("Decision Confidence") | Concrete ("View Packages") |
| **CTA Visual Hierarchy** | Two equal buttons | One dominant + text link |
| **Checklist Positioning** | Co-equal option | Backup/qualifier |
| **Visitor Intent** | Choose your path | Buy or explore? |
| **Revenue Priority** | Total conversions | Revenue per conversion |

---

## Which Strategy is Right for You?

### Choose V1 (Balanced) If:
- ✅ You want to **maximize total leads**
- ✅ Your traffic is mostly **cold** (ads, social, discovery)
- ✅ You have a **strong email nurture sequence**
- ✅ You're okay with **delayed revenue**
- ✅ You want to build a **large email list first**

**Business Model:** Lead nurture → Long-term relationship → Package sale

---

### Choose V2 (Commercial-First) If:
- ✅ You want to **maximize revenue per visitor**
- ✅ Your traffic is mostly **warm** (referrals, word-of-mouth, retargeting)
- ✅ You're confident in your **pricing value proposition**
- ✅ You want **immediate cash flow**
- ✅ You don't want to compete with your own free offer

**Business Model:** Direct sale → Checklist captures leftovers

---

## A/B Testing Recommendation

### Test Setup
1. **Split traffic 50/50** between V1 and V2
2. **Track metrics for 2-4 weeks** (minimum 1000 visitors)
3. **Measure:**
   - Checklist opt-in rate
   - Package inquiry rate
   - Package purchase rate
   - Revenue per visitor
   - Total conversion rate (any action)

### Success Criteria

**V1 Wins If:**
- Total conversions >40% higher than V2
- Email list grows 2x faster
- Long-term nurture converts at >15%

**V2 Wins If:**
- Revenue per visitor >30% higher than V1
- Package sales >50% higher
- Time-to-revenue <50% of V1

**Hybrid Strategy If:**
- V1 converts cold traffic better
- V2 converts warm traffic better
- **Solution:** Segment by traffic source!

---

## Traffic Source Optimization

### Recommended Strategy by Source

| Traffic Source | Recommended Version | Why |
|---------------|---------------------|-----|
| **Google Ads** (cold) | V1 | High friction, need trust first |
| **Reddit/Communities** (warm) | V2 | Intent-driven, ready to evaluate |
| **Referrals** (hot) | V2 | Pre-qualified, skip to purchase |
| **Social Media** (cold) | V1 | Low intent, capture leads |
| **Retargeting** (warm) | V2 | Already familiar, push for sale |
| **Email Newsletter** (warm) | V2 | Engaged audience, ready to buy |

---

## Design Review Validator Update

Based on this analysis, I need to update the marketing validator to:

1. **Detect commercial vs. lead gen CTAs separately**
2. **Check CTA visual hierarchy** (size, position, prominence)
3. **Validate CTA language clarity** ("View Packages" > "Get Decision Confidence")
4. **Flag mixed intent** when commercial and lead gen CTAs compete

### Proposed Validator Logic
```javascript
// Priority 1: Commercial CTAs (revenue-generating)
const commercialKeywords = ['buy', 'purchase', 'view packages', 'pricing', 'get started', '£', '$'];

// Priority 2: Lead qualification CTAs
const leadGenKeywords = ['download', 'free', 'checklist', 'subscribe', 'get guide'];

// Check visual hierarchy
if (leadGenCTA.size >= commercialCTA.size && commercialCTA.exists) {
  flag: "Lead gen CTA competing with commercial CTA - may reduce revenue"
}
```

---

## Next Steps

### Immediate Actions
1. ✅ V2 variation created at `~/portfolio-redesign/src/pages/validate-v2/`
2. ⏳ Deploy V2 to https://decide.strategyxdesign.co.uk/validate-v2/
3. ⏳ Set up A/B testing (Plausible custom events or Google Optimize)
4. ⏳ Run test for 2-4 weeks
5. ⏳ Analyze results and choose winner

### Testing Checklist
- [ ] Deploy V2 to production
- [ ] Verify both pages load correctly
- [ ] Set up conversion tracking for both versions
- [ ] Configure traffic split (50/50 or by source)
- [ ] Document baseline metrics
- [ ] Run for minimum 1000 visitors per variation
- [ ] Calculate statistical significance
- [ ] Choose winner and implement site-wide

---

## File Locations

**Original (V1):**
```
~/portfolio-redesign/src/pages/validate/index.astro
```

**New Variation (V2):**
```
~/portfolio-redesign/src/pages/validate-v2/index.astro
```

**Key Changes in V2:**
- Line 13: `data-ab-variant="commercial-first-v2"`
- Lines 32-48: Headline + subheading rewritten (price-focused)
- Lines 58-89: CTA hierarchy redesigned (prominent primary, downplayed secondary)

---

## Conclusion

You asked the RIGHT question: "Is my CTA the checklist or to buy a package?"

**The answer:** Your CTA should be **what maximizes your business goal**.

- If goal = **email list size** → V1 (balanced)
- If goal = **revenue** → V2 (commercial-first)
- If goal = **both** → A/B test and segment by traffic source

Now you have both variations ready to test. Deploy V2, split your traffic, and let the DATA decide.

---

*Created as part of the Orchestrator Design Review System scaling project*  
*See also: `PORTFOLIO_DESIGN_REVIEW_TEST_RESULTS.md`*

