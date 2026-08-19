"use client";

import { useRef, useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload, Copy, Pipette, MousePointer2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function ColorPickerImagePage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pickedColor, setPickedColor] = useState<{
    hex: string;
    rgb: string;
    hsl: string;
  } | null>(null);
  const [magnifier, setMagnifier] = useState<{
    x: number;
    y: number;
    imgX: number;
    imgY: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  const drawImage = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };

  const handleImageUpload = (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("toast.error.unsupported"),
      });
      return;
    }

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;

      drawImage();
    };
    img.src = URL.createObjectURL(file);
    setImageFile(file);
    setPickedColor(null);
  };

  /** Maps a mouse event to image-native pixel coordinates, or null if outside the image. */
  const getImageCoords = (e: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return null;

    const rect = canvas.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = clickX * scaleX;
    const y = clickY * scaleY;

    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return null;
    return { x, y };
  };

  /** Offscreen canvas holding the raw source image at native resolution, for pixel sampling. */
  const getSourceCanvas = (): HTMLCanvasElement | null => {
    const img = imgRef.current;
    if (!img) return null;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return null;
    tempCtx.drawImage(img, 0, 0);
    return tempCanvas;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const coords = getImageCoords(e);
    if (!coords) return;
    const { x, y } = coords;

    const tempCanvas = getSourceCanvas();
    const tempCtx = tempCanvas?.getContext("2d");
    if (!tempCtx) return;

    const pixel = tempCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    const hex =
      "#" +
      [pixel[0], pixel[1], pixel[2]]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");

    const r = pixel[0] / 255,
      g = pixel[1] / 255,
      b = pixel[2] / 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

    setPickedColor({ hex, rgb, hsl });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const coords = getImageCoords(e);
    if (!coords) {
      setMagnifier(null);
      return;
    }
    setMagnifier({
      x: e.clientX,
      y: e.clientY,
      imgX: coords.x,
      imgY: coords.y,
    });
  };

  useEffect(() => {
    const magnifierCanvas = magnifierCanvasRef.current;
    if (!magnifier || !magnifierCanvas) return;

    const img = imgRef.current;
    if (!img) return;

    const tempCanvas = getSourceCanvas();
    const tempCtx = tempCanvas?.getContext("2d");
    if (!tempCtx) return;

    const SAMPLE = 17; // odd, so there's a well-defined center pixel
    const HALF = Math.floor(SAMPLE / 2);
    const centerX = Math.floor(magnifier.imgX);
    const centerY = Math.floor(magnifier.imgY);

    const sx = Math.max(0, Math.min(img.width - SAMPLE, centerX - HALF));
    const sy = Math.max(0, Math.min(img.height - SAMPLE, centerY - HALF));
    const sw = Math.min(SAMPLE, img.width);
    const sh = Math.min(SAMPLE, img.height);

    const sample = tempCtx.getImageData(sx, sy, sw, sh);

    const magCtx = magnifierCanvas.getContext("2d");
    if (!magCtx) return;

    magCtx.imageSmoothingEnabled = false;
    magCtx.clearRect(0, 0, magnifierCanvas.width, magnifierCanvas.height);

    // Paint the sampled block via an intermediate canvas so it can be
    // scaled up blockily (drawImage from ImageData isn't directly
    // supported, so putImageData onto a same-size canvas first).
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = sw;
    sampleCanvas.height = sh;
    const sampleCtx = sampleCanvas.getContext("2d");
    if (!sampleCtx) return;
    sampleCtx.putImageData(sample, 0, 0);

    magCtx.drawImage(
      sampleCanvas,
      0,
      0,
      sw,
      sh,
      0,
      0,
      magnifierCanvas.width,
      magnifierCanvas.height,
    );

    // Crosshair marking the exact pixel that will be picked on click.
    const cx = ((centerX - sx + 0.5) / sw) * magnifierCanvas.width;
    const cy = ((centerY - sy + 0.5) / sh) * magnifierCanvas.height;
    magCtx.strokeStyle = "rgba(255,255,255,0.9)";
    magCtx.lineWidth = 1;
    magCtx.beginPath();
    magCtx.moveTo(cx - 6, cy);
    magCtx.lineTo(cx + 6, cy);
    magCtx.moveTo(cx, cy - 6);
    magCtx.lineTo(cx, cy + 6);
    magCtx.stroke();
    magCtx.strokeStyle = "rgba(0,0,0,0.6)";
    magCtx.lineWidth = 1;
    magCtx.strokeRect(cx - 0.5, cy - 0.5, 1, 1);
  }, [magnifier]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ description: t("toast.success.copied") });
    });
  };

  const handleReset = () => {
    setImageFile(null);
    setPickedColor(null);
    setMagnifier(null);
  };

  return (
    <ToolShell
      title={t("tool.color-picker-image.name") || "Color Picker from Image"}
      description={
        t("tool.color-picker-image.description") ||
        "Pick any color from your photos directly in the browser."
      }
    >
      <ToolWorkspace
        sidebar={
          <>
            <Card>
              <CardHeader className="py-4 px-4 border-b bg-muted/30">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Pipette className="h-4 w-4" />{" "}
                  {t("tool.color-picker-image.result") || "Picked Color"}
                </h3>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center gap-4">
                {pickedColor ? (
                  <>
                    <div
                      className="w-20 h-20 rounded-xl border-4 border-white shadow-lg"
                      style={{ backgroundColor: pickedColor.hex }}
                    />
                    <div className="w-full space-y-3">
                      {[
                        { label: "HEX", value: pickedColor.hex },
                        { label: "RGB", value: pickedColor.rgb },
                        { label: "HSL", value: pickedColor.hsl },
                      ].map((item) => (
                        <div key={item.label} className="flex flex-col gap-1">
                          <Label className="text-[10px] uppercase text-muted-foreground">
                            {item.label}
                          </Label>
                          <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md border group">
                            <code className="text-xs font-mono">
                              {item.value}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(item.value)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center text-muted-foreground italic text-sm">
                    {t("tool.color-picker-image.hint") ||
                      "Click on image to select color"}
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            <ToolActionBar
              resetLabel={t("common.clear")}
              onReset={imageFile ? handleReset : undefined}
            />
          </>
        }
      >
        {imageFile ? (
          <>
            <ImageZoomPreview>
              <canvas
                ref={canvasRef}
                className="rounded shadow-2xl cursor-crosshair bg-white max-w-full h-auto"
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={() => setMagnifier(null)}
              />
            </ImageZoomPreview>
            <p className="mt-2 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <MousePointer2 className="h-3 w-3" /> Click to pick color • Use
              the zoom controls to scale the view
            </p>

            {magnifier && (
              <div
                className="pointer-events-none fixed z-50 rounded-full border-2 border-white shadow-2xl overflow-hidden"
                style={{
                  left: magnifier.x + 24,
                  top: magnifier.y - 144,
                  width: 120,
                  height: 120,
                }}
              >
                <canvas
                  ref={magnifierCanvasRef}
                  width={120}
                  height={120}
                  className="bg-white"
                />
              </div>
            )}
          </>
        ) : (
          <Dropzone
            onFile={handleImageUpload}
            accept=".jpg,.jpeg,.png,.webp"
            title={t("common.upload-click")}
            subtitle={t("common.upload-drag")}
            icon={<Upload className="h-6 w-6 text-primary" />}
          />
        )}
      </ToolWorkspace>
    </ToolShell>
  );
}
