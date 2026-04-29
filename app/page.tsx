"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  ChevronDown,
  Book,
  Play,
  Trophy,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { financeData } from "@/data/financeData";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";

import { MainLayout } from "@/components/layout/MainLayout";

export default function Dashboard() {
  const { xp, completedLessons } = useAppStore();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "balance-sheet",
  );

  const categories = [
    { name: "Balance Sheet", id: "balance-sheet" },
    { name: "Income Statement", id: "income-statement" },
    { name: "Cash Flow Statement", id: "cash-flow" },
  ];

  const totalLessons = financeData.length;
  const completedCount = Object.values(completedLessons).filter(l => l.completed).length;
  const progressPercentage = Math.round((completedCount / totalLessons) * 100);

  return (
    <MainLayout>
      {/* Simple Header */}
      <header className="border-b border-zinc-200 px-8 py-6 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Dashboard
            </h1>
            <p className="text-zinc-500 text-sm">
              Professional financial modeling platform.
            </p>
          </div>

          {/* Simple Stats */}
          <div className="flex gap-4">
            <div className="bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-lg flex items-center gap-3 min-w-[120px]">
              <div className="text-zinc-400">
                <Zap size={16} fill="currentColor" />
              </div>
              <div>
                <div className="text-lg font-bold text-zinc-900 leading-none">{xp}</div>
                <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">XP</div>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-lg flex items-center gap-3 min-w-[120px]">
              <div className="text-zinc-400">
                <Target size={16} />
              </div>
              <div>
                <div className="text-lg font-bold text-zinc-900 leading-none">{progressPercentage}%</div>
                <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Progress</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content Container */}
      <div className="max-w-5xl w-full mx-auto px-8 py-10 space-y-8">
        
        {/* Welcome Message - Simplified */}
        <div className="rounded-2xl bg-zinc-900 p-8 shadow-lg border border-zinc-800">
           <div className="flex justify-between items-center">
              <div className="space-y-4 max-w-md">
                 <h2 className="text-2xl font-bold text-white">Academic Progress</h2>
                 <p className="text-zinc-400 text-sm leading-relaxed">
                   You have successfully completed {completedCount} out of {totalLessons} modules. Continue your curriculum to reach full certification.
                 </p>
                 <button className="bg-white text-zinc-900 px-6 py-2 rounded-lg font-bold text-sm hover:bg-zinc-100 transition-all active:scale-95 shadow-md">
                   CONTINUE CURRICULUM
                 </button>
              </div>
              {/* No Trophy Logo */}
           </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Course Catalog</h3>
          
          <div className="grid gap-3">
            {categories.map((cat, catIdx) => {
              const lessons = financeData.filter((l) => l.category === cat.id);
              const isExpanded = expandedCategory === cat.id;
              const completedInCategory = lessons.filter(l => completedLessons[l.id]?.completed).length;

              return (
                <motion.div 
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.05 }}
                >
                  <div
                    onClick={() =>
                      setExpandedCategory(isExpanded ? null : cat.id)
                    }
                    className={cn(
                      "group bg-white px-6 py-4 rounded-xl border transition-all duration-300 cursor-pointer relative",
                      isExpanded 
                        ? "border-zinc-300 shadow-md ring-1 ring-zinc-100" 
                        : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-lg transition-colors border",
                          isExpanded ? "bg-zinc-900 text-white border-zinc-800" : "bg-zinc-50 text-zinc-400 border-zinc-100"
                        )}>
                          <Book size={20} />
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                            {cat.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                             <span>{lessons.length} Modules</span>
                             <span className="w-1 h-1 rounded-full bg-zinc-200" />
                             <span className="text-indigo-600">{completedInCategory} Complete</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                         <Link
                           href={lessons.length > 0 ? `/finance/${cat.id}/${lessons[0].slug}` : "#"}
                           onClick={(e) => e.stopPropagation()}
                           className="bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-lg font-bold text-xs transition-all opacity-0 group-hover:opacity-100"
                         >
                           ENTER
                         </Link>
                         <ChevronDown
                           size={20}
                           className={cn(
                             "text-zinc-300 transition-transform duration-300",
                             isExpanded ? "rotate-180" : "rotate-0",
                           )}
                         />
                      </div>
                    </div>

                    {/* Simple Progress Line */}
                    <div className="absolute bottom-0 left-0 h-1 bg-zinc-100 w-full overflow-hidden rounded-b-xl">
                       <div 
                        className="h-full bg-zinc-900 transition-all duration-1000" 
                        style={{ width: `${(completedInCategory / lessons.length) * 100}%` }}
                       />
                    </div>
                  </div>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 px-2 overflow-hidden"
                    >
                      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                        {lessons.map((lesson, idx) => {
                          const isCompleted = completedLessons[lesson.id]?.completed;
                          return (
                            <Link
                              key={lesson.id}
                              href={`/finance/${lesson.category}/${lesson.slug}`}
                              className={cn(
                                "flex items-center justify-between p-4 px-6 hover:bg-zinc-50 transition-all group/item",
                                idx !== lessons.length - 1
                                  ? "border-b border-zinc-100"
                                  : "",
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold",
                                  isCompleted 
                                    ? "bg-emerald-100 text-emerald-700" 
                                    : "bg-zinc-100 text-zinc-500 group-hover/item:bg-zinc-900 group-hover/item:text-white"
                                )}>
                                  {isCompleted ? <Zap size={12} fill="currentColor" /> : idx + 1}
                                </div>
                                <div className="flex flex-col">
                                  <span className={cn(
                                    "font-bold text-sm",
                                    isCompleted ? "text-zinc-400" : "text-zinc-800"
                                  )}>
                                    {lesson.title}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 {isCompleted && (
                                   <span className="text-[9px] font-bold text-emerald-600 uppercase">Complete</span>
                                 )}
                                 <Play
                                   size={12}
                                   className="text-zinc-300 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                 />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
