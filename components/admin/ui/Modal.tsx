"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl";

const WIDTHS: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: ModalSize;
  /** Footer node (typically Cancel/Save buttons). Rendered in a bordered footer. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Disable closing via ESC / backdrop (e.g. while submitting). */
  dismissable?: boolean;
}

/**
 * Shared admin modal. Replaces the `fixed inset-0 bg-black/40 backdrop-blur` overlay +
 * scale-up card that was copy-pasted ~8 times across the admin pages.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  footer,
  children,
  dismissable = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissable, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && dismissable) onClose();
      }}
    >
      <div
        className={cn(
          "bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full flex flex-col max-h-[90vh] animate-scale-up",
          WIDTHS[size],
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-zinc-100 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-[#01696F] tracking-tight truncate">{title}</h3>
            {subtitle && <p className="text-xs text-zinc-500 font-medium mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400 shrink-0 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-zinc-100 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
