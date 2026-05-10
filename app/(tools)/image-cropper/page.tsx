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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import {
  Crop as CropIcon,
  Download,
  ScanSearch,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState, useCallback } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function onImageLoadCenter(img: HTMLImageElement, aspect: number | undefined) {
  if (aspect) {
    const { width, height } = img;
    return centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
      width,
      height,
    );
  }
}

export default function ImageCropperPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [upImg, setUpImg] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [confirmClear, setConfirmClear] = useState(false);

  const processFile = useCallback((file: File | undefined) => {
    if (file) {
      setFileDetails({ name: file.name, size: file.size, type: file.type });
      const reader = new FileReader();
      reader.onload = () => setUpImg(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    processFile(e.dataTransfer.files?.[0]);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      setCrop(onImageLoadCenter(e.currentTarget, aspect));
    }
  };

  const generateCrop = () => {
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    if (!completedCrop || !canvas || !image) {
      toast({
        title: "Error",
        description: "Please select an area first",
        variant: "destructive",
      });
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    toast({
      title: t("common.success"),
      description: "Preview generated successfully.",
    });
  };

  const downloadCroppedImage = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || canvas.width === 0) return;

    let mimeType = fileDetails?.type || "image/png";

    if (mimeType === "image/svg+xml") {
      mimeType = "image/png";
    }

    const extension = mimeType.split("/")[1].replace("+xml", "");
    const link = document.createElement("a");
    link.download = `cropped-${fileDetails?.name.split(".")[0] || "image"}.${extension}`;
    link.href = canvas.toDataURL(mimeType, 0.92);
    link.click();
  };

  const handleReset = () => {
    setUpImg(null);
    setFileDetails(null);
    setCompletedCrop(null);
    setConfirmClear(false);
  };

  return (
    <>
      <ToolShell
        title={t("tool.image-cropper.name")}
        description={t("tool.image-cropper.description")}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div
            className={cn(
              "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed",
              "min-h-[350px] transition-colors overflow-hidden bg-muted/10",
              upImg
                ? "border-border"
                : "border-border hover:border-foreground/30 hover:bg-muted/20 cursor-pointer",
            )}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() =>
              !upImg && document.getElementById("file-input")?.click()
            }
          >
            <input
              id="file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onSelectFile}
            />

            {upImg ? (
              <div className="p-4 w-full flex flex-col items-center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                >
                  <Image
                    ref={imgRef}
                    src={upImg}
                    alt="Source"
                    width={800}
                    height={500}
                    unoptimized
                    onLoad={onImageLoad}
                    className="max-h-[500px] w-auto object-contain rounded-md"
                  />
                </ReactCrop>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 bg-background/80 backdrop-blur"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmClear(true);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">{t("action.dropzone")}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6 text-left">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider">
                {t("tool.image-cropper.aspect")}
              </Label>
              <Select
                onValueChange={(v) =>
                  setAspect(v === "custom" ? undefined : Number(v))
                }
                defaultValue="custom"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">
                    {t("tool.image-cropper.free")}
                  </SelectItem>
                  <SelectItem value="1">
                    {t("tool.image-cropper.square")}
                  </SelectItem>
                  <SelectItem value={(4 / 3).toString()}>4:3</SelectItem>
                  <SelectItem value={(16 / 9).toString()}>16:9</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <Button
                className="w-full gap-2"
                onClick={generateCrop}
                disabled={!upImg}
              >
                <ScanSearch className="h-4 w-4" /> {t("action.capture")}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={downloadCroppedImage}
                disabled={!completedCrop}
              >
                <Download className="h-4 w-4" /> {t("action.download")}
              </Button>
            </div>
          </div>
        </div>

        {upImg && (
          <Card className="mt-8 overflow-hidden text-left">
            <CardHeader className="py-3 bg-muted/20">
              <CardTitle className="text-sm font-medium">
                {t("tool.image-cropper.preview")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex justify-center">
              <canvas
                ref={previewCanvasRef}
                className="max-w-full h-auto border rounded-md shadow-sm"
              />
            </CardContent>
          </Card>
        )}
      </ToolShell>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.confirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.confirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              {t("action.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
