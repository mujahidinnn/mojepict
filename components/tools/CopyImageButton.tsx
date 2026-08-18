"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { copyImageToClipboard } from "@/lib/copy-image";
import { cn } from "@/lib/utils";

interface CopyImageButtonProps {
  /** Must resolve to a PNG blob (see lib/copy-image#toPngBlob for non-PNG sources). */
  getBlob: () => Promise<Blob | null>;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/** Secondary action, rendered alongside a tool's Download button, that copies its result image to the clipboard. */
export function CopyImageButton({
  getBlob,
  disabled,
  label,
  className,
}: CopyImageButtonProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const blob = await getBlob();
      if (!blob) throw new Error("No image to copy.");
      await copyImageToClipboard(blob);
      setCopied(true);
      toast({ title: "Done!", description: t("toast.success.copied") });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({
        title: "Failed",
        description: t("toast.error.copyImage"),
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full gap-2", className)}
      onClick={handleCopy}
      disabled={disabled}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {label ?? t("action.copy-image")}
    </Button>
  );
}
