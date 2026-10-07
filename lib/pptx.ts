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

const TITLE_TYPES = [0, 6]; // TextHeaderAtom: title, center title
const NOTES_TYPE = 2;

/**
 * Text-only reader for legacy binary .ppt (PowerPoint 97–2003, [MS-PPT]).
 * Placeholder text comes from the SlideListWithText; free text boxes from each slide's drawing.
 * ponytail: no images or indent levels; add StyleTextPropAtom/BLIP parsing if users need them.
 */
export async function parsePpt(buf: ArrayBuffer): Promise<Slide[]> {
  const { CFB } = await import("xlsx");
  const entry = CFB.find(CFB.read(new Uint8Array(buf), { type: "buffer" }), "PowerPoint Document");
  if (!entry?.content) throw new Error("not a ppt");
  const d = new Uint8Array(entry.content);
  const v = new DataView(d.buffer, d.byteOffset, d.byteLength);
  const u32 = (o: number) => v.getUint32(o, true);
  const utf16 = new TextDecoder("utf-16le");
  const latin1 = new TextDecoder("latin1");

  // Visits every record in [start, end) and descends into containers unless fn returns false.
  const walk = (start: number, end: number, fn: (type: number, inst: number, body: number, len: number) => boolean | void) => {
    for (let o = start; o + 8 <= end; ) {
      const verInst = v.getUint16(o, true);
      const type = v.getUint16(o + 2, true);
      const len = u32(o + 4);
      const body = o + 8;
      if (body + len > end) break;
      if (fn(type, verInst >> 4, body, len) !== false && (verInst & 0xf) === 0xf) walk(body, body + len, fn);
      o = body + len;
    }
  };

  const paras = (type: number, body: number, len: number) =>
    (type === 0x0fa0 ? utf16 : latin1)
      .decode(d.subarray(body, body + len))
      .split(/[\r\v]/)
      .map((s) => s.trim())
      .filter(Boolean);

  type PptSlide = Slide & { persistId: number };
  const add = (s: PptSlide, textType: number, lines: string[]) => {
    if (textType === NOTES_TYPE) return;
    if (TITLE_TYPES.includes(textType) && !s.title) return void (s.title = lines.join(" "));
    for (const text of lines) if (text !== s.title && !s.body.some((p) => p.text === text)) s.body.push({ text, level: 0 });
  };

  const offsets: Record<number, number> = {};
  let slides: PptSlide[] = [];
  walk(0, d.length, (type, inst, body, len) => {
    if (type === 0x1772) {
      // PersistDirectoryAtom: later (incremental-save) entries override earlier ones.
      for (let p = body; p < body + len; ) {
        const head = u32(p);
        const n = head >>> 20;
        for (let i = 0; i < n; i++) offsets[(head & 0xfffff) + i] = u32(p + 4 + 4 * i);
        p += 4 + 4 * n;
      }
    } else if (type === 0x0ff0) {
      if (inst !== 0) return false; // masters / notes lists
      slides = []; // the last slide list in the stream is the current one
      let textType = 4;
      walk(body, body + len, (t, _i, b, l) => {
        if (t === 0x03f3) slides.push({ persistId: u32(b), title: "", body: [], images: [] });
        else if (t === 0x0f9f) textType = u32(b);
        else if ((t === 0x0fa0 || t === 0x0fa8) && slides.length) add(slides[slides.length - 1], textType, paras(t, b, l));
      });
      return false;
    }
  });

  for (const s of slides) {
    const o = offsets[s.persistId];
    if (o === undefined || o + 8 > d.length || v.getUint16(o + 2, true) !== 0x03ee) continue;
    let textType = 4;
    walk(o + 8, Math.min(o + 8 + u32(o + 4), d.length), (t, _i, b, l) => {
      if (t === 0x0f9f) textType = u32(b);
      else if (t === 0x0fa0 || t === 0x0fa8) add(s, textType, paras(t, b, l));
    });
  }

  return slides.map(({ title, body, images }) => ({ title, body, images }));
}
