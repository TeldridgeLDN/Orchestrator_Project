# GreenRoot Image Sourcing Guide

## Images Needed

### Priority 1: Hero Images (3)
These are the most visible and important:

1. **`greenroot-before-hero.jpg`** (Before version)
   - **Type**: Generic, lower-quality stock photo
   - **Subject**: Single plant on plain white background (intentionally basic)
   - **Size**: 1200x800px
   - **Search terms**: "houseplant white background", "potted plant isolated"
   - **Source**: Unsplash or Pexels
   - **Quality**: Mid-quality (to show DIY approach)

2. **`greenroot-starter-hero.jpg`** (Starter version)
   - **Type**: Professional lifestyle shot
   - **Subject**: Thriving monstera in modern home setting
   - **Size**: 1600x1200px
   - **Search terms**: "monstera modern interior", "houseplant home decor"
   - **Source**: Unsplash
   - **Suggested**: https://unsplash.com/s/photos/monstera-plant-home

3. **`greenroot-standard-hero.jpg`** (Standard version)
   - **Type**: Premium lifestyle shot
   - **Subject**: Multiple thriving plants in modern interior with natural light
   - **Size**: 1920x1280px
   - **Search terms**: "houseplants interior design", "plant collection modern home"
   - **Source**: Unsplash
   - **Suggested**: https://unsplash.com/s/photos/indoor-plants-collection

### Priority 2: Product Images (4)
Need product bag mockups for soil blends:

1. **`soil-aroid-mix.jpg`** - Aroid Mix bag
2. **`soil-cactus-mix.jpg`** - Cactus Mix bag
3. **`soil-tropical-blend.jpg`** - Tropical Blend bag
4. **`soil-succulent-mix.jpg`** - Succulent Mix bag (Standard only)

**Options:**
- **Quick Option**: Use stock photos of soil bags
  - Search: "potting soil bag", "organic soil product"
  - Source: Pexels, Unsplash
  
- **Better Option**: Create custom mockups in Canva (FREE)
  - Use Canva's "Product Mockup" templates
  - Add GreenRoot branding
  - Takes ~30 minutes for all 4
  - Tutorial: canva.com/create/mockups

### Priority 3: Testimonial/Plant Images (3)
For social proof section (Standard version):

1. **`plant-monstera.jpg`** - Healthy, thriving monstera
   - Search: "monstera deliciosa healthy"
   - Size: 800x600px

2. **`plant-succulent.jpg`** - Succulent collection
   - Search: "succulent collection potted"
   - Size: 800x600px

3. **`plant-pothos.jpg`** - Lush pothos vine
   - Search: "pothos plant hanging"
   - Size: 800x600px

### Priority 4: Blog Header Images (3)
For educational content section (Standard version):

Any plant-related stock photos:
- Search: "plant care", "repotting plants", "soil texture"
- Size: 800x450px (16:9 aspect ratio)
- Source: Unsplash, Pexels

## Quick Start: Free Sources

### Unsplash (Best Quality, Free)
- URL: https://unsplash.com
- License: Free for commercial use, no attribution required
- Best for: Hero images, lifestyle shots
- Download size: Choose "Large" or "Full" size

### Pexels (Good Quality, Free)
- URL: https://pexels.com
- License: Free for commercial use
- Best for: Product reference photos
- Download size: "Large" option

### Canva (For Product Mockups)
- URL: https://canva.com
- Free account works fine
- Templates: Search "product mockup" or "packaging mockup"
- Export: PNG with transparent background

## Image Optimization Workflow

Once you have the images:

### 1. Save to Project
```bash
# Save to this directory:
/portfolio-redesign/public/images/examples/

# File naming convention:
greenroot-before-hero.jpg
greenroot-starter-hero.jpg
greenroot-standard-hero.jpg
soil-aroid-mix.jpg
soil-cactus-mix.jpg
soil-tropical-blend.jpg
soil-succulent-mix.jpg
plant-monstera.jpg
plant-succulent.jpg
plant-pothos.jpg
blog-header-1.jpg
blog-header-2.jpg
blog-header-3.jpg
```

### 2. Optimize Images
Use an online tool or CLI:

**Option A: Online Tool (Easiest)**
- Visit: https://squoosh.app
- Drag images in
- Choose WebP format
- Quality: 80-85%
- Download optimized versions

**Option B: CLI (Faster for bulk)**
```bash
# Install sharp-cli
npm install -g sharp-cli

# Convert all JPGs to WebP
cd public/images/examples
sharp -i "*.jpg" -o "./" -f webp -q 85
```

### 3. Update File References

Replace placeholders in these files:

**`before.astro`** - Line ~34:
```astro
<!-- Replace: -->
<div class="image-placeholder">
  [Generic plant stock photo would go here]
</div>

<!-- With: -->
<img src="/images/examples/greenroot-before-hero.jpg" 
     alt="Simple houseplant" 
     loading="lazy" />
```

**`starter.astro`** - Line ~57:
```astro
<!-- Replace: -->
<div class="image-placeholder" style="aspect-ratio: 4/3; background: #87A96B;">
  [High-quality lifestyle shot:<br/>Thriving monstera in modern home]
</div>

<!-- With: -->
<img src="/images/examples/greenroot-starter-hero.webp" 
     alt="Thriving monstera plant in modern living room" 
     loading="lazy" />
```

**`standard.astro`** - Line ~80:
```astro
<!-- Replace: -->
<div class="image-placeholder hero-img">
  [Premium lifestyle shot:<br/>Multiple thriving plants in modern interior]
</div>

<!-- With: -->
<img src="/images/examples/greenroot-standard-hero.webp" 
     alt="Collection of healthy houseplants in bright modern interior" 
     loading="lazy" />
```

Same pattern for product images and testimonial images.

## Time Estimates

- **Sourcing all images**: 30-45 minutes
- **Creating product mockups in Canva**: 30 minutes
- **Optimizing images**: 10 minutes
- **Updating code**: 15 minutes
- **Total**: ~2 hours

## Recommended Search Collections

I can help you find specific images. Here are some curated collections:

### Unsplash Collections
- Indoor Plants: https://unsplash.com/collections/8886690/indoor-plants
- Plant Care: https://unsplash.com/collections/9591735/plant-care
- Modern Interiors with Plants: https://unsplash.com/collections/1159644/plants-in-interiors

### Specific Recommendations

**For Before Hero (intentionally basic):**
- https://unsplash.com/photos/green-plant-on-white-ceramic-pot-3_xh46I5wvM
- https://unsplash.com/photos/green-leafed-plant-WG2olAV7YaA

**For Starter Hero (professional):**
- https://unsplash.com/photos/green-plant-on-white-pot-FIKD9t5_5zQ
- https://unsplash.com/photos/green-leafed-plant-FV3GConVSss

**For Standard Hero (premium, multiple plants):**
- https://unsplash.com/photos/green-plants-on-white-wooden-table-KEhq2w8Pu_0
- https://unsplash.com/photos/green-plants-on-brown-wooden-table-Bd7gNnWJBkU

## Need Help?

I can:
1. Search and download specific images for you
2. Create a batch download script
3. Write the image optimization script
4. Update all the code files with actual image paths

Just let me know what you'd like me to do next!

