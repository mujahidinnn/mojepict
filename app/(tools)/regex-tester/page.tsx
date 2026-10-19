"use client";

import { useEffect, useMemo, useState } from "react";
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

// Runs inside a Web Worker so catastrophic backtracking can be killed.
const WORKER_SRC = `onmessage = (e) => {
  const { pattern, flags, text } = e.data;
  try {
    const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    const unicode = flags.includes("u");
    const found = [];
    let m;
    while ((m = re.exec(text)) !== null && found.length < 5000) {
      found.push({ match: m[0], index: m.index, groups: m.slice(1).map((g) => g ?? "") });
      if (m[0].length === 0) {
        const cp = unicode ? text.codePointAt(re.lastIndex) : undefined;
        re.lastIndex += cp !== undefined && cp > 0xffff ? 2 : 1;
      }
    }
    postMessage({ matches: found });
  } catch (err) {
    postMessage({ error: err instanceof Error ? err.message : String(err) });
  }
};`;

function buildHighlight(text: string, matches: MatchInfo[]) {
  let html = "";
  let last = 0;
  for (const m of matches) {
    html += escapeHtml(text.slice(last, m.index));
    if (m.match) html += `<mark class="bg-primary/30 text-foreground rounded px-0.5">${escapeHtml(m.match)}</mark>`;
    last = m.index + m.match.length;
  }
  return html + escapeHtml(text.slice(last));
}

export default function RegexTesterPage() {
  const { t } = useI18n();
  const [pattern, setPattern] = useState("[A-Z][a-z]+");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState(
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  );
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pattern) {
      setMatches([]);
      setError(null);
      return;
    }
    if (new Set(flags).size !== flags.length) {
      setMatches([]);
      setError(t("tool.regex-tester.invalidFlags"));
      return;
    }
    let worker: Worker | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
    const stop = () => {
      clearTimeout(timer);
      worker?.terminate();
      worker = null;
    };
    const debounce = setTimeout(() => {
      worker = new Worker(url);
      worker.onmessage = (e: MessageEvent<{ matches?: MatchInfo[]; error?: string }>) => {
        stop();
        setMatches(e.data.matches ?? []);
        setError(e.data.error ?? null);
      };
      timer = setTimeout(() => {
        stop();
        setMatches([]);
        setError(t("tool.regex-tester.timeout"));
      }, 1000);
      worker.postMessage({ pattern, flags, text: testString });
    }, 250);
    return () => {
      clearTimeout(debounce);
      stop();
      URL.revokeObjectURL(url);
    };
  }, [pattern, flags, testString, t]);

  const highlighted = useMemo(
    () => (error ? escapeHtml(testString) : buildHighlight(testString, matches)),
    [error, testString, matches],
  );

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
