"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Dropzone } from "@/components/tools/Dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  FileText,
  GripVertical,
  Highlighter as HighlighterIcon,
  MousePointer2,
  PenLine,
  Type as TypeIcon,
  Undo2,
  X,
} from "lucide-react";

type Tool = "select" | "text" | "highlight" | "whiteout" | "pen";

type TextAnnotation = {
  id: string;
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
};
type RectAnnotation = {
  id: string;
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  mode: "highlight" | "whiteout";
  color: string;
};
type StrokeAnnotation = {
  id: string;
  type: "stroke";
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
};
type Annotation = TextAnnotation | RectAnnotation | StrokeAnnotation;

/** A text run already present in the source PDF, hit-tested so users can click it to edit in place. */
type ExistingTextItem = {
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  text: string;
};

const TEXT_COLORS = ["#111111", "#dc2626", "#2563eb", "#16a34a", "#ffffff"];
const HIGHLIGHT_COLORS = ["#fde047", "#86efac", "#93c5fd", "#f9a8d4"];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function hexToRgb01(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function strokePathD(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

export default function PdfEditorPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [rendering, setRendering] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [textSize, setTextSize] = useState(18);
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0]);
  const [penColor, setPenColor] = useState("#dc2626");
  const [penWidth, setPenWidth] = useState(3);

  const [annotations, setAnnotations] = useState<Record<number, Annotation[]>>({});
  const [draftRect, setDraftRect] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );
  const [draftStroke, setDraftStroke] = useState<{ x: number; y: number }[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingTextItems, setExistingTextItems] = useState<ExistingTextItem[]>([]);
  const [hoveredExistingIndex, setHoveredExistingIndex] = useState<number | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pageScalesRef = useRef<Record<number, number>>({});
  const renderTaskRef = useRef<RenderTask | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const draggingTextRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const handleFile = useCallback(
    async (f: File) => {
      if (f.type !== "application/pdf") {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("toast.error.unsupported"),
        });
        return;
      }
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        const bytes = await f.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
        setFile(f);
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setAnnotations({});
        pageScalesRef.current = {};
      } catch {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("tool.pdf-editor.invalidFile"),
        });
      }
    },
    [t, toast],
  );

  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;
    setRendering(true);
    setExistingTextItems([]);
    (async () => {
      const pdfjsLib = await import("pdfjs-dist");
      const page = await pdfDoc.getPage(currentPage);
      const unscaled = page.getViewport({ scale: 1 });
      const scale = Math.min(820 / unscaled.width, 1100 / unscaled.height, 2.5);
      const viewport = page.getViewport({ scale });
      pageScalesRef.current[currentPage] = scale;

      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

      // Cancel any still-running render from a previous page before starting
      // a new one - otherwise two renders can race on the same <canvas> and
      // pdf.js throws "Cannot use the same canvas during multiple render()
      // operations" or leaves a mixed/broken preview behind.
      renderTaskRef.current?.cancel();
      const renderTask = page.render({ canvasContext: ctx, viewport, transform } as never);
      renderTaskRef.current = renderTask;
      try {
        await renderTask.promise;
      } catch (err) {
        // A cancelled render rejects its promise by design - swallow that
        // one case and let the render that superseded it own the canvas.
        const name = (err as { name?: string } | undefined)?.name;
        if (name === "RenderingCancelledException") return;
        throw err;
      }
      if (renderTaskRef.current === renderTask) renderTaskRef.current = null;
      if (cancelled) return;
      setPageSize({ width: viewport.width, height: viewport.height });
      setRendering(false);

      // Extract each existing text run's on-screen box (same matrix math pdf.js's
      // own TextLayer uses) so it can be clicked and edited in place, rather than
      // only being able to add brand-new text on top of the page.
      const textContent = await page.getTextContent();
      const items: ExistingTextItem[] = [];
      for (const raw of textContent.items) {
        if (!("str" in raw) || !raw.str.trim()) continue;
        const tx = pdfjsLib.Util.transform(viewport.transform, raw.transform);
        const angle = Math.atan2(tx[1], tx[0]);
        if (angle !== 0) continue; // skip rotated text - box math below assumes horizontal
        const fontHeight = Math.hypot(tx[2], tx[3]);
        const fontAscent = fontHeight * 0.8;
        items.push({
          left: tx[4],
          top: tx[5] - fontAscent,
          width: raw.width * scale,
          height: fontHeight,
          fontSize: fontHeight,
          text: raw.str,
        });
      }
      if (!cancelled) setExistingTextItems(items);
    })();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [pdfDoc, currentPage]);

  // Renders a low-res thumbnail per page for the sidebar page list, filling
  // them in one at a time so the panel is usable immediately on long PDFs.
  useEffect(() => {
    if (!pdfDoc) {
      setThumbnails([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const results = new Array<string>(pdfDoc.numPages).fill("");
      setThumbnails([...results]);
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (cancelled) return;
        const page = await pdfDoc.getPage(i);
        const unscaled = page.getViewport({ scale: 1 });
        const scale = 160 / unscaled.width;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport } as never).promise;
        if (cancelled) return;
        results[i - 1] = canvas.toDataURL("image/png");
        setThumbnails([...results]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc]);

  const pageAnnotations = annotations[currentPage] ?? [];

  const addAnnotation = (a: Annotation) => {
    setAnnotations((prev) => ({ ...prev, [currentPage]: [...(prev[currentPage] ?? []), a] }));
  };

  const updateAnnotation = (id: string, patch: Partial<Annotation>) => {
    setAnnotations((prev) => ({
      ...prev,
      [currentPage]: (prev[currentPage] ?? []).map((a) =>
        a.id === id ? ({ ...a, ...patch } as Annotation) : a,
      ),
    }));
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => ({
      ...prev,
      [currentPage]: (prev[currentPage] ?? []).filter((a) => a.id !== id),
    }));
  };

  const undoLast = () => {
    setAnnotations((prev) => {
      const list = prev[currentPage] ?? [];
      if (!list.length) return prev;
      return { ...prev, [currentPage]: list.slice(0, -1) };
    });
  };

  const getRelPos = (e: React.MouseEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const hitTestExistingText = (pos: { x: number; y: number }) =>
    existingTextItems.findIndex(
      (it) =>
        pos.x >= it.left &&
        pos.x <= it.left + it.width &&
        pos.y >= it.top &&
        pos.y <= it.top + it.height,
    );

  /** Converts an existing PDF text run into an editable annotation: whites it
   * out on the canvas, then drops an editable text box pre-filled with its
   * content at the same spot - the closest a client-side, non-OCR tool can
   * get to "click existing text and change it" like Acrobat/Word. */
  const startEditExistingText = (item: ExistingTextItem, index: number) => {
    const pad = 2;
    addAnnotation({
      id: uid(),
      type: "rect",
      x: item.left - pad,
      y: item.top - pad,
      w: item.width + pad * 2,
      h: item.height + pad * 2,
      mode: "whiteout",
      color: "#ffffff",
    });
    const textId = uid();
    addAnnotation({
      id: textId,
      type: "text",
      x: item.left,
      y: item.top,
      text: item.text,
      fontSize: Math.round(item.fontSize),
      color: textColor,
    });
    setEditingId(textId);
    setExistingTextItems((prev) => prev.filter((_, i) => i !== index));
    setHoveredExistingIndex(null);
  };

  const onOverlayMouseDown = (e: React.MouseEvent) => {
    if (activeTool === "select" && e.target === overlayRef.current) {
      const pos = getRelPos(e);
      const index = hitTestExistingText(pos);
      if (index !== -1) {
        startEditExistingText(existingTextItems[index], index);
        return;
      }
    }
    if (activeTool === "text") {
      const { x, y } = getRelPos(e);
      const id = uid();
      addAnnotation({ id, type: "text", x, y, text: "", fontSize: textSize, color: textColor });
      setEditingId(id);
      return;
    }
    if (activeTool === "highlight" || activeTool === "whiteout") {
      const pos = getRelPos(e);
      dragStartRef.current = pos;
      setDraftRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      return;
    }
    if (activeTool === "pen") {
      setDraftStroke([getRelPos(e)]);
    }
  };

  const onOverlayMouseMove = (e: React.MouseEvent) => {
    if (draggingTextRef.current) {
      const { x, y } = getRelPos(e);
      updateAnnotation(draggingTextRef.current.id, {
        x: x - draggingTextRef.current.offsetX,
        y: y - draggingTextRef.current.offsetY,
      });
      return;
    }
    if (dragStartRef.current) {
      const pos = getRelPos(e);
      const start = dragStartRef.current;
      setDraftRect({
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        w: Math.abs(pos.x - start.x),
        h: Math.abs(pos.y - start.y),
      });
      return;
    }
    if (draftStroke) {
      setDraftStroke((prev) => [...(prev ?? []), getRelPos(e)]);
      return;
    }
    if (activeTool === "select") {
      const index = hitTestExistingText(getRelPos(e));
      setHoveredExistingIndex(index === -1 ? null : index);
    }
  };

  const finishDrag = () => {
    draggingTextRef.current = null;
    if (dragStartRef.current && draftRect) {
      if (draftRect.w > 4 && draftRect.h > 4) {
        addAnnotation({
          id: uid(),
          type: "rect",
          ...draftRect,
          mode: activeTool === "whiteout" ? "whiteout" : "highlight",
          color: activeTool === "whiteout" ? "#ffffff" : highlightColor,
        });
      }
      dragStartRef.current = null;
      setDraftRect(null);
    }
    if (draftStroke) {
      if (draftStroke.length > 1) {
        addAnnotation({
          id: uid(),
          type: "stroke",
          points: draftStroke,
          color: penColor,
          lineWidth: penWidth,
        });
      }
      setDraftStroke(null);
    }
  };

  const startDragText = (e: React.MouseEvent, a: TextAnnotation) => {
    if (activeTool !== "select") return;
    e.stopPropagation();
    const pos = getRelPos(e);
    draggingTextRef.current = { id: a.id, offsetX: pos.x - a.x, offsetY: pos.y - a.y };
  };

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null);
    setNumPages(0);
    setAnnotations({});
    pageScalesRef.current = {};
  };

  const exportPdf = async () => {
    if (!file) return;
    setExporting(true);
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);

      for (const [pageNumStr, list] of Object.entries(annotations)) {
        if (!list.length) continue;
        const pageIndex = Number(pageNumStr) - 1;
        const scale = pageScalesRef.current[Number(pageNumStr)] ?? 1;
        const page = doc.getPage(pageIndex);
        const { height: pageH } = page.getSize();

        for (const a of list) {
          if (a.type === "text") {
            if (!a.text.trim()) continue;
            page.drawText(a.text, {
              x: a.x / scale,
              y: pageH - (a.y + a.fontSize * 0.8) / scale,
              size: a.fontSize / scale,
              font,
              color: hexToRgb01(a.color),
            });
          } else if (a.type === "rect") {
            page.drawRectangle({
              x: a.x / scale,
              y: pageH - (a.y + a.h) / scale,
              width: a.w / scale,
              height: a.h / scale,
              color: hexToRgb01(a.color),
              opacity: a.mode === "whiteout" ? 1 : 0.4,
              borderWidth: 0,
            });
          } else if (a.type === "stroke") {
            const path = strokePathD(a.points.map((p) => ({ x: p.x / scale, y: p.y / scale })));
            page.drawSvgPath(path, {
              x: 0,
              y: pageH,
              borderColor: hexToRgb01(a.color),
              borderWidth: a.lineWidth / scale,
              borderLineCap: undefined,
            });
          }
        }
      }

      const outBytes = await doc.save();
      const blob = new Blob([outBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name.replace(/\.pdf$/i, "")}-edited.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("common.success"), description: t("toast.success.downloaded") });
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("toast.error.failed"),
      });
    } finally {
      setExporting(false);
    }
  };

  const TOOLS: { id: Tool; icon: typeof MousePointer2; label: string }[] = [
    { id: "select", icon: MousePointer2, label: t("tool.pdf-editor.tool.select") },
    { id: "text", icon: TypeIcon, label: t("tool.pdf-editor.tool.text") },
    { id: "highlight", icon: HighlighterIcon, label: t("tool.pdf-editor.tool.highlight") },
    { id: "whiteout", icon: Eraser, label: t("tool.pdf-editor.tool.whiteout") },
    { id: "pen", icon: PenLine, label: t("tool.pdf-editor.tool.pen") },
  ];

  return (
    <ToolShell title={t("tool.pdf-editor.name")} description={t("tool.pdf-editor.description")}>
      {!file ? (
        <div className="max-w-xl">
          <Dropzone
            accept="application/pdf"
            onFile={handleFile}
            title={t("tool.pdf-editor.dropzone.title")}
            subtitle={t("tool.pdf-editor.dropzone.subtitle")}
            icon={<FileText className="h-6 w-6 text-primary" />}
            className="min-h-[240px]"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
          <div className="min-w-0 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/10 p-2">
              {TOOLS.map(({ id, icon: Icon, label }) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={activeTool === id ? "default" : "outline"}
                  className="gap-1.5"
                  onClick={() => setActiveTool(id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={undoLast}
                  disabled={!pageAnnotations.length}
                >
                  <Undo2 className="h-4 w-4" />
                  {t("tool.pdf-editor.undo")}
                </Button>
              </div>
            </div>

            {activeTool === "text" && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/10 p-2 text-xs">
                <span className="font-medium text-muted-foreground">
                  {t("tool.pdf-editor.color")}
                </span>
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTextColor(c)}
                    className={cn(
                      "h-6 w-6 rounded-full ring-1 ring-inset ring-black/10",
                      textColor === c && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                    style={{ background: c }}
                  />
                ))}
                <span className="ml-2 font-medium text-muted-foreground">
                  {t("tool.pdf-editor.size")}
                </span>
                <div className="w-28">
                  <Slider
                    value={[textSize]}
                    min={10}
                    max={48}
                    step={1}
                    onValueChange={(v: number[]) => setTextSize(v[0])}
                  />
                </div>
              </div>
            )}

            {activeTool === "highlight" && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/10 p-2 text-xs">
                <span className="font-medium text-muted-foreground">
                  {t("tool.pdf-editor.color")}
                </span>
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHighlightColor(c)}
                    className={cn(
                      "h-6 w-6 rounded-full ring-1 ring-inset ring-black/10",
                      highlightColor === c &&
                        "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            )}

            {activeTool === "pen" && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/10 p-2 text-xs">
                <span className="font-medium text-muted-foreground">
                  {t("tool.pdf-editor.color")}
                </span>
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="h-6 w-8 cursor-pointer rounded border-none bg-transparent"
                />
                <span className="ml-2 font-medium text-muted-foreground">
                  {t("tool.pdf-editor.width")}
                </span>
                <div className="w-28">
                  <Slider
                    value={[penWidth]}
                    min={1}
                    max={12}
                    step={1}
                    onValueChange={(v: number[]) => setPenWidth(v[0])}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-center overflow-auto rounded-xl border bg-muted/20 p-4">
              <div
                className="relative select-none shadow-lg"
                style={{ width: pageSize.width || undefined, height: pageSize.height || undefined }}
              >
                <canvas ref={canvasRef} className="block" />
                <div
                  ref={overlayRef}
                  className="absolute inset-0"
                  style={{
                    cursor:
                      activeTool === "select"
                        ? hoveredExistingIndex !== null
                          ? "text"
                          : "default"
                        : "crosshair",
                  }}
                  onMouseDown={onOverlayMouseDown}
                  onMouseMove={onOverlayMouseMove}
                  onMouseUp={finishDrag}
                  onMouseLeave={() => {
                    finishDrag();
                    setHoveredExistingIndex(null);
                  }}
                >
                  {activeTool === "select" && hoveredExistingIndex !== null && (
                    <div
                      className="pointer-events-none absolute rounded-sm ring-2 ring-primary/70"
                      style={{
                        left: existingTextItems[hoveredExistingIndex].left - 2,
                        top: existingTextItems[hoveredExistingIndex].top - 2,
                        width: existingTextItems[hoveredExistingIndex].width + 4,
                        height: existingTextItems[hoveredExistingIndex].height + 4,
                      }}
                    />
                  )}

                  {pageAnnotations.map((a) => {
                    if (a.type === "text") {
                      return (
                        <div
                          key={a.id}
                          className="group absolute flex items-start gap-1"
                          style={{ left: a.x, top: a.y }}
                        >
                          {activeTool === "select" && (
                            <span
                              onMouseDown={(e) => startDragText(e, a)}
                              className="mt-1 cursor-move rounded bg-background/80 p-0.5 opacity-0 ring-1 ring-border group-hover:opacity-100"
                            >
                              <GripVertical className="h-3 w-3" />
                            </span>
                          )}
                          <div
                            contentEditable={activeTool === "select"}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              updateAnnotation(a.id, { text: e.currentTarget.textContent ?? "" });
                              setEditingId(null);
                            }}
                            ref={(el) => {
                              if (el && editingId === a.id) el.focus();
                            }}
                            className="min-w-[2ch] whitespace-pre px-0.5 outline-none ring-1 ring-transparent focus:ring-primary/50"
                            style={{
                              fontSize: a.fontSize,
                              color: a.color,
                              lineHeight: 1.2,
                            }}
                          >
                            {a.text}
                          </div>
                          {activeTool === "select" && (
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={() => removeAnnotation(a.id)}
                              className="mt-1 rounded bg-background/80 p-0.5 opacity-0 ring-1 ring-border group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    }
                    if (a.type === "rect") {
                      return (
                        <div
                          key={a.id}
                          className="group absolute"
                          style={{ left: a.x, top: a.y, width: a.w, height: a.h }}
                        >
                          <div
                            className="h-full w-full"
                            style={{
                              background: a.color,
                              opacity: a.mode === "whiteout" ? 1 : 0.4,
                            }}
                          />
                          {activeTool === "select" && (
                            <button
                              type="button"
                              onClick={() => removeAnnotation(a.id)}
                              className="absolute -right-2 -top-2 rounded-full bg-background p-0.5 opacity-0 ring-1 ring-border group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    }
                    return (
                      <svg key={a.id} className="pointer-events-none absolute inset-0 h-full w-full">
                        <path
                          d={strokePathD(a.points)}
                          fill="none"
                          stroke={a.color}
                          strokeWidth={a.lineWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    );
                  })}

                  {draftRect && (
                    <div
                      className="pointer-events-none absolute"
                      style={{
                        left: draftRect.x,
                        top: draftRect.y,
                        width: draftRect.w,
                        height: draftRect.h,
                        background: activeTool === "whiteout" ? "#ffffff" : highlightColor,
                        opacity: activeTool === "whiteout" ? 1 : 0.4,
                      }}
                    />
                  )}
                  {draftStroke && (
                    <svg className="pointer-events-none absolute inset-0 h-full w-full">
                      <path
                        d={strokePathD(draftStroke)}
                        fill="none"
                        stroke={penColor}
                        strokeWidth={penWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}

                  {rendering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-sm text-muted-foreground">
                      {t("tool.pdf-editor.rendering")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {numPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1 || rendering}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {numPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= numPages || rendering}
                  onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-6">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/10 px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-red-500 to-rose-600 text-white">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {numPages} {t("tool.split-pdf.pages")}
                </span>
              </div>
            </div>
            {numPages > 1 && (
              <div className="flex min-h-0 flex-col gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("tool.pdf-editor.pagesLabel")}
                </Label>
                <div className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto rounded-lg border bg-muted/10 p-2 sm:grid-cols-4 lg:grid-cols-2">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-md border p-1 transition-colors",
                        currentPage === pageNum
                          ? "border-primary ring-2 ring-primary/40"
                          : "border-transparent hover:border-border",
                      )}
                    >
                      <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded bg-white shadow-sm">
                        {thumbnails[pageNum - 1] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnails[pageNum - 1]}
                            alt={`Page ${pageNum}`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{pageNum}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Label className="text-[11px] text-muted-foreground">
              {t("tool.pdf-editor.hint")}
            </Label>
            <ToolActionBar
              primaryLabel={t("action.download")}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={exportPdf}
              primaryDisabled={exporting}
              onReset={handleReset}
              resetLabel={t("tool.pdf-editor.changeFile")}
            />
          </div>
        </div>
      )}
    </ToolShell>
  );
}
