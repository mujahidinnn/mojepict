import { unzipSync, strFromU8 } from "fflate";

export interface SlidePara {
  text: string;
  level: number;
}

export interface Slide {
  title: string;
  body: SlidePara[];
  images: string[];
}

const xml = (s: string) => new DOMParser().parseFromString(s, "application/xml");

/** Target paths of a .rels file, keyed by relationship id, resolved against `dir`. */
function rels(files: Record<string, Uint8Array>, relsPath: string, dir: string) {
  const out: Record<string, string> = {};
  const raw = files[relsPath];
  if (!raw) return out;
  for (const r of Array.from(xml(strFromU8(raw)).getElementsByTagName("Relationship"))) {
    const target = r.getAttribute("Target") ?? "";
    const parts = (target.startsWith("/") ? target.slice(1) : `${dir}/${target}`).split("/");
    const resolved: string[] = [];
    for (const p of parts) p === ".." ? resolved.pop() : p !== "." && resolved.push(p);
    out[r.getAttribute("Id") ?? ""] = resolved.join("/");
  }
  return out;
}

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  webp: "image/webp",
};

function dataUrl(bytes: Uint8Array, path: string) {
  const mime = MIME[path.split(".").pop()?.toLowerCase() ?? ""];
  if (!mime) return null; // emf/wmf etc. can't be shown in a browser
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${mime};base64,${btoa(bin)}`;
}

/** Extracts text (title + paragraphs) and raster images from each slide of a .pptx, in presentation order. */
export function parsePptx(buf: ArrayBuffer): Slide[] {
  const files = unzipSync(new Uint8Array(buf));
  const pres = files["ppt/presentation.xml"];
  if (!pres) throw new Error("not a pptx");
  const presRels = rels(files, "ppt/_rels/presentation.xml.rels", "ppt");
  const ids = Array.from(xml(strFromU8(pres)).getElementsByTagName("p:sldId")).map(
    (s) => presRels[s.getAttribute("r:id") ?? ""],
  );

  return ids.filter((p) => p && files[p]).map((path) => {
    const name = path.split("/").pop()!;
    const slideRels = rels(files, `ppt/slides/_rels/${name}.rels`, "ppt/slides");
    const doc = xml(strFromU8(files[path]));
    let title = "";
    const body: SlidePara[] = [];

    for (const sp of Array.from(doc.getElementsByTagName("p:sp"))) {
      const ph = sp.getElementsByTagName("p:ph")[0]?.getAttribute("type");
      const paras = Array.from(sp.getElementsByTagName("a:p"))
        .map((p) => ({
          text: Array.from(p.getElementsByTagName("a:t")).map((t) => t.textContent ?? "").join("").trim(),
          level: Number(p.getElementsByTagName("a:pPr")[0]?.getAttribute("lvl") ?? 0),
        }))
        .filter((p) => p.text);
      if (!title && (ph === "title" || ph === "ctrTitle")) title = paras.map((p) => p.text).join(" ");
      else body.push(...paras);
    }

    const images = Array.from(doc.getElementsByTagName("a:blip"))
      .map((b) => slideRels[b.getAttribute("r:embed") ?? ""])
      .filter((p) => p && files[p])
      .map((p) => dataUrl(files[p], p))
      .filter((u): u is string => !!u);

    return { title, body, images };
  });
}

export function slidesToMarkdown(slides: Slide[]): string {
  return slides
    .map((s, i) =>
      [`## ${s.title || `Slide ${i + 1}`}`, s.body.map((p) => `${"  ".repeat(p.level)}- ${p.text}`).join("\n")]
        .filter(Boolean)
        .join("\n\n"),
    )
    .join("\n\n---\n\n");
}

const stripInline = (s: string) =>
  s.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/(\*\*|__|\*|_|`)/g, "");

/** New slide at every `#`/`##` heading or `---` rule; list items keep their indent level. */
export function markdownToSlides(md: string): Slide[] {
  const slides: Slide[] = [];
  let cur = null as Slide | null;
  const next = (): Slide => {
    const s: Slide = { title: "", body: [], images: [] };
    slides.push(s);
    return s;
  };

  for (const line of md.split("\n")) {
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      cur = null;
      continue;
    }
    const h = line.match(/^(#{1,2})\s+(.*)/);
    if (h) {
      if (!cur || cur.title || cur.body.length) cur = next();
      cur.title = stripInline(h[2]).trim();
      continue;
    }
    const li = line.match(/^(\s*)(?:[-*+]|\d+[.)])\s+(.*)/);
    const text = stripInline(li ? li[2] : line.replace(/^#{3,6}\s+/, "")).trim();
    if (!text) continue;
    cur ??= next();
    cur.body.push({ text, level: li ? Math.min(Math.floor(li[1].length / 2), 4) : 0 });
  }
  return slides;
}
