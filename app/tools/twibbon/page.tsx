"use client";

import { ToolShell } from "@/components/tools/ToolShell";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import {
  Download,
  Image as ImageIcon,
  Layers,
  MousePointer2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function TwibbonPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const twibbonInputRef = useRef<HTMLInputElement>(null);

  const [photoElement, setPhotoElement] = useState<HTMLImageElement | null>(
    null,
  );
  const [twibbonElement, setTwibbonElement] = useState<HTMLImageElement | null>(
    null,
  );

  const [photoPos, setPhotoPos] = useState({ x: 100, y: 100 });
  const [photoSize, setPhotoSize] = useState({ width: 600, height: 600 });
  const [photoFilter, setPhotoFilter] = useState("none");

  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [confirmClear, setConfirmClear] = useState(false);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (photoElement) {
      ctx.save();
      ctx.filter = photoFilter;
      ctx.drawImage(
        photoElement,
        photoPos.x,
        photoPos.y,
        photoSize.width,
        photoSize.height,
      );
      ctx.restore();
    }

    if (twibbonElement) {
      ctx.drawImage(twibbonElement, 0, 0, canvas.width, canvas.height);
    }
  }, [photoElement, twibbonElement, photoPos, photoSize, photoFilter]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPhotoElement(img);
      toast({ description: t("toast.success.downloaded") });
    };
    img.src = url;
  };

  const handleTwibbonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/png") {
      toast({
        variant: "destructive",
        description: "Twibbon must be a transparent PNG.",
      });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setTwibbonElement(img);
    img.src = url;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = canvasRef.current.width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    if (
      x >= photoPos.x &&
      x <= photoPos.x + photoSize.width &&
      y >= photoPos.y &&
      y <= photoPos.y + photoSize.height
    ) {
      setIsDragging(true);
      dragOffset.current = { x: x - photoPos.x, y: y - photoPos.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = canvasRef.current.width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    setPhotoPos({ x: x - dragOffset.current.x, y: y - dragOffset.current.y });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!photoElement) return;
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setPhotoSize((prev) => ({
      width: Math.max(50, prev.width * (1 + delta)),
      height: Math.max(50, prev.height * (1 + delta)),
    }));
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = "mojepict-twibbon.png";
    link.click();
    toast({ title: t("common.success") });
  };

  const handleReset = () => {
    setPhotoElement(null);
    setTwibbonElement(null);
    setConfirmClear(false);
  };

  return (
    <>
      <ToolShell
        title={t("tool.twibbon.name") || "Twibbon Maker"}
        description={
          t("tool.twibbon.description") ||
          "Create personalized profile frames easily."
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative border-4 border-background shadow-2xl rounded-lg overflow-hidden bg-muted/20 aspect-square w-full max-w-[540px]">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onWheel={handleWheel}
                className="w-full h-full cursor-move bg-muted/20"
              />
              {!photoElement && !twibbonElement && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6 text-center pointer-events-none">
                  <ImageIcon className="h-12 w-12 mb-4" />
                  <p className="text-sm">
                    Upload a Twibbon and your Photo to start
                  </p>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-2">
              <MousePointer2 className="h-3 w-3" /> Drag photo to move • Scroll
              to zoom
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Layers className="h-3 w-3" /> Step 1: Twibbon
                </Label>
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => twibbonInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />{" "}
                  {twibbonElement ? "Change Twibbon" : "Upload PNG Frame"}
                </Button>
                <input
                  type="file"
                  accept="image/png"
                  ref={twibbonInputRef}
                  onChange={handleTwibbonUpload}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="h-3 w-3" /> Step 2: Your Photo
                </Label>
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />{" "}
                  {photoElement ? "Change Photo" : "Upload Image"}
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Photo Filter
                </Label>
                <Select value={photoFilter} onValueChange={setPhotoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Normal</SelectItem>
                    <SelectItem value="grayscale(100%)">B&W</SelectItem>
                    <SelectItem value="sepia(100%)">Sepia</SelectItem>
                    <SelectItem value="brightness(1.2) contrast(1.1)">
                      Vibrant
                    </SelectItem>
                    <SelectItem value="contrast(1.5) brightness(0.8)">
                      Dramatic
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleDownload}
                disabled={!photoElement || !twibbonElement}
              >
                <Download className="h-4 w-4" /> {t("action.download")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setConfirmClear(true)}
              >
                <RotateCcw className="h-3 w-3 mr-2" /> {t("action.reset")}
              </Button>
            </div>
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
