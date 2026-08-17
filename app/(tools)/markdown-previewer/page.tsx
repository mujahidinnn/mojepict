"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sanitizeUrl(url: string) {
  const trimmed = url.trim();
  return /^(https?:|mailto:|\/|#)/i.test(trimmed) ? trimmed : "#";
}

const HEADING_SIZES: Record<number, string> = {
  1: "text-3xl",
  2: "text-2xl",
  3: "text-xl",
  4: "text-lg",
  5: "text-base",
  6: "text-sm",
};

function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_m, label, url) =>
        `<a href="${sanitizeUrl(url)}" class="text-primary underline underline-offset-2" target="_blank" rel="noopener noreferrer">${label}</a>`,
    );
}

function renderMarkdown(src: string): string {
  const lines = escapeHtml(src).split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let listBuffer: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!listBuffer) return;
    const tag = listBuffer.type;
    html.push(`<${tag} class="${tag === "ul" ? "list-disc" : "list-decimal"} pl-6 space-y-1 my-2">`);
    for (const item of listBuffer.items) html.push(`<li>${inline(item)}</li>`);
    html.push(`</${tag}>`);
    listBuffer = null;
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        html.push(
          `<pre class="rounded-md bg-muted p-3 overflow-x-auto text-xs font-mono my-2"><code>${codeBuffer.join("\n")}</code></pre>`,
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      html.push(
        `<h${level} class="${HEADING_SIZES[level]} font-bold mt-4 mb-2">${inline(heading[2])}</h${level}>`,
      );
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushList();
      html.push('<hr class="my-4 border-border" />');
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushList();
      html.push(
        `<blockquote class="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-2">${inline(quote[1])}</blockquote>`,
      );
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.*)$/);
    if (unordered) {
      if (!listBuffer || listBuffer.type !== "ul") {
        flushList();
        listBuffer = { type: "ul", items: [] };
      }
      listBuffer.items.push(unordered[1]);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.*)$/);
    if (ordered) {
      if (!listBuffer || listBuffer.type !== "ol") {
        flushList();
        listBuffer = { type: "ol", items: [] };
      }
      listBuffer.items.push(ordered[1]);
      continue;
    }

    flushList();
    html.push(line.trim() === "" ? "" : `<p class="my-2 leading-relaxed">${inline(line)}</p>`);
  }
  flushList();
  return html.join("\n");
}

const DEFAULT_MARKDOWN = `# Hello World

This is a **markdown** previewer with *live* rendering.

- Supports lists
- \`inline code\`
- [links](https://example.com)

> Blockquotes work too.
`;

export default function MarkdownPreviewerPage() {
  const { t } = useI18n();
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);

  const html = useMemo(() => renderMarkdown(markdown), [markdown]);

  return (
    <ToolShell
      title={t("tool.markdown-previewer.name")}
      description={t("tool.markdown-previewer.description")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("tool.markdown-previewer.input")}
          </Label>
          <Textarea
            value={markdown}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMarkdown(e.target.value)}
            spellCheck={false}
            className="min-h-[500px] resize-none font-mono text-sm p-4"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("tool.markdown-previewer.preview")}
          </Label>
          <div
            className="min-h-[500px] rounded-xl border bg-muted/10 p-4 overflow-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </ToolShell>
  );
}
