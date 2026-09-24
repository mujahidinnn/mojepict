"use client";

import { useCallback, useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Dropzone } from "@/components/tools/Dropzone";
import { PdfPreview } from "@/components/tools/PdfPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Download, FileText, Scissors } from "lucide-react";

type SplitMode = "range" | "half";

interface SplitResult {
  name: string;
  url: string;
}

function baseName(name: string) {
  return name.replace(/\.pdf$/i, "");
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
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
  const [results, setResults] = useState<SplitResult[]>([]);

  const revokeResults = (list: SplitResult[]) => {
    list.forEach((r) => URL.revokeObjectURL(r.url));
  };

  // Revoke any generated result object URLs when the component unmounts.
  useEffect(() => {
    return () => {
      setResults((prev) => {
        revokeResults(prev);
        return prev;
      });
    };
  }, []);

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
    setResults((prev) => {
      revokeResults(prev);
      return [];
    });
  };

  const runSplit = useCallback(async () => {
    if (!file || !pageCount) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const name = baseName(file.name);
      const newResults: SplitResult[] = [];

      if (mode === "range") {
        const start = Math.max(1, Math.min(from, pageCount));
        const end = Math.max(start, Math.min(to, pageCount));
        const source = await PDFDocument.load(bytes);
        const out = await PDFDocument.create();
        const indices = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
        const pages = await out.copyPages(source, indices);
        pages.forEach((p) => out.addPage(p));
        const outBytes = await out.save();
        const blob = new Blob([outBytes as BlobPart], { type: "application/pdf" });
        newResults.push({ name: `${name}-p${start}-${end}.pdf`, url: URL.createObjectURL(blob) });
      } else {
        const at = Math.max(1, Math.min(splitAt, pageCount - 1));
        const source1 = await PDFDocument.load(bytes);
        const part1 = await PDFDocument.create();
        const pages1 = await part1.copyPages(
          source1,
          Array.from({ length: at }, (_, i) => i),
        );
        pages1.forEach((p) => part1.addPage(p));
        const part1Bytes = await part1.save();
        const blob1 = new Blob([part1Bytes as BlobPart], { type: "application/pdf" });
        newResults.push({ name: `${name}-part1.pdf`, url: URL.createObjectURL(blob1) });

        const source2 = await PDFDocument.load(bytes);
        const part2 = await PDFDocument.create();
        const pages2 = await part2.copyPages(
          source2,
          Array.from({ length: pageCount - at }, (_, i) => at + i),
        );
        pages2.forEach((p) => part2.addPage(p));
        const part2Bytes = await part2.save();
        const blob2 = new Blob([part2Bytes as BlobPart], { type: "application/pdf" });
        newResults.push({ name: `${name}-part2.pdf`, url: URL.createObjectURL(blob2) });
      }

      setResults((prev) => {
        revokeResults(prev);
        return newResults;
      });

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

            {results.length > 0 && (
              <div className="flex flex-col gap-4">
                {results.map((result) => (
                  <div key={result.url} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{result.name}</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="shrink-0 gap-2"
                        onClick={() => triggerDownload(result.url, result.name)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t("action.download")}
                      </Button>
                    </div>
                    <PdfPreview src={result.url} className="w-full rounded-lg border" />
                  </div>
                ))}
                {results.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => results.forEach((r) => triggerDownload(r.url, r.name))}
                  >
                    <Download className="h-4 w-4" />
                    {t("tool.split-pdf.downloadAll")}
                  </Button>
                )}
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
