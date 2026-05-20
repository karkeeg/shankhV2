"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Search, Bell, ChevronRight, Loader2, BookOpen, Layers } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
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
}

interface SubtopicDetail extends Subtopic {
  lessons: Lesson[];
}

export default function ModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleSlug = (params?.moduleSlug as string) || "finance";
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
      <div className="p-6 space-y-6 max-w-full mx-auto animate-fade-in">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-[#01696F]">{module.name}</h2>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#01696F]" size={18} />
              <input
                type="text"
                placeholder="Search topics, subtopics..."
                className="w-full bg-white border border-[#01696F]/30 rounded-full py-2 pl-10 pr-4 outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 transition-all text-xs font-medium placeholder:text-zinc-400 shadow-sm"
              />
            </div>
            <button className="w-9 h-9 flex items-center justify-center bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors relative shadow-sm">
              <Bell size={18} className="text-[#01696F]" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
            </button>
          </div>
        </header>

        {/* Resume Banner */}
        <div
          className="text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ backgroundColor: module.accentColor || "#005B60" }}
        >
          <div className="space-y-3 z-10">
            <div className="text-xs font-bold opacity-80 uppercase tracking-widest">
              {activeTopic?.name || "Select a topic"} &middot;{" "}
              {subtopicDetail?.name || "Pick a subtopic"}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {resumeLesson ? resumeLesson.name : "Ready to Learn"}
            </h1>
            <div className="flex flex-wrap gap-2 items-center text-xs pt-1">
              <span className="bg-white/20 px-3 py-1 rounded-full font-bold">
                {Math.round(module.completionPercentage)}% Completed
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full font-bold">
                {totalCompletedLessons}/{totalTopicLessons} Lessons Covered
              </span>
              {resumeLesson && (
                <button
                  onClick={() => router.push(`/activity/${resumeLesson.id}`)}
                  className="bg-white text-[#005B60] hover:bg-zinc-100 transition-colors font-bold px-4 py-1.5 rounded-full shadow-sm text-xs ml-2"
                >
                  Resume Learning →
                </button>
              )}
            </div>
          </div>

          {/* Progress metrics */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[220px] space-y-3 border border-white/10 z-10 shrink-0">
            <MetricRow label="Concept Accuracy" value={module.conceptAccuracy} />
            <MetricRow label="Recall Strength" value={module.recallStrength} />
            <MetricRow label="Application Score" value={module.applicationScore} />
          </div>

          {/* Decorative grid */}
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Topic selector */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-4 shadow-sm h-fit">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-3">
              Topics
            </h3>
            {topics.length === 0 ? (
              <p className="text-xs text-zinc-400 px-2 py-4 text-center">No topics yet.</p>
            ) : (
              <nav className="space-y-1">
                {topics.map((topic) => {
                  const isSelected = topic.id === selectedTopicId;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-2xl transition-all duration-200 flex flex-col gap-0.5",
                        isSelected
                          ? "bg-[#DFEAEA] border border-[#01696F]/30 text-[#01696F] font-bold shadow-sm"
                          : "hover:bg-zinc-50 border border-transparent text-zinc-600 font-medium"
                      )}
                    >
                      <span className="text-sm font-bold leading-snug">{topic.name}</span>
                      {topic.subtitle && (
                        <span className="text-[10px] opacity-60 line-clamp-1">{topic.subtitle}</span>
                      )}
                      {topic.completionPercentage > 0 && (
                        <div className="mt-1.5">
                          <ProgressBar value={topic.completionPercentage} size="sm" colorClass="bg-[#01696F]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Subtopics grid */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-zinc-800">
                  {activeTopic?.name || "Select a topic"} &mdash; Subtopics
                </h2>
                <span className="text-xs text-zinc-400 font-medium">
                  {subtopics.length} subtopic{subtopics.length !== 1 ? "s" : ""}
                </span>
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
                    const isTopic = sub.type === "topic";
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubtopicId(sub.id)}
                        className={cn(
                          "text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between min-h-[110px] shadow-sm group",
                          isSelected
                            ? "border-[#01696F] ring-2 ring-[#01696F]/20 bg-white"
                            : "border-zinc-200 hover:border-zinc-300 bg-white hover:shadow-md"
                        )}
                      >
                        <div className="space-y-1.5">
                          <span
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit inline-block",
                              isTopic
                                ? "bg-[#E6F0F1] text-[#01696F]"
                                : "bg-[#FDF4D5] text-[#A67C00]"
                            )}
                          >
                            {sub.type}
                          </span>
                          <h4 className="font-bold text-zinc-800 text-sm leading-snug group-hover:text-[#01696F] transition-colors line-clamp-2">
                            {sub.name}
                          </h4>
                        </div>
                        <div className="mt-2">
                          {sub.description && (
                            <p className="text-[11px] text-zinc-500 line-clamp-2 mb-2">{sub.description}</p>
                          )}
                          {sub.completionPercentage > 0 && (
                            <ProgressBar value={sub.completionPercentage} size="sm" colorClass="bg-[#01696F]" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lessons panel */}
            {selectedSubtopicId && (
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                {/* Tabs */}
                <div className="flex border-b border-zinc-200 pb-2">
                  <TabBtn label="Topic Lessons" active={activeLessonTab === "lessons"} onClick={() => setActiveLessonTab("lessons")} />
                  <TabBtn label="Lessons History" active={activeLessonTab === "history"} onClick={() => setActiveLessonTab("history")} />
                </div>

                {loadingLessons ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#01696F]" />
                  </div>
                ) : activeLessonTab === "lessons" ? (
                  <LessonsList
                    lessons={subtopicDetail?.lessons || []}
                    onLessonClick={(id) => router.push(`/activity/${id}`)}
                  />
                ) : (
                  <LessonsHistory lessons={completedLessons} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-bold">
        <span>{label}</span>
        <span className="text-[#4FD1C5]">{Math.round(value)}%</span>
      </div>
      <ProgressBar value={value} size="sm" colorClass="bg-[#4FD1C5]" />
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 font-bold text-sm border-b-2 transition-all mr-4",
        active ? "border-[#01696F] text-[#01696F]" : "border-transparent text-zinc-400 hover:text-zinc-600"
      )}
    >
      {label}
    </button>
  );
}

function LessonsList({ lessons, onLessonClick }: { lessons: Lesson[]; onLessonClick: (id: string) => void }) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400 text-sm font-medium">
        No lessons assigned to this subtopic yet.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {lessons.map((lesson, idx) => {
        const completedCount = Math.round(((lesson.lessonCompletionPct || 0) / 100) * 3);
        return (
          <div
            key={lesson.id}
            onClick={() => onLessonClick(lesson.id)}
            className="flex items-center justify-between p-4 bg-[#FDFCFA] border border-zinc-100 rounded-2xl hover:border-[#01696F]/30 hover:bg-white transition-all cursor-pointer shadow-sm group animate-fade-in"
          >
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#01696F]">
                  Lesson {idx + 1} &middot; {lesson.name}
                </span>
                <DifficultyBadge difficulty={lesson.difficulty} />
                {lesson.status === "completed" || completedCount === 3 ? (
                  <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                    Completed (3/3)
                  </span>
                ) : (
                  <span className="bg-[#DFEAEA] text-[#01696F] text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                    {completedCount}/3 Activities Completed
                  </span>
                )}
              </div>
              {lesson.description && (
                <p className="text-xs text-zinc-500 line-clamp-1">{lesson.description}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-[#01696F] transition-colors shrink-0 ml-2" />
          </div>
        );
      })}
    </div>
  );
}

function LessonsHistory({ lessons }: { lessons: Lesson[] }) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400 text-sm font-medium">
        No completed lessons yet. Finish lessons to see history here.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {lessons.map((lesson) => (
        <div
          key={lesson.id}
          className="flex items-center justify-between p-4 bg-[#FDFCFA] border border-zinc-100 rounded-2xl shadow-sm"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600">{lesson.name}</span>
              <DifficultyBadge difficulty={lesson.difficulty} />
            </div>
            <p className="text-xs text-zinc-500">Completed</p>
          </div>
          <span className="text-xs font-bold text-emerald-600">{lesson.lessonCompletionPct}%</span>
        </div>
      ))}
    </div>
  );
}
