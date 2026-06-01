"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Users,
  Briefcase,
  BookOpen,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  Settings,
  Layers,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export default function AdminDashboard() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [stats, setStats] = useState({
    professions: 0,
    topics: 0,
    lessons: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //imperative headers — no undefined allowed
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${API}/api/v1/admin/professions`, { headers })
      .then((r) => r.json())
      .then(async (res) => {
        const professions = res.data || [];
        setStats((prev) => ({ ...prev, professions: professions.length }));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard stats", err);
        setLoading(false);
      });
  }, [token]);

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-y-auto p-8 gap-8 animate-fade-in bg-gradient-to-br from-[#fcfcfb] to-[#f5f3ee]">

        {/* Header */}
        <header className="flex flex-col gap-1 border-b border-[#01696F]/10 pb-5 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">
            Control Center
          </span>
          <h1 className="text-3xl font-extrabold text-[#01696F] tracking-tight">
            Admin Workspace
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Manage curriculum paths, profession tags, and custom skill topics from one unified dashboard.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Professions
              </p>
              <h3 className="text-2xl font-black text-zinc-800 tracking-tight">
                {loading ? "..." : stats.professions}
              </h3>
            </div>
            <div className="p-3 bg-[#E6F0F1] rounded-xl text-[#01696F] group-hover:scale-110 transition-transform">
              <Briefcase size={20} />
            </div>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Skill Modules
              </p>
              <h3 className="text-2xl font-black text-zinc-800 tracking-tight">
                4 Sections
              </h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
              <Layers size={20} />
            </div>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Active Paths
              </p>
              <h3 className="text-2xl font-black text-zinc-800 tracking-tight">
                2 Learning
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
              <BookOpen size={20} />
            </div>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Users
              </p>
              <h3 className="text-2xl font-black text-zinc-800 tracking-tight">
                12 Learner
              </h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600 group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
          </div>
        </div>

        {/* Section divider */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight">
            Workspace Operations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Professions Management Card */}
            <div
              onClick={() => router.push("/admin/professions")}
              className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#01696F]/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex items-start justify-between">
                <div className="p-4 bg-[#E6F0F1] text-[#01696F] rounded-2xl">
                  <Briefcase size={24} />
                </div>
                <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={16} className="text-[#01696F]" />
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <h3 className="text-base font-extrabold text-zinc-900 leading-snug">
                  Profession & Skill Topic Manager
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  Create corporate professions (e.g. Chartered Accountant) and assign custom skill topics to them. Bypasses standard learning subtopics.
                </p>
              </div>
            </div>

            {/* Content Importer Card */}
            <div
              onClick={() => router.push("/admin/professions")}
              className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#01696F]/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex items-start justify-between">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                  <FolderOpen size={24} />
                </div>
                <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={16} className="text-[#A67C00]" />
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <h3 className="text-base font-extrabold text-zinc-900 leading-snug">
                  Curriculum Importer
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  Fetch and clone existing MCQ, Canvas, or Quantus spreadsheet lessons from standard curriculum into corporate skill topics with a single click.
                </p>
              </div>
            </div>

            {/* Learning Pathways Card */}
            <div
              onClick={() => router.push("/admin/learning")}
              className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#01696F]/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex items-start justify-between">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <BookOpen size={24} />
                </div>
                <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={16} className="text-indigo-600" />
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <h3 className="text-base font-extrabold text-zinc-900 leading-snug">
                  Learning Pathway Manager
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  Manage modules, topics, subtopics, and lessons for the primary student learning paths. Reorders and organizes standard hierarchy.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </MainLayout>
  );
}
