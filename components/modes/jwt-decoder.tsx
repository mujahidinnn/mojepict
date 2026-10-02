"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy } from "lucide-react";
import { TwoColumnLayout, InputSection } from "@/components/tools/ToolTemplates";

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    segment.length + ((4 - (segment.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function decodeJwt(token: string) {
  const parts = token.trim().split(".");
  if (parts.length < 2) return null;
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return { header, payload, signature: parts[2] ?? "" };
  } catch {
    return null;
  }
}

export default function JwtDecoderPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [token, setToken] = useState("");

  const decoded = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token]);
  const invalid = token.trim().length > 0 && !decoded;

  const copy = (value: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell title={t("tool.jwt-decoder.name")} description={t("tool.jwt-decoder.description")}>
      <TwoColumnLayout>
        <InputSection label={t("tool.jwt-decoder.input")}>
          <Textarea
            value={token}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setToken(e.target.value)}
            placeholder={t("tool.jwt-decoder.placeholder")}
            spellCheck={false}
            className="min-h-96 p-4 resize-none font-mono text-xs break-all"
          />

          {invalid && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {t("tool.jwt-decoder.invalid")}
            </div>
          )}

          <p className="text-xs text-muted-foreground">{t("tool.jwt-decoder.note")}</p>
        </InputSection>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("tool.jwt-decoder.header")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => decoded && copy(decoded.header)}
                disabled={!decoded}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="rounded-xl border bg-muted/10 p-4 text-xs font-mono overflow-auto max-h-[300px]">
              {decoded ? JSON.stringify(decoded.header, null, 2) : "..."}
            </pre>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("tool.jwt-decoder.payload")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => decoded && copy(decoded.payload)}
                disabled={!decoded}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="rounded-xl border bg-muted/10 p-4 text-xs font-mono overflow-auto max-h-[300px]">
              {decoded ? JSON.stringify(decoded.payload, null, 2) : "..."}
            </pre>
          </div>
        </div>
      </TwoColumnLayout>
    </ToolShell>
  );
}
