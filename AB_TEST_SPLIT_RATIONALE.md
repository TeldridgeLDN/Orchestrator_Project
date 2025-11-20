# A/B Test Traffic Split Rationale
**Date**: November 20, 2025  
**Test**: Validation Landing Pages (V1, V2, V3)  
**Split**: 50/25/25 (V3: 50%, V1: 25%, V2: 25%)

---

## 📊 Current Split Configuration

### **Traffic Distribution:**

| Variant | Traffic % | Name | Type |
|---------|-----------|------|------|
| **V3** | **50%** | Comprehensive + Authentic | Baseline/Control |
| **V1** | **25%** | Simplified Professional | Test Variant A |
| **V2** | **25%** | Simplified Problem-Focused | Test Variant B |

**Implementation Location**: `/public/js/variant-assignment.js`

```javascript
const VARIANTS = {
  v1: { path: '/validate/', weight: 25, name: 'V1 - Simplified Professional' },
  v2: { path: '/validate-v2/', weight: 25, name: 'V2 - Simplified Problem-Focused' },
  v3: { path: '/validate-v3/', weight: 50, name: 'V3 - Comprehensive' }
};
```

---

## 🎯 Why This Split?

### **1. V3 as Baseline (50%)**

**Rationale:**
- V3 is the **most comprehensive** version (FAQ, How It Works, Lead Magnet, etc.)
- Contains the **authentic "Why I Built This"** story (personal credibility)
- Represents the **full-featured approach** worth validating
- Needs **larger sample size** to establish baseline conversion metrics
- If V3 wins, it becomes the proven standard

**Statistical Reasoning:**
- Larger sample (50%) = More reliable baseline data
- Easier to detect if simplified versions (V1, V2) outperform
- Reduces risk: If V1/V2 fail, you have more V3 data to fall back on

**Strategic Value:**
- Tests the hypothesis: "Comprehensive pages with authentic stories convert better"
- Validates whether depth and trust-building actually matters
- Provides reference point for future iterations

---

### **2. V1 as Test Variant A (25%)**

**Rationale:**
- Tests the **"simplicity hypothesis"**: Less is more
- 11K vs 60K+ (your previous version) - dramatic size reduction
- Focuses on **professional founders** who want clarity fast
- 5 core sections only - benefits-focused
- Integrated examples showcase

**What This Tests:**
- Do users actually want less content?
- Is speed/simplicity worth sacrificing depth?
- Does professional messaging resonate?

**Statistical Reasoning:**
- 25% provides sufficient sample for comparison
- Equal allocation with V2 allows fair comparison between simplified approaches

---

### **3. V2 as Test Variant B (25%)**

**Rationale:**
- Tests the **"pain-first hypothesis"**: Lead with the problem
- Aggressive problem/solution framing
- Stats upfront for immediate credibility
- Targets **pain-aware founders** needing proof
- Different messaging angle than V1

**What This Tests:**
- Does problem-agitation-solution structure work better?
- Do founders respond to pain points or benefits?
- Which simplified approach performs better (V1 vs V2)?

**Statistical Reasoning:**
- 25% provides sufficient sample for comparison
- Equal allocation with V1 creates fair A/B comparison
- Combined with V1 (50% total simplified), can test "simple vs comprehensive"

---

## 📈 Statistical Considerations

### **Sample Size Requirements:**

**Minimum Viable Sample** (assumes 5% conversion baseline):
- V3 (50%): 250 visitors → ~12-13 conversions
- V1 (25%): 125 visitors → ~6-7 conversions
- V2 (25%): 125 visitors → ~6-7 conversions

**Total needed**: ~500 visitors for initial insights

**For Statistical Significance** (80% power, 95% confidence):
- V3 (50%): 1,000+ visitors
- V1 (25%): 500+ visitors
- V2 (25%): 500+ visitors

**Total needed**: ~2,000 visitors for reliable conclusions

**Timeline Estimate** (based on typical traffic):
- Low traffic (50/day): 40 days
- Medium traffic (200/day): 10 days
- High traffic (500/day): 4 days

---

## 🔬 What Each Split Tests

### **Primary Hypotheses:**

**H1: Comprehensive vs Simplified**
- V3 (50%) vs [V1 + V2 combined] (50%)
- Tests: Does depth matter, or is simplicity better?

**H2: Professional vs Problem-Focused**
- V1 (25%) vs V2 (25%)
- Tests: Which messaging angle works better for simplified pages?

**H3: Three-Way Comparison**
- V3 vs V1 vs V2
- Tests: Which specific approach wins overall?

---

## 🎲 Alternative Splits Considered (Not Chosen)

### **Option A: Equal Split (33/33/34%)**

**Pros:**
- Fair comparison, equal statistical power
- Simplest to explain

**Cons:**
- No clear baseline/control
- Requires more traffic for same confidence level
- Higher risk if all variants underperform

**Why Not Chosen**: Need a strong baseline for comparison

---

### **Option B: Classic A/B (50/50% - V3 vs V1 only)**

**Pros:**
- Fastest to statistical significance
- Clear winner/loser
- Traditional approach

**Cons:**
- Loses V2 problem-focused variant
- Can't test multiple simplified approaches
- Misses opportunity to compare messaging angles

**Why Not Chosen**: Want to test both simplified variants

---

### **Option C: Heavily Weighted Control (70/15/15%)**

**Pros:**
- Maximum safety (most traffic sees V3)
- Very strong baseline data

**Cons:**
- Takes much longer to test V1/V2
- Inefficient use of testing opportunity
- Too conservative

**Why Not Chosen**: 50% is sufficient baseline, wastes testing potential

---

### **Option D: Sequential Testing (100% one variant at a time)**

**Pros:**
- Simpler to implement
- No cross-variant contamination

**Cons:**
- Takes 3x longer
- External factors change over time
- Seasonal effects skew results

**Why Not Chosen**: Simultaneous testing is more reliable

---

## 💡 Why 50/25/25 is Optimal

### **Strategic Balance:**

1. **Strong Baseline** (50% V3)
   - Sufficient data for reliable control metrics
   - Tests your most complete offering
   - Provides fallback if simplified versions fail

2. **Fair Comparison** (25% V1, 25% V2)
   - Equal traffic between simplified variants
   - Tests two distinct approaches
   - Identifies which simplification strategy works

3. **Efficient Testing** (All three simultaneously)
   - Fastest path to insights
   - Controls for external factors
   - Tests multiple hypotheses at once

4. **Risk Mitigation** (Weighted toward comprehensive)
   - If V1/V2 fail, 50% still see full-featured page
   - Less risk than equal split
   - Protects conversion rates during test

---

## 📋 Success Metrics to Track

### **Primary Metric: Conversion Rate**
- Email signup rate (if lead magnet)
- Package click-through rate
- Contact form submissions

### **Secondary Metrics:**
- Time on page (comprehension)
- Scroll depth (engagement)
- Bounce rate (relevance)
- Exit rate (drop-off points)

### **Engagement Metrics:**
- Example page views (from showcase)
- FAQ expansion rate (V3 only)
- CTA button clicks

---

## 🎯 Decision Framework

### **After Collecting Data:**

**Scenario 1: V3 Wins (Comprehensive)**
- **Action**: Keep V3 as primary
- **Insight**: Depth and trust-building matter
- **Next**: Test improvements to V3

**Scenario 2: V1 Wins (Simplified Professional)**
- **Action**: Switch to V1
- **Insight**: Simplicity and clarity trump depth
- **Next**: Test variations of professional messaging

**Scenario 3: V2 Wins (Simplified Problem-Focused)**
- **Action**: Switch to V2
- **Insight**: Pain-first approach works
- **Next**: Test variations of problem framing

**Scenario 4: No Clear Winner (Within 5% of each other)**
- **Action**: Keep V3 (most complete)
- **Insight**: Structure matters less than expected
- **Next**: Test pricing, CTAs, or specific sections

**Scenario 5: V1 and V2 Both Beat V3**
- **Action**: Run follow-up test (V1 vs V2 at 50/50)
- **Insight**: Simplicity wins overall
- **Next**: Determine which simplified approach is best

---

## 🔄 Adjusting the Split (If Needed)

### **When to Change:**

**Increase V3 Weight (to 60-70%):**
- If early data shows V3 converting much better
- To reduce risk of lost conversions
- If traffic is very low (need baseline faster)

**Equal Split (to 33/33/34%):**
- After V3 baseline is established
- To speed up V1/V2 comparison
- If one variant is clearly losing

**Sequential Testing (to 100% one at a time):**
- After identifying top 2 performers
- For final head-to-head comparison
- To maximize statistical power

### **How to Adjust:**

Edit `/public/js/variant-assignment.js`:

```javascript
const VARIANTS = {
  v1: { path: '/validate/', weight: 33, name: 'V1 - Simplified Professional' },
  v2: { path: '/validate-v2/', weight: 33, name: 'V2 - Simplified Problem-Focused' },
  v3: { path: '/validate-v3/', weight: 34, name: 'V3 - Comprehensive' }
};
```

**Note**: Weights must add up to 100

---

## 📊 Tracking the Test

### **Plausible Events (Task 128.4 - Pending):**

Once Plausible is enabled:

1. **Variant_Assigned** - Tracks which variant user sees
2. **Package_Click** - Tracks which packages are clicked
3. **Example_View** - Tracks GreenRoot example engagement
4. **Scroll_Depth** - Tracks how far users scroll
5. **CTA_Click** - Tracks CTA button clicks

All events include `variant` property for segmentation.

### **Analysis Approach:**

```javascript
// Pseudo-code for analysis
const v3_conversion = (v3_conversions / v3_visitors) * 100;
const v1_conversion = (v1_conversions / v1_visitors) * 100;
const v2_conversion = (v2_conversions / v2_visitors) * 100;

// Statistical significance (use chi-square test)
// Confidence level: 95%
// Power: 80%
```

---

## 🎓 Why This Matters

### **The Bigger Picture:**

This isn't just about which page converts better. The test reveals:

1. **User Psychology**: Do founders want depth or simplicity?
2. **Trust Building**: Does authenticity (V3 story) matter?
3. **Messaging Strategy**: Professional or pain-focused?
4. **Content Economics**: Is comprehensive content worth the effort?
5. **Future Direction**: Informs all future landing page work

### **The 50/25/25 Split Enables:**

- Testing comprehensive approach thoroughly (50%)
- Comparing two distinct simplified strategies (25% each)
- Building statistical confidence efficiently
- Making data-driven decisions
- Protecting conversion rates during testing

---

## 📝 Summary

**Current Split**: 50% V3, 25% V1, 25% V2

**Why V3 Gets 50%:**
- Most comprehensive (baseline/control)
- Needs larger sample for reliable metrics
- Represents "full-featured" hypothesis
- Risk mitigation (fallback if others fail)

**Why V1 and V2 Each Get 25%:**
- Equal comparison between simplified variants
- Sufficient sample size for insights
- Tests two distinct messaging approaches
- Combined (50% total) tests "simple vs comprehensive"

**Result**: Balanced, efficient, statistically sound A/B/C test that answers multiple strategic questions simultaneously.

---

**Status**: Ready to execute after merge ✅  
**Next**: Enable Plausible Analytics (Task 128.4)  
**Timeline**: 2-4 weeks data collection recommended

