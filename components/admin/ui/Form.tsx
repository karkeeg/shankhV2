import React from "react";
import { cn } from "@/lib/utils";

const LABEL_CLS = "text-[9px] font-bold text-zinc-400 uppercase tracking-wider";
const CONTROL_CLS =
  "px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none transition-all " +
  "focus:bg-white focus:border-[#01696F]/50 disabled:opacity-60 disabled:cursor-not-allowed";

/** Labelled field wrapper. Pass `error` to show a hint and tint the label. */
export function Field({
  label,
  error,
  hint,
  required,
  className,
  children,
}: {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <label className={cn(LABEL_CLS, error && "text-rose-500")}>
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="text-[10px] font-semibold text-rose-500">{error}</span>
      ) : hint ? (
        <span className="text-[10px] text-zinc-400">{hint}</span>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL_CLS, className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 2, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(CONTROL_CLS, "resize-none", className)} {...props} />;
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(CONTROL_CLS, "cursor-pointer", className)} {...props}>
        {children}
      </select>
    );
  },
);

/** Native color picker with consistent admin styling. */
export const ColorInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function ColorInput({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="color"
        className={cn("w-full h-9 p-0.5 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer", className)}
        {...props}
      />
    );
  },
);

/** Inline error/alert banner for forms. */
export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
      {message}
    </div>
  );
}
