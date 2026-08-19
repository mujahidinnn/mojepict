"use client";

import { useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  LayoutGrid,
  MapPin,
  Pencil,
  Plus,
  Table2,
  Trash2,
} from "lucide-react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  downloadCsv,
  downloadNodeAsPdf,
  downloadNodeAsPng,
  downloadTextFile,
  nodeToPngBlob,
} from "@/lib/export-node";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;
type Day = (typeof DAYS)[number];

interface ScheduleItem {
  id: string;
  date: string; // ISO "YYYY-MM-DD"
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

function isoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function todayIso(): string {
  return isoDate(new Date());
}

/** Formats an ISO date like "2026-08-12" as "Rabu, 12 Agu 2026". */
function formatDateLabel(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEEE, d MMM yyyy", { locale: idLocale });
  } catch {
    return dateStr;
  }
}

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

// Anchor template dates to the Monday of the current week so ready-made
// templates always show a sensible, non-stale-looking week.
const TEMPLATE_BASE_MONDAY = startOfWeek(new Date(), { weekStartsOn: 1 });
function dateForDayOffset(offset: number): string {
  return isoDate(addDays(TEMPLATE_BASE_MONDAY, offset));
}
const D = {
  Senin: dateForDayOffset(0),
  Selasa: dateForDayOffset(1),
  Rabu: dateForDayOffset(2),
  Kamis: dateForDayOffset(3),
  Jumat: dateForDayOffset(4),
  Sabtu: dateForDayOffset(5),
  Minggu: dateForDayOffset(6),
};

const TEMPLATES: Template[] = [
  {
    id: "weekly-class",
    label: "Jadwal Kelas Mingguan",
    title: "Jadwal Kelas Mingguan",
    subtitle: "Kelas 6A · Semester Ganjil",
    items: [
      makeItem({ date: D.Senin, start: "07:00", end: "08:30", title: "Matematika", color: SWATCHES[0] }),
      makeItem({ date: D.Senin, start: "08:30", end: "10:00", title: "Bahasa Indonesia", color: SWATCHES[1] }),
      makeItem({ date: D.Senin, start: "10:00", end: "10:15", title: "Istirahat", color: SWATCHES[7] }),
      makeItem({ date: D.Selasa, start: "07:00", end: "08:30", title: "IPA", color: SWATCHES[2] }),
      makeItem({ date: D.Rabu, start: "07:00", end: "08:30", title: "Bahasa Inggris", color: SWATCHES[3] }),
      makeItem({ date: D.Jumat, start: "07:00", end: "08:30", title: "Olahraga", color: SWATCHES[4] }),
    ],
  },
  {
    id: "weekly-shift",
    label: "Jadwal Kerja Shift",
    title: "Jadwal Kerja Shift",
    subtitle: "Tim Operasional · Minggu Ini",
    items: [
      makeItem({ date: D.Senin, start: "07:00", end: "15:00", title: "Shift Pagi", color: SWATCHES[2] }),
      makeItem({ date: D.Senin, start: "15:00", end: "23:00", title: "Shift Siang", color: SWATCHES[3] }),
      makeItem({ date: D.Selasa, start: "23:00", end: "07:00", title: "Shift Malam", color: SWATCHES[0] }),
      makeItem({ date: D.Rabu, start: "07:00", end: "15:00", title: "Shift Pagi", color: SWATCHES[2] }),
      makeItem({ date: D.Kamis, start: "15:00", end: "23:00", title: "Shift Siang", color: SWATCHES[3] }),
    ],
  },
  {
    id: "daily-agenda",
    label: "Agenda Harian",
    title: "Agenda Harian",
    subtitle: "Hari Ini",
    items: [
      makeItem({ date: D.Senin, start: "08:00", end: "08:30", title: "Morning Briefing", color: SWATCHES[0] }),
      makeItem({ date: D.Senin, start: "09:00", end: "11:00", title: "Deep Work", color: SWATCHES[1] }),
      makeItem({ date: D.Senin, start: "12:00", end: "13:00", title: "Makan Siang", color: SWATCHES[7] }),
      makeItem({ date: D.Senin, start: "13:30", end: "14:30", title: "Meeting Tim", color: SWATCHES[4] }),
      makeItem({ date: D.Senin, start: "16:00", end: "17:00", title: "Review Harian", color: SWATCHES[2] }),
    ],
  },
  {
    id: "event-timeline",
    label: "Jadwal Acara / Event",
    title: "Jadwal Acara",
    subtitle: "Seminar Nasional 2026",
    items: [
      makeItem({ date: D.Senin, start: "08:00", end: "08:30", title: "Registrasi", location: "Lobby Utama", color: SWATCHES[7] }),
      makeItem({ date: D.Senin, start: "08:30", end: "09:00", title: "Sambutan", location: "Aula A", color: SWATCHES[0] }),
      makeItem({ date: D.Senin, start: "09:00", end: "11:00", title: "Sesi 1: Keynote", location: "Aula A", color: SWATCHES[1] }),
      makeItem({ date: D.Senin, start: "11:00", end: "12:00", title: "Sesi 2: Workshop", location: "Ruang B", color: SWATCHES[2] }),
      makeItem({ date: D.Senin, start: "16:00", end: "16:30", title: "Penutupan", location: "Aula A", color: SWATCHES[4] }),
    ],
  },
  {
    id: "college-class",
    label: "Jadwal Kuliah",
    title: "Jadwal Kuliah",
    subtitle: "Semester Ganjil 2026/2027",
    items: [
      makeItem({
        date: D.Senin,
        start: "07:30",
        end: "09:10",
        title: "Kalkulus I",
        location: "Ruang 301",
        notes: "Dosen: Dr. Ahmad Fauzi · 3 SKS",
        color: SWATCHES[0],
      }),
      makeItem({
        date: D.Senin,
        start: "09:10",
        end: "10:50",
        title: "Algoritma & Pemrograman",
        location: "Lab Komputer 2",
        notes: "Dosen: Siti Nurhaliza, M.Kom · 3 SKS",
        color: SWATCHES[1],
      }),
      makeItem({
        date: D.Selasa,
        start: "10:00",
        end: "11:40",
        title: "Fisika Dasar",
        location: "Ruang 205",
        notes: "Dosen: Prof. Bambang Wijaya · 2 SKS",
        color: SWATCHES[2],
      }),
      makeItem({
        date: D.Rabu,
        start: "13:00",
        end: "15:30",
        title: "Praktikum Basis Data",
        location: "Lab Komputer 1",
        notes: "Dosen: Rina Marlina, M.T. · 1 SKS",
        color: SWATCHES[3],
      }),
      makeItem({
        date: D.Kamis,
        start: "08:00",
        end: "09:40",
        title: "Bahasa Inggris Akademik",
        location: "Ruang 110",
        notes: "Dosen: John Smith, M.A. · 2 SKS",
        color: SWATCHES[4],
      }),
    ],
  },
  {
    id: "prayer-weekly",
    label: "Jadwal Ibadah / Sholat Mingguan",
    title: "Jadwal Ibadah Mingguan",
    subtitle: "Waktu Sholat & Kajian",
    items: [
      makeItem({ date: D.Senin, start: "04:45", end: "05:00", title: "Sholat Subuh", color: SWATCHES[0] }),
      makeItem({ date: D.Senin, start: "12:00", end: "12:15", title: "Sholat Dzuhur", color: SWATCHES[1] }),
      makeItem({ date: D.Senin, start: "15:15", end: "15:30", title: "Sholat Ashar", color: SWATCHES[2] }),
      makeItem({ date: D.Senin, start: "18:00", end: "18:15", title: "Sholat Maghrib", color: SWATCHES[3] }),
      makeItem({ date: D.Senin, start: "19:15", end: "19:30", title: "Sholat Isya", color: SWATCHES[4] }),
      makeItem({
        date: D.Jumat,
        start: "11:45",
        end: "12:30",
        title: "Sholat Jumat",
        location: "Masjid Al-Ikhlas",
        color: SWATCHES[5],
      }),
      makeItem({
        date: D.Minggu,
        start: "19:30",
        end: "20:30",
        title: "Kajian Rutin",
        location: "Masjid Al-Ikhlas",
        notes: "Tema: Fiqih Ibadah",
        color: SWATCHES[6],
      }),
    ],
  },
  {
    id: "duty-roster",
    label: "Jadwal Piket",
    title: "Jadwal Piket Kelas",
    subtitle: "Kelas 6A · Minggu Ini",
    items: [
      makeItem({
        date: D.Senin,
        start: "06:30",
        end: "07:00",
        title: "Piket: Kelompok A (Andi, Budi, Citra)",
        notes: "Menyapu & merapikan meja",
        color: SWATCHES[0],
      }),
      makeItem({
        date: D.Selasa,
        start: "06:30",
        end: "07:00",
        title: "Piket: Kelompok B (Dewi, Eka, Farhan)",
        color: SWATCHES[1],
      }),
      makeItem({
        date: D.Rabu,
        start: "06:30",
        end: "07:00",
        title: "Piket: Kelompok C (Gita, Hadi, Indah)",
        color: SWATCHES[2],
      }),
      makeItem({
        date: D.Kamis,
        start: "06:30",
        end: "07:00",
        title: "Piket: Kelompok D (Joko, Kiki, Lala)",
        color: SWATCHES[3],
      }),
      makeItem({
        date: D.Jumat,
        start: "06:30",
        end: "07:00",
        title: "Piket: Kelompok E (Made, Nina, Oki)",
        color: SWATCHES[4],
      }),
      makeItem({
        date: D.Sabtu,
        start: "06:30",
        end: "07:00",
        title: "Piket: Kelompok A (Andi, Budi, Citra)",
        notes: "Piket besar mingguan",
        color: SWATCHES[0],
      }),
    ],
  },
  {
    id: "workout-plan",
    label: "Jadwal Latihan / Olahraga",
    title: "Jadwal Latihan Mingguan",
    subtitle: "Program Kebugaran",
    items: [
      makeItem({
        date: D.Senin,
        start: "06:00",
        end: "07:00",
        title: "Lari Pagi",
        notes: "Intensitas: Ringan · Kardio 5 km",
        color: SWATCHES[0],
      }),
      makeItem({
        date: D.Selasa,
        start: "17:00",
        end: "18:15",
        title: "Latihan Beban - Upper Body",
        location: "Gym Fitcenter",
        notes: "Intensitas: Sedang · Push, Pull",
        color: SWATCHES[1],
      }),
      makeItem({
        date: D.Rabu,
        start: "06:30",
        end: "07:15",
        title: "Yoga & Stretching",
        notes: "Intensitas: Ringan · Pemulihan",
        color: SWATCHES[2],
      }),
      makeItem({
        date: D.Kamis,
        start: "17:00",
        end: "18:15",
        title: "Latihan Beban - Lower Body",
        location: "Gym Fitcenter",
        notes: "Intensitas: Berat · Squat, Deadlift",
        color: SWATCHES[3],
      }),
      makeItem({
        date: D.Sabtu,
        start: "07:00",
        end: "08:30",
        title: "Bersepeda",
        notes: "Intensitas: Sedang · Jarak 20 km",
        color: SWATCHES[4],
      }),
    ],
  },
  {
    id: "health-checkup",
    label: "Jadwal Kontrol Kesehatan / Terapi",
    title: "Jadwal Kontrol & Terapi",
    subtitle: "Rencana Perawatan",
    items: [
      makeItem({
        date: D.Senin,
        start: "09:00",
        end: "09:30",
        title: "Kontrol Dokter Umum",
        location: "Klinik Sehat Sentosa - dr. Andi Prasetyo",
        notes: "Cek tekanan darah rutin",
        color: SWATCHES[0],
      }),
      makeItem({
        date: D.Rabu,
        start: "14:00",
        end: "15:00",
        title: "Terapi Fisik",
        location: "RS Harapan Bunda - Fisioterapi",
        notes: "Terapis: Rangga Saputra, S.Ft",
        color: SWATCHES[1],
      }),
      makeItem({
        date: D.Kamis,
        start: "10:00",
        end: "10:30",
        title: "Kontrol Gigi",
        location: "Klinik Gigi Ceria - drg. Maya Sari",
        color: SWATCHES[2],
      }),
      makeItem({
        date: D.Jumat,
        start: "16:00",
        end: "16:30",
        title: "Konsultasi Gizi",
        location: "Klinik Sehat Sentosa - Ahli Gizi Rina",
        color: SWATCHES[3],
      }),
    ],
  },
  {
    id: "content-calendar",
    label: "Jadwal Konten / Posting Media Sosial",
    title: "Kalender Konten Media Sosial",
    subtitle: "Bulan Ini",
    items: [
      makeItem({
        date: D.Senin,
        start: "09:00",
        end: "09:30",
        title: "Post: Tips & Trik",
        notes: "Platform: Instagram · Tipe: Carousel",
        color: SWATCHES[0],
      }),
      makeItem({
        date: D.Selasa,
        start: "12:00",
        end: "12:30",
        title: "Post: Behind the Scenes",
        notes: "Platform: TikTok · Tipe: Video Pendek",
        color: SWATCHES[1],
      }),
      makeItem({
        date: D.Rabu,
        start: "15:00",
        end: "15:30",
        title: "Post: Promo Produk",
        notes: "Platform: Instagram · Tipe: Reels",
        color: SWATCHES[2],
      }),
      makeItem({
        date: D.Kamis,
        start: "10:00",
        end: "10:30",
        title: "Post: Thread Edukasi",
        notes: "Platform: X (Twitter) · Tipe: Thread",
        color: SWATCHES[3],
      }),
      makeItem({
        date: D.Jumat,
        start: "17:00",
        end: "17:30",
        title: "Post: Rangkuman Mingguan",
        notes: "Platform: YouTube · Tipe: Video",
        color: SWATCHES[4],
      }),
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

type ViewMode = "table" | "card" | "month";
type ExportFormat = "png" | "pdf" | "csv" | "ics";
type FormMode = "single" | "recurring";

const EXPORT_FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "png", label: "PNG Image" },
  { id: "pdf", label: "PDF Document" },
  { id: "csv", label: "CSV Spreadsheet" },
  { id: "ics", label: "ICS Calendar (Google/Outlook/Apple)" },
];

interface SingleForm {
  date: string;
  start: string;
  end: string;
  title: string;
  location: string;
  notes: string;
  color: string;
}

function createEmptyForm(): SingleForm {
  return {
    date: todayIso(),
    start: "08:00",
    end: "09:00",
    title: "",
    location: "",
    notes: "",
    color: SWATCHES[0],
  };
}

interface RecurringForm {
  title: string;
  start: string;
  end: string;
  location: string;
  notes: string;
  color: string;
  days: Day[];
  from: string;
  to: string;
  intervalWeeks: number;
  excludeDates: string[];
}

function createEmptyRecurringForm(): RecurringForm {
  const today = todayIso();
  return {
    title: "",
    start: "08:00",
    end: "09:00",
    location: "",
    notes: "",
    color: SWATCHES[0],
    days: [],
    from: today,
    to: today,
    intervalWeeks: 1,
    excludeDates: [],
  };
}

const MAX_RECURRING_SPAN_DAYS = 3660; // ~10 years, guards against accidental huge ranges
const MAX_RECURRING_ITEMS = 500;

function sortItems(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.start.localeCompare(b.start);
  });
}

/** Turns "2026-08-12" + "08:00" into the floating-time ICS form "20260812T080000". */
function toIcsDate(date: string, time: string): string {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

/** Escapes text per RFC 5545 §3.3.11: backslash, comma, semicolon, and literal newlines. */
function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatUtcStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours(),
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function buildIcsContent(items: ScheduleItem[]): string {
  const dtstamp = formatUtcStamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mojepict//Schedule Maker//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const it of items) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${crypto.randomUUID()}@mojepict.vercel.app`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${toIcsDate(it.date, it.start)}`);
    lines.push(`DTEND:${toIcsDate(it.date, it.end)}`);
    lines.push(`SUMMARY:${escapeIcsText(it.title)}`);
    if (it.location) lines.push(`LOCATION:${escapeIcsText(it.location)}`);
    if (it.notes) lines.push(`DESCRIPTION:${escapeIcsText(it.notes)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
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
  const [formMode, setFormMode] = useState<FormMode>("single");
  const [form, setForm] = useState<SingleForm>(createEmptyForm);
  const [recurForm, setRecurForm] = useState<RecurringForm>(createEmptyRecurringForm);
  const [excludeDraft, setExcludeDraft] = useState<string>(todayIso());
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const applyTemplate = (id: string) => {
    const tmpl = TEMPLATES.find((tp) => tp.id === id) ?? TEMPLATES[0];
    setTemplateId(id);
    setScheduleTitle(tmpl.title);
    setScheduleSubtitle(tmpl.subtitle);
    setItems(tmpl.items.map((it) => ({ ...it, id: crypto.randomUUID() })));
    setEditingId(null);
    setFormMode("single");
    setForm(createEmptyForm());
  };

  const startEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setFormMode("single");
    setForm({
      date: item.date,
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
    setForm(createEmptyForm());
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
    if (!form.date) {
      toast({
        title: "Failed",
        description: "Please pick a date.",
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
                date: form.date,
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
          date: form.date,
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

  const toggleRecurDay = (d: Day) => {
    setRecurForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d],
    }));
  };

  const addExcludeDate = () => {
    if (!excludeDraft) return;
    setRecurForm((f) =>
      f.excludeDates.includes(excludeDraft)
        ? f
        : { ...f, excludeDates: [...f.excludeDates, excludeDraft].sort() },
    );
  };

  const removeExcludeDate = (d: string) => {
    setRecurForm((f) => ({ ...f, excludeDates: f.excludeDates.filter((x) => x !== d) }));
  };

  const generateRecurring = () => {
    if (!recurForm.title.trim()) {
      toast({
        title: "Failed",
        description: "Please enter an activity title.",
        variant: "destructive",
      });
      return;
    }
    if (recurForm.days.length === 0) {
      toast({
        title: "Failed",
        description: "Select at least one day of the week.",
        variant: "destructive",
      });
      return;
    }
    if (!recurForm.from || !recurForm.to) {
      toast({
        title: "Failed",
        description: "Please set both a start and end date.",
        variant: "destructive",
      });
      return;
    }

    const fromDate = parseISO(recurForm.from);
    const toDate = parseISO(recurForm.to);
    if (toDate < fromDate) {
      toast({
        title: "Failed",
        description: "'To' date must be on or after 'From' date.",
        variant: "destructive",
      });
      return;
    }

    const spanDays = Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1;
    if (spanDays > MAX_RECURRING_SPAN_DAYS) {
      toast({
        title: "Failed",
        description: "Date range is too large. Please narrow it down.",
        variant: "destructive",
      });
      return;
    }

    const intervalWeeks = Math.max(1, Math.floor(recurForm.intervalWeeks) || 1);
    const excludeSet = new Set(recurForm.excludeDates);
    const selectedIndexes = new Set(recurForm.days.map((d) => DAYS.indexOf(d)));
    const generated: ScheduleItem[] = [];
    let cursor = fromDate;
    while (cursor <= toDate) {
      const jsDay = cursor.getDay(); // 0=Sun..6=Sat
      const ourIndex = (jsDay + 6) % 7; // 0=Senin..6=Minggu
      const candidateDate = isoDate(cursor);
      const diffDays = Math.round((cursor.getTime() - fromDate.getTime()) / 86_400_000);
      const weekIndex = Math.floor(diffDays / 7); // weeks elapsed since the start of the range
      const intervalMatches = weekIndex % intervalWeeks === 0;
      if (
        selectedIndexes.has(ourIndex) &&
        intervalMatches &&
        !excludeSet.has(candidateDate)
      ) {
        generated.push(
          makeItem({
            date: candidateDate,
            start: recurForm.start,
            end: recurForm.end,
            title: recurForm.title.trim(),
            location: recurForm.location.trim() || undefined,
            notes: recurForm.notes.trim() || undefined,
            color: recurForm.color,
          }),
        );
        if (generated.length > MAX_RECURRING_ITEMS) {
          toast({
            title: "Failed",
            description: `Too many items would be generated (max ${MAX_RECURRING_ITEMS}). Narrow the date range.`,
            variant: "destructive",
          });
          return;
        }
      }
      cursor = addDays(cursor, 1);
    }

    if (generated.length === 0) {
      toast({
        title: "Failed",
        description: "No matching dates found in that range.",
        variant: "destructive",
      });
      return;
    }

    setItems((prev) => [...prev, ...generated]);
    toast({
      title: t("common.success"),
      description: `${generated.length} items added.`,
    });
    setRecurForm(createEmptyRecurringForm());
    setExcludeDraft(todayIso());
  };

  const handleReset = () => {
    applyTemplate("blank");
  };

  const buildCsvRows = () =>
    sortItems(items).map((it) => [
      formatDateLabel(it.date),
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
          ["Tanggal", "Waktu Mulai", "Waktu Selesai", "Kegiatan", "Lokasi", "Catatan"],
          buildCsvRows(),
          "jadwal.csv",
        );
      } else if (exportFormat === "ics") {
        downloadTextFile(
          buildIcsContent(sortItems(items)),
          "jadwal.ics",
          "text/calendar;charset=utf-8",
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

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const it of sorted) {
      const arr = map.get(it.date) ?? [];
      arr.push(it);
      map.set(it.date, arr);
    }
    return map;
  }, [sorted]);

  const monthItems = useMemo(
    () => sorted.filter((it) => isSameMonth(parseISO(it.date), visibleMonth)),
    [sorted, visibleMonth],
  );
  const monthDates = useMemo(
    () => Array.from(new Set(monthItems.map((it) => it.date))),
    [monthItems],
  );

  const gridDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [visibleMonth]);

  const goPrevMonth = () => setVisibleMonth((m) => subMonths(m, 1));
  const goNextMonth = () => setVisibleMonth((m) => addMonths(m, 1));
  const goToday = () => {
    const now = new Date();
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const isEditingRecurring = false; // recurring mode never edits, only single items are edited

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
                  <Button
                    type="button"
                    variant={viewMode === "month" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setViewMode("month")}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Month
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
                            {formatDateLabel(it.date)} · {it.start}-{it.end}
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

                {!editingId && (
                  <Tabs value={formMode} onValueChange={(v) => setFormMode(v as FormMode)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="single" className="text-xs">
                        Single
                      </TabsTrigger>
                      <TabsTrigger value="recurring" className="text-xs">
                        Recurring
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}

                {editingId || formMode === "single" ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Date</Label>
                        <Input
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                          className="h-9 text-xs"
                        />
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
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Title</Label>
                      <Input
                        value={recurForm.title}
                        onChange={(e) => setRecurForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Meeting Mingguan"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Start</Label>
                        <Input
                          type="time"
                          value={recurForm.start}
                          onChange={(e) => setRecurForm((f) => ({ ...f, start: e.target.value }))}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">End</Label>
                        <Input
                          type="time"
                          value={recurForm.end}
                          onChange={(e) => setRecurForm((f) => ({ ...f, end: e.target.value }))}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Location (optional)</Label>
                      <Input
                        value={recurForm.location}
                        onChange={(e) => setRecurForm((f) => ({ ...f, location: e.target.value }))}
                        placeholder="Ruang B"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Notes (optional)</Label>
                      <Textarea
                        value={recurForm.notes}
                        onChange={(e) => setRecurForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="Additional notes..."
                        className="min-h-[50px] text-xs"
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
                            onClick={() => setRecurForm((f) => ({ ...f, color: c }))}
                            className={cn(
                              "h-7 w-7 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10",
                              recurForm.color === c &&
                                "ring-2 ring-primary ring-offset-2 ring-offset-background",
                            )}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Repeat on</Label>
                      <div className="flex flex-wrap gap-1">
                        {DAYS.map((d) => {
                          const active = recurForm.days.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => toggleRecurDay(d)}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                                active
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input text-muted-foreground hover:bg-muted",
                              )}
                            >
                              {d.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Repeat every (weeks)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={52}
                        value={recurForm.intervalWeeks}
                        onChange={(e) =>
                          setRecurForm((f) => ({
                            ...f,
                            intervalWeeks: Math.max(1, Number(e.target.value) || 1),
                          }))
                        }
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">From</Label>
                        <Input
                          type="date"
                          value={recurForm.from}
                          onChange={(e) => setRecurForm((f) => ({ ...f, from: e.target.value }))}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">To</Label>
                        <Input
                          type="date"
                          value={recurForm.to}
                          onChange={(e) => setRecurForm((f) => ({ ...f, to: e.target.value }))}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Exclude dates (optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={excludeDraft}
                          onChange={(e) => setExcludeDraft(e.target.value)}
                          className="h-9 flex-1 text-xs"
                        />
                        <Button type="button" size="sm" variant="outline" onClick={addExcludeDate}>
                          Add
                        </Button>
                      </div>
                      {recurForm.excludeDates.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {recurForm.excludeDates.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => removeExcludeDate(d)}
                              title="Click to remove"
                              className="inline-flex items-center gap-1 rounded-full border border-input px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                            >
                              {formatDateLabel(d)}
                              <Trash2 className="h-3 w-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="w-full gap-2"
                      onClick={generateRecurring}
                      disabled={isEditingRecurring}
                    >
                      <Plus className="h-4 w-4" />
                      Generate
                    </Button>
                  </>
                )}
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
        <div className="w-full">
          {viewMode !== "table" && (
            <div className="mx-auto mb-3 flex w-full max-w-3xl items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="icon" onClick={goPrevMonth} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={goToday}>
                  Today
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={goNextMonth} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm font-semibold capitalize">
                {format(visibleMonth, "MMMM yyyy", { locale: idLocale })}
              </p>
            </div>
          )}

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
                        <th className="py-2 pr-3">Date</th>
                        <th className="py-2 pr-3">Time</th>
                        <th className="py-2 pr-3">Activity</th>
                        <th className="py-2 pr-3">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((it) => (
                        <tr key={it.id} className="border-b border-slate-100">
                          <td className="whitespace-nowrap py-2 pr-3 text-slate-700">
                            {formatDateLabel(it.date)}
                          </td>
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
              ) : viewMode === "card" ? (
                monthDates.length === 0 ? (
                  <ToolEmptyState
                    icon={<CalendarClock className="h-6 w-6" />}
                    title="No items this month"
                    hint="Use the arrows above to browse other months, or add items for this one."
                    className="py-12"
                  />
                ) : (
                  <div className="space-y-6">
                    {monthDates.map((date) => (
                      <div key={date}>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                          {formatDateLabel(date)}
                        </h3>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {(itemsByDate.get(date) ?? []).map((it) => (
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
                )
              ) : (
                <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 text-[11px]">
                  {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((h) => (
                    <div
                      key={h}
                      className="bg-slate-100 py-1.5 text-center font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </div>
                  ))}
                  {gridDays.map((day) => {
                    const iso = isoDate(day);
                    const dayItems = itemsByDate.get(iso) ?? [];
                    const inMonth = isSameMonth(day, visibleMonth);
                    const today = isSameDay(day, new Date());
                    return (
                      <div
                        key={iso}
                        className={cn("min-h-[92px] bg-white p-1.5", !inMonth && "bg-slate-50")}
                      >
                        <p
                          className={cn(
                            "mb-1 text-right text-[11px] font-medium",
                            inMonth ? "text-slate-700" : "text-slate-300",
                            today && "font-bold text-indigo-600",
                          )}
                        >
                          {format(day, "d")}
                        </p>
                        <div className="space-y-0.5">
                          {dayItems.slice(0, 3).map((it) => (
                            <div
                              key={it.id}
                              className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px]"
                              style={{ background: `${it.color}1a` }}
                            >
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ background: it.color }}
                              />
                              <span className="truncate text-slate-700">{it.title}</span>
                            </div>
                          ))}
                          {dayItems.length > 3 && (
                            <p className="px-1 text-[10px] font-medium text-slate-400">
                              +{dayItems.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </ToolWorkspace>
    </ToolShell>
  );
}
