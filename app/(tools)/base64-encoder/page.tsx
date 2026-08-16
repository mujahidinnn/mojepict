"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Trash2, Binary } from "lucide-react";

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

  const copyResult = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.base64-encoder.name")}
      description={t("tool.base64-encoder.description")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Binary className="h-3 w-3" /> {t("tool.base64-encoder.input-label")}
            </Label>
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
          </div>
          <Textarea
            placeholder={t("tool.base64-encoder.placeholder")}
            className="min-h-[400px] resize-none text-base p-4 font-mono"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("tool.base64-encoder.output-label")}
            </Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyResult}
                disabled={!output}
              >
                <Copy className="h-4 w-4 mr-2" /> {t("action.copy")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInput("")}
                disabled={!input}
              >
                <Trash2 className="h-4 w-4 mr-2" /> {t("common.clear")}
              </Button>
            </div>
          </div>
          <Textarea
            readOnly
            value={
              isInvalid ? t("tool.base64-encoder.invalid") : output
            }
            className="min-h-[400px] resize-none text-base p-4 font-mono bg-muted/20"
          />
        </div>
      </div>
    </ToolShell>
  );
}
