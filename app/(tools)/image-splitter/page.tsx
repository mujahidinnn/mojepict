"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Download, Grid3X3, Loader2 } from "lucide-react";
import Image from "next/image";

export default function ImageSplitterPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [image, setImage] = useState<string | null>(null);
  const [grid, setGrid] = useState({ cols: 3, rows: 3 });
  const [pieces, setPieces] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  const splitImage = useCallback(() => {
    if (!image || !sourceImageRef.current) return;
    setIsProcessing(true);

    const img = sourceImageRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pieceW = img.naturalWidth / grid.cols;
    const pieceH = img.naturalHeight / grid.rows;

    canvas.width = pieceW;
    canvas.height = pieceH;

    const newPieces: string[] = [];

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        ctx.clearRect(0, 0, pieceW, pieceH);
        ctx.drawImage(
          img,
          c * pieceW,
          r * pieceH,
          pieceW,
          pieceH,
          0,
          0,
          pieceW,
          pieceH,
        );
        newPieces.push(canvas.toDataURL("image/png"));
      }
    }

    setPieces(newPieces);
    setIsProcessing(false);
  }, [grid, image]);

  useEffect(() => {
    if (image) {
      const img = new window.Image();
      img.src = image;
      img.onload = () => {
        sourceImageRef.current = img;
        splitImage();
      };
    }
  }, [image, splitImage]);

  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setImage(url);
    setPieces([]);
  };

  const downloadAll = () => {
    pieces.forEach((src, i) => {
      const link = document.createElement("a");
      link.href = src;
      link.download = `mojepict-grid-${i + 1}.png`;
      link.click();
    });
    toast({
      title: t("common.success"),
      description: t("toast.success.downloaded"),
    });
  };

  const clearAll = () => {
    setImage(null);
    setPieces([]);
    sourceImageRef.current = null;
  };

  // Cheap grid-lines-over-source-image overlay for the Slider's touch-drag
  // magnifier bubble (see components/ui/slider.tsx) - the real split re-runs
  // full canvas slicing per grid change already, so the bubble reuses the
  // untouched source image instead of doubling that cost on every drag tick.
  const loupePreview = useMemo(() => {
    if (!image) return null;
    return (
      <div className="relative h-full w-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
            gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
          }}
        >
          {Array.from({ length: grid.cols * grid.rows }, (_, i) => (
            <div key={i} className="border border-white/70" />
          ))}
        </div>
      </div>
    );
  }, [image, grid.cols, grid.rows]);

  return (
    <ToolShell
      title={t("tool.image-splitter.name")}
      description={t("tool.image-splitter.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-6 text-left">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2">
                <Grid3X3 className="h-4 w-4 text-primary" /> Grid Configuration
              </Label>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold">
                    {t("tool.image-splitter.cols")}
                  </span>
                  <span className="text-2xl font-black text-primary leading-none">
                    {grid.cols}
                  </span>
                </div>
                <Slider
                  value={[grid.cols]}
                  min={1}
                  max={6}
                  step={1}
                  onValueChange={([v]) => setGrid({ ...grid, cols: v })}
                  className="py-2"
                  previewContent={loupePreview}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold">
                    {t("tool.image-splitter.rows")}
                  </span>
                  <span className="text-2xl font-black text-primary leading-none">
                    {grid.rows}
                  </span>
                </div>
                <Slider
                  value={[grid.rows]}
                  min={1}
                  max={6}
                  step={1}
                  onValueChange={([v]) => setGrid({ ...grid, rows: v })}
                  className="py-2"
                  previewContent={loupePreview}
                />
              </div>
            </div>

            <ToolActionBar
              primaryLabel={t("tool.image-splitter.download-all")}
              primaryIcon={<Download className="h-5 w-5" />}
              onPrimary={downloadAll}
              primaryDisabled={pieces.length === 0 || isProcessing}
              resetLabel={t("common.clear")}
              onReset={clearAll}
              resetDisabled={!image}
            />
          </>
        }
      >
        {image ? (
          <ImageZoomPreview>
            {pieces.length > 0 && !isProcessing ? (
              <div
                className="grid gap-2 max-w-3xl mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
                }}
              >
                {pieces.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square w-32 border-2 border-white/10 shadow-md overflow-hidden rounded-md animate-in fade-in zoom-in-95 duration-300"
                  >
                    <Image
                      src={src}
                      alt={`Grid Piece ${i + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium animate-pulse text-muted-foreground">
                  {t("state.loading")}
                </p>
              </div>
            )}
          </ImageZoomPreview>
        ) : (
          <Dropzone
            onFile={handleUpload}
            title={t("common.upload-click")}
            subtitle="Supports JPG, PNG, WEBP"
          />
        )}
      </ToolWorkspace>
    </ToolShell>
  );
}
