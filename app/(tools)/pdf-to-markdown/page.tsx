"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Dropzone } from "@/components/tools/Dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { convertPagesToMarkdown } from "@/lib/pdf-to-markdown";
import { renderMarkdown } from "@/lib/markdown-render";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileType,
  Wand2,
} from "lucide-react";

function baseName(name: string) {
  return name.replace(/\.pdf$/i, "");
}

export default function PdfToMarkdownPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [rendering, setRendering] = useState(false);
  const [converting, setConverting] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const previewHtml = useMemo(() => renderMarkdown(markdown), [markdown]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

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
        setSelectedPages(new Set(Array.from({ length: doc.numPages }, (_, i) => i + 1)));
        setMarkdown("");
      } catch {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("tool.pdf-to-markdown.invalidFile"),
        });
      }
    },
    [t, toast],
  );

  // Renders the currently previewed page full-size.
  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;
    setRendering(true);
    (async () => {
      const page = await pdfDoc.getPage(currentPage);
      const unscaled = page.getViewport({ scale: 1 });
      const scale = Math.min(720 / unscaled.width, 900 / unscaled.height, 2.5);
      const viewport = page.getViewport({ scale });

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

      // Cancel any still-running render before starting a new one - two
      // renders racing on the same <canvas> throws in pdf.js.
      renderTaskRef.current?.cancel();
      const renderTask = page.render({ canvasContext: ctx, viewport, transform } as never);
      renderTaskRef.current = renderTask;
      try {
        await renderTask.promise;
      } catch (err) {
        const name = (err as { name?: string } | undefined)?.name;
        if (name === "RenderingCancelledException") return;
        throw err;
      }
      if (renderTaskRef.current === renderTask) renderTaskRef.current = null;
      if (cancelled) return;
      setPageSize({ width: viewport.width, height: viewport.height });
      setRendering(false);
    })();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [pdfDoc, currentPage]);

  // Fills in one low-res thumbnail per page for the page picker, one at a
  // time so the panel is usable immediately on long PDFs.
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

  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) next.delete(pageNum);
      else next.add(pageNum);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedPages(new Set(Array.from({ length: numPages }, (_, i) => i + 1)));
  const selectNone = () => setSelectedPages(new Set());

  const runConvert = useCallback(async () => {
    if (!pdfDoc || selectedPages.size === 0) return;
    setConverting(true);
    try {
      const md = await convertPagesToMarkdown(pdfDoc, [...selectedPages]);
      setMarkdown(md);
      toast({ title: t("common.success"), description: t("toast.success.processed") });
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("toast.error.failed"),
      });
    } finally {
      setConverting(false);
    }
  }, [pdfDoc, selectedPages, t, toast]);

  const copyMarkdown = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    toast({ description: t("toast.success.copied") });
  };

  const downloadMarkdown = () => {
    if (!markdown || !file) return;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName(file.name)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null);
    setNumPages(0);
    setCurrentPage(1);
    setSelectedPages(new Set());
    setMarkdown("");
  };

  return (
    <ToolShell
      title={t("tool.pdf-to-markdown.name")}
      description={t("tool.pdf-to-markdown.description")}
    >
      {!file ? (
        <div className="max-w-xl">
          <Dropzone
            accept="application/pdf"
            onFile={handleFile}
            title={t("tool.pdf-to-markdown.dropzone.title")}
            subtitle={t("tool.pdf-to-markdown.dropzone.subtitle")}
            icon={<FileType className="h-6 w-6 text-primary" />}
            className="min-h-[240px]"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
            <div className="min-w-0 flex flex-col gap-3">
              <div className="flex justify-center overflow-auto rounded-xl border bg-muted/20 p-4">
                <div
                  className="relative select-none shadow-lg"
                  style={{ width: pageSize.width || undefined, height: pageSize.height || undefined }}
                >
                  <canvas ref={canvasRef} className="block" />
                  {rendering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-sm text-muted-foreground">
                      {t("tool.pdf-to-markdown.rendering")}
                    </div>
                  )}
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
                  <FileType className="h-4 w-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {numPages} {t("tool.split-pdf.pages")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("tool.pdf-to-markdown.pagesLabel")}
                  </Label>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={selectAll}>
                      {t("tool.pdf-to-markdown.selectAll")}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={selectNone}>
                      {t("tool.pdf-to-markdown.selectNone")}
                    </Button>
                  </div>
                </div>
                <div className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto rounded-lg border bg-muted/10 p-2 sm:grid-cols-4 lg:grid-cols-2">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
                    const checked = selectedPages.has(pageNum);
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "relative flex flex-col items-center gap-1 rounded-md border p-1 transition-colors",
                          currentPage === pageNum
                            ? "border-primary ring-2 ring-primary/40"
                            : "border-transparent hover:border-border",
                        )}
                      >
                        <span
                          role="checkbox"
                          aria-checked={checked}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePage(pageNum);
                          }}
                          className={cn(
                            "absolute left-1.5 top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded border",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background/80",
                          )}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded bg-white shadow-sm">
                          {thumbnails[pageNum - 1] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumbnails[pageNum - 1]}
                              alt={`Page ${pageNum}`}
                              className={cn("h-full w-full object-contain", !checked && "opacity-40")}
                            />
                          ) : (
                            <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/30" />
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{pageNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <ToolActionBar
                primaryLabel={t("tool.pdf-to-markdown.convert")}
                primaryIcon={<Wand2 className="h-4 w-4" />}
                onPrimary={runConvert}
                primaryDisabled={converting || selectedPages.size === 0}
                onReset={handleReset}
                resetLabel={t("tool.pdf-to-markdown.changeFile")}
              />
            </div>
          </div>

          {markdown && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("tool.pdf-to-markdown.resultLabel")}
                </Label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="pdf-to-markdown-preview"
                      checked={showPreview}
                      onCheckedChange={setShowPreview}
                    />
                    <Label htmlFor="pdf-to-markdown-preview" className="text-sm font-normal">
                      {t("tool.pdf-to-markdown.renderPreview")}
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={copyMarkdown}>
                      <Copy className="h-3.5 w-3.5" />
                      {t("action.copy")}
                    </Button>
                    <Button variant="secondary" size="sm" className="gap-2" onClick={downloadMarkdown}>
                      <Download className="h-3.5 w-3.5" />
                      {t("action.download")}
                    </Button>
                  </div>
                </div>
              </div>
              <Card className="border-2 bg-muted/10">
                {showPreview ? (
                  <div
                    className="min-h-[800px] overflow-auto p-4"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <Textarea
                    readOnly
                    value={markdown}
                    className="min-h-[800px] resize-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
