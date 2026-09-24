"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Trash2, Type } from "lucide-react";

export default function CaseConverterPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [text, setText] = useState("");

  const converters = [
    { name: "lowercase", fn: (s: string) => s.toLowerCase() },
    { name: "UPPERCASE", fn: (s: string) => s.toUpperCase() },
    {
      name: "camelCase",
      fn: (s: string) =>
        s
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase(),
          )
          .replace(/\s+/g, ""),
    },
    {
      name: "PascalCase",
      fn: (s: string) =>
        s
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
          .replace(/\s+/g, ""),
    },
    {
      name: "snake_case",
      fn: (s: string) =>
        s
          .match(
            /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g,
          )
          ?.map((x) => x.toLowerCase())
          .join("_") || "",
    },
    {
      name: "kebab-case",
      fn: (s: string) =>
        s
          .match(
            /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g,
          )
          ?.map((x) => x.toLowerCase())
          .join("-") || "",
    },
  ];

  const copyResult = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.case-converter.name")}
      description={t("tool.case-converter.description")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Type className="h-3 w-3" />{" "}
              {t("tool.case-converter.input-label")}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setText("")}
              disabled={!text}
            >
              <Trash2 className="h-4 w-4 mr-2" /> {t("common.clear")}
            </Button>
          </div>
          <Textarea
            placeholder={t("tool.case-converter.placeholder")}
            className="min-h-[400px] resize-none text-base p-4"
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setText(e.target.value)
            }
          />
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            {t("tool.case-converter.output-label")}
          </Label>
          <div className="grid grid-cols-1 gap-3">
            {converters.map((conv) => {
              const result = text ? conv.fn(text) : "";
              return (
                <Card
                  key={conv.name}
                  className="p-4 flex items-center justify-between bg-muted/20 border-2"
                >
                  <div className="flex flex-col gap-1 overflow-hidden mr-4">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {conv.name}
                    </span>
                    <p className="text-sm truncate">{result || "..."}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => copyResult(result)}
                    disabled={!result}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
