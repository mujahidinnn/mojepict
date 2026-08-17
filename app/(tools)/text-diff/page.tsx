"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAX_LINES = 500;

interface DiffEntry {
  type: "same" | "add" | "remove";
  text: string;
}

function diffLines(a: string[], b: string[]): DiffEntry[] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const result: DiffEntry[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: "remove", text: a[i] });
      i++;
    } else {
      result.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) {
    result.push({ type: "remove", text: a[i] });
    i++;
  }
  while (j < m) {
    result.push({ type: "add", text: b[j] });
    j++;
  }
  return result;
}

export default function TextDiffPage() {
  const { t } = useI18n();
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");

  const originalLines = original.split("\n");
  const modifiedLines = modified.split("\n");
  const tooLarge = originalLines.length > MAX_LINES || modifiedLines.length > MAX_LINES;

  const diff = useMemo(() => {
    if (tooLarge || (!original && !modified)) return [];
    return diffLines(original.split("\n"), modified.split("\n"));
  }, [original, modified, tooLarge]);

  const added = diff.filter((d) => d.type === "add").length;
  const removed = diff.filter((d) => d.type === "remove").length;

  return (
    <ToolShell title={t("tool.text-diff.name")} description={t("tool.text-diff.description")}>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("tool.text-diff.original")}
            </Label>
            <Textarea
              value={original}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOriginal(e.target.value)}
              spellCheck={false}
              className="min-h-[220px] font-mono text-sm p-4"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("tool.text-diff.modified")}
            </Label>
            <Textarea
              value={modified}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setModified(e.target.value)}
              spellCheck={false}
              className="min-h-[220px] font-mono text-sm p-4"
            />
          </div>
        </div>

        {tooLarge ? (
          <p className="text-sm text-destructive">
            {t("tool.text-diff.tooLarge").replace("{{max}}", String(MAX_LINES))}
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("tool.text-diff.result")}
              </Label>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-transparent">
                  +{added}
                </Badge>
                <Badge className="bg-destructive/15 text-destructive border-transparent">
                  -{removed}
                </Badge>
              </div>
            </div>
            <div className="rounded-xl border bg-muted/10 overflow-auto max-h-[500px] font-mono text-sm">
              {diff.length === 0 ? (
                <p className="p-4 text-muted-foreground">{t("tool.text-diff.placeholder")}</p>
              ) : (
                diff.map((entry, i) => (
                  <div
                    key={i}
                    className={cn(
                      "whitespace-pre-wrap break-words px-4 py-0.5 border-l-2",
                      entry.type === "add" &&
                        "bg-emerald-500/10 border-l-emerald-500 text-emerald-700 dark:text-emerald-400",
                      entry.type === "remove" &&
                        "bg-destructive/10 border-l-destructive text-destructive",
                      entry.type === "same" && "border-l-transparent text-foreground/80",
                    )}
                  >
                    <span className="select-none mr-2 text-muted-foreground">
                      {entry.type === "add" ? "+" : entry.type === "remove" ? "-" : " "}
                    </span>
                    {entry.text || " "}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
