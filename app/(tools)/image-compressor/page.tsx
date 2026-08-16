"use client";

import { useCallback, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import {
  ProcessingMode,
  ProcessingModeToggle,
} from "@/components/tools/ProcessingModeToggle";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, PackageOpen } from "lucide-react";
import Image from "next/image";

type Format = "image/jpeg" | "image/png" | "image/webp";

export default function ImageCompressorPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [mode, setMode] = useState<ProcessingMode>("local");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [origSize, setOrigSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = useCallback(
    (f: File) => {
      if (!f.type.startsWith("image/")) {
        toast({
          title: t("common.error"),
          description: t("toast.error.unsupported"),
          variant: "destructive",
        });
        return;
      }
      setFile(f);
      setOrigSize(f.size);
      setPreview(URL.createObjectURL(f));
      setCompressedSize(null);
    },
    [toast, t],
  );

  const downloadBlob = (blob: Blob, name: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  const compressLocal = () =>
    new Promise<void>((resolve, reject) => {
      if (!file || !preview) return resolve();
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed."));
            setCompressedSize(blob.size);
            downloadBlob(blob, `compressed-${file.name}`);
            resolve();
          },
          "image/jpeg",
          quality / 100,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = preview;
    });

  const compressAi = async () => {
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    form.append("format", format);

    const res = await fetch("/api/compress", { method: "POST", body: form });

    if (res.status === 503) {
      toast({
        variant: "destructive",
        description: t("common.mode.ai.notConfigured"),
      });
      setMode("local");
      return compressLocal();
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? t("toast.error.failed"));
    }

    const compressedBytes = Number(res.headers.get("X-Compressed-Size") ?? 0);
    const blob = await res.blob();
    setCompressedSize(compressedBytes || blob.size);
    const ext = format.split("/")[1];
    downloadBlob(blob, `compressed-${file.name.split(".")[0]}.${ext}`);
  };

  const compress = async () => {
    setIsProcessing(true);
    try {
      await (mode === "ai" ? compressAi() : compressLocal());
      toast({
        title: t("common.success"),
        description: t("toast.success.downloaded"),
      });
    } catch (error) {
      console.error("Compress error:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("toast.error.failed"),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setCompressedSize(null);
  };

  return (
    <ToolShell
      title={t("tool.image-compressor.name")}
      description={t("tool.image-compressor.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <ProcessingModeToggle mode={mode} onChange={setMode} />

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs font-medium">Quality</Label>
                <span className="text-xs font-mono">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                min={10}
                max={100}
                step={1}
                onValueChange={(v: number[]) => setQuality(v[0])}
              />
            </div>

            {mode === "ai" && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Output format</Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as Format)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/jpeg">JPEG</SelectItem>
                    <SelectItem value="image/png">PNG</SelectItem>
                    <SelectItem value="image/webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {file && (
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>Original: {(origSize / 1024).toFixed(1)} KB</span>
                {compressedSize && (
                  <span className="text-green-600">
                    Compressed: {(compressedSize / 1024).toFixed(1)} KB (
                    {Math.round((1 - compressedSize / origSize) * 100)}% smaller)
                  </span>
                )}
              </div>
            )}

            <ToolActionBar
              primaryLabel="Compress & Download"
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={compress}
              primaryDisabled={!file || isProcessing}
              onReset={file ? handleReset : undefined}
            />
          </>
        }
      >
        {preview ? (
          <ImageZoomPreview onRemove={handleReset} removeLabel={t("action.clear")}>
            <Image
              src={preview}
              alt="preview"
              width={640}
              height={480}
              unoptimized
              className="max-h-[420px] w-auto object-contain"
            />
          </ImageZoomPreview>
        ) : (
          <Dropzone
            onFile={handleFile}
            icon={<PackageOpen className="h-6 w-6 text-primary" />}
            title={t("action.dropzone")}
          />
        )}
      </ToolWorkspace>
    </ToolShell>
  );
}
