"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import {
  TwoColumnLayout,
  InputSection,
  OutputSection,
  ResultCard,
} from "@/components/tools/ToolTemplates";

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
      <TwoColumnLayout>
        <InputSection
          label={t("tool.case-converter.input-label")}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setText("")}
              disabled={!text}
              className="h-8 px-2"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {t("common.clear")}
            </Button>
          }
        >
          <Textarea
            placeholder={t("tool.case-converter.placeholder")}
            className="min-h-96 p-4 resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </InputSection>

        <OutputSection label={t("tool.case-converter.output-label")}>
          {converters.map((conv) => {
            const result = text ? conv.fn(text) : "";
            return (
              <ResultCard
                key={conv.name}
                label={conv.name}
                content={result || "..."}
                onCopy={copyResult}
                disabled={!result}
              />
            );
          })}
        </OutputSection>
      </TwoColumnLayout>
    </ToolShell>
  );
}
