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
import { useRef, useState } from "react";
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
  } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [confirmClear, setConfirmClear] = useState(false);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileDetails({ name: file.name, size: file.size });
      const reader = new FileReader();
      reader.onload = () => setUpImg(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileDetails({ name: file.name, size: file.size });
      const reader = new FileReader();
      reader.onload = () => setUpImg(reader.result as string);
      reader.readAsDataURL(file);
    }
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
        description: "Lakukan seleksi area terlebih dahulu",
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
      title: "Preview Updated",
      description: "Hasil crop sudah siap diunduh.",
    });
  };

  const downloadCroppedImage = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || canvas.width === 0) {
      toast({
        title: "Gagal",
        description: "Klik 'Crop & Preview' terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const link = document.createElement("a");
    link.download = `cropped-${fileDetails?.name || "image"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleReset = () => {
    setUpImg(null);
    setFileDetails(null);
    setCompletedCrop(null);
    setConfirmClear(false);
    if (previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext("2d");
      ctx?.clearRect(
        0,
        0,
        previewCanvasRef.current.width,
        previewCanvasRef.current.height,
      );
    }
  };

  return (
    <>
      <ToolShell
        title="Image Cropper"
        description="Potong dan sesuaikan ukuran gambar Anda secara lokal di browser."
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
                  onChange={(c: Crop) => setCrop(c)}
                  onComplete={(c: PixelCrop) => setCompletedCrop(c)}
                  aspect={aspect}
                  className="max-h-[500px]"
                >
                  <Image
                    ref={imgRef}
                    src={upImg}
                    alt="Source"
                    width={800}
                    height={500}
                    unoptimized
                    onLoad={onImageLoad}
                    className="max-h-[500px] w-auto object-contain rounded-md shadow-lg"
                  />
                </ReactCrop>

                <div className="mt-4 flex flex-col items-center gap-1">
                  <p className="text-xs font-medium text-foreground">
                    {fileDetails?.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {(fileDetails!.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 h-8 w-8 bg-background/80 backdrop-blur hover:bg-destructive hover:text-white transition-all"
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
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted shadow-inner">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Klik atau drop gambar di sini
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mendukung format gambar standar
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aspect Ratio
              </Label>
              <Select
                onValueChange={(v) => {
                  const val = v === "custom" ? undefined : Number(v);
                  setAspect(val);
                }}
                defaultValue="custom"
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Pilih Ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Bebas (Custom)</SelectItem>
                  <SelectItem value="1">1:1 (Persegi)</SelectItem>
                  <SelectItem value={(4 / 3).toString()}>4:3</SelectItem>
                  <SelectItem value={(16 / 9).toString()}>16:9</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-2" />

            <div className="space-y-3">
              <Button
                className="w-full gap-2 shadow-sm"
                onClick={generateCrop}
                disabled={!upImg}
              >
                <ScanSearch className="h-4 w-4" />
                Preview Crop
              </Button>

              <Button
                variant="outline"
                className={cn(
                  "w-full gap-2 bg-green-600/10 text-green-600 hover:bg-green-600 hover:text-white border-green-600/20",
                )}
                onClick={downloadCroppedImage}
                disabled={!completedCrop}
              >
                <Download className="h-4 w-4" />
                Download PNG
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center bg-muted/30 p-3 rounded-lg border">
              Pemrosesan dilakukan 100% di browser Anda. Keamanan data terjamin.
            </p>
          </div>
        </div>

        {upImg && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <Card className="overflow-hidden border-none shadow-xl bg-muted/5">
              <CardHeader className="bg-muted/20 border-b py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CropIcon className="h-4 w-4" /> Cropped Result
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex justify-center items-center min-h-[200px]">
                <canvas
                  ref={previewCanvasRef}
                  className="max-w-full h-auto rounded-lg shadow-md border bg-white"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </ToolShell>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Gambar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus gambar saat ini dan semua progres
              cropping Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
