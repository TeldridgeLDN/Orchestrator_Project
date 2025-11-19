# Nano Banana Image Prompts - Installation Complete ✅

**Date:** November 19, 2025  
**Status:** Production Ready  
**Version:** 1.0.0

---

## Summary

Successfully added **nano-banana-prompts** skill to Orchestrator as a standalone image generation tool for creating hero images, illustrations, and visual assets for web projects.

---

## What Was Installed

### 1. Skill Files (Global)

**Location:** `~/.claude/skills/nano-banana-prompts/`

```
~/.claude/skills/nano-banana-prompts/
├── skill.md (16.5 KB)
│   - Complete skill documentation
│   - Photography, illustration, abstract art prompts
│   - Web-specific use cases
│   - Integration with frontend skills
│
├── metadata.json (3.2 KB)
│   - Skill configuration
│   - Trigger phrases
│   - Capabilities and limitations
│   - Integration metadata
│
└── INTEGRATION_GUIDE.md (12.8 KB)
    - How skill works with existing frontend skills
    - 4 integration patterns
    - Workflow sequences
    - Troubleshooting
```

**Total:** 32.5 KB, ~800 tokens (skill overview only)

---

## Skill Capabilities

### What It Does

✅ **Generates optimized prompts** for Gemini 2.5 Flash Image  
✅ **Photography prompts** (portraits, landscapes, products)  
✅ **Illustration prompts** (vector, watercolor, digital art)  
✅ **Abstract backgrounds** for web sections  
✅ **Hero section images** with text overlay considerations  
✅ **Multi-turn iterative editing** (one change at a time)  
✅ **Aspect ratio guidance** for web use cases  
✅ **Natural language descriptions** (not keyword lists)

### What It Doesn't Do

❌ Generate images directly (requires Gemini API access)  
❌ Optimize images for web (use ImageOptim, TinyPNG, etc.)  
❌ Create SVG vectors (raster only)  
❌ Complex text rendering (limit: 25 characters)

---

## Integration with Frontend Skills

### The Four-Skill Ecosystem

```
1. user-scenario-generator (WHY) - Understand user needs
2. nano-banana-prompts (VISUAL) - Generate image assets  ← NEW
3. react-component-analyzer (WHAT) - Extract design specs
4. frontend-design-system (HOW) - Implement components
```

### Integration Patterns

#### Pattern 1: Direct Hero Generation
```
User: "Generate hero image for SaaS landing"
→ nano-banana-prompts generates Gemini prompt
→ User gets image from Gemini
→ "Build hero component with this image"
→ frontend-design-system implements
```

#### Pattern 2: Scenario-Driven Visuals
```
User: "Generate scenarios for productivity app"
→ user-scenario-generator creates scenarios
→ "Create hero that conveys feeling organized"
→ nano-banana-prompts uses scenario insights
→ frontend-design-system implements
```

#### Pattern 3: Complete Workflow
```
1. Understand need (scenario-generator)
2. Generate visuals (nano-banana)
3. Implement component (design-system)
4. Optimize assets (external tools)
```

---

## Auto-Activation

### Trigger Phrases

```
"generate image"
"create hero image"
"gemini image"
"photorealistic"
"illustration of"
"product photo"
"background image"
"feature illustration"
```

### File Patterns

```
src/assets/images/**
public/images/**
*.jpg, *.png, *.webp
```

### Priority

**LOW** - Specialized use case, doesn't interfere with core development skills

---

## Configuration

### Skill Rules Template

**Created:** `templates/frontend-skills-rules-with-nano-banana.json`

This template includes all 4 frontend skills with proper activation rules. To use in a project:

```bash
# Copy template to project
cp templates/frontend-skills-rules-with-nano-banana.json \
   [project]/.claude/skill-rules.json

# Or manually add nano-banana section to existing skill-rules.json
```

---

## Usage Examples

### Example 1: Portfolio Hero

```bash
User: "Generate hero image for portfolio - developer at work, 
       modern workspace, warm lighting"

nano-banana-prompts generates:
"Photorealistic lifestyle photo of developer working on MacBook Pro 
in minimalist workspace. Warm Edison bulb creates cozy golden light 
mixing with cool monitor glow. Shot with 50mm f/1.8, shallow depth 
of field. 16:9 for website hero."

→ User gets image from Gemini
→ Downloads as hero-background.jpg

User: "Build hero section with this image"
→ frontend-design-system creates component
```

### Example 2: Blog Header

```bash
User: "Create minimalist illustration for productivity blog post"

nano-banana-prompts generates:
"Minimalist flat illustration of person organizing tasks. Clean 
geometric shapes, limited palette (navy, sky blue, coral). Modern 
tech aesthetic. 16:9 landscape for blog header."

→ User gets illustration
→ Implements with frontend-design-system
```

### Example 3: Feature Section

```bash
User: "Generate isometric illustration showing cloud data sync"

nano-banana-prompts generates:
"Isometric illustration of cloud ecosystem. Central cloud connected 
by glowing streams to laptop, phone, tablet. Clean modern style, 
blue palette. 4:5 portrait for mobile-first feature section."

→ User gets illustration
→ Adds to feature section component
```

---

## Best Practices

### DO:

✅ **Use natural descriptions, not keyword lists**
```
Good: "Professional businesswoman in navy suit stands in modern office"
Bad: "woman, suit, office, professional"
```

✅ **Specify aspect ratio for web use**
```
"16:9 for desktop hero"
"4:5 for mobile-friendly portrait"
"1:1 for social media"
```

✅ **Design with text overlay in mind**
```
"Clear space in left third for headline text"
"Composition guides eye toward text area"
```

✅ **Iterate one change at a time**
```
"Generate hero" → V1
"Make lighting warmer" → V2
"Perfect, use this"
```

### DON'T:

❌ List keywords without context  
❌ Request complex text (>25 characters)  
❌ Make multiple changes simultaneously  
❌ Forget to optimize images before using  
❌ Ignore design system color palette

---

## File Organization

### Recommended Structure

```
project/
├── src/
│   ├── assets/
│   │   └── images/
│   │       ├── hero-background.jpg
│   │       ├── hero-background.webp
│   │       ├── hero-background@2x.jpg
│   │       └── hero-background@2x.webp
│   ├── components/
│   │   └── Hero.tsx
│   └── ...
└── docs/
    └── image-prompts.md (optional log)
```

---

## Testing

### Manual Activation Test

```bash
# Test 1: Trigger phrase
"Generate hero image for landing page"
→ Should activate nano-banana-prompts
→ Should generate detailed Gemini prompt

# Test 2: Chain with design system
"Generate hero image" → nano-banana activates
[User gets image from Gemini]
"Build hero component" → frontend-design-system activates

# Test 3: Integration with scenarios
"Generate user scenarios" → scenario-generator activates
"Create hero matching user needs" → nano-banana activates
```

### Verification Checklist

- [x] Skill files created in `~/.claude/skills/nano-banana-prompts/`
- [x] metadata.json configured properly
- [x] Integration guide complete
- [x] Template rules created
- [x] Documentation complete
- [ ] Manual activation test (user to perform)
- [ ] Integration workflow test (user to perform)
- [ ] Image optimization pipeline verified (user to perform)

---

## Next Steps

### Immediate (User Actions)

1. **Test Manual Activation**
   ```bash
   "Generate hero image for [your project]"
   ```

2. **Try Integration Workflow**
   ```bash
   "Generate scenarios" → "Generate image" → "Implement component"
   ```

3. **Set Up Gemini API Access** (if not already)
   - Visit https://ai.google.dev/
   - Get API key for Gemini 2.5 Flash Image
   - Test image generation

### Future Enhancements (Optional)

**Could Add:**
- Direct Gemini API integration (generate without leaving chat)
- Automatic image optimization pipeline
- Style presets per project
- Batch generation for multiple variations
- Design token extraction from generated images

---

## Troubleshooting

### "Skill not activating"

**Check:**
1. Trigger phrase used correctly
2. Context makes sense (discussing images/visuals)
3. Try manual: "Load nano-banana-prompts skill"

### "Generated prompt doesn't match project style"

**Solution:**
```bash
"Generate hero image in our style:
- Colors: [project palette]
- Mood: [professional/casual/energetic]
- Style: [modern/classic/minimal]"
```

### "Image doesn't work in layout"

**Solution:**
```bash
# Specify composition needs upfront
"Generate with clear left third for text overlay"
"Composition should guide eye toward [focal point]"
```

---

## Metrics

### Installation Stats

```
Files Created: 4
Total Size: 32.5 KB
Token Footprint: ~800 (skill overview only)
Installation Time: ~15 minutes
Skill Priority: LOW (specialized)
```

### Integration Points

```
Compatible With:
- user-scenario-generator ✅
- react-component-analyzer ✅
- frontend-design-system ✅
- taskmaster ✅ (can create tasks for image generation)
```

---

## Documentation

### Created Files

1. **`~/.claude/skills/nano-banana-prompts/skill.md`**
   - Complete skill documentation
   - Photography, illustration, abstract prompts
   - Web-specific use cases
   - Integration guidance

2. **`~/.claude/skills/nano-banana-prompts/metadata.json`**
   - Skill configuration
   - Trigger phrases and patterns
   - Capabilities and limitations

3. **`~/.claude/skills/nano-banana-prompts/INTEGRATION_GUIDE.md`**
   - Integration patterns with frontend skills
   - Workflow sequences
   - Best practices
   - Troubleshooting

4. **`templates/frontend-skills-rules-with-nano-banana.json`**
   - Auto-activation rules for all 4 frontend skills
   - Template for project-specific configuration

5. **`NANO_BANANA_SKILL_COMPLETE.md`** (this file)
   - Installation summary
   - Quick reference
   - Next steps

---

## Related Skills

**Frontend Ecosystem:**
- `user-scenario-generator` - WHY do users need this?
- `react-component-analyzer` - WHAT is in this design?
- `frontend-design-system` - HOW do I build this?
- `nano-banana-prompts` - VISUAL assets for implementation ← NEW

**Project Management:**
- `taskmaster` - Can create image generation tasks

---

## Quick Reference Card

### Activation
```
"generate image" or "create hero image"
```

### Basic Usage
```
1. Describe what you need
2. Get optimized Gemini prompt
3. Use prompt with Gemini API
4. Download image
5. Optimize for web
6. Implement with frontend-design-system
```

### Aspect Ratios
```
Desktop Hero: 16:9
Mobile Hero: 4:5 or 9:16
Social Media: 1:1
Blog Header: 16:9
Feature Images: 4:5
```

### Prompt Length
```
Short: 10-20 words (quick)
Medium: 50-100 words (recommended)
Long: 100-200 words (maximum control)
```

---

**Installation Complete! 🎉**

The skill is ready to use. Test it with:
```
"Generate hero image for [your project]"
```

---

**Installed:** November 19, 2025  
**Version:** 1.0.0  
**Status:** Production Ready  
**External Dependency:** Gemini 2.5 Flash Image API

**Original Source:** [lifegenieai/claude-skills](https://github.com/lifegenieai/claude-skills/tree/master/nano-banana-prompts)  
**Adapted By:** Orchestrator Core Team

