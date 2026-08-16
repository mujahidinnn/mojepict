import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToolEmptyStateProps {
  icon: ReactNode;
  title: string;
  hint?: string;
  className?: string;
}

/**
 * Standard "nothing here yet" placeholder for a result/output panel —
 * one consistent icon-circle + text treatment instead of every tool
 * inventing its own opacity/sizing for the same idea.
 */
export function ToolEmptyState({ icon, title, hint, className }: ToolEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
      </div>
    </div>
  );
}
