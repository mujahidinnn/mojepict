"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bell,
  Copy,
  Download,
  Gift,
  Megaphone,
  PartyPopper,
  Share2,
  Sparkles,
} from "lucide-react";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { downloadNodeAsPdf, downloadNodeAsPng, downloadTextFile, nodeToPngBlob } from "@/lib/export-node";

interface Template {
  id: string;
  label: string;
  text: string;
}

interface Category {
  id: string;
  label: string;
  icon: typeof Megaphone;
}

const CATEGORIES: Category[] = [
  { id: "promo", label: "Promo & Diskon", icon: Gift },
  { id: "announcement", label: "Pengumuman", icon: Megaphone },
  { id: "invitation", label: "Undangan & Acara", icon: PartyPopper },
  { id: "greeting", label: "Ucapan & Selamat", icon: Sparkles },
  { id: "reminder", label: "Pengingat", icon: Bell },
  { id: "custom", label: "Kosong (Custom)", icon: Copy },
];

const TEMPLATES: Record<string, Template[]> = {
  promo: [
    {
      id: "flash-sale",
      label: "Flash Sale",
      text:
        "FLASH SALE! ⚡\n\nKhusus hari ini, {produk} diskon {diskon} untuk semua pelanggan setia kami!\n\nBerlaku sampai {tanggal}. Jangan sampai kehabisan, stok terbatas!\n\nPesan sekarang via {kontak}.",
    },
    {
      id: "diskon-member",
      label: "Diskon Member",
      text:
        "Halo Sahabat! 🎉\n\nSebagai member setia, kamu dapat diskon spesial {diskon} untuk pembelian {produk} sampai {tanggal}.\n\nTunjukkan pesan ini saat checkout atau hubungi {kontak} untuk klaim promonya ya!",
    },
    {
      id: "produk-baru",
      label: "Produk Baru",
      text:
        "Kabar gembira! 🚀\n\nKami baru saja meluncurkan {produk} dengan harga perkenalan diskon {diskon}, hanya sampai {tanggal}.\n\nInfo lengkap & pemesanan hubungi {kontak}.",
    },
  ],
  announcement: [
    {
      id: "pengumuman-umum",
      label: "Pengumuman Umum",
      text:
        "PENGUMUMAN 📢\n\nKepada Yth. {tujuan},\n\n{isi}\n\nDemikian pengumuman ini disampaikan, atas perhatiannya kami ucapkan terima kasih.\n\nSalam,\n{pengirim}",
    },
    {
      id: "perubahan-jadwal",
      label: "Perubahan Jadwal",
      text:
        "PEMBERITAHUAN PERUBAHAN JADWAL\n\nKepada {tujuan},\n\n{isi}\n\nMohon maaf atas ketidaknyamanannya. Terima kasih atas pengertiannya.\n\nHormat kami,\n{pengirim}",
    },
  ],
  invitation: [
    {
      id: "undangan-acara",
      label: "Undangan Acara",
      text:
        "UNDANGAN 💌\n\nHalo {nama},\n\nDengan hormat, kami mengundang Anda untuk hadir pada acara {acara} yang akan diselenggarakan pada:\n\nTanggal: {tanggal}\nWaktu: {waktu}\nTempat: {tempat}\n\nKehadiran Anda sangat berarti bagi kami. Konfirmasi kehadiran dapat menghubungi {kontak}.\n\nSampai jumpa!",
    },
    {
      id: "undangan-webinar",
      label: "Undangan Webinar",
      text:
        "Halo {nama}! 👋\n\nYuk gabung di {acara}, akan membahas hal-hal seru dan bermanfaat untukmu.\n\nTanggal: {tanggal}\nWaktu: {waktu}\nTempat: {tempat}\n\nDaftar atau info lebih lanjut hubungi {kontak}. Ditunggu kehadirannya!",
    },
  ],
  greeting: [
    {
      id: "ucapan-selamat",
      label: "Ucapan Selamat",
      text:
        "Selamat {momen}! 🎉\n\nSemoga {harapan}.\n\nSalam hangat,\n{pengirim}",
    },
    {
      id: "ucapan-hari-besar",
      label: "Ucapan Hari Besar",
      text:
        "Menyambut {momen}, kami dari {pengirim} mengucapkan selamat merayakan.\n\nSemoga {harapan}. Mohon maaf lahir dan batin.\n\nSalam hangat,\n{pengirim}",
    },
  ],
  reminder: [
    {
      id: "pengingat-acara",
      label: "Pengingat Acara",
      text:
        "PENGINGAT ⏰\n\nHalo {nama},\n\nJangan lupa, {kegiatan} akan berlangsung pada:\n\nTanggal: {tanggal}\nWaktu: {waktu}\nTempat: {tempat}\n\nMohon hadir tepat waktu. Sampai jumpa!",
    },
    {
      id: "pengingat-pembayaran",
      label: "Pengingat Pembayaran",
      text:
        "PENGINGAT PEMBAYARAN\n\nHalo {nama},\n\nIni pengingat untuk {kegiatan} yang jatuh tempo pada {tanggal} pukul {waktu}.\n\nPembayaran dapat dilakukan di {tempat}. Terima kasih atas perhatiannya.",
    },
  ],
  custom: [
    {
      id: "blank",
      label: "Blank",
      text: "",
    },
  ],
};

function extractVariables(text: string): string[] {
  const matches = text.match(/\{([a-zA-Z0-9_]+)\}/g);
  if (!matches) return [];
  const unique = new Set(matches.map((m) => m.slice(1, -1)));
  return Array.from(unique);
}

function renderTemplate(text: string, variables: Record<string, string>): string {
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (full, tag) => {
    const value = variables[tag];
    return value && value.trim().length > 0 ? value : full;
  });
}

const CUSTOM_CATEGORY_ID = "custom";
const CUSTOM_TEMPLATE = TEMPLATES[CUSTOM_CATEGORY_ID][0];

type ExportFormat = "png" | "pdf" | "txt";

export default function BroadcastMakerPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const previewRef = useRef<HTMLDivElement>(null);

  const [categoryId, setCategoryId] = useState<string>(CATEGORIES[0].id);
  const [sourceText, setSourceText] = useState<string>(TEMPLATES[CATEGORIES[0].id][0].text);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [senderName, setSenderName] = useState("");
  const [format, setFormat] = useState<ExportFormat>("png");

  const activeCategory = CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];
  const templates = TEMPLATES[categoryId] ?? [];
  const detectedVariables = useMemo(() => extractVariables(sourceText), [sourceText]);
  const renderedText = useMemo(() => renderTemplate(sourceText, variables), [sourceText, variables]);

  function handleSelectCategory(id: string) {
    setCategoryId(id);
    const firstTemplate = TEMPLATES[id]?.[0];
    setSourceText(firstTemplate ? firstTemplate.text : "");
    setVariables({});
  }

  function handleSelectTemplate(template: Template) {
    setSourceText(template.text);
    setVariables({});
  }

  function handleVariableChange(tag: string, value: string) {
    setVariables((prev) => ({ ...prev, [tag]: value }));
  }

  function handleReset() {
    setCategoryId(CUSTOM_CATEGORY_ID);
    setSourceText(CUSTOM_TEMPLATE.text);
    setVariables({});
    setSenderName("");
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(renderedText);
      toast({ title: t("common.success") || "Success", description: t("toast.success.copied") || "Copied!" });
    } catch {
      toast({
        title: "Failed",
        description: "Could not copy text to clipboard.",
        variant: "destructive",
      });
    }
  }

  async function handleShare() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: renderedText });
      } catch (err) {
        // AbortError fires when the user cancels the native share sheet - not a real failure.
        if (err instanceof Error && err.name === "AbortError") return;
        toast({
          title: "Failed",
          description: "Could not share this message.",
          variant: "destructive",
        });
      }
      return;
    }
    toast({
      title: "Not supported",
      description: "Web Share isn't supported in this browser. Use Copy instead.",
    });
  }

  async function handleDownload() {
    if (!previewRef.current && format !== "txt") return;
    try {
      if (format === "png") {
        await downloadNodeAsPng(previewRef.current!, "broadcast.png");
      } else if (format === "pdf") {
        await downloadNodeAsPdf(previewRef.current!, "broadcast.pdf");
      } else {
        downloadTextFile(renderedText, "broadcast.txt");
      }
      toast({ title: t("common.success") || "Success", description: t("toast.success.downloaded") || "Downloaded!" });
    } catch {
      toast({
        title: "Failed",
        description: "Could not export the broadcast message.",
        variant: "destructive",
      });
    }
  }

  return (
    <ToolShell
      title={t("tool.broadcast-maker.name") || "Broadcast Maker"}
      description={
        t("tool.broadcast-maker.description") ||
        "Write promo, announcement, invitation, or greeting broadcasts from categorized templates with fill-in variables, then copy, share, or export the result as an image, PDF, or text file."
      }
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const active = c.id === categoryId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCategory(c.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {templates.length > 0 && templates[0].text !== "" && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Templates
                  </Label>
                  <div className="flex flex-col gap-1.5">
                    {templates.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tmpl)}
                        className={cn(
                          "rounded-md border px-3 py-2 text-left text-xs transition-colors",
                          sourceText === tmpl.text
                            ? "border-primary bg-primary/5"
                            : "border-input bg-background hover:bg-muted",
                        )}
                      >
                        <div className="font-medium">{tmpl.label}</div>
                        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {tmpl.text.replace(/\n/g, " ").slice(0, 60) || "Empty template"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-medium">Message</Label>
                <p className="text-[11px] text-muted-foreground">
                  Edit freely. Wrap words in curly braces like {"{name}"} to turn them into fill-in fields below.
                </p>
                <Textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  rows={10}
                  placeholder="Write your broadcast message..."
                  className="text-sm"
                />
              </div>

              {detectedVariables.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Fill in variables
                  </Label>
                  <div className="space-y-2">
                    {detectedVariables.map((tag) => (
                      <div key={tag} className="space-y-1">
                        <Label className="text-xs font-medium">{tag}</Label>
                        <Input
                          value={variables[tag] ?? ""}
                          onChange={(e) => handleVariableChange(tag, e.target.value)}
                          placeholder={`Value for {${tag}}`}
                          className="h-9 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-medium">Sender name (optional)</Label>
                <Input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Toko Berkah"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Export format
                </Label>
                <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG Image</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="txt">Text File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ToolActionBar
              primaryLabel="Copy Text"
              primaryIcon={<Copy className="h-4 w-4" />}
              onPrimary={handleCopyText}
              primaryDisabled={!renderedText}
              onReset={handleReset}
            >
              <CopyImageButton
                getBlob={() => nodeToPngBlob(previewRef.current!)}
                disabled={!renderedText}
                label="Copy as Image"
              />
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
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
        <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-border bg-muted/30 p-6">
          {/*
            Fixed hex colors (not bg-background/text-foreground) so the exported
            PNG/PDF always renders the WhatsApp light-bubble look regardless of
            the app's own light/dark theme.
          */}
          <div ref={previewRef} className="w-full max-w-sm" style={{ background: "#e5ded8", padding: 24, borderRadius: 12 }}>
            <div className="mb-2 flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className="gap-1 text-[11px]"
                style={{ background: "#ffffff", color: "#111b21" }}
              >
                <activeCategory.icon className="h-3 w-3" />
                {activeCategory.label}
              </Badge>
            </div>
            <div
              style={{
                background: "#dcf8c6",
                color: "#111b21",
                borderRadius: 10,
                padding: "12px 14px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                whiteSpace: "pre-wrap",
                fontSize: 14,
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}
            >
              {renderedText || "Your broadcast message will appear here..."}
            </div>
            {senderName && (
              <div style={{ marginTop: 8, textAlign: "right", fontSize: 12, color: "#54656f" }}>
                {senderName}
              </div>
            )}
          </div>
        </div>
      </ToolWorkspace>
    </ToolShell>
  );
}
