"use client";

import { useRef, useState } from "react";
import {
  CalendarClock,
  Clock,
  Download,
  LayoutGrid,
  MapPin,
  Pencil,
  Plus,
  Table2,
  Trash2,
} from "lucide-react";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;
type Day = (typeof DAYS)[number];

interface ScheduleItem {
  id: string;
  day: Day;
  start: string;
  end: string;
  title: string;
  location?: string;
  notes?: string;
  color: string;
}

const SWATCHES = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#64748b",
];

function makeItem(partial: Omit<ScheduleItem, "id">): ScheduleItem {
  return { id: crypto.randomUUID(), ...partial };
}

interface Template {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  items: ScheduleItem[];
}

const TEMPLATES: Template[] = [
  {
    id: "weekly-class",
    label: "Jadwal Kelas Mingguan",
    title: "Jadwal Kelas Mingguan",
    subtitle: "Kelas 6A · Semester Ganjil",
    items: [
      makeItem({ day: "Senin", start: "07:00", end: "08:30", title: "Matematika", color: SWATCHES[0] }),
      makeItem({ day: "Senin", start: "08:30", end: "10:00", title: "Bahasa Indonesia", color: SWATCHES[1] }),
      makeItem({ day: "Senin", start: "10:00", end: "10:15", title: "Istirahat", color: SWATCHES[7] }),
      makeItem({ day: "Selasa", start: "07:00", end: "08:30", title: "IPA", color: SWATCHES[2] }),
      makeItem({ day: "Rabu", start: "07:00", end: "08:30", title: "Bahasa Inggris", color: SWATCHES[3] }),
      makeItem({ day: "Jumat", start: "07:00", end: "08:30", title: "Olahraga", color: SWATCHES[4] }),
    ],
  },
  {
    id: "weekly-shift",
    label: "Jadwal Kerja Shift",
    title: "Jadwal Kerja Shift",
    subtitle: "Tim Operasional · Minggu Ini",
    items: [
      makeItem({ day: "Senin", start: "07:00", end: "15:00", title: "Shift Pagi", color: SWATCHES[2] }),
      makeItem({ day: "Senin", start: "15:00", end: "23:00", title: "Shift Siang", color: SWATCHES[3] }),
      makeItem({ day: "Selasa", start: "23:00", end: "07:00", title: "Shift Malam", color: SWATCHES[0] }),
      makeItem({ day: "Rabu", start: "07:00", end: "15:00", title: "Shift Pagi", color: SWATCHES[2] }),
      makeItem({ day: "Kamis", start: "15:00", end: "23:00", title: "Shift Siang", color: SWATCHES[3] }),
    ],
  },
  {
    id: "daily-agenda",
    label: "Agenda Harian",
    title: "Agenda Harian",
    subtitle: "Hari Ini",
    items: [
      makeItem({ day: "Senin", start: "08:00", end: "08:30", title: "Morning Briefing", color: SWATCHES[0] }),
      makeItem({ day: "Senin", start: "09:00", end: "11:00", title: "Deep Work", color: SWATCHES[1] }),
      makeItem({ day: "Senin", start: "12:00", end: "13:00", title: "Makan Siang", color: SWATCHES[7] }),
      makeItem({ day: "Senin", start: "13:30", end: "14:30", title: "Meeting Tim", color: SWATCHES[4] }),
      makeItem({ day: "Senin", start: "16:00", end: "17:00", title: "Review Harian", color: SWATCHES[2] }),
    ],
  },
  {
    id: "event-timeline",
    label: "Jadwal Acara / Event",
    title: "Jadwal Acara",
    subtitle: "Seminar Nasional 2026",
    items: [
      makeItem({ day: "Senin", start: "08:00", end: "08:30", title: "Registrasi", location: "Lobby Utama", color: SWATCHES[7] }),
      makeItem({ day: "Senin", start: "08:30", end: "09:00", title: "Sambutan", location: "Aula A", color: SWATCHES[0] }),
      makeItem({ day: "Senin", start: "09:00", end: "11:00", title: "Sesi 1: Keynote", location: "Aula A", color: SWATCHES[1] }),
      makeItem({ day: "Senin", start: "11:00", end: "12:00", title: "Sesi 2: Workshop", location: "Ruang B", color: SWATCHES[2] }),
      makeItem({ day: "Senin", start: "16:00", end: "16:30", title: "Penutupan", location: "Aula A", color: SWATCHES[4] }),
    ],
  },
  {
    id: "blank",
    label: "Kosong (Custom)",
    title: "Jadwal Saya",
    subtitle: "",
    items: [],
  },
];

type ViewMode = "table" | "card";
type ExportFormat = "png" | "pdf" | "csv";

const EXPORT_FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "png", label: "PNG Image" },
  { id: "pdf", label: "PDF Document" },
  { id: "csv", label: "CSV Spreadsheet" },
];

const EMPTY_FORM = {
  day: "Senin" as Day,
  start: "08:00",
  end: "09:00",
  title: "",
  location: "",
  notes: "",
  color: SWATCHES[0],
};

function sortItems(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.start.localeCompare(b.start);
  });
}

export default function ScheduleMakerPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const previewRef = useRef<HTMLDivElement>(null);

  const defaultTemplate = TEMPLATES[0];
  const [templateId, setTemplateId] = useState(defaultTemplate.id);
  const [scheduleTitle, setScheduleTitle] = useState(defaultTemplate.title);
  const [scheduleSubtitle, setScheduleSubtitle] = useState(defaultTemplate.subtitle);
  const [items, setItems] = useState<ScheduleItem[]>(defaultTemplate.items);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const applyTemplate = (id: string) => {
    const tmpl = TEMPLATES.find((tp) => tp.id === id) ?? TEMPLATES[0];
    setTemplateId(id);
    setScheduleTitle(tmpl.title);
    setScheduleSubtitle(tmpl.subtitle);
    setItems(tmpl.items.map((it) => ({ ...it, id: crypto.randomUUID() })));
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setForm({
      day: item.day,
      start: item.start,
      end: item.end,
      title: item.title,
      location: item.location ?? "",
      notes: item.notes ?? "",
      color: item.color,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (editingId === id) cancelEdit();
  };

  const saveItem = () => {
    if (!form.title.trim()) {
      toast({
        title: "Failed",
        description: "Please enter an activity title.",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingId
            ? {
                ...it,
                day: form.day,
                start: form.start,
                end: form.end,
                title: form.title.trim(),
                location: form.location.trim() || undefined,
                notes: form.notes.trim() || undefined,
                color: form.color,
              }
            : it,
        ),
      );
    } else {
      setItems((prev) => [
        ...prev,
        makeItem({
          day: form.day,
          start: form.start,
          end: form.end,
          title: form.title.trim(),
          location: form.location.trim() || undefined,
          notes: form.notes.trim() || undefined,
          color: form.color,
        }),
      ]);
    }
    cancelEdit();
  };

  const handleReset = () => {
    applyTemplate("blank");
  };

  const buildCsvRows = () =>
    sortItems(items).map((it) => [
      it.day,
      it.start,
      it.end,
      it.title,
      it.location ?? "",
      it.notes ?? "",
    ]);

  const handleExport = async () => {
    try {
      if (exportFormat === "csv") {
        downloadCsv(
          ["Hari", "Mulai", "Selesai", "Kegiatan", "Lokasi", "Catatan"],
          buildCsvRows(),
          "jadwal.csv",
        );
      } else {
        if (!previewRef.current) throw new Error("Preview not ready.");
        if (exportFormat === "png") {
          await downloadNodeAsPng(previewRef.current, "jadwal.png");
        } else {
          await downloadNodeAsPdf(previewRef.current, "jadwal.pdf");
        }
      }
      toast({ title: t("common.success"), description: t("toast.success.downloaded") });
    } catch {
      toast({
        title: "Failed",
        description: "Failed to export schedule.",
        variant: "destructive",
      });
    }
  };

  const sorted = sortItems(items);
  const daysWithItems = DAYS.filter((d) => sorted.some((it) => it.day === d));

  return (
    <ToolShell
      title={t("tool.schedule-maker.name") || "Schedule Maker"}
      description={
        t("tool.schedule-maker.description") ||
        "Build a class, work, or event schedule from ready-made templates or from scratch."
      }
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Template
                </Label>
                <Select value={templateId} onValueChange={applyTemplate}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((tmpl) => (
                      <SelectItem key={tmpl.id} value={tmpl.id}>
                        {tmpl.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Title</Label>
                <Input
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  placeholder="Jadwal Saya"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Subtitle</Label>
                <Input
                  value={scheduleSubtitle}
                  onChange={(e) => setScheduleSubtitle(e.target.value)}
                  placeholder="Kelas 6A · Semester Ganjil"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  View
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setViewMode("table")}
                  >
                    <Table2 className="h-4 w-4" />
                    Table
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "card" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setViewMode("card")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Card
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Items ({items.length})
                </Label>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No items yet. Add one below.</p>
                ) : (
                  <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                    {sorted.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center gap-2 rounded-md border border-input px-2 py-1.5 text-xs"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: it.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{it.title}</p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {it.day} · {it.start}-{it.end}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startEdit(it)}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="Edit item"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(it.id)}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                          aria-label="Delete item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-input p-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {editingId ? "Edit Item" : "Add Item"}
                </Label>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Day</Label>
                    <Select
                      value={form.day}
                      onValueChange={(v) => setForm((f) => ({ ...f, day: v as Day }))}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Title</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Matematika"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Start</Label>
                    <Input
                      type="time"
                      value={form.start}
                      onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">End</Label>
                    <Input
                      type="time"
                      value={form.end}
                      onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Location (optional)</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Ruang B"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Notes (optional)</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    className="min-h-[60px] text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        title={c}
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className={cn(
                          "h-7 w-7 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10",
                          form.color === c &&
                            "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        )}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" size="sm" className="flex-1 gap-2" onClick={saveItem}>
                    <Plus className="h-4 w-4" />
                    {editingId ? "Save Item" : "Add Item"}
                  </Button>
                  {editingId && (
                    <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Export
                </Label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_FORMATS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ToolActionBar
              primaryLabel={t("action.download") || "Export"}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={handleExport}
              onReset={handleReset}
            >
              <CopyImageButton
                getBlob={() => nodeToPngBlob(previewRef.current!)}
                disabled={items.length === 0}
              />
            </ToolActionBar>
          </>
        }
      >
        <div className="flex justify-center overflow-x-auto rounded-xl border bg-muted/30 p-4 sm:p-8">
          <div
            ref={previewRef}
            className="w-full max-w-3xl bg-white text-slate-900"
            style={{ padding: 32 }}
          >
            <div className="mb-6 border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">{scheduleTitle || "Jadwal Saya"}</h2>
              {scheduleSubtitle && (
                <p className="mt-1 text-sm text-slate-500">{scheduleSubtitle}</p>
              )}
            </div>

            {items.length === 0 ? (
              <ToolEmptyState
                icon={<CalendarClock className="h-6 w-6" />}
                title="No schedule items yet"
                hint="Add items from the sidebar to build your schedule."
                className="py-12"
              />
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-2 pr-3">Day</th>
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 pr-3">Activity</th>
                      <th className="py-2 pr-3">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((it) => (
                      <tr key={it.id} className="border-b border-slate-100">
                        <td className="py-2 pr-3 text-slate-700">{it.day}</td>
                        <td className="whitespace-nowrap py-2 pr-3 text-slate-700">
                          {it.start} – {it.end}
                        </td>
                        <td className="py-2 pr-3">
                          <span className="flex items-center gap-2 font-medium text-slate-900">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: it.color }}
                            />
                            {it.title}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-slate-500">{it.location ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-6">
                {daysWithItems.map((day) => (
                  <div key={day}>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                      {day}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {sorted
                        .filter((it) => it.day === day)
                        .map((it) => (
                          <div
                            key={it.id}
                            className="rounded-md border border-slate-200 bg-slate-50 py-2 pl-3 pr-3"
                            style={{ borderLeft: `4px solid ${it.color}` }}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                              <Clock className="h-3.5 w-3.5" />
                              {it.start} – {it.end}
                            </div>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">{it.title}</p>
                            {it.location && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                <MapPin className="h-3 w-3" />
                                {it.location}
                              </p>
                            )}
                            {it.notes && (
                              <p className="mt-1 text-xs text-slate-400">{it.notes}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ToolWorkspace>
    </ToolShell>
  );
}
