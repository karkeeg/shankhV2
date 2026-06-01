"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Bell } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import useSkillData, { SkillSectionResponse } from '@/hooks/useSkillData';
import SkillSectionCard from '@/components/skill/SkillSectionCard';
import { MainLayout } from '@/components/layout/MainLayout';

export default function SkillHome() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { getSkillSections } = useSkillData();
  const [sections, setSections] = useState<SkillSectionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = useCallback((): HeadersInit => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  useEffect(() => {
    setLoading(true);
    getSkillSections(authHeaders())
      .then((data) => setSections(data))
      .catch((e) => console.error('Failed to load skill sections', e))
      .finally(() => setLoading(false));
  }, [authHeaders, getSkillSections]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-[#01696F]">
          <Loader2 className="w-10 h-10 animate-spin" />
          <span className="text-sm font-semibold">Loading skill sections...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-hidden p-6 gap-6 animate-fade-in">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 shrink-0">
          <h2 className="text-2xl font-extrabold text-[#01696F] tracking-tight">Skill Building</h2>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="relative w-[340px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#01696F]" size={16} />
              <input
                type="text"
                placeholder="Search skill sections"
                className="w-full bg-white border border-[#01696F]/30 rounded-full py-2.5 pl-11 pr-4 outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 transition-all text-xs font-semibold placeholder:text-zinc-400 shadow-sm"
              />
            </div>
            <button className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-colors relative shadow-sm active:scale-95">
              <Bell size={18} className="text-[#01696F]" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
            </button>
          </div>
        </header>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
          {sections.map((section) => (
            <SkillSectionCard
              key={section.id}
              section={section}
              onClick={() => router.push(`/skill/sections/${section.slug}`)}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
