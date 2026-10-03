"use client";

import { useEffect, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Dropzone } from "@/components/tools/Dropzone";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Download, FileSpreadsheet } from "lucide-react";
import type { FormatId } from "@/lib/converter-formats";

/** `to`, `onSwap` and `initialFile` are supplied by the Universal Converter hub. */
export default function ExcelCsvConverterPage({
  to,
  initialFile,
}: {
  to?: FormatId;
  onSwap?: () => void;
  initialFile?: File;
} = {}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const target = to === "xlsx" ? "xlsx" : "csv";
  const [file, setFile] = useState<File | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sheet, setSheet] = useState<any>(null);
  const [rows, setRows] = useState<string[][]>([]);

  const fail = () =>
    toast({ variant: "destructive", title: t("common.error"), description: t("tool.excel-csv-converter.invalidFile") });

  const load = async (f: File) => {
    try {
      const XLSX = await import("xlsx");
      const data = await f.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      setFile(f);
      setSheet(ws);
      setRows(XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }).slice(0, 20) as string[][]);
    } catch {
      fail();
    }
  };

  useEffect(() => {
    if (initialFile) load(initialFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  const baseName = file?.name.replace(/\.(xlsx|xls|csv)$/i, "") ?? "converted";

  const download = async () => {
    if (!sheet) return;
    const XLSX = await import("xlsx");
    if (target === "csv") {
      const csv = XLSX.utils.sheet_to_csv(sheet);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
      const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <ToolShell
      title={t("tool.excel-csv-converter.name")}
      description={t("tool.excel-csv-converter.description")}
    >
      {!file ? (
        <Dropzone
          accept=".xlsx,.xls,.csv"
          onFile={load}
          icon={<FileSpreadsheet className="h-8 w-8" />}
          title={t("tool.excel-csv-converter.dropzone.title")}
          subtitle={t("tool.excel-csv-converter.dropzone.subtitle")}
        />
      ) : (
        <div className="max-w-screen-lg space-y-4">
          <ToolActionBar
            primaryLabel={t(target === "csv" ? "tool.excel-csv-converter.toCsv" : "tool.excel-csv-converter.toExcel")}
            primaryIcon={<Download className="h-4 w-4" />}
            onPrimary={download}
            resetLabel={t("tool.excel-csv-converter.changeFile")}
            onReset={() => {
              setFile(null);
              setSheet(null);
              setRows([]);
            }}
          >
            <span className="text-sm text-muted-foreground truncate">{file.name}</span>
          </ToolActionBar>
          <Card className="overflow-auto">
            <table className="w-full text-sm">
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={i === 0 ? "bg-muted/40 font-medium" : "border-t"}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 whitespace-nowrap">
                        {String(cell ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          {rows.length === 20 && (
            <p className="text-xs text-muted-foreground">{t("tool.excel-csv-converter.previewLimited")}</p>
          )}
        </div>
      )}
    </ToolShell>
  );
}
