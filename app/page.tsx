"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronRight,
  BookOpen,
  Sparkles,
  Search,
  Bell,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { MainLayout } from "@/components/layout/MainLayout";
import { BackendStudyPlanTree } from "@/lib/backend-content";

// Heatmap Placeholder Component
const Heatmap = () => {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const weeks = 5;
  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
          <ChevronRight className="rotate-180" size={16} />
        </button>
        <span className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Jan 2022</span>
        <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {days.map((day) => (
          <span key={day} className="text-[10px] font-bold text-zinc-400">{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 flex-1">
        {Array.from({ length: 35 }).map((_, i) => {
          const isActive = [3, 10, 11, 12, 13, 14, 17, 18].includes(i);
          const isToday = i === 18;
          return (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-full flex items-center justify-center transition-all",
                isActive ? "bg-[#01696F] text-white" : "bg-zinc-50 hover:bg-zinc-100",
                isToday && "ring-2 ring-[#01696F] ring-offset-2"
              )}
            >
              {isActive && (
                <div className="w-1.5 h-1.5 bg-white rounded-full opacity-60" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { completedLessons } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const token = useAuthStore((state) => state.token);
  const [tree, setTree] = useState<BackendStudyPlanTree | null>(null);
  const [progressData, setProgressData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!mounted || !token) return;

      try {
        const headers = {
          'Authorization': `Bearer ${token}`
        };

        const [treeRes, progressRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/study-plan-tree`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/progress`, { headers })
        ]);

        const treeJson = await treeRes.json();
        const progressJson = await progressRes.json();

        if (treeJson.data) setTree(treeJson.data);
        if (progressJson.data) setProgressData(progressJson.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mounted, token]);

  const modules = tree?.modules || [];
  const nextModule = modules.find(m => {
    const activities = m.topics.flatMap(t => t.levels.flatMap(l => l.activities));
    return activities.some(a => !completedLessons[a.slug]?.completed);
  }) || modules[0];

  const allActivities = modules.flatMap(m => m.topics.flatMap(t => t.levels.flatMap(l => l.activities)));
  const completedCount = allActivities.filter(a => completedLessons[a.slug]?.completed).length;
  const progressPercentage = allActivities.length > 0 ? Math.round((completedCount / allActivities.length) * 100) : 0;

  if (!mounted || loading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#01696F] border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const AiSidebar = isAiOpen ? (
    <aside className="w-96 h-full border-l border-zinc-100 bg-[#F0EDE7] flex flex-col shrink-0">
      <div className="p-5 space-y-5 h-full overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between bg-[#01696F] text-white p-3.5 rounded-full shadow-2xl shadow-[#01696F]/20">
          <div className="flex items-center gap-3 pl-3">
            <Sparkles size={20} />
            <span className="font-bold text-base">AI Assistant</span>
          </div>
          <button 
            onClick={() => setIsAiOpen(false)}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Next best action */}
          <div className="bg-white border border-zinc-100 rounded-[2rem] p-8 space-y-6 shadow-sm">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-[#1a1a1a]">Next best action</h4>
              <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                Your strongest return today is finishing one finance quant module and one strategy simulation.
              </p>
            </div>
            <div className="space-y-3">
              <div className="bg-zinc-50 rounded-2xl p-4 flex items-center justify-between group hover:bg-[#E6F0F1] transition-colors cursor-pointer border border-transparent hover:border-[#01696F]/10">
                <span className="text-[11px] font-bold text-zinc-600 group-hover:text-[#01696F]">LBO debt paydown check</span>
                <span className="text-[11px] font-bold text-zinc-400 group-hover:text-[#01696F]/60">12 min</span>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-4 flex items-center justify-between group hover:bg-[#E6F0F1] transition-colors cursor-pointer border border-transparent hover:border-[#01696F]/10">
                <span className="text-[11px] font-bold text-zinc-600 group-hover:text-[#01696F]">Growth case synthesis</span>
                <span className="text-[11px] font-bold text-zinc-400 group-hover:text-[#01696F]/60">12 min</span>
              </div>
            </div>
          </div>

          {/* AI Coach Insight */}
          <div className="bg-white border border-zinc-100 rounded-[2rem] p-8 space-y-4 shadow-sm">
            <h4 className="text-sm font-bold text-[#1a1a1a]">AI Coach Insight</h4>
            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
              You structure problems well, but you lose marks when numbers are not translated into decision thresholds. Keep conclusions tighter.
            </p>
          </div>

          {/* Weekly momentum */}
          <div className="bg-white border border-zinc-100 rounded-[2rem] p-8 space-y-5 shadow-sm">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-[#1a1a1a]">Weekly momentum</h4>
              <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                Your strongest return today is finishing one finance quant module and one strategy simulation.
              </p>
            </div>
            <button className="w-full bg-[#E6F0F1] text-[#01696F] py-4 rounded-2xl font-bold text-xs hover:opacity-90 transition-opacity shadow-sm">
              5 day streak
            </button>
          </div>
        </div>
      </div>
    </aside>
  ) : null;

  return (
    <MainLayout rightSidebar={AiSidebar}>
      <div className="p-10 max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-8">
          <h2 className="text-2xl font-bold text-[#01696F]">Dashboard</h2>
          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#01696F] transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search topics, cases and formulas"
              className="w-full bg-white border border-zinc-200 rounded-full py-3.5 pl-14 pr-6 outline-none focus:ring-4 focus:ring-[#01696F]/5 focus:border-[#01696F] transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 flex items-center justify-center bg-white border border-zinc-200 rounded-2xl hover:bg-zinc-50 transition-colors relative">
              <Bell size={22} className="text-zinc-600" />
              <div className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            {!isAiOpen && (
              <button 
                onClick={() => setIsAiOpen(true)}
                className="flex items-center gap-2.5 bg-[#01696F] text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-[#01696F]/20"
              >
                <Sparkles size={18} />
                AI Assistant
              </button>
            )}
          </div>
        </header>

        {/* Hero & Sub-Hero */}
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-[#01696F] rounded-[2.5rem] p-12 text-white relative overflow-hidden group shadow-2xl shadow-[#01696F]/10">
            <div className="absolute top-0 right-0 p-16 opacity-10 translate-x-1/4 -translate-y-1/4 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
              <BookOpen size={280} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight">Resume your lesson</h2>
                <div className="flex items-center gap-4 text-white/80">
                  <span className="text-lg font-bold">Modeling Fountains</span>
                  <div className="w-px h-5 bg-white/30" />
                  <span className="text-base font-medium">Financial Statement Fundamentals</span>
                </div>
              </div>
              <Link
                href="/study-plan"
                className="bg-white text-[#01696F] px-10 py-5 rounded-[1.5rem] font-bold text-base hover:shadow-2xl hover:shadow-black/20 transition-all active:scale-95"
              >
                Resume Learning
              </Link>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-lg shadow-black/5">
            <div className="absolute top-8 right-10 bg-[#E6F0F1] text-[#01696F] px-6 py-2 rounded-full text-xs font-bold">
              Sunday Session <span className="opacity-60 ml-1">42 mins available</span>
            </div>
            <div className="space-y-3 max-w-3xl">
              <h2 className="text-3xl font-bold text-[#1a1a1a] tracking-tight leading-tight">
                Build recruiter-grade judgement, not just notes.
              </h2>
              <p className="text-zinc-500 text-base leading-relaxed font-medium">
                Simulated learning across finance, strategy, and operations for consulting, private equity and investing banking readiness.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <section className="space-y-6">
          <h3 className="text-lg font-bold text-[#1a1a1a]">Progress Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Finance | Sheets", module: "Modeling Fountains", progress: 68 },
              { title: "Strategy | MCQ", module: "Modeling Fountains", progress: 68 },
              { title: "Operations | Canvas", module: "Modeling Fountains", progress: 68 },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-zinc-100 rounded-[2rem] p-8 space-y-6 shadow-md shadow-black/5">
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-[#1a1a1a]">{item.title}</h4>
                  <p className="text-sm text-zinc-400 font-medium">{item.module}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-end">
                    <span className="text-sm font-bold text-[#1a1a1a]">{item.progress}%</span>
                  </div>
                  <div className="h-2 bg-zinc-50 rounded-full overflow-hidden">
                    <div className="h-full bg-[#01696F] rounded-full" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Learning Path & Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-[3rem] p-12 space-y-10 shadow-xl shadow-black/5">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
                Your learning path is organized by function, topic, and role outcome.
              </h3>
              <p className="text-zinc-500 text-base leading-relaxed font-medium">
                Move from topic depth into simulations and then into review loops. The structure is built to improve concept absorption and decision quality under real business pressure.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-10 p-10 border border-zinc-50 rounded-[2rem] bg-zinc-50/30">
              <div className="space-y-2 text-center border-r border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Mastery Score</p>
                <p className="text-4xl font-bold text-[#1a1a1a]">{progressPercentage}%</p>
              </div>
              <div className="space-y-2 text-center border-r border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Streak</p>
                <p className="text-4xl font-bold text-[#1a1a1a]">9 days</p>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Simulations</p>
                <p className="text-4xl font-bold text-[#1a1a1a]">18</p>
              </div>
            </div>
          </div>

          <div className="h-full min-h-[400px]">
            <Heatmap />
          </div>
        </div>

        {/* Categories Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-20">
          {[
            { title: "Finance | Sheets", desc: "Modeling fluency and investor style analysis." },
            { title: "Strategy | MCQ", desc: "Modeling fluency and investor style analysis." },
            { title: "Operations | Canvas", desc: "Modeling fluency and investor style analysis." },
          ].map((cat, i) => (
            <div key={i} className="bg-white border border-zinc-100 rounded-[2.5rem] p-10 space-y-8 group hover:border-[#01696F]/20 transition-all hover:shadow-2xl hover:shadow-[#01696F]/5">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-[#1a1a1a]">{cat.title}</h3>
                <p className="text-zinc-500 text-base leading-relaxed font-medium">{cat.desc}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {["2 Statement", "Valuation", "LBO"].map((tag) => (
                  <span key={tag} className="bg-zinc-50 text-zinc-500 px-4 py-2 rounded-xl text-xs font-bold group-hover:bg-[#E6F0F1] group-hover:text-[#01696F] transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
