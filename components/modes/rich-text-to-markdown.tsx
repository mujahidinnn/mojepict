"use client";

import { useRef, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { htmlToMarkdown } from "@/lib/html-to-markdown";
import { Bold, Code, Copy, Download, Heading1, Heading2, Italic, Link, List, ListOrdered, Quote, Strikethrough } from "lucide-react";

// document.execCommand is deprecated but is still the only dependency-free way to drive contentEditable.
const ACTIONS: { icon: typeof Bold; label: string; run: () => void }[] = [
  { icon: Bold, label: "Bold", run: () => document.execCommand("bold") },
  { icon: Italic, label: "Italic", run: () => document.execCommand("italic") },
  { icon: Strikethrough, label: "Strikethrough", run: () => document.execCommand("strikeThrough") },
  { icon: Heading1, label: "H1", run: () => document.execCommand("formatBlock", false, "h1") },
  { icon: Heading2, label: "H2", run: () => document.execCommand("formatBlock", false, "h2") },
  { icon: List, label: "Bullet list", run: () => document.execCommand("insertUnorderedList") },
  { icon: ListOrdered, label: "Numbered list", run: () => document.execCommand("insertOrderedList") },
  { icon: Quote, label: "Quote", run: () => document.execCommand("formatBlock", false, "blockquote") },
  { icon: Code, label: "Code", run: () => document.execCommand("formatBlock", false, "pre") },
  {
    icon: Link,
    label: "Link",
    run: () => {
      const url = window.prompt("URL", "https://");
      if (url) document.execCommand("createLink", false, url);
    },
  },
];

export default function RichTextToMarkdownPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const [markdown, setMarkdown] = useState("");

  const sync = () => editorRef.current && setMarkdown(htmlToMarkdown(editorRef.current));

  const copy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    toast({ description: t("toast.success.copied") });
  };

  const download = () => {
    if (!markdown) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <ToolShell
      title={t("tool.rich-text-to-markdown.name")}
      description={t("tool.rich-text-to-markdown.description")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("tool.rich-text-to-markdown.editor")}
          </Label>
          <div className="flex flex-wrap gap-1">
            {ACTIONS.map(({ icon: Icon, label, run }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                size="icon"
                title={label}
                aria-label={label}
                // preventDefault keeps the editor's selection when the button is clicked.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  run();
                  sync();
                }}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={sync}
            className="min-h-[460px] rounded-xl border p-4 overflow-auto focus:outline-none focus:ring-2 focus:ring-ring [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_pre]:font-mono [&_a]:text-primary [&_a]:underline"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Markdown
            </Label>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={copy} disabled={!markdown}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                {t("tool.rich-text-to-markdown.copy")}
              </Button>
              <Button variant="outline" size="sm" onClick={download} disabled={!markdown}>
                <Download className="h-3.5 w-3.5 mr-1" />
                .md
              </Button>
            </div>
          </div>
          <Textarea
            value={markdown}
            readOnly
            spellCheck={false}
            className="min-h-[500px] resize-none font-mono text-sm p-4"
          />
        </div>
      </div>
    </ToolShell>
  );
}
