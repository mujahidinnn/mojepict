"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, Download, RotateCcw, Undo2, Eraser, X } from "lucide-react";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const [bgImage, setBgImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 800, height: 500 });
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushRadius, setBrushRadius] = useState(2);
  const [confirmClear, setConfirmClear] = useState(false);

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && allowedTypes.includes(file.type)) {
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

  const handleSave = () => {
    if (!canvasRef.current || !bgImage) return;

    const drawingCanvas = canvasRef.current.canvas.drawing;
    const drawingDataUrl = drawingCanvas.toDataURL("image/png");

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = imageSize.width;
      finalCanvas.height = imageSize.height;
      const ctx = finalCanvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(image, 0, 0, imageSize.width, imageSize.height);
        const drawingImg = new Image();
        drawingImg.onload = () => {
          ctx.drawImage(drawingImg, 0, 0, imageSize.width, imageSize.height);
          const finalDataURL = finalCanvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = finalDataURL;
          link.download = "drawing-mojepict.png";
          link.click();
          toast({
            title: t("common.success"),
            description:
              t("tool.image-draw.success-save") || "Image saved successfully.",
          });
        };
        drawingImg.src = drawingDataUrl;
      }
    };
    image.src = bgImage;
  };

  const handleReset = () => {
    setBgImage(null);
    setConfirmClear(false);
    toast({
      description: t("tool.image-draw.reset-msg") || "Canvas has been reset.",
    });
  };

  return (
    <>
      <ToolShell
        title={t("tool.image-draw.name")}
        description={t("tool.image-draw.description")}
      >
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 w-full min-w-0">
            {!bgImage ? (
              <Card
                className="border-dashed cursor-pointer hover:bg-accent/50 transition-colors group"
                onClick={() => inputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.svg"
                    onChange={handleImageUpload}
                    className="hidden"
                    ref={inputRef}
                  />
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">{t("common.upload-click")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("common.upload-drag")} (JPG, PNG, WEBP, SVG)
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="relative border rounded-xl bg-muted/20 shadow-inner flex flex-col items-center justify-center p-4 min-h-[500px] max-h-[85vh] overflow-hidden">
                <div className="w-full h-full overflow-auto flex justify-center custom-scrollbar">
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
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-4 right-4 h-8 w-8 bg-background/80 backdrop-blur hover:bg-destructive hover:text-white z-10 shadow-sm"
                  onClick={() => setConfirmClear(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[280px] flex flex-col gap-6 sticky top-6">
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

            <Button
              className="w-full gap-2"
              onClick={handleSave}
              disabled={!bgImage}
            >
              <Download className="h-4 w-4" /> {t("tool.image-draw.save")}
            </Button>

            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => setConfirmClear(true)}
              disabled={!bgImage}
            >
              <RotateCcw className="h-4 w-4" /> {t("tool.image-draw.change")}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center bg-muted/30 p-3 rounded-lg border italic">
              {t("tool.image-draw.footer-note") ||
                "Processing is done 100% in your browser."}
            </p>
          </div>
        </div>
      </ToolShell>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("common.confirm-title") || "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("tool.image-draw.confirm-desc") ||
                "This will delete all your current sketches."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("tool.image-draw.change")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
