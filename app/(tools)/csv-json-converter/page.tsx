"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { ArrowRightLeft, Copy, Download, Table2, Trash2 } from "lucide-react";

type Mode = "csv-to-json" | "json-to-csv";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || r[0] !== "");
}

function csvToJson(text: string): string {
  const rows = parseCsv(text);
  if (rows.length === 0) return "[]";
  const [headers, ...body] = rows;
  const objects = body.map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] ?? "";
    });
    return obj;
  });
  return JSON.stringify(objects, null, 2);
}

function csvField(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function jsonToCsv(text: string): string {
  const parsed = JSON.parse(text);
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  if (arr.length === 0) return "";
  const headers = Array.from(
    arr.reduce((set: Set<string>, obj) => {
      if (obj && typeof obj === "object") {
        Object.keys(obj).forEach((k) => set.add(k));
      }
      return set;
    }, new Set<string>()),
  );
  const lines = [headers.map(csvField).join(",")];
  for (const obj of arr) {
    lines.push(headers.map((h) => csvField(obj?.[h])).join(","));
  }
  return lines.join("\n");
}

export default function CsvJsonConverterPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("csv-to-json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const convert = () => {
    if (!input.trim()) return;
    try {
      const result = mode === "csv-to-json" ? csvToJson(input) : jsonToCsv(input);
      setOutput(result);
      toast({ title: t("common.success"), description: t("toast.success.processed") });
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("tool.csv-json-converter.invalid"),
      });
    }
  };

  const swap = () => {
    setMode((m) => (m === "csv-to-json" ? "json-to-csv" : "csv-to-json"));
    setInput(output);
    setOutput("");
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ description: t("toast.success.copied") });
  };

  const download = () => {
    if (!output) return;
    const ext = mode === "csv-to-json" ? "json" : "csv";
    const blob = new Blob([output], {
      type: ext === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputLabel =
    mode === "csv-to-json" ? "CSV" : t("tool.csv-json-converter.jsonInput");
  const outputLabel =
    mode === "csv-to-json" ? t("tool.csv-json-converter.jsonInput") : "CSV";

  return (
    <ToolShell
      title={t("tool.csv-json-converter.name")}
      description={t("tool.csv-json-converter.description")}
    >
      <div className="flex flex-col gap-4">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="csv-to-json">
              {t("tool.csv-json-converter.csvToJson")}
            </TabsTrigger>
            <TabsTrigger value="json-to-csv">
              {t("tool.csv-json-converter.jsonToCsv")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Table2 className="h-3 w-3" /> {inputLabel}
              </Label>
              <Button variant="ghost" size="sm" onClick={() => setInput("")} disabled={!input}>
                <Trash2 className="h-4 w-4 mr-2" /> {t("common.clear")}
              </Button>
            </div>
            <Textarea
              placeholder={t("tool.csv-json-converter.placeholder")}
              className="min-h-[420px] font-mono text-sm resize-none p-4"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex gap-3">
              <Button className="flex-1 gap-2" onClick={convert} disabled={!input}>
                <ArrowRightLeft className="h-4 w-4" /> {t("action.convert")}
              </Button>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Table2 className="h-3 w-3" /> {outputLabel}
              </Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={swap} disabled={!output}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  {t("tool.csv-json-converter.useAsInput")}
                </Button>
                <Button variant="outline" size="sm" onClick={download} disabled={!output}>
                  <Download className="h-4 w-4 mr-2" /> {t("action.download")}
                </Button>
                <Button variant="outline" size="sm" onClick={copy} disabled={!output}>
                  <Copy className="h-4 w-4 mr-2" /> {t("action.copy")}
                </Button>
              </div>
            </div>
            <Card className="min-h-[420px] bg-muted/10 border-2 overflow-hidden relative">
              <Textarea
                readOnly
                className="min-h-[420px] h-full border-0 bg-transparent font-mono text-sm resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                value={output}
                placeholder="..."
              />
            </Card>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
