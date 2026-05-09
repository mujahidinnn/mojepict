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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Download, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

type OutputFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/x-icon"
  | "image/svg+xml";

const FORMAT_LABELS: Record<OutputFormat, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/x-icon": "ICO",
  "image/svg+xml": "SVG",
};

export default function ImageConverterPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/webp");
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);

  const fileToDataUri = (f: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(f);
    });

  const downloadBlob = useCallback(
    (blob: Blob, ext: string, objectUrlToRevoke: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file?.name.split(".")[0] || "image"}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      URL.revokeObjectURL(objectUrlToRevoke);

      setProgress(100);
      toast({
        title: t("common.success"),
        description: t("toast.success.converted"),
      });
      setTimeout(() => {
        setConverting(false);
        setProgress(0);
      }, 600);
    },
    [file, t, toast],
  );

  const handleFile = useCallback(
    (f: File) => {
      if (!f.type.startsWith("image/")) {
        toast({
          title: "Unsupported file",
          description: t("toast.error.unsupported"),
          variant: "destructive",
        });
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: t("toast.error.tooLarge"),
          variant: "destructive",
        });
        return;
      }
      setFile(f);
      setPreview(URL.createObjectURL(f));
    },
    [toast, t],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const convert = useCallback(async () => {
    if (!file) return;
    setConverting(true);
    setProgress(10);

    try {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = objectUrl;
      });

      setProgress(40);

      if (outputFormat === "image/svg+xml") {
        const dataUri = await fileToDataUri(file);
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${img.naturalWidth}" height="${img.naturalHeight}">
          <image width="${img.naturalWidth}" height="${img.naturalHeight}" xlink:href="${dataUri}"/>
        </svg>`;
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        downloadBlob(blob, "svg", objectUrl);
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      if (outputFormat === "image/x-icon") {
        canvas.width = 256;
        canvas.height = 256;
        ctx.drawImage(img, 0, 0, 256, 256);
      } else {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
      }

      setProgress(70);

      const mimeType =
        outputFormat === "image/x-icon" ? "image/png" : outputFormat;

      canvas.toBlob(
        (blob) => {
          if (!blob) throw new Error("Conversion failed");
          const ext =
            outputFormat === "image/x-icon"
              ? "ico"
              : FORMAT_LABELS[outputFormat].toLowerCase();
          downloadBlob(blob, ext, objectUrl);
        },
        mimeType,
        0.92,
      );
    } catch (err) {
      toast({
        title: t("common.error"),
        description: t("toast.error.generic"),
        variant: "destructive",
      });
      setConverting(false);
      setProgress(0);
    }
  }, [file, outputFormat, toast, t, downloadBlob]);

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setConfirmClear(false);
  };

  return (
    <>
      <ToolShell
        title={t("tool.image-converter.name")}
        description={t("tool.image-converter.description")}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div
            className={cn(
              "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed",
              "min-h-[280px] transition-colors cursor-pointer overflow-hidden",
              file
                ? "border-border bg-muted/30"
                : "border-border hover:border-foreground/30 hover:bg-muted/20",
            )}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() =>
              !file && document.getElementById("file-input")?.click()
            }
          >
            <input
              id="file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
            />

            {file && preview ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                <div className="relative h-64 w-full">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    unoptimized
                    className="rounded-lg object-contain"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {file.name} · {(file.size / 1024).toFixed(0)} KB
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-7 w-7 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmClear(true);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{t("action.dropzone")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    JPG, PNG, WebP, GIF, ICO, SVG · Max 10 MB
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 text-left">
              <Label htmlFor="format-select" className="text-xs font-medium">
                Output Format
              </Label>
              <Select
                value={outputFormat}
                onValueChange={(v) => setOutputFormat(v as OutputFormat)}
              >
                <SelectTrigger id="format-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map((fmt) => (
                    <SelectItem key={fmt} value={fmt}>
                      {FORMAT_LABELS[fmt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {converting && (
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Progress value={progress} className="h-1.5" />
              </div>
            )}

            <Button
              className="mt-auto w-full gap-2"
              onClick={convert}
              disabled={!file || converting}
            >
              <Download className="h-4 w-4" />
              {converting ? t("state.converting") : t("action.convert")}
            </Button>
          </div>
        </div>
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
            <AlertDialogAction onClick={clearFile}>
              {t("action.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
