"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Search, Bell, ChevronRight, Loader2, BookOpen, Layers, ArrowRight, CheckCircle2, Bookmark, AlertCircle, RefreshCw, X } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { contentApi, bookmarksApi } from "@/lib/api";

interface ModuleData {
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
  const moduleSlug = params?.moduleSlug as string;
  const token = useAuthStore((state) => state.token);

  const [moduleData, setModuleData]         = useState<ModuleData | null>(null);
  const [topics, setTopics]                 = useState<Topic[]>([]);
  const [subtopics, setSubtopics]           = useState<Subtopic[]>([]);
  const [subtopicDetail, setSubtopicDetail] = useState<SubtopicDetail | null>(null);

  const [selectedTopicId, setSelectedTopicId]       = useState<string>("");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>("");
  const [activeLessonTab, setActiveLessonTab]       = useState<"lessons" | "history">("lessons");
  // Per-section search queries — each panel filters independently
  const [topicSearch, setTopicSearch]               = useState("");
  const [searchQuery, setSearchQuery]               = useState(""); // subtopics
  const [lessonSearch, setLessonSearch]             = useState("");

  const [loadingModule, setLoadingModule]     = useState(true);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);
  const [loadingLessons, setLoadingLessons]   = useState(false);
  const [bookmarkedIds, setBookmarkedIds]     = useState<Set<string>>(new Set());

  // Per-section error states
  const [moduleError, setModuleError]         = useState<string | null>(null);
  const [subtopicsError, setSubtopicsError]   = useState<string | null>(null);
  const [lessonsError, setLessonsError]       = useState<string | null>(null);

  // Load bookmarked subtopic IDs
  useEffect(() => {
    if (!token) return;
    bookmarksApi
      .myIds<string[]>()
      .then((ids) => { if (Array.isArray(ids)) setBookmarkedIds(new Set(ids)); })
      .catch(() => {});
  }, [token]);

  const handleToggleBookmark = async (e: React.MouseEvent, subtopicId: string) => {
    e.stopPropagation();
    // Capture snapshot BEFORE optimistic update so revert is accurate
    const snapshot = new Set(bookmarkedIds);
    const next = new Set(bookmarkedIds);
    if (next.has(subtopicId)) next.delete(subtopicId); else next.add(subtopicId);
    setBookmarkedIds(next);
    try {
      await bookmarksApi.toggleSubtopic(subtopicId);
    } catch {
      setBookmarkedIds(snapshot); // revert to pre-optimistic state
    }
  };

  // Step 1: fetch module by slug directly
  const loadModule = useCallback(() => {
    setLoadingModule(true);
    setModuleError(null);
    contentApi
      .moduleBySlug<ModuleData | null>(moduleSlug)
      .then((found) => {
        if (!found) { setLoadingModule(false); return; }
        setModuleData(found);

        // Load topics for this module
        return contentApi.moduleTopics<Topic[]>(found.id).then((topicList) => {
          const list = topicList ?? [];
          setTopics(list);
          if (list.length > 0) {
            setSelectedTopicId(list[0].id);
          }
        });
      })
      .catch((e) => {
        console.error("Module load error:", e);
        setModuleError("Failed to load module. Check your connection and try again.");
      })
      .finally(() => setLoadingModule(false));
  }, [moduleSlug]);

  useEffect(() => { loadModule(); }, [loadModule]);

  // Step 2: when topic changes, load subtopics
  const loadSubtopics = useCallback(() => {
    if (!selectedTopicId) return;
    setLoadingSubtopics(true);
    setSubtopicsError(null);
    setSubtopics([]);
    setSubtopicDetail(null);
    setSelectedSubtopicId("");
    setSearchQuery("");
    contentApi
      .topicSubtopics<Subtopic[]>(selectedTopicId)
      .then((res) => {
        const list = res ?? [];
        setSubtopics(list);
        if (list.length > 0) setSelectedSubtopicId(list[0].id);
      })
      .catch((e) => {
        console.error("Subtopics load error:", e);
        setSubtopicsError("Failed to load subtopics.");
      })
      .finally(() => setLoadingSubtopics(false));
  }, [selectedTopicId]);

  useEffect(() => { loadSubtopics(); }, [loadSubtopics]);

  // Step 3: when subtopic changes, load its lessons
  const loadLessons = useCallback(() => {
    if (!selectedSubtopicId) return;
    setLoadingLessons(true);
    setLessonsError(null);
    setSubtopicDetail(null);
    setLessonSearch("");
    contentApi
      .subtopic<any>(selectedSubtopicId)
      .then((res) => setSubtopicDetail(res ?? null))
      .catch((e) => {
        console.error("Subtopic detail error:", e);
        setLessonsError("Failed to load lessons.");
      })
      .finally(() => setLoadingLessons(false));
  }, [selectedSubtopicId]);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  // Derived values
  const activeTopic = topics.find((t) => t.id === selectedTopicId) ?? null;
  const firstIncompleteLesson = subtopicDetail?.lessons?.find((l) => l.status !== "completed");
  const resumeLesson    = firstIncompleteLesson ?? subtopicDetail?.lessons?.[0];
  const completedLessons = subtopicDetail?.lessons?.filter((l) => l.status === "completed") ?? [];

  const totalTopicLessons    = subtopics.reduce((acc, sub) => acc + (sub.lessonsTotal ?? 0), 0);
  const totalCompletedLessons = subtopics.reduce((acc, sub) => acc + (sub.lessonsCompleted ?? 0), 0);

  // Per-section search filters
  const filteredTopics = topicSearch.trim()
    ? topics.filter((t) => t.name.toLowerCase().includes(topicSearch.toLowerCase()))
    : topics;

  const filteredSubtopics = searchQuery.trim()
    ? subtopics.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : subtopics;

  const allLessons = subtopicDetail?.lessons ?? [];
  const lessonQ = lessonSearch.trim().toLowerCase();
  const visibleLessons = lessonQ
    ? allLessons.filter((l) => l.name.toLowerCase().includes(lessonQ))
    : allLessons;
  const visibleCompletedLessons = lessonQ
    ? completedLessons.filter((l) => l.name.toLowerCase().includes(lessonQ))
    : completedLessons;

  // ── Loading / error states ───────────────────────────────────────────────────

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

  if (moduleError) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-zinc-500 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 opacity-60" />
          <p className="font-semibold text-zinc-700">{moduleError}</p>
          <button
            onClick={loadModule}
            className="flex items-center gap-2 px-5 py-2 bg-[#01696F] text-white text-sm font-bold rounded-xl hover:bg-[#01696F]/90 transition-all active:scale-95"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </MainLayout>
    );
  }

  if (!moduleData) {
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
      <div className="flex flex-col h-[calc(100vh-24px)] overflow-hidden px-4 py-2 gap-3 select-none animate-fade-in">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-extrabold text-[#01696F] tracking-tight">{moduleData.name}</h2>
          <div className="flex items-center gap-3 justify-end">
            <button className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-colors relative shadow-sm active:scale-95">
              <Bell size={18} className="text-[#01696F]" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
            </button>
          </div>
        </header>

        {/* ── Top Row: Resume Banner + Analytics ──────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-3 shrink-0">

          {/* Resume Banner */}
          <div
            className="flex-1 text-white rounded-2xl px-5 py-4 shadow-md relative overflow-hidden"
            style={{ backgroundColor: "#005B60" }}
          >
            {resumeLesson && (
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => router.push(`/activity/${resumeLesson.id}`)}
                  className="bg-white text-[#01696F] flex items-center hover:bg-zinc-50 transition-all font-black px-3 py-1.5 rounded-xl shadow-md text-sm active:scale-95"
                >
                  Resume <ArrowRight size={18} className="ml-1" />
                </button>
              </div>
            )}

            <div className="space-y-1.5 z-10 relative pr-28">
              <h1 className="text-lg md:text-xl font-black tracking-tight leading-tight line-clamp-1">
                {activeTopic?.name ?? "Core Concepts"} &middot;{" "}
                {subtopicDetail?.name ?? "Select a subtopic"}
              </h1>
              <p className="text-[11px] opacity-90 font-bold uppercase tracking-wider line-clamp-1">
                {moduleData.name} &nbsp;|&nbsp;{" "}
                {activeTopic?.tags?.join(", ") ?? ""}
              </p>
              <div className="flex flex-wrap gap-2 pt-0.5">
                <span className="bg-black/10 border border-white/20 px-3 py-1 rounded-full text-xs font-extrabold select-none">
                  {Math.round(moduleData.completionPercentage)}% Completed
                </span>
                <span className="bg-black/10 border border-white/20 px-3 py-1 rounded-full text-xs font-extrabold select-none">
                  {totalCompletedLessons}/{totalTopicLessons} Lessons Covered
                </span>
              </div>
            </div>

            {/* Decorative grid */}
            <div className="absolute right-0 top-0 w-1/3 h-full opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          </div>

          {/* Analytics metrics */}
          <div className="w-full lg:w-72 shrink-0 bg-white border border-zinc-200 rounded-2xl px-4 py-3 shadow-sm flex flex-col justify-between gap-2">
            <MetricRow label="Concept Accuracy" value={moduleData.conceptAccuracy} />
            <MetricRow label="Recall Strength" value={moduleData.recallStrength} />
            <MetricRow label="Application Score" value={moduleData.applicationScore} />
          </div>
        </div>

        {/* ── Bottom: Topic Sidebar + Subtopics/Lessons ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1 min-h-0 lg:grid-rows-[minmax(0,1fr)]">

          {/* Left Panel: Topic selector */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-3 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <h3 className="text-[12px] font-black text-zinc-400 uppercase tracking-widest px-1 mb-3 select-none">
              Select Topic
            </h3>
            {topics.length > 1 && (
              <div className="mb-3">
                <SectionSearch value={topicSearch} onChange={setTopicSearch} placeholder="Search topics…" />
              </div>
            )}
            {topics.length === 0 ? (
              <p className="text-xs text-zinc-400 px-2 py-4 text-center">No topics yet.</p>
            ) : filteredTopics.length === 0 ? (
              <p className="text-xs text-zinc-400 px-2 py-4 text-center">No topics match &ldquo;{topicSearch.trim()}&rdquo;.</p>
            ) : (
              <div className="pr-1 space-y-2 flex-1 overflow-y-auto min-h-0">
                {filteredTopics.map((topic) => {
                  const isSelected = topic.id === selectedTopicId;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col gap-1 shadow-sm select-none group",
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
          <div className="lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-hidden">

            {/* Subtopics Grid */}
            <div className="bg-white border border-zinc-200 rounded-2xl px-4 py-1 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-base font-extrabold text-zinc-800 tracking-tight truncate">
                    {activeTopic?.name ?? "Topics"}
                  </h2>
                  {searchQuery && (
                    <span className="text-xs text-zinc-400 font-semibold shrink-0">
                      {filteredSubtopics.length} result{filteredSubtopics.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {subtopics.length > 1 && (
                  <div className="w-56 shrink-0">
                    <SectionSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search subtopics…" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {subtopicsError ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <AlertCircle className="w-7 h-7 text-red-400 opacity-60" />
                  <p className="text-sm text-zinc-500 font-medium">{subtopicsError}</p>
                  <button onClick={loadSubtopics} className="flex items-center gap-1.5 text-xs font-bold text-[#01696F] hover:underline">
                    <RefreshCw size={12} /> Retry
                  </button>
                </div>
              ) : loadingSubtopics ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#01696F]" />
                </div>
              ) : filteredSubtopics.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 text-sm font-medium flex flex-col items-center gap-2">
                  <Layers className="w-8 h-8 opacity-30" />
                  {searchQuery ? `No subtopics match "${searchQuery}"` : "No subtopics available yet."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {filteredSubtopics.map((sub) => {
                    const isSelected = sub.id === selectedSubtopicId;
                    const isTopic = sub.type.toLowerCase() === "topic";
                    return (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedSubtopicId(sub.id)}
                        className={cn(
                          "cursor-pointer text-left p-2.5 rounded-xl border transition-all duration-200 flex flex-col min-h-[92px] shadow-sm select-none justify-between group",
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
                            <div className="flex items-center gap-1.5">
                              {sub.completionPercentage >= 100 ? (
                                <span className="bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                                  <CheckCircle2 size={14} />
                                </span>
                              ) : sub.completionPercentage > 0 ? (
                                <span className="bg-[#01696F]/10 text-[#01696F] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                  {Math.round(sub.completionPercentage)}%
                                </span>
                              ) : null}
                              <button
                                onClick={(e) => handleToggleBookmark(e, sub.id)}
                                className={cn(
                                  "p-1 rounded-lg transition-all active:scale-90",
                                  bookmarkedIds.has(sub.id)
                                    ? "text-[#01696F]"
                                    : "text-zinc-300 hover:text-zinc-500"
                                )}
                                title={bookmarkedIds.has(sub.id) ? "Remove bookmark" : "Save to bookmarks"}
                              >
                                <Bookmark size={14} fill={bookmarkedIds.has(sub.id) ? "currentColor" : "none"} />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-semibold text-zinc-800 text-sm leading-snug group-hover:text-[#01696F] transition-colors line-clamp-2">
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
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </div>

            {/* Lessons Panel */}
            {selectedSubtopicId && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">

                {/* Tab switcher + lesson search */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="bg-[#F5F3EE] p-1 rounded-full flex gap-1 w-fit border border-zinc-200 select-none">
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
                  {allLessons.length > 1 && (
                    <div className="w-56 shrink-0">
                      <SectionSearch value={lessonSearch} onChange={setLessonSearch} placeholder="Search lessons…" />
                    </div>
                  )}
                </div>

                {/* Subtitle */}
                <p className="text-xs text-zinc-600 leading-relaxed font-semibold">
                  <strong className="text-zinc-800 font-extrabold">
                    {subtopicDetail?.name ?? "…"}
                  </strong>{" "}
                  — lessons ordered from learn to apply.
                </p>

                {/* Lessons content */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                {lessonsError ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <AlertCircle className="w-7 h-7 text-red-400 opacity-60" />
                    <p className="text-sm text-zinc-500 font-medium">{lessonsError}</p>
                    <button onClick={loadLessons} className="flex items-center gap-1.5 text-xs font-bold text-[#01696F] hover:underline">
                      <RefreshCw size={12} /> Retry
                    </button>
                  </div>
                ) : loadingLessons ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#01696F]" />
                  </div>
                ) : activeLessonTab === "lessons" ? (
                  <div className="space-y-2">
                    {allLessons.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 text-sm font-medium">
                        No lessons assigned to this subtopic yet.
                      </div>
                    ) : visibleLessons.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 text-sm font-medium">
                        No lessons match &ldquo;{lessonSearch.trim()}&rdquo;.
                      </div>
                    ) : (
                      visibleLessons.map((lesson) => {
                        const idx = allLessons.indexOf(lesson);
                        const totalActivities = lesson.totalSteps || 1;
                        const completedCount  = lesson.completedSteps || 0;
                        const isAllDone = lesson.status === "completed";
                        const pct = totalActivities > 0 ? Math.round((completedCount / totalActivities) * 100) : 0;
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => router.push(`/activity/${lesson.id}`)}
                            className="flex items-center justify-between p-3 bg-[#F5F3EE] border border-transparent rounded-xl hover:border-[#01696F]/30 hover:bg-white transition-all cursor-pointer shadow-sm group select-none"
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
                  <div className="space-y-2">
                    {completedLessons.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 text-sm font-medium">
                        No completed lessons yet. Finish lessons to see history here.
                      </div>
                    ) : visibleCompletedLessons.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 text-sm font-medium">
                        No completed lessons match &ldquo;{lessonSearch.trim()}&rdquo;.
                      </div>
                    ) : (
                      visibleCompletedLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 bg-[#F5F3EE] border border-transparent rounded-xl shadow-sm"
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
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Small inline search box reused by the Topics / Subtopics / Lessons panels.
function SectionSearch({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#01696F]/60" size={13} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#F5F3EE] border border-zinc-200 rounded-full py-2 pl-9 pr-8 outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 transition-all text-xs font-semibold placeholder:text-zinc-400 text-zinc-800"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 active:scale-90"
          title="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

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
  const isMed  = difficulty.toLowerCase() === "medium";
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
