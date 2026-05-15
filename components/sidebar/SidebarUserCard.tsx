import React from "react";
import Image from "next/image";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

interface SidebarUserCardProps {
  planName?: string;
  successRate?: number;
  thumbsUp?: number;
  thumbsDown?: number;
  className?: string;
}

export const SidebarUserCard = ({
  planName = "Free Plan",
  successRate = 53.47,
  thumbsUp = 4,
  thumbsDown = 2,
  className,
}: SidebarUserCardProps) => {
  const [mounted, setMounted] = React.useState(false);
  const user = useAuthStore((state) => state.user);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const userName = mounted ? (user?.name || "Guest") : "Guest";
  const userEmail = mounted ? (user?.email || "") : "";

  return (
    <div className={cn(
      "bg-[#05121A] rounded-[2rem] p-2 flex flex-col gap-2 shadow-2xl border border-white/5",
      className
    )}>
      {/* Top Section: Stats */}
      <div className="flex items-center justify-between mx-4">
        {/* Left: Voting */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-white transition-opacity hover:opacity-80 cursor-pointer">
            <ThumbsUp size={16} strokeWidth={2} color="white" />
            <span className="text-sm">{thumbsUp}</span>
          </div>
          <div className="flex items-center gap-2 text-white transition-opacity hover:opacity-80 cursor-pointer">
            <ThumbsDown size={16} strokeWidth={2} color="white" />
            <span className="text-sm">{thumbsDown}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/20" />

        {/* Right: Success Rate */}
        <div className="flex flex-col text-right">
          <span className="text-sm text-white text-start">{successRate}%</span>
          <span className="text-sm text-[#99A7AA] font-medium">Success Rate</span>
        </div>
      </div>

      {/* Bottom Section: Profile */}
      <div className="flex items-center mx-auto gap-4">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-zinc-800 border-2 border-white/10">
          <Image
            src="/logo.svg"
            alt="Avatar"
            width={20}
            height={20}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1">
          <h3 className="text-md font-semibold text-white tracking-tight leading-none truncate max-w-[120px]">
            {userName}
          </h3>
          <p className="text-[10px] text-[#99A7AA] font-medium truncate max-w-[120px]">
            {userEmail || planName}
          </p>
        </div>
      </div>
    </div>
  );
};
