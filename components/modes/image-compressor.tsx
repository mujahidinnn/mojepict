"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import {
  ProcessingMode,
  ProcessingModeToggle,
} from "@/components/tools/ProcessingModeToggle";
import { FormGroup } from "@/components/tools/ToolTemplates";
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
import { toPngBlob } from "@/lib/copy-image";

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
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

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
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      const url = URL.createObjectURL(f);
      previewRef.current = url;
      if (["image/jpeg", "image/png", "image/webp"].includes(f.type)) setFormat(f.type as Format);
      setFile(f);
      setOrigSize(f.size);
      setPreview(url);
      setCompressedSize(null);
      setResultBlob(null);
    },
    [toast, t],
  );

  const downloadBlob = (blob: Blob, name: string) => {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const outName = (f: File, fmt: string) =>
    `compressed-${f.name.replace(/\.[^.]+$/, "")}.${fmt.split("/")[1] === "jpeg" ? "jpg" : fmt.split("/")[1]}`;

  /** Never hand back a bigger file: fall back to the original and say so. */
  const deliver = (blob: Blob, f: File, fmt: string) => {
    setCompressedSize(blob.size);
    if (blob.size >= f.size) {
      setResultBlob(f);
      downloadBlob(f, f.name);
      return false;
    }
    setResultBlob(blob);
    downloadBlob(blob, outName(f, fmt));
    return true;
  };

  const compressLocal = () =>
    new Promise<boolean>((resolve, reject) => {
      if (!file || !preview) return resolve(true);
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        if (format === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error(t("toast.error.failed")));
            resolve(deliver(blob, file, format));
          },
          format,
          quality / 100,
        );
      };
      img.onerror = () => reject(new Error(t("toast.error.unsupported")));
      img.src = preview;
    });

  const compressAi = async (): Promise<boolean> => {
    if (!file) return true;
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

    const blob = await res.blob();
    return deliver(blob, file, format);
  };

  const compress = async () => {
    setIsProcessing(true);
    try {
      const smaller = await (mode === "ai" ? compressAi() : compressLocal());
      toast(
        smaller
          ? { title: t("common.success"), description: t("toast.success.downloaded") }
          : { title: t("media.compress.notSmaller"), description: t("media.compress.notSmallerHint") },
      );
    } catch (error) {
      console.error("Compress error:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error && error.message ? error.message : t("toast.error.failed"),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setFile(null);
    setPreview(null);
    setCompressedSize(null);
    setResultBlob(null);
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

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm font-medium">{t("media.compress.quality")}</Label>
                <span className="text-sm font-mono text-muted-foreground">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                min={10}
                max={100}
                step={1}
                onValueChange={(v: number[]) => setQuality(v[0])}
              />
            </div>

            <FormGroup label={t("media.outputFormat")}>
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
            </FormGroup>

            {file && (
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <span>{t("media.compress.original")}: {(origSize / 1024).toFixed(1)} KB</span>
                {compressedSize !== null &&
                  (compressedSize < origSize ? (
                    <span className="text-success">
                      {t("media.compress.compressed")}: {(compressedSize / 1024).toFixed(1)} KB (
                      {Math.round((1 - compressedSize / origSize) * 100)}% {t("media.compress.smaller")})
                    </span>
                  ) : (
                    <span className="text-warning">{t("media.compress.notSmallerHint")}</span>
                  ))}
              </div>
            )}

            <ToolActionBar
              primaryLabel={t("media.compress.action")}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={compress}
              primaryDisabled={!file || isProcessing}
              onReset={file ? handleReset : undefined}
            >
              <CopyImageButton
                getBlob={() => (resultBlob ? toPngBlob(resultBlob) : Promise.resolve(null))}
                disabled={!resultBlob}
              />
            </ToolActionBar>
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
