/**
 * Registry behind the Universal Converter. Every edge is one conversion
 * (from → to) and counts as one feature (see FEATURE_COUNT in lib/tools.ts).
 * Add a format or edge here and the hub's selects, auto-detect and the
 * feature counter all pick it up.
 */
export type ConverterModule =
  | "image-converter"
  | "image-to-pdf"
  | "svg-tracer"
  | "pdf-to-markdown"
  | "word-to-pdf"
  | "rich-text-to-markdown"
  | "csv-json-converter";

export const FORMATS = {
  png: { label: "PNG", ext: ["png"] },
  jpg: { label: "JPG", ext: ["jpg", "jpeg"] },
  webp: { label: "WebP", ext: ["webp"] },
  gif: { label: "GIF", ext: ["gif"] },
  bmp: { label: "BMP", ext: ["bmp"] },
  ico: { label: "ICO", ext: ["ico"] },
  svg: { label: "SVG", ext: ["svg"] },
  svgtrace: { label: "SVG (vector trace)", ext: [] as string[] },
  pdf: { label: "PDF", ext: ["pdf"] },
  docx: { label: "Word (DOCX)", ext: ["docx"] },
  csv: { label: "CSV", ext: ["csv"] },
  json: { label: "JSON", ext: ["json"] },
  md: { label: "Markdown", ext: [] as string[] },
  richtext: { label: "Rich text (editor)", ext: [] as string[] },
} as const;

export type FormatId = keyof typeof FORMATS;

export interface ConverterEdge {
  from: FormatId;
  to: FormatId;
  module: ConverterModule;
}

const edges: ConverterEdge[] = [];
const link = (from: FormatId[], to: FormatId[], module: ConverterModule) =>
  from.forEach((f) => to.forEach((t) => f !== t && edges.push({ from: f, to: t, module })));

link(["png", "jpg", "webp", "gif", "bmp", "ico", "svg"], ["jpg", "png", "webp", "ico", "svg"], "image-converter");
link(["png", "jpg", "webp", "gif", "bmp"], ["pdf"], "image-to-pdf");
link(["png", "jpg"], ["svgtrace"], "svg-tracer");
link(["pdf"], ["md"], "pdf-to-markdown");
link(["docx"], ["pdf"], "word-to-pdf");
link(["richtext"], ["md"], "rich-text-to-markdown");
link(["csv"], ["json"], "csv-json-converter");
link(["json"], ["csv"], "csv-json-converter");

export const CONVERTER_EDGES: readonly ConverterEdge[] = edges;

/** Old standalone slug → the conversion it now redirects to. */
export const CONVERTER_LEGACY: Record<string, { from: FormatId; to: FormatId }> = {
  "image-converter": { from: "png", to: "jpg" },
  "image-to-pdf": { from: "jpg", to: "pdf" },
  "svg-tracer": { from: "png", to: "svgtrace" },
  "pdf-to-markdown": { from: "pdf", to: "md" },
  "word-to-pdf": { from: "docx", to: "pdf" },
  "rich-text-to-markdown": { from: "richtext", to: "md" },
  "csv-json-converter": { from: "csv", to: "json" },
};

export const ALL_FROM = Array.from(new Set(edges.map((e) => e.from)));

export const findEdge = (from: FormatId, to: FormatId) =>
  edges.find((e) => e.from === from && e.to === to);

export const targetsOf = (from: FormatId) => edges.filter((e) => e.from === from).map((e) => e.to);

/** Format id from a file's extension, or null when unsupported. */
export function detectFormat(file: File): FormatId | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const hit = (Object.keys(FORMATS) as FormatId[]).find((id) =>
    (FORMATS[id].ext as readonly string[]).includes(ext),
  );
  return hit && ALL_FROM.includes(hit) ? hit : null;
}
