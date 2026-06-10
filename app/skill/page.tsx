"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Bell, ChevronDown, ChevronUp,
  Play, RotateCcw, CheckCircle2, Clock, Hourglass,
  Loader2, Eye,
} from "lucide-react";
import { CaseSimulationCardSkeleton, SkillProfessionCardSkeleton } from "@/components/ui/Skeletons";
import { useAuthStore } from "@/lib/auth-store";
import { skillApi, casesApi } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { CaseStudiesModal } from "@/components/case/CaseStudiesModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profession { id: string; slug: string; name: string; description: string | null; }
interface TypeConfig { activityType: "mcq" | "canvas" | "quantus"; timeLimitMins: number; }
interface UserProgress {
  id: string; activityType: string;
  status: "in_progress" | "completed" | "expired";
  scorePct: number | null; completedItems: number; totalItems: number;
}
interface SkillTest {
  id: string; name: string; description: string | null;
  typeConfigs: TypeConfig[];
  itemCounts: { mcq: number; canvas: number; quantus: number };
  userProgress: UserProgress[];
}
interface SkillTopic { topic: { id: string; name: string; description: string | null }; tests: SkillTest[]; }

// ─── Section → activityType mapping ──────────────────────────────────────────

const SECTION_TO_TYPE: Record<string, string | null> = {
  case_simulations: null,      // show all types
  mcqs: "mcq",
  framework_drills: "canvas",
  quant_lab: "quantus",
};

const SECTION_LABELS: Record<string, string> = {
  case_simulations: "Case Simulations",
  mcqs: "MCQs",
  framework_drills: "Framework Drills",
  quant_lab: "Quant Lab",
};

const TYPE_COLORS: Record<string, string> = {
  mcq: "bg-violet-50 border-violet-200 text-violet-700",
  canvas: "bg-amber-50 border-amber-200 text-amber-700",
  quantus: "bg-sky-50 border-sky-200 text-sky-700",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTestStatus(test: SkillTest): "not_started" | "in_progress" | "completed" {
  if (test.userProgress.length === 0) return "not_started";
  const types = (Object.entries(test.itemCounts) as [string, number][])
    .filter(([, c]) => c > 0).map(([t]) => t);
  const allDone = types.every(t =>
    test.userProgress.some(p => p.activityType === t && (p.status === "completed" || p.status === "expired"))
  );
  return allDone ? "completed" : "in_progress";
}

// Filter-aware status: only looks at the specific activity type being filtered.
// Prevents "Resume" showing for a test where MCQ is in_progress but canvas hasn't started.
function getFilteredStatus(test: SkillTest, filterType: string | null): "not_started" | "in_progress" | "completed" {
  if (!filterType) return getTestStatus(test);
  const prog = test.userProgress.find(p => p.activityType === filterType);
  if (!prog) return "not_started";
  if (prog.status === "completed" || prog.status === "expired") return "completed";
  return "in_progress";
}

function firstAvailableType(test: SkillTest, filterType: string | null): string {
  const order = filterType
    ? [filterType as "mcq" | "canvas" | "quantus"]
    : ["mcq", "canvas", "quantus"] as const;
  for (const t of order) {
    if (test.itemCounts[t] > 0) {
      const prog = test.userProgress.find(p => p.activityType === t);
      if (!prog || prog.status === "in_progress") return t;
    }
  }
  // Fallback: respect filterType if it has items
  if (filterType && (test.itemCounts[filterType as keyof typeof test.itemCounts] ?? 0) > 0) {
    return filterType;
  }
  for (const t of (["mcq", "canvas", "quantus"] as const)) {
    if (test.itemCounts[t] > 0) return t;
  }
  return "mcq";
}

function nextAction(tests: SkillTest[], filterType: string | null): { test: SkillTest; type: string; isResume: boolean } | null {
  for (const test of tests) {
    const inProg = test.userProgress.find(p =>
      p.status === "in_progress" && (!filterType || p.activityType === filterType)
    );
    if (inProg) return { test, type: inProg.activityType, isResume: true };
  }
  for (const test of tests) {
    const hasFilteredItems = !filterType || (test.itemCounts[filterType as keyof typeof test.itemCounts] ?? 0) > 0;
    if (!hasFilteredItems) continue;
    const hasStartedFilterType = filterType
      ? test.userProgress.some(p => p.activityType === filterType)
      : test.userProgress.length > 0;
    if (!hasStartedFilterType) return { test, type: firstAvailableType(test, filterType), isResume: false };
  }
  return null;
}

/** Filter tests by active section — keep tests that have items of the required type */
function filterTestsBySection(tests: SkillTest[], filterType: string | null): SkillTest[] {
  if (!filterType) return tests; // case_simulations = show all
  return tests.filter(t => (t.itemCounts[filterType as keyof typeof t.itemCounts] ?? 0) > 0);
}

// ─── TypePill ─────────────────────────────────────────────────────────────────

function TypePill({ type, count, progress }: { type: string; count: number; progress?: UserProgress }) {
  if (count === 0) return null;
  let icon = null;
  if (progress?.status === "completed") icon = <CheckCircle2 size={9} className="text-emerald-500" />;
  if (progress?.status === "in_progress") icon = <Hourglass size={9} className="text-amber-500" />;
  if (progress?.status === "expired") icon = <Clock size={9} className="text-rose-400" />;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
      TYPE_COLORS[type] ?? "bg-zinc-50 border-zinc-200 text-zinc-500"
    )}>
      {icon}{type.toUpperCase()} · {count}
    </span>
  );
}

// ─── TestRow ──────────────────────────────────────────────────────────────────

function TestRow({ test, filterType, onStart, onViewResult }: {
  test: SkillTest;
  filterType: string | null;
  onStart: (id: string, type: string) => void;
  onViewResult: (id: string, type: string) => void;
}) {
  const status = getFilteredStatus(test, filterType);
  const inProgType = test.userProgress.find(p =>
    p.status === "in_progress" && (!filterType || p.activityType === filterType)
  );
  const targetType = inProgType?.activityType ?? firstAvailableType(test, filterType);
  const completedType = filterType ??
    test.userProgress.find(p => p.status === "completed" || p.status === "expired")?.activityType ??
    targetType;

  // Which type pills to show
  const visibleTypes = filterType
    ? ([filterType] as const)
    : (["mcq", "canvas", "quantus"] as const);

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-1 border-b border-dashed border-zinc-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-zinc-800 leading-snug truncate">{test.name}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {visibleTypes.map(t => (
            <TypePill
              key={t}
              type={t}
              count={test.itemCounts[t as keyof typeof test.itemCounts] ?? 0}
              progress={test.userProgress.find(p => p.activityType === t)}
            />
          ))}
        </div>
      </div>

      <div className="shrink-0">
        {status === "completed" ? (
          <button
            onClick={() => onViewResult(test.id, completedType)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all active:scale-95"
          >
            <Eye size={10} /> Review
          </button>
        ) : status === "in_progress" ? (
          <button
            onClick={() => onStart(test.id, targetType)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all active:scale-95"
          >
            <RotateCcw size={10} /> Resume
          </button>
        ) : (
          <button
            onClick={() => onStart(test.id, targetType)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black text-[#01696F] bg-[#E6F0F1] border border-[#01696F]/20 hover:bg-[#DFEAEA] transition-all active:scale-95"
          >
            <Play size={10} fill="currentColor" /> Start Test
          </button>
        )}
      </div>
    </div>
  );
}

// ─── TopicSection ─────────────────────────────────────────────────────────────

function TopicSection({ topicData, filterType, onNavigate, onViewResult }: {
  topicData: SkillTopic;
  filterType: string | null;
  onNavigate: (id: string, type: string) => void;
  onViewResult: (id: string, type: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const filteredTests = filterTestsBySection(topicData.tests, filterType);

  // Count activity sessions (not whole tests) for the badge — same logic as ProfessionCard
  let topicTotalActivities = 0;
  let topicCompletedActivities = 0;
  for (const test of filteredTests) {
    const types = filterType
      ? ((test.itemCounts[filterType as keyof typeof test.itemCounts] ?? 0) > 0 ? [filterType] : [])
      : (["mcq", "canvas", "quantus"] as const).filter(t => (test.itemCounts[t] ?? 0) > 0);
    topicTotalActivities += types.length;
    for (const t of types) {
      const prog = test.userProgress.find(p => p.activityType === t);
      if (prog && (prog.status === "completed" || prog.status === "expired")) topicCompletedActivities++;
    }
  }

  if (filteredTests.length === 0) return null;

  return (
    <div className="border border-zinc-100 rounded-2xl overflow-hidden mb-2 last:mb-0">
      <div
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between px-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp size={13} className="text-zinc-400" /> : <ChevronDown size={13} className="text-zinc-400" />}
          <span className="text-xs font-extrabold text-zinc-700">{topicData.topic.name}</span>
          <span className="text-[9px] font-black text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">
            {topicCompletedActivities}/{topicTotalActivities}
          </span>
        </div>
        {topicCompletedActivities === topicTotalActivities && topicTotalActivities > 0 && (
          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" fill="currentColor" />
        )}
      </div>

      {expanded && (
        <div className="px-4 py-2 bg-white">
          {filteredTests.map(test => (
            <TestRow key={test.id} test={test} filterType={filterType} onStart={onNavigate} onViewResult={onViewResult} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ProfessionCard ───────────────────────────────────────────────────────────

function ProfessionCard({ profession, topics, filterType, defaultExpanded, onNavigate, onViewResult, onSelectProfession }: {
  profession: Profession;
  topics: SkillTopic[];
  filterType: string | null;
  defaultExpanded?: boolean;
  onNavigate: (testId: string, activityType: string) => void;
  onViewResult: (testId: string, activityType: string) => void;
  onSelectProfession: (slug: string) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);

  // Filter all tests by section type
  const allFilteredTests = topics.flatMap(t => filterTestsBySection(t.tests, filterType));
  const action = nextAction(allFilteredTests, filterType);

  // Count at activity-session level so MCQ✓ + Canvas✓ + Quantus(in_progress)
  // correctly shows 2/3 done instead of 0/1 tests.
  let totalActivities = 0;
  let completedActivities = 0;
  for (const test of allFilteredTests) {
    const types = filterType
      ? ((test.itemCounts[filterType as keyof typeof test.itemCounts] ?? 0) > 0 ? [filterType] : [])
      : (["mcq", "canvas", "quantus"] as const).filter(t => (test.itemCounts[t] ?? 0) > 0);
    totalActivities += types.length;
    for (const t of types) {
      const prog = test.userProgress.find(p => p.activityType === t);
      if (prog && (prog.status === "completed" || prog.status === "expired")) completedActivities++;
    }
  }
  const allDone = totalActivities > 0 && completedActivities === totalActivities;

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col h-full">

      {/* Card header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onSelectProfession(profession.slug)}
          >
            <h3 className="font-extrabold text-[15px] text-zinc-900 tracking-tight leading-snug hover:text-[#01696F] transition-colors">
              {profession.name}
            </h3>
            <p className="text-[11px] text-zinc-500 font-semibold mt-1 leading-snug">
              {profession.description || "Professional skill track"}
            </p>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black text-zinc-500 border border-zinc-200 hover:bg-zinc-50 transition-all active:scale-95"
          >
            {expanded ? "Collapse" : "Expand"}
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>

        {/* Progress bar */}
        {totalActivities > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
              <div
                className="h-full bg-[#01696F] rounded-full transition-all duration-700"
                style={{ width: `${(completedActivities / totalActivities) * 100}%` }}
              />
            </div>
            <span className="text-[9px] font-black text-zinc-400 whitespace-nowrap">
              {completedActivities}/{totalActivities} activities
            </span>
          </div>
        )}
      </div>

      {/* Expanded: topics → tests */}
      {expanded && (
        <div className="mx-5 mb-4">
          {topics.length === 0 ? (
            <div className="border border-dashed border-zinc-200 rounded-2xl py-6 text-center">
              <p className="text-xs text-zinc-400 font-semibold">No topics available yet</p>
            </div>
          ) : (
            topics.map(topicData => (
              <TopicSection
                key={topicData.topic.id}
                topicData={topicData}
                filterType={filterType}
                onNavigate={onNavigate}
                onViewResult={onViewResult}
              />
            ))
          )}
        </div>
      )}

      {/* Big CTA */}
      <div className="px-5 pb-5 mt-auto">
        {allFilteredTests.length === 0 ? (
          <button disabled className="w-full py-3 rounded-2xl text-sm font-black text-zinc-400 bg-zinc-100 border border-zinc-200 cursor-not-allowed">
            No tests available
          </button>
        ) : allDone ? (
          <button disabled className="w-full py-3 rounded-2xl text-sm font-black text-white bg-[#01696F] border border-[#01696F]/20 flex items-center justify-center gap-2 cursor-default">
            <CheckCircle2 size={15} fill="currentColor" /> All tests complete
          </button>
        ) : action?.isResume ? (
          <button
            onClick={() => onNavigate(action.test.id, action.type)}
            className="w-full py-3 rounded-2xl text-sm font-black text-white bg-[#01696F] hover:bg-[#01696F]/90 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> Resume
          </button>
        ) : (
          <button
            onClick={() => action && onNavigate(action.test.id, action.type)}
            className="w-full py-3 rounded-2xl text-sm font-black text-white bg-[#01696F] hover:bg-[#01696F]/90 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
          >
            <Play size={14} fill="currentColor" /> Start
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Inner content (needs Suspense for useSearchParams) ───────────────────────

function SkillHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAuthStore((s) => s.token) || Cookies.get("shankh-token");

  // Read active section from URL — default to case_simulations
  const section = searchParams.get("section") || "case_simulations";
  const filterType = SECTION_TO_TYPE[section] ?? null;
  const sectionLabel = SECTION_LABELS[section] ?? "All Tests";

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [topicsByProf, setTopicsByProf] = useState<Record<string, SkillTopic[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cases, setCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  // Case preview modal (shown before entering the test page)
  const [previewCase, setPreviewCase] = useState<{ id: string; title: string; studies: any[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const profs = (await skillApi.professions<Profession[]>()) ?? [];
      setProfessions(profs);

      const results = await Promise.all(
        profs.map(async (p) => {
          try {
            const data = await skillApi.professionTests<{ topics?: SkillTopic[] }>(p.slug);
            return { slug: p.slug, topics: data?.topics ?? [] };
          } catch { return { slug: p.slug, topics: [] }; }
        })
      );

      const map: Record<string, SkillTopic[]> = {};
      results.forEach(({ slug, topics }) => { map[slug] = topics; });
      setTopicsByProf(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch case simulations when that section is active
  useEffect(() => {
    if (section !== "case_simulations") return;
    setCasesLoading(true);
    casesApi
      .list<any[]>()
      .then((res) => setCases(res ?? []))
      .catch(() => {})
      .finally(() => setCasesLoading(false));
  }, [section, token]);

  // Navigate to test session
  const handleNavigate = useCallback((testId: string, activityType: string) => {
    router.push(`/skill/tests/${testId}/${activityType}`);
  }, [router]);

  // Navigate directly to result page for a completed test
  const handleViewResult = useCallback((testId: string, activityType: string) => {
    router.push(`/skill/tests/${testId}/${activityType}/result`);
  }, [router]);

  // Navigate to profession-specific page (preserving section filter)
  const handleSelectProfession = useCallback((slug: string) => {
    router.push(`/skill/${slug}?section=${section}`);
  }, [router, section]);

  // Open case: show studies popup for first-time Start; go direct for Resume/Review
  const handleOpenCase = useCallback(async (c: any) => {
    const studiesRead = c.session?.studiesRead === true;
    if (studiesRead) {
      // Already read — go straight to test
      router.push(`/case-simulations/${c.id}/test`);
      return;
    }
    // First time or incomplete — show studies modal first
    setPreviewLoading(true);
    setPreviewCase({ id: c.id, title: c.title, studies: [] });
    try {
      const data = await casesApi.detail<any>(c.id);
      setPreviewCase({ id: c.id, title: c.title, studies: data?.caseStudies ?? [] });
    } catch {
      setPreviewCase(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [router]);

  const handleStartActivities = useCallback(async () => {
    if (!previewCase) return;
    await casesApi.startSession(previewCase.id);
    await casesApi.markRead(previewCase.id);
    setPreviewCase(null);
    router.push(`/case-simulations/${previewCase.id}/test`);
  }, [previewCase, router]);

  // Filter professions by search
  const filtered = professions.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split into with/without tests for the active filter
  const withTests = filtered.filter(p => {
    const topics = topicsByProf[p.slug] ?? [];
    return topics.some(t => filterTestsBySection(t.tests, filterType).length > 0);
  });
  const withoutTests = filtered.filter(p => {
    const topics = topicsByProf[p.slug] ?? [];
    return !topics.some(t => filterTestsBySection(t.tests, filterType).length > 0);
  });

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-hidden">

      {/* Top bar */}
      <div className="px-6 pt-5 pb-4 shrink-0 flex items-center justify-between gap-4 border-b border-zinc-100">
        <div className="flex items-center gap-3 flex-1">
          <div>
            <h2 className="text-lg font-extrabold text-[#01696F] tracking-tight whitespace-nowrap">
              {sectionLabel}
            </h2>
            <p className="text-[10px] text-zinc-400 font-semibold">
              {filterType
                ? `Showing ${filterType.toUpperCase()} activities only`
                : "Showing all activity types"
              }
            </p>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search topics, cases and formulas"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-full py-2 pl-9 pr-4 text-xs font-semibold placeholder:text-zinc-400 outline-none focus:border-[#01696F]/40 focus:ring-2 focus:ring-[#01696F]/10 transition-all shadow-sm"
            />
          </div>
        </div>
        <button className="w-9 h-9 flex items-center justify-center bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm active:scale-95 relative">
          <Bell size={16} className="text-[#01696F]" />
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

        {/* ── Case Simulations section ── */}
        {section === "case_simulations" && (
          casesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => <CaseSimulationCardSkeleton key={i} />)}
            </div>
          ) : cases.length === 0 ? (
            <div className="py-20 text-center text-zinc-400 font-semibold text-sm">
              No case simulations published yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {cases.map((c) => {
                const sess = c.session;
                const isCompleted = sess?.status === "completed";
                const isReading = sess?.status === "reading" && sess?.studiesRead === false;
                const isTesting = sess?.status === "testing";
                const progressPct = sess ? Math.round(((sess.completedCount ?? 0) / Math.max(1, sess.totalActivities ?? 1)) * 100) : 0;
                return (
                  <div key={c.id} className="bg-white border border-zinc-200 rounded-3xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all h-full">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-[#01696F]/60 mb-1">Case Simulation</p>
                        <h3 className="font-extrabold text-zinc-900 text-base leading-snug">{c.title}</h3>
                      </div>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border shrink-0",
                        c.difficulty === "easy" ? "bg-[#E6F0F1] text-[#01696F] border-[#01696F]/20"
                          : c.difficulty === "medium" ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {c.difficulty}
                      </span>
                    </div>
                    {c.description && <p className="text-[11px] text-zinc-500 font-medium leading-relaxed line-clamp-2">{c.description}</p>}
                    <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400">
                      <span>{c.studyCount} case {c.studyCount === 1 ? "study" : "studies"}</span>
                      <span>·</span>
                      <span>{c.activityCount} {c.activityCount === 1 ? "activity" : "activities"}</span>
                    </div>
                    {sess && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-black text-zinc-400">
                          <span>{isCompleted ? "Completed" : isTesting ? "In progress" : "Reading"}</span>
                          <span>{isCompleted ? "100%" : `${progressPct}%`}</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", isCompleted ? "bg-[#01696F]" : "bg-[#01696F]")} style={{ width: isCompleted ? "100%" : `${progressPct}%` }} />
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => handleOpenCase(c)}
                      className={cn(
                        "w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] mt-auto",
                        isCompleted
                          ? "bg-[#01696F]/10 text-[#01696F] border border-[#01696F]/20"
                          : "bg-[#01696F] text-white hover:bg-[#01696F]/90 shadow-sm"
                      )}
                    >
                      {isCompleted
                        ? (<><CheckCircle2 size={12} fill="currentColor" /> Review</>)
                        : sess?.studiesRead
                          ? (<><RotateCcw size={12} /> Resume</>)
                          : (<><Play size={11} fill="currentColor" /> Start</>)
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── Skill tests sections (MCQ / Canvas / Quantus) ── */}
        {section !== "case_simulations" && (loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => <SkillProfessionCardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            {withTests.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {withTests.map((prof, idx) => (
                  <ProfessionCard
                    key={prof.id}
                    profession={prof}
                    topics={topicsByProf[prof.slug] ?? []}
                    filterType={filterType}
                    defaultExpanded={idx < 2}
                    onNavigate={handleNavigate}
                    onViewResult={handleViewResult}
                    onSelectProfession={handleSelectProfession}
                  />
                ))}
              </div>
            )}

            {withoutTests.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">
                  No {sectionLabel} tests yet
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {withoutTests.map(prof => (
                    <div key={prof.id} className="bg-white border border-zinc-100 rounded-3xl p-5 opacity-50">
                      <h4 className="font-extrabold text-sm text-zinc-700">{prof.name}</h4>
                      <p className="text-[11px] text-zinc-400 font-semibold mt-1">
                        No {filterType ?? ""}  tests available yet
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="py-20 text-center text-zinc-400 font-semibold text-sm">
                No professions found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </>
        ))}
      </div>

      {/* Case studies preview modal — shown before entering the test page */}
      <CaseStudiesModal
        studies={previewCase?.studies ?? []}
        caseTitle={previewCase?.title ?? ""}
        isOpen={!!previewCase}
        onClose={() => setPreviewCase(null)}
        onStartActivities={handleStartActivities}
        loading={previewLoading}
      />
    </div>
  );
}

// ─── Exported page (Suspense wrapper for useSearchParams) ─────────────────────

export default function SkillHome() {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-[#01696F]">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-sm font-semibold">Loading skill tracks…</span>
          </div>
        }
      >
        <SkillHomeContent />
      </Suspense>
    </MainLayout>
  );
}