"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImageCompressorPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [origSize, setOrigSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const handleFile = useCallback(
    (f: File) => {
      if (!f.type.startsWith("image/")) {
        toast({
          title: "Unsupported",
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

  const compress = () => {
    if (!file || !preview) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          setCompressedSize(blob.size);
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `compressed-${file.name}`;
          a.click();
          toast({ title: "Done!", description: t("toast.success.downloaded") });
        },
        "image/jpeg",
        quality / 100,
      );
    };
    img.src = preview;
  };

  return (
    <ToolShell
      title={t("tool.image-compressor.name")}
      description={t("tool.image-compressor.description")}
    >
      <div className="flex flex-col gap-6 max-w-xl">
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed min-h-[200px] cursor-pointer hover:bg-muted/20 transition-colors",
          )}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("compressor-input")?.click()}
        >
          <input
            id="compressor-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && handleFile(e.target.files[0])
            }
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="preview"
              className="max-h-48 max-w-full object-contain rounded-lg"
            />
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("action.dropzone")}
              </p>
            </>
          )}
        </div>

        {file && (
          <>
            <div className="flex flex-col gap-2">
              <Label>Quality: {quality}%</Label>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full accent-foreground"
              />
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span>Original: {(origSize / 1024).toFixed(1)} KB</span>
              {compressedSize && (
                <span className="text-green-600">
                  Compressed: {(compressedSize / 1024).toFixed(1)} KB (
                  {Math.round((1 - compressedSize / origSize) * 100)}% smaller)
                </span>
              )}
            </div>
            <Button onClick={compress} className="gap-2 w-full">
              <Download className="h-4 w-4" />
              Compress & Download
            </Button>
          </>
        )}
      </div>
    </ToolShell>
  );
}
