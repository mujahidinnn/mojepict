"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Copy, ImageIcon, Search, Tag } from "lucide-react";

function counterColor(len: number, ideal: number, max: number) {
  if (len === 0) return "text-muted-foreground";
  if (len <= ideal) return "text-emerald-500";
  if (len <= max) return "text-amber-500";
  return "text-destructive";
}

export default function MetaTagGeneratorPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [siteName, setSiteName] = useState("");
  const [image, setImage] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");

  const domain = useMemo(() => {
    try {
      return url ? new URL(url).hostname : "example.com";
    } catch {
      return url || "example.com";
    }
  }, [url]);

  const code = useMemo(() => {
    const lines: string[] = [];
    if (title) lines.push(`<title>${title}</title>`);
    if (description) lines.push(`<meta name="description" content="${description}" />`);
    if (url) lines.push(`<link rel="canonical" href="${url}" />`);
    lines.push("");
    lines.push(`<meta property="og:type" content="website" />`);
    if (title) lines.push(`<meta property="og:title" content="${title}" />`);
    if (description)
      lines.push(`<meta property="og:description" content="${description}" />`);
    if (url) lines.push(`<meta property="og:url" content="${url}" />`);
    if (siteName) lines.push(`<meta property="og:site_name" content="${siteName}" />`);
    if (image) lines.push(`<meta property="og:image" content="${image}" />`);
    lines.push("");
    lines.push(`<meta name="twitter:card" content="summary_large_image" />`);
    if (title) lines.push(`<meta name="twitter:title" content="${title}" />`);
    if (description)
      lines.push(`<meta name="twitter:description" content="${description}" />`);
    if (image) lines.push(`<meta name="twitter:image" content="${image}" />`);
    if (twitterHandle) lines.push(`<meta name="twitter:site" content="${twitterHandle}" />`);
    return lines.join("\n");
  }, [title, description, url, siteName, image, twitterHandle]);

  const copy = () => {
    navigator.clipboard.writeText(code);
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.meta-tag-generator.name")}
      description={t("tool.meta-tag-generator.description")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.meta-tag-generator.pageTitle")}
              </Label>
              <span className={cn("text-xs", counterColor(title.length, 60, 70))}>
                {title.length} / 60
              </span>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("tool.meta-tag-generator.pageTitlePlaceholder")}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.meta-tag-generator.metaDescription")}
              </Label>
              <span className={cn("text-xs", counterColor(description.length, 160, 180))}>
                {description.length} / 160
              </span>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("tool.meta-tag-generator.metaDescriptionPlaceholder")}
              className="min-h-[90px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.meta-tag-generator.pageUrl")}
            </Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.meta-tag-generator.siteName")}
              </Label>
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.meta-tag-generator.twitterHandle")}
              </Label>
              <Input
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="@yoursite"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.meta-tag-generator.imageUrl")}
            </Label>
            <Input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/og-image.png"
              className="h-11"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Search className="h-3 w-3" /> {t("tool.meta-tag-generator.googlePreview")}
            </Label>
            <div className="rounded-xl border bg-card p-4">
              <p className="truncate text-xs text-muted-foreground">{domain}</p>
              <p className="truncate text-lg text-blue-600 dark:text-blue-400">
                {title || t("tool.meta-tag-generator.pageTitlePlaceholder")}
              </p>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {description || t("tool.meta-tag-generator.metaDescriptionPlaceholder")}
              </p>
            </div>
          </div>

          <div>
            <Label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Tag className="h-3 w-3" /> {t("tool.meta-tag-generator.socialPreview")}
            </Label>
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="flex aspect-[1.91/1] items-center justify-center bg-muted">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="text-xs uppercase text-muted-foreground">{domain}</p>
                <p className="truncate text-sm font-semibold">
                  {title || t("tool.meta-tag-generator.pageTitlePlaceholder")}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {description || t("tool.meta-tag-generator.metaDescriptionPlaceholder")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("tool.meta-tag-generator.generatedCode")}
              </Label>
              <Button variant="outline" size="sm" onClick={copy} disabled={!code}>
                <Copy className="h-4 w-4 mr-2" /> {t("action.copy")}
              </Button>
            </div>
            <Textarea
              readOnly
              value={code}
              className="min-h-[180px] font-mono text-xs resize-none bg-muted/10"
            />
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
