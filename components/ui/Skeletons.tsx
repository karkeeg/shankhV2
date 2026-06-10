"use client";

import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";

// ─── Shared pulse block ────────────────────────────────────────────────────────
function Pulse({ className }: { className: string }) {
  return <div className={`bg-zinc-100 animate-pulse rounded-lg ${className}`} />;
}

// ─── Admin Profession Card ─────────────────────────────────────────────────────
// Matches the card in /admin/professions — icon, order badge, name, desc, footer
export function ProfessionAdminCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[220px] animate-pulse">
      <div>
        <div className="flex items-start justify-between gap-4">
          <Pulse className="w-12 h-12 rounded-2xl" />
        </div>
        <div className="mt-4 space-y-2.5">
          <Pulse className="h-4 w-14 rounded-full" />
          <Pulse className="h-5 w-44" />
          <Pulse className="h-3 w-full" />
          <Pulse className="h-3 w-4/5" />
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
        <Pulse className="h-3 w-28 rounded-full" />
        <Pulse className="h-7 w-24 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Skill Profession Card ─────────────────────────────────────────────────────
// Matches the ProfessionCard in /skill — name, desc, progress bar, CTA
export function SkillProfessionCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm animate-pulse flex flex-col h-full">
      <div className="px-5 pt-5 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Pulse className="h-5 w-48" />
            <Pulse className="h-3 w-64" />
          </div>
          <Pulse className="h-7 w-20 rounded-xl shrink-0" />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Pulse className="flex-1 h-1.5 rounded-full" />
          <Pulse className="h-3 w-16 rounded-full" />
        </div>
      </div>
      <div className="px-5 pb-5 mt-auto">
        <Pulse className="h-11 w-full rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Case Simulation Card ──────────────────────────────────────────────────────
// Matches the case card in /skill — title, difficulty badge, desc, meta, CTA
export function CaseSimulationCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-5 flex flex-col gap-3 shadow-sm animate-pulse h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <Pulse className="h-3 w-24 rounded-full" />
          <Pulse className="h-5 w-4/5" />
        </div>
        <Pulse className="h-6 w-14 rounded-lg shrink-0" />
      </div>
      <Pulse className="h-3 w-full" />
      <Pulse className="h-3 w-3/5" />
      <div className="flex items-center gap-3">
        <Pulse className="h-3 w-20 rounded-full" />
        <Pulse className="h-3 w-24 rounded-full" />
      </div>
      <Pulse className="h-9 w-full rounded-2xl mt-auto" />
    </div>
  );
}

// ─── Dashboard Full-page Skeleton ─────────────────────────────────────────────
// Mirrors the complete dashboard layout inside MainLayout
export function DashboardSkeleton() {
  return (
    <MainLayout>
      <div className="p-6 max-w-full mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <Pulse className="h-8 w-28 rounded-full" />
          <div className="flex items-center gap-3">
            <Pulse className="h-10 w-72 rounded-full" />
            <Pulse className="w-9 h-9 rounded-xl" />
          </div>
        </header>

        {/* ResumeLessonCard */}
        <div className="bg-[#01696F]/10 rounded-2xl p-6 flex items-center justify-between animate-pulse">
          <div className="space-y-2.5">
            <Pulse className="h-7 w-56" />
            <Pulse className="h-4 w-72" />
          </div>
          <Pulse className="h-10 w-36 rounded-xl ml-4 shrink-0" />
        </div>

        {/* ProgressOverview — 3 cards */}
        <section className="space-y-3">
          <Pulse className="h-5 w-36 rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="space-y-1.5">
                  <Pulse className="h-4 w-28" />
                  <Pulse className="h-3 w-36" />
                </div>
                <div className="flex items-center gap-4">
                  <Pulse className="flex-1 h-2 rounded-sm" />
                  <Pulse className="h-6 w-10" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LearningPathOverview + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 space-y-6 animate-pulse">
            <div className="space-y-2.5">
              <Pulse className="h-6 w-4/5" />
              <Pulse className="h-6 w-3/5" />
              <Pulse className="h-4 w-full mt-3" />
              <Pulse className="h-4 w-4/5" />
            </div>
            <div className="grid grid-cols-3 gap-6 p-5 border border-zinc-200 rounded-xl">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2 text-center">
                  <Pulse className="h-3 w-16 rounded-full mx-auto" />
                  <Pulse className="h-8 w-14 mx-auto" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 animate-pulse">
            <Pulse className="w-full h-full min-h-[160px] rounded-xl" />
          </div>
        </div>

        {/* CategoriesSection — 3 profession cards */}
        <section className="space-y-6 pb-12">
          <div className="space-y-2 animate-pulse">
            <Pulse className="h-5 w-44 rounded-full" />
            <Pulse className="h-3 w-80 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-3xl p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <Pulse className="w-10 h-10 rounded-2xl shrink-0" />
                  <div className="space-y-1.5">
                    <Pulse className="h-4 w-32" />
                    <Pulse className="h-3 w-20" />
                  </div>
                </div>
                <Pulse className="h-3 w-full" />
                <Pulse className="h-3 w-4/5" />
                <Pulse className="h-2 w-full rounded-full" />
                <Pulse className="h-9 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
