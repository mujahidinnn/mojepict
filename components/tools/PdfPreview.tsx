"use client";

import { useEffect, useRef, useState } from "react";
import type { RenderTask } from "pdfjs-dist";
import { cn } from "@/lib/utils";

interface PdfPreviewProps {
  /** Blob URL (or any fetchable URL) pointing at the PDF to render. */
  src: string;
  className?: string;
  /** Intrinsic render width in CSS px the page is rasterized at before it scales down responsively. */
  maxWidth?: number;
}

// Mobile browsers have no built-in PDF viewer for <iframe>/<embed>, so a blob
// URL just renders blank there (desktop browsers cover for this gap, which is
// why it's easy to miss). Rasterizing the first page via pdf.js instead works
// everywhere.
export function PdfPreview({ src, className, maxWidth = 640 }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        const data = await fetch(src).then((r) => r.arrayBuffer());
        if (cancelled) return;
        const doc = await pdfjsLib.getDocument({ data }).promise;
        const page = await doc.getPage(1);
        if (cancelled) return;

        const unscaled = page.getViewport({ scale: 1 });
        const scale = Math.min(maxWidth / unscaled.width, 1.5);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        // Cancel any still-running render before starting a new one - two
        // renders racing on the same <canvas> throws in pdf.js.
        renderTaskRef.current?.cancel();
        const renderTask = page.render({ canvasContext: ctx, viewport, transform } as never);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (renderTaskRef.current === renderTask) renderTaskRef.current = null;
      } catch (err) {
        const name = (err as { name?: string } | undefined)?.name;
        if (name === "RenderingCancelledException") return;
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [src, maxWidth]);

  if (failed) return null;

  return <canvas ref={canvasRef} className={cn("bg-white", className)} />;
}
