"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { FormGroup } from "@/components/tools/ToolTemplates";
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
      <div className="max-w-screen-lg flex flex-col gap-8">
        <FormGroup label={t("tool.slug-generator.input")}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("tool.slug-generator.placeholder")}
          />
        </FormGroup>

        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium block">
              {t("tool.slug-generator.separator")}
            </Label>
            <Tabs value={separator} onValueChange={(v) => setSeparator(v as Separator)}>
              <TabsList>
                <TabsTrigger value="-">-</TabsTrigger>
                <TabsTrigger value="_">_</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={lowercase} onCheckedChange={setLowercase} id="lowercase" />
            <Label htmlFor="lowercase" className="text-sm font-normal cursor-pointer">
              {t("tool.slug-generator.lowercase")}
            </Label>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("tool.slug-generator.output")}
          </Label>
          <Card className="p-6 flex items-center justify-between bg-muted/10">
            <div className="flex-1 overflow-hidden pr-4 flex items-center gap-2">
              <Link className="h-4 w-4 shrink-0 text-muted-foreground" />
              <code className="truncate text-sm font-mono">
                {slug || t("tool.slug-generator.placeholder")}
              </code>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={copy}
              disabled={!slug}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    </ToolShell>
  );
}
