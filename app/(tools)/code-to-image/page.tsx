"use client";

import { Fira_Code, JetBrains_Mono } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Highlighter } from "shiki";
import { toBlob } from "html-to-image";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
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
import { Download, ImageIcon } from "lucide-react";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-cti-jetbrains" });
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-cti-fira" });

const LANGUAGES = [
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "python",
  "html",
  "css",
  "json",
  "bash",
  "go",
  "rust",
  "java",
  "c",
  "cpp",
  "php",
  "ruby",
  "sql",
  "yaml",
  "markdown",
  "swift",
  "kotlin",
  "csharp",
] as const;

const THEMES = [
  { id: "dracula", label: "Dracula" },
  { id: "github-dark", label: "GitHub Dark" },
  { id: "github-light", label: "GitHub Light" },
  { id: "one-dark-pro", label: "One Dark Pro" },
  { id: "nord", label: "Nord" },
  { id: "monokai", label: "Monokai" },
  { id: "night-owl", label: "Night Owl" },
  { id: "min-dark", label: "Min Dark" },
  { id: "vitesse-dark", label: "Vitesse Dark" },
  { id: "tokyo-night", label: "Tokyo Night" },
] as const;

const BACKGROUNDS = [
  { id: "sunset", label: "Sunset", value: "linear-gradient(135deg, #f97316, #db2777)" },
  { id: "ocean", label: "Ocean", value: "linear-gradient(135deg, #0ea5e9, #6366f1)" },
  { id: "purple", label: "Purple Dream", value: "linear-gradient(135deg, #a855f7, #ec4899)" },
  { id: "forest", label: "Forest", value: "linear-gradient(135deg, #22c55e, #0ea5e9)" },
  { id: "candy", label: "Candy", value: "linear-gradient(135deg, #f472b6, #facc15)" },
  { id: "mint", label: "Mint", value: "linear-gradient(135deg, #34d399, #059669)" },
  { id: "midnight", label: "Midnight", value: "linear-gradient(135deg, #1e293b, #0f172a)" },
  { id: "slate", label: "Slate", value: "#1e293b" },
  { id: "light", label: "Light", value: "#f1f5f9" },
  { id: "transparent", label: "Transparent", value: "transparent" },
] as const;

const FONT_OPTIONS = [
  { id: "jetbrains", label: "JetBrains Mono", stack: "var(--font-cti-jetbrains), monospace" },
  { id: "fira", label: "Fira Code", stack: "var(--font-cti-fira), monospace" },
  { id: "geist", label: "Geist Mono", stack: "var(--font-geist-mono), monospace" },
  {
    id: "system",
    label: "System Monospace",
    stack:
      "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  },
] as const;

const DEFAULT_CODE = `function greet(name: string) {
  return \`Hello, \${name}! Welcome to mojepict.\`;
}

console.log(greet("world"));
`;

export default function CodeToImagePage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>("typescript");
  const [themeId, setThemeId] = useState<(typeof THEMES)[number]["id"]>("dracula");
  const [background, setBackground] = useState<(typeof BACKGROUNDS)[number]>(BACKGROUNDS[0]);
  const [fontId, setFontId] = useState<(typeof FONT_OPTIONS)[number]["id"]>("jetbrains");
  const [fontSize, setFontSize] = useState(14);
  const [padding, setPadding] = useState(56);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [showWindowControls, setShowWindowControls] = useState(true);
  const [title, setTitle] = useState("untitled.ts");

  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
  const [html, setHtml] = useState("");
  const [themeColors, setThemeColors] = useState({ bg: "#1e1e2e", fg: "#f8f8f2" });

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    import("shiki").then(({ createHighlighter }) =>
      createHighlighter({
        langs: [...LANGUAGES],
        themes: THEMES.map((t) => t.id),
      }).then((h) => {
        if (!cancelled) setHighlighter(h);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!highlighter) return;
    setHtml(
      highlighter.codeToHtml(code, {
        lang: language,
        theme: themeId,
      }),
    );
    const theme = highlighter.getTheme(themeId);
    setThemeColors({ bg: theme.bg ?? "#1e1e2e", fg: theme.fg ?? "#f8f8f2" });
  }, [highlighter, code, language, themeId]);

  const font = FONT_OPTIONS.find((f) => f.id === fontId) ?? FONT_OPTIONS[0];

  const getExportBlob = useCallback(async () => {
    if (!cardRef.current) return null;
    return toBlob(cardRef.current, { pixelRatio: 3, backgroundColor: undefined });
  }, []);

  const handleDownload = async () => {
    const blob = await getExportBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\.[a-z0-9]+$/i, "") || "code"}-mojepict.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("common.success"), description: t("toast.success.downloaded") });
  };

  return (
    <ToolShell
      title={t("tool.code-to-image.name")}
      description={t("tool.code-to-image.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Language
              </Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Theme
              </Label>
              <Select value={themeId} onValueChange={(v) => setThemeId(v as typeof themeId)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map((th) => (
                    <SelectItem key={th.id} value={th.id}>
                      {th.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Font
              </Label>
              <Select value={fontId} onValueChange={(v) => setFontId(v as typeof fontId)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Background
              </Label>
              <div className="flex flex-wrap gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    title={bg.label}
                    onClick={() => setBackground(bg)}
                    className={cn(
                      "h-8 w-8 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10",
                      background.id === bg.id && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                    style={{
                      background:
                        bg.id === "transparent"
                          ? "repeating-conic-gradient(#94a3b8 0% 25%, #cbd5e1 0% 50%) 50% / 10px 10px"
                          : bg.value,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs font-medium">Font size</Label>
                <span className="text-xs font-mono">{fontSize}px</span>
              </div>
              <Slider
                value={[fontSize]}
                min={10}
                max={28}
                step={1}
                onValueChange={(v: number[]) => setFontSize(v[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs font-medium">Padding</Label>
                <span className="text-xs font-mono">{padding}px</span>
              </div>
              <Slider
                value={[padding]}
                min={0}
                max={120}
                step={4}
                onValueChange={(v: number[]) => setPadding(v[0])}
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showWindowControls}
                onChange={(e) => setShowWindowControls(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Window controls
            </label>

            {showWindowControls && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Window title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="untitled.ts"
                  className="h-9 text-xs"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showLineNumbers}
                onChange={(e) => setShowLineNumbers(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Line numbers
            </label>

            <ToolActionBar
              primaryLabel={t("action.download")}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={handleDownload}
              primaryDisabled={!highlighter}
            >
              <CopyImageButton getBlob={getExportBlob} disabled={!highlighter} />
            </ToolActionBar>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ImageIcon className="h-3 w-3" /> Code
            </Label>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="min-h-[180px] resize-y font-mono text-sm p-4"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border bg-muted/10 p-6 sm:p-10">
            {!highlighter ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Loading syntax highlighter…
              </div>
            ) : (
              <div
                ref={cardRef}
                className="inline-block"
                style={{ padding, background: background.value }}
              >
                <div
                  className="overflow-hidden rounded-xl shadow-2xl"
                  style={{ minWidth: 320 }}
                >
                  {showWindowControls && (
                    <div
                      className="flex items-center gap-1.5 px-4 py-3"
                      style={{ background: themeColors.bg }}
                    >
                      <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                      <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                      <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                      {title && (
                        <span
                          className="mx-auto pr-12 text-xs opacity-60"
                          style={{ color: themeColors.fg }}
                        >
                          {title}
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className={cn("cti-code", showLineNumbers && "cti-line-numbers")}
                    style={{
                      fontFamily: font.stack,
                      fontSize,
                      lineHeight: 1.6,
                    }}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </ToolWorkspace>

      <style>{`
        .cti-code pre { margin: 0; padding: 1.25em 1.5em; overflow-x: auto; }
        .cti-line-numbers pre code { counter-reset: cti-line; }
        .cti-line-numbers .line {
          counter-increment: cti-line;
          padding-left: 0.5em;
        }
        .cti-line-numbers .line::before {
          content: counter(cti-line);
          display: inline-block;
          width: 2em;
          margin-right: 1.25em;
          text-align: right;
          opacity: 0.4;
          user-select: none;
        }
      `}</style>
    </ToolShell>
  );
}
