"use client";

import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import { useCallback, useState } from "react";

export default function ImageResizerPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);

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
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        setOrigW(img.naturalWidth);
        setOrigH(img.naturalHeight);
        setWidth(String(img.naturalWidth));
        setHeight(String(img.naturalHeight));
      };
      img.src = url;
      setFile(f);
      setPreview(url);
    },
    [toast, t],
  );

  const onWidthChange = (v: string) => {
    setWidth(v);
    if (keepRatio && origW && origH)
      setHeight(String(Math.round((parseInt(v) * origH) / origW)));
  };
  const onHeightChange = (v: string) => {
    setHeight(v);
    if (keepRatio && origW && origH)
      setWidth(String(Math.round((parseInt(v) * origW) / origH)));
  };

  const resize = () => {
    if (!file || !preview) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = parseInt(width) || origW;
      canvas.height = parseInt(height) || origH;
      canvas
        .getContext("2d")!
        .drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `resized-${file.name}`;
        a.click();
        toast({ title: "Done!", description: t("toast.success.downloaded") });
      }, file.type);
    };
    img.src = preview;
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <ToolShell
      title={t("tool.image-resizer.name")}
      description={t("tool.image-resizer.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <p className="text-xs text-muted-foreground">
              {file ? `Original: ${origW} × ${origH}px` : t("action.dropzone")}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Width (px)</Label>
                <Input
                  type="number"
                  value={width}
                  disabled={!file}
                  onChange={(e) => onWidthChange(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Height (px)</Label>
                <Input
                  type="number"
                  value={height}
                  disabled={!file}
                  onChange={(e) => onHeightChange(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50">
              <input
                type="checkbox"
                checked={keepRatio}
                disabled={!file}
                onChange={(e) => setKeepRatio(e.target.checked)}
                className={cn("h-4 w-4 rounded border-input accent-primary")}
              />
              Keep aspect ratio
            </label>
            <ToolActionBar
              primaryLabel={t("action.download")}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={resize}
              primaryDisabled={!file}
              onReset={file ? clearFile : undefined}
            />
          </>
        }
      >
        {file && preview ? (
          <ImageZoomPreview onRemove={clearFile} removeLabel={t("action.clear")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="preview"
              className="max-h-[400px] max-w-full object-contain rounded-lg"
            />
          </ImageZoomPreview>
        ) : (
          <Dropzone onFile={handleFile} title={t("action.dropzone")} />
        )}
      </ToolWorkspace>
    </ToolShell>
  );
}
