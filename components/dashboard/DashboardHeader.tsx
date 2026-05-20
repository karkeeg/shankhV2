import React from "react";
import { Search, Bell, Sparkles } from "lucide-react";
import Image from "next/image";

interface DashboardHeaderProps {
  isAiOpen: boolean;
  onOpenAi: () => void;
}

export const DashboardHeader = ({ isAiOpen, onOpenAi }: DashboardHeaderProps) => {
  return (
    <header className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-bold text-[#01696F]">Dashboard</h2>
      <div className="flex items-center gap-3 flex-1 justify-end">
        <div className="relative w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#01696F]" size={22} />
          <input
            type="text"
            placeholder="Search topics, cases and formulas"
            className="w-full bg-white border border-[#01696F] rounded-full py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#01696F]/20 transition-all text-xs font-medium placeholder:text-zinc-500"
          />
        </div>
        <button className="w-9 h-9 flex items-center justify-center bg-white border border-[#01696F] rounded-xl hover:bg-zinc-50 transition-colors relative">
          <Bell size={24} className="text-[#01696F]" />
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
        </button>
        {!isAiOpen && (
          <button
            onClick={onOpenAi}
            className="flex items-center gap-2 bg-[#01696F] text-white px-2 py-2 rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-md"
          >
            <Image src="/AiAssistance.svg" alt="" width={24} height={24} />
            {/* AI Assistant */}
          </button>
        )}
      </div>
    </header>
  );
};
