"use client";

import { useCallback, useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Dropzone } from "@/components/tools/Dropzone";
import { PdfPreview } from "@/components/tools/PdfPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { ArrowDown, ArrowUp, Download, FileText, Merge, X } from "lucide-react";
import { TwoColumnLayout, InputSection, OutputSection } from "@/components/tools/ToolTemplates";

interface PdfEntry {
  id: string;
  file: File;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MergePdfPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [entries, setEntries] = useState<PdfEntry[]>([]);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Revoke the generated result's object URL when the component unmounts.
  useEffect(() => {
    return () => {
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return prev;
      });
    };
  }, []);

  const addFiles = useCallback(
    (files: File[]) => {
      const pdfs = files.filter((f) => f.type === "application/pdf");
      if (pdfs.length !== files.length) {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("toast.error.unsupported"),
        });
      }
      if (pdfs.length) {
        setEntries((prev) => [...prev, ...pdfs.map((file) => ({ id: uid(), file }))]);
      }
    },
    [t, toast],
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

  const resetAll = () => {
    setEntries([]);
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const downloadMerged = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "merged.pdf";
    a.click();
  };

  const merge = useCallback(async () => {
    if (entries.length < 2) return;
    setMerging(true);
    setProgress(5);

    try {
      const merged = await PDFDocument.create();
      for (let i = 0; i < entries.length; i++) {
        const bytes = await entries[i].file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
        setProgress(10 + Math.round(((i + 1) / entries.length) * 80));
      }

      const mergedBytes = await merged.save();
      const blob = new Blob([mergedBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });

      setProgress(100);
      toast({ title: t("common.success"), description: t("toast.success.downloaded") });
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("tool.merge-pdf.invalidFile"),
      });
    } finally {
      setTimeout(() => {
        setMerging(false);
        setProgress(0);
      }, 500);
    }
  }, [entries, t, toast]);

  return (
    <ToolShell title={t("tool.merge-pdf.name")} description={t("tool.merge-pdf.description")}>
      <div className="max-w-screen-lg flex flex-col gap-8">
        <TwoColumnLayout>
          <InputSection label="Files">
            <Dropzone
              accept="application/pdf"
              multiple
              onFiles={addFiles}
              title={t("tool.merge-pdf.dropzone.title")}
              subtitle={t("tool.merge-pdf.dropzone.subtitle")}
              icon={<Merge className="h-6 w-6 text-primary" />}
              className="min-h-[200px]"
            />

            {entries.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("tool.merge-pdf.fileCount").replace("{{count}}", String(entries.length))}
                </p>
                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-lg border bg-muted/10 p-4"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-red-500 to-rose-600 text-white">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{entry.file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(entry.file.size)}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          disabled={index === entries.length - 1}
                          onClick={() => move(index, 1)}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          onClick={() => remove(entry.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </InputSection>

          <OutputSection label="Result">
            {merging && <Progress value={progress} className="h-1.5" />}
            {resultUrl && (
              <>
                <Card className="p-6 flex items-center justify-between bg-muted/10">
                  <div className="flex-1 overflow-hidden pr-4">
                    <p className="text-sm font-medium truncate">merged.pdf</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={downloadMerged}
                    className="h-9 w-9 shrink-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </Card>
                <PdfPreview src={resultUrl} className="w-full rounded-lg border" />
              </>
            )}
          </OutputSection>
        </TwoColumnLayout>

        <ToolActionBar
          primaryLabel={t("tool.merge-pdf.merge")}
          primaryIcon={<Merge className="h-4 w-4" />}
          onPrimary={merge}
          primaryDisabled={entries.length < 2 || merging}
          onReset={entries.length ? resetAll : undefined}
          resetLabel={t("action.clearAll")}
        >
          {entries.length === 1 && (
            <p className="text-center text-xs text-muted-foreground">
              {t("tool.merge-pdf.needTwo")}
            </p>
          )}
        </ToolActionBar>
      </div>
    </ToolShell>
  );
}
