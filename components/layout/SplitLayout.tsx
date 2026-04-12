'use client';

import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, ChevronRight } from 'lucide-react';

interface SplitLayoutProps {
  header?: ReactNode;
  leftContent: ReactNode;
  rightContent: ReactNode;
  leftClassName?: string;
  rightClassName?: string;
}

export const SplitLayout = ({
  header,
  leftContent,
  rightContent,
  leftClassName,
  rightClassName,
}: SplitLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-50 relative">
      {/* Header with Animation */}
      <AnimatePresence>
        {!isCollapsed && header && (
          <motion.div
            initial={{ height: 40, opacity: 1 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden bg-zinc-900 shrink-0 relative"
          >
            {header}
            {/* Collapse Button in Header */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all z-20 border border-zinc-700/50"
              title="Focus Mode (Collapse)"
            >
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Focus Mode</span>
              <Maximize2 size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Expand Button (Only visible when collapsed) */}
        <AnimatePresence>
          {isCollapsed && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              // whileHover={{ scale: 1.1 }}
              onClick={() => setIsCollapsed(false)}
              className="absolute right-6 top-6 z-50 p-3 bg-zinc-900 text-white rounded-2xl shadow-2xl border border-zinc-700 hover:bg-zinc-800 transition-colors flex items-center gap-2 group"
            >
              <Minimize2 size={18} />
              {/* <span className="text-xs font-bold tracking-tight pr-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:inline">Exit Focus Mode</span> */}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Left Panel: Animated Sidebar */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '25%', minWidth: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                "h-full bg-white text-zinc-900 overflow-y-auto border-r border-zinc-200 shadow-sm z-10 hidden md:block",
                leftClassName
              )}
            >
              <div className="p-4 md:p-6 max-w-xl mx-auto">
                {leftContent}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile Left Panel (Simple toggle, no animation for simplicity in mobile view for now) */}
        {!isCollapsed && (
          <aside className="h-[40vh] bg-white border-b border-zinc-200 md:hidden overflow-y-auto p-4">
             {leftContent}
          </aside>
        )}

        {/* Right Panel: Pure White Exercise Area */}
        <main
          className={cn(
            "flex-1 h-full bg-[#F8F8FB] overflow-y-auto transition-all duration-300",
            rightClassName
          )}
        >
          <div className="max-w-6xl mx-auto h-full flex flex-col p-2 md:p-4">
            {rightContent}
          </div>
        </main>
      </div>
    </div>
  );
};
