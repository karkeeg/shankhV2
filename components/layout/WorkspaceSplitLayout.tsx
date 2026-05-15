"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';

interface WorkspaceSplitLayoutProps {
  mainContent: React.ReactNode;
  rightSidebarContent: React.ReactNode;
  onBack?: () => void;
  title?: string;
}

export const WorkspaceSplitLayout = ({
  mainContent,
  rightSidebarContent,
  onBack,
  title,
}: WorkspaceSplitLayoutProps) => {

  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  return (
    <div className="flex h-full overflow-hidden bg-[#CCD0CF] relative">
      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        {/* Expand Sidebar Button (Only visible when sidebar is collapsed) */}
        <AnimatePresence>
          {isRightCollapsed && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              onClick={() => setIsRightCollapsed(false)}
              className="absolute right-2 top-2 z-30 w-12 h-12 rounded-full bg-[var(--sidebar-bg)] border border-white/10 shadow-2xl flex items-center justify-center text-amber-400 hover:scale-110 transition-transform group"
              title="Open AI Coach"
            >
              <Sparkles size={20} />
              <div className="absolute right-full mr-3 px-2 py-1 rounded bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                AI Coach
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Navigation Header */}
        <div className="px-3 py-1 flex items-center justify-between border-b border-black/5 shrink-0">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors group"
              >
                <div className="w-5 h-5 rounded-lg bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                  <ChevronRight size={18} className="rotate-180" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Back to course</span>
              </button>
            )}

            {onBack && title && <div className="w-px h-4 bg-black/10" />}

            {title && (
              <h1 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                {title}
              </h1>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-2">
          <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
            {mainContent}
          </div>
        </div>
      </main>


      {/* Collapsable Right Sidebar (AI Coach) */}
      <AnimatePresence initial={false}>
        <motion.aside
          initial={false}
          animate={{
            width: isRightCollapsed ? 0 : '25%',
            minWidth: isRightCollapsed ? 0 : 320
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "h-full bg-[var(--sidebar-bg)] border-l border-white/5 flex flex-col overflow-hidden relative"
          )}
        >
          {/* Collapse Toggle Button (Internal) */}
          {!isRightCollapsed && (
            <button
              onClick={() => setIsRightCollapsed(true)}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              title="Collapse AI Coach"
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          )}

          {!isRightCollapsed && (
            <div className="flex-1 overflow-hidden">
              {rightSidebarContent}
            </div>
          )}
        </motion.aside>
      </AnimatePresence>

    </div>
  );
};
