"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Pilcrow, Wand2 } from "lucide-react";

type Unit = "paragraphs" | "sentences" | "words";

const MIN_COUNT = 1;
const MAX_COUNT = 50;

const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "eu", "fugiat", "nulla", "pariatur", "excepteur",
  "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui",
  "officia", "deserunt", "mollit", "anim", "id", "est", "laborum",
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function generateSentence(startWithLorem = false) {
  const length = 6 + Math.floor(Math.random() * 10);
  const words = startWithLorem
    ? ["lorem", "ipsum", "dolor", "sit", "amet", ...Array.from({ length: Math.max(0, length - 5) }, randomWord)]
    : Array.from({ length }, randomWord);
  return capitalize(words.join(" ")) + ".";
}

function generateParagraph(sentenceCount: number, startWithLorem = false) {
  return Array.from({ length: sentenceCount }, (_, i) =>
    generateSentence(startWithLorem && i === 0),
  ).join(" ");
}

function generate(unit: Unit, count: number, startWithLorem: boolean): string {
  const n = Math.max(MIN_COUNT, Math.min(MAX_COUNT, count));
  if (unit === "words") {
    const words = startWithLorem
      ? ["Lorem", "ipsum", "dolor", "sit", "amet", ...Array.from({ length: Math.max(0, n - 5) }, randomWord)]
      : [capitalize(randomWord()), ...Array.from({ length: Math.max(0, n - 1) }, randomWord)];
    return words.slice(0, n).join(" ") + ".";
  }
  if (unit === "sentences") {
    return Array.from({ length: n }, (_, i) => generateSentence(startWithLorem && i === 0)).join(" ");
  }
  const sentencesPerParagraph = 4;
  return Array.from({ length: n }, (_, i) =>
    generateParagraph(sentencesPerParagraph, startWithLorem && i === 0),
  ).join("\n\n");
}

export default function LoremIpsumPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState("");

  const handleGenerate = () => {
    setOutput(generate(unit, count, startWithLorem));
  };

  const copyResult = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.lorem-ipsum.name")}
      description={t("tool.lorem-ipsum.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("tool.lorem-ipsum.unit")}
              </Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraphs">
                    {t("tool.lorem-ipsum.unit.paragraphs")}
                  </SelectItem>
                  <SelectItem value="sentences">
                    {t("tool.lorem-ipsum.unit.sentences")}
                  </SelectItem>
                  <SelectItem value="words">{t("tool.lorem-ipsum.unit.words")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("tool.lorem-ipsum.count")} ({MIN_COUNT}-{MAX_COUNT})
              </Label>
              <Input
                type="number"
                min={MIN_COUNT}
                max={MAX_COUNT}
                value={count}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const clamped = Number.isFinite(raw)
                    ? Math.max(MIN_COUNT, Math.min(MAX_COUNT, Math.trunc(raw)))
                    : MIN_COUNT;
                  setCount(clamped);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="start-lorem" className="text-sm font-normal">
                {t("tool.lorem-ipsum.startWithLorem")}
              </Label>
              <Switch
                id="start-lorem"
                checked={startWithLorem}
                onCheckedChange={setStartWithLorem}
              />
            </div>

            <ToolActionBar
              primaryLabel={t("tool.lorem-ipsum.generate")}
              primaryIcon={<Wand2 className="h-4 w-4" />}
              onPrimary={handleGenerate}
            >
              <button
                type="button"
                onClick={copyResult}
                disabled={!output}
                className="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                <Copy className="h-4 w-4" /> {t("action.copy")}
              </button>
            </ToolActionBar>
          </>
        }
      >
        {output ? (
          <Textarea
            readOnly
            value={output}
            className="min-h-[500px] resize-none text-base p-4"
          />
        ) : (
          <div className="flex min-h-[500px] items-center justify-center rounded-xl border bg-muted/10">
            <ToolEmptyState
              icon={<Pilcrow className="h-6 w-6" />}
              title={t("tool.lorem-ipsum.placeholder")}
            />
          </div>
        )}
      </ToolWorkspace>
    </ToolShell>
  );
}
