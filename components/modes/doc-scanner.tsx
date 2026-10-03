"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Dropzone } from "@/components/tools/Dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { autoDetectQuad, warpToRect, type Quad } from "@/lib/perspective";
import { ArrowDown, ArrowUp, Camera, Download, ScanLine, Wand2, X } from "lucide-react";
import { TwoColumnLayout, InputSection, OutputSection } from "@/components/tools/ToolTemplates";

interface ScanPage {
  id: string;
  file: File;
  img: HTMLImageElement;
  quad: Quad;
}

type OutputMode = "image" | "ocr";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const CORNER_LABELS = ["TL", "TR", "BR", "BL"] as const;
const DISPLAY_W = 420;

function CornerEditor({ page, onChange }: { page: ScanPage; onChange: (quad: Quad) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<number | null>(null);
  const scale = DISPLAY_W / page.img.naturalWidth;
  const displayH = page.img.naturalHeight * scale;

  const toLocal = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: Math.min(page.img.naturalWidth, Math.max(0, ((clientX - rect.left) / rect.width) * page.img.naturalWidth)),
      y: Math.min(page.img.naturalHeight, Math.max(0, ((clientY - rect.top) / rect.height) * page.img.naturalHeight)),
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current === null) return;
    const next = [...page.quad] as Quad;
    next[dragging.current] = toLocal(e.clientX, e.clientY);
    onChange(next);
  };

  const points = page.quad.map((p) => `${p.x * scale},${p.y * scale}`).join(" ");

  return (
    <div className="relative mx-auto" style={{ width: DISPLAY_W, height: displayH }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={page.img.src} alt="" className="absolute inset-0 h-full w-full select-none rounded-lg" draggable={false} />
      <svg
        ref={svgRef}
        className="absolute inset-0 touch-none"
        width={DISPLAY_W}
        height={displayH}
        onPointerMove={onPointerMove}
        onPointerUp={() => (dragging.current = null)}
        onPointerLeave={() => (dragging.current = null)}
      >
        <polygon points={points} className="fill-primary/20 stroke-primary" strokeWidth={2} />
        {page.quad.map((p, i) => (
          <circle
            key={CORNER_LABELS[i]}
            cx={p.x * scale}
            cy={p.y * scale}
            r={9}
            className="cursor-grab fill-primary stroke-background active:cursor-grabbing"
            strokeWidth={2}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              dragging.current = i;
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function DocScannerPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [outputMode, setOutputMode] = useState<OutputMode>("image");
  const [ocrLang, setOcrLang] = useState("eng+ind");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return prev;
      });
    };
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      for (const file of images) {
        try {
          const img = await loadImage(file);
          const quad = autoDetectQuad(img, img.naturalWidth, img.naturalHeight);
          const page: ScanPage = { id: uid(), file, img, quad };
          setPages((prev) => [...prev, page]);
          setActiveId((prev) => prev ?? page.id);
        } catch {
          toast({ variant: "destructive", title: t("common.error"), description: t("toast.error.unsupported") });
        }
      }
    },
    [t, toast],
  );

  const active = pages.find((p) => p.id === activeId) ?? null;

  const updateQuad = (id: string, quad: Quad) =>
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, quad } : p)));

  const resetQuad = (id: string) =>
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quad: autoDetectQuad(p.img, p.img.naturalWidth, p.img.naturalHeight) } : p)),
    );

  const move = (index: number, dir: -1 | 1) => {
    setPages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  };

  const clearAll = () => {
    setPages([]);
    setActiveId(null);
  };

  const process = useCallback(async () => {
    if (!pages.length) return;
    setProcessing(true);
    setProgress(2);

    try {
      const pdf = await PDFDocument.create();
      let worker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | null = null;
      if (outputMode === "ocr") {
        const { createWorker } = await import("tesseract.js");
        worker = await createWorker(ocrLang);
      }
      const font = outputMode === "ocr" ? await pdf.embedFont(StandardFonts.Helvetica) : null;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const outW = Math.round(1240); // ~150dpi for a portrait A4-ish page
        const outH = Math.round((outW * page.img.naturalHeight) / page.img.naturalWidth);
        const warped = warpToRect(page.img, page.quad, outW, outH);

        if (outputMode === "image") {
          const pngBytes = await new Promise<Uint8Array>((resolve, reject) => {
            warped.toBlob(async (blob) => {
              if (!blob) return reject(new Error("toBlob failed"));
              resolve(new Uint8Array(await blob.arrayBuffer()));
            }, "image/png");
          });
          const embedded = await pdf.embedPng(pngBytes);
          const pw = 595.28;
          const ph = (pw * outH) / outW;
          const pdfPage = pdf.addPage([pw, ph]);
          pdfPage.drawImage(embedded, { x: 0, y: 0, width: pw, height: ph });
        } else if (worker && font) {
          const { data } = await worker.recognize(warped);
          const pw = 595.28;
          const ph = 841.89;
          const margin = 48;
          const fontSize = 11;
          const lineHeight = fontSize * 1.4;
          const maxWidth = pw - margin * 2;

          let pdfPage = pdf.addPage([pw, ph]);
          let y = ph - margin;
          const words = (data.text || "").split(/\s+/).filter(Boolean);
          let line = "";
          const flushLine = () => {
            if (!line) return;
            if (y < margin) {
              pdfPage = pdf.addPage([pw, ph]);
              y = ph - margin;
            }
            pdfPage.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
            y -= lineHeight;
            line = "";
          };
          for (const word of words) {
            const candidate = line ? `${line} ${word}` : word;
            if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth) {
              flushLine();
              line = word;
            } else {
              line = candidate;
            }
          }
          flushLine();
          if (!words.length) {
            pdfPage.drawText(t("tool.doc-scanner.noTextFound"), { x: margin, y, size: fontSize, font, color: rgb(0.5, 0.5, 0.5) });
          }
        }

        setProgress(5 + Math.round(((i + 1) / pages.length) * 90));
      }

      if (worker) await worker.terminate();

      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setProgress(100);
      toast({ title: t("common.success"), description: t("toast.success.downloaded") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("toast.error.generic") });
    } finally {
      setTimeout(() => {
        setProcessing(false);
        setProgress(0);
      }, 400);
    }
  }, [pages, outputMode, ocrLang, t, toast]);

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "scan.pdf";
    a.click();
  };

  return (
    <ToolShell title={t("tool.doc-scanner.name")} description={t("tool.doc-scanner.description")}>
      <div className="max-w-screen-lg flex flex-col gap-8">
        <TwoColumnLayout>
          <InputSection label={t("tool.doc-scanner.pagesLabel")}>
            <Dropzone
              accept="image/*"
              multiple
              onFiles={addFiles}
              title={t("tool.doc-scanner.dropzone.title")}
              subtitle={t("tool.doc-scanner.dropzone.subtitle")}
              icon={<Camera className="h-6 w-6 text-primary" />}
              className="min-h-[160px]"
            />

            {pages.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("tool.doc-scanner.pageCount").replace("{{count}}", String(pages.length))}
                </p>
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {pages.map((p, index) => (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveId(p.id)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActiveId(p.id)}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        p.id === activeId ? "border-primary bg-primary/5" : "bg-muted/10"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.img.src} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                      <span className="flex-1 truncate text-sm font-medium">
                        {t("tool.doc-scanner.page")} {index + 1}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            move(index, -1);
                          }}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === pages.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            move(index, 1);
                          }}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(p.id);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </InputSection>

          <OutputSection label={t("tool.doc-scanner.adjustLabel")}>
            {active ? (
              <>
                <p className="text-xs text-muted-foreground">{t("tool.doc-scanner.adjustHint")}</p>
                <CornerEditor page={active} onChange={(q) => updateQuad(active.id, q)} />
                <Button variant="outline" size="sm" className="mx-auto gap-2" onClick={() => resetQuad(active.id)}>
                  <Wand2 className="h-3.5 w-3.5" />
                  {t("tool.doc-scanner.autoDetect")}
                </Button>
              </>
            ) : (
              <div className="flex min-h-[200px] items-center justify-center rounded-xl border bg-muted/10">
                <p className="text-sm text-muted-foreground">{t("tool.doc-scanner.noPageSelected")}</p>
              </div>
            )}
          </OutputSection>
        </TwoColumnLayout>

        <div className="space-y-4">
          <Tabs value={outputMode} onValueChange={(v) => setOutputMode(v as OutputMode)}>
            <TabsList className="grid w-full max-w-sm grid-cols-2">
              <TabsTrigger value="image">{t("tool.doc-scanner.mode.image")}</TabsTrigger>
              <TabsTrigger value="ocr">{t("tool.doc-scanner.mode.ocr")}</TabsTrigger>
            </TabsList>
          </Tabs>

          {outputMode === "ocr" && (
            <div className="max-w-xs space-y-2">
              <Select value={ocrLang} onValueChange={setOcrLang}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eng">English</SelectItem>
                  <SelectItem value="ind">Bahasa Indonesia</SelectItem>
                  <SelectItem value="eng+ind">English + Indonesia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {processing && <Progress value={progress} className="h-1.5 max-w-sm" />}

          <ToolActionBar
            primaryLabel={processing ? t("state.converting") : t("tool.doc-scanner.process")}
            primaryIcon={<ScanLine className="h-4 w-4" />}
            onPrimary={process}
            primaryDisabled={!pages.length || processing}
            resetLabel={t("action.clearAll")}
            onReset={pages.length ? clearAll : undefined}
          >
            {resultUrl && (
              <Button variant="outline" className="gap-2" onClick={download}>
                <Download className="h-4 w-4" />
                {t("action.download")}
              </Button>
            )}
          </ToolActionBar>
        </div>
      </div>
    </ToolShell>
  );
}
