export type ToolCategory =
  | "image"
  | "pdf"
  | "unit"
  | "text"
  | "math"
  | "color"
  | "dev"
  | "productivity";

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
    id: "photobooth",
    slug: "photobooth",
    icon: "Camera",
    category: "image",
    createdAt: "2026-08-16",
    popular: true,
  },
  {
    id: "twibbon",
    slug: "twibbon",
    icon: "Frame",
    category: "image",
    createdAt: "2026-08-16",
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
    id: "image-converter",
    slug: "image-converter",
    icon: "ImageIcon",
    category: "image",
    createdAt: "2026-05-10",
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
    id: "watermark",
    slug: "watermark",
    icon: "BookmarkCheck",
    category: "image",
    createdAt: "2026-05-10",
    popular: true,
  },
  {
    id: "image-draw",
    slug: "draw-on-image",
    icon: "Brush",
    category: "image",
    createdAt: "2026-05-10",
  },
  {
    id: "remove-bg",
    slug: "remove-bg",
    icon: "Eraser",
    category: "image",
    createdAt: "2026-08-16",
    featured: true,
    popular: true,
  },
  {
    id: "color-picker-image",
    slug: "color-picker-image",
    icon: "Pipette",
    category: "image",
    createdAt: "2026-08-16",
  },
  {
    id: "svg-tracer",
    slug: "svg-tracer",
    icon: "PenTool",
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
    id: "favicon-generator",
    slug: "favicon-generator",
    icon: "Star",
    category: "image",
    createdAt: "2026-08-18",
  },
  {
    id: "diagram-maker",
    slug: "diagram-maker",
    icon: "Workflow",
    category: "image",
    createdAt: "2026-08-18",
    featured: true,
    popular: true,
  },
  {
    id: "device-mockup",
    slug: "device-mockup",
    icon: "Smartphone",
    category: "image",
    createdAt: "2026-08-18",
    featured: true,
    popular: true,
  },
  {
    id: "qr-generator",
    slug: "qr-generator",
    icon: "QrCode",
    category: "image",
    createdAt: "2026-05-10",
    featured: true,
    popular: true,
  },
  {
    id: "qr-scanner",
    slug: "qr-scanner",
    icon: "ScanQrCode",
    category: "image",
    createdAt: "2026-08-16",
  },
  {
    id: "barcode-generator",
    slug: "barcode-generator",
    icon: "Barcode",
    category: "image",
    createdAt: "2026-08-18",
  },

  // --- KATEGORI: PDF ---
  {
    id: "merge-pdf",
    slug: "merge-pdf",
    icon: "Merge",
    category: "pdf",
    createdAt: "2026-08-18",
    featured: true,
    popular: true,
  },
  {
    id: "split-pdf",
    slug: "split-pdf",
    icon: "Scissors",
    category: "pdf",
    createdAt: "2026-08-18",
  },
  {
    id: "image-to-pdf",
    slug: "image-to-pdf",
    icon: "FileOutput",
    category: "pdf",
    createdAt: "2026-08-18",
    popular: true,
  },
  {
    id: "pdf-editor",
    slug: "pdf-editor",
    icon: "FilePenLine",
    category: "pdf",
    createdAt: "2026-08-18",
    featured: true,
    popular: true,
  },

  // --- KATEGORI: UNIT ---
  {
    id: "unit-converter",
    slug: "unit-converter",
    icon: "Ruler",
    category: "unit",
    createdAt: "2026-05-10",
  },
  {
    id: "data-converter",
    slug: "data-converter",
    icon: "Cpu",
    category: "unit",
    createdAt: "2026-05-10",
  },
  {
    id: "physics-converter",
    slug: "physics-converter",
    icon: "Atom",
    category: "unit",
    createdAt: "2026-08-18",
  },

  // --- KATEGORI: TEXT ---
  {
    id: "word-counter",
    slug: "word-counter",
    icon: "AlignLeft",
    category: "text",
    createdAt: "2026-08-16",
  },
  {
    id: "case-converter",
    slug: "case-converter",
    icon: "Type",
    category: "text",
    createdAt: "2026-08-16",
  },
  {
    id: "slug-generator",
    slug: "slug-generator",
    icon: "Link",
    category: "text",
    createdAt: "2026-08-18",
  },
  {
    id: "lorem-ipsum",
    slug: "lorem-ipsum",
    icon: "Pilcrow",
    category: "text",
    createdAt: "2026-08-17",
  },
  {
    id: "text-diff",
    slug: "text-diff",
    icon: "GitCompare",
    category: "text",
    createdAt: "2026-08-18",
  },
  {
    id: "markdown-previewer",
    slug: "markdown-previewer",
    icon: "FileCode",
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
    id: "discount-calculator",
    slug: "discount-calculator",
    icon: "BadgePercent",
    category: "math",
    createdAt: "2026-08-18",
  },
  {
    id: "tax-calculator",
    slug: "tax-calculator",
    icon: "Landmark",
    category: "math",
    createdAt: "2026-08-18",
  },
  {
    id: "tip-calculator",
    slug: "tip-calculator",
    icon: "Receipt",
    category: "math",
    createdAt: "2026-08-18",
  },
  {
    id: "split-bill",
    slug: "split-bill",
    icon: "Split",
    category: "math",
    createdAt: "2026-08-19",
    featured: true,
    popular: true,
  },
  {
    id: "hpp-calculator",
    slug: "hpp-calculator",
    icon: "Factory",
    category: "math",
    createdAt: "2026-08-18",
    featured: true,
    popular: true,
  },
  {
    id: "profit-margin-calculator",
    slug: "profit-margin-calculator",
    icon: "TrendingUp",
    category: "math",
    createdAt: "2026-08-18",
    popular: true,
  },
  {
    id: "break-even-calculator",
    slug: "break-even-calculator",
    icon: "Target",
    category: "math",
    createdAt: "2026-08-18",
  },
  {
    id: "zakat-calculator",
    slug: "zakat-calculator",
    icon: "HandCoins",
    category: "math",
    createdAt: "2026-08-18",
    featured: true,
    popular: true,
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
    id: "age-calculator",
    slug: "age-calculator",
    icon: "Cake",
    category: "math",
    createdAt: "2026-08-17",
  },
  {
    id: "date-difference-calculator",
    slug: "date-difference-calculator",
    icon: "CalendarDays",
    category: "math",
    createdAt: "2026-08-18",
  },
  {
    id: "random-picker",
    slug: "random-picker",
    icon: "Dices",
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
    id: "password-generator",
    slug: "password-generator",
    icon: "KeyRound",
    category: "dev",
    createdAt: "2026-08-16",
    popular: true,
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
    id: "meta-tag-generator",
    slug: "meta-tag-generator",
    icon: "Tag",
    category: "dev",
    createdAt: "2026-08-18",
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
    id: "url-encoder",
    slug: "url-encoder",
    icon: "Link2",
    category: "dev",
    createdAt: "2026-08-17",
  },
  {
    id: "jwt-decoder",
    slug: "jwt-decoder",
    icon: "Unlock",
    category: "dev",
    createdAt: "2026-08-18",
  },
  {
    id: "hash-generator",
    slug: "hash-generator",
    icon: "Hash",
    category: "dev",
    createdAt: "2026-08-16",
  },
  {
    id: "json-formatter",
    slug: "json-formatter",
    icon: "Code2",
    category: "dev",
    createdAt: "2026-08-16",
  },
  {
    id: "csv-json-converter",
    slug: "csv-json-converter",
    icon: "Table2",
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
    id: "timestamp-converter",
    slug: "timestamp-converter",
    icon: "Clock",
    category: "dev",
    createdAt: "2026-08-17",
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
    id: "html-viewer",
    slug: "html-viewer",
    icon: "AppWindow",
    category: "dev",
    createdAt: "2026-08-18",
    popular: true,
  },
  {
    id: "code-to-image",
    slug: "code-to-image",
    icon: "SquareCode",
    category: "dev",
    createdAt: "2026-08-18",
    featured: true,
    popular: true,
  },

  // --- KATEGORI: PRODUCTIVITY ---
  {
    id: "schedule-maker",
    slug: "schedule-maker",
    icon: "CalendarClock",
    category: "productivity",
    createdAt: "2026-08-19",
    featured: true,
    popular: true,
  },
  {
    id: "broadcast-maker",
    slug: "broadcast-maker",
    icon: "Megaphone",
    category: "productivity",
    createdAt: "2026-08-19",
    featured: true,
    popular: true,
  },
  {
    id: "voice-to-text",
    slug: "voice-to-text",
    icon: "Mic",
    category: "productivity",
    createdAt: "2026-08-19",
    featured: true,
    popular: true,
  },
  {
    id: "text-to-voice",
    slug: "text-to-voice",
    icon: "Volume2",
    category: "productivity",
    createdAt: "2026-08-19",
    featured: true,
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
  pdf: { labelKey: "category.pdf", icon: "FileText" },
  unit: { labelKey: "category.unit", icon: "Ruler" },
  text: { labelKey: "category.text", icon: "Type" },
  math: { labelKey: "category.math", icon: "Calculator" },
  color: { labelKey: "category.color", icon: "Palette" },
  dev: { labelKey: "category.dev", icon: "Code2" },
  productivity: { labelKey: "category.productivity", icon: "Workflow" },
};

export const CATEGORY_ORDER: ToolCategory[] = [
  "image",
  "pdf",
  "productivity",
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
