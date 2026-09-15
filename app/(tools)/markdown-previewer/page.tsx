"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { renderMarkdown } from "@/lib/markdown-render";

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
