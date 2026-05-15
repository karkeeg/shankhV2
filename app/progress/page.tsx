"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Award, Zap, Shield, TrendingUp, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";

interface ActivityItem {
  title: string;
  date: string;
  score: number;
  independence: number;
}

interface ProgressData {
  skillRadar: { name: string; value: number }[];
  independenceScore: number;
  recentActivity: ActivityItem[];
}

const SkillRadar = ({ skills }: { skills?: { name: string; value: number }[] }) => {
  if (!skills) return null;
  
  // Simple radar implementation using SVG
  const center = 100;
  const radius = 80;
  const angleStep = (Math.PI * 2) / skills.length;

  const points = skills.map((s, i) => {
    const r = (s.value / 100) * radius;
    const x = center + r * Math.sin(i * angleStep);
    const y = center - r * Math.cos(i * angleStep);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Background circles */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((r) => (
          <circle
            key={r}
            cx={center}
            cy={center}
            r={radius * r}
            fill="none"
            stroke="#f4f4f5"
            strokeWidth="1"
          />
        ))}
        {/* Axis lines */}
        {skills.map((_, i) => {
          const x = center + radius * Math.sin(i * angleStep);
          const y = center - radius * Math.cos(i * angleStep);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#f4f4f5"
              strokeWidth="1"
            />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={points}
          fill="rgba(1, 105, 111, 0.2)"
          stroke="#01696F"
          strokeWidth="2"
          className="transition-all duration-500"
        />
        {/* Labels */}
        {skills.map((s, i) => {
          const labelRadius = radius + 20;
          const x = center + labelRadius * Math.sin(i * angleStep);
          const y = center - labelRadius * Math.cos(i * angleStep);
          return (
            <text
              key={i}
              x={x}
              y={y}
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
              fill="#71717a"
              className="uppercase tracking-tighter"
            >
              {s.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!mounted || !token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/progress`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.data) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [mounted, token]);

  if (!mounted || loading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const skillRadar = data?.skillRadar;
  const independenceScore = data?.independenceScore ?? 0;
  const recentActivity = data?.recentActivity || [];

  return (
    <MainLayout>
      <header className="px-8 py-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Your Progress</h1>
            <p className="text-sm text-zinc-500 font-medium">Tracking your journey to financial mastery.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#01696F] text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-[#01696F]/10">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Award size={18} className="text-yellow-400" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest">Level 4 Analyst</span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 pb-20 max-w-7xl mx-auto w-full space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Skill Radar */}
          <div className="lg:col-span-2 space-y-6 bg-white rounded-[2.5rem] border border-zinc-100 p-10 shadow-xl shadow-[#01696F]/5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Skill Mastery Map</h3>
              <span className="text-xs font-bold text-[#01696F] bg-[#E6F0F1] px-4 py-1.5 rounded-full flex items-center gap-2">
                <TrendingUp size={14} /> +12% this week
              </span>
            </div>
            <SkillRadar skills={skillRadar} />
          </div>

          {/* Independence Score Card */}
          <div className="bg-[#01696F] rounded-[2.5rem] p-10 text-white relative overflow-hidden group flex flex-col justify-between shadow-xl shadow-[#01696F]/10">
            <div className="absolute top-0 right-0 p-12 opacity-10 translate-x-1/4 -translate-y-1/4 rotate-12 group-hover:rotate-0 transition-transform duration-700">
              <Shield size={200} />
            </div>
            <div className="relative space-y-8">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <Shield size={28} className="text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold">{independenceScore}%</div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/60">Independence Score</div>
              </div>
              <p className="text-sm text-white/80 leading-relaxed font-medium">
                You are relying less on hints this week. Maintaining this will boost your final certification rank.
              </p>
            </div>
            <button className="relative z-10 w-full bg-white text-[#01696F] py-4 rounded-2xl text-sm font-bold transition-all hover:shadow-xl active:scale-[0.98] mt-8">
              View Hint Analytics
            </button>
          </div>
        </div>

        {/* Module History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Recent Performance</h3>
            <button className="text-xs font-bold text-zinc-400 hover:text-[#01696F] transition-colors">View All History</button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {recentActivity.map((item: ActivityItem, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-zinc-100 rounded-3xl p-6 flex items-center justify-between group hover:border-[#01696F]/20 hover:shadow-xl hover:shadow-[#01696F]/5 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-[#E6F0F1] rounded-2xl flex items-center justify-center text-[#01696F] group-hover:bg-[#01696F] group-hover:text-white transition-all">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1a1a1a] group-hover:text-[#01696F] transition-colors">{item.title}</h4>
                    <p className="text-xs text-zinc-400 font-medium">{item.date ? new Date(item.date).toLocaleDateString() : "Recently"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Score</div>
                    <div className="font-bold text-[#1a1a1a]">{item.score}%</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Indep.</div>
                    <div className="font-bold text-[#1a1a1a]">{item.independence}%</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-[#E6F0F1] transition-colors">
                    <ChevronRight size={20} className="text-zinc-400 group-hover:text-[#01696F]" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
