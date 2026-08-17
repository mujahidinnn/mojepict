"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { TOOLS } from "@/lib/tools";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ImageIcon,
  Crop,
  PackageOpen,
  Ruler,
  Pipette,
  Zap,
  LucideIcon,
  Image,
  Type,
  Calculator,
  PaintbrushVertical,
  Palette,
  Code2,
  Scaling,
  Brush,
  ScanSearch,
  BookmarkCheck,
  Frame,
  QrCode,
  Cpu,
  Eraser,
  Camera,
  PenTool,
  Grid3X3,
  Smartphone,
  ScanQrCode,
} from "lucide-react";
import { DialogDescription, DialogTitle } from "../ui/dialog";

const ICONS: Record<string, LucideIcon> = {
  ImageIcon,
  Crop,
  PackageOpen,
  Ruler,
  Pipette,
  Smartphone,
  Zap,
  Image,
  Type,
  Calculator,
  PaintbrushVertical,
  Palette,
  Code2,
  Scaling,
  Brush,
  ScanSearch,
  BookmarkCheck,
  Frame,
  Grid3X3,
  QrCode,
  Cpu,
  Eraser,
  Camera,
  PenTool,
  ScanQrCode,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
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

  const navigate = useCallback(
    (slug: string) => {
      setOpen(false);
      router.push(`/${slug}`);
    },
    [router],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Search Tools</DialogTitle>
      <DialogDescription className="sr-only">
        Quickly access any tool
      </DialogDescription>
      <CommandInput placeholder={t("palette.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("palette.noResults")}</CommandEmpty>
        <CommandGroup heading="Tools">
          {TOOLS.map((tool) => {
            const LIcon = ICONS[tool.icon] ?? Zap;
            const name = t(`tool.${tool.id}.name` as any);
            const desc = t(`tool.${tool.id}.description` as any);
            return (
              <CommandItem
                key={tool.id}
                value={tool.id}
                onSelect={() => navigate(tool.slug)}
              >
                <LIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="ml-3">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
