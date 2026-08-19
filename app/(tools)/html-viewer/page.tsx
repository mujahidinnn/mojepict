"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  Download,
  Globe,
  Play,
  Plus,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

type FileLang = "html" | "css" | "js" | "asset";

interface SnippetFile {
  id: string;
  name: string;
  language: FileLang;
  /** Text source for html/css/js; a data: URI for asset (image) files. */
  content: string;
}

interface PreviewResult {
  doc: string;
  title: string;
  favicon: string | null;
}

const MAX_FILE_BYTES = 1_500_000;
const MAX_TOTAL_BYTES = 5_000_000;
const DEFAULT_FAVICON =
  "data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPFmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj/wAAAAAAAAAAAAAAAAAAAADxZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY/8AAAAAAAAAAPFmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj/wAAAAAAAAAA8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/AAAAAAAAAAAAAAAAAAAAAPFmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj//FmY//xZmP/8WZj/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function detectLanguage(file: File): FileLang {
  if (file.type.startsWith("image/")) return "asset";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "css") return "css";
  if (ext === "js" || ext === "mjs" || ext === "jsx" || ext === "ts") return "js";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"].includes(ext)) return "asset";
  return "html";
}

function uniqueName(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : "";
  let i = 1;
  let candidate = `${stem}-${i}${ext}`;
  while (existing.has(candidate)) {
    i++;
    candidate = `${stem}-${i}${ext}`;
  }
  return candidate;
}

function defaultFiles(): SnippetFile[] {
  return [
    {
      id: uid(),
      name: "index.html",
      language: "html",
      content: `<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
  <link rel="icon" href="favicon.ico">
</head>
<body>
  <h1>Hello, world!</h1>
  <p>Edit the HTML, CSS, or JS files and hit Run.</p>
  <button id="btn">Click me</button>
</body>
</html>`,
    },
    {
      id: uid(),
      name: "style.css",
      language: "css",
      content: `body {
  font-family: sans-serif;
  padding: 2rem;
  color: #1e293b;
}

button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  background: #6366f1;
  color: white;
  cursor: pointer;
}`,
    },
    {
      id: uid(),
      name: "script.js",
      language: "js",
      content: `document.getElementById("btn").addEventListener("click", () => {
  alert("Hello from script.js!");
});`,
    },
    {
      id: uid(),
      name: "favicon.ico",
      language: "asset",
      content: DEFAULT_FAVICON,
    },
  ];
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function extractTag(html: string, tag: "head" | "body"): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1] : null;
}

/** Reads an HTML attribute value, respecting whichever quote char actually opened it (a value quoted with " may freely contain ', and vice versa). */
function matchAttr(tag: string, attr: string): string | null {
  const dq = tag.match(new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, "i"));
  if (dq) return dq[1];
  const sq = tag.match(new RegExp(`${attr}\\s*=\\s*'([^']*)'`, "i"));
  if (sq) return sq[1];
  return null;
}

function extractFaviconHref(html: string): string | null {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of linkTags) {
    const rel = matchAttr(tag, "rel");
    if (!rel || !rel.toLowerCase().includes("icon")) continue;
    const href = matchAttr(tag, "href");
    if (href) return href;
  }
  return null;
}

/** Resolves href/src/url() references to uploaded asset filenames into inline data: URIs. */
function resolveAssetRefs(text: string, assets: SnippetFile[]): string {
  let resolved = text;
  for (const asset of assets) {
    const escaped = asset.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const attrRe = new RegExp(`((?:href|src)=["'])(?:\\./|/)?${escaped}(["'])`, "gi");
    resolved = resolved.replace(attrRe, `$1${asset.content}$2`);
    const urlRe = new RegExp(`url\\((['"]?)(?:\\./|/)?${escaped}\\1\\)`, "gi");
    resolved = resolved.replace(urlRe, `url($1${asset.content}$1)`);
  }
  return resolved;
}

function buildPreviewDocument(files: SnippetFile[]): PreviewResult {
  const assetFiles = files.filter((f) => f.language === "asset");
  const htmlFiles = files.filter((f) => f.language === "html");
  const cssFiles = files.filter((f) => f.language === "css");
  const jsFiles = files.filter((f) => f.language === "js");

  const css = resolveAssetRefs(cssFiles.map((f) => f.content).join("\n\n"), assetFiles);
  const js = jsFiles.map((f) => f.content).join("\n\n");

  let bodyContent = "";
  let headExtra = "";
  let title = "Preview";
  let favicon: string | null = null;

  if (htmlFiles.length > 0) {
    const resolvedHtmlFiles = htmlFiles.map((f) => ({
      ...f,
      content: resolveAssetRefs(f.content, assetFiles),
    }));
    bodyContent = resolvedHtmlFiles
      .map((f) => {
        const inner = extractTag(f.content, "body");
        return inner !== null ? inner : f.content;
      })
      .join("\n");
    const firstHead = extractTag(resolvedHtmlFiles[0].content, "head");
    if (firstHead !== null) headExtra = firstHead;
    const titleMatch = resolvedHtmlFiles[0].content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) title = titleMatch[1];
    const faviconHref = extractFaviconHref(resolvedHtmlFiles[0].content);
    // Only a data: URI or an absolute URL is safe/loadable here - anything
    // else means the referenced asset file doesn't exist (e.g. it was
    // removed), so fall back to the default globe icon instead of asking
    // our own page to fetch a stray relative path from its own origin.
    favicon = faviconHref && /^(data:|https?:\/\/|\/\/)/i.test(faviconHref) ? faviconHref : null;
  }

  const doc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
${headExtra}
<style>${css}</style>
</head>
<body>
${bodyContent}
<script>${js}<\/script>
</body>
</html>`;

  return { doc, title, favicon };
}

export default function HtmlViewerPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<SnippetFile[]>(defaultFiles);
  const [activeId, setActiveId] = useState(() => files[0].id);
  const [runCount, setRunCount] = useState(0);
  const [preview, setPreview] = useState<PreviewResult>(() => buildPreviewDocument(defaultFiles()));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const activeFile = files.find((f) => f.id === activeId) ?? files[0];
  const totalBytes = files.reduce((sum, f) => sum + f.content.length, 0);

  const updateActiveContent = (content: string) => {
    setFiles((prev) => prev.map((f) => (f.id === activeId ? { ...f, content } : f)));
  };

  const updateActiveLanguage = (language: FileLang) => {
    setFiles((prev) => prev.map((f) => (f.id === activeId ? { ...f, language } : f)));
  };

  const updateActiveName = (name: string) => {
    setFiles((prev) => prev.map((f) => (f.id === activeId ? { ...f, name } : f)));
  };

  const addFile = () => {
    const existing = new Set(files.map((f) => f.name));
    const name = uniqueName("untitled.html", existing);
    const next: SnippetFile = { id: uid(), name, language: "html", content: "" };
    setFiles((prev) => [...prev, next]);
    setActiveId(next.id);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length === 0) {
        const fresh = defaultFiles();
        setActiveId(fresh[0].id);
        return fresh;
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const existing = new Set(files.map((f) => f.name));
    const additions: SnippetFile[] = [];
    let skipped = 0;
    let runningTotal = totalBytes;

    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_BYTES || runningTotal + file.size > MAX_TOTAL_BYTES) {
        skipped++;
        continue;
      }
      try {
        const language = detectLanguage(file);
        const content =
          language === "asset"
            ? await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(file);
              })
            : await file.text();
        const name = uniqueName(file.name, existing);
        existing.add(name);
        runningTotal += file.size;
        additions.push({ id: uid(), name, language, content });
      } catch {
        skipped++;
      }
    }

    if (additions.length) {
      setFiles((prev) => [...prev, ...additions]);
      setActiveId(additions[0].id);
    }
    if (skipped > 0) {
      toast({ description: t("tool.html-viewer.uploadSkipped").replace("{{count}}", String(skipped)) });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runPreview = () => {
    setPreview(buildPreviewDocument(files));
    setRunCount((c) => c + 1);
  };

  const resetAll = () => {
    const fresh = defaultFiles();
    setFiles(fresh);
    setActiveId(fresh[0].id);
    setPreview(buildPreviewDocument(fresh));
    setRunCount((c) => c + 1);
    setConfirmOpen(false);
  };

  const downloadHtml = () => {
    const { doc } = buildPreviewDocument(files);
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "preview.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolShell title={t("tool.html-viewer.name")} description={t("tool.html-viewer.description")}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addFile} className="gap-2">
            <Plus className="h-4 w-4" /> {t("tool.html-viewer.addFile")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleUploadClick} className="gap-2">
            <Upload className="h-4 w-4" /> {t("tool.html-viewer.uploadFiles")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".html,.htm,.css,.js,.mjs,.jsx,.ts,.txt,.png,.jpg,.jpeg,.gif,.svg,.webp,.ico"
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <div className="flex-1" />
          <Button type="button" variant="outline" size="sm" onClick={downloadHtml} className="gap-2">
            <Download className="h-4 w-4" /> {t("action.download")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            {t("action.reset")}
          </Button>
          <Button type="button" size="sm" onClick={runPreview} className="gap-2">
            <Play className="h-4 w-4" /> {t("tool.html-viewer.run")}
          </Button>
        </div>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("dialog.confirm.title")}</AlertDialogTitle>
              <AlertDialogDescription>{t("dialog.confirm.description")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={resetAll}>{t("action.confirm")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-1 overflow-x-auto rounded-t-lg border border-b-0 bg-muted/10 px-2 pt-2 scrollbar-none">
              {files.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveId(f.id)}
                  className={cn(
                    "group flex shrink-0 items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors",
                    f.id === activeId
                      ? "border-border bg-background text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.language === "asset" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.content} alt="" className="h-3 w-3 shrink-0 rounded-sm object-cover" />
                  )}
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <X
                    className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(f.id);
                    }}
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-md border bg-muted/10 px-2 py-1.5">
              <Input
                value={activeFile.name}
                onChange={(e) => updateActiveName(e.target.value)}
                disabled={activeFile.language === "asset"}
                className="h-7 flex-1 border-0 bg-transparent px-1 font-mono text-xs shadow-none focus-visible:ring-1"
              />
              {activeFile.language === "asset" ? (
                <span className="shrink-0 rounded-md border px-2 py-1 text-xs text-muted-foreground">
                  {t("tool.html-viewer.asset")}
                </span>
              ) : (
                <Select value={activeFile.language} onValueChange={(v) => updateActiveLanguage(v as FileLang)}>
                  <SelectTrigger className="h-7 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                    <SelectItem value="js">JS</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {activeFile.language === "asset" ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl rounded-t-none border bg-muted/10 p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeFile.content}
                  alt={activeFile.name}
                  className="max-h-40 max-w-full rounded-md border bg-white object-contain"
                />
                <p className="text-center text-xs text-muted-foreground">
                  {t("tool.html-viewer.assetHint").replace("{{name}}", activeFile.name)}
                </p>
              </div>
            ) : (
              <Textarea
                value={activeFile.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateActiveContent(e.target.value)}
                spellCheck={false}
                className="min-h-[420px] resize-none rounded-t-none font-mono text-sm p-4"
              />
            )}
          </div>

          <div className="space-y-2 min-w-0">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>{t("tool.html-viewer.preview")}</span>
              <span className="flex items-center gap-1 font-normal normal-case text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("tool.html-viewer.sandboxNote")}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-t-lg border border-b-0 bg-muted/20 px-3 py-2">
              <div className="flex shrink-0 gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border bg-background/60 px-2 py-1">
                {preview.favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.favicon} alt="" className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain" />
                ) : (
                  <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate text-xs text-muted-foreground">{preview.title}</span>
              </div>
            </div>
            <iframe
              key={runCount}
              srcDoc={preview.doc}
              sandbox="allow-scripts allow-modals"
              title="Preview"
              className="min-h-[420px] w-full rounded-b-xl border bg-white"
            />
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
