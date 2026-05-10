"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, Trash2, Grid3X3, Loader2 } from "lucide-react";
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

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
      setPieces([]);
    }
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

  return (
    <ToolShell
      title={t("tool.image-splitter.name")}
      description={t("tool.image-splitter.description")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-4 order-1">
          <Card className="relative border-dashed border-2 min-h-[550px] flex items-center justify-center bg-muted/20 overflow-hidden p-6 shadow-inner hover:border-foreground/30 hover:bg-muted/20 cursor-pointer">
            {!image ? (
              <label className="flex flex-col items-center gap-4 cursor-pointer text-center group w-full py-20">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">
                    {t("common.upload-click")}
                  </p>
                  <p className="text-xs text-muted-foreground italic text-center">
                    Supports JPG, PNG, WEBP
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUpload}
                />
              </label>
            ) : (
              <div
                className="grid gap-2 w-full max-w-3xl mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
                }}
              >
                {pieces.length > 0 && !isProcessing ? (
                  pieces.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-square border-2 border-white/10 shadow-md overflow-hidden rounded-md animate-in fade-in zoom-in-95 duration-300"
                    >
                      <Image
                        src={src}
                        alt={`Grid Piece ${i + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-sm font-medium animate-pulse text-muted-foreground">
                      {t("state.loading")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6 order-2">
          <Card className="p-6 space-y-8 bg-background border-2 shadow-sm sticky top-4">
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
                />
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                className="w-full gap-2 py-6 text-md font-bold shadow-lg shadow-primary/20"
                onClick={downloadAll}
                disabled={pieces.length === 0 || isProcessing}
              >
                <Download className="h-5 w-5" />{" "}
                {t("tool.image-splitter.download-all")}
              </Button>

              {image && (
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:bg-destructive/5 font-medium"
                  onClick={clearAll}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> {t("common.clear")}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </ToolShell>
  );
}
