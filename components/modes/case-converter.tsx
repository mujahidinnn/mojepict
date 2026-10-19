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

/**
 * Splits text into lowercase words on spaces/punctuation (-, _, etc.) and camel
 * boundaries, after stripping diacritics: "Ápa kabar café" -> ["apa","kabar","cafe"].
 */
function toWords(s: string): string[] {
  return s
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

export default function CaseConverterPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [text, setText] = useState("");

  const converters = [
    { name: "lowercase", fn: (s: string) => s.toLowerCase() },
    { name: "UPPERCASE", fn: (s: string) => s.toUpperCase() },
    {
      name: "camelCase",
      fn: (s: string) => toWords(s).map((w, i) => (i === 0 ? w : capitalize(w))).join(""),
    },
    { name: "PascalCase", fn: (s: string) => toWords(s).map(capitalize).join("") },
    { name: "snake_case", fn: (s: string) => toWords(s).join("_") },
    { name: "kebab-case", fn: (s: string) => toWords(s).join("-") },
  ];

  const copyResult = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ description: t("toast.success.copied") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
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
