"use client";

import { useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  Equal,
  Percent,
  Plus,
  ReceiptText,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThousandsInput } from "@/components/tools/ThousandsInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { downloadCsv, downloadNodeAsPdf, downloadNodeAsPng, nodeToPngBlob } from "@/lib/export-node";

type SplitMode = "equal" | "items" | "shares";
type ExportFormat = "png" | "pdf" | "csv";

interface Participant {
  id: string;
  name: string;
}

interface BillItem {
  id: string;
  name: string;
  price: string;
  qty: number;
  /** Empty = shared equally by everyone. */
  participantIds: string[];
}

const uid = () => crypto.randomUUID();

function makeParticipant(name: string): Participant {
  return { id: uid(), name };
}

function makeItem(): BillItem {
  return { id: uid(), name: "", price: "", qty: 1, participantIds: [] };
}

function defaultParticipants(personLabel: string): Participant[] {
  return [
    makeParticipant(personLabel.replace("{{n}}", "1")),
    makeParticipant(personLabel.replace("{{n}}", "2")),
  ];
}

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return "Rp 0";
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

const MODES: { id: SplitMode; icon: typeof Equal }[] = [
  { id: "equal", icon: Equal },
  { id: "items", icon: ReceiptText },
  { id: "shares", icon: Percent },
];

export default function SplitBillPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const previewRef = useRef<HTMLDivElement>(null);

  const defaultTitle = t("tool.split-bill.defaultTitle");
  const personLabel = t("tool.split-bill.person");
  const [billTitle, setBillTitle] = useState(defaultTitle);
  const [mode, setMode] = useState<SplitMode>("equal");
  const [participants, setParticipants] = useState<Participant[]>(() => defaultParticipants(personLabel));
  const [manualSubtotal, setManualSubtotal] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [shares, setShares] = useState<Record<string, string>>({});
  const [taxPercent, setTaxPercent] = useState("");
  const [servicePercent, setServicePercent] = useState("");
  const [discount, setDiscount] = useState("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");

  const addParticipant = () => {
    setParticipants((prev) => [...prev, makeParticipant(personLabel.replace("{{n}}", String(prev.length + 1)))]);
  };

  const removeParticipant = (id: string) => {
    setParticipants((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.id !== id)));
    setItems((prev) => prev.map((it) => ({ ...it, participantIds: it.participantIds.filter((pid) => pid !== id) })));
  };

  const renameParticipant = (id: string, name: string) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const addItem = () => setItems((prev) => [...prev, makeItem()]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));
  const updateItem = (id: string, patch: Partial<BillItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const toggleItemParticipant = (itemId: string, participantId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const has = it.participantIds.includes(participantId);
        return {
          ...it,
          participantIds: has
            ? it.participantIds.filter((pid) => pid !== participantId)
            : [...it.participantIds, participantId],
        };
      }),
    );
  };

  const handleReset = () => {
    setBillTitle(defaultTitle);
    setMode("equal");
    setParticipants(defaultParticipants(personLabel));
    setManualSubtotal("");
    setItems([]);
    setShares({});
    setTaxPercent("");
    setServicePercent("");
    setDiscount("");
  };

  const itemLabel = t("tool.split-bill.item");
  const unnamed = t("tool.split-bill.unnamed");

  const subtotal = useMemo(() => {
    if (mode === "items") {
      return items.reduce((sum, it) => sum + (parseFloat(it.price) || 0) * it.qty, 0);
    }
    return parseFloat(manualSubtotal) || 0;
  }, [mode, items, manualSubtotal]);

  const discountValue = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));
  const adjustedSubtotal = Math.max(0, subtotal - discountValue);
  const taxAmount = adjustedSubtotal * ((parseFloat(taxPercent) || 0) / 100);
  const serviceAmount = adjustedSubtotal * ((parseFloat(servicePercent) || 0) / 100);
  const grandTotal = adjustedSubtotal + taxAmount + serviceAmount;

  const rawBreakdown = useMemo(() => {
    const count = Math.max(1, participants.length);
    const equalFallback = () =>
      participants.map((p) => ({ participant: p, ratio: 1 / count, amount: grandTotal / count, detail: [] as string[] }));

    if (mode === "equal") return equalFallback();

    if (mode === "items") {
      if (subtotal <= 0) return equalFallback();
      const bases = new Map<string, number>();
      const details = new Map<string, string[]>();
      participants.forEach((p) => {
        bases.set(p.id, 0);
        details.set(p.id, []);
      });
      items.forEach((it) => {
        const lineTotal = (parseFloat(it.price) || 0) * it.qty;
        if (lineTotal <= 0) return;
        const assignees = it.participantIds.length > 0 ? it.participantIds : participants.map((p) => p.id);
        const share = lineTotal / assignees.length;
        assignees.forEach((pid) => {
          bases.set(pid, (bases.get(pid) ?? 0) + share);
          details.get(pid)?.push(it.name || itemLabel);
        });
      });
      return participants.map((p) => {
        const base = bases.get(p.id) ?? 0;
        const ratio = base / subtotal;
        return { participant: p, ratio, amount: grandTotal * ratio, detail: details.get(p.id) ?? [] };
      });
    }

    // shares
    const weights = participants.map((p) => {
      const raw = shares[p.id];
      if (raw === undefined || raw.trim() === "") return 1;
      return Math.max(0, parseFloat(raw) || 0);
    });
    const sumWeights = weights.reduce((a, b) => a + b, 0);
    if (sumWeights <= 0) return equalFallback();
    return participants.map((p, idx) => {
      const ratio = weights[idx] / sumWeights;
      return { participant: p, ratio, amount: grandTotal * ratio, detail: [] as string[] };
    });
  }, [mode, participants, items, shares, subtotal, grandTotal, itemLabel]);

  // Round each share to whole rupiah, then hand the leftover rupiah to the largest
  // remainders so the shares always add up to the rounded total (e.g. 100.000 / 3).
  const breakdown = useMemo(() => {
    const floors = rawBreakdown.map((b) => Math.floor(b.amount));
    let rest = Math.round(grandTotal) - floors.reduce((a, b) => a + b, 0);
    const order = rawBreakdown
      .map((b, i) => ({ i, frac: b.amount - floors[i] }))
      .sort((a, b) => b.frac - a.frac);
    for (let k = 0; rest > 0 && order.length > 0; k++, rest--) floors[order[k % order.length].i]++;
    return rawBreakdown.map((b, i) => ({ ...b, amount: floors[i] }));
  }, [rawBreakdown, grandTotal]);

  const summaryText = useMemo(() => {
    const lines = [billTitle || defaultTitle, `${t("tool.split-bill.subtotal")}: ${formatMoney(subtotal)}`];
    if (discountValue > 0) lines.push(`${t("tool.split-bill.discount")}: -${formatMoney(discountValue)}`);
    if (taxAmount > 0) lines.push(`${t("tool.split-bill.tax")} (${taxPercent || 0}%): ${formatMoney(taxAmount)}`);
    if (serviceAmount > 0) lines.push(`${t("tool.split-bill.service")} (${servicePercent || 0}%): ${formatMoney(serviceAmount)}`);
    lines.push(`${t("tool.split-bill.total")}: ${formatMoney(grandTotal)}`, "");
    breakdown.forEach((b) => {
      lines.push(`${b.participant.name || unnamed}: ${formatMoney(b.amount)}`);
    });
    return lines.join("\n");
  }, [billTitle, defaultTitle, unnamed, t, subtotal, discountValue, taxAmount, taxPercent, serviceAmount, servicePercent, grandTotal, breakdown]);

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(summaryText);
      toast({ title: t("common.success"), description: t("toast.success.copied") });
    } catch {
      toast({ title: t("common.error"), description: t("tool.split-bill.copyFailed"), variant: "destructive" });
    }
  }

  async function handleDownload() {
    try {
      if (exportFormat === "csv") {
        downloadCsv(
          [t("tool.split-bill.csvName"), t("tool.split-bill.csvAmount")],
          breakdown.map((b) => [b.participant.name || unnamed, String(b.amount)]),
          "split-bill.csv",
        );
      } else if (!previewRef.current) {
        throw new Error("Preview not ready.");
      } else if (exportFormat === "png") {
        await downloadNodeAsPng(previewRef.current, "split-bill.png");
      } else {
        await downloadNodeAsPdf(previewRef.current, "split-bill.pdf");
      }
      toast({ title: t("common.success"), description: t("toast.success.downloaded") });
    } catch {
      toast({ title: t("common.error"), description: t("tool.split-bill.exportFailed"), variant: "destructive" });
    }
  }

  return (
    <ToolShell
      title={t("tool.split-bill.name")}
      description={t("tool.split-bill.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-xs font-medium">{t("tool.split-bill.billTitle")}</Label>
                <Input
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  placeholder={defaultTitle}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("tool.split-bill.participants").replace("{{count}}", String(participants.length))}
                </Label>
                <div className="space-y-3">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Input
                        value={p.name}
                        onChange={(e) => renameParticipant(p.id, e.target.value)}
                        className="h-8 text-xs"
                        placeholder={t("tool.split-bill.csvName")}
                      />
                      <button
                        type="button"
                        onClick={() => removeParticipant(p.id)}
                        disabled={participants.length <= 1}
                        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-30"
                        aria-label={t("tool.split-bill.removeParticipant")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={addParticipant}>
                  <UserPlus className="h-4 w-4" />
                  {t("tool.split-bill.addPerson")}
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("tool.split-bill.splitMode")}
                </Label>
                <Tabs value={mode} onValueChange={(v) => setMode(v as SplitMode)}>
                  <TabsList className="grid w-full grid-cols-3">
                    {MODES.map((m) => (
                      <TabsTrigger key={m.id} value={m.id} className="gap-2 text-xs">
                        <m.icon className="h-3.5 w-3.5" />
                        {t(`tool.split-bill.mode.${m.id}` as any)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {mode === "equal" && (
                <div className="space-y-3">
                  <Label className="text-xs font-medium">{t("tool.split-bill.billSubtotal")}</Label>
                  <ThousandsInput value={manualSubtotal} onChange={setManualSubtotal} className="h-11" placeholder="0" />
                </div>
              )}

              {mode === "shares" && (
                <div className="space-y-3">
                  <Label className="text-xs font-medium">{t("tool.split-bill.billSubtotal")}</Label>
                  <ThousandsInput value={manualSubtotal} onChange={setManualSubtotal} className="h-11" placeholder="0" />
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("tool.split-bill.shares")}
                  </Label>
                  <div className="space-y-3">
                    {participants.map((p) => {
                      const raw = shares[p.id] ?? "";
                      const weight = raw.trim() === "" ? 1 : Math.max(0, parseFloat(raw) || 0);
                      const totalWeight = participants.reduce((sum, pp) => {
                        const r = shares[pp.id];
                        const w = r === undefined || r.trim() === "" ? 1 : Math.max(0, parseFloat(r) || 0);
                        return sum + w;
                      }, 0);
                      const pct = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
                      return (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">{p.name}</span>
                          <Input
                            type="number"
                            min="0"
                            value={raw}
                            onChange={(e) => !e.target.value.includes("-") && setShares((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder="1"
                            className="h-8 text-xs"
                          />
                          <span className="w-12 shrink-0 text-right text-[10px] text-muted-foreground">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {mode === "items" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("tool.split-bill.items").replace("{{count}}", String(items.length))}
                    </Label>
                    <span className="text-[10px] text-muted-foreground">{t("tool.split-bill.subtotal")}: {formatMoney(subtotal)}</span>
                  </div>
                  <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                    {items.map((it) => (
                      <div key={it.id} className="space-y-3 rounded-md border border-input p-4">
                        <div className="flex items-center gap-2">
                          <Input
                            value={it.name}
                            onChange={(e) => updateItem(it.id, { name: e.target.value })}
                            placeholder={t("tool.split-bill.itemName")}
                            className="h-8 flex-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(it.id)}
                            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                            aria-label={t("tool.split-bill.removeItem")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <ThousandsInput
                            value={it.price}
                            onChange={(v) => updateItem(it.id, { price: v })}
                            placeholder={t("tool.split-bill.price")}
                            className="h-8 flex-1 text-xs"
                          />
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateItem(it.id, { qty: Math.max(1, it.qty - 1) })}
                              aria-label={t("tool.split-bill.decreaseQty")}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-input text-xs hover:bg-muted"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-xs tabular-nums">{it.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateItem(it.id, { qty: Math.min(999, it.qty + 1) })}
                              aria-label={t("tool.split-bill.increaseQty")}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-input text-xs hover:bg-muted"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {participants.map((p) => {
                            const active = it.participantIds.includes(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => toggleItemParticipant(it.id, p.id)}
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input bg-background text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {p.name || "?"}
                              </button>
                            );
                          })}
                        </div>
                        {it.participantIds.length === 0 && (
                          <p className="text-[10px] text-muted-foreground">{t("tool.split-bill.sharedByAll")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={addItem}>
                    <Plus className="h-4 w-4" />
                    {t("tool.split-bill.addItem")}
                  </Button>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("tool.split-bill.charges")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">{t("tool.split-bill.tax")} (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={taxPercent}
                      onChange={(e) => !e.target.value.includes("-") && setTaxPercent(e.target.value)}
                      placeholder="0"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">{t("tool.split-bill.service")} (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={servicePercent}
                      onChange={(e) => !e.target.value.includes("-") && setServicePercent(e.target.value)}
                      placeholder="0"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-medium">{t("tool.split-bill.discountFlat")}</Label>
                  <ThousandsInput value={discount} onChange={setDiscount} className="h-9 text-xs" placeholder="0" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("tool.split-bill.exportFormat")}
                </Label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">{t("tool.split-bill.export.png")}</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">{t("tool.split-bill.export.csv")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ToolActionBar
              primaryLabel={t("tool.split-bill.copySummary")}
              primaryIcon={<Copy className="h-4 w-4" />}
              onPrimary={handleCopyText}
              onReset={handleReset}
            >
              <CopyImageButton getBlob={() => nodeToPngBlob(previewRef.current!)} label={t("tool.split-bill.copyImage")} />
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                {t("action.download")}
              </button>
            </ToolActionBar>
          </>
        }
      >
        <div className="flex justify-center overflow-x-auto rounded-xl border bg-muted/30 p-4 sm:p-8">
          <div
            ref={previewRef}
            className="w-full max-w-md bg-white text-slate-900"
            style={{ padding: 32 }}
          >
            <div className="mb-4 text-center">
              <h2 className="text-lg font-bold text-slate-900">{billTitle || defaultTitle}</h2>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {mode === "items" && items.length > 0 && (
              <div className="mb-3 space-y-1 border-b border-dashed border-slate-300 pb-3 text-xs text-slate-700">
                {items.map((it) => (
                  <div key={it.id} className="flex justify-between gap-2">
                    <span className="truncate">
                      {it.name || itemLabel} x{it.qty}
                    </span>
                    <span className="shrink-0 tabular-nums">{formatMoney((parseFloat(it.price) || 0) * it.qty)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-3 space-y-1 border-b border-dashed border-slate-300 pb-3 text-sm">
              <div className="flex justify-between text-slate-700">
                <span>{t("tool.split-bill.subtotal")}</span>
                <span className="tabular-nums">{formatMoney(subtotal)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>{t("tool.split-bill.discount")}</span>
                  <span className="tabular-nums">-{formatMoney(discountValue)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>{t("tool.split-bill.tax")} ({taxPercent || 0}%)</span>
                  <span className="tabular-nums">{formatMoney(taxAmount)}</span>
                </div>
              )}
              {serviceAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>{t("tool.split-bill.service")} ({servicePercent || 0}%)</span>
                  <span className="tabular-nums">{formatMoney(serviceAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 text-base font-bold text-slate-900">
                <span>{t("tool.split-bill.total")}</span>
                <span className="tabular-nums">{formatMoney(grandTotal)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {breakdown.map((b) => (
                <div
                  key={b.participant.id}
                  className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {b.participant.name || unnamed}
                    </p>
                    {b.detail.length > 0 && (
                      <p className="truncate text-[10px] text-slate-500">{b.detail.join(", ")}</p>
                    )}
                    <p className="text-[10px] text-slate-400">{(b.ratio * 100).toFixed(1)}%</p>
                  </div>
                  <p className="shrink-0 pl-2 text-sm font-bold text-slate-900 tabular-nums">
                    {formatMoney(b.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ToolWorkspace>
    </ToolShell>
  );
}
