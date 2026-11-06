"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormGroup } from "@/components/tools/ToolTemplates";
import { terbilang } from "@/components/modes/terbilang";
import { createPdf, downloadPdf, PAGE } from "@/lib/simple-pdf";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Download, Plus, X } from "lucide-react";

interface Item {
  desc: string;
  qty: string;
  price: string;
}

const rp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
const today = () => new Date().toISOString().slice(0, 10);

export default function InvoiceMaker() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [f, setF] = useState({ title: "INVOICE", no: "INV-001", date: "", due: "", from: "", to: "", tax: "0", notes: "" });
  const [items, setItems] = useState<Item[]>([{ desc: "", qty: "1", price: "" }]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });
  const setItem = (i: number, k: keyof Item, v: string) =>
    setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));

  const sub = items.reduce((n, it) => n + (+it.qty || 0) * (+it.price || 0), 0);
  const tax = (sub * (+f.tax || 0)) / 100;
  const total = sub + tax;

  const download = async () => {
    try {
      const m = PAGE.margin;
      const c = [m, m + 250, m + 310, m + 410]; // desc | qty | price | subtotal
      const w = [240, 50, 90, PAGE.w - m - (m + 410)];
      const pdf = await createPdf();
      pdf.text(f.title || "INVOICE", { size: 22, bold: true });
      pdf.text(`No: ${f.no}`);
      pdf.text(`${t("tool.invoice-maker.date")}: ${f.date || today()}${f.due ? `   ${t("tool.invoice-maker.due")}: ${f.due}` : ""}`);
      pdf.gap(10);
      pdf.row([
        { text: `${t("tool.invoice-maker.from")}\n${f.from}`, x: m, w: 240 },
        { text: `${t("tool.invoice-maker.to")}\n${f.to}`, x: m + 260, w: pdf.inner - 260 },
      ]);
      pdf.gap(14);
      pdf.rule();
      pdf.row([
        { text: t("tool.invoice-maker.item"), x: c[0], w: w[0], bold: true },
        { text: t("tool.invoice-maker.qty"), x: c[1], w: w[1], align: "right", bold: true },
        { text: t("tool.invoice-maker.price"), x: c[2], w: w[2], align: "right", bold: true },
        { text: t("tool.invoice-maker.subtotal"), x: c[3], w: w[3], align: "right", bold: true },
      ]);
      pdf.rule();
      for (const it of items.filter((i) => i.desc || +i.price)) {
        pdf.row([
          { text: it.desc, x: c[0], w: w[0] },
          { text: String(+it.qty || 0), x: c[1], w: w[1], align: "right" },
          { text: rp(+it.price || 0), x: c[2], w: w[2], align: "right" },
          { text: rp((+it.qty || 0) * (+it.price || 0)), x: c[3], w: w[3], align: "right" },
        ]);
        pdf.gap(3);
      }
      pdf.rule();
      const line = (label: string, v: string, bold = false) =>
        pdf.row([
          { text: label, x: c[1], w: 100, bold },
          { text: v, x: c[3], w: w[3], align: "right", bold },
        ]);
      line(t("tool.invoice-maker.subtotal"), rp(sub));
      if (tax) line(`${t("tool.invoice-maker.tax")} ${f.tax}%`, rp(tax));
      line("Total", rp(total), true);
      const words = terbilang(String(Math.round(total)));
      if (words) {
        pdf.gap(10);
        pdf.text(`${t("tool.invoice-maker.words")}: ${words} rupiah`, { size: 9 });
      }
      if (f.notes.trim()) {
        pdf.gap(14);
        pdf.text(f.notes, { size: 9 });
      }
      downloadPdf(await pdf.save(), `${f.no || "invoice"}.pdf`);
      toast({ description: t("toast.success.downloaded") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  return (
    <div className="max-w-screen-lg flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <FormGroup label={t("tool.invoice-maker.doc-title")}><Input value={f.title} onChange={set("title")} /></FormGroup>
        <FormGroup label={t("tool.invoice-maker.number")}><Input value={f.no} onChange={set("no")} /></FormGroup>
        <FormGroup label={t("tool.invoice-maker.date")}><Input type="date" value={f.date} onChange={set("date")} /></FormGroup>
        <FormGroup label={t("tool.invoice-maker.due")}><Input type="date" value={f.due} onChange={set("due")} /></FormGroup>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormGroup label={t("tool.invoice-maker.from")}><Textarea rows={4} value={f.from} onChange={set("from")} /></FormGroup>
        <FormGroup label={t("tool.invoice-maker.to")}><Textarea rows={4} value={f.to} onChange={set("to")} /></FormGroup>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_5rem_8rem_2.5rem] gap-2">
            <Input placeholder={t("tool.invoice-maker.item")} value={it.desc} onChange={(e) => setItem(i, "desc", e.target.value)} />
            <Input type="number" min={0} placeholder={t("tool.invoice-maker.qty")} value={it.qty} onChange={(e) => setItem(i, "qty", e.target.value)} />
            <Input type="number" min={0} placeholder={t("tool.invoice-maker.price")} value={it.price} onChange={(e) => setItem(i, "price", e.target.value)} />
            <Button variant="ghost" size="icon" disabled={items.length === 1} onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label={t("common.close")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" className="self-start" onClick={() => setItems([...items, { desc: "", qty: "1", price: "" }])}>
          <Plus className="h-4 w-4 mr-2" />{t("tool.invoice-maker.add-item")}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormGroup label={t("tool.invoice-maker.notes")}><Textarea rows={3} value={f.notes} onChange={set("notes")} /></FormGroup>
        <div className="flex flex-col gap-3">
          <FormGroup label={`${t("tool.invoice-maker.tax")} (%)`}><Input type="number" min={0} value={f.tax} onChange={set("tax")} /></FormGroup>
          <p className="text-lg font-semibold">Total: {rp(total)}</p>
        </div>
      </div>
      <Button className="self-start" onClick={download}><Download className="h-4 w-4 mr-2" />{t("tool.invoice-maker.download")}</Button>
    </div>
  );
}
