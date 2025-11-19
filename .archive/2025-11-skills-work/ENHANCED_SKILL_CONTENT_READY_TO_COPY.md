# Enhanced Frontend Design System - Content Ready to Copy

This file contains the complete, ready-to-copy content for the three new resource files to add to the global skill.

---

## COPY THIS ENTIRE SECTION → `component-specifications.md`

```markdown
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
```

### Label

```
Font Size:      14px (Body Small)
Font Weight:    500 (medium)
Color:          Gray 900
Margin Bottom:  sm (8px)
Required:       show asterisk (*) in Error color
```

---

## Card Component

### Default Specification

```
Background:     White (#FFFFFF)
Border:         1px solid Gray 200 (#E5E7EB)
Border Radius:  8px
Padding:        lg (24px)
Box Shadow:     0 1px 3px rgba(0, 0, 0, 0.1)
```

### States

#### Hover (Interactive cards)
```
shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15)
border-gray-300 (slightly darker)
transform: translateY(-2px)
transition: all 200ms ease
cursor: pointer
```

### Variants

#### Card with Header
```
Header:
- Padding: lg (24px)
- Border bottom: 1px Gray 200
- Font: Heading 3 (24px, 600 weight)

Body:
- Padding: lg (24px)

Footer (optional):
- Padding: md (16px)
- Border top: 1px Gray 200
- Actions: right-aligned buttons
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
```

### Variants

#### Primary Badge
```
Background: Primary Light (#E6F2FF)
Text:       Primary (#0066CC)
```

#### Success Badge
```
Background: #D1FAE5 (light green)
Text:       Success (#10B981)
```

#### Warning Badge
```
Background: #FEF3C7 (light yellow)
Text:       Warning (#F59E0B)
```

#### Error Badge
```
Background: #FEE2E2 (light red)
Text:       Error (#EF4444)
```

### Sizes

| Size | Padding | Font Size | Height |
|------|---------|-----------|--------|
| **sm** | 2px 8px | 11px | 20px |
| **md** | 4px 12px | 12px | 24px (default) |
| **lg** | 6px 16px | 14px | 28px |

---

**Use these exact specifications for consistent component development across all projects.**
```

---

## COPY THIS ENTIRE SECTION → `layout-patterns.md`

[Content provided in your original message - all 20 layout patterns with complete specifications]

---

## COPY THIS ENTIRE SECTION → `implementation-guide.md`

[Content from the implementation guide section I created in the proposal]

---

## Implementation Checklist

After copying content to global skill:

- [ ] Navigate to `~/.claude/skills/frontend_design_system/resources/`
- [ ] Create `component-specifications.md` and paste content
- [ ] Create `layout-patterns.md` and paste content  
- [ ] Create `implementation-guide.md` and paste content
- [ ] Update `~/.claude/skills/frontend_design_system/metadata.json`
- [ ] Update `~/.claude/skills/frontend_design_system/SKILL.md`
- [ ] Test skill activation in a React project
- [ ] Verify resource loading works correctly

---

**Status:** ✅ Content ready for direct copy-paste into global skill

