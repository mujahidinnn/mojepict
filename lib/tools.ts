export type ToolCategory = "image" | "unit" | "text" | "math" | "color" | "dev";

export interface Tool {
  id: string;
  slug: string;
  icon: string;
  category: ToolCategory;
  /** Manual override only; for date-driven "new" status see getToolBadge(). */
  badge?: "beta";
  /** ISO date the tool shipped. Drives the "new" badge (see NEW_WINDOW_DAYS). */
  createdAt: string;
  featured?: boolean;
  /** Surfaced in the homepage "Popular" row. */
  popular?: boolean;
}

export const TOOLS: Tool[] = [
  // --- KATEGORI: IMAGE ---
  {
    id: "remove-bg",
    slug: "remove-bg",
    icon: "Eraser",
    category: "image",
    createdAt: "2026-08-16",
    popular: true,
  },
  {
    id: "image-converter",
    slug: "image-converter",
    icon: "ImageIcon",
    category: "image",
    createdAt: "2026-05-10",
    featured: true,
    popular: true,
  },
  {
    id: "image-resizer",
    slug: "image-resizer",
    icon: "Scaling",
    category: "image",
    createdAt: "2026-05-10",
    popular: true,
  },
  {
    id: "image-compressor",
    slug: "image-compressor",
    icon: "PackageOpen",
    category: "image",
    createdAt: "2026-05-10",
    popular: true,
  },
  {
    id: "image-cropper",
    slug: "image-cropper",
    icon: "Crop",
    category: "image",
    createdAt: "2026-05-10",
  },
  {
    id: "image-splitter",
    slug: "image-splitter",
    icon: "Grid3X3",
    category: "image",
    createdAt: "2026-08-16",
  },
  {
    id: "image-draw",
    slug: "draw-on-image",
    icon: "Brush",
    category: "image",
    createdAt: "2026-05-10",
  },
  {
    id: "color-picker-image",
    slug: "color-picker-image",
    icon: "Pipette",
    category: "image",
    createdAt: "2026-08-16",
  },
  {
    id: "metadata-viewer",
    slug: "metadata-viewer",
    icon: "ScanSearch",
    category: "image",
    createdAt: "2026-05-10",
  },
  {
    id: "svg-tracer",
    slug: "svg-tracer",
    icon: "PenTool",
    category: "image",
    createdAt: "2026-08-16",
  },
  {
    id: "watermark",
    slug: "watermark",
    icon: "BookmarkCheck",
    category: "image",
    createdAt: "2026-05-10",
    popular: true,
  },
  {
    id: "twibbon",
    slug: "twibbon",
    icon: "Frame",
    category: "image",
    createdAt: "2026-08-16",
  },
  {
    id: "photobooth",
    slug: "photobooth",
    icon: "Camera",
    category: "image",
    createdAt: "2026-08-16",
  },
  {
    id: "qr-generator",
    slug: "qr-generator",
    icon: "QrCode",
    category: "image",
    createdAt: "2026-05-10",
    popular: true,
  },
  {
    id: "qr-scanner",
    slug: "qr-scanner",
    icon: "ScanQrCode",
    category: "image",
    createdAt: "2026-08-16",
  },

  // --- KATEGORI: UNIT ---
  {
    id: "unit-converter",
    slug: "unit-converter",
    icon: "Ruler",
    category: "unit",
    createdAt: "2026-05-10",
    featured: true,
  },
  {
    id: "data-converter",
    slug: "data-converter",
    icon: "Cpu",
    category: "unit",
    createdAt: "2026-05-10",
    featured: true,
  },

  // --- KATEGORI: TEXT ---
  {
    id: "case-converter",
    slug: "case-converter",
    icon: "Type",
    category: "text",
    createdAt: "2026-08-16",
  },
  {
    id: "word-counter",
    slug: "word-counter",
    icon: "AlignLeft",
    category: "text",
    createdAt: "2026-08-16",
  },
  {
    id: "lorem-ipsum",
    slug: "lorem-ipsum",
    icon: "Pilcrow",
    category: "text",
    createdAt: "2026-08-17",
  },
  {
    id: "markdown-previewer",
    slug: "markdown-previewer",
    icon: "FileCode",
    category: "text",
    createdAt: "2026-08-18",
  },
  {
    id: "text-diff",
    slug: "text-diff",
    icon: "GitCompare",
    category: "text",
    createdAt: "2026-08-18",
  },

  // --- KATEGORI: MATH ---
  {
    id: "percentage-calculator",
    slug: "percentage-calculator",
    icon: "Percent",
    category: "math",
    createdAt: "2026-08-17",
    popular: true,
  },
  {
    id: "age-calculator",
    slug: "age-calculator",
    icon: "Cake",
    category: "math",
    createdAt: "2026-08-17",
  },
  {
    id: "bmi-calculator",
    slug: "bmi-calculator",
    icon: "HeartPulse",
    category: "math",
    createdAt: "2026-08-18",
    popular: true,
  },
  {
    id: "tip-calculator",
    slug: "tip-calculator",
    icon: "Receipt",
    category: "math",
    createdAt: "2026-08-18",
  },

  // --- KATEGORI: COLOR ---
  {
    id: "color-picker",
    slug: "color-picker",
    icon: "PaintbrushVertical",
    category: "color",
    createdAt: "2026-08-16",
  },
  {
    id: "color-palette",
    slug: "color-palette",
    icon: "SwatchBook",
    category: "color",
    createdAt: "2026-08-16",
    popular: true,
  },
  {
    id: "gradient-generator",
    slug: "gradient-generator",
    icon: "Blend",
    category: "color",
    createdAt: "2026-08-18",
    popular: true,
  },
  {
    id: "contrast-checker",
    slug: "contrast-checker",
    icon: "Contrast",
    category: "color",
    createdAt: "2026-08-18",
  },

  // --- KATEGORI: DEV ---
  {
    id: "json-formatter",
    slug: "json-formatter",
    icon: "Code2",
    category: "dev",
    createdAt: "2026-08-16",
  },
  {
    id: "base64-encoder",
    slug: "base64-encoder",
    icon: "Binary",
    category: "dev",
    createdAt: "2026-08-16",
    popular: true,
  },
  {
    id: "password-generator",
    slug: "password-generator",
    icon: "KeyRound",
    category: "dev",
    createdAt: "2026-08-16",
    popular: true,
  },
  {
    id: "hash-generator",
    slug: "hash-generator",
    icon: "Hash",
    category: "dev",
    createdAt: "2026-08-16",
  },
  {
    id: "timestamp-converter",
    slug: "timestamp-converter",
    icon: "Clock",
    category: "dev",
    createdAt: "2026-08-17",
    popular: true,
  },
  {
    id: "url-encoder",
    slug: "url-encoder",
    icon: "Link2",
    category: "dev",
    createdAt: "2026-08-17",
  },
  {
    id: "uuid-generator",
    slug: "uuid-generator",
    icon: "Fingerprint",
    category: "dev",
    createdAt: "2026-08-18",
    popular: true,
  },
  {
    id: "regex-tester",
    slug: "regex-tester",
    icon: "Regex",
    category: "dev",
    createdAt: "2026-08-18",
  },
  {
    id: "number-base-converter",
    slug: "number-base-converter",
    icon: "Binary",
    category: "dev",
    createdAt: "2026-08-18",
  },
  {
    id: "jwt-decoder",
    slug: "jwt-decoder",
    icon: "Unlock",
    category: "dev",
    createdAt: "2026-08-18",
  },
  {
    id: "html-viewer",
    slug: "html-viewer",
    icon: "AppWindow",
    category: "dev",
    createdAt: "2026-08-18",
    popular: true,
  },
];

/** A tool is "new" for this many days after its createdAt date. */
export const NEW_WINDOW_DAYS = 90;

/** Computes the badge to display: manual "beta" flags win, otherwise date-driven "new". */
export function getToolBadge(tool: Tool): "new" | "beta" | undefined {
  if (tool.badge === "beta") return "beta";
  const ageDays = (Date.now() - new Date(tool.createdAt).getTime()) / 86_400_000;
  return ageDays >= 0 && ageDays <= NEW_WINDOW_DAYS ? "new" : undefined;
}

export const CATEGORIES: Record<
  ToolCategory,
  { labelKey: string; icon: string }
> = {
  image: { labelKey: "category.image", icon: "Image" },
  unit: { labelKey: "category.unit", icon: "Ruler" },
  text: { labelKey: "category.text", icon: "Type" },
  math: { labelKey: "category.math", icon: "Calculator" },
  color: { labelKey: "category.color", icon: "Palette" },
  dev: { labelKey: "category.dev", icon: "Code2" },
};

export const CATEGORY_ORDER: ToolCategory[] = [
  "image",
  "unit",
  "color",
  "text",
  "math",
  "dev",
];

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return TOOLS.filter((t) => t.category === category);
}

export function getFeaturedTools(): Tool[] {
  return TOOLS.filter((t) => t.featured);
}

export function getPopularTools(): Tool[] {
  return TOOLS.filter((t) => t.popular);
}
