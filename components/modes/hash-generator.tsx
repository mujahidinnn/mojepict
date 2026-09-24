"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Hash } from "lucide-react";

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
    navigator.clipboard.writeText(value);
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.hash-generator.name")}
      description={t("tool.hash-generator.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            {text ? (
              <div className="flex flex-col gap-3">
                {ALGORITHMS.map((algo) => (
                  <div key={algo} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {algo}
                    </span>
                    <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/50 p-2">
                      <code className="text-xs font-mono break-all">
                        {hashes[algo] ?? "…"}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => hashes[algo] && copyHash(hashes[algo])}
                        disabled={!hashes[algo]}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ToolEmptyState
                icon={<Hash className="h-6 w-6" />}
                title={t("tool.hash-generator.empty")}
              />
            )}

            <ToolActionBar onReset={text ? () => setText("") : undefined} />
          </>
        }
      >
        <Textarea
          placeholder={t("tool.hash-generator.placeholder")}
          className="min-h-[500px] resize-none text-base p-4 font-mono"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
        />
      </ToolWorkspace>
    </ToolShell>
  );
}
