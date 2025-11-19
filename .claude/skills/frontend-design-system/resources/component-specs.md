# Component Specifications

Detailed specifications for core UI components. Use these exact values for consistency.

---

## Button Component

### Variants

#### Primary Button
**Purpose:** Main action, high emphasis

```
Background:    Primary (#0066CC)
Text:          White (#FFFFFF)
Border:        None
Border Radius: 6px
Font Weight:   500 (medium)
Shadow:        0 1px 2px rgba(0,0,0,0.05)

States:
- Default:  bg-primary text-white
- Hover:    bg-primary-dark (#0052A3), cursor pointer
- Active:   bg-#1E40AF, scale(0.98)
- Focus:    ring-2 ring-primary ring-offset-2
- Disabled: bg-gray-300, text-gray-500, cursor-not-allowed, opacity-60
- Loading:  bg-primary, show spinner, disabled interaction
```

#### Secondary Button
**Purpose:** Alternative action, medium emphasis

```
Background:    Gray 100 (#F3F4F6)
Text:          Gray 900 (#111827)
Border:        1px solid Gray 200 (#E5E7EB)
Border Radius: 6px
Font Weight:   500

States:
- Default:  bg-gray-100 text-gray-900 border-gray-200
- Hover:    bg-gray-200
- Active:   bg-gray-300
- Focus:    ring-2 ring-gray-400
- Disabled: bg-gray-100 text-gray-400 opacity-60
```

#### Ghost Button
**Purpose:** Subtle action, low emphasis

```
Background:    Transparent
Text:          Primary (#0066CC)
Border:        None
Border Radius: 6px
Font Weight:   500

States:
- Default:  bg-transparent text-primary
- Hover:    bg-primary-light (#E6F2FF)
- Active:   bg-primary-light opacity-80
- Focus:    ring-2 ring-primary
- Disabled: text-gray-400 opacity-60
```

#### Destructive Button
**Purpose:** Dangerous or irreversible action

```
Background:    Error (#EF4444)
Text:          White
Border:        None
Border Radius: 6px
Font Weight:   500

States:
- Default:  bg-error text-white
- Hover:    bg-#DC2626 (darker red)
- Active:   bg-#B91C1C
- Focus:    ring-2 ring-error
- Disabled: bg-gray-300 text-gray-500 opacity-60
```

### Sizes

| Size | Padding | Font Size | Height | Use Case |
|------|---------|-----------|--------|----------|
| **sm** | 8px 16px | 14px | 32px | Compact spaces, secondary actions |
| **md** | 12px 24px | 16px | 40px | **Default**, most buttons |
| **lg** | 16px 32px | 18px | 48px | Primary CTAs, hero sections |

### Icon Buttons

**Square (icon only):**
```
Size sm: 32x32px, icon 16px
Size md: 40x40px, icon 20px
Size lg: 48x48px, icon 24px
Padding: Equal on all sides
Border Radius: 6px (sm/md), 8px (lg)
```

**With Icon + Text:**
```
Icon position: left or right
Icon spacing: sm (8px) from text
Icon size: 16px (sm), 20px (md), 24px (lg)
```

### Loading State

```
Spinner:
- Size: 16px (sm), 20px (md), 24px (lg)
- Color: matches text color
- Animation: spin 1s linear infinite
- Position: replace icon or show before text

Text:
- Keep original text or show "Loading..."
- Disable button interaction
- Maintain button size (no layout shift)
```

### Accessibility

```typescript
// Required attributes
<button
  type="button"              // Explicit type
  disabled={isDisabled}      // Native disabled state
  aria-disabled={isDisabled} // ARIA for custom styling
  aria-label="Descriptive text" // For icon-only buttons
  aria-busy={isLoading}      // During loading state
>
```

**Keyboard:**
- Enter/Space: Activate button
- Tab: Focus navigation
- Escape: Cancel (if in modal/dialog)

**Touch Targets:**
- Minimum 44x44px (use lg size or add padding)
- Sufficient spacing between adjacent buttons (md gap min)

### Implementation Example

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  onClick?: () => void;
}

// Usage:
<Button variant="primary" size="md" icon={<PlusIcon />}>
  Add Item
</Button>
```

---

## Input / Form Field Component

### Default Specification

```
Height:         40px (fixed for md size)
Padding:        8px 12px (sm md)
Border:         1px solid Gray 200 (#E5E7EB)
Border Radius:  6px
Background:     White (#FFFFFF)
Font Size:      16px (Body)
Font Weight:    400
Placeholder:    Gray 300 (#D1D5DB)
Text Color:     Gray 900 (#111827)
```

### States

#### Default (Unfocused)
```
border-gray-200
bg-white
placeholder-gray-300
text-gray-900
```

#### Focus
```
border-primary (2px instead of 1px)
ring-2 ring-primary ring-offset-1
outline-none
bg-white
```

#### Error
```
border-error (1px solid #EF4444)
bg-red-50 (#FEF2F2)
text-gray-900

Error message:
- Font size: 12px (Label)
- Color: Error (#EF4444)
- Margin top: sm (8px)
- Icon: optional error icon
```

#### Success (Valid)
```
border-success (1px solid #10B981)
bg-white
Icon: optional green checkmark (right side)
```

#### Disabled
```
bg-gray-50 (#F9FAFB)
border-gray-200
text-gray-500
cursor-not-allowed
opacity-70
placeholder-gray-400
```

### Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| **sm** | 32px | 6px 10px | 14px |
| **md** | 40px | 8px 12px | 16px (default) |
| **lg** | 48px | 12px 16px | 18px |

### Label

```
Font Size:      14px (Body Small)
Font Weight:    500 (medium)
Color:          Gray 900
Margin Bottom:  sm (8px)
Required:       show asterisk (*) in Error color

// With required indicator:
<label>
  Email <span className="text-error">*</span>
</label>
```

### Helper Text

```
Font Size:      12px (Label)
Color:          Gray 500
Margin Top:     sm (8px)
Icon:           optional info icon
```

### Input with Icon

**Left Icon:**
```
Padding left: 36px (to make room for icon)
Icon position: absolute, left 12px, centered vertically
Icon size: 16px (sm), 20px (md), 24px (lg)
Icon color: Gray 500
```

**Right Icon:**
```
Padding right: 36px
Icon position: absolute, right 12px, centered vertically
Use for: clear button, validation status, show/hide password
```

### Input Types

#### Text / Email / URL
```
Standard input spec
Type-specific validation
Error messages below input
```

#### Password
```
Type: password (masked)
Toggle visibility icon: right side
Icon: eye (show) / eye-off (hide)
Strength indicator: optional, below input
```

#### Search
```
Search icon: left side
Clear button: right side (when filled)
Placeholder: "Search..."
Border radius: 20px (pill shape) optional
```

#### Textarea
```
Min height: 80px (5 rows)
Max height: 300px (optional)
Resize: vertical (CSS resize: vertical)
Padding: 12px (md)
Line height: 1.5
Font: inherit from input
```

#### Number
```
Type: number
Spinner buttons: show on focus (native)
Min/max: enforce with validation
Step: define increment (e.g., 0.01 for currency)
```

### Accessibility

```typescript
<div className="form-group">
  <label htmlFor="email" className="required">
    Email
  </label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : "email-hint"}
  />
  {hasError && (
    <p id="email-error" className="error-message">
      Please enter a valid email
    </p>
  )}
  {!hasError && (
    <p id="email-hint" className="helper-text">
      We'll never share your email
    </p>
  )}
</div>
```

---

## Card Component

### Default Specification

```
Background:     White (#FFFFFF)
Border:         1px solid Gray 200 (#E5E7EB)
Border Radius:  8px
Padding:        lg (24px)
Box Shadow:     0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
```

### States

#### Default (Static)
```
bg-white
border-gray-200
shadow-sm (subtle)
```

#### Hover (Interactive cards)
```
shadow-md: 0 4px 12px rgba(0,0,0,0.15)
border-gray-300 (slightly darker)
transform: translateY(-2px)
transition: all 200ms ease
cursor: pointer
```

#### Active/Pressed
```
shadow-sm (reduced)
transform: translateY(0)
```

#### Focus (keyboard nav)
```
ring-2 ring-primary
outline-none
```

### Variants

#### Basic Card
```
Padding: lg (24px)
Border: 1px Gray 200
No header/footer distinction
```

#### Card with Header
```
Header:
- Padding: lg (24px)
- Border bottom: 1px Gray 200
- Background: Gray 50 (optional)
- Font: Heading 3 (24px, 600 weight)

Body:
- Padding: lg (24px)

Footer (optional):
- Padding: md (16px)
- Border top: 1px Gray 200
- Background: Gray 50
- Actions: right-aligned buttons
```

#### Compact Card
```
Padding: md (16px)
Border radius: 6px
Shadow: minimal or none
Use: dense layouts, mobile views
```

### Card Layouts

#### Vertical Card (Image top)
```
Structure:
├─ Image (full width, top)
│  ├─ Height: 200px (fixed or aspect ratio 16:9)
│  └─ Border radius: 8px 8px 0 0
├─ Content (padding: lg)
│  ├─ Title: Heading 3
│  ├─ Description: Body Small
│  └─ Metadata: Label (12px)
└─ Footer (padding: md)
   └─ Action buttons

Image margin: none (flush with card edge top)
Title margin bottom: md (16px)
Description margin bottom: lg (24px)
```

#### Horizontal Card (Image left)
```
Layout: flex row
Image: 
- Width: 200px (fixed) or 40% (flexible)
- Height: 100%
- Border radius: 8px 0 0 8px
- Object fit: cover

Content:
- Flex: 1
- Padding: lg (24px)
```

### Accessibility

```typescript
// Interactive card
<article
  role="article"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  className="card-interactive"
>
  <h3>{title}</h3>
  <p>{description}</p>
</article>

// Link card (entire card clickable)
<article className="card">
  <a href={url} className="card-link-overlay">
    <h3>{title}</h3>
    <p>{description}</p>
  </a>
</article>
```

---

## Badge Component

### Default Specification

```
Padding:        4px 12px
Font Size:      12px (Label)
Font Weight:    500 (medium)
Border Radius:  12px (pill-shaped)
Display:        inline-flex
Align Items:    center
Text Transform: none (respect original case)
```

### Variants

#### Primary Badge
```
Background: Primary Light (#E6F2FF)
Text:       Primary (#0066CC)
Border:     none
```

#### Success Badge
```
Background: #D1FAE5 (light green)
Text:       Success (#10B981)
Border:     none
```

#### Warning Badge
```
Background: #FEF3C7 (light yellow)
Text:       Warning (#F59E0B)
Border:     none
```

#### Error Badge
```
Background: #FEE2E2 (light red)
Text:       Error (#EF4444)
Border:     none
```

#### Info Badge
```
Background: #DBEAFE (light blue)
Text:       Info (#3B82F6)
Border:     none
```

#### Neutral Badge
```
Background: Gray 100 (#F3F4F6)
Text:       Gray 700 (#374151)
Border:     none
```

### Sizes

| Size | Padding | Font Size | Height |
|------|---------|-----------|--------|
| **sm** | 2px 8px | 11px | 20px |
| **md** | 4px 12px | 12px | 24px (default) |
| **lg** | 6px 16px | 14px | 28px |

### Badge with Icon

```
Icon position: left of text
Icon size: 12px (sm), 14px (md), 16px (lg)
Icon spacing: 4px from text
Icon color: matches text color
```

### Badge with Dot

```
Dot size: 6px (circle)
Dot position: left of text
Dot spacing: 6px from text
Dot color: matches text color
```

### Badge with Close

```
Close icon: right of text
Close icon size: 14px
Close spacing: 4px from text
Close hover: darker shade
Close action: remove badge
```

### Accessibility

```typescript
// Status badge
<span
  className="badge-success"
  role="status"
  aria-label="Active status"
>
  Active
</span>

// Count badge
<span
  className="badge-primary"
  aria-label="3 notifications"
>
  3
</span>

// Dismissible badge
<span className="badge-neutral">
  Tag Name
  <button
    aria-label="Remove tag"
    onClick={handleRemove}
  >
    ×
  </button>
</span>
```

### Usage Context

**Status Indicators:**
```
Active → Success badge
Pending → Warning badge
Error → Error badge
Draft → Neutral badge
```

**Count Indicators:**
```
Notification count → Primary badge
Unread messages → Error badge (red)
Total items → Neutral badge
```

**Labels/Tags:**
```
Categories → Neutral badge
Priority → Warning/Error badge
Type → Info badge
```

---

## Component Combinations

### Button Group
```
Gap:           sm (8px) or none (attached)
Flex:          row
Align:         center

Attached buttons:
- Remove border radius between buttons
- First: rounded-l-md
- Last: rounded-r-md
- Middle: no border radius
- Shared borders: prevent double borders
```

### Input Group
```
Input + Button (search):
- Flex row
- Input: flex-1, rounded-r-none
- Button: rounded-l-none
- No gap
- Shared border

Input + Icon:
- Position relative wrapper
- Icon: absolute position
- Input: padding adjustment
```

### Card Grid
```
Grid columns: 3 (desktop), 2 (tablet), 1 (mobile)
Gap: lg (24px)
Card padding: lg (24px)
Auto-fit: minmax(300px, 1fr)
```

---

**Complete specifications. Use exact values for consistency across projects.**

**Version:** 1.0.0  
**Last Updated:** November 15, 2025

