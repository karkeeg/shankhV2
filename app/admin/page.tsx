"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { api, adminApi } from "@/lib/api";
import { StatCard } from "@/components/admin/ui";
import { Users, Briefcase, BookOpen, ArrowRight, Layers, FileText } from "lucide-react";

// Operation cards shown under the stats grid.
const OPERATIONS = [
  {
    href: "/admin/professions",
    icon: Briefcase,
    accent: "bg-[#E6F0F1] text-[#01696F]",
    arrow: "text-[#01696F]",
    title: "Profession & Skill Topic Manager",
    desc: "Create corporate professions (e.g. Chartered Accountant) and assign custom skill topics to them. Bypasses standard learning subtopics.",
  },
  {
    href: "/admin/learning",
    icon: BookOpen,
    accent: "bg-indigo-50 text-indigo-600",
    arrow: "text-indigo-600",
    title: "Learning Pathway Manager",
    desc: "Manage modules, topics, subtopics, and lessons for the primary student learning paths. Reorders and organizes standard hierarchy.",
  },
  {
    href: "/admin/cases",
    icon: FileText,
    accent: "bg-teal-50 text-[#01696F]",
    arrow: "text-[#01696F]",
    title: "Case Simulations",
    desc: "Create and manage case simulations with reading material and manual test activities for the Skill Building section.",
  },
];

interface TreeModule {
  topics: { subtopics: { lessons: unknown[] }[] }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ professions: 0, modules: 0, lessons: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.professions<unknown[]>().catch(() => []),
      api.get<unknown[]>("/api/v1/content/modules").catch(() => []),
      adminApi.learningTree<TreeModule[]>().catch(() => []),
    ])
      .then(([professions, modules, tree]) => {
        const lessons = (tree ?? []).reduce(
          (sum, m) => sum + m.topics.reduce((ts, t) => ts + t.subtopics.reduce((ss, s) => ss + s.lessons.length, 0), 0),
          0,
        );
        setStats({ professions: professions?.length ?? 0, modules: modules?.length ?? 0, lessons });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-y-auto p-8 gap-8 animate-fade-in">
        {/* Header */}
        <header className="flex flex-col gap-1 border-b border-[#01696F]/10 pb-5 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">Control Center</span>
          <h1 className="text-3xl font-extrabold text-[#01696F] tracking-tight">Admin Workspace</h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Manage curriculum paths, profession tags, and custom skill topics from one unified dashboard.
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
          <StatCard label="Professions" value={stats.professions} icon={Briefcase} loading={loading} />
          <StatCard label="Modules" value={stats.modules} icon={Layers} accent="bg-amber-50 text-amber-600" loading={loading} />
          <StatCard label="Total Lessons" value={stats.lessons} icon={BookOpen} accent="bg-indigo-50 text-indigo-600" loading={loading} />
          <StatCard label="Users" value="—" icon={Users} accent="bg-rose-50 text-rose-600" />
        </div>

        {/* Operations */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight">Workspace Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {OPERATIONS.map((op) => (
              <div
                key={op.href}
                onClick={() => router.push(op.href)}
                className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#01696F]/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px]"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-4 rounded-2xl ${op.accent}`}>
                    <op.icon size={24} />
                  </div>
                  <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={16} className={op.arrow} />
                  </div>
                </div>
                <div className="space-y-1 mt-4">
                  <h3 className="text-base font-extrabold text-zinc-900 leading-snug">{op.title}</h3>
                  <p className="text-xs text-zinc-500 font-medium">{op.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
