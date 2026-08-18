"use client";

import { useCallback, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Dropzone } from "@/components/tools/Dropzone";
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
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { ArrowDown, ArrowUp, FileOutput, X } from "lucide-react";

interface ImgEntry {
  id: string;
  file: File;
  preview: string;
}

type PageSize = "auto" | "a4" | "letter";

const PAGE_DIMS: Record<Exclude<PageSize, "auto">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function toPngBytes(img: HTMLImageElement): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  const res = await fetch(dataUrl);
  return new Uint8Array(await res.arrayBuffer());
}

export default function ImageToPdfPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [entries, setEntries] = useState<ImgEntry[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("auto");
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  const addFiles = useCallback(
    (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length) {
        setEntries((prev) => [
          ...prev,
          ...images.map((file) => ({ id: uid(), file, preview: URL.createObjectURL(file) })),
        ]);
      }
    },
    [],
  );

  const move = (index: number, dir: -1 | 1) => {
    setEntries((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const clearAll = () => {
    entries.forEach((e) => URL.revokeObjectURL(e.preview));
    setEntries([]);
  };

  const convert = useCallback(async () => {
    if (!entries.length) return;
    setConverting(true);
    setProgress(5);

    try {
      const pdf = await PDFDocument.create();
      for (let i = 0; i < entries.length; i++) {
        const img = await loadImage(entries[i].preview);
        const pngBytes = await toPngBytes(img);
        const embedded = await pdf.embedPng(pngBytes);

        if (pageSize === "auto") {
          const w = img.naturalWidth * 0.75;
          const h = img.naturalHeight * 0.75;
          const page = pdf.addPage([w, h]);
          page.drawImage(embedded, { x: 0, y: 0, width: w, height: h });
        } else {
          const [pw, ph] = PAGE_DIMS[pageSize];
          const margin = 24;
          const maxW = pw - margin * 2;
          const maxH = ph - margin * 2;
          const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
          const w = img.naturalWidth * scale;
          const h = img.naturalHeight * scale;
          const page = pdf.addPage([pw, ph]);
          page.drawImage(embedded, {
            x: (pw - w) / 2,
            y: (ph - h) / 2,
            width: w,
            height: h,
          });
        }

        setProgress(10 + Math.round(((i + 1) / entries.length) * 80));
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images.pdf";
      a.click();
      URL.revokeObjectURL(url);

      setProgress(100);
      toast({ title: t("common.success"), description: t("toast.success.downloaded") });
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("toast.error.failed"),
      });
    } finally {
      setTimeout(() => {
        setConverting(false);
        setProgress(0);
      }, 500);
    }
  }, [entries, pageSize, t, toast]);

  return (
    <ToolShell
      title={t("tool.image-to-pdf.name")}
      description={t("tool.image-to-pdf.description")}
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <Dropzone
          accept="image/*"
          multiple
          onFiles={addFiles}
          title={t("tool.image-to-pdf.dropzone.title")}
          subtitle={t("tool.image-to-pdf.dropzone.subtitle")}
          icon={<FileOutput className="h-6 w-6 text-primary" />}
          className="min-h-[200px]"
        />

        {entries.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-muted/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.preview}
                    alt={entry.file.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === entries.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => remove(entry.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] font-medium text-white">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.image-to-pdf.pageSize")}
              </Label>
              <Select value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t("tool.image-to-pdf.pageSize.auto")}</SelectItem>
                  <SelectItem value="a4">{t("tool.image-to-pdf.pageSize.a4")}</SelectItem>
                  <SelectItem value="letter">
                    {t("tool.image-to-pdf.pageSize.letter")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {converting && <Progress value={progress} className="h-1.5" />}

            <ToolActionBar
              primaryLabel={t("tool.image-to-pdf.convert")}
              primaryIcon={<FileOutput className="h-4 w-4" />}
              onPrimary={convert}
              primaryDisabled={converting}
              onReset={clearAll}
              resetLabel={t("action.clearAll")}
            />
          </>
        )}
      </div>
    </ToolShell>
  );
}
