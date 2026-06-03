"use client";

import React from "react";
import { Briefcase, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfessionCardProps {
  profession: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    iconKey: string | null;
  };
  isActive?: boolean;
  onClick?: () => void;
}

export const ProfessionCard: React.FC<ProfessionCardProps> = ({
  profession,
  isActive = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-6 rounded-3xl border transition-all duration-300 cursor-pointer select-none overflow-hidden",
        "bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.1)] hover:-translate-y-1 active:scale-[0.98]",
        isActive
          ? "border-[#01696F] ring-2 ring-[#01696F]/10 bg-emerald-50/20"
          : "border-zinc-150 hover:border-zinc-300"
      )}
    >
      {/* Decorative top grid lines */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      {/* Decorative background glow for active state */}
      {isActive && (
        <div className="absolute -right-16 -top-16 w-36 h-36 bg-[#01696F]/10 rounded-full blur-2xl pointer-events-none transition-all duration-500 group-hover:scale-125" />
      )}

      <div className="flex items-start gap-4">
        {/* Icon container */}
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border",
            isActive
              ? "bg-[#01696F] text-white border-transparent scale-110"
              : "bg-zinc-50 text-zinc-500 border-zinc-200 group-hover:bg-[#E6F0F1] group-hover:text-[#01696F] group-hover:border-[#01696F]/20"
          )}
        >
          <Briefcase size={22} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-extrabold text-base tracking-tight transition-colors duration-200",
              isActive ? "text-[#01696F]" : "text-zinc-800 group-hover:text-zinc-950"
            )}
          >
            {profession.name}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed font-semibold mt-1 line-clamp-3">
            {profession.description || "Establish specialized skills and excel in your professional curriculum."}
          </p>
        </div>
      </div>

      {/* Bottom action indicator */}
      <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/70">
          Enter Track
        </span>
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
            isActive
              ? "bg-[#01696F] text-white scale-110"
              : "bg-zinc-50 text-zinc-400 group-hover:bg-[#01696F] group-hover:text-white"
          )}
        >
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
};
