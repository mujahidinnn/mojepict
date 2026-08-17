"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface MatchInfo {
  match: string;
  index: number;
  groups: string[];
}

export default function RegexTesterPage() {
  const { t } = useI18n();
  const [pattern, setPattern] = useState("[A-Z][a-z]+");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState(
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  );

  const { matches, error, highlighted } = useMemo(() => {
    if (!pattern) return { matches: [] as MatchInfo[], error: null, highlighted: escapeHtml(testString) };
    try {
      const globalFlags = flags.includes("g") ? flags : flags + "g";
      const re = new RegExp(pattern, globalFlags);
      const found: MatchInfo[] = [];
      let html = "";
      let lastIndex = 0;
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = re.exec(testString)) !== null && guard < 5000) {
        guard++;
        found.push({ match: m[0], index: m.index, groups: m.slice(1).map((g) => g ?? "") });
        html += escapeHtml(testString.slice(lastIndex, m.index));
        html += `<mark class="bg-primary/30 text-foreground rounded px-0.5">${escapeHtml(m[0])}</mark>`;
        lastIndex = m.index + (m[0].length || 1);
        if (m[0].length === 0) re.lastIndex++;
      }
      html += escapeHtml(testString.slice(lastIndex));
      return { matches: found, error: null, highlighted: html };
    } catch (e) {
      return {
        matches: [] as MatchInfo[],
        error: e instanceof Error ? e.message : "Invalid regular expression",
        highlighted: escapeHtml(testString),
      };
    }
  }, [pattern, flags, testString]);

  return (
    <ToolShell title={t("tool.regex-tester.name")} description={t("tool.regex-tester.description")}>
      <div className="flex flex-col gap-6 max-w-3xl">
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("tool.regex-tester.pattern")}
            </Label>
            <div className="flex items-center rounded-md border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
              <span className="text-muted-foreground select-none">/</span>
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                spellCheck={false}
                className="flex-1 bg-transparent px-1 py-2 text-sm font-mono outline-none"
              />
              <span className="text-muted-foreground select-none">/</span>
              <input
                value={flags}
                onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))}
                spellCheck={false}
                className="w-14 bg-transparent px-1 py-2 text-sm font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("tool.regex-tester.testString")}
          </Label>
          <Textarea
            value={testString}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTestString(e.target.value)}
            className="min-h-[140px] font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("tool.regex-tester.result")}
            </Label>
            <Badge variant="secondary">
              {t("tool.regex-tester.matchCount").replace("{{count}}", String(matches.length))}
            </Badge>
          </div>
          <div
            className="min-h-[100px] whitespace-pre-wrap break-words rounded-xl border bg-muted/10 p-4 font-mono text-sm"
            dangerouslySetInnerHTML={{ __html: highlighted || "&nbsp;" }}
          />
        </div>

        {matches.length > 0 && (
          <div className="flex flex-col divide-y rounded-xl border bg-muted/10 overflow-hidden">
            {matches.slice(0, 200).map((m, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                <span className="text-xs text-muted-foreground shrink-0">#{i + 1}</span>
                <span className="font-mono font-medium">{m.match || "∅"}</span>
                <span className="text-xs text-muted-foreground">
                  {t("tool.regex-tester.at")} {m.index}
                </span>
                {m.groups.length > 0 && (
                  <span className="text-xs text-muted-foreground font-mono">
                    [{m.groups.join(", ")}]
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
