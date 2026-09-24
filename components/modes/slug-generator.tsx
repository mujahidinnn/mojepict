"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Copy, Link } from "lucide-react";

type Separator = "-" | "_";

function slugify(text: string, separator: Separator, lowercase: boolean): string {
  let result = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .trim()
    .replace(/[\s-_]+/g, separator);

  if (lowercase) result = result.toLowerCase();
  return result.replace(new RegExp(`^\\${separator}+|\\${separator}+$`, "g"), "");
}

export default function SlugGeneratorPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [separator, setSeparator] = useState<Separator>("-");
  const [lowercase, setLowercase] = useState(true);

  const slug = useMemo(
    () => slugify(input, separator, lowercase),
    [input, separator, lowercase],
  );

  const copy = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.slug-generator.name")}
      description={t("tool.slug-generator.description")}
    >
      <div className="flex flex-col gap-6 max-w-xl">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            {t("tool.slug-generator.input")}
          </Label>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("tool.slug-generator.placeholder")}
            className="h-11"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.slug-generator.separator")}
            </Label>
            <Tabs value={separator} onValueChange={(v) => setSeparator(v as Separator)}>
              <TabsList>
                <TabsTrigger value="-">-</TabsTrigger>
                <TabsTrigger value="_">_</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <Switch checked={lowercase} onCheckedChange={setLowercase} id="lowercase" />
            <Label htmlFor="lowercase" className="text-sm">
              {t("tool.slug-generator.lowercase")}
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            {t("tool.slug-generator.output")}
          </Label>
          <div className="flex items-center gap-2 rounded-xl border bg-muted/10 p-4">
            <Link className="h-4 w-4 shrink-0 text-muted-foreground" />
            <code className="flex-1 truncate text-sm">
              {slug || t("tool.slug-generator.placeholder")}
            </code>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copy} disabled={!slug}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
