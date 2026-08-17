# Mojepict - Free Web Tools

A collection of fast, free web tools. Most run entirely in your browser; a
couple (Remove Background, Image Compressor) offer an optional "AI Enhanced"
mode backed by a third-party API. Always free, no accounts.

## Stack

- **Next.js** (App Router)
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

### Environment variables (optional)

Copy `.env.example` to `.env.local` and fill in the keys for the tools you
want to run in "AI Enhanced" mode. Every tool works with zero configuration
using local, in-browser processing; these just unlock the optional API path.

| Variable             | Unlocks                            | Get a key                                            |
| --------------------- | ----------------------------------- | ----------------------------------------------------- |
| `REMOVE_BG_API_KEY`  | Remove Background → AI Enhanced    | [remove.bg/api](https://www.remove.bg/api)             |
| `TINIFY_API_KEY`     | Image Compressor → AI Enhanced     | [tinypng.com/developers](https://tinypng.com/developers) |

Keys are only ever read server-side (in `app/api/*/route.ts`) and are never
sent to the browser.

## Tools Included

| Category  | Tools                                                                                       |
| --------- | -------------------------------------------------------------------------------------------- |
| Image     | Remove Background, Image Converter, Image Resizer, Image Compressor, Image Cropper, Image Splitter, Draw on Image, Color Picker from Image, Metadata Viewer, SVG Tracer, Watermark, Twibbon Maker, Web Photobooth, QR Code Generator, QR Code Viewer |
| Unit      | Unit Converter, Data Storage Converter                                                       |
| Text      | Case Converter                                                                                |
| Color     | Color Picker                                                                                   |
| Developer | JSON Formatter                                                                                 |

## Adding a New Tool

1. Add an entry to `lib/tools.ts` (including a real `createdAt` date, since the
   "New" badge is computed from it, not set manually)
2. Add name/description strings to `lib/i18n/en.ts` and `lib/i18n/id.ts`
3. Create `app/(tools)/[slug]/page.tsx`, wrap it with `<ToolShell>`, and build
   the layout from the shared `components/tools/` primitives
   (`ToolWorkspace`, `Dropzone`, `ImageZoomPreview`, `ToolActionBar`)

## i18n

Supports **English** and **Bahasa Indonesia**. Language switcher in the top navbar.  
All strings live in `lib/i18n/en.ts` and `lib/i18n/id.ts`.

## Features

- ⌘K Command Palette: search all tools instantly
- Dark / Light mode toggle
- Collapsible sidebar (desktop) + Sheet drawer (mobile)
- Most tools run entirely in the browser; Remove Background and Image
  Compressor offer an optional AI Enhanced mode via a third-party API
