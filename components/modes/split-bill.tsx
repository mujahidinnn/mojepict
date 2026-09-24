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

function defaultParticipants(): Participant[] {
  return [makeParticipant("Orang 1"), makeParticipant("Orang 2")];
}

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return "Rp 0";
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

const MODES: { id: SplitMode; label: string; icon: typeof Equal }[] = [
  { id: "equal", label: "Equal", icon: Equal },
  { id: "items", label: "By Item", icon: ReceiptText },
  { id: "shares", label: "By %", icon: Percent },
];

export default function SplitBillPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const previewRef = useRef<HTMLDivElement>(null);

  const [billTitle, setBillTitle] = useState("Split Bill");
  const [mode, setMode] = useState<SplitMode>("equal");
  const [participants, setParticipants] = useState<Participant[]>(defaultParticipants());
  const [manualSubtotal, setManualSubtotal] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [shares, setShares] = useState<Record<string, string>>({});
  const [taxPercent, setTaxPercent] = useState("");
  const [servicePercent, setServicePercent] = useState("");
  const [discount, setDiscount] = useState("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");

  const addParticipant = () => {
    setParticipants((prev) => [...prev, makeParticipant(`Orang ${prev.length + 1}`)]);
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
    setBillTitle("Split Bill");
    setMode("equal");
    setParticipants(defaultParticipants());
    setManualSubtotal("");
    setItems([]);
    setShares({});
    setTaxPercent("");
    setServicePercent("");
    setDiscount("");
  };

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

  const breakdown = useMemo(() => {
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
          details.get(pid)?.push(it.name || "Item");
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
  }, [mode, participants, items, shares, subtotal, grandTotal]);

  const summaryText = useMemo(() => {
    const lines = [billTitle || "Split Bill", `Subtotal: ${formatMoney(subtotal)}`];
    if (discountValue > 0) lines.push(`Diskon: -${formatMoney(discountValue)}`);
    if (taxAmount > 0) lines.push(`Pajak (${taxPercent || 0}%): ${formatMoney(taxAmount)}`);
    if (serviceAmount > 0) lines.push(`Service (${servicePercent || 0}%): ${formatMoney(serviceAmount)}`);
    lines.push(`Total: ${formatMoney(grandTotal)}`, "");
    breakdown.forEach((b) => {
      lines.push(`${b.participant.name || "Tanpa nama"}: ${formatMoney(b.amount)}`);
    });
    return lines.join("\n");
  }, [billTitle, subtotal, discountValue, taxAmount, taxPercent, serviceAmount, servicePercent, grandTotal, breakdown]);

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(summaryText);
      toast({ title: t("common.success") || "Success", description: t("toast.success.copied") || "Copied!" });
    } catch {
      toast({ title: "Failed", description: "Could not copy summary to clipboard.", variant: "destructive" });
    }
  }

  async function handleDownload() {
    try {
      if (exportFormat === "csv") {
        downloadCsv(
          ["Nama", "Jumlah (Rp)"],
          breakdown.map((b) => [b.participant.name || "Tanpa nama", String(Math.round(b.amount))]),
          "split-bill.csv",
        );
      } else if (!previewRef.current) {
        throw new Error("Preview not ready.");
      } else if (exportFormat === "png") {
        await downloadNodeAsPng(previewRef.current, "split-bill.png");
      } else {
        await downloadNodeAsPdf(previewRef.current, "split-bill.pdf");
      }
      toast({ title: t("common.success") || "Success", description: t("toast.success.downloaded") || "Downloaded!" });
    } catch {
      toast({ title: "Failed", description: "Failed to export split bill.", variant: "destructive" });
    }
  }

  return (
    <ToolShell
      title={t("tool.split-bill.name") || "Split Bill"}
      description={
        t("tool.split-bill.description") ||
        "Split a bill equally, by item, or by custom percentage, then copy or export the result."
      }
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Bill Title</Label>
                <Input
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  placeholder="Split Bill"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Participants ({participants.length})
                </Label>
                <div className="space-y-1.5">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Input
                        value={p.name}
                        onChange={(e) => renameParticipant(p.id, e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Name"
                      />
                      <button
                        type="button"
                        onClick={() => removeParticipant(p.id)}
                        disabled={participants.length <= 1}
                        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-30"
                        aria-label="Remove participant"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={addParticipant}>
                  <UserPlus className="h-4 w-4" />
                  Add Person
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Split Mode
                </Label>
                <Tabs value={mode} onValueChange={(v) => setMode(v as SplitMode)}>
                  <TabsList className="grid w-full grid-cols-3">
                    {MODES.map((m) => (
                      <TabsTrigger key={m.id} value={m.id} className="gap-1.5 text-xs">
                        <m.icon className="h-3.5 w-3.5" />
                        {m.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {mode === "equal" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Bill Subtotal</Label>
                  <ThousandsInput value={manualSubtotal} onChange={setManualSubtotal} className="h-11" placeholder="0" />
                </div>
              )}

              {mode === "shares" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Bill Subtotal</Label>
                  <ThousandsInput value={manualSubtotal} onChange={setManualSubtotal} className="h-11" placeholder="0" />
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Shares (weight or %)
                  </Label>
                  <div className="space-y-1.5">
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
                            onChange={(e) => setShares((prev) => ({ ...prev, [p.id]: e.target.value }))}
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Items ({items.length})
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Subtotal: {formatMoney(subtotal)}</span>
                  </div>
                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {items.map((it) => (
                      <div key={it.id} className="space-y-2 rounded-md border border-input p-2.5">
                        <div className="flex items-center gap-2">
                          <Input
                            value={it.name}
                            onChange={(e) => updateItem(it.id, { name: e.target.value })}
                            placeholder="Item name"
                            className="h-8 flex-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(it.id)}
                            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <ThousandsInput
                            value={it.price}
                            onChange={(v) => updateItem(it.id, { price: v })}
                            placeholder="Price"
                            className="h-8 flex-1 text-xs"
                          />
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateItem(it.id, { qty: Math.max(1, it.qty - 1) })}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-input text-xs hover:bg-muted"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-xs tabular-nums">{it.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateItem(it.id, { qty: it.qty + 1 })}
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
                          <p className="text-[10px] text-muted-foreground">Shared equally by everyone</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={addItem}>
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Charges
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Tax (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      placeholder="0"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Service (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={servicePercent}
                      onChange={(e) => setServicePercent(e.target.value)}
                      placeholder="0"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Discount (flat amount)</Label>
                  <ThousandsInput value={discount} onChange={setDiscount} className="h-9 text-xs" placeholder="0" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Export format
                </Label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG Image</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ToolActionBar
              primaryLabel="Copy Summary"
              primaryIcon={<Copy className="h-4 w-4" />}
              onPrimary={handleCopyText}
              onReset={handleReset}
            >
              <CopyImageButton getBlob={() => nodeToPngBlob(previewRef.current!)} label="Copy as Image" />
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                Download
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
              <h2 className="text-lg font-bold text-slate-900">{billTitle || "Split Bill"}</h2>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {mode === "items" && items.length > 0 && (
              <div className="mb-3 space-y-1 border-b border-dashed border-slate-300 pb-3 text-xs text-slate-700">
                {items.map((it) => (
                  <div key={it.id} className="flex justify-between gap-2">
                    <span className="truncate">
                      {it.name || "Item"} x{it.qty}
                    </span>
                    <span className="shrink-0 tabular-nums">{formatMoney((parseFloat(it.price) || 0) * it.qty)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-3 space-y-1 border-b border-dashed border-slate-300 pb-3 text-sm">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMoney(subtotal)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="tabular-nums">-{formatMoney(discountValue)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Tax ({taxPercent || 0}%)</span>
                  <span className="tabular-nums">{formatMoney(taxAmount)}</span>
                </div>
              )}
              {serviceAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Service ({servicePercent || 0}%)</span>
                  <span className="tabular-nums">{formatMoney(serviceAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 text-base font-bold text-slate-900">
                <span>Total</span>
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
                      {b.participant.name || "Unnamed"}
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
