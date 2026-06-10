import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "soft" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  /** Lucide icon component rendered before the label. */
  icon?: React.ElementType;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-[#01696F] text-white hover:bg-[#015257] shadow-md",
  soft: "bg-[#01696F]/10 text-[#01696F] hover:bg-[#01696F] hover:text-white",
  ghost: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800",
  danger: "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600",
  outline: "border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[11px] gap-1 rounded-lg",
  md: "px-4 py-2.5 text-xs gap-1.5 rounded-xl",
  lg: "px-5 py-3 text-sm gap-2 rounded-2xl",
};

const ICON_SIZE: Record<Size, number> = { sm: 13, md: 15, lg: 17 };

/**
 * Teal-branded admin button. Replaces the hand-rolled `<button className="bg-[#01696F]…">`
 * pattern repeated across every admin page. The shared `components/ui/Button` is blue
 * and intentionally not used inside the admin surface.
 */
export function AdminButton({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  disabled,
  children,
  ...props
}: AdminButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-bold transition-all active:scale-[0.98]",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={ICON_SIZE[size]} className="animate-spin" />
      ) : (
        Icon && <Icon size={ICON_SIZE[size]} />
      )}
      {children}
    </button>
  );
}
