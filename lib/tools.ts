import { CONVERTER_EDGES } from "@/lib/converter-formats";
import { HUB_MODES } from "@/lib/hubs";

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
    id: "converter",
    slug: "converter",
    icon: "ArrowRightLeft",
    category: "productivity",
    createdAt: "2026-09-24",
    popular: true,
  },
  {
    id: "image-toolkit",
    slug: "image-toolkit",
    icon: "Scaling",
    category: "image",
    createdAt: "2026-09-24",
    popular: true,
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
    id: "code-generator",
    slug: "code-generator",
    icon: "QrCode",
    category: "image",
    createdAt: "2026-09-24",
    featured: true,
    popular: true,
  },
  {
    id: "wave-generator",
    slug: "wave-generator",
    icon: "Waves",
    category: "image",
    createdAt: "2026-08-19",
    featured: true,
    popular: true,
  },

  // --- KATEGORI: PDF ---
  {
    id: "pdf-toolkit",
    slug: "pdf-toolkit",
    icon: "Merge",
    category: "pdf",
    createdAt: "2026-09-24",
    featured: true,
    popular: true,
  },

  // --- KATEGORI: UNIT ---
  {
    id: "unit-converter",
    slug: "unit-converter",
    icon: "Ruler",
    category: "unit",
    createdAt: "2026-09-24",
    popular: true,
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
    id: "text-tools",
    slug: "text-tools",
    icon: "Type",
    category: "text",
    createdAt: "2026-09-24",
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
    id: "finance-calculator",
    slug: "finance-calculator",
    icon: "BadgePercent",
    category: "math",
    createdAt: "2026-09-24",
    featured: true,
    popular: true,
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
    id: "date-calculator",
    slug: "date-calculator",
    icon: "CalendarDays",
    category: "math",
    createdAt: "2026-09-24",
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
    id: "random-generator",
    slug: "random-generator",
    icon: "KeyRound",
    category: "dev",
    createdAt: "2026-09-24",
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
    id: "encoder-decoder",
    slug: "encoder-decoder",
    icon: "Binary",
    category: "dev",
    createdAt: "2026-09-24",
    popular: true,
  },
  {
    id: "json-formatter",
    slug: "json-formatter",
    icon: "Code2",
    category: "dev",
    createdAt: "2026-08-16",
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

/** Popularity weight; drives sidebar/group order. */
const score = (t: Tool) => (t.popular ? 2 : 0) + (t.featured ? 1 : 0);

// Most popular first (stable, so ties keep authoring order); Photobooth is always pinned on top.
TOOLS.sort((a, b) => Number(b.id === "photobooth") - Number(a.id === "photobooth") || score(b) - score(a));

/**
 * Features counted for a tool: each conversion pair of the Universal Converter
 * and each mode of a hub is one feature; a standalone tool is one.
 */
export function getToolFeatureCount(tool: Tool): number {
  if (tool.id === "converter") return CONVERTER_EDGES.length;
  return HUB_MODES[tool.id]?.length ?? 1;
}

export const FEATURE_COUNT = TOOLS.reduce((n, tool) => n + getToolFeatureCount(tool), 0);

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

/** Categories ranked by total tool popularity; the one holding Photobooth stays first. */
export const CATEGORY_ORDER: ToolCategory[] = (Object.keys(CATEGORIES) as ToolCategory[])
  .map((cat) => {
    const tools = TOOLS.filter((t) => t.category === cat);
    return { cat, rank: tools.some((t) => t.id === "photobooth") ? Infinity : tools.reduce((n, t) => n + score(t), 0) };
  })
  .sort((x, y) => y.rank - x.rank)
  .map((x) => x.cat);

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return TOOLS.filter((t) => t.category === category);
}

export function getFeaturedTools(): Tool[] {
  return TOOLS.filter((t) => t.featured);
}

export function getPopularTools(): Tool[] {
  return TOOLS.filter((t) => t.popular);
}
