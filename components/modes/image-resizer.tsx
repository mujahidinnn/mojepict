"use client";

import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const previewRef = useRef<string | null>(null);
  const w = Number(width);
  const h = Number(height);
  const validSize = Number.isFinite(w) && Number.isFinite(h) && w >= 1 && h >= 1;

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
    if (keepRatio && origW && origH && Number(v) > 0)
      setHeight(String(Math.round((Number(v) * origH) / origW)));
  };
  const onHeightChange = (v: string) => {
    setHeight(v);
    if (keepRatio && origW && origH && Number(v) > 0)
      setWidth(String(Math.round((Number(v) * origW) / origH)));
  };

  const buildResizedBlob = (mimeType: string): Promise<Blob | null> => {
    if (!file || !preview || !validSize) return Promise.resolve(null);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w);
        canvas.height = Math.round(h);
        canvas
          .getContext("2d")!
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, mimeType);
      };
      img.onerror = () => resolve(null);
      img.src = preview;
    });
  };

  const resize = async () => {
    if (!file) return;
    const blob = await buildResizedBlob(file.type);
    if (!blob) return;
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `resized-${file.name}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast({ title: t("common.success"), description: t("toast.success.downloaded") });
  };

  const getResizedPngBlob = () => buildResizedBlob("image/png");

  const clearFile = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
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
              {file ? `${t("media.compress.original")}: ${origW} × ${origH}px` : t("action.dropzone")}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>{t("media.widthPx")}</Label>
                <Input
                  type="number"
                  value={width}
                  disabled={!file}
                  onChange={(e) => onWidthChange(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("media.heightPx")}</Label>
                <Input
                  type="number"
                  value={height}
                  disabled={!file}
                  onChange={(e) => onHeightChange(e.target.value)}
                />
              </div>
            </div>
            {file && !validSize && (
              <p className="text-xs text-destructive">{t("media.invalidSize")}</p>
            )}
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50">
              <input
                type="checkbox"
                checked={keepRatio}
                disabled={!file}
                onChange={(e) => setKeepRatio(e.target.checked)}
                className={cn("h-4 w-4 rounded border-input accent-primary")}
              />
              {t("media.keepRatio")}
            </label>
            <ToolActionBar
              primaryLabel={t("action.download")}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={resize}
              primaryDisabled={!file || !validSize}
              onReset={file ? clearFile : undefined}
            >
              <CopyImageButton getBlob={getResizedPngBlob} disabled={!file || !validSize} />
            </ToolActionBar>
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
