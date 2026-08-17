import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToolWorkspaceProps {
  /** Main content: dropzone, canvas, preview, form. */
  children: ReactNode;
  /** Options/controls column. Omit for single-column tools (e.g. unit-converter). */
  sidebar?: ReactNode;
  className?: string;
}

/**
 * Canonical two-pane tool layout: main content + a fixed-width options
 * sidebar. This is the single source of truth for the sidebar width/gap so
 * individual tool pages stop hardcoding their own (280/320/350/400px).
 */
export function ToolWorkspace({ children, sidebar, className }: ToolWorkspaceProps) {
  if (!sidebar) {
    return <div className={cn("min-w-0", className)}>{children}</div>;
  }

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start", className)}>
      <div className="min-w-0">{children}</div>
      <div className="flex flex-col gap-6 lg:sticky lg:top-6">{sidebar}</div>
    </div>
  );
}
