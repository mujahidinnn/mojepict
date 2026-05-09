# Mojepict — Free Web Tools

A collection of fast, browser-only web tools. No uploads, no accounts, always free.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** + CSS variables (Slate palette)
- **shadcn/ui** components
- **Lucide React** icons
- **next-themes** for dark mode
- **Geist** font (Vercel)

## Getting Started

```bash
nvm use
yarn install
yarn run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tools Included

| Tool             | Route                     |
| ---------------- | ------------------------- |
| Image Converter  | `/tools/image-converter`  |
| Image Resizer    | `/tools/image-resizer`    |
| Image Compressor | `/tools/image-compressor` |
| Unit Converter   | `/tools/unit-converter`   |
| Color Picker     | `/tools/color-picker`     |

## Adding a New Tool

1. Add an entry to `lib/tools.ts`
2. Add name/description strings to `lib/i18n/en.ts` and `lib/i18n/id.ts`
3. Create `app/(tools)/[slug]/page.tsx` — wrap with `<ToolShell>`

## i18n

Supports **English** and **Bahasa Indonesia**. Language switcher in the top navbar.  
All strings live in `lib/i18n/en.ts` and `lib/i18n/id.ts`.

## Features

- ⌘K Command Palette — search all tools instantly
- Dark / Light mode toggle
- Collapsible sidebar (desktop) + Sheet drawer (mobile)
- All conversions run 100% in the browser
