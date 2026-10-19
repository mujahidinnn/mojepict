"use client";

import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
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
import { Slider } from "@/components/ui/slider";
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

  // photoPos is the photo's center on the 1080×1080 canvas; baseSize covers 600×600 at scale 1.
  const [photoPos, setPhotoPos] = useState({ x: 540, y: 540 });
  const [baseSize, setBaseSize] = useState({ width: 600, height: 600 });
  const [photoScale, setPhotoScale] = useState(1);
  const [photoFilter, setPhotoFilter] = useState("none");
  const photoSize = {
    width: baseSize.width * photoScale,
    height: baseSize.height * photoScale,
  };

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
        photoPos.x - photoSize.width / 2,
        photoPos.y - photoSize.height / 2,
        photoSize.width,
        photoSize.height,
      );
      ctx.restore();
    }

    if (twibbonElement) {
      ctx.drawImage(twibbonElement, 0, 0, canvas.width, canvas.height);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoElement, twibbonElement, photoPos, baseSize, photoScale, photoFilter]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const loadError = () =>
    toast({ variant: "destructive", title: t("common.error"), description: t("toast.error.unsupported") });

  const handlePhotoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const cover = Math.max(600 / img.naturalWidth, 600 / img.naturalHeight);
      setBaseSize({ width: img.naturalWidth * cover, height: img.naturalHeight * cover });
      setPhotoPos({ x: 540, y: 540 });
      setPhotoScale(1);
      setPhotoElement(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setPhotoElement(null);
      loadError();
    };
    img.src = url;
  };

  const handleTwibbonUpload = (file: File) => {
    if (file.type !== "image/png") {
      toast({
        variant: "destructive",
        description: t("media.twibbon.pngOnly"),
      });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      setTwibbonElement(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setTwibbonElement(null);
      loadError();
    };
    img.src = url;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = canvasRef.current.width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    if (
      Math.abs(x - photoPos.x) <= photoSize.width / 2 &&
      Math.abs(y - photoPos.y) <= photoSize.height / 2
    ) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      dragOffset.current = { x: x - photoPos.x, y: y - photoPos.y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
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

  const getCanvasBlob = (): Promise<Blob | null> =>
    new Promise((resolve) =>
      canvasRef.current ? canvasRef.current.toBlob(resolve, "image/png") : resolve(null),
    );

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
                  <Layers className="h-3 w-3" /> {t("media.twibbon.step1")}
                </Label>
                <Dropzone
                  onFile={handleTwibbonUpload}
                  accept="image/png"
                  title={
                    twibbonElement ? t("media.twibbon.changeFrame") : t("media.twibbon.uploadFrame")
                  }
                  subtitle={t("common.upload-drag")}
                  className="min-h-[140px] p-4"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="h-3 w-3" /> {t("media.twibbon.step2")}
                </Label>
                <Dropzone
                  onFile={handlePhotoUpload}
                  accept="image/*"
                  title={photoElement ? t("media.twibbon.changePhoto") : t("media.twibbon.uploadPhoto")}
                  subtitle={t("common.upload-drag")}
                  className="min-h-[140px] p-4"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("media.twibbon.scale")}
                  </Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {Math.round(photoScale * 100)}%
                  </span>
                </div>
                <Slider
                  value={[photoScale]}
                  min={0.2}
                  max={3}
                  step={0.01}
                  disabled={!photoElement}
                  onValueChange={([v]) => setPhotoScale(v)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("media.twibbon.filter")}
                </Label>
                <Select value={photoFilter} onValueChange={setPhotoFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("media.filter.normal")}</SelectItem>
                    <SelectItem value="grayscale(100%)">{t("media.filter.bw")}</SelectItem>
                    <SelectItem value="sepia(100%)">{t("media.filter.sepia")}</SelectItem>
                    <SelectItem value="brightness(1.2) contrast(1.1)">
                      {t("media.filter.vibrant")}
                    </SelectItem>
                    <SelectItem value="contrast(1.5) brightness(0.8)">
                      {t("media.filter.dramatic")}
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
            >
              <CopyImageButton
                getBlob={getCanvasBlob}
                disabled={!photoElement || !twibbonElement}
              />
            </ToolActionBar>
          </>
        }
      >
        <ImageZoomPreview>
          <div className="relative aspect-square w-full max-w-[540px] overflow-hidden rounded-lg border-4 border-background bg-muted/20 shadow-2xl">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setIsDragging(false)}
              onPointerCancel={() => setIsDragging(false)}
              className="w-full h-full cursor-move touch-none bg-muted/20"
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
          <MousePointer2 className="h-3 w-3" /> {t("media.twibbon.hint")}
        </p>
      </ToolWorkspace>
    </ToolShell>
  );
}
