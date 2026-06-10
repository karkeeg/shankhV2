import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  /** Tailwind classes for the icon chip, e.g. "bg-amber-50 text-amber-600". */
  accent?: string;
  loading?: boolean;
}

/** Compact dashboard metric tile used in the admin landing grid. */
export function StatCard({ label, value, icon: Icon, accent = "bg-[#E6F0F1] text-[#01696F]", loading }: StatCardProps) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
      <div className="space-y-1">
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-black text-zinc-800 tracking-tight">{loading ? "…" : value}</h3>
      </div>
      <div className={cn("p-3 rounded-xl group-hover:scale-110 transition-transform", accent)}>
        <Icon size={20} />
      </div>
    </div>
  );
}
