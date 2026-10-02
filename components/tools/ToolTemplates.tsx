"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Template: Two-column tool layout (input | output)
 * Enforces spacing scale and responsive design
 */
interface TwoColumnLayoutProps {
  children: ReactNode;
}

export function TwoColumnLayout({ children }: TwoColumnLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {children}
    </div>
  );
}

/**
 * Template: Input section (column)
 * Enforces: space-y-4, consistent padding
 */
interface InputSectionProps {
  label: string;
  children: ReactNode;
  action?: ReactNode;
}

export function InputSection({ label, children, action }: InputSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </Label>
        {action}
      </div>
      {children}
    </div>
  );
}

/**
 * Template: Output section (column)
 * Enforces: space-y-4 for title, space-y-3 for results
 */
interface OutputSectionProps {
  label: string;
  children: ReactNode;
}

export function OutputSection({ label, children }: OutputSectionProps) {
  return (
    <div className="space-y-4">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/**
 * Template: Result card (copy-able output)
 * Enforces: p-6, flex layout, consistent sizing
 */
interface ResultCardProps {
  label?: string;
  content: string;
  onCopy: (content: string) => void;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

export function ResultCard({
  label,
  content,
  onCopy,
  disabled,
  className,
  icon,
}: ResultCardProps) {
  return (
    <Card className={cn("p-6 flex items-center justify-between bg-muted/10", className)}>
      <div className="flex-1 overflow-hidden pr-4">
        {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
        <p className={cn("truncate", label ? "text-sm mt-1" : "text-sm")}>{content}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        {icon}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onCopy(content)}
          disabled={disabled || !content}
          className="h-9 w-9"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

/**
 * Template: Full-width tool (single column, max-w constrained)
 * For calculators, generators that don't need split layout
 */
interface SingleColumnLayoutProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg"; // defaults to md (56rem)
}

export function SingleColumnLayout({
  children,
  maxWidth = "md",
}: SingleColumnLayoutProps) {
  const widthClass = {
    sm: "max-w-sm",
    md: "max-w-screen-lg",
    lg: "max-w-4xl",
  }[maxWidth];

  return (
    <div className={cn("flex flex-col gap-8 w-full", widthClass)}>
      {children}
    </div>
  );
}

/**
 * Template: Form group (label + input in consistent spacing)
 */
interface FormGroupProps {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
}

export function FormGroup({ label, children, hint, error }: FormGroupProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Template: Option group (checkboxes, switches, radio buttons)
 * Enforces: space-y-3 between items
 */
interface OptionGroupProps {
  label?: string;
  children: ReactNode;
}

export function OptionGroup({ label, children }: OptionGroupProps) {
  return (
    <div className="space-y-3">
      {label && <Label className="text-sm font-medium block">{label}</Label>}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/**
 * Template: Options row (single option item)
 * For use inside OptionGroup
 */
interface OptionRowProps {
  label: string;
  control: ReactNode; // Switch, Checkbox, Radio
}

export function OptionRow({ label, control }: OptionRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <Label htmlFor={label} className="text-sm font-normal cursor-pointer">
        {label}
      </Label>
      {control}
    </div>
  );
}
