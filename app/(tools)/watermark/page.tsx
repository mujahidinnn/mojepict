"use client";

import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Download, ImageIcon, Trash2, Type } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function WatermarkPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const [bgImage, setBgImage] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null,
  );

  const [watermarkText, setWatermarkText] = useState("© mojepict");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(24);
  const [opacity, setOpacity] = useState(0.9);
  const [fontFamily, setFontFamily] = useState("sans-serif");

  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [isDraggingText, setIsDraggingText] = useState(false);

  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [watermarkImgElement, setWatermarkImgElement] =
    useState<HTMLImageElement | null>(null);

  const [imgPos, setImgPos] = useState({ x: 50, y: 50 });
  const [imgSize, setImgSize] = useState({ width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  const handleImageUpload = (file: File) => {
    if (allowedTypes.includes(file.type)) {
      const url = URL.createObjectURL(file);
      setBgImage(url);
      const img = new Image();
      img.onload = () => setImageElement(img);
      img.src = url;
    } else {
      toast({
        variant: "destructive",
        description: t("toast.error.unsupported"),
      });
    }
  };

  const handleWatermarkImageUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setWatermarkImage(url);
    const img = new Image();
    img.onload = () => {
      setWatermarkImgElement(img);
      setImgSize({ width: img.width * 0.2, height: img.height * 0.2 });
    };
    img.src = url;
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !imageElement) return;

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageElement, 0, 0);

    if (watermarkImgElement) {
      ctx.globalAlpha = opacity;
      ctx.drawImage(
        watermarkImgElement,
        imgPos.x,
        imgPos.y,
        imgSize.width,
        imgSize.height,
      );
      ctx.globalAlpha = 1;
    }

    if (watermarkText.trim() !== "") {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = textColor;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillText(watermarkText, textPos.x, textPos.y);
      ctx.globalAlpha = 1;
    }

    // Downscaled snapshot for the Slider's touch-drag magnifier bubble (see
    // components/ui/slider.tsx) - scaling down here, instead of calling
    // toDataURL on the full-resolution canvas, keeps this cheap even while
    // dragging over a large source photo.
    if (!thumbCanvasRef.current) thumbCanvasRef.current = document.createElement("canvas");
    const thumb = thumbCanvasRef.current;
    const thumbScale = 96 / Math.max(canvas.width, canvas.height);
    thumb.width = Math.max(1, Math.round(canvas.width * thumbScale));
    thumb.height = Math.max(1, Math.round(canvas.height * thumbScale));
    const tctx = thumb.getContext("2d");
    if (tctx) {
      tctx.clearRect(0, 0, thumb.width, thumb.height);
      tctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
      setSnapshotUrl(thumb.toDataURL());
    }
  }, [
    imageElement,
    watermarkImgElement,
    imgPos,
    imgSize,
    watermarkText,
    textColor,
    fontSize,
    opacity,
    fontFamily,
    textPos,
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (
      watermarkImgElement &&
      x >= imgPos.x &&
      x <= imgPos.x + imgSize.width &&
      y >= imgPos.y &&
      y <= imgPos.y + imgSize.height
    ) {
      setIsDragging(true);
      dragOffset.current = { x: x - imgPos.x, y: y - imgPos.y };
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.font = `${fontSize}px ${fontFamily}`;
      const textWidth = ctx.measureText(watermarkText).width;
      if (
        x >= textPos.x &&
        x <= textPos.x + textWidth &&
        y >= textPos.y - fontSize &&
        y <= textPos.y
      ) {
        setIsDraggingText(true);
        dragOffset.current = { x: x - textPos.x, y: y - textPos.y };
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (isDragging)
      setImgPos({ x: x - dragOffset.current.x, y: y - dragOffset.current.y });
    else if (isDraggingText)
      setTextPos({ x: x - dragOffset.current.x, y: y - dragOffset.current.y });
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = "mojepict-watermark.png";
    link.click();
    toast({
      title: t("common.success"),
      description: t("toast.success.downloaded"),
    });
  };

  const getCanvasBlob = (): Promise<Blob | null> =>
    new Promise((resolve) =>
      canvasRef.current ? canvasRef.current.toBlob(resolve, "image/png") : resolve(null),
    );

  const loupePreview = snapshotUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={snapshotUrl} alt="" className="h-full w-full object-cover" />
  ) : null;

  const handleReset = () => {
    setBgImage(null);
    setImageElement(null);
    setWatermarkImage(null);
    setWatermarkImgElement(null);
  };

  return (
    <ToolShell
      title={t("tool.watermark.name") || "Watermark"}
      description={
        t("tool.watermark.description") ||
        "Add text or logo watermarks to your images locally."
      }
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Type className="h-3 w-3" /> Text Watermark
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter text..."
                  />
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-12 p-1 h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="h-3 w-3" /> Logo Watermark
                </Label>
                <Dropzone
                  onFile={handleWatermarkImageUpload}
                  title={watermarkImage ? "Change Logo" : "Upload Logo"}
                  className="min-h-[100px] p-4"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs font-medium">Font Size</Label>
                    <span className="text-xs font-mono">{fontSize}px</span>
                  </div>
                  <Slider
                    value={[fontSize]}
                    min={10}
                    max={150}
                    step={1}
                    onValueChange={(val: number[]) => setFontSize(val[0])}
                    previewContent={loupePreview}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs font-medium">Opacity</Label>
                    <span className="text-xs font-mono">
                      {Math.round(opacity * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[opacity]}
                    min={0.1}
                    max={1}
                    step={0.05}
                    onValueChange={(val: number[]) => setOpacity(val[0])}
                    previewContent={loupePreview}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Font Family</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans-serif">Sans-serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="monospace">Monospace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <ToolActionBar
              primaryLabel={t("action.download")}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={handleDownload}
              primaryDisabled={!bgImage}
              onReset={bgImage ? handleReset : undefined}
            >
              <CopyImageButton getBlob={getCanvasBlob} disabled={!bgImage} />
              {watermarkImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 gap-1 text-xs text-destructive"
                  onClick={() => {
                    setWatermarkImage(null);
                    setWatermarkImgElement(null);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  {t("common.remove-logo")}
                </Button>
              )}
            </ToolActionBar>

            <p className="text-[10px] text-muted-foreground text-center bg-muted/50 p-2 rounded border italic">
              * Tip: Drag text or logo on the canvas to reposition.
            </p>
          </>
        }
      >
        {bgImage ? (
          <ImageZoomPreview>
            <canvas
              ref={canvasRef}
              className="shadow-2xl border bg-white max-w-full h-auto cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={() => {
                setIsDragging(false);
                setIsDraggingText(false);
              }}
              onMouseLeave={() => {
                setIsDragging(false);
                setIsDraggingText(false);
              }}
            />
          </ImageZoomPreview>
        ) : (
          <Dropzone
            onFile={handleImageUpload}
            accept=".jpg,.jpeg,.png,.webp"
            title={t("common.upload-click")}
            subtitle={t("common.upload-drag")}
          />
        )}
      </ToolWorkspace>
    </ToolShell>
  );
}
