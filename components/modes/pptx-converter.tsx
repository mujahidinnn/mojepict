"use client";

import { useEffect, useRef, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Dropzone } from "@/components/tools/Dropzone";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { parsePpt, parsePptx, slidesToMarkdown, markdownToSlides, type Slide } from "@/lib/pptx";
import type { FormatId } from "@/lib/converter-formats";
import { Download, Presentation } from "lucide-react";

type Source = "pptx" | "pdf" | "md";

const sourceOf = (name: string): Source | null => {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext === "pptx" || ext === "ppt" ? "pptx" : ext === "pdf" ? "pdf" : ext === "md" || ext === "markdown" ? "md" : null;
};

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// 10in x 5.625in (16:9) at 96dpi, same size on screen and on the printed page.
const SLIDE_W = 960;
const SLIDE_H = 540;

/** Covers pptx/ppt → pdf/md and pdf/md → pptx. `to` and `initialFile` come from the Universal Converter hub. */
export default function PptxConverterPage({ to, initialFile }: { to?: FormatId; initialFile?: File } = {}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [markdown, setMarkdown] = useState("");
  const [pdfPages, setPdfPages] = useState<{ src: string; w: number; h: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const fail = () =>
    toast({ variant: "destructive", title: t("common.error"), description: t("tool.pptx-converter.invalidFile") });

  const load = async (f: File) => {
    const src = sourceOf(f.name);
    if (!src || src === to) return fail();
    setLoading(true);
    try {
      if (src === "pptx") {
        const buf = await f.arrayBuffer();
        const s = /\.ppt$/i.test(f.name) ? await parsePpt(buf) : parsePptx(buf);
        setSlides(s);
        setMarkdown(slidesToMarkdown(s));
      } else if (src === "md") {
        setMarkdown(await f.text());
      } else {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        const doc = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
        const pages = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width;
          canvas.height = vp.height;
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
          // PDF points → inches for the pptx slide size.
          pages.push({ src: canvas.toDataURL("image/jpeg", 0.9), w: base.width / 72, h: base.height / 72 });
        }
        setPdfPages(pages);
      }
      setFile(f);
      setSource(src);
    } catch {
      fail();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialFile) load(initialFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  const reset = () => {
    setFile(null);
    setSource(null);
    setSlides([]);
    setMarkdown("");
    setPdfPages([]);
  };

  const baseName = file?.name.replace(/\.[^.]+$/, "") ?? "presentation";

  const buildPptx = async () => {
    const PptxGenJS = (await import("pptxgenjs")).default;
    const pptx = new PptxGenJS();
    if (source === "pdf") {
      // ponytail: every slide uses page 1's size; mixed-size PDFs get stretched pages.
      const { w, h } = pdfPages[0];
      pptx.defineLayout({ name: "PDF", width: w, height: h });
      pptx.layout = "PDF";
      for (const p of pdfPages) pptx.addSlide().addImage({ data: p.src, x: 0, y: 0, w, h });
    } else {
      pptx.layout = "LAYOUT_WIDE";
      for (const s of markdownToSlides(markdown)) {
        const slide = pptx.addSlide();
        if (s.title) slide.addText(s.title, { x: 0.5, y: 0.3, w: 12.33, h: 1, fontSize: 32, bold: true });
        if (s.body.length)
          slide.addText(
            s.body.map((p) => ({ text: p.text, options: { bullet: true, indentLevel: p.level, breakLine: true } })),
            { x: 0.5, y: s.title ? 1.4 : 0.5, w: 12.33, h: s.title ? 5.6 : 6.5, fontSize: 18, valign: "top" },
          );
      }
    }
    await pptx.writeFile({ fileName: `${baseName}.pptx` });
  };

  // Prints the preview from an iframe so the PDF keeps real, selectable text.
  const printPdf = () => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;width:0;height:0;border:0";
    iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${baseName.replace(/[<>&]/g, "")}</title><style>@page{size:10in 5.625in;margin:0}body{margin:0;font-family:Calibri,Arial,sans-serif}section{break-after:page}</style></head><body>${previewRef.current?.innerHTML ?? ""}</body></html>`;
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 60_000);
    };
    document.body.appendChild(iframe);
  };

  const target = source === "pptx" ? (to === "pdf" ? "pdf" : "md") : "pptx";
  const convert = () =>
    target === "pdf"
      ? printPdf()
      : target === "md"
        ? save(new Blob([markdown], { type: "text/markdown" }), `${baseName}.md`)
        : buildPptx().catch(fail);

  return (
    <ToolShell title={t("tool.pptx-converter.name")} description={t("tool.pptx-converter.description")}>
      {!file ? (
        <Dropzone
          accept=".pptx,.ppt,.pdf,.md,.markdown"
          onFile={load}
          icon={<Presentation className="h-8 w-8" />}
          title={t(loading ? "tool.pptx-converter.reading" : "tool.pptx-converter.dropzone.title")}
          subtitle={t("tool.pptx-converter.dropzone.subtitle")}
        />
      ) : (
        <div className="max-w-screen-lg space-y-4">
          <ToolActionBar
            primaryLabel={t(`tool.pptx-converter.to.${target}`)}
            primaryIcon={<Download className="h-4 w-4" />}
            onPrimary={convert}
            primaryDisabled={loading}
            resetLabel={t("tool.pptx-converter.changeFile")}
            onReset={reset}
          >
            <span className="text-sm text-muted-foreground truncate">{file.name}</span>
          </ToolActionBar>
          <p className="text-sm text-muted-foreground">{source && t(`tool.pptx-converter.hint.${source}`)}</p>

          {target === "pdf" && (
            <div className="overflow-auto rounded-xl border bg-muted/20 p-4">
              <div ref={previewRef} className="mx-auto flex w-fit flex-col gap-4">
                {slides.map((s, i) => (
                  <section
                    key={i}
                    style={{ width: SLIDE_W, height: SLIDE_H, padding: 48, boxSizing: "border-box", overflow: "hidden", background: "#fff", color: "#000" }}
                  >
                    {s.title && <h1 style={{ fontSize: 36, fontWeight: 700, margin: "0 0 20px" }}>{s.title}</h1>}
                    {s.body.map((p, j) => (
                      <p key={j} style={{ fontSize: 20, margin: "0 0 8px", paddingLeft: p.level * 28 }}>
                        • {p.text}
                      </p>
                    ))}
                    {s.images.length > 0 && (
                      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                        {s.images.map((src, j) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={j} src={src} alt="" style={{ maxHeight: 220, maxWidth: "45%", objectFit: "contain" }} />
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </div>
          )}

          {source === "pdf" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {pdfPages.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p.src} alt={`${i + 1}`} className="w-full rounded border" />
              ))}
            </div>
          )}

          {(target === "md" || source === "md") && (
            <Card className="bg-muted/10">
              <Textarea
                readOnly={source !== "md"}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="min-h-96 p-4 resize-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </Card>
          )}
        </div>
      )}
    </ToolShell>
  );
}
