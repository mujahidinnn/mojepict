"use client";

import { useEffect, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Dropzone } from "@/components/tools/Dropzone";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Download, FileText } from "lucide-react";

// A4 at 96dpi.
const PAGE_W = 794;
const PAGE_H = 1123;
const PRINT_CSS = `@page{size:A4;margin:20mm}body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4;margin:0}
h1{font-size:20pt}h2{font-size:16pt}h3{font-size:13pt}p{margin:0 0 8pt}img{max-width:100%}
table{border-collapse:collapse}td,th{border:1px solid #000;padding:4px}tr,img{page-break-inside:avoid}`;

export default function WordToPdfPage({ initialFile }: { initialFile?: File } = {}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [html, setHtml] = useState("");

  const fail = (description: string) =>
    toast({ variant: "destructive", title: t("common.error"), description });

  const load = async (f: File) => {
    if (!/\.docx$/i.test(f.name)) return fail(t("tool.word-to-pdf.invalidFile"));
    try {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() });
      setFile(f);
      setHtml(value);
    } catch {
      fail(t("tool.word-to-pdf.invalidFile"));
    }
  };

  useEffect(() => {
    if (initialFile) load(initialFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  // Prints the HTML from an iframe so the PDF keeps real, selectable text and browser pagination.
  const convert = () => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;width:0;height:0;border:0";
    iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${file?.name.replace(/\.docx$/i, "").replace(/[<>&]/g, "")}</title><style>${PRINT_CSS}</style></head><body>${html}</body></html>`;
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 60_000);
    };
    document.body.appendChild(iframe);
  };

  return (
    <ToolShell title={t("tool.word-to-pdf.name")} description={t("tool.word-to-pdf.description")}>
      {!file ? (
        <Dropzone
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onFile={load}
          icon={<FileText className="h-8 w-8" />}
          title={t("tool.word-to-pdf.dropzone.title")}
          subtitle={t("tool.word-to-pdf.dropzone.subtitle")}
        />
      ) : (
        <div className="space-y-4">
          <ToolActionBar
            primaryLabel={t("tool.word-to-pdf.convert")}
            primaryIcon={<Download className="h-4 w-4" />}
            onPrimary={convert}
            resetLabel={t("tool.word-to-pdf.changeFile")}
            onReset={() => {
              setFile(null);
              setHtml("");
            }}
          >
            <span className="text-sm text-muted-foreground truncate">{file.name}</span>
          </ToolActionBar>
          <p className="text-sm text-muted-foreground">{t("tool.word-to-pdf.hint")}</p>
          <div className="overflow-auto rounded-xl border bg-muted/20 p-4">
            <div
              style={{ width: PAGE_W, minHeight: PAGE_H, padding: 56 }}
              className="mx-auto bg-white text-black shadow [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_p]:my-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_table]:border-collapse [&_td]:border [&_td]:p-1 [&_th]:border [&_th]:p-1 [&_img]:max-w-full [&_a]:text-blue-600 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      )}
    </ToolShell>
  );
}
