# Quick Start Guide: Adding New Icons

**For Developers New to the Project**

This is a simplified guide to add your first icon to the project. For comprehensive documentation, see [ICON_SYSTEM_GUIDE.md](./ICON_SYSTEM_GUIDE.md).

---

## 5-Minute Quick Start

### Step 1: Find Your Icon

Go to https://lucide.dev/icons and search for the icon you need.

**Example:** Let's say you need a "star" icon for ratings.

### Step 2: Add to Central Exports (30 seconds)

Open `src/lib/icons.tsx` and add your icon:

```tsx
// src/lib/icons.tsx
export {
  // ... existing icons ...
  Star,  // ← Add this line
} from 'lucide-react';
```

**Save the file!**

### Step 3: Use in Your Component (2 minutes)

```tsx
// Your component file (e.g., src/components/MyComponent.tsx)
import { Icon } from '@/components/Icon';
import { Star } from '@/lib/icons';

export const MyComponent = () => {
  return (
    <div>
      {/* Semantic icon - conveys meaning */}
      <Icon 
        icon={Star}
        size="md"
        label="5-star rating"
      />
      
      {/* OR decorative icon - just visual */}
      <div className="flex items-center gap-2">
        <Icon icon={Star} size="sm" decorative />
        <span>Featured</span>
      </div>
    </div>
  );
};
```

### Step 4: Test (1 minute)

```bash
npm run dev
```

Open your browser and check that the icon appears correctly.

**Done!** ✅

---

## Common Scenarios

### Scenario 1: Button with Icon

```tsx
<button className="flex items-center gap-2">
  Learn More
  <Icon icon={ArrowRight} size="sm" decorative />
</button>
```

**Why `decorative`?** The text "Learn More" already explains what the button does.

### Scenario 2: Icon with Text (Badge)

```tsx
<div className="flex items-center gap-2">
  <Icon 
    icon={CheckCircle2}
    size="sm"
    color="success"
    label="Verified account"
  />
  <span>100+ verified users</span>
</div>
```

**Why `label`?** The icon adds meaning that isn't fully clear from the text alone.

### Scenario 3: Large Section Icon

```tsx
<section>
  <Icon 
    icon={Rocket}
    size="xl"
    color="brand-primary"
    label="Product launch features"
  />
  <h2>Launch Your Product</h2>
  <p>Everything you need to succeed...</p>
</section>
```

---

## Size Cheat Sheet

| Size | Pixels | When to Use |
|------|--------|-------------|
| `xs` | 12px | Footer, tiny badges |
| `sm` | 16px | Buttons, small UI |
| `md` | 24px | **Default** - inline badges |
| `lg` | 32px | Feature cards |
| `xl` | 40px | Section headers |
| `2xl` | 48px | Hero sections |

**Pro tip:** When in doubt, use `md`.

---

## Semantic vs Decorative

### Use `label` (Semantic) When:
- ✅ Icon conveys important meaning
- ✅ Icon is the primary indicator
- ✅ Removing it would lose information

**Example:**
```tsx
<Icon icon={AlertTriangle} size="md" label="Warning: Action cannot be undone" />
```

### Use `decorative` When:
- ✅ Icon just looks nice
- ✅ Text already explains everything
- ✅ Icon is redundant for screen readers

**Example:**
```tsx
<button>
  Submit <Icon icon={Send} size="sm" decorative />
</button>
```

---

## Troubleshooting

### Icon Not Showing?

1. **Check the import:**
   ```tsx
   import { Star } from '@/lib/icons';  // ✅ Correct
   import { Star } from 'lucide-react';  // ⚠️ Works but not recommended
   ```

2. **Verify you added it to `src/lib/icons.tsx`**

3. **Check console for errors** (F12 in browser)

### Wrong Size?

```tsx
<Icon icon={Star} size="lg" />  // ✅ Correct
<Icon icon={Star} size="large" />  // ❌ Wrong - use "lg"
```

### Need Help?

1. Check [ICON_SYSTEM_GUIDE.md](./ICON_SYSTEM_GUIDE.md) for complete documentation
2. Look at [LandingPage.tsx](./src/components/LandingPage.tsx) for real examples
3. See [Icon.md](./src/components/Icon.md) for full API reference

---

## Real Example: Adding a Heart Icon

Let's walk through a complete example:

### 1. Find the icon on lucide.dev
Search "heart" → Found `Heart`

### 2. Add to exports
```tsx
// src/lib/icons.tsx
export {
  // ... existing ...
  Heart,  // New!
} from 'lucide-react';
```

### 3. Use it
```tsx
// src/components/FavoriteButton.tsx
import { Icon } from '@/components/Icon';
import { Heart } from '@/lib/icons';

export const FavoriteButton = () => {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <button 
      onClick={() => setIsFavorite(!isFavorite)}
      className="p-2 rounded-lg hover:bg-gray-100"
    >
      <Icon 
        icon={Heart}
        size="md"
        className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}
        label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      />
    </button>
  );
};
```

### 4. Test
```bash
npm run dev
```

Click the button - heart should toggle color!

---

## Available Colors

```tsx
color="primary"    // Brand purple
color="accent"     // Dark purple
color="success"    // Green
color="warning"    // Orange
color="error"      // Red
```

**OR use Tailwind classes:**

```tsx
className="text-blue-500 hover:text-blue-600"
```

---

## Next Steps

Once you're comfortable adding basic icons:

1. Read [ICON_SYSTEM_GUIDE.md](./ICON_SYSTEM_GUIDE.md) for advanced usage
2. Learn about accessibility best practices
3. Explore animation and transition options
4. Check out dark mode support

---

## Quick Reference Card

```tsx
// Semantic icon (standalone)
<Icon icon={Name} size="md" label="Description" />

// Decorative icon (with text)
<Icon icon={Name} size="sm" decorative />

// With color
<Icon icon={Name} size="lg" color="success" label="Description" />

// With custom styling
<Icon 
  icon={Name}
  size="xl"
  className="text-brand-primary hover:scale-110"
  label="Description"
/>
```

---

**That's it!** You're ready to add icons to the project. 🎉

For questions, refer to the [full guide](./ICON_SYSTEM_GUIDE.md) or check existing implementations in `src/components/LandingPage.tsx`.

