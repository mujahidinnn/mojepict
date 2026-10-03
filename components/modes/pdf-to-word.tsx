"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Dropzone } from "@/components/tools/Dropzone";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { convertPagesToMarkdown } from "@/lib/pdf-to-markdown";
import { markdownToDocxBlob } from "@/lib/markdown-to-docx";
import { Download, FileType } from "lucide-react";

function baseName(name: string) {
  return name.replace(/\.pdf$/i, "");
}

export default function PdfToWordPage({ initialFile }: { initialFile?: File } = {}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);

  const fail = () =>
    toast({ variant: "destructive", title: t("common.error"), description: t("tool.pdf-to-word.invalidFile") });

  const load = async (f: File) => {
    if (f.type !== "application/pdf") return fail();
    setLoading(true);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      const bytes = await f.arrayBuffer();
      const doc: PDFDocumentProxy = await pdfjsLib.getDocument({ data: bytes }).promise;
      const pages = Array.from({ length: doc.numPages }, (_, i) => i + 1);
      const md = await convertPagesToMarkdown(doc, pages);
      setFile(f);
      setMarkdown(md);
    } catch {
      fail();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialFile) load(initialFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  const download = async () => {
    if (!file) return;
    const blob = await markdownToDocxBlob(markdown);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName(file.name)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolShell title={t("tool.pdf-to-word.name")} description={t("tool.pdf-to-word.description")}>
      {!file ? (
        <Dropzone
          accept="application/pdf"
          onFile={load}
          icon={<FileType className="h-8 w-8" />}
          title={t("tool.pdf-to-word.dropzone.title")}
          subtitle={t("tool.pdf-to-word.dropzone.subtitle")}
        />
      ) : (
        <div className="max-w-screen-lg space-y-4">
          <ToolActionBar
            primaryLabel={t("tool.pdf-to-word.convert")}
            primaryIcon={<Download className="h-4 w-4" />}
            onPrimary={download}
            primaryDisabled={loading}
            resetLabel={t("tool.pdf-to-word.changeFile")}
            onReset={() => {
              setFile(null);
              setMarkdown("");
            }}
          >
            <span className="text-sm text-muted-foreground truncate">{file.name}</span>
          </ToolActionBar>
          <p className="text-sm text-muted-foreground">{t("tool.pdf-to-word.hint")}</p>
          <Card className="bg-muted/10">
            <Textarea
              readOnly
              value={loading ? "" : markdown}
              placeholder={loading ? t("tool.pdf-to-word.extracting") : undefined}
              className="min-h-96 p-4 resize-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </Card>
        </div>
      )}
    </ToolShell>
  );
}
