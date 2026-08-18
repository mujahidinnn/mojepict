"use client";

import { useCallback, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Dropzone } from "@/components/tools/Dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { FileText, Scissors } from "lucide-react";

type SplitMode = "range" | "half";

function baseName(name: string) {
  return name.replace(/\.pdf$/i, "");
}

function triggerDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SplitPdfPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [mode, setMode] = useState<SplitMode>("range");
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);
  const [splitAt, setSplitAt] = useState(1);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(
    async (f: File) => {
      if (f.type !== "application/pdf") {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("toast.error.unsupported"),
        });
        return;
      }
      try {
        const bytes = await f.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const count = doc.getPageCount();
        setFile(f);
        setPageCount(count);
        setFrom(1);
        setTo(count);
        setSplitAt(Math.max(1, Math.floor(count / 2)));
      } catch {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("tool.split-pdf.invalidFile"),
        });
      }
    },
    [t, toast],
  );

  const reset = () => {
    setFile(null);
    setPageCount(null);
  };

  const runSplit = useCallback(async () => {
    if (!file || !pageCount) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const name = baseName(file.name);

      if (mode === "range") {
        const start = Math.max(1, Math.min(from, pageCount));
        const end = Math.max(start, Math.min(to, pageCount));
        const source = await PDFDocument.load(bytes);
        const out = await PDFDocument.create();
        const indices = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
        const pages = await out.copyPages(source, indices);
        pages.forEach((p) => out.addPage(p));
        triggerDownload(await out.save(), `${name}-p${start}-${end}.pdf`);
      } else {
        const at = Math.max(1, Math.min(splitAt, pageCount - 1));
        const source1 = await PDFDocument.load(bytes);
        const part1 = await PDFDocument.create();
        const pages1 = await part1.copyPages(
          source1,
          Array.from({ length: at }, (_, i) => i),
        );
        pages1.forEach((p) => part1.addPage(p));
        triggerDownload(await part1.save(), `${name}-part1.pdf`);

        const source2 = await PDFDocument.load(bytes);
        const part2 = await PDFDocument.create();
        const pages2 = await part2.copyPages(
          source2,
          Array.from({ length: pageCount - at }, (_, i) => at + i),
        );
        pages2.forEach((p) => part2.addPage(p));
        triggerDownload(await part2.save(), `${name}-part2.pdf`);
      }

      toast({ title: t("common.success"), description: t("toast.success.downloaded") });
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("toast.error.failed"),
      });
    } finally {
      setProcessing(false);
    }
  }, [file, pageCount, mode, from, to, splitAt, t, toast]);

  return (
    <ToolShell title={t("tool.split-pdf.name")} description={t("tool.split-pdf.description")}>
      <div className="flex flex-col gap-6 max-w-xl">
        {!file ? (
          <Dropzone
            accept="application/pdf"
            onFile={handleFile}
            title={t("tool.split-pdf.dropzone.title")}
            subtitle={t("tool.split-pdf.dropzone.subtitle")}
            icon={<Scissors className="h-6 w-6 text-primary" />}
            className="min-h-[240px]"
          />
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/10 px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-red-500 to-rose-600 text-white">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {pageCount} {t("tool.split-pdf.pages")}
                </span>
              </div>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as SplitMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="range">{t("tool.split-pdf.mode.range")}</TabsTrigger>
                <TabsTrigger value="half">{t("tool.split-pdf.mode.half")}</TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === "range" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t("tool.split-pdf.from")}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={pageCount ?? 1}
                    value={from}
                    onChange={(e) => setFrom(Number(e.target.value))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t("tool.split-pdf.to")}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={pageCount ?? 1}
                    value={to}
                    onChange={(e) => setTo(Number(e.target.value))}
                    className="h-11"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.split-pdf.splitAfter")}
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={(pageCount ?? 2) - 1}
                  value={splitAt}
                  onChange={(e) => setSplitAt(Number(e.target.value))}
                  className="h-11"
                />
              </div>
            )}

            <ToolActionBar
              primaryLabel={t("tool.split-pdf.split")}
              primaryIcon={<Scissors className="h-4 w-4" />}
              onPrimary={runSplit}
              primaryDisabled={processing}
              onReset={reset}
              resetLabel={t("tool.split-pdf.changeFile")}
            />
          </>
        )}
      </div>
    </ToolShell>
  );
}
