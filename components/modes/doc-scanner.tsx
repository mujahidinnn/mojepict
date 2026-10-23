"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { warpToRect, type Quad } from "@/lib/perspective";
import { ArrowDown, ArrowUp, Camera, Download, ImagePlus, RotateCw, ScanLine, Wand2, X } from "lucide-react";
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

/** Live camera for webcam/phone capture; each shot is handed over as a JPEG File and the camera stays open for the next page.
 * Fullscreen on mobile (portaled, so no transformed ancestor clips it) with the shutter under the thumb; inline on lg+. */
function CameraCapture({ count, onCapture, onClose }: { count: number; onCapture: (file: File) => void; onClose: () => void }) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [flash, setFlash] = useState(false);
  const [fullscreen] = useState(() => !window.matchMedia("(min-width: 1024px)").matches);
  const [error, setError] = useState<string | null>(() =>
    navigator.mediaDevices ? null : t("tool.doc-scanner.cameraUnsupported"),
  );

  useEffect(() => {
    if (!navigator.mediaDevices) return;
    let stream: MediaStream | undefined;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const shoot = () => {
    const v = videoRef.current;
    if (!v?.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob((b) => b && onCapture(new File([b], `scan-${Date.now()}.jpg`, { type: "image/jpeg" })), "image/jpeg", 0.92);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    navigator.vibrate?.(30);
  };

  const view = (
    <div className="fixed inset-0 z-50 flex flex-col bg-black lg:static lg:z-auto lg:overflow-hidden lg:rounded-lg">
      <div className="relative min-h-0 flex-1">
        {error ? (
          <p className="p-6 text-center text-sm text-white">{error}</p>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain lg:h-auto lg:max-h-[60vh]" />
        )}
        {flash && <div className="pointer-events-none absolute inset-0 bg-white/70" />}
      </div>
      <div className="grid grid-cols-3 items-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:p-2">
        <span className="text-sm text-white" aria-live="polite">
          {t("tool.doc-scanner.pageCount").replace("{{count}}", String(count))}
        </span>
        <button
          type="button"
          onClick={shoot}
          disabled={!!error}
          aria-label={t("tool.doc-scanner.capture")}
          className="mx-auto h-16 w-16 rounded-full border-4 border-white bg-white/80 transition-transform active:scale-90 disabled:opacity-40 lg:h-12 lg:w-12"
        />
        <Button type="button" variant="secondary" onClick={onClose} className="gap-2 justify-self-end">
          <X className="h-4 w-4" /> {t("tool.doc-scanner.closeCamera")}
        </Button>
      </div>
    </div>
  );
  return fullscreen ? createPortal(view, document.body) : view;
}

function downloadUrl(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = "scan.pdf";
  a.click();
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/** Otsu threshold -> largest bright connected blob -> its 4 extreme corners.
 * Returns null when no plausible document is found. Works for a white page on a
 * dark background even when the page fills most of the frame. */
function quadFromGray(gray: Uint8ClampedArray | number[], w: number, h: number): Quad | null {
  const n = w * h;
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < n; i++) hist[gray[i]]++;
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];
  let wB = 0;
  let sumB = 0;
  let best = -1;
  let threshold = 127;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (!wB || wB === n) continue;
    sumB += i * hist[i];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / (n - wB);
    const between = wB * (n - wB) * (mB - mF) ** 2;
    if (between > best) {
      best = between;
      threshold = i;
    }
  }

  const label = new Int32Array(n).fill(-1);
  const stack = new Int32Array(n);
  let bestPixels: number[] = [];
  for (let start = 0; start < n; start++) {
    if (label[start] !== -1 || gray[start] <= threshold) continue;
    const pixels: number[] = [];
    let top = 0;
    stack[top++] = start;
    label[start] = start;
    while (top) {
      const i = stack[--top];
      pixels.push(i);
      const x = i % w;
      const neighbors = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
      for (const j of neighbors) {
        if (j < 0 || j >= n || label[j] !== -1 || gray[j] <= threshold) continue;
        label[j] = start;
        stack[top++] = j;
      }
    }
    if (pixels.length > bestPixels.length) bestPixels = pixels;
  }
  if (bestPixels.length < n * 0.08 || bestPixels.length > n * 0.97) return null;

  let tl = bestPixels[0], tr = tl, br = tl, bl = tl;
  const sum = (i: number) => (i % w) + Math.floor(i / w);
  const diff = (i: number) => (i % w) - Math.floor(i / w);
  for (const i of bestPixels) {
    if (sum(i) < sum(tl)) tl = i;
    if (sum(i) > sum(br)) br = i;
    if (diff(i) > diff(tr)) tr = i;
    if (diff(i) < diff(bl)) bl = i;
  }
  return [tl, tr, br, bl].map((i) => ({ x: (i % w) + 0.5, y: Math.floor(i / w) + 0.5 })) as Quad;
}

function detectDocumentQuad(img: HTMLImageElement): Quad | null {
  try {
    const { naturalWidth: nw, naturalHeight: nh } = img;
    const scale = Math.min(1, 300 / Math.max(nw, nh));
    const w = Math.max(1, Math.round(nw * scale));
    const h = Math.max(1, Math.round(nh * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const gray = new Uint8ClampedArray(w * h);
    for (let i = 0; i < w * h; i++) gray[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
    const quad = quadFromGray(gray, w, h);
    return quad && (quad.map((p) => ({ x: (p.x / w) * nw, y: (p.y / h) * nh })) as Quad);
  } catch {
    return null;
  }
}

/** Auto-detected quad, or the inset full-frame fallback (detected=false) for manual adjustment. */
function detectOrFallback(img: HTMLImageElement): { quad: Quad; detected: boolean } {
  const quad = detectDocumentQuad(img);
  return quad ? { quad, detected: true } : { quad: fullQuad(img), detected: false };
}

function fullQuad(img: HTMLImageElement): Quad {
  const inset = 0.04;
  const { naturalWidth: w, naturalHeight: h } = img;
  return [
    { x: w * inset, y: h * inset },
    { x: w * (1 - inset), y: h * inset },
    { x: w * (1 - inset), y: h * (1 - inset) },
    { x: w * inset, y: h * (1 - inset) },
  ];
}

const CORNER_LABELS = ["TL", "TR", "BR", "BL"] as const;
const DISPLAY_W = 420;

/** Output height for a given width, from the quad's own edges (not the photo) so a tilted page keeps its real proportions. */
function quadHeightFor([a, b, c, d]: Quad, width: number) {
  const dist = (p: Quad[number], q: Quad[number]) => Math.hypot(p.x - q.x, p.y - q.y);
  return Math.max(1, Math.round((width * (dist(a, d) + dist(b, c))) / (dist(a, b) + dist(d, c) || 1)));
}

/** Small live render of the straightened page, so corner/rotate edits are visible before export. */
function WarpPreview({ page }: { page: ScanPage }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Debounced: warpToRect reads the full-size photo, too heavy for every pointer move.
    const id = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = 240;
      const h = quadHeightFor(page.quad, w);
      const warped = warpToRect(page.img, page.quad, w, h);
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(warped, 0, 0);
    }, 150);
    return () => clearTimeout(id);
  }, [page.img, page.quad]);

  return <canvas ref={canvasRef} className="mx-auto block max-h-64 w-auto max-w-[50%] rounded border shadow-sm" />;
}

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
    <div className="relative mx-auto w-full" style={{ maxWidth: `min(${DISPLAY_W}px, calc(55vh * ${DISPLAY_W / displayH}))`, aspectRatio: `${DISPLAY_W} / ${displayH}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={page.img.src} alt="" className="absolute inset-0 h-full w-full select-none rounded-lg" draggable={false} />
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full touch-none overflow-visible"
        viewBox={`0 0 ${DISPLAY_W} ${displayH}`}
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
            r={16}
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

  // Revoke page image URLs and the result URL on unmount.
  const pagesRef = useRef<ScanPage[]>([]);
  const resultUrlRef = useRef<string | null>(null);
  useEffect(() => {
    pagesRef.current = pages;
    resultUrlRef.current = resultUrl;
  }, [pages, resultUrl]);
  useEffect(
    () => () => {
      pagesRef.current.forEach((p) => URL.revokeObjectURL(p.img.src));
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    },
    [],
  );

  const [cameraOpen, setCameraOpen] = useState(false);

  // Mobile strip scrolls sideways; keep the selected page in view (scrollLeft only, so the page itself never jumps).
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-id="${activeId}"]`);
    if (el) stripRef.current!.scrollTo({ left: el.offsetLeft - 8, behavior: "smooth" });
  }, [activeId]);

  const addFiles = useCallback(
    async (files: File[], quiet = false) => {
      const rejected = files.filter((f) => !f.type.startsWith("image/"));
      if (rejected.length) {
        const isPdf = rejected.some((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t(isPdf ? "tool.doc-scanner.pdfRejected" : "toast.error.unsupported"),
        });
      }
      const images = files.filter((f) => f.type.startsWith("image/"));
      let undetected = 0;
      let first = true;
      for (const file of images) {
        try {
          const img = await loadImage(file);
          const { quad, detected } = detectOrFallback(img);
          if (!detected) undetected++;
          const page: ScanPage = { id: uid(), file, img, quad };
          setPages((prev) => [...prev, page]);
          if (first) setActiveId(page.id);
          first = false;
        } catch {
          toast({ variant: "destructive", title: t("common.error"), description: t("toast.error.unsupported") });
        }
      }
      if (undetected && !quiet) toast({ title: t("tool.doc-scanner.detectFailedTitle"), description: t("tool.doc-scanner.detectFailed") });
    },
    [t, toast],
  );

  const active = pages.find((p) => p.id === activeId) ?? null;

  const updateQuad = (id: string, quad: Quad) =>
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, quad } : p)));

  const resetQuad = (id: string) => {
    const page = pages.find((p) => p.id === id);
    if (!page) return;
    const { quad, detected } = detectOrFallback(page.img);
    if (!detected) toast({ title: t("tool.doc-scanner.detectFailedTitle"), description: t("tool.doc-scanner.detectFailed") });
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, quad } : p)));
  };

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
    const page = pages.find((p) => p.id === id);
    if (page) URL.revokeObjectURL(page.img.src);
    setPages((prev) => prev.filter((p) => p.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  };

  const clearAll = () => {
    pages.forEach((p) => URL.revokeObjectURL(p.img.src));
    setPages([]);
    setActiveId(null);
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const process = useCallback(async () => {
    if (!pages.length) return;
    setProcessing(true);
    setProgress(2);

    let worker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | null = null;
    try {
      const pdf = await PDFDocument.create();
      if (outputMode === "ocr") {
        const { createWorker } = await import("tesseract.js");
        worker = await createWorker(ocrLang);
      }
      const font = outputMode === "ocr" ? await pdf.embedFont(StandardFonts.Helvetica) : null;
      // Helvetica only covers WinAnsi; drop anything else OCR returns so drawText can't throw.
      const charset = new Set(font?.getCharacterSet() ?? []);
      const toWinAnsi = (text: string) =>
        Array.from(text)
          .filter((ch) => charset.has(ch.codePointAt(0)!))
          .join("");

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const outW = 1240; // ~150dpi for a portrait A4-ish page
        const outH = quadHeightFor(page.quad, outW);
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
          const words = (data.text || "").split(/\s+/).map(toWinAnsi).filter(Boolean);
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

      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setProgress(100);
      downloadUrl(url);
      toast({ title: t("common.success"), description: t("toast.success.downloaded") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("toast.error.generic") });
    } finally {
      worker?.terminate();
      setTimeout(() => {
        setProcessing(false);
        setProgress(0);
      }, 400);
    }
  }, [pages, outputMode, ocrLang, t, toast]);

  const download = () => resultUrl && downloadUrl(resultUrl);

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
              className="hidden min-h-[160px] lg:flex"
            />

            {cameraOpen ? (
              <CameraCapture count={pages.length} onCapture={(f) => addFiles([f], true)} onClose={() => setCameraOpen(false)} />
            ) : (
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                <Button type="button" className="gap-2 lg:hidden" onClick={() => setCameraOpen(true)}>
                  <Camera className="h-4 w-4" /> {t("tool.doc-scanner.useCamera")}
                </Button>
                <Button type="button" variant="outline" className="hidden gap-2 lg:flex" onClick={() => setCameraOpen(true)}>
                  <Camera className="h-4 w-4" /> {t("tool.doc-scanner.useCamera")}
                </Button>
                <Button type="button" variant="outline" className="gap-2 lg:hidden" asChild>
                  <label>
                    <ImagePlus className="h-4 w-4" /> {t("tool.doc-scanner.gallery")}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        addFiles(Array.from(e.target.files ?? []));
                        e.target.value = "";
                      }}
                    />
                  </label>
                </Button>
              </div>
            )}

            {pages.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("tool.doc-scanner.pageCount").replace("{{count}}", String(pages.length))}
                </p>
                <div ref={stripRef} className="relative -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:max-h-72 lg:space-y-2 lg:overflow-y-auto lg:px-0 lg:pb-0">
                  {pages.map((p, index) => (
                    <div
                      key={p.id}
                      data-id={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveId(p.id)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActiveId(p.id)}
                      className={`flex w-36 shrink-0 cursor-pointer flex-col gap-2 rounded-lg border p-2 text-left transition-colors lg:w-full lg:flex-row lg:items-center lg:gap-3 lg:p-3 ${
                        p.id === activeId ? "border-primary bg-primary/5" : "bg-muted/10"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.img.src} alt="" className="h-24 w-full shrink-0 rounded object-cover lg:h-10 lg:w-10" />
                      <span className="truncate text-center text-xs font-medium lg:flex-1 lg:text-left lg:text-sm">
                        {t("tool.doc-scanner.page")} {index + 1}
                      </span>
                      <span className="flex shrink-0 items-center justify-between gap-1 lg:justify-start">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 lg:h-7 lg:w-7"
                          disabled={index === 0}
                          aria-label={t("tool.merge-pdf.moveUp")}
                          onClick={(e) => {
                            e.stopPropagation();
                            move(index, -1);
                          }}
                        >
                          <ArrowUp className="h-4 w-4 -rotate-90 lg:h-3.5 lg:w-3.5 lg:rotate-0" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 lg:h-7 lg:w-7"
                          disabled={index === pages.length - 1}
                          aria-label={t("tool.merge-pdf.moveDown")}
                          onClick={(e) => {
                            e.stopPropagation();
                            move(index, 1);
                          }}
                        >
                          <ArrowDown className="h-4 w-4 -rotate-90 lg:h-3.5 lg:w-3.5 lg:rotate-0" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive lg:h-7 lg:w-7"
                          aria-label={t("tool.pdf-editor.remove")}
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
                <p className="text-center text-xs text-muted-foreground">{t("tool.doc-scanner.preview")}</p>
                <WarpPreview page={active} />
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => resetQuad(active.id)}>
                    <Wand2 className="h-3.5 w-3.5" />
                    {t("tool.doc-scanner.autoDetect")}
                  </Button>
                  {/* Shifting the corner order turns the output 90° clockwise. */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      const q = active.quad;
                      updateQuad(active.id, [q[3], q[0], q[1], q[2]]);
                    }}
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    {t("tool.doc-scanner.rotate")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex min-h-[200px] items-center justify-center rounded-xl border bg-muted/10">
                <p className="text-sm text-muted-foreground">{t("tool.doc-scanner.noPageSelected")}</p>
              </div>
            )}
          </OutputSection>
        </TwoColumnLayout>

        <div className="sticky bottom-0 z-10 space-y-3 border-t bg-background/95 py-3 backdrop-blur lg:static lg:space-y-4 lg:border-0 lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
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
            className="flex-row [&>button]:min-w-0 [&>button]:flex-1 [&>button]:px-2 lg:flex-col lg:[&>button]:px-4"
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
