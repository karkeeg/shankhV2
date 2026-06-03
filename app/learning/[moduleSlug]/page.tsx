"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Search, Bell, ChevronRight, Loader2, BookOpen, Layers, ArrowRight, CheckCircle2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface Module {
  id: string;
  slug: string;
  name: string;
  description?: string;
  accentColor: string;
  completionPercentage: number;
  conceptAccuracy: number;
  recallStrength: number;
  applicationScore: number;
}

interface Topic {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  tags: string[];
  type: string;
  subtopicsTotal: number;
  completionPercentage: number;
}

interface Subtopic {
  id: string;
  name: string;
  description?: string;
  type: string;
  completionPercentage: number;
  lessonsTotal: number;
  lessonsCompleted?: number;
}

interface Lesson {
  id: string;
  name: string;
  description?: string;
  difficulty: "easy" | "medium" | "hard";
  status: string;
  lessonCompletionPct: number;
  activityTypes: string[];
  totalSteps: number;
  completedSteps: number;
}

interface SubtopicDetail extends Subtopic {
  lessons: Lesson[];
}

export default function ModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleSlug = (params?.moduleSlug as string);
  const token = useAuthStore((state) => state.token);

  const [module, setModule] = useState<Module | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [subtopicDetail, setSubtopicDetail] = useState<SubtopicDetail | null>(null);



  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>("");
  const [activeLessonTab, setActiveLessonTab] = useState<"lessons" | "history">("lessons");

  const [loadingModule, setLoadingModule] = useState(true);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);


  const authHeaders = useCallback((): HeadersInit => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  // Step 1: fetch all modules to find this one by slug, then load its topics
  useEffect(() => {
    setLoadingModule(true);
    fetch(`${API}/api/v1/content/modules`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(async (res) => {
        const found: Module | undefined = res.data?.find(
          (m: Module) => m.slug.toLowerCase() === moduleSlug.toLowerCase()
        );
        if (!found) { setLoadingModule(false); return; }
        setModule(found);

        const topicsRes = await fetch(`${API}/api/v1/content/modules/${found.id}/topics`, { headers: authHeaders() });
        const topicsData = await topicsRes.json();
        const topicList: Topic[] = topicsData.data || [];
        setTopics(topicList);

        if (topicList.length > 0) {
          setSelectedTopicId(topicList[0].id);
        }
      })
      .catch((e) => console.error("Module load error:", e))
      .finally(() => setLoadingModule(false));
  }, [moduleSlug, authHeaders]);

  // Step 2: when topic changes, load subtopics
  useEffect(() => {
    if (!selectedTopicId) return;
    setLoadingSubtopics(true);
    setSubtopics([]);
    setSubtopicDetail(null);
    setSelectedSubtopicId("");
    fetch(`${API}/api/v1/content/topics/${selectedTopicId}/subtopics`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        const list: Subtopic[] = res.data || [];
        setSubtopics(list);
        if (list.length > 0) setSelectedSubtopicId(list[0].id);
      })
      .catch((e) => console.error("Subtopics load error:", e))
      .finally(() => setLoadingSubtopics(false));
  }, [selectedTopicId, authHeaders]);

  // Step 3: when subtopic changes, load its lessons
  useEffect(() => {
    if (!selectedSubtopicId) return;
    setLoadingLessons(true);
    setSubtopicDetail(null);
    fetch(`${API}/api/v1/content/subtopics/${selectedSubtopicId}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => setSubtopicDetail(res.data || null))
      .catch((e) => console.error("Subtopic detail error:", e))
      .finally(() => setLoadingLessons(false));
  }, [selectedSubtopicId, authHeaders]);

  const activeTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];
  const firstIncompleteLesson = subtopicDetail?.lessons?.find((l) => l.status !== "completed");
  const resumeLesson = firstIncompleteLesson || subtopicDetail?.lessons?.[0];
  const completedLessons = subtopicDetail?.lessons?.filter((l) => l.status === "completed") || [];

  const totalTopicLessons = subtopics.reduce((acc, sub) => acc + (sub.lessonsTotal || 0), 0);
  const totalCompletedLessons = subtopics.reduce((acc, sub) => acc + (sub.lessonsCompleted || 0), 0);

  if (loadingModule) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-[#01696F]">
          <Loader2 className="w-10 h-10 animate-spin" />
          <span className="text-sm font-semibold">Loading module...</span>
        </div>
      </MainLayout>
    );
  }

  if (!module) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-zinc-500">
          <BookOpen className="w-12 h-12 opacity-30" />
          <p className="font-medium">Module &ldquo;{moduleSlug}&rdquo; not found.</p>
          <button onClick={() => router.push("/")} className="text-[#01696F] underline text-sm">
            Back to dashboard
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col max-h-[calc(100vh-24px)] overflow-y-auto p-6 gap-6 select-none animate-fade-in">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between gap-4 shrink-0">
          <h2 className="text-2xl font-extrabold text-[#01696F] tracking-tight">{module.name}</h2>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="relative w-[340px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#01696F]" size={16} />
              <input
                type="text"
                placeholder="Search topics, cases and formulas"
                className="w-full bg-white border border-[#01696F]/30 rounded-full py-2.5 pl-11 pr-4 outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 transition-all text-xs font-semibold placeholder:text-zinc-400 shadow-sm"
              />
            </div>
            <button className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-colors relative shadow-sm active:scale-95">
              <Bell size={18} className="text-[#01696F]" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
            </button>
          </div>
        </header>

        {/* ── Top Row: Resume Banner + Analytics ──────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Resume Banner */}
          <div
            className="flex-1 text-white rounded-3xl p-6 shadow-md relative overflow-hidden"
            style={{ backgroundColor: "#005B60" }}
          >
            {resumeLesson && (
              <div className="absolute top-6 right-6 z-20">
                <button
                  onClick={() => router.push(`/activity/${resumeLesson.id}`)}
                  className="bg-white text-[#01696F] flex hover:bg-zinc-50 transition-all font-black px-3 py-2 rounded-2xl shadow-md text-md active:scale-95"
                >
                  Resume Learning <ArrowRight size={22} className="ml-1" />
                </button>
              </div>
            )}

            <div className="space-y-3 z-10 relative pr-32">
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
                {activeTopic?.name || "Core Concepts"} &middot;{" "}
                {subtopicDetail?.name || "Enterprise value vs equity value"}
              </h1>
              <p className="text-[12px] opacity-90 font-bold uppercase tracking-wider">
                {module.name} &nbsp;|&nbsp;{" "}
                {activeTopic?.tags?.join(", ") || "3-Statement, Valuation, LBO"}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <span className="bg-black/10 border border-white/20 px-3.5 py-1.5 rounded-full font-extrabold select-none">
                  {Math.round(module.completionPercentage)}% Completed
                </span>
                <span className="bg-black/10 border border-white/20 px-3.5 py-1.5 rounded-full font-extrabold select-none">
                  {totalCompletedLessons}/{totalTopicLessons} Lessons Covered
                </span>
              </div>
            </div>

            {/* Decorative grid */}
            <div className="absolute right-0 top-0 w-1/3 h-full opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          </div>

          {/* Analytics metrics */}
          <div className="w-full lg:w-80 shrink-0 bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between gap-4">
            <MetricRow label="Concept Accuracy" value={module.conceptAccuracy} />
            <MetricRow label="Recall Strength" value={module.recallStrength} />
            <MetricRow label="Application Score" value={module.applicationScore} />
          </div>
        </div>

        {/* ── Bottom: Topic Sidebar + Subtopics/Lessons ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Panel: Topic selector */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-4 shadow-sm flex flex-col">
            <h3 className="text-[12px] font-black text-zinc-400 uppercase tracking-widest px-1 mb-4 select-none">
              Select Topic
            </h3>
            {topics.length === 0 ? (
              <p className="text-xs text-zinc-400 px-2 py-4 text-center">No topics yet.</p>
            ) : (
              <div className="pr-1 space-y-3">
                {topics.map((topic) => {
                  const isSelected = topic.id === selectedTopicId;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-1 shadow-sm select-none group",
                        isSelected
                          ? "bg-[#E6F0F1] border-2 border-[#01696F] text-[#01696F] font-bold"
                          : "bg-[#F5F3EE] hover:bg-zinc-100 border-transparent text-zinc-700 font-medium"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-extrabold leading-snug group-hover:text-[#01696F] transition-colors">
                          {topic.name}
                        </span>
                        {topic.completionPercentage >= 100 ? (
                          <span className="bg-green-500 text-white rounded-full p-0.5 shadow-sm shrink-0">
                            <CheckCircle2 size={12} />
                          </span>
                        ) : topic.completionPercentage > 0 ? (
                          <span className="bg-[#01696F]/10 text-[#01696F] text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {Math.round(topic.completionPercentage)}%
                          </span>
                        ) : null}
                      </div>
                      {topic.description && (
                        <span className="text-[11px] text-zinc-500 font-semibold line-clamp-2 leading-relaxed">
                          {topic.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Subtopics grid + Lessons */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Subtopics Grid */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-extrabold text-zinc-800 tracking-tight">
                  {activeTopic?.name || "Core Concepts"} Topics
                </h2>
              </div>

              {loadingSubtopics ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#01696F]" />
                </div>
              ) : subtopics.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 text-sm font-medium flex flex-col items-center gap-2">
                  <Layers className="w-8 h-8 opacity-30" />
                  No subtopics available yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subtopics.map((sub) => {
                    const isSelected = sub.id === selectedSubtopicId;
                    const isTopic = sub.type.toLowerCase() === "topic";
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubtopicId(sub.id)}
                        className={cn(
                          "text-left p-3 rounded-2xl border transition-all duration-200 flex flex-col min-h-[120px] shadow-sm select-none justify-between group",
                          isSelected
                            ? "border-2 border-[#01696F] bg-[#E6F0F1] ring-1 ring-[#01696F]/10"
                            : "border-transparent bg-[#F5F3EE] hover:bg-zinc-100 hover:shadow-md"
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <span
                              className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 rounded-lg w-fit inline-block border",
                                isTopic
                                  ? "bg-[#E6F0F1] text-[#01696F] border-[#01696F]/10"
                                  : "bg-[#FFF9E6] text-[#A67C00] border-[#A67C00]/10"
                              )}
                            >
                              {sub.type}
                            </span>
                            {sub.completionPercentage >= 100 ? (
                              <span className="bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                                <CheckCircle2 size={14} />
                              </span>
                            ) : sub.completionPercentage > 0 ? (
                              <span className="bg-[#01696F]/10 text-[#01696F] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {Math.round(sub.completionPercentage)}%
                              </span>
                            ) : null}
                          </div>
                          <h4 className="font-semibold text-zinc-800 text-lg leading-snug group-hover:text-[#01696F] transition-colors line-clamp-2">
                            {sub.name}
                          </h4>
                        </div>
                        <div className="w-full">
                          {sub.description && (
                            <p className="text-[12px] text-zinc-500 line-clamp-2 leading-relaxed font-semibold mb-2">
                              {sub.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lessons Panel */}
            {selectedSubtopicId && (
              <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm flex flex-col gap-3">

                {/* Tab switcher */}
                <div className="bg-[#F5F3EE] p-2 rounded-full flex gap-1 w-fit border border-zinc-200 select-none">
                  <button
                    onClick={() => setActiveLessonTab("lessons")}
                    className={cn(
                      "px-4 py-1 rounded-full text-sm transition-all duration-200",
                      activeLessonTab === "lessons"
                        ? "bg-[#01696F] text-white shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    )}
                  >
                    Topic Lessons
                  </button>
                  <button
                    onClick={() => setActiveLessonTab("history")}
                    className={cn(
                      "px-4 py-1 rounded-full text-sm transition-all duration-200",
                      activeLessonTab === "history"
                        ? "bg-[#01696F] text-white shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    )}
                  >
                    Lessons History
                  </button>
                </div>

                {/* Subtitle */}
                <p className="text-xs text-zinc-600 leading-relaxed font-semibold">
                  <strong className="text-zinc-800 font-extrabold">
                    {subtopicDetail?.name || "Enterprise value vs equity value"}
                  </strong>{" "}
                  — lessons ordered from learn to apply.
                </p>

                {/* Lessons content */}
                {loadingLessons ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#01696F]" />
                  </div>
                ) : activeLessonTab === "lessons" ? (
                  <div className="space-y-3">
                    {(subtopicDetail?.lessons || []).length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 text-sm font-medium">
                        No lessons assigned to this subtopic yet.
                      </div>
                    ) : (
                      (subtopicDetail?.lessons || []).map((lesson, idx) => {
                        const totalActivities = lesson.totalSteps || 1;
                        const completedCount = lesson.completedSteps || 0;
                        const isAllDone = lesson.status === "completed";
                        const pct = totalActivities > 0 ? Math.round((completedCount / totalActivities) * 100) : 0;
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => router.push(`/activity/${lesson.id}`)}
                            className="flex items-center justify-between p-4 bg-[#F5F3EE] border border-transparent rounded-2xl hover:border-[#01696F]/30 hover:bg-white transition-all cursor-pointer shadow-sm group select-none"
                          >
                            <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold text-[#01696F] block tracking-tight">
                                  Lesson {idx + 1} &middot; {lesson.name}
                                </span>
                                {isAllDone ? (
                                  <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 select-none">
                                    ✓ Completed · {completedCount}/{totalActivities} Activities · {pct}%
                                  </span>
                                ) : (
                                  <span className="bg-[#E6F0F1] text-[#01696F] text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-[#01696F]/10 select-none">
                                    {completedCount}/{totalActivities} Activities · {pct}%
                                  </span>
                                )}
                              </div>
                              {lesson.description && (
                                <p className="text-[11px] text-zinc-500 font-semibold line-clamp-1">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <DiffBadge difficulty={lesson.difficulty} />
                              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-[#01696F] transition-colors" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedLessons.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 text-sm font-medium">
                        No completed lessons yet. Finish lessons to see history here.
                      </div>
                    ) : (
                      completedLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-4 bg-[#F5F3EE] border border-transparent rounded-2xl shadow-sm"
                        >
                          <div className="space-y-1 flex-1 min-w-0 pr-4">
                            <span className="text-xs font-extrabold text-[#01696F] block tracking-tight">
                              {lesson.name}
                            </span>
                            <p className="text-[11px] text-zinc-500 font-semibold">Completed</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <DiffBadge difficulty={lesson.difficulty} />
                            <span className="text-xs font-extrabold text-emerald-600">
                              {lesson.lessonCompletionPct}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5 flex-1 flex flex-col justify-center">
      <div className="flex justify-between items-center text-xs font-bold text-zinc-700">
        <span className="tracking-tight">{label}</span>
        <span className="text-[#01696F] text-xs font-extrabold">{Math.round(value)}%</span>
      </div>
      <div className="w-full bg-[#E6F0F1] h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#01696F] h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function DiffBadge({ difficulty }: { difficulty: string }) {
  const isEasy = difficulty.toLowerCase() === "easy";
  const isMed = difficulty.toLowerCase() === "medium";
  return (
    <span
      className={cn(
        "text-[10px] font-black px-3 py-1 rounded-lg border tracking-wide uppercase select-none",
        isEasy
          ? "bg-[#E6F0F1] text-[#01696F] border-[#01696F]/20"
          : isMed
            ? "bg-amber-50 text-amber-700 border-amber-500/20"
            : "bg-red-50 text-red-700 border-red-500/20"
      )}
    >
      {difficulty}
    </span>
  );
}