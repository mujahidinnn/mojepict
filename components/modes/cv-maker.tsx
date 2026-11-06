"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormGroup } from "@/components/tools/ToolTemplates";
import { createPdf, downloadPdf, PAGE } from "@/lib/simple-pdf";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Download, Plus, X } from "lucide-react";

interface Entry {
  title: string;
  sub: string;
  period: string;
  desc: string;
}
const blank = (): Entry => ({ title: "", sub: "", period: "", desc: "" });

function EntryList({ label, items, onChange, ph }: { label: string; items: Entry[]; onChange: (e: Entry[]) => void; ph: [string, string] }) {
  const { t } = useI18n();
  const set = (i: number, k: keyof Entry, v: string) => onChange(items.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{label}</p>
      {items.map((e, i) => (
        <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_9rem_2.5rem]">
          <Input placeholder={ph[0]} value={e.title} onChange={(ev) => set(i, "title", ev.target.value)} />
          <Input placeholder={ph[1]} value={e.sub} onChange={(ev) => set(i, "sub", ev.target.value)} />
          <Input placeholder="2020 – 2023" value={e.period} onChange={(ev) => set(i, "period", ev.target.value)} />
          <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={t("common.close")}>
            <X className="h-4 w-4" />
          </Button>
          <Textarea className="sm:col-span-4" rows={2} placeholder={t("tool.cv-maker.desc")} value={e.desc} onChange={(ev) => set(i, "desc", ev.target.value)} />
        </div>
      ))}
      <Button variant="outline" className="self-start" onClick={() => onChange([...items, blank()])}>
        <Plus className="h-4 w-4 mr-2" />{t("tool.cv-maker.add")}
      </Button>
    </div>
  );
}

export default function CvMaker() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [tab, setTab] = useState<"cv" | "letter">("cv");
  const [p, setP] = useState({ name: "", role: "", email: "", phone: "", address: "", summary: "", skills: "" });
  const [work, setWork] = useState<Entry[]>([blank()]);
  const [edu, setEdu] = useState<Entry[]>([blank()]);
  const [l, setL] = useState({ city: "", date: "", to: "HRD", company: "", companyCity: "", position: "", source: "", attach: "Curriculum Vitae, Ijazah dan transkrip nilai, Pas foto" });
  const sp = (k: keyof typeof p) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP({ ...p, [k]: e.target.value });
  const sl = (k: keyof typeof l) => (e: React.ChangeEvent<HTMLInputElement>) => setL({ ...l, [k]: e.target.value });

  const buildCv = async () => {
    const pdf = await createPdf();
    pdf.text(p.name, { size: 22, bold: true });
    if (p.role) pdf.text(p.role, { size: 12 });
    pdf.text([p.email, p.phone, p.address].filter(Boolean).join("  |  "), { size: 9 });
    const section = (title: string) => {
      pdf.gap(10);
      pdf.text(title.toUpperCase(), { bold: true, size: 11 });
      pdf.rule();
    };
    if (p.summary.trim()) {
      section(t("tool.cv-maker.summary"));
      pdf.text(p.summary);
    }
    const list = (title: string, items: Entry[]) => {
      const rows = items.filter((e) => e.title || e.sub);
      if (!rows.length) return;
      section(title);
      for (const e of rows) {
        const m = PAGE.margin;
        pdf.row([
          { text: e.title, x: m, w: pdf.inner - 130, bold: true },
          { text: e.period, x: m + pdf.inner - 120, w: 120, align: "right" },
        ]);
        if (e.sub) pdf.text(e.sub);
        if (e.desc.trim()) pdf.text(e.desc, { size: 9.5 });
        pdf.gap(6);
      }
    };
    list(t("tool.cv-maker.work"), work);
    list(t("tool.cv-maker.education"), edu);
    if (p.skills.trim()) {
      section(t("tool.cv-maker.skills"));
      pdf.text(p.skills.split(",").map((s) => s.trim()).filter(Boolean).join("  •  "));
    }
    return pdf;
  };

  const buildLetter = async () => {
    const pdf = await createPdf();
    pdf.text(`${l.city}${l.city && ", "}${l.date || new Date().toISOString().slice(0, 10)}`, { align: "right" });
    pdf.gap(14);
    pdf.text(`Perihal: Lamaran Pekerjaan sebagai ${l.position}`, { bold: true });
    pdf.gap(10);
    pdf.text(`Yth. ${l.to}\n${l.company}\n${l.companyCity}`);
    pdf.gap(10);
    pdf.text("Dengan hormat,");
    pdf.gap(6);
    pdf.text(`Berdasarkan informasi lowongan${l.source ? ` dari ${l.source}` : ""}, saya yang bertanda tangan di bawah ini:`);
    pdf.gap(4);
    pdf.text(`Nama      : ${p.name}\nAlamat    : ${p.address}\nTelepon  : ${p.phone}\nEmail      : ${p.email}`);
    pdf.gap(6);
    pdf.text(`bermaksud mengajukan lamaran untuk posisi ${l.position} di ${l.company}. Saya yakin pengalaman dan keterampilan saya sesuai dengan kebutuhan perusahaan Bapak/Ibu.`);
    pdf.gap(6);
    pdf.text(`Sebagai bahan pertimbangan, saya lampirkan:\n${l.attach.split(",").map((a, i) => `${i + 1}. ${a.trim()}`).join("\n")}`);
    pdf.gap(6);
    pdf.text("Demikian surat lamaran ini saya buat. Atas perhatian dan kesempatan yang diberikan, saya ucapkan terima kasih.");
    pdf.gap(14);
    pdf.text("Hormat saya,");
    pdf.gap(50);
    pdf.text(p.name, { bold: true });
    return pdf;
  };

  const download = async () => {
    try {
      const pdf = await (tab === "cv" ? buildCv() : buildLetter());
      downloadPdf(await pdf.save(), `${tab === "cv" ? "cv" : "surat-lamaran"}-${p.name.trim().replace(/\s+/g, "-").toLowerCase() || "saya"}.pdf`);
      toast({ description: t("toast.success.downloaded") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  return (
    <div className="max-w-screen-lg flex flex-col gap-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "cv" | "letter")}>
        <TabsList>
          <TabsTrigger value="cv">CV</TabsTrigger>
          <TabsTrigger value="letter">{t("tool.cv-maker.letter")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormGroup label={t("tool.cv-maker.full-name")}><Input value={p.name} onChange={sp("name")} /></FormGroup>
        <FormGroup label={t("tool.cv-maker.role")}><Input value={p.role} onChange={sp("role")} /></FormGroup>
        <FormGroup label="Email"><Input type="email" value={p.email} onChange={sp("email")} /></FormGroup>
        <FormGroup label={t("tool.cv-maker.phone")}><Input value={p.phone} onChange={sp("phone")} /></FormGroup>
        <div className="sm:col-span-2"><FormGroup label={t("tool.cv-maker.address")}><Input value={p.address} onChange={sp("address")} /></FormGroup></div>
      </div>

      {tab === "cv" ? (
        <>
          <FormGroup label={t("tool.cv-maker.summary")}><Textarea rows={3} value={p.summary} onChange={sp("summary")} /></FormGroup>
          <EntryList label={t("tool.cv-maker.work")} items={work} onChange={setWork} ph={[t("tool.cv-maker.position"), t("tool.cv-maker.company")]} />
          <EntryList label={t("tool.cv-maker.education")} items={edu} onChange={setEdu} ph={[t("tool.cv-maker.school"), t("tool.cv-maker.major")]} />
          <FormGroup label={t("tool.cv-maker.skills")} hint={t("tool.cv-maker.skills-hint")}><Input value={p.skills} onChange={sp("skills")} /></FormGroup>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormGroup label={t("tool.cv-maker.city")}><Input value={l.city} onChange={sl("city")} /></FormGroup>
          <FormGroup label={t("tool.cv-maker.letter-date")}><Input type="date" value={l.date} onChange={sl("date")} /></FormGroup>
          <FormGroup label={t("tool.cv-maker.addressee")}><Input value={l.to} onChange={sl("to")} /></FormGroup>
          <FormGroup label={t("tool.cv-maker.company")}><Input value={l.company} onChange={sl("company")} /></FormGroup>
          <FormGroup label={t("tool.cv-maker.company-city")}><Input value={l.companyCity} onChange={sl("companyCity")} /></FormGroup>
          <FormGroup label={t("tool.cv-maker.applied-position")}><Input value={l.position} onChange={sl("position")} /></FormGroup>
          <FormGroup label={t("tool.cv-maker.source")}><Input value={l.source} onChange={sl("source")} placeholder="LinkedIn, JobStreet, ..." /></FormGroup>
          <FormGroup label={t("tool.cv-maker.attachments")} hint={t("tool.cv-maker.skills-hint")}><Input value={l.attach} onChange={sl("attach")} /></FormGroup>
        </div>
      )}

      <Button className="self-start" onClick={download} disabled={!p.name.trim()}>
        <Download className="h-4 w-4 mr-2" />{t("tool.cv-maker.download")}
      </Button>
    </div>
  );
}
