"use client";

import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Braces, Code2, Copy, Minimize2, Trash2 } from "lucide-react";
import { useState } from "react";

/** True if the JSON text has an integer literal JSON.parse can't represent exactly. */
function hasUnsafeInteger(json: string): boolean {
  const withoutStrings = json.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  const ints = withoutStrings.match(/(?<![\d.eE+-])-?\d+(?![\d.eE])/g) ?? [];
  return ints.some((n) => BigInt(n.replace("-", "")) > BigInt(Number.MAX_SAFE_INTEGER));
}

export default function JsonFormatterPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [precisionLoss, setPrecisionLoss] = useState(false);

  const handleAction = (action: "beautify" | "minify") => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      const result =
        action === "beautify"
          ? JSON.stringify(parsed, null, 2)
          : JSON.stringify(parsed);

      setOutput(result);
      setPrecisionLoss(hasUnsafeInteger(input));
      toast({
        title: t("common.success"),
        description: t("toast.success.processed"),
      });
    } catch (err: any) {
      setOutput("");
      setPrecisionLoss(false);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("tool.json-formatter.invalid") + err.message,
      });
    }
  };

  const copyToClipboard = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast({ description: t("toast.success.copied") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  return (
    <ToolShell
      title={t("tool.json-formatter.name")}
      description={t("tool.json-formatter.description")}
      fullWidth
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Code2 className="h-3 w-3" />{" "}
              {t("tool.json-formatter.input-label")}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInput("")}
              disabled={!input}
            >
              <Trash2 className="h-4 w-4 mr-2" /> {t("common.clear")}
            </Button>
          </div>
          <Textarea
            placeholder={t("tool.json-formatter.placeholder")}
            className="min-h-[500px] font-mono text-sm resize-none p-4"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
          />
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2"
              onClick={() => handleAction("beautify")}
              disabled={!input}
            >
              <Braces className="h-4 w-4" /> {t("tool.json-formatter.beautify")}
            </Button>
            <Button
              variant="secondary"
              className="flex-1 gap-2"
              onClick={() => handleAction("minify")}
              disabled={!input}
            >
              <Minimize2 className="h-4 w-4" />{" "}
              {t("tool.json-formatter.minify")}
            </Button>
          </div>
        </div>

        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Braces className="h-3 w-3" />{" "}
              {t("tool.json-formatter.output-label")}
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              disabled={!output}
            >
              <Copy className="h-4 w-4 mr-2" /> {t("action.copy")}
            </Button>
          </div>
          {precisionLoss && (
            <p className="text-xs text-warning">{t("tool.json-formatter.precisionLoss")}</p>
          )}
          <Card className="min-h-[500px] bg-muted/10 border-2 overflow-hidden relative">
            <Textarea
              readOnly
              className="min-h-[500px] h-full border-0 bg-transparent font-mono text-sm resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={output}
              placeholder="..."
            />
          </Card>
        </div>
      </div>
    </ToolShell>
  );
}
