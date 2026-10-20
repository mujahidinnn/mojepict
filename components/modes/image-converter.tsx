"use client";

import { convertedName } from "@/lib/converter-formats";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { toPngBlob } from "@/lib/copy-image";
import { buildIco, resizeToPngBytes } from "@/lib/ico";

type OutputFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/x-icon"
  | "image/svg+xml"
  | "image/avif";

const FORMAT_LABELS: Record<OutputFormat, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/x-icon": "ICO",
  "image/svg+xml": "SVG",
  "image/avif": "AVIF",
};

const ID_TO_MIME: Record<string, OutputFormat> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  ico: "image/x-icon",
  svg: "image/svg+xml",
  avif: "image/avif",
};

/** `to` (format id) and `initialFile` are supplied by the Universal Converter hub. */
export default function ImageConverterPage({
  to,
  initialFile,
}: {
  to?: string;
  initialFile?: File;
} = {}) {
  const { t } = useI18n();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pickedFormat, setOutputFormat] = useState<OutputFormat>("image/webp");
  const outputFormat = (to && ID_TO_MIME[to]) || pickedFormat;
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  const fileToDataUri = (f: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(f);
    });

  const downloadBlob = useCallback(
    (blob: Blob, ext: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = convertedName(file?.name, ext);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setResultBlob(blob);
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
          title: t("common.error"),
          description: t("toast.error.unsupported"),
          variant: "destructive",
        });
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast({
          title: t("common.error"),
          description: t("toast.error.tooLarge"),
          variant: "destructive",
        });
        return;
      }
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      const url = URL.createObjectURL(f);
      previewRef.current = url;
      setFile(f);
      setPreview(url);
      setResultBlob(null);
    },
    [toast, t],
  );

  useEffect(() => {
    if (initialFile) handleFile(initialFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  const convert = useCallback(async () => {
    if (!file) return;
    setConverting(true);
    setProgress(10);

    const objectUrl = URL.createObjectURL(file);
    try {
      const img = new window.Image();
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
        downloadBlob(blob, "svg");
        return;
      }

      // ICO: one 256×256 PNG frame, letterboxed so the aspect ratio survives.
      if (outputFormat === "image/x-icon") {
        const png = await resizeToPngBytes(img, 256);
        const ico = buildIco([{ size: 256, data: png }]);
        downloadBlob(new Blob([new Uint8Array(ico) as BlobPart], { type: "image/x-icon" }), "ico");
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      // JPEG has no alpha; transparent pixels would otherwise turn black.
      if (outputFormat === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);

      setProgress(70);

      // No browser can encode AVIF via canvas.toBlob yet, so it goes through a WASM encoder instead.
      if (outputFormat === "image/avif") {
        const { encodeAvif } = await import("@/lib/avif-encode");
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const buffer = await encodeAvif(imageData);
        downloadBlob(new Blob([buffer], { type: "image/avif" }), "avif");
        return;
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, outputFormat, 0.92),
      );
      if (!blob) throw new Error("Conversion failed");
      downloadBlob(blob, FORMAT_LABELS[outputFormat].toLowerCase());
    } catch {
      toast({
        title: t("common.error"),
        description: t("toast.error.generic"),
        variant: "destructive",
      });
      setConverting(false);
      setProgress(0);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }, [file, outputFormat, toast, t, downloadBlob]);

  const clearFile = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setFile(null);
    setPreview(null);
    setResultBlob(null);
  };

  return (
    <ToolShell
      title={t("tool.image-converter.name")}
      description={t("tool.image-converter.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className={`flex flex-col gap-2 text-left${to ? " hidden" : ""}`}>
              <Label htmlFor="format-select" className="text-sm font-medium">
                {t("media.outputFormat")}
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
                <div className="space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Progress value={progress} className="h-1.5" />
                </div>
              )}
              <CopyImageButton
                getBlob={() => (resultBlob ? toPngBlob(resultBlob) : Promise.resolve(null))}
                disabled={!resultBlob}
              />
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
            subtitle={t("media.converter.subtitle")}
          />
        )}
      </ToolWorkspace>
    </ToolShell>
  );
}
