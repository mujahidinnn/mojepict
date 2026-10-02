"use client";

import { useEffect, useState } from "react";
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

const ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

async function hash(algorithm: string, text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(algorithm, bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function HashGeneratorPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!text) {
      setHashes({});
      return;
    }
    let cancelled = false;
    Promise.all(ALGORITHMS.map((algo) => hash(algo, text))).then((results) => {
      if (cancelled) return;
      setHashes(Object.fromEntries(ALGORITHMS.map((algo, i) => [algo, results[i]])));
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  const copyHash = (value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.hash-generator.name")}
      description={t("tool.hash-generator.description")}
    >
      <TwoColumnLayout>
        <InputSection
          label="Text"
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
            placeholder={t("tool.hash-generator.placeholder")}
            className="min-h-96 p-4 resize-none font-mono"
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          />
        </InputSection>

        <OutputSection label="Hashes">
          {ALGORITHMS.map((algo) => (
            <ResultCard
              key={algo}
              label={algo}
              content={hashes[algo] ?? "..."}
              onCopy={copyHash}
              disabled={!hashes[algo]}
            />
          ))}
        </OutputSection>
      </TwoColumnLayout>
    </ToolShell>
  );
}
