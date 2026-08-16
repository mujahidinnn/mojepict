"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { Textarea } from "@/components/ui/textarea";
import { Clock } from "lucide-react";

function countStats(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTime };
}

export default function WordCounterPage() {
  const { t } = useI18n();
  const [text, setText] = useState("");

  const stats = useMemo(() => countStats(text), [text]);

  const rows: [string, number | string][] = [
    [t("tool.word-counter.words"), stats.words],
    [t("tool.word-counter.characters"), stats.characters],
    [t("tool.word-counter.charactersNoSpaces"), stats.charactersNoSpaces],
    [t("tool.word-counter.sentences"), stats.sentences],
    [t("tool.word-counter.paragraphs"), stats.paragraphs],
  ];

  return (
    <ToolShell
      title={t("tool.word-counter.name")}
      description={t("tool.word-counter.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="flex flex-col divide-y rounded-xl border bg-muted/10">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold tabular-nums">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl border bg-primary/5 border-primary/10 px-4 py-3">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {t("tool.word-counter.readingTime")}
                </span>
                <span className="text-sm font-semibold">
                  {t("tool.word-counter.readingTimeValue").replace(
                    "{{minutes}}",
                    String(stats.readingTime),
                  )}
                </span>
              </div>
            </div>

            <ToolActionBar onReset={text ? () => setText("") : undefined} />
          </>
        }
      >
        <Textarea
          placeholder={t("tool.word-counter.placeholder")}
          className="min-h-[500px] resize-none text-base p-4"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
        />
      </ToolWorkspace>
    </ToolShell>
  );
}
