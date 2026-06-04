"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import {
  ThumbsUp,
  ThumbsDown,
  Loader2,
  BookOpen,
  BarChart2,
  Search,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface ReactionLesson {
  lessonId: string;
  name: string;
  description: string | null;
  difficulty: string;
  status: string;
  activityTypes: string[];
  likesCount: number;
  subtopicId: string;
  subtopicName: string;
  subtopicDescription: string | null;
  subtopicType: string;
  topicId: string;
  topicName: string;
  topicDescription: string | null;
  topicSubtitle: string | null;
  moduleName: string;
  moduleSlug: string;
  source: string;
  reactedAt: string;
  reaction: "like" | "dislike";
}

interface ReactionsData {
  liked: ReactionLesson[];
  disliked: ReactionLesson[];
}

export default function ReviewCenterPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState<ReactionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "liked" | "disliked">("liked");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>("");

  const fetchReactions = useCallback(() => {
    if (!token) return;
    fetch(`${API}/api/v1/reactions/me/lessons`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        setData(res.data ?? { liked: [], disliked: [] });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  // Combine or filter based on active tab
  const filteredLessons = useMemo(() => {
    if (!data) return [];
    if (activeTab === "liked") return data.liked;
    if (activeTab === "disliked") return data.disliked;
    
    // Combine all
    const combined = [...data.liked, ...data.disliked];
    // Sort by reactedAt descending
    return combined.sort((a, b) => new Date(b.reactedAt).getTime() - new Date(a.reactedAt).getTime());
  }, [data, activeTab]);

  // Extract unique topics from filteredLessons
  const topicsList = useMemo(() => {
    const topicsMap: Record<string, {
      id: string;
      name: string;
      description: string | null;
      subtitle: string | null;
      lessons: ReactionLesson[];
    }> = {};

    filteredLessons.forEach((lesson) => {
      if (!topicsMap[lesson.topicId]) {
        topicsMap[lesson.topicId] = {
          id: lesson.topicId,
          name: lesson.topicName,
          description: lesson.topicDescription,
          subtitle: lesson.topicSubtitle,
          lessons: [],
        };
      }
      topicsMap[lesson.topicId].lessons.push(lesson);
    });

    return Object.values(topicsMap);
  }, [filteredLessons]);

  // Sync selectedTopicId
  useEffect(() => {
    if (topicsList.length > 0) {
      const exists = topicsList.some((t) => t.id === selectedTopicId);
      if (!exists) {
        setSelectedTopicId(topicsList[0].id);
      }
    } else {
      setSelectedTopicId("");
    }
  }, [topicsList, selectedTopicId]);

  // Extract unique subtopics for the selectedTopic
  const subtopicsList = useMemo(() => {
    if (!selectedTopicId) return [];
    const topicLessons = filteredLessons.filter((l) => l.topicId === selectedTopicId);

    const subtopicsMap: Record<string, {
      id: string;
      name: string;
      description: string | null;
      type: string;
      lessons: ReactionLesson[];
    }> = {};

    topicLessons.forEach((lesson) => {
      if (!subtopicsMap[lesson.subtopicId]) {
        subtopicsMap[lesson.subtopicId] = {
          id: lesson.subtopicId,
          name: lesson.subtopicName,
          description: lesson.subtopicDescription,
          type: lesson.subtopicType,
          lessons: [],
        };
      }
      subtopicsMap[lesson.subtopicId].lessons.push(lesson);
    });

    return Object.values(subtopicsMap);
  }, [filteredLessons, selectedTopicId]);

  // Sync selectedSubtopicId
  useEffect(() => {
    if (subtopicsList.length > 0) {
      const exists = subtopicsList.some((s) => s.id === selectedSubtopicId);
      if (!exists) {
        setSelectedSubtopicId(subtopicsList[0].id);
      }
    } else {
      setSelectedSubtopicId("");
    }
  }, [subtopicsList, selectedSubtopicId]);

  const selectedTopic = useMemo(() => {
    return topicsList.find((t) => t.id === selectedTopicId);
  }, [topicsList, selectedTopicId]);

  const selectedSubtopic = useMemo(() => {
    return subtopicsList.find((s) => s.id === selectedSubtopicId);
  }, [subtopicsList, selectedSubtopicId]);

  const lessonsToDisplay = useMemo(() => {
    if (!selectedSubtopicId) return [];
    return filteredLessons.filter((l) => l.subtopicId === selectedSubtopicId);
  }, [filteredLessons, selectedSubtopicId]);

  const handleToggleLike = async (lessonId: string, reaction: "like" | "dislike" | null) => {
    try {
      const res = await fetch(`${API}/api/v1/reactions/lessons/${lessonId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction }),
      });
      if (res.ok) {
        fetchReactions();
      }
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-6 max-h-[calc(100vh-24px)] overflow-y-auto select-none animate-fade-in">
        
        {/* Header */}
        <header className="flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#01696F]/10 flex items-center justify-center">
              <BarChart2 size={20} className="text-[#01696F]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-800 tracking-tight">Review Center</h1>
              <p className="text-xs text-zinc-500 font-semibold">Lessons you&apos;ve liked or flagged for review</p>
            </div>
          </div>
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

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#01696F]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

            {/* Left Column: Topic selector */}
            <div className="bg-white rounded-3xl border border-zinc-200 p-4 shadow-sm flex flex-col gap-4">
              <h3 className="text-[12px] font-black text-zinc-400 uppercase tracking-widest px-1 select-none">
                Select Topic
              </h3>
              <div className="space-y-3">
                {topicsList.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center text-zinc-400">
                    <BookOpen size={28} className="opacity-30" />
                    <p className="text-xs font-semibold leading-relaxed">
                      No topics yet. React to lessons while practicing to see them here.
                    </p>
                  </div>
                ) : (
                  topicsList.map((topic) => {
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
                        <span className="text-sm font-extrabold leading-snug group-hover:text-[#01696F] transition-colors">
                          {topic.name}
                        </span>
                        {(topic.subtitle || topic.description) && (
                          <span className="text-[11px] text-zinc-500 font-semibold line-clamp-2 leading-relaxed">
                            {topic.subtitle || topic.description}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Tab toggle + Subtopics + Lessons */}
            <div className="lg:col-span-3 flex flex-col gap-6">

              {/* Tab toggle — always visible */}
              <div className="flex items-center justify-between">
                <div className="bg-white border border-zinc-200 p-1.5 rounded-full flex gap-1 shadow-sm select-none">
                  {(["all", "liked", "disliked"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 capitalize",
                        activeTab === tab
                          ? "bg-[#01696F] text-white shadow-sm"
                          : "text-zinc-600 hover:text-zinc-900"
                      )}
                    >
                      {tab === "liked" && <ThumbsUp size={11} />}
                      {tab === "disliked" && <ThumbsDown size={11} />}
                      {tab === "all" ? "All" : tab === "liked" ? "Liked" : "Disliked"}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-zinc-400 font-semibold">
                  {filteredLessons.length} lesson{filteredLessons.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Subtopics Grid */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm flex flex-col gap-4">
                <h2 className="text-base font-extrabold text-zinc-800 tracking-tight">
                  {selectedTopic?.name ?? "Topics"}
                </h2>

                {subtopicsList.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center text-zinc-400">
                    <p className="text-xs font-semibold">
                      {topicsList.length === 0
                        ? "React to a lesson to populate this view."
                        : "No subtopics match the current filter."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {subtopicsList.map((sub) => {
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
                            <span
                              className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg w-fit inline-block border",
                                isTopic
                                  ? "bg-[#E6F0F1] text-[#01696F] border-[#01696F]/10"
                                  : "bg-[#FFF9E6] text-[#A67C00] border-[#A67C00]/10"
                              )}
                            >
                              {sub.type}
                            </span>
                            <h4 className="font-semibold text-zinc-800 text-lg leading-snug group-hover:text-[#01696F] transition-colors line-clamp-2">
                              {sub.name}
                            </h4>
                          </div>
                          {sub.description && (
                            <p className="text-[12px] text-zinc-500 line-clamp-2 leading-relaxed font-semibold">
                              {sub.description}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lessons Table Card — shown when a subtopic is selected */}
              {selectedSubtopicId && (
                <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">

                  {/* Subtext */}
                  <p className="text-xs text-zinc-600 leading-relaxed font-semibold">
                    <strong className="text-zinc-800 font-extrabold">
                      {selectedSubtopic?.name}
                    </strong>{" "}
                    — lessons ordered from learn to apply.
                  </p>

                  {/* Table */}
                  <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
                    <table className="w-full border-collapse text-left bg-white">
                      <thead>
                        <tr className="bg-[#005B60] text-white select-none">
                          <th className="px-6 py-4 font-bold text-sm">Lessons</th>
                          <th className="px-6 py-4 font-bold text-sm">Format</th>
                          <th className="px-6 py-4 font-bold text-sm">Status</th>
                          <th className="px-6 py-4 font-bold text-sm">Like / Dislike</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {lessonsToDisplay.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 text-sm font-medium">
                              No lessons match this filter for this subtopic.
                            </td>
                          </tr>
                        ) : (
                          lessonsToDisplay.map((lesson, idx) => {
                            const formatType = lesson.activityTypes.includes("quantus") ? "Quantus"
                              : lesson.activityTypes.includes("mcq") ? "MCQ" : "Simulation";
                            const isCompleted  = lesson.status === "completed";
                            const isInProgress = lesson.status === "in_progress";

                            return (
                              <tr
                                key={lesson.lessonId}
                                onClick={() => router.push(`/activity/${lesson.lessonId}`)}
                                className={cn(
                                  "group cursor-pointer hover:bg-[#E6F0F1]/20 transition-colors",
                                  idx % 2 === 1 ? "bg-[#F5F3EE]/40" : "bg-white"
                                )}
                              >
                                <td className="px-6 py-4 min-w-0">
                                  <div className="font-extrabold text-zinc-800 text-sm group-hover:text-[#01696F] transition-colors">
                                    {lesson.name}
                                  </div>
                                  {lesson.description && (
                                    <div className="text-[11px] text-zinc-500 font-semibold line-clamp-1">
                                      {lesson.description}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-xs font-semibold text-zinc-600">
                                  {formatType}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={cn(
                                    "text-xs font-bold",
                                    isCompleted ? "text-emerald-600" :
                                    isInProgress ? "text-amber-600" : "text-zinc-400"
                                  )}>
                                    {isCompleted ? "Completed" : isInProgress ? "In Progress" : "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleToggleLike(lesson.lessonId, lesson.reaction === "like" ? null : "like")}
                                      className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 text-xs font-extrabold select-none shadow-sm",
                                        lesson.reaction === "like"
                                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                          : "bg-white border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-600"
                                      )}
                                      title="Like"
                                    >
                                      <ThumbsUp size={13} fill={lesson.reaction === "like" ? "currentColor" : "none"} />
                                      <span>{lesson.likesCount}</span>
                                    </button>
                                    <button
                                      onClick={() => handleToggleLike(lesson.lessonId, lesson.reaction === "dislike" ? null : "dislike")}
                                      className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 text-xs font-extrabold select-none shadow-sm",
                                        lesson.reaction === "dislike"
                                          ? "bg-rose-50 border-rose-300 text-rose-700"
                                          : "bg-white border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-600"
                                      )}
                                      title="Dislike"
                                    >
                                      <ThumbsDown size={13} fill={lesson.reaction === "dislike" ? "currentColor" : "none"} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </MainLayout>
  );
}
