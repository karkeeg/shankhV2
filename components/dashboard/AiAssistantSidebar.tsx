import React from "react";
import { X } from "lucide-react";
import Image from "next/image";

interface AiAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistantSidebar = ({ isOpen, onClose }: AiAssistantSidebarProps) => {
  if (!isOpen) return null;

  return (
    <aside className="w-[340px] h-full bg-white flex flex-col shrink-0 p-4">
      <div className="flex items-center justify-between bg-[#01696F] text-white px-4 py-3 rounded-full shadow-md mb-4">
        <div className="flex items-center gap-2">
          <Image src="/AiAssistance.svg" alt="" width={24} height={24} />
          <span className="font-bold text-sm">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-white text-[#01696F] flex items-center justify-center hover:bg-zinc-100 transition-colors"
        >
          <X size={14} className="stroke-[3]" color="red" />
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pb-4 pr-1">
        {/* Next best action */}
        <div className="border border-zinc-200 rounded-2xl p-5 bg-[#F0EDE7] shadow-[inset_0px_4px_4px_0px_#00000014]  space-y-4">
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-[#1a1a1a]">Next best action</h4>
            <p className="text-xs text-zinc-600 font-medium leading-relaxed">
              Your strongest return today is finishing one finance quant module and one strategy simulation.
            </p>
          </div>
          <div className="space-y-2">
            <div className="bg-[#E6F0F1] rounded-lg px-3 py-2.5 flex items-center justify-between border border-[#01696F]/10">
              <span className="text-xs font-medium text-zinc-700">LBO debt paydown check</span>
              <span className="text-xs font-bold text-[#1a1a1a]">12 min</span>
            </div>
            <div className="bg-[#E6F0F1] rounded-lg px-3 py-2.5 flex items-center justify-between border border-[#01696F]/10">
              <span className="text-xs font-medium text-zinc-700">Growth case synthesis</span>
              <span className="text-xs font-bold text-[#1a1a1a]">12 min</span>
            </div>
          </div>
        </div>

        {/* AI Coach Insight */}
        <div className="bg-[#F0EDE7] shadow-[inset_0px_4px_4px_0px_#00000014] border border-zinc-200 rounded-2xl p-5 space-y-2">
          <h4 className="text-sm font-bold text-[#1a1a1a]">AI Coach Insight</h4>
          <p className="text-xs text-zinc-600 font-medium leading-relaxed">
            You structure problems well, but you lose marks when numbers are not translated into decision thresholds. Keep conclusions tighter.
          </p>
        </div>

        {/* Weekly momentum */}
        <div className="bg-[#F0EDE7] shadow-[inset_0px_4px_4px_0px_#00000014] border border-zinc-200 rounded-2xl p-5 space-y-4">
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-[#1a1a1a]">Weekly momentum</h4>
            <p className="text-xs text-zinc-600 font-medium leading-relaxed">
              Your strongest return today is finishing one finance quant module and one strategy simulation.
            </p>
          </div>
          <button className="w-full bg-[#E6F0F1] border border-[#01696F]/20 text-[#01696F] py-2.5 rounded-lg font-bold text-sm hover:bg-[#d8e8e9] transition-colors shadow-sm">
            5 day streak
          </button>
        </div>
      </div>
    </aside>
  );
};
