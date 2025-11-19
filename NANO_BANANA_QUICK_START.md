# Nano Banana Quick Start

**Status:** ✅ Installed and Ready  
**Date:** November 19, 2025

---

## 🎯 What You Can Do Now

Generate optimized image prompts for:
- **Hero sections** - Landing page backgrounds
- **Illustrations** - Blog headers, feature sections
- **Product photos** - E-commerce, showcases
- **Abstract backgrounds** - Section dividers, cards
- **Team photos** - About pages

---

## ⚡ Quick Test

Try this right now:

```
"Generate hero image for tech startup website"
```

You should get a detailed Gemini prompt like:
```
"Photorealistic wide shot of modern tech startup office at golden 
hour. Diverse team collaborating around monitor displaying colorful 
dashboard. Warm natural light, 35mm f/2.8, 16:9 format."
```

---

## 🔄 Complete Workflow

### Option 1: Simple (2 Steps)

```bash
1. "Generate hero image for [project]"
   → Get Gemini prompt
   → Use with Gemini API
   → Download image

2. "Build hero component with this image"
   → frontend-design-system creates component
```

**Time:** ~5 minutes

### Option 2: User-Centered (3 Steps)

```bash
1. "Generate user scenarios for [feature]"
   → user-scenario-generator creates scenarios

2. "Create hero that conveys [emotion from scenario]"
   → nano-banana-prompts uses scenario insights

3. "Implement hero component"
   → frontend-design-system builds it
```

**Time:** ~15 minutes

---

## 📁 Where Files Live

```
~/.claude/skills/nano-banana-prompts/
├── README.md              ← Quick reference
├── skill.md               ← Full documentation (595 lines)
├── metadata.json          ← Configuration
└── INTEGRATION_GUIDE.md   ← How it works with other skills (568 lines)

Orchestrator_Project/
├── templates/frontend-skills-rules-with-nano-banana.json
└── NANO_BANANA_SKILL_COMPLETE.md  ← Installation summary
```

**Total Documentation:** 1,163 lines

---

## 🎨 Activation Triggers

Say any of these:
- "generate image"
- "create hero image"
- "gemini image"
- "photorealistic"
- "illustration of"
- "product photo"

---

## 💡 Pro Tips

### Aspect Ratios
```
16:9 → Desktop hero (recommended)
4:5  → Mobile-friendly
1:1  → Social media
```

### Prompt Length
```
Short:  10-20 words  (quick, less control)
Medium: 50-100 words (recommended, balanced)
Long:   100-200 words (max control)
```

### Iteration
```
"Generate hero" → V1
"Make lighting warmer" → V2 (one change only!)
"Perfect, use this" → Done
```

---

## 🚀 Next Steps

### 1. Get Gemini API Access
- Visit: https://ai.google.dev/
- Get API key for Gemini 2.5 Flash Image
- Test image generation

### 2. Generate Your First Image
```
"Generate hero image for [your project]"
```

### 3. Try Integration Workflow
```
"Generate scenarios" → "Generate image" → "Build component"
```

---

## 🔗 Integration Points

**Works With:**
- ✅ user-scenario-generator (understand needs → visual that matches)
- ✅ react-component-analyzer (analyze generated image → extract specs)
- ✅ frontend-design-system (image → component implementation)
- ✅ taskmaster (create image generation tasks)

---

## 📋 Common Use Cases

### Portfolio Hero
```
"Generate hero showing developer at work, modern workspace, warm lighting"
→ Get prompt → Use with Gemini → Implement component
```

### Blog Header
```
"Create minimalist illustration for blog post about productivity"
→ Get prompt → Generate image → Add to blog layout
```

### Feature Section
```
"Generate isometric illustration showing cloud data sync"
→ Get prompt → Create image → Implement feature section
```

### Product Photography
```
"Generate product photo of laptop on marble desk, studio lighting"
→ Get prompt → Create photo → Add to e-commerce page
```

---

## ⚠️ Important Notes

**This skill generates PROMPTS, not images.**

You need:
1. Gemini 2.5 Flash Image API access
2. Ability to use generated prompt with Gemini
3. Image optimization tools (ImageOptim, TinyPNG)

**Priority:** LOW (won't interfere with core development skills)

---

## 📖 Documentation

- **Quick Start:** `~/.claude/skills/nano-banana-prompts/README.md`
- **Full Docs:** `~/.claude/skills/nano-banana-prompts/skill.md`
- **Integration:** `~/.claude/skills/nano-banana-prompts/INTEGRATION_GUIDE.md`
- **Installation:** `NANO_BANANA_SKILL_COMPLETE.md`

---

## 🐛 Troubleshooting

**Skill not activating?**
```
Try: "Load nano-banana-prompts skill"
Or: Use explicit trigger "generate image for..."
```

**Generated prompt doesn't match style?**
```
Include your brand details:
"Generate in our style: blues (#3B82F6), modern, professional"
```

**Image doesn't fit layout?**
```
Specify composition:
"Generate with clear left third for headline text"
```

---

## ✨ Examples

### 1. SaaS Hero
```
Input: "Generate hero for productivity SaaS"

Output:
"Photorealistic modern workspace with laptop displaying colorful 
dashboard. Professional using app while surrounded by organized 
workspace elements. Golden hour lighting through large windows creates 
warm, productive atmosphere. Shot 35mm f/2.0, 16:9 format."
```

### 2. Blog Illustration
```
Input: "Create illustration for time management blog post"

Output:
"Minimalist flat illustration of person organizing calendar with 
floating clock icons. Limited palette: navy (#1E40AF), sky blue 
(#3B82F6), coral accent. Clean line art style, balanced composition. 
16:9 landscape for blog header."
```

### 3. Product Photo
```
Input: "Generate product photo of smartwatch"

Output:
"High-resolution product photo of stainless steel smartwatch on 
white marble surface. Soft diffused studio lighting at 45-degree 
angle minimizes reflections, shows screen clearly. Slight overhead 
angle showcases circular face and metal band. Ultra-realistic, 
sharp focus. 1:1 format for e-commerce."
```

---

**Ready to use! Try:** `"Generate hero image for [your project]"` 🎉

---

**Version:** 1.0.0  
**Installed:** November 19, 2025  
**Status:** Production Ready  
**External Dependency:** Gemini 2.5 Flash Image API

**Original:** [lifegenieai/claude-skills](https://github.com/lifegenieai/claude-skills/tree/master/nano-banana-prompts)  
**Adapted By:** Orchestrator Core Team

