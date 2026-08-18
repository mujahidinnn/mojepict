"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Upload, Download, Undo2, Eraser } from "lucide-react";

// @ts-ignore
const CanvasDraw = dynamic(
  () => import("react-canvas-draw").then((mod) => mod.default as any),
  { ssr: false },
);

export default function DrawOnImagePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const CanvasDrawComponent = CanvasDraw as any;

  const canvasRef = useRef<any>(null);

  const [bgImage, setBgImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 800, height: 500 });
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushRadius, setBrushRadius] = useState(2);

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
  ];

  const handleImageUpload = (file: File) => {
    if (allowedTypes.includes(file.type)) {
      processFile(file);
    } else {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("toast.error.unsupported"),
      });
    }
  };

  const processFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      setBgImage(url);
    };
    img.src = url;
  };

  const buildFinalCanvas = (): Promise<HTMLCanvasElement | null> => {
    if (!canvasRef.current || !bgImage) return Promise.resolve(null);

    const drawingCanvas = canvasRef.current.canvas.drawing;
    const drawingDataUrl = drawingCanvas.toDataURL("image/png");

    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = imageSize.width;
        finalCanvas.height = imageSize.height;
        const ctx = finalCanvas.getContext("2d");

        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(image, 0, 0, imageSize.width, imageSize.height);
        const drawingImg = new Image();
        drawingImg.onload = () => {
          ctx.drawImage(drawingImg, 0, 0, imageSize.width, imageSize.height);
          resolve(finalCanvas);
        };
        drawingImg.src = drawingDataUrl;
      };
      image.src = bgImage;
    });
  };

  const handleSave = async () => {
    const finalCanvas = await buildFinalCanvas();
    if (!finalCanvas) return;
    const link = document.createElement("a");
    link.href = finalCanvas.toDataURL("image/png");
    link.download = "drawing-mojepict.png";
    link.click();
    toast({
      title: t("common.success"),
      description:
        t("tool.image-draw.success-save") || "Image saved successfully.",
    });
  };

  const getDrawingBlob = async (): Promise<Blob | null> => {
    const finalCanvas = await buildFinalCanvas();
    if (!finalCanvas) return null;
    return new Promise((resolve) => finalCanvas.toBlob(resolve, "image/png"));
  };

  const handleReset = () => {
    setBgImage(null);
    toast({
      description: t("tool.image-draw.reset-msg") || "Canvas has been reset.",
    });
  };

  return (
    <ToolShell
      title={t("tool.image-draw.name")}
      description={t("tool.image-draw.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("tool.image-draw.brush-color")}
                </Label>
                <div className="flex items-center gap-3 p-2 border rounded-md bg-background">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border-none bg-transparent"
                  />
                  <span className="text-sm font-mono uppercase">
                    {brushColor}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("tool.image-draw.brush-size")}
                  </Label>
                  <span className="text-xs font-mono">{brushRadius}px</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={brushRadius}
                  onChange={(e) => setBrushRadius(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            <Separator />

            <ToolActionBar
              primaryLabel={t("tool.image-draw.save")}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={handleSave}
              primaryDisabled={!bgImage}
              onReset={bgImage ? handleReset : undefined}
              resetLabel={t("tool.image-draw.change")}
            >
              <CopyImageButton getBlob={getDrawingBlob} disabled={!bgImage} />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => canvasRef.current?.undo()}
                >
                  <Undo2 className="h-4 w-4" /> {t("common.undo") || "Undo"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:bg-destructive/10"
                  onClick={() => canvasRef.current?.clear()}
                >
                  <Eraser className="h-4 w-4" /> {t("common.clear") || "Clear"}
                </Button>
              </div>
            </ToolActionBar>

            <p className="text-[11px] text-muted-foreground text-center bg-muted/30 p-3 rounded-lg border italic">
              {t("tool.image-draw.footer-note") ||
                "Processing is done 100% in your browser."}
            </p>
          </>
        }
      >
        {bgImage ? (
          <ImageZoomPreview>
            <div
              className="relative shadow-2xl border bg-white"
              style={{
                width: imageSize.width,
                height: imageSize.height,
                maxWidth: "none",
              }}
            >
              <CanvasDrawComponent
                ref={canvasRef}
                imgSrc={bgImage}
                brushColor={brushColor}
                brushRadius={brushRadius}
                canvasWidth={imageSize.width}
                canvasHeight={imageSize.height}
                lazyRadius={0}
                hideGrid
                immediateLoading
              />
            </div>
          </ImageZoomPreview>
        ) : (
          <Dropzone
            onFile={handleImageUpload}
            accept=".jpg,.jpeg,.png,.webp,.svg"
            title={t("common.upload-click")}
            subtitle={`${t("common.upload-drag")} (JPG, PNG, WEBP, SVG)`}
          />
        )}
      </ToolWorkspace>
    </ToolShell>
  );
}
