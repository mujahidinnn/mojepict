"use client";

import { ReactNode, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface ToolActionBarProps {
  primaryLabel?: string;
  primaryIcon?: ReactNode;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  primaryType?: "button" | "submit";
  resetLabel?: string;
  onReset?: () => void;
  resetDisabled?: boolean;
  /** Extra buttons/notes rendered between the primary action and reset. */
  children?: ReactNode;
  className?: string;
}

/**
 * Standardized action footer: primary action, optional extra buttons, and a
 * destructive reset gated by one shared confirm dialog (instead of every
 * page wiring its own AlertDialog / window.confirm).
 */
export function ToolActionBar({
  primaryLabel,
  primaryIcon,
  onPrimary,
  primaryDisabled,
  primaryType = "button",
  resetLabel,
  onReset,
  resetDisabled,
  children,
  className,
}: ToolActionBarProps) {
  const { t } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {onPrimary && primaryLabel && (
        <Button
          type={primaryType}
          className="w-full gap-2"
          onClick={onPrimary}
          disabled={primaryDisabled}
        >
          {primaryIcon}
          {primaryLabel}
        </Button>
      )}

      {children}

      {onReset && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 text-destructive hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={resetDisabled}
          >
            {resetLabel ?? t("action.reset")}
          </Button>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("dialog.confirm.title")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("dialog.confirm.description")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onReset();
                    setConfirmOpen(false);
                  }}
                >
                  {t("action.confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
