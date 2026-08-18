"use client";

import { useCallback, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { Dropzone } from "@/components/tools/Dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Copy, Download, Star } from "lucide-react";

const ICO_SIZES = [16, 32, 48];
const PNG_SIZES = [
  { size: 32, name: "favicon-32x32.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 192, name: "android-chrome-192x192.png" },
  { size: 512, name: "android-chrome-512x512.png" },
];

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function resizeToPngBytes(img: HTMLImageElement, size: number): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      const buf = await blob!.arrayBuffer();
      resolve(new Uint8Array(buf));
    }, "image/png");
  });
}

/** Builds a valid .ico by embedding raw PNG frames (supported since Vista). */
function buildIco(frames: { size: number; data: Uint8Array }[]): Uint8Array {
  const headerSize = 6 + frames.length * 16;
  const totalSize = headerSize + frames.reduce((sum, f) => sum + f.data.length, 0);
  const buf = new Uint8Array(totalSize);
  const view = new DataView(buf.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, frames.length, true);

  let offset = headerSize;
  frames.forEach((f, i) => {
    const entry = 6 + i * 16;
    buf[entry] = f.size >= 256 ? 0 : f.size;
    buf[entry + 1] = f.size >= 256 ? 0 : f.size;
    buf[entry + 2] = 0;
    buf[entry + 3] = 0;
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, f.data.length, true);
    view.setUint32(entry + 12, offset, true);
    buf.set(f.data, offset);
    offset += f.data.length;
  });

  return buf;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FaviconGeneratorPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [pngs, setPngs] = useState<Map<number, Uint8Array>>(new Map());
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(
    async (f: File) => {
      if (!f.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("toast.error.unsupported"),
        });
        return;
      }
      setProcessing(true);
      const url = URL.createObjectURL(f);
      try {
        const img = await loadImage(url);
        const sizes = Array.from(new Set([...ICO_SIZES, ...PNG_SIZES.map((p) => p.size)]));
        const map = new Map<number, Uint8Array>();
        for (const size of sizes) {
          map.set(size, await resizeToPngBytes(img, size));
        }
        setPngs(map);
        setPreview(url);
      } catch {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("toast.error.failed"),
        });
      } finally {
        setProcessing(false);
      }
    },
    [t, toast],
  );

  const reset = () => {
    setPreview(null);
    setPngs(new Map());
  };

  const downloadIco = () => {
    const frames = ICO_SIZES.map((size) => ({ size, data: pngs.get(size)! })).filter(
      (f) => f.data,
    );
    download(new Blob([new Uint8Array(buildIco(frames)) as BlobPart], { type: "image/x-icon" }), "favicon.ico");
  };

  const downloadPng = (size: number, name: string) => {
    const data = pngs.get(size);
    if (!data) return;
    download(new Blob([new Uint8Array(data) as BlobPart], { type: "image/png" }), name);
  };

  const getPreviewPngBlob = (): Promise<Blob | null> => {
    const data = pngs.get(512) ?? pngs.get(192);
    if (!data) return Promise.resolve(null);
    return Promise.resolve(new Blob([new Uint8Array(data) as BlobPart], { type: "image/png" }));
  };

  const snippet = `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippet);
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.favicon-generator.name")}
      description={t("tool.favicon-generator.description")}
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        {!preview ? (
          <Dropzone
            onFile={handleFile}
            title={t("tool.favicon-generator.dropzone.title")}
            subtitle={t("tool.favicon-generator.dropzone.subtitle")}
            icon={<Star className="h-6 w-6 text-primary" />}
            className="min-h-[240px]"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PNG_SIZES.map(({ size, name }) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <div
                    className="flex items-center justify-center rounded-lg border p-3"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)",
                      backgroundSize: "12px 12px",
                      backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="" className="h-12 w-12 object-contain" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {size}×{size}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => downloadPng(size, name)}
                    disabled={processing}
                  >
                    <Download className="h-3.5 w-3.5" /> PNG
                  </Button>
                </div>
              ))}
            </div>

            <ToolActionBar
              primaryLabel={t("tool.favicon-generator.downloadIco")}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={downloadIco}
              primaryDisabled={processing}
              onReset={reset}
              resetLabel={t("tool.favicon-generator.changeImage")}
            >
              <CopyImageButton getBlob={getPreviewPngBlob} disabled={processing} />
            </ToolActionBar>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("tool.favicon-generator.htmlSnippet")}
                </Label>
                <Button variant="outline" size="sm" onClick={copySnippet}>
                  <Copy className="h-4 w-4 mr-2" /> {t("action.copy")}
                </Button>
              </div>
              <Textarea
                readOnly
                value={snippet}
                className="min-h-[130px] font-mono text-xs resize-none bg-muted/10"
              />
            </div>
          </>
        )}
      </div>
    </ToolShell>
  );
}
