"use client";

import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
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
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function TwibbonPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const handlePhotoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPhotoElement(img);
      toast({ description: t("toast.success.downloaded") });
    };
    img.src = url;
  };

  const handleTwibbonUpload = (file: File) => {
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
  };

  return (
    <ToolShell
      title={t("tool.twibbon.name") || "Twibbon Maker"}
      description={
        t("tool.twibbon.description") ||
        "Create personalized profile frames easily."
      }
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Layers className="h-3 w-3" /> Step 1: Twibbon
                </Label>
                <Dropzone
                  onFile={handleTwibbonUpload}
                  accept="image/png"
                  title={
                    twibbonElement ? "Change Twibbon" : "Upload PNG Frame"
                  }
                  subtitle={t("common.upload-drag")}
                  className="min-h-[140px] p-4"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="h-3 w-3" /> Step 2: Your Photo
                </Label>
                <Dropzone
                  onFile={handlePhotoUpload}
                  accept="image/*"
                  title={photoElement ? "Change Photo" : "Upload Image"}
                  subtitle={t("common.upload-drag")}
                  className="min-h-[140px] p-4"
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

            <ToolActionBar
              primaryLabel={t("action.download")}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={handleDownload}
              primaryDisabled={!photoElement || !twibbonElement}
              onReset={
                photoElement || twibbonElement ? handleReset : undefined
              }
            />
          </>
        }
      >
        <ImageZoomPreview>
          <div className="relative aspect-square w-full max-w-[540px] overflow-hidden rounded-lg border-4 border-background bg-muted/20 shadow-2xl">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              className="w-full h-full cursor-move bg-muted/20"
            />
            {!photoElement && !twibbonElement && (
              <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                <ToolEmptyState
                  icon={<ImageIcon className="h-6 w-6" />}
                  title={t("tool.twibbon.empty")}
                />
              </div>
            )}
          </div>
        </ImageZoomPreview>
        <p className="mt-3 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-2">
          <MousePointer2 className="h-3 w-3" /> Drag photo to move • Use the
          zoom controls to scale the view
        </p>
      </ToolWorkspace>
    </ToolShell>
  );
}
