export type ToolCategory = "image" | "unit" | "text" | "math" | "color" | "dev";

export interface Tool {
  id: string;
  slug: string;
  icon: string;
  category: ToolCategory;
  badge?: "new" | "beta";
  featured?: boolean;
}

export const TOOLS: Tool[] = [
  // --- KATEGORI: IMAGE ---
  {
    id: "remove-bg",
    slug: "remove-bg",
    icon: "Eraser",
    category: "image",
    badge: "new",
  },
  {
    id: "image-converter",
    slug: "image-converter",
    icon: "ImageIcon",
    category: "image",
    featured: true,
  },
  {
    id: "image-resizer",
    slug: "image-resizer",
    icon: "Scaling",
    category: "image",
  },
  {
    id: "image-compressor",
    slug: "image-compressor",
    icon: "PackageOpen",
    category: "image",
  },
  {
    id: "image-cropper",
    slug: "image-cropper",
    icon: "Crop",
    category: "image",
  },
  {
    id: "image-splitter",
    slug: "image-splitter",
    icon: "Grid3X3",
    category: "image",
    badge: "new",
  },
  {
    id: "image-draw",
    slug: "draw-on-image",
    icon: "Brush",
    category: "image",
  },
  {
    id: "color-picker-image",
    slug: "color-picker-image",
    icon: "Pipette",
    category: "image",
    badge: "new",
  },
  {
    id: "metadata-viewer",
    slug: "metadata-viewer",
    icon: "ScanSearch",
    category: "image",
  },
  {
    id: "svg-tracer",
    slug: "svg-tracer",
    icon: "PenTool",
    category: "image",
    badge: "new",
  },
  {
    id: "watermark",
    slug: "watermark",
    icon: "BookmarkCheck",
    category: "image",
  },
  {
    id: "twibbon",
    slug: "twibbon",
    icon: "Frame",
    category: "image",
    badge: "new",
  },
  {
    id: "photobooth",
    slug: "photobooth",
    icon: "Camera",
    category: "image",
    badge: "new",
  },
  {
    id: "qr-generator",
    slug: "qr-generator",
    icon: "QrCode",
    category: "image",
  },
  {
    id: "qr-scanner",
    slug: "qr-scanner",
    icon: "ScanQrCode",
    category: "image",
    badge: "new",
  },

  // --- KATEGORI: UNIT ---
  {
    id: "unit-converter",
    slug: "unit-converter",
    icon: "Ruler",
    category: "unit",
    featured: true,
  },
  {
    id: "data-converter",
    slug: "data-converter",
    icon: "Cpu",
    category: "unit",
    featured: true,
  },

  // --- KATEGORI: TEXT ---
  {
    id: "case-converter",
    slug: "case-converter",
    icon: "Type",
    category: "text",
    badge: "new",
  },

  // --- KATEGORI: COLOR ---
  {
    id: "color-picker",
    slug: "color-picker",
    icon: "PaintbrushVertical",
    category: "color",
    badge: "new",
  },

  // --- KATEGORI: DEV ---
  {
    id: "json-formatter",
    slug: "json-formatter",
    icon: "Code2",
    category: "dev",
    badge: "new",
  },
];

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
