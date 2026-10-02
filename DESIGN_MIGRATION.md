# Design System Migration Guide

**Status:** In progress. See `DESIGN_SYSTEM.md` for full specifications.

**Already refactored:**
- ✅ `case-converter.tsx` — Two-column template
- ✅ `password-generator.tsx` — Single-column template

---

## Migration Steps (Per Component)

### Step 1: Identify Layout Type

**Two-column (input | output):**
- Image tools (crop, resize, compress, convert, etc.)
- Text converters (case, base64, url-encode, etc.)
- Calculators with input/results split
- PDF/image processors

**Single-column (full-width):**
- Password/hash/token generators
- Timestamp converters
- Small calculators (tip, discount, tax, etc.)
- QR/barcode generators
- Random pickers

### Step 2: Replace Layout Divs

**OLD (Two-column):**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div className="space-y-4">
    <Label className="text-xs font-bold uppercase...">Input</Label>
    ...
  </div>
  <div className="space-y-4">
    <Label>Output</Label>
    ...
  </div>
</div>
```

**NEW (Two-column):**
```tsx
<TwoColumnLayout>
  <InputSection label="Input">
    {/* content */}
  </InputSection>
  <OutputSection label="Output">
    {/* content */}
  </OutputSection>
</TwoColumnLayout>
```

**OLD (Single-column):**
```tsx
<div className="flex flex-col gap-6 max-w-xl">
```

**NEW (Single-column):**
```tsx
<div className="max-w-screen-lg flex flex-col gap-8">
```

### Step 3: Fix Spacing

**OLD spacing to REMOVE:**
- `gap-1`, `gap-2`, `gap-5`, `gap-7`
- `space-y-2`, `space-y-5`, `space-y-6`
- `p-2`, `p-3`, `p-5`, `p-7`
- `mt-`, `mb-`, `ml-`, `mr-` (use `gap-` instead)

**NEW spacing to USE:**
```
Vertical groups:  space-y-3 (12px), space-y-4 (16px)
Horizontal gaps:  gap-2 (8px), gap-3 (12px), gap-4 (16px), gap-6 (24px)
Padding:          p-4 (16px), p-6 (24px)
```

### Step 4: Fix Textareas

**OLD:**
```tsx
className="min-h-[400px] resize-none text-base p-4"
```

**NEW:**
```tsx
className="min-h-96 p-4 resize-none"
```

(min-h-96 = 384px = standard)

### Step 5: Fix Labels

**OLD:**
```tsx
<Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
  <Icon /> Label Text
</Label>
```

**NEW:**
```tsx
<Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
  Label Text
</Label>
```

(Icon moved to separate div if needed)

### Step 6: Fix Cards

**OLD:**
```tsx
<Card className="p-4 flex items-center justify-between bg-muted/20 border-2">
```

**NEW:**
```tsx
<Card className="p-6 flex items-center justify-between bg-muted/10">
```

Or use `ResultCard` component:

```tsx
<ResultCard
  label="Converter Name"
  content={result}
  onCopy={copyResult}
  disabled={!result}
/>
```

### Step 7: Fix Buttons

**OLD:**
```tsx
<Button variant="ghost" size="sm">
<Button size="icon" variant="secondary">
```

**NEW:**
```tsx
<Button variant="ghost" size="sm" className="h-8 px-2">  {/* mini */}
<Button size="icon" className="h-9 w-9">               {/* default */}
<Button className="w-full h-10">                       {/* full-width */}
```

No `size="lg"` or inconsistent heights.

### Step 8: Test Responsive

- Desktop: Two columns if applicable
- Tablet (768px): Check if layout breaks
- Mobile (< 640px): Single column

Run:
```bash
npm run dev
# Test at 375px, 768px, 1024px widths
```

---

## Component Checklist

Copy-paste this checklist for each component:

### [ ] Component Name

- [ ] Import `ToolTemplates` if needed
- [ ] Identify: Two-column or single-column?
- [ ] Replace layout divs
- [ ] Fix spacing (no `gap-1`, `gap-5`, `space-y-2`, etc.)
- [ ] Fix textarea: `min-h-96 p-4 resize-none`
- [ ] Fix labels: `text-xs font-semibold text-muted-foreground`
- [ ] Fix cards: `p-6` and use `ResultCard` if applicable
- [ ] Fix buttons: `h-8 px-2` for small, `h-9 w-9` for icon
- [ ] No custom widths (use `max-w-screen-lg` or grid)
- [ ] Test responsive layout
- [ ] Run: `npm run build` (no errors)

---

## Two-Column Tools (High Priority)

Apply to all text/image converters:

1. base64-encoder
2. url-encoder
3. jwt-decoder
4. rich-text-to-markdown
5. data-converter
6. csv-json-converter
7. hash-generator
8. image-converter
9. image-compressor
10. image-cropper
11. image-resizer
12. image-splitter
13. image-to-pdf
14. merge-pdf
15. split-pdf
16. pdf-editor
17. word-to-pdf

---

## Single-Column Tools (Medium Priority)

Apply to calculators & generators:

1. age-calculator
2. break-even-calculator
3. discount-calculator
4. hpp-calculator
5. percentage-calculator
6. profit-margin-calculator
7. split-bill
8. tax-calculator
9. tip-calculator
10. unit-converter
11. barcode-generator
12. qr-generator
13. qr-scanner
14. uuid-generator
15. timestamp-converter
16. random-picker
17. slug-generator
18. number-base-converter
19. date-difference-calculator
20. lorem-ipsum
21. physics-converter
22. svg-tracer

---

## Migration Order

1. **Phase 1 (Critical):** Refactor 5 most-used tools
2. **Phase 2 (Important):** Complete two-column tools
3. **Phase 3 (Nice-to-have):** Complete single-column tools

---

## Validation

After refactoring, run:

```bash
# Type check
npx tsc --noEmit

# Build check
npm run build

# Visual: check each tool manually at desktop + mobile
```

---

## Notes

- All spacing uses **CSS variable scale** in Tailwind config (no hardcodes)
- All colors use **design tokens** (dark/light mode auto-handled)
- No decorative divs or wrapper bloat
- Max-width is intentional: `max-w-screen-lg` keeps text readable
- Templates are reusable, extensible — add new types as needed
