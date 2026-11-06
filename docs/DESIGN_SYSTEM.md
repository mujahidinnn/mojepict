# Mojepict Design System – Anti-Slop Edition

**Prinsip:** Konsisten. Minimal. Measurable. No decorative bloat.

---

## Spacing Scale

**Use ONLY these values:**

| Token | Value | Usage |
|-------|-------|-------|
| xs | 0.5rem (8px) | Icon gaps, tight spacing |
| sm | 1rem (16px) | Labels-to-input, mini sections |
| md | 1.5rem (24px) | Section separation, default padding |
| lg | 2rem (32px) | Major layout gaps |
| xl | 2.5rem (40px) | Top-level sections |

**Implementation:**
- `gap-2` → xs
- `gap-3` → sm (default for components)
- `gap-4` → md (default for page sections)
- `gap-6` → lg
- `gap-8` → xl

**No custom spacing.** No `gap-1`, `gap-5`, `gap-7`.

---

## Typography Scale

| Context | Size | Weight | Line-height |
|---------|------|--------|-------------|
| Page title (h1) | 1.875rem (30px) | 600 | tight |
| Section header (h2) | 1.25rem (20px) | 600 | tight |
| Component title | 1rem (16px) | 600 | tight |
| Body/default | 0.875rem (14px) | 400 | relaxed |
| Small text/caption | 0.75rem (12px) | 400 | relaxed |
| Tiny (hints/metadata) | 0.625rem (10px) | 500 | tight |

**Tailwind classes:**
```
h1: text-[30px] font-semibold leading-tight
h2: text-[20px] font-semibold leading-tight
p: text-sm (14px) font-normal leading-relaxed
caption: text-xs (12px) font-normal leading-relaxed
hint: text-[10px] font-medium leading-tight
```

---

## Sizing Scale (Padding, Min-height)

| Token | Value | Usage |
|-------|-------|-------|
| Input height | 2.25rem (36px) | All inputs, selects, date pickers |
| Button height | Same as input | Consistency |
| Icon (small) | 16px | In buttons, inline |
| Icon (medium) | 20px | In cards, headers |
| Icon (large) | 24px | Page headers, tool icons |
| Card padding | 1.5rem (24px) | All cards |
| Container max-width | 56rem (896px) | Max width for reading text |

---

## Layout Patterns

### 1. Tool Page Layout
```tsx
<ToolShell>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Input section */}
    <div className="space-y-4">
      <Label>{label}</Label>
      <Textarea className="min-h-96" /> {/* 384px = 24 × 16 */}
    </div>

    {/* Output section */}
    <div className="space-y-4">
      <Label>{label}</Label>
      <div className="space-y-3">
        {/* Results */}
      </div>
    </div>
  </div>
</ToolShell>
```

### 2. Form Group Pattern
```tsx
<div className="space-y-3">
  <Label className="text-xs font-semibold text-muted-foreground">
    {label}
  </Label>
  <Input /> {/* or Textarea, Select, etc */}
</div>
```

### 3. Result Card Pattern
```tsx
<Card className="p-6 flex items-center justify-between bg-muted/10">
  <div className="flex-1 overflow-hidden">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm truncate">{content}</p>
  </div>
  <div className="flex gap-2 shrink-0">
    <Button size="sm" variant="ghost">{action}</Button>
  </div>
</Card>
```

---

## Color & Semantic Tokens

**Primary actions:** Use `bg-primary`, `text-primary-foreground`  
**Secondary/text actions:** Use `variant="outline"` or `variant="ghost"`  
**Destructive:** Use `variant="destructive"` only for delete/clear  
**States:** Disabled = `disabled={condition}` (handled by component)

---

## Component Rules

### Button
- Height: Always 36px (handled by `h-7 w-7` for icon-only, or default for text)
- Sizes: `size="sm"` (compact), default (regular), no `size="lg"`
- Gaps: `gap-2` inside button text + icon

### Input / Textarea
- Min-height for textarea: `min-h-96` (384px = 24 rows × 16px line-height)
- Padding: `p-4` (always 16px)
- Resize: `resize-none` on textarea (always)

### Card
- Padding: `p-6` (24px, always)
- Border: Use default, add `bg-muted/10` if subtle background needed
- Gap inside: `gap-3` or `gap-4`

### Label
- Size: `text-xs` (12px) for section headers, `text-sm` for form labels
- Color: `text-muted-foreground` for headers, default for form labels
- Weight: `font-semibold` for headers, `font-medium` for forms

### Badge
- Always `variant="secondary"`
- Size: `h-4 px-1.5 text-[10px]` (for tool cards)

---

## Icon Guidelines

| Context | Size | Color |
|---------|------|-------|
| Inline (button/input) | 16px | Current color |
| Card header | 20px | Current color |
| Page header (ToolShell) | 20px | Category color |
| Empty state | 32px | Muted |

Use `lucide-react` exclusively. Import only needed icons.

---

## Dark Mode

All colors via CSS variables in `globals.css`:
- Don't use `dark:` conditionals for colors
- Use only `dark:` for opacity, effects: `dark:opacity-20`, `dark:ring-white/10`

---

## Do's & Don'ts

✅ **Do:**
- Use the spacing scale exclusively
- Use named Tailwind sizes: `sm`, `md`, `lg`, `xl` (from spacing scale)
- Apply `space-y-3` or `space-y-4` to parent divs
- Use `max-w-screen-lg` for page width, never custom widths
- Group related inputs in `space-y-3` or `space-y-4`

❌ **Don't:**
- Use custom spacing: `gap-1`, `gap-5`, `gap-7`, `p-2`, `p-7`
- Use `dark:text-red-500`, `dark:bg-blue-500` (use CSS vars)
- Mix `flex gap-` and `space-y-` in same container
- Nest too many divs (max 2 wrapper levels)
- Use `mt-`, `mb-`, `ml-`, `mr-` instead of `gap-` or `space-y-`
- Hardcode colors outside the token system

---

## Refactoring Priority

**Phase 1** (Critical):
1. Textarea sizing consistency
2. Label styling consistency
3. Card padding consistency
4. Gap/spacing values

**Phase 2** (Important):
1. Button sizing
2. Icon sizing
3. Layout grid gaps
4. Form group patterns

**Phase 3** (Nice-to-have):
1. Animation timings
2. Border radius consistency
3. Responsive padding

---

## Implementation Checklist

For each component:
- [ ] Use spacing scale only
- [ ] Use `space-y-X` for vertical stacking
- [ ] Textarea: `min-h-96 p-4 resize-none`
- [ ] Labels: `text-xs` or `text-sm`, `font-semibold`/`font-medium`
- [ ] Cards: `p-6` always
- [ ] Results: Use card pattern with `flex items-center justify-between`
- [ ] No custom widths (use `max-w-screen-lg` or grid)
