# Gemini API Key - Configured & Verified ✅

**Date:** November 19, 2025  
**Status:** ✅ Active and Working

---

## Configuration Complete

Your Gemini API key has been:
1. ✅ **Stored** in `~/.zshrc` as environment variable
2. ✅ **Verified** with Gemini API (connection successful)
3. ✅ **Documented** in skill directory
4. ✅ **Ready to use** with nano-banana-prompts skill

---

## What You Can Do Now

### Immediate: Test Image Generation

Try this right now:
```
"Generate hero image for tech startup website with modern office setting"
```

**Expected Output:**
```
Photorealistic wide shot of modern tech startup office at golden hour. 
Diverse team of developers collaborating around large monitor displaying 
colorful dashboard. Floor-to-ceiling windows bathe scene in warm natural 
light, creating energetic yet focused atmosphere. Shot with 35mm f/2.8, 
shallow depth of field emphasizing foreground collaboration. Ultra-high 
resolution, professional commercial photography. 16:9 format.
```

Then use this prompt with Gemini 2.5 Flash Image to generate your image.

---

## API Access Details

**Key Status:** Active  
**Available Models:** gemini-2.5-pro-preview, gemini-1.5-pro, gemini-1.5-flash, and more  
**Location:** Environment variable `GEMINI_API_KEY`  
**Scope:** Global (available in all terminal sessions)

---

## Using Gemini 2.5 Flash Image

### Method 1: Via Google AI Studio (Easiest)

1. Go to: https://aistudio.google.com/
2. Select "Gemini 2.5 Flash"
3. Paste the prompt from nano-banana-prompts
4. Click "Generate"
5. Download the image

### Method 2: Via API (Programmatic)

```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "[PASTE PROMPT FROM nano-banana-prompts HERE]"
      }]
    }]
  }'
```

### Method 3: Via Python Script

```python
import os
import google.generativeai as genai

genai.configure(api_key=os.environ['GEMINI_API_KEY'])
model = genai.GenerativeModel('gemini-2.5-flash')

# Use prompt from nano-banana-prompts
prompt = "Photorealistic wide shot of modern tech office..."
response = model.generate_content(prompt)

# Save image
with open('hero-image.jpg', 'wb') as f:
    f.write(response.image_data)
```

---

## Complete Workflow Example

### Scenario: Create Portfolio Hero

```bash
# Step 1: Generate prompt (nano-banana-prompts)
User: "Generate hero image for developer portfolio, 
       showing coder at work, warm aesthetic, professional"

AI outputs:
"Professional lifestyle photo of developer working on MacBook Pro 
in modern minimalist workspace. Person typing code with colorful 
syntax highlighting visible on screen, viewed from slight over-shoulder 
angle. Warm Edison bulb desk lamp creates cozy golden glow mixing with 
cool blue monitor light. Wooden desk with potted succulent and coffee 
mug add personality. Shot with 50mm f/1.8, shallow depth of field keeps 
hands and screen sharp while gently blurring background. Authentic, 
focused atmosphere perfect for developer portfolio. 16:9 landscape format."

# Step 2: Generate image (Google AI Studio or API)
→ Use prompt with Gemini
→ Download: portfolio-hero.jpg

# Step 3: Optimize for web
→ Resize to 1920x1080 (desktop) and 960x540 (mobile)
→ Compress with ImageOptim
→ Convert to WebP
→ Save in: src/assets/images/

# Step 4: Implement component
User: "Build hero section with this image, include name, tagline, CTA button"

AI (frontend-design-system) generates:
```typescript
// Hero.tsx
import heroImage from '@/assets/images/portfolio-hero.webp';

export const Hero = () => (
  <section className="relative h-screen">
    <picture>
      <source srcSet={heroImage} type="image/webp" />
      <img 
        src="/assets/images/portfolio-hero.jpg"
        alt="Developer workspace"
        className="object-cover w-full h-full"
      />
    </picture>
    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent">
      <div className="container mx-auto h-full flex items-center">
        <div className="max-w-2xl px-8">
          <h1 className="text-6xl font-bold text-white mb-4">
            Your Name
          </h1>
          <p className="text-2xl text-white/90 mb-8">
            Full-Stack Developer | React & Node.js
          </p>
          <button className="px-8 py-4 bg-primary text-white rounded-lg">
            View Projects
          </button>
        </div>
      </div>
    </div>
  </section>
);
```
```

**Total Time:** ~10-15 minutes  
**Result:** Professional hero section with custom imagery

---

## API Usage & Limits

### Your Plan
- Check at: https://console.cloud.google.com/
- View usage: https://aistudio.google.com/

### Typical Costs
- Image generation: ~$0.01-0.05 per image
- Text generation: ~$0.001-0.01 per request
- Free tier: Usually available for testing

### Rate Limits
- Varies by plan
- Free tier: Generous for individual development
- Upgrade: If hitting limits frequently

---

## Security

### ✅ What We Did
- Stored in environment variable (not hardcoded)
- Added to shell profile for persistence
- Documented in private skill directory

### ⚠️ Important
- **DO NOT** commit API key to git
- **DO NOT** share in public repos
- **DO NOT** expose in client-side code
- **DO** rotate if accidentally exposed

### Gitignore Recommendation
```bash
# Add to .gitignore
.env
.claude/skills/nano-banana-prompts/GEMINI_API_SETUP.md
**/GEMINI_API_*
```

---

## Troubleshooting

### Test API Connection
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}"
```

**Expected:** List of available models  
**If fails:** Check API key, network connection, billing status

### Common Issues

**"Invalid API key"**
- Verify key in `~/.zshrc`
- Reload shell: `source ~/.zshrc`
- Check for extra spaces or characters

**"Quota exceeded"**
- Check usage dashboard
- Wait for quota reset (usually daily)
- Upgrade plan if needed

**"Model not found"**
- Use `gemini-2.5-flash` or `gemini-1.5-pro`
- Check model availability in your region

---

## Next Steps

### 1. Test nano-banana-prompts Right Now
```
"Generate hero image for [your project type]"
```

### 2. Try Complete Workflow
```bash
# Generate scenarios
"Generate user scenarios for portfolio site"

# Generate matching image
"Create hero image that shows [emotion from scenario]"

# Implement component
"Build hero section with this image"
```

### 3. Create Your First Custom Visual
- Choose a project that needs a hero image
- Use nano-banana-prompts to generate optimized prompt
- Generate image with Gemini
- Implement with frontend-design-system

---

## Documentation Reference

**Skill Docs:** `~/.claude/skills/nano-banana-prompts/`
- `README.md` - Quick reference
- `skill.md` - Complete documentation
- `INTEGRATION_GUIDE.md` - How to use with other skills
- `GEMINI_API_SETUP.md` - API configuration details

**Project Docs:** `Orchestrator_Project/`
- `NANO_BANANA_SKILL_COMPLETE.md` - Installation summary
- `NANO_BANANA_QUICK_START.md` - Quick start guide
- `NANO_BANANA_API_CONFIGURED.md` - This file

---

## Quick Reference

### Trigger nano-banana-prompts
```
"generate image"
"create hero image"
"photorealistic [subject]"
"illustration of [concept]"
```

### Best Aspect Ratios
```
16:9 - Desktop hero sections
4:5  - Mobile-friendly images
1:1  - Social media posts
9:16 - Mobile hero/stories
```

### Prompt Length
```
50-100 words = Recommended (best balance)
10-20 words  = Quick (less control)
100-200      = Detailed (max control)
```

---

**✅ Everything is configured and ready!**

**Try it now:**
```
"Generate hero image for tech startup with collaborative team"
```

---

**Configured:** November 19, 2025  
**Status:** Active and Verified  
**API Key Location:** `~/.zshrc` (GEMINI_API_KEY)  
**Skill Location:** `~/.claude/skills/nano-banana-prompts/`

**🎉 Ready to generate amazing images for your web projects!**

