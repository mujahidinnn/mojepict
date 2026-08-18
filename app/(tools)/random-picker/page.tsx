"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/context";
import {
  Coins,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Dices,
  Hash,
  List,
  Shuffle,
} from "lucide-react";

type Tab = "dice" | "coin" | "number" | "list";

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

function DiceTab() {
  const { t } = useI18n();
  const [count, setCount] = useState(2);
  const [rolls, setRolls] = useState<number[]>([]);

  const roll = () => {
    setRolls(Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6)));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <Label className="text-xs font-medium text-muted-foreground">
          {t("tool.random-picker.diceCount")}
        </Label>
        <Input
          type="number"
          min={1}
          max={6}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(6, Number(e.target.value))))}
          className="h-10 w-20"
        />
      </div>

      <div className="flex min-h-[100px] flex-wrap items-center justify-center gap-3">
        {rolls.map((r, i) => {
          const Icon = DICE_ICONS[r - 1];
          return (
            <div
              key={i}
              className="flex h-16 w-16 items-center justify-center rounded-xl border bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm"
            >
              <Icon className="h-9 w-9" />
            </div>
          );
        })}
      </div>

      {rolls.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {t("tool.random-picker.total")}: <span className="font-semibold">{rolls.reduce((a, b) => a + b, 0)}</span>
        </p>
      )}

      <Button className="gap-2" onClick={roll}>
        <Dices className="h-4 w-4" /> {t("tool.random-picker.roll")}
      </Button>
    </div>
  );
}

function CoinTab() {
  const { t } = useI18n();
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [spins, setSpins] = useState(0);

  const flip = () => {
    if (flipping) return;
    const next = Math.random() < 0.5 ? "heads" : "tails";
    setFlipping(true);
    setSpins((s) => s + 1);
    setTimeout(() => {
      setResult(next);
      setFlipping(false);
    }, 900);
  };

  const baseSpins = 4;
  const landingTurn = result === "tails" ? 0.5 : 0;
  const rotation = spins > 0 ? (baseSpins + landingTurn + (spins - 1)) * 360 : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="[perspective:800px]"
        style={{ width: 128, height: 128 }}
      >
        <div
          className="relative h-full w-full transition-transform ease-out [transform-style:preserve-3d]"
          style={{
            transitionDuration: "900ms",
            transform: `rotateY(${rotation}deg)`,
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-lg [backface-visibility:hidden]"
          >
            <div className="flex flex-col items-center gap-1">
              <Coins className="h-10 w-10" />
              <span className="text-sm font-bold uppercase tracking-wide">
                {t("tool.random-picker.heads")}
              </span>
            </div>
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]"
          >
            <div className="flex flex-col items-center gap-1">
              <Coins className="h-10 w-10" />
              <span className="text-sm font-bold uppercase tracking-wide">
                {t("tool.random-picker.tails")}
              </span>
            </div>
          </div>
        </div>
      </div>
      {result && !flipping && (
        <p className="text-2xl font-bold tracking-tight">
          {t(`tool.random-picker.${result}`)}
        </p>
      )}
      <Button className="gap-2" onClick={flip} disabled={flipping}>
        <Coins className="h-4 w-4" /> {t("tool.random-picker.flip")}
      </Button>
    </div>
  );
}

function NumberTab() {
  const { t } = useI18n();
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [result, setResult] = useState<number | null>(null);

  const generate = () => {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    setResult(lo + Math.floor(Math.random() * (hi - lo + 1)));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            {t("tool.random-picker.min")}
          </Label>
          <Input
            type="number"
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            {t("tool.random-picker.max")}
          </Label>
          <Input
            type="number"
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex h-24 w-24 items-center justify-center rounded-xl border bg-gradient-to-br from-sky-500 to-blue-600 text-3xl font-bold text-white shadow-sm">
        {result ?? "?"}
      </div>

      <Button className="gap-2" onClick={generate}>
        <Hash className="h-4 w-4" /> {t("tool.random-picker.generate")}
      </Button>
    </div>
  );
}

function ListTab() {
  const { t } = useI18n();
  const [items, setItems] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [shuffled, setShuffled] = useState<string[] | null>(null);

  const list = items
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const pick = () => {
    if (!list.length) return;
    setPicked(list[Math.floor(Math.random() * list.length)]);
    setShuffled(null);
  };

  const shuffle = () => {
    if (!list.length) return;
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setShuffled(copy);
    setPicked(null);
  };

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
      <Textarea
        value={items}
        onChange={(e) => setItems(e.target.value)}
        placeholder={t("tool.random-picker.listPlaceholder")}
        className="min-h-[140px] resize-none"
      />

      {picked && (
        <div className="rounded-xl border bg-gradient-to-br from-violet-500 to-purple-600 p-4 text-center text-lg font-semibold text-white">
          {picked}
        </div>
      )}

      {shuffled && (
        <ol className="flex flex-col gap-1 rounded-xl border bg-muted/10 p-4 text-sm">
          {shuffled.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground">{i + 1}.</span> {item}
            </li>
          ))}
        </ol>
      )}

      <div className="flex gap-3">
        <Button className="flex-1 gap-2" onClick={pick} disabled={!list.length}>
          <List className="h-4 w-4" /> {t("tool.random-picker.pick")}
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={shuffle}
          disabled={!list.length}
        >
          <Shuffle className="h-4 w-4" /> {t("tool.random-picker.shuffle")}
        </Button>
      </div>
    </div>
  );
}

export default function RandomPickerPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("dice");

  return (
    <ToolShell
      title={t("tool.random-picker.name")}
      description={t("tool.random-picker.description")}
    >
      <div className="flex flex-col gap-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="dice">{t("tool.random-picker.tab.dice")}</TabsTrigger>
            <TabsTrigger value="coin">{t("tool.random-picker.tab.coin")}</TabsTrigger>
            <TabsTrigger value="number">{t("tool.random-picker.tab.number")}</TabsTrigger>
            <TabsTrigger value="list">{t("tool.random-picker.tab.list")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-xl border bg-muted/5 p-8">
          {tab === "dice" && <DiceTab />}
          {tab === "coin" && <CoinTab />}
          {tab === "number" && <NumberTab />}
          {tab === "list" && <ListTab />}
        </div>
      </div>
    </ToolShell>
  );
}
