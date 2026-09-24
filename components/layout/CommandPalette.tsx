"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { TOOLS, CATEGORIES, CATEGORY_ORDER, Tool, getPopularTools } from "@/lib/tools";
import { HUB_MODES } from "@/lib/hubs";
import { CONVERTER_EDGES, FORMATS, type ConverterEdge, type FormatId } from "@/lib/converter-formats";
import { TOOL_KEYWORDS } from "@/lib/tool-keywords";
import { getToolIconComponent } from "@/lib/tool-icons";
import { getRecentTools } from "@/hooks/use-recent-tools";
import { en } from "@/lib/i18n/en";
import { id as idDict } from "@/lib/i18n/id";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Clock, Flame, SearchX } from "lucide-react";
import { DialogDescription, DialogTitle } from "../ui/dialog";

interface Corpus {
  nameEn: string;
  nameId: string;
  descEn: string;
  descId: string;
  categoryEn: string;
  categoryId: string;
  keywords: string[];
  slug: string;
}

/** One searchable destination: a tool, a mode inside a hub, or one converter pair. */
interface Entry {
  key: string;
  href: string;
  tool: Tool; // supplies icon + category
  kind: "tool" | "mode" | "edge";
  /** Legacy tool id (mode) or converter module (edge) used for name/description lookup. */
  sourceId: string;
  labelKey?: string;
  edge?: ConverterEdge;
  corpus: Corpus;
}

/** Lowercases and strips diacritics so "e" matches "é", accented input, etc. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const dict = (d: Record<string, unknown>, key: string) => normalize((d[key] as string) ?? "");

function corpusFor(tool: Tool, sourceId: string, keywordIds: string[], extra: string[] = []): Corpus {
  const cat = CATEGORIES[tool.category];
  const k = keywordIds.map((id) => TOOL_KEYWORDS[id]).filter(Boolean);
  return {
    nameEn: dict(en, `tool.${sourceId}.name`),
    nameId: dict(idDict, `tool.${sourceId}.name`),
    descEn: dict(en, `tool.${sourceId}.description`),
    descId: dict(idDict, `tool.${sourceId}.description`),
    categoryEn: dict(en, cat.labelKey),
    categoryId: dict(idDict, cat.labelKey),
    keywords: [...k.flatMap((x) => [...x.en, ...x.id]), ...extra].map(normalize),
    slug: normalize(sourceId),
  };
}

/** Extra spellings people type for a converter format (label is always matched too). */
const FORMAT_ALIASES: Partial<Record<FormatId, string[]>> = {
  jpg: ["jpeg"],
  docx: ["word", "doc", "microsoft word"],
  md: ["markdown", "mark down"],
  svgtrace: ["vector", "vektor", "trace", "tracing", "vectorize"],
  richtext: ["rich text", "html", "editor", "teks kaya", "wysiwyg"],
  pdf: ["dokumen"],
  ico: ["icon", "favicon"],
};
const formatTerms = (id: FormatId) =>
  [FORMATS[id].label, id, ...(FORMAT_ALIASES[id] ?? [])].map(normalize);

const CONVERT_WORDS = ["convert", "converter", "conversion", "konversi", "konverter", "ubah", "ganti", "jadi", "ke", "to", "into", "dari", "from", "2", "->", "→", "as", "ke"];

/** Query words that carry no meaning of their own ("png TO jpg", "ubah png ke jpg"). */
const STOPWORDS = new Set(CONVERT_WORDS);

const ENTRIES: Entry[] = [
  ...TOOLS.map<Entry>((tool) => ({
    key: tool.id,
    href: `/${tool.slug}`,
    tool,
    kind: "tool",
    sourceId: tool.id,
    corpus: corpusFor(tool, tool.id, [tool.id]),
  })),
  ...TOOLS.flatMap<Entry>((tool) =>
    (HUB_MODES[tool.id] ?? [])
      .filter((mode) => mode !== tool.id)
      .map<Entry>((mode) => ({
        key: `${tool.id}:${mode}`,
        href: `/${tool.slug}?mode=${mode}`,
        tool,
        kind: "mode",
        sourceId: mode,
        corpus: corpusFor(tool, mode, [mode]),
      })),
  ),
  ...(() => {
    const hub = TOOLS.find((t) => t.id === "converter");
    if (!hub) return [];
    return CONVERTER_EDGES.map<Entry>((edge) => {
      const a = FORMATS[edge.from].label;
      const b = FORMATS[edge.to].label;
      return {
        key: `converter:${edge.from}-${edge.to}`,
        href: `/converter?from=${edge.from}&to=${edge.to}`,
        tool: hub,
        kind: "edge",
        sourceId: edge.module,
        edge,
        corpus: {
          ...corpusFor(hub, edge.module, [edge.module], ["convert", "converter", "konversi", "ubah"]),
          nameEn: normalize(`${a} → ${b}`),
          nameId: normalize(`${a} → ${b}`),
        },
      };
    });
  })(),
];

const KIND_ORDER = { tool: 0, mode: 1, edge: 2 } as const;

/** True when a and b differ by at most one insertion, deletion or substitution. */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i === a.length && i === b.length) return true;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

/** Typo tolerance: a 4+ letter query word within one edit of a word in the name/slug/keywords. */
function fuzzyHit(corpus: Corpus, token: string): boolean {
  if (token.length < 4) return false;
  const words = [corpus.nameEn, corpus.nameId, corpus.slug, ...corpus.keywords].join(" ").split(/[^a-z0-9]+/);
  return words.some((w) => w.length >= 3 && withinOneEdit(w, token));
}

/** Best single-field match strength for one query token against one entry. */
function tokenScore(corpus: Corpus, token: string): number {
  if (corpus.nameEn === token || corpus.nameId === token) return 100;
  if (corpus.nameEn.startsWith(token) || corpus.nameId.startsWith(token)) return 70;
  if (corpus.slug === token) return 65;
  if (corpus.nameEn.includes(token) || corpus.nameId.includes(token)) return 45;
  if (corpus.slug.includes(token)) return 40;
  if (corpus.keywords.some((k) => k.includes(token))) return 25;
  if (corpus.descEn.includes(token) || corpus.descId.includes(token)) return 12;
  if (corpus.categoryEn.includes(token) || corpus.categoryId.includes(token)) return 8;
  if (fuzzyHit(corpus, token)) return 10;
  return 0;
}

/** Splits a query into words and drops filler ("to", "ke", "convert") unless nothing else is left. */
function queryTokens(query: string): string[] {
  const all = normalize(query)
    .replace(/[→>]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = all.filter((w) => !STOPWORDS.has(w));
  return meaningful.length ? meaningful : all;
}

const termHit = (terms: string[], token: string) =>
  terms.some((t) => t === token || (token.length >= 2 && t.startsWith(token)));

/**
 * Converter pairs match on format words, order-aware: "jpg to png" ranks
 * JPG → PNG above PNG → JPG, and one word ("png") lists every pair touching it.
 */
function edgeScore(edge: ConverterEdge, tokens: string[]): number {
  const from = formatTerms(edge.from);
  const to = formatTerms(edge.to);
  let total = 0;
  for (const token of tokens) {
    const f = termHit(from, token);
    const t = termHit(to, token);
    if (!f && !t) return 0;
    total += 50;
  }
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  if (tokens.length === 1) return total + (termHit(from, first) ? 5 : 0);
  return total + (termHit(from, first) && termHit(to, last) ? 40 : 0);
}

/** Every query word must match something (AND semantics) — score is the sum of each word's best match. */
function scoreEntry(entry: Entry, tokens: string[]): number {
  if (entry.edge) {
    const s = edgeScore(entry.edge, tokens);
    if (s > 0) return s;
  }
  let total = 0;
  for (const token of tokens) {
    const s = tokenScore(entry.corpus, token);
    if (s === 0) return 0;
    total += s;
  }
  return total;
}

const MAX_RESULTS = 40;
const MAX_EDGES = 12;

export function rankEntries(query: string): Entry[] {
  const tokens = queryTokens(query);
  if (!tokens.length) return [];
  const ranked = ENTRIES.map((entry, i) => ({ entry, i, score: scoreEntry(entry, tokens) }))
    .filter((r) => r.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        KIND_ORDER[a.entry.kind] - KIND_ORDER[b.entry.kind] ||
        a.i - b.i,
    );
  let edges = 0;
  return ranked
    .filter((r) => r.entry.kind !== "edge" || ++edges <= MAX_EDGES)
    .slice(0, MAX_RESULTS)
    .map((r) => r.entry);
}

/** Wraps every occurrence of any query word in the display text with a highlight. */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const tokens = Array.from(new Set(query.trim().split(/\s+/).filter(Boolean)));
  if (!tokens.length || !text) return <>{text}</>;

  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const splitPattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const testPattern = new RegExp(`^(${escaped.join("|")})$`, "i");
  const parts = text.split(splitPattern);

  return (
    <>
      {parts.map((part, i) =>
        part && testPattern.test(part) ? (
          <mark key={i} className="rounded-[2px] bg-primary/25 text-inherit">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("mojepict:open-palette", handleOpen);
    return () =>
      window.removeEventListener("mojepict:open-palette", handleOpen);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch("");
      setRecentSlugs(getRecentTools());
    }
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const trimmedQuery = search.trim();
  const results = useMemo(() => (trimmedQuery ? rankEntries(trimmedQuery) : []), [trimmedQuery]);
  const highlightQuery = useMemo(() => queryTokens(trimmedQuery).join(" "), [trimmedQuery]);

  const recentTools = useMemo(
    () =>
      recentSlugs
        .map((slug) => TOOLS.find((tool) => tool.slug === slug))
        .filter((tool): tool is Tool => Boolean(tool)),
    [recentSlugs],
  );
  const popularTools = useMemo(
    () => getPopularTools().filter((tool) => !recentTools.some((r) => r.id === tool.id)),
    [recentTools],
  );

  function renderEntry(entry: Entry, highlight: boolean) {
    const { tool, kind, edge } = entry;
    const LIcon = getToolIconComponent(tool.icon);
    const name = edge
      ? `${FORMATS[edge.from].label} → ${FORMATS[edge.to].label}`
      : t((kind === "mode" ? `tool.${entry.sourceId}.name` : `tool.${tool.id}.name`) as any);
    const desc = t(
      (kind === "tool" ? `tool.${tool.id}.description` : `tool.${entry.sourceId}.description`) as any,
    );
    // Sub-destinations are badged with their hub so it's clear where they open.
    const badge = kind === "tool" ? t(CATEGORIES[tool.category].labelKey as any) : t(`tool.${tool.id}.name` as any);
    return (
      <CommandItem key={entry.key} value={entry.key} onSelect={() => navigate(entry.href)}>
        <LIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">
              {highlight ? <HighlightMatch text={name} query={highlightQuery} /> : name}
            </p>
            <Badge variant="secondary" className="h-4 shrink-0 px-1.5 text-[10px] font-normal">
              {badge}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {highlight ? <HighlightMatch text={desc} query={highlightQuery} /> : desc}
          </p>
        </div>
      </CommandItem>
    );
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <DialogTitle className="sr-only">Search Tools</DialogTitle>
      <DialogDescription className="sr-only">
        Quickly access any tool
      </DialogDescription>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder={t("palette.placeholder")}
      />
      <CommandList>
        {trimmedQuery ? (
          results.length > 0 ? (
            <CommandGroup
              heading={`${results.length} ${t("palette.resultsFor")} "${trimmedQuery}"`}
            >
              {results.map((entry) => renderEntry(entry, true))}
            </CommandGroup>
          ) : (
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-2">
                <SearchX className="h-6 w-6 text-muted-foreground/60" />
                <p>{t("palette.noResults")}</p>
                <p className="text-xs text-muted-foreground">{t("palette.noResultsHint")}</p>
              </div>
            </CommandEmpty>
          )
        ) : (
          <>
            {recentTools.length > 0 && (
              <CommandGroup heading={t("palette.recent")}>
                {recentTools.map((tool) => {
                  const LIcon = getToolIconComponent(tool.icon);
                  return (
                    <CommandItem
                      key={tool.id}
                      value={tool.id}
                      onSelect={() => navigate(`/${tool.slug}`)}
                    >
                      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <LIcon className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="ml-2 truncate text-sm font-medium">
                        {t(`tool.${tool.id}.name` as any)}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {popularTools.length > 0 && (
              <CommandGroup heading={t("palette.popular")}>
                {popularTools.slice(0, 6).map((tool) => {
                  const LIcon = getToolIconComponent(tool.icon);
                  return (
                    <CommandItem
                      key={tool.id}
                      value={tool.id}
                      onSelect={() => navigate(`/${tool.slug}`)}
                    >
                      <Flame className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <LIcon className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="ml-2 truncate text-sm font-medium">
                        {t(`tool.${tool.id}.name` as any)}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {CATEGORY_ORDER.map((catId) => {
              const catTools = TOOLS.filter((tool) => tool.category === catId);
              if (!catTools.length) return null;
              return (
                <CommandGroup key={catId} heading={t(CATEGORIES[catId].labelKey as any)}>
                  {catTools.map((tool) =>
                    renderEntry(ENTRIES.find((e) => e.key === tool.id)!, false),
                  )}
                </CommandGroup>
              );
            })}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
