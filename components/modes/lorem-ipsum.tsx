"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { FormGroup } from "@/components/tools/ToolTemplates";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
// Batas per unit: cukup untuk pemakaian normal tanpa membuat tab lag saat dibuat ulang.
const MAX_COUNT: Record<Unit, number> = { paragraphs: 100, sentences: 500, words: 5000 };

const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "eu", "fugiat", "nulla", "pariatur", "excepteur",
  "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui",
  "officia", "deserunt", "mollit", "anim", "id", "est", "laborum", "a", "ac",
  "accumsan", "aenean", "aliquam", "ante", "arcu", "at", "auctor", "augue",
  "bibendum", "blandit", "condimentum", "congue", "cras", "curabitur", "dapibus",
  "diam", "dictum", "dignissim", "donec", "egestas", "eget", "eleifend",
  "elementum", "erat", "eros", "etiam", "facilisis", "fames", "faucibus", "felis",
  "fermentum", "feugiat", "finibus", "gravida", "habitant", "hendrerit", "iaculis",
  "imperdiet", "integer", "interdum", "justo", "lacinia", "lacus", "laoreet",
  "lectus", "leo", "libero", "ligula", "lobortis", "luctus", "maecenas", "massa",
  "mattis", "mauris", "maximus", "metus", "mi", "molestie", "morbi", "nam", "nec",
  "neque", "nibh", "nisl", "nunc", "odio", "orci", "ornare", "pellentesque",
  "pharetra", "placerat", "porta", "porttitor", "posuere", "praesent", "pretium",
  "purus", "quam", "quisque", "rhoncus", "risus", "rutrum", "sagittis", "sapien",
  "scelerisque", "semper", "sodales", "sollicitudin", "suscipit", "suspendisse",
  "tellus", "tincidunt", "tortor", "tristique", "turpis", "ullamcorper", "ultrices",
  "ultricies", "urna", "varius", "vehicula", "vel", "vestibulum", "vitae", "vivamus",
  "viverra", "volutpat", "vulputate",
];

const LOREM_START = ["lorem", "ipsum", "dolor", "sit", "amet"];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomWords(n: number, prev?: string) {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    let w: string;
    do w = WORDS[Math.floor(Math.random() * WORDS.length)];
    while (w === (out[i - 1] ?? prev));
    out.push(w);
  }
  return out;
}

// Panjang kalimat & koma acak supaya ritmenya tidak seragam.
function generateSentence(startWithLorem = false) {
  const length = randInt(startWithLorem ? 8 : 5, 18);
  const words = startWithLorem
    ? [...LOREM_START, ...randomWords(Math.max(0, length - 5), "amet")]
    : randomWords(length);
  if (startWithLorem) words[4] += ",";
  let sinceComma = 0;
  for (let i = startWithLorem ? 5 : 0; i < words.length - 2; i++) {
    if (++sinceComma >= 3 && Math.random() < 0.15) {
      words[i] += ",";
      sinceComma = 0;
    }
  }
  return capitalize(words.join(" ")) + (Math.random() < 0.06 ? "?" : ".");
}

function generateParagraph(startWithLorem = false) {
  return Array.from({ length: randInt(3, 7) }, (_, i) =>
    generateSentence(startWithLorem && i === 0),
  ).join(" ");
}

function generate(unit: Unit, count: number, startWithLorem: boolean): string {
  const n = Math.max(MIN_COUNT, Math.min(MAX_COUNT[unit], count));
  if (unit === "words") {
    const words = startWithLorem
      ? [...LOREM_START, ...randomWords(Math.max(0, n - 5), "amet")].slice(0, n)
      : randomWords(n);
    return capitalize(words.join(" ")) + ".";
  }
  if (unit === "sentences") {
    return Array.from({ length: n }, (_, i) => generateSentence(startWithLorem && i === 0)).join(" ");
  }
  return Array.from({ length: n }, (_, i) => generateParagraph(startWithLorem && i === 0)).join("\n\n");
}

export default function LoremIpsumPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [asHtml, setAsHtml] = useState(false);
  const [output, setOutput] = useState("");

  const handleGenerate = () => {
    setOutput(generate(unit, count, startWithLorem));
  };

  useEffect(handleGenerate, [unit, count, startWithLorem]);

  const result = asHtml
    ? output.split("\n\n").map((p) => `<p>${p}</p>`).join("\n")
    : output;

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast({ description: t("toast.success.copied") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  return (
    <ToolShell
      title={t("tool.lorem-ipsum.name")}
      description={t("tool.lorem-ipsum.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <FormGroup label={t("tool.lorem-ipsum.unit")}>
              <Select value={unit} onValueChange={(v) => {
                  setUnit(v as Unit);
                  setCount((c) => Math.min(c, MAX_COUNT[v as Unit]));
                }}>
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
            </FormGroup>

            <FormGroup label={`${t("tool.lorem-ipsum.count")} (${MIN_COUNT}-${MAX_COUNT[unit]})`}>
              <Input
                type="number"
                min={MIN_COUNT}
                max={MAX_COUNT[unit]}
                value={count}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const clamped = Number.isFinite(raw)
                    ? Math.max(MIN_COUNT, Math.min(MAX_COUNT[unit], Math.trunc(raw)))
                    : MIN_COUNT;
                  setCount(clamped);
                }}
              />
            </FormGroup>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="start-lorem" className="text-sm font-normal cursor-pointer">
                {t("tool.lorem-ipsum.startWithLorem")}
              </Label>
              <Switch
                id="start-lorem"
                checked={startWithLorem}
                onCheckedChange={setStartWithLorem}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="as-html" className="text-sm font-normal cursor-pointer">
                {t("tool.lorem-ipsum.asHtml")}
              </Label>
              <Switch id="as-html" checked={asHtml} onCheckedChange={setAsHtml} />
            </div>

            <ToolActionBar
              primaryLabel={t("tool.lorem-ipsum.generate")}
              primaryIcon={<Wand2 className="h-4 w-4" />}
              onPrimary={handleGenerate}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 gap-2"
                onClick={copyResult}
                disabled={!output}
              >
                <Copy className="h-4 w-4" /> {t("action.copy")}
              </Button>
            </ToolActionBar>
          </>
        }
      >
        {output ? (
          <Textarea
            readOnly
            value={result}
            className="min-h-96 p-4 resize-none"
          />
        ) : (
          <div className="flex min-h-96 items-center justify-center rounded-xl border bg-muted/10">
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
