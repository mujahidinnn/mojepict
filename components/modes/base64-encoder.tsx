"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2 } from "lucide-react";
import {
  TwoColumnLayout,
  InputSection,
  OutputSection,
  ResultCard,
} from "@/components/tools/ToolTemplates";

type Mode = "encode" | "decode";

function encodeBase64(text: string) {
  return btoa(unescape(encodeURIComponent(text)));
}

function decodeBase64(text: string) {
  return decodeURIComponent(escape(atob(text)));
}

export default function Base64EncoderPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const { output, isInvalid } = useMemo(() => {
    if (!input) return { output: "", isInvalid: false };
    try {
      return {
        output: mode === "encode" ? encodeBase64(input) : decodeBase64(input),
        isInvalid: false,
      };
    } catch {
      return { output: "", isInvalid: true };
    }
  }, [input, mode]);

  const copyResult = (content: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.base64-encoder.name")}
      description={t("tool.base64-encoder.description")}
    >
      <TwoColumnLayout>
        <InputSection
          label={t("tool.base64-encoder.input-label")}
          action={
            <div className="flex items-center gap-2">
              <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <TabsList className="h-8">
                  <TabsTrigger value="encode" className="text-xs px-3 py-1">
                    {t("tool.base64-encoder.encode")}
                  </TabsTrigger>
                  <TabsTrigger value="decode" className="text-xs px-3 py-1">
                    {t("tool.base64-encoder.decode")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInput("")}
                disabled={!input}
                className="h-8 px-2"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                {t("common.clear")}
              </Button>
            </div>
          }
        >
          <Textarea
            placeholder={t("tool.base64-encoder.placeholder")}
            className="min-h-96 p-4 resize-none font-mono"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
          />
        </InputSection>

        <OutputSection label={t("tool.base64-encoder.output-label")}>
          <ResultCard
            content={isInvalid ? t("tool.base64-encoder.invalid") : output || "..."}
            onCopy={copyResult}
            disabled={isInvalid || !output}
          />
        </OutputSection>
      </TwoColumnLayout>
    </ToolShell>
  );
}
