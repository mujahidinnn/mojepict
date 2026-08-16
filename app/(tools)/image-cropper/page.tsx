"use client";

import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
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
import { Download, ScanSearch } from "lucide-react";
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

  const processFile = useCallback((file: File | undefined) => {
    if (file) {
      setFileDetails({ name: file.name, size: file.size, type: file.type });
      const reader = new FileReader();
      reader.onload = () => setUpImg(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

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
  };

  return (
    <ToolShell
      title={t("tool.image-cropper.name")}
      description={t("tool.image-cropper.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-3 text-left">
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

            <ToolActionBar
              primaryLabel={t("action.capture")}
              primaryIcon={<ScanSearch className="h-4 w-4" />}
              onPrimary={generateCrop}
              primaryDisabled={!upImg}
              resetLabel={t("action.clear")}
              onReset={handleReset}
              resetDisabled={!upImg}
            >
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={downloadCroppedImage}
                disabled={!completedCrop}
              >
                <Download className="h-4 w-4" /> {t("action.download")}
              </Button>
            </ToolActionBar>
          </>
        }
      >
        {upImg ? (
          <ImageZoomPreview>
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
          </ImageZoomPreview>
        ) : (
          <Dropzone onFile={processFile} title={t("action.dropzone")} />
        )}
      </ToolWorkspace>

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
  );
}
