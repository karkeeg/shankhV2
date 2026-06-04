import React from "react";
import Link from "next/link";
import {
  Calculator,
  BookOpen,
  Target,
  Briefcase,
  TrendingUp,
  Settings,
  Users,
  BarChart3,
  Award,
  ArrowRight,
  Sparkles,
  Clock,
  ChevronRight,
} from "lucide-react";

interface ProfessionProgress {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconKey: string | null;
  totalActivities: number;
  completedActivities: number;
  progressPct: number;
  hasStarted: boolean;
}

interface CategoriesSectionProps {
  professions?: ProfessionProgress[];
}

const getIcon = (iconKey: string | null) => {
  switch (iconKey) {
    case "calculator":   return <Calculator className="w-5 h-5 text-[#01696F]" />;
    case "ledger":       return <BookOpen className="w-5 h-5 text-[#01696F]" />;
    case "trending-up":  return <TrendingUp className="w-5 h-5 text-[#01696F]" />;
    case "briefcase":
    case "Briefcase":    return <Briefcase className="w-5 h-5 text-[#01696F]" />;
    case "target":       return <Target className="w-5 h-5 text-[#01696F]" />;
    case "settings":     return <Settings className="w-5 h-5 text-[#01696F]" />;
    case "users":        return <Users className="w-5 h-5 text-[#01696F]" />;
    case "bar-chart":    return <BarChart3 className="w-5 h-5 text-[#01696F]" />;
    case "TrendingUp":   return <TrendingUp className="w-5 h-5 text-[#01696F]" />;
    case "Globe":        return <Award className="w-5 h-5 text-[#01696F]" />;
    case "BookOpen":     return <BookOpen className="w-5 h-5 text-[#01696F]" />;
    case "Layers":       return <BarChart3 className="w-5 h-5 text-[#01696F]" />;
    case "Award":        return <Award className="w-5 h-5 text-[#01696F]" />;
    default:             return <Award className="w-5 h-5 text-[#01696F]" />;
  }
};

export const CategoriesSection = ({ professions = [] }: CategoriesSectionProps) => {
  if (professions.length === 0) return null;

  const started   = professions.filter((p) => p.hasStarted);
  const available = professions.filter((p) => !p.hasStarted && p.totalActivities > 0);
  const upcoming  = professions.filter((p) => p.totalActivities === 0);

  return (
    <section className="space-y-10 pb-12">

      {/* ── Active Skill Tracks ─────────────────────────────────────────────── */}
      {started.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#01696F] animate-pulse" />
            <h3 className="text-base font-extrabold text-[#1a1a1a] tracking-tight">
              Active Skill Tracks
            </h3>
            <span className="text-[10px] font-black bg-[#E6F0F1] text-[#01696F] px-2 py-0.5 rounded-full ml-1">
              {started.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {started.map((prof) => (
              <div
                key={prof.id}
                className="bg-white border-2 border-[#01696F]/20 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-[#01696F]/40 transition-all duration-300 flex flex-col justify-between gap-4 group relative overflow-hidden"
              >
                {/* Background glow */}
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#E6F0F1] rounded-full blur-2xl group-hover:bg-[#01696F]/10 transition-colors duration-500 pointer-events-none" />

                {/* Top: icon + name */}
                <div className="flex items-center gap-3 relative z-10">
                  <div className="p-2.5 bg-[#E6F0F1] rounded-2xl border border-[#01696F]/10 shrink-0">
                    {getIcon(prof.iconKey)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-zinc-800 tracking-tight leading-snug group-hover:text-[#01696F] transition-colors truncate">
                      {prof.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider mt-0.5">
                      {prof.completedActivities}/{prof.totalActivities} Activities Done
                    </p>
                  </div>
                </div>

                {/* Description */}
                {prof.description && (
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-2 relative z-10">
                    {prof.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5 relative z-10">
                  <div className="flex justify-between text-[10px] font-black text-zinc-400">
                    <span>Overall Progress</span>
                    <span className="text-[#01696F]">{prof.progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                    <div
                      className="h-full bg-[#01696F] rounded-full transition-all duration-700"
                      style={{ width: `${prof.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* See More CTA */}
                <Link
                  href={`/skill/${prof.slug}`}
                  className="relative z-10 w-full py-2.5 rounded-2xl text-xs font-black text-white bg-[#01696F] hover:bg-[#01696F]/90 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm"
                >
                  See More
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Available Tracks (not yet started) ─────────────────────────────── */}
      {available.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#1a1a1a] tracking-tight">
              {started.length > 0 ? "Explore Other Tracks" : "Professional Skill Building"}
            </h3>
            <p className="text-xs text-zinc-500 font-semibold mt-0.5">
              {started.length > 0
                ? "Start a new professional track to expand your competencies."
                : "Select a profession to practice job-specific MCQ, Canvas drills, and Quantus spreadsheet labs."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {available.map((prof) => (
              <Link
                key={prof.id}
                href={`/skill/${prof.slug}`}
                className="bg-white border border-zinc-200 hover:border-[#01696F]/30 hover:ring-2 hover:ring-[#01696F]/5 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-3">
                  <div className="p-2.5 w-fit bg-zinc-50 group-hover:bg-[#E6F0F1] rounded-2xl border border-zinc-100 group-hover:border-[#01696F]/10 transition-colors">
                    {getIcon(prof.iconKey)}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-zinc-800 tracking-tight group-hover:text-[#01696F] transition-colors leading-snug">
                      {prof.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                      {prof.totalActivities} Activities
                    </p>
                  </div>
                  {prof.description && (
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-2">
                      {prof.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] font-black text-[#01696F]">
                  <span>Start Track</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming Professions (no tests yet) ────────────────────────────── */}
      {upcoming.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-500 tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Coming Soon
            </h3>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">
              These professional tracks are being built — tests will be added soon.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {upcoming.map((prof) => (
              <div
                key={prof.id}
                className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl px-4 py-2.5 opacity-70"
              >
                <div className="p-1.5 bg-white rounded-xl border border-zinc-100 shrink-0">
                  {getIcon(prof.iconKey)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-zinc-600 truncate">{prof.name}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    Tests Coming Soon
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
};
