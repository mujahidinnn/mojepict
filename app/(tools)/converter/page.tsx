"use client";

import { ComponentType, Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
import { ToolShell } from "@/components/tools/ToolShell";
import { EmbeddedProvider } from "@/components/tools/EmbeddedContext";
import { Dropzone } from "@/components/tools/Dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import {
  ALL_FROM,
  CONVERTER_EDGES,
  FORMATS,
  detectFormat,
  findEdge,
  targetsOf,
  type ConverterModule,
  type FormatId,
} from "@/lib/converter-formats";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mod = ComponentType<any>;

const MODULES: Record<ConverterModule, Mod> = {
  "image-converter": dynamic(() => import("@/components/modes/image-converter")),
  "image-to-pdf": dynamic(() => import("@/components/modes/image-to-pdf")),
  "svg-tracer": dynamic(() => import("@/components/modes/svg-tracer")),
  "pdf-to-markdown": dynamic(() => import("@/components/modes/pdf-to-markdown")),
  "word-to-pdf": dynamic(() => import("@/components/modes/word-to-pdf")),
  "rich-text-to-markdown": dynamic(() => import("@/components/modes/rich-text-to-markdown")),
  "csv-json-converter": dynamic(() => import("@/components/modes/csv-json-converter")),
};

const ACCEPT = ALL_FROM.flatMap((id) => FORMATS[id].ext.map((e) => `.${e}`)).join(",");

const asFormat = (v: string | null): FormatId | null =>
  v && v in FORMATS ? (v as FormatId) : null;

function Converter() {
  const { t } = useI18n();
  const { toast } = useToast();
  const params = useSearchParams();
  const initFrom = asFormat(params.get("from"));
  const initTo = asFormat(params.get("to"));

  // from === null means "auto": the hub shows one dropzone and detects the format.
  const [from, setFrom] = useState<FormatId | null>(initFrom && ALL_FROM.includes(initFrom) ? initFrom : null);
  const [to, setTo] = useState<FormatId | null>(
    initFrom && initTo && findEdge(initFrom, initTo) ? initTo : initFrom ? targetsOf(initFrom)[0] ?? null : null,
  );
  const [dropped, setDropped] = useState<File | null>(null);

  const pickFrom = (v: string) => {
    if (v === "auto") {
      setFrom(null);
      setTo(null);
      return;
    }
    const f = v as FormatId;
    setFrom(f);
    setTo((cur) => (cur && findEdge(f, cur) ? cur : targetsOf(f)[0] ?? null));
  };

  const onDetect = (file: File) => {
    const f = detectFormat(file);
    if (!f) {
      toast({ variant: "destructive", title: t("common.error"), description: t("converter.unsupported") });
      return;
    }
    setDropped(file);
    setFrom(f);
    setTo((cur) => (cur && findEdge(f, cur) ? cur : targetsOf(f)[0] ?? null));
  };

  const edge = from && to ? findEdge(from, to) : undefined;
  const canSwap = !!(from && to && findEdge(to, from));
  const swap = () => {
    if (!from || !to) return;
    setFrom(to);
    setTo(from);
  };

  const Active = edge ? MODULES[edge.module] : null;
  // Only hand the dropped file over while it still matches the selected source format.
  const initialFile = dropped && from && detectFormat(dropped) === from ? dropped : undefined;
  const props = {
    to: to ?? undefined,
    initialFile,
    direction: from === "csv" ? "csv-to-json" : "json-to-csv",
    onSwap: swap,
  };

  return (
    <ToolShell title={t("tool.converter.name")} description={t("tool.converter.description")}>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("converter.from")}
            </Label>
            <Select value={from ?? "auto"} onValueChange={pickFrom}>
              <SelectTrigger aria-label={t("converter.from")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t("converter.auto")}</SelectItem>
                {ALL_FROM.map((id) => (
                  <SelectItem key={id} value={id}>
                    {FORMATS[id].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={swap}
            disabled={!canSwap}
            title={t("converter.swap")}
            aria-label={t("converter.swap")}
            className="hidden sm:inline-flex"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("converter.to")}
            </Label>
            <Select value={to ?? undefined} onValueChange={(v) => setTo(v as FormatId)} disabled={!from}>
              <SelectTrigger aria-label={t("converter.to")}>
                <SelectValue placeholder={t("converter.pickTarget")} />
              </SelectTrigger>
              <SelectContent>
                {(from ? targetsOf(from) : []).map((id) => (
                  <SelectItem key={id} value={id}>
                    {FORMATS[id].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {CONVERTER_EDGES.length} {t("converter.supported")}
        </p>

        {Active ? (
          <EmbeddedProvider value>
            <Active key={edge!.module} {...props} />
          </EmbeddedProvider>
        ) : (
          <Dropzone
            accept={ACCEPT}
            onFile={onDetect}
            title={t("converter.dropTitle")}
            subtitle={t("converter.dropSubtitle")}
          />
        )}
      </div>
    </ToolShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Converter />
    </Suspense>
  );
}
