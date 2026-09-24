"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy } from "lucide-react";

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
      <div className="flex flex-col gap-6 max-w-3xl">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("tool.jwt-decoder.input")}
          </Label>
          <Textarea
            value={token}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setToken(e.target.value)}
            placeholder={t("tool.jwt-decoder.placeholder")}
            spellCheck={false}
            className="min-h-[110px] font-mono text-xs break-all"
          />
        </div>

        {invalid && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t("tool.jwt-decoder.invalid")}
          </div>
        )}

        {decoded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("tool.jwt-decoder.header")}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copy(decoded.header)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <pre className="rounded-xl border bg-muted/10 p-4 text-xs font-mono overflow-auto max-h-[300px]">
                {JSON.stringify(decoded.header, null, 2)}
              </pre>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("tool.jwt-decoder.payload")}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copy(decoded.payload)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <pre className="rounded-xl border bg-muted/10 p-4 text-xs font-mono overflow-auto max-h-[300px]">
                {JSON.stringify(decoded.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">{t("tool.jwt-decoder.note")}</p>
      </div>
    </ToolShell>
  );
}
