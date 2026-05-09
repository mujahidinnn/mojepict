import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ToolShellProps {
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function ToolShell({
  title,
  description,
  badge,
  children,
  actions,
}: ToolShellProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground max-w-prose">
            {description}
          </p>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      <Separator />

      <div>{children}</div>
    </div>
  );
}
