"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Play, BookOpen, Clock } from 'lucide-react';
import useSkillData from '@/hooks/useSkillData';
import { MainLayout } from '@/components/layout/MainLayout';
import SkillSectionCard from '@/components/skill/SkillSectionCard';
import { SkillSectionResponse } from '@/hooks/useSkillData';

export default function SkillBuildingHome() {
  const router = useRouter();
  // CHANGED: destructure getRecentlyActiveTopic and startSkillTopic (new) alongside existing helpers
  const { getSkillSections, getRecentlyActiveTopic, startSkillTopic } = useSkillData();

  const [sections,       setSections]       = useState<SkillSectionResponse[]>([]);
  const [recentlyActive, setRecentlyActive] = useState<any>(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [loading,        setLoading]        = useState(true);
  const [actionLoading,  setActionLoading]  = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSkillSections(),
      // CHANGED: use getRecentlyActiveTopic instead of getRecentlyActive
      getRecentlyActiveTopic().catch(() => null),
    ])
      .then(([sectionsData, recentData]) => {
        setSections(sectionsData);
        setRecentlyActive(recentData);
      })
      .catch((e) => console.error('Failed to load skill sections', e))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResumeRecent = async () => {
    if (!recentlyActive || actionLoading) return;
    setActionLoading(true);
    try {
      // CHANGED: call startSkillTopic with topicId + activityType
      const result = await startSkillTopic(recentlyActive.topicId, recentlyActive.activityType);
      if (result?.navigateTo) {
        router.push(result.navigateTo);
      }
    } catch (err) {
      console.error('Failed to resume recently active topic:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSections = searchQuery.trim()
    ? sections.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.tab_label ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sections;

  if (loading && sections.length === 0) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-[#01696F]">
          <Loader2 className="w-10 h-10 animate-spin" />
          <span className="text-sm font-semibold">Loading skill sections…</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-hidden p-6 gap-6 animate-fade-in bg-gradient-to-tr from-[#fcfbf9] to-[#f4f2ee]">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 border-b border-[#01696F]/10 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#01696F] tracking-tight">Skill Building</h2>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Practice targeted exercises to master job-specific skills and build a portfolio of credentials.
            </p>
          </div>
          <div className="relative w-full sm:w-[340px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search skill sections"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#01696F]/20 rounded-full py-2.5 pl-11 pr-4 outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 transition-all text-xs font-semibold placeholder:text-zinc-400 shadow-sm"
            />
          </div>
        </header>

        {/* Scrollable container */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6">

          {/* ── Resume banner (CHANGED: topic-based data shape) ─────────── */}
          {recentlyActive && (
            <div className="relative overflow-hidden bg-gradient-to-r from-[#01696F] to-[#0d878f] rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 transition-all hover:shadow-lg">
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/[0.04] rounded-full filter blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />

              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-inner">
                  <BookOpen className="w-6 h-6 text-[#A0E2E6]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-white/70">
                    Welcome Back — Recently Active
                  </span>
                  {/* CHANGED: topicName replaces bundle_name */}
                  <h3 className="text-base font-bold tracking-tight mt-0.5">
                    {recentlyActive.topicName}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium">
                      <Clock size={12} className="text-white/60" />
                      {/* CHANGED: lessonsCompleted / lessonsTotal */}
                      <span>{recentlyActive.lessonsCompleted} of {recentlyActive.lessonsTotal} lessons done</span>
                    </div>
                    {/* CHANGED: nextLesson.lessonName replaces next_item.label */}
                    {recentlyActive.nextLesson && (
                      <span className="text-xs bg-[#A0E2E6]/20 border border-[#A0E2E6]/30 text-[#A0E2E6] px-2 py-0.5 rounded font-bold">
                        Up next: {recentlyActive.nextLesson.lessonName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative z-10 shrink-0 self-stretch sm:self-center flex items-center">
                <button
                  disabled={actionLoading}
                  onClick={handleResumeRecent}
                  className="w-full sm:w-auto bg-white text-[#01696F] font-bold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-zinc-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Play size={12} fill="currentColor" />
                  {actionLoading ? 'Loading…' : 'Resume Practice'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold">Updating dashboard…</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              {filteredSections.map((section) => (
                <SkillSectionCard
                  key={section.id}
                  section={section}
                  onClick={() => router.push(`/skill-building/${section.slug}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}