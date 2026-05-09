"use client";

import { useRef, useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  Upload,
  Copy,
  RotateCcw,
  Pipette,
  ZoomIn,
  ZoomOut,
  MousePointer2,
  X,
} from "lucide-react";
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
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [confirmClear, setConfirmClear] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  const drawImage = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  };

  useEffect(() => {
    drawImage();
  }, [zoom, offset]);

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
      const aspectRatio = img.width / img.height;
      const maxHeight = 500;
      const height = maxHeight;
      const width = height * aspectRatio;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;

      setZoom(1);
      setOffset({ x: 0, y: 0 });
      drawImage();
    };
    img.src = URL.createObjectURL(file);
    setImageFile(file);
    setPickedColor(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clickX * scaleX - offset.x) / zoom;
    const y = (clickY * scaleY - offset.y) / zoom;

    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;
    tempCtx.drawImage(img, 0, 0);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ description: t("toast.success.copied") });
    });
  };

  const handleReset = () => {
    setImageFile(null);
    setPickedColor(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setConfirmClear(false);
  };

  return (
    <>
      <ToolShell
        title={t("tool.color-picker-image.name") || "Color Picker from Image"}
        description={
          t("tool.color-picker-image.description") ||
          "Pick any color from your photos directly in the browser."
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="flex flex-col items-center gap-4">
            {!imageFile ? (
              <Card
                className="w-full border-dashed cursor-pointer hover:bg-accent/50 transition-colors group"
                onClick={() => inputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      handleImageUpload(e.target.files[0])
                    }
                    className="hidden"
                    ref={inputRef}
                  />
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">{t("common.upload-click")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("common.upload-drag")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="relative w-full border rounded-xl overflow-hidden bg-muted/20 shadow-inner flex flex-col items-center p-4 min-h-[400px]">
                <canvas
                  ref={canvasRef}
                  className="rounded shadow-2xl cursor-crosshair bg-white max-w-full h-auto"
                  onClick={handleCanvasClick}
                  onMouseDown={(e) => {
                    setIsPanning(true);
                    setStartPan({
                      x: e.clientX - offset.x,
                      y: e.clientY - offset.y,
                    });
                  }}
                  onMouseMove={(e) => {
                    if (!isPanning) return;
                    setOffset({
                      x: e.clientX - startPan.x,
                      y: e.clientY - startPan.y,
                    });
                  }}
                  onMouseUp={() => setIsPanning(false)}
                  onMouseLeave={() => setIsPanning(false)}
                />
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((z) => Math.min(z + 0.2, 5))}
                  >
                    <ZoomIn className="h-4 w-4 mr-1" /> In
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((z) => Math.max(z - 0.2, 0.2))}
                  >
                    <ZoomOut className="h-4 w-4 mr-1" /> Out
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmClear(true)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" /> {t("action.reset")}
                  </Button>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                  <MousePointer2 className="h-3 w-3" /> Click to pick color •
                  Drag to pan • Scroll to zoom
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
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
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmClear(true)}
              disabled={!imageFile}
            >
              <X className="h-4 w-4 mr-2" /> {t("common.clear")}
            </Button>
          </div>
        </div>
      </ToolShell>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm-title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.confirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-white"
            >
              {t("action.reset")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
