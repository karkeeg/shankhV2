import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  /** Optional action node (e.g. a create button). */
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

/** Centered empty-state placeholder for columns and panels. */
export function EmptyState({ icon: Icon, title, description, action, className, size = "md" }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16", className)}>
      <Icon size={size === "sm" ? 24 : 32} className="text-zinc-300 mb-2" />
      <h4 className="text-xs font-extrabold text-zinc-500">{title}</h4>
      {description && <p className="text-[10px] text-zinc-400 mt-1 max-w-[220px] leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
