"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { TOOLS, CATEGORIES, Tool, getPopularTools } from "@/lib/tools";
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

type EnKey = keyof typeof en;

interface ToolCorpus {
  nameEn: string;
  nameId: string;
  descEn: string;
  descId: string;
  categoryEn: string;
  categoryId: string;
  keywords: string[];
  slug: string;
}

/** Lowercases and strips diacritics so "e" matches "é", accented input, etc. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Every tool's searchable text, gathered once from both locale dictionaries
 * plus lib/tool-keywords.ts, so a query matches regardless of the site's
 * currently active language — the same "cari background" or "remove bg"
 * both work no matter whether the UI is set to EN or ID.
 */
const SEARCH_INDEX: Record<string, ToolCorpus> = Object.fromEntries(
  TOOLS.map((tool) => {
    const keywordSet = TOOL_KEYWORDS[tool.id];
    const categoryMeta = CATEGORIES[tool.category];
    return [
      tool.id,
      {
        nameEn: normalize((en[`tool.${tool.id}.name` as EnKey] as string) ?? ""),
        nameId: normalize((idDict[`tool.${tool.id}.name` as EnKey] as string) ?? ""),
        descEn: normalize((en[`tool.${tool.id}.description` as EnKey] as string) ?? ""),
        descId: normalize((idDict[`tool.${tool.id}.description` as EnKey] as string) ?? ""),
        categoryEn: normalize((en[categoryMeta.labelKey as EnKey] as string) ?? ""),
        categoryId: normalize((idDict[categoryMeta.labelKey as EnKey] as string) ?? ""),
        keywords: [...(keywordSet?.en ?? []), ...(keywordSet?.id ?? [])].map(normalize),
        slug: normalize(tool.slug),
      },
    ];
  }),
);

/** Best single-field match strength for one query token against one tool. */
function tokenScore(corpus: ToolCorpus, token: string): number {
  if (corpus.nameEn === token || corpus.nameId === token) return 100;
  if (corpus.nameEn.startsWith(token) || corpus.nameId.startsWith(token)) return 70;
  if (corpus.slug === token) return 65;
  if (corpus.nameEn.includes(token) || corpus.nameId.includes(token)) return 45;
  if (corpus.slug.includes(token)) return 40;
  if (corpus.keywords.some((k) => k.includes(token))) return 25;
  if (corpus.descEn.includes(token) || corpus.descId.includes(token)) return 12;
  if (corpus.categoryEn.includes(token) || corpus.categoryId.includes(token)) return 8;
  return 0;
}

/** Every query word must match something (AND semantics) — score is the sum of each word's best match. */
function scoreTool(corpus: ToolCorpus, tokens: string[]): number {
  let total = 0;
  for (const token of tokens) {
    const s = tokenScore(corpus, token);
    if (s === 0) return 0;
    total += s;
  }
  return total;
}

function rankTools(query: string): Tool[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return TOOLS.map((tool) => ({ tool, score: scoreTool(SEARCH_INDEX[tool.id], tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.tool.id.localeCompare(b.tool.id))
    .map((r) => r.tool);
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
    (slug: string) => {
      setOpen(false);
      router.push(`/${slug}`);
    },
    [router],
  );

  const trimmedQuery = search.trim();
  const results = useMemo(() => (trimmedQuery ? rankTools(trimmedQuery) : []), [trimmedQuery]);

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

  function renderItem(tool: Tool, highlight: boolean) {
    const LIcon = getToolIconComponent(tool.icon);
    const name = t(`tool.${tool.id}.name` as any);
    const desc = t(`tool.${tool.id}.description` as any);
    const categoryLabel = t(CATEGORIES[tool.category].labelKey as any);
    return (
      <CommandItem key={tool.id} value={tool.id} onSelect={() => navigate(tool.slug)}>
        <LIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">
              {highlight ? <HighlightMatch text={name} query={trimmedQuery} /> : name}
            </p>
            <Badge variant="secondary" className="h-4 shrink-0 px-1.5 text-[10px] font-normal">
              {categoryLabel}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {highlight ? <HighlightMatch text={desc} query={trimmedQuery} /> : desc}
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
              {results.map((tool) => renderItem(tool, true))}
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
                      onSelect={() => navigate(tool.slug)}
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
                      onSelect={() => navigate(tool.slug)}
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

            {Object.entries(CATEGORIES).map(([catId, catMeta]) => {
              const catTools = TOOLS.filter((tool) => tool.category === catId);
              if (!catTools.length) return null;
              return (
                <CommandGroup key={catId} heading={t(catMeta.labelKey as any)}>
                  {catTools.map((tool) => renderItem(tool, false))}
                </CommandGroup>
              );
            })}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
