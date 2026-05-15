"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BookOpen, ChevronRight, Target, Zap, Award } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BackendStudyPlanTree, BackendTreeModule } from "@/lib/backend-content";
import { useAppStore } from "@/lib/store";

export default function LearningHub() {
  const [tree, setTree] = useState<BackendStudyPlanTree | null>(null);
  const [loading, setLoading] = useState(true);
  const { completedLessons } = useAppStore();

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/study-plan-tree`);
        const json = await res.json();
        if (json.data) setTree(json.data);
      } catch (err) {
        console.error("Failed to fetch learning tree:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  const modules = tree?.modules || [];
  
  const sections = [
    {
      id: "foundation",
      title: "Foundations",
      subtitle: "Financial Statement Mechanics",
      modules: modules.filter(m => m.stage === "foundation"),
    },
    {
      id: "applied",
      title: "Applied Analysis",
      subtitle: "Commercial Modelling & Pricing",
      modules: modules.filter(m => m.stage === "applied"),
    },
    {
      id: "integrated",
      title: "Integrated Cases",
      subtitle: "Strategy & Due Diligence",
      modules: modules.filter(m => m.stage === "integrated"),
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <header className="px-8 py-10 max-w-7xl mx-auto w-full">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Learning Hub</h1>
          <p className="text-sm text-zinc-500 font-medium">Master finance through structured case-first paths.</p>
        </div>
      </header>

      <div className="px-8 pb-20 max-w-7xl mx-auto w-full space-y-16">
        {sections.map((section, sIdx) => (
          <section key={section.id} className="space-y-8">
            <div className="flex items-end justify-between border-b border-zinc-100 pb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-[#1a1a1a]">{section.title}</h2>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{section.subtitle}</p>
              </div>
              <div className="text-[10px] font-bold text-[#01696F] bg-[#E6F0F1] px-4 py-1.5 rounded-full">
                {section.modules.length} MODULES
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {section.modules.map((module, mIdx) => {
                const activities = module.topics.flatMap(t => t.levels.flatMap(l => l.activities));
                const practiceActivities = activities.filter(a => a.type !== 'lesson');
                const completedCount = activities.filter(a => completedLessons[a.slug]?.completed).length;
                const progress = activities.length > 0 ? (completedCount / activities.length) * 100 : 0;
                const isComplete = progress === 100 && activities.length > 0;

                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (sIdx * 0.1) + (mIdx * 0.05) }}
                  >
                    <div className="group block bg-white border border-zinc-100 rounded-[2rem] p-8 transition-all hover:shadow-xl hover:shadow-[#01696F]/5 hover:border-[#01696F]/20 relative overflow-hidden h-full flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors border",
                          isComplete ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-[#E6F0F1] border-transparent text-[#01696F]"
                        )}>
                          {isComplete ? <Award size={24} fill="currentColor" /> : <BookOpen size={24} />}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {progress > 0 && (
                            <span className={cn(
                              "text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                              progress >= 85 ? "bg-indigo-50 text-indigo-700" : progress >= 70 ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-500"
                            )}>
                              {progress >= 85 ? "Distinction" : progress >= 70 ? "Pass" : "In Progress"}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                            {practiceActivities.length} Practices
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 flex-1">
                        <h3 className="font-bold text-xl text-[#1a1a1a] group-hover:text-[#01696F] transition-colors">
                          {module.title}
                        </h3>
                        <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed font-medium">
                          {module.description || "Master the core principles of this financial module through interactive cases."}
                        </p>
                      </div>

                      <div className="mt-8 pt-8 border-t border-zinc-50 space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            <span>Progress</span>
                            <span className={cn(isComplete ? "text-emerald-600" : "text-[#1a1a1a]")}>
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className={cn(
                                "h-full transition-all duration-1000",
                                isComplete ? "bg-emerald-500" : "bg-[#01696F]"
                              )}
                            />
                          </div>
                        </div>

                        <Link
                          href={`/study-plan?module=${module.slug}`}
                          className={cn(
                            "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-black/5",
                            isComplete 
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100" 
                              : "bg-[#01696F] text-white hover:opacity-90 shadow-[#01696F]/10"
                          )}
                        >
                          {isComplete ? "Review Module" : "Start Module"}
                          <ChevronRight size={18} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </MainLayout>
  );
}
