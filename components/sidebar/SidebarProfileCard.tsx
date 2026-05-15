import React from "react";
import Image from "next/image";
import { ChevronRight, User } from "lucide-react";

interface SidebarProfileCardProps {
  userName?: string;
  planName?: string;
  showCTA?: boolean;
}

export const SidebarProfileCard = ({
  userName = "Bibek karki",
  planName = "Free Plan",
  showCTA = true,
}: SidebarProfileCardProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0 border-2 border-white/10 flex items-center justify-center">
          <Image
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`}
            alt="Avatar"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-sm text-[var(--sidebar-text)] truncate">{userName}</span>
          <span className="text-[10px] text-[var(--sidebar-muted)] uppercase tracking-wider font-bold">{planName}</span>
        </div>
      </div>

      {showCTA && (
        <button
          className="w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 bg-[var(--sidebar-text)] text-[var(--sidebar-card)] hover:opacity-90 active:scale-[0.98] shadow-lg shadow-[var(--sidebar-glow)]"
        >
          Your Profile
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
};
