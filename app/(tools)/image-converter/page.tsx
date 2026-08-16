"use client";

import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
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
import { Download } from "lucide-react";
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
  };

  return (
    <ToolShell
      title={t("tool.image-converter.name")}
      description={t("tool.image-converter.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
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

            <ToolActionBar
              primaryLabel={converting ? t("state.converting") : t("action.convert")}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={convert}
              primaryDisabled={!file || converting}
              resetLabel={t("action.clear")}
              onReset={clearFile}
              resetDisabled={!file}
            >
              {converting && (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Progress value={progress} className="h-1.5" />
                </div>
              )}
            </ToolActionBar>
          </>
        }
      >
        {file && preview ? (
          <ImageZoomPreview>
            <div className="flex flex-col items-center gap-2">
              <Image
                src={preview}
                alt="Preview"
                width={800}
                height={600}
                unoptimized
                className="max-h-[360px] w-auto object-contain rounded-lg"
              />
              <p className="text-xs text-muted-foreground">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </ImageZoomPreview>
        ) : (
          <Dropzone
            onFile={handleFile}
            title={t("action.dropzone")}
            subtitle="JPG, PNG, WebP, GIF, ICO, SVG · Max 10 MB"
          />
        )}
      </ToolWorkspace>
    </ToolShell>
  );
}
