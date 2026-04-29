"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, User, Sparkles, TrendingUp } from "lucide-react";

interface CanvasInstructionPanelProps {
  difficulty: "Easy" | "Medium" | "Hard";
  title: string;
  instructions: React.ReactNode;
  contextContent?: React.ReactNode;
  successRate?: number;
  upvotes?: number;
  downvotes?: number;
  userName?: string;
  userPlan?: string;
  children?: React.ReactNode;
  showTitle?: boolean;
}

export const CanvasInstructionPanel = ({
  difficulty,
  title,
  instructions,
  contextContent,
  successRate = 53.47,
  upvotes = 4,
  downvotes = 2,
  userName = "Bibek karki",
  userPlan = "Free Plan",
  children,
}: CanvasInstructionPanelProps) => {
  const [activeTab, setActiveTab] = useState<"instructions" | "context">("instructions");

  const difficultyStyles = {
    Easy: "bg-emerald-500 text-white",
    Medium: "bg-amber-500 text-white",
    Hard: "bg-rose-500 text-white",
  };

  return (
    <div className="flex flex-col h-full bg-[#0F1F2C] border-r border-zinc-800 shadow-xl" style={{ width: 280, minWidth: 280, maxWidth: 280 }}>
      {/* Tab Switcher — Pill Style */}
      <div className="px-4 pt-8 pb-4 shrink-0">
        <div className="flex bg-[#1E2E3C] p-1 rounded-full border border-zinc-700/50">
          <button
            onClick={() => setActiveTab("instructions")}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-full transition-all",
              activeTab === "instructions"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-zinc-300"
            )}
          >
            Instructions
          </button>
          <button
            onClick={() => setActiveTab("context")}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-full transition-all",
              activeTab === "context"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-zinc-300"
            )}
          >
            Context
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-2 space-y-5 custom-scrollbar">
        {activeTab === "instructions" ? (
          <>
            {/* Difficulty Badge */}
            <div className="flex">
              <span
                className={cn(
                  "px-3 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest",
                  difficultyStyles[difficulty]
                )}
              >
                {difficulty}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-lg font-black text-white leading-tight tracking-tight">
              {title}
            </h2>

            {/* Instruction Body */}
            <div className="text-[13px] text-zinc-300/90 leading-relaxed font-medium space-y-4">
              {instructions}
            </div>

            {children}
          </>
        ) : (
          <div className="text-[13px] text-zinc-300/90 leading-relaxed font-medium">
            {contextContent || (
              <p className="text-zinc-500 italic">No context provided for this exercise.</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section — Fixed */}
      <div className="shrink-0 bg-[#0A1621] p-5 space-y-5">
        {/* Stats Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
              <ThumbsUp size={16} />
              <span className="text-xs font-bold">{upvotes}</span>
            </button>
            <button className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
              <ThumbsDown size={16} />
              <span className="text-xs font-bold">{downvotes}</span>
            </button>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-sm font-black text-white">{successRate}%</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Success Rate</span>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="flex items-center gap-3 bg-[#1E2E3C]/40 p-3 rounded-2xl border border-zinc-800/50">
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden shrink-0 border-2 border-zinc-600 shadow-inner">
            <User size={20} className="text-zinc-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white truncate leading-none mb-1">{userName}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{userPlan}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
