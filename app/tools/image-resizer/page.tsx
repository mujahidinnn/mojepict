"use client";

import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Download, Upload } from "lucide-react";
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

  return (
    <ToolShell
      title={t("tool.image-resizer.name")}
      description={t("tool.image-resizer.description")}
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
          onClick={() => document.getElementById("resizer-input")?.click()}
        >
          <input
            id="resizer-input"
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                Original: {origW} × {origH}px
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Width (px)</Label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => onWidthChange(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Height (px)</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => onHeightChange(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepRatio}
                onChange={(e) => setKeepRatio(e.target.checked)}
                className="rounded"
              />
              Keep aspect ratio
            </label>
            <Button onClick={resize} className="gap-2 w-full">
              <Download className="h-4 w-4" />
              {t("action.download")}
            </Button>
          </>
        )}
      </div>
    </ToolShell>
  );
}
