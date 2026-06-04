"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import {
  Bookmark,
  Loader2,
  BookOpen,
  Search,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface BookmarkedLesson {
  lessonId: string;
  name: string;
  description: string | null;
  difficulty: string;
  status: string;
  activityTypes: string[];
  likesCount: number;
  userReaction: "like" | "dislike" | null;
}

interface BookmarkedSubtopic {
  subtopicId: string;
  name: string;
  description?: string;
  type: string;
  topic: string;
  topicId: string;
  topicDescription: string | null;
  topicSubtitle: string | null;
  module: string;
  moduleSlug: string;
  savedAt: string;
  lessons: BookmarkedLesson[];
}

export default function BookmarksPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [bookmarks, setBookmarks] = useState<BookmarkedSubtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>("");

  const authHeaders = useCallback((): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const fetchBookmarks = useCallback(() => {
    if (!token) return;
    fetch(`${API}/api/v1/bookmarks/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        setBookmarks(res.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, authHeaders]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleToggleBookmark = async (e: React.MouseEvent, subtopicId: string) => {
    e.stopPropagation();
    // Optimistic UI update
    setBookmarks((prev) => prev.filter((b) => b.subtopicId !== subtopicId));
    try {
      await fetch(`${API}/api/v1/bookmarks/subtopics/${subtopicId}`, {
        method: "POST",
        headers: authHeaders(),
      });
    } catch {
      // Re-fetch on error to revert state
      fetchBookmarks();
    }
  };



  // Extract unique topics from bookmarks
  const topicsList = useMemo(() => {
    const topicsMap: Record<string, {
      id: string;
      name: string;
      description: string | null;
      subtitle: string | null;
      bookmarks: BookmarkedSubtopic[];
    }> = {};

    bookmarks.forEach((b) => {
      if (!topicsMap[b.topicId]) {
        topicsMap[b.topicId] = {
          id: b.topicId,
          name: b.topic,
          description: b.topicDescription,
          subtitle: b.topicSubtitle,
          bookmarks: [],
        };
      }
      topicsMap[b.topicId].bookmarks.push(b);
    });

    return Object.values(topicsMap);
  }, [bookmarks]);

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

  // Subtopics for the selectedTopic
  const subtopicsList = useMemo(() => {
    if (!selectedTopicId) return [];
    return bookmarks.filter((b) => b.topicId === selectedTopicId);
  }, [bookmarks, selectedTopicId]);

  // Sync selectedSubtopicId
  useEffect(() => {
    if (subtopicsList.length > 0) {
      const exists = subtopicsList.some((s) => s.subtopicId === selectedSubtopicId);
      if (!exists) {
        setSelectedSubtopicId(subtopicsList[0].subtopicId);
      }
    } else {
      setSelectedSubtopicId("");
    }
  }, [subtopicsList, selectedSubtopicId]);

  const selectedTopic = useMemo(() => {
    return topicsList.find((t) => t.id === selectedTopicId);
  }, [topicsList, selectedTopicId]);

  const selectedSubtopic = useMemo(() => {
    return subtopicsList.find((s) => s.subtopicId === selectedSubtopicId);
  }, [subtopicsList, selectedSubtopicId]);

  const lessonsToDisplay = useMemo(() => {
    if (!selectedSubtopic) return [];
    return selectedSubtopic.lessons;
  }, [selectedSubtopic]);

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-6 max-h-[calc(100vh-24px)] overflow-y-auto select-none animate-fade-in">
        
        {/* Header */}
        <header className="flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#01696F]/10 flex items-center justify-center">
              <Bookmark size={20} className="text-[#01696F]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-800 tracking-tight">Bookmarks</h1>
              <p className="text-xs text-zinc-500 font-semibold">Subtopics you&apos;ve saved for quick access</p>
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
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <BookOpen size={40} className="opacity-30" />
            <p className="text-sm font-medium">No bookmarks yet.</p>
            <p className="text-xs font-semibold">Click the bookmark icon on subtopic cards to save them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Left Column: Topic selector */}
            <div className="bg-white rounded-3xl border border-zinc-200 p-4 shadow-sm flex flex-col gap-4">
              <h3 className="text-[12px] font-black text-zinc-400 uppercase tracking-widest px-1 select-none">
                Select Topic
              </h3>
              <div className="space-y-3">
                {topicsList.map((topic) => {
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
                })}
              </div>
            </div>

            {/* Right Column: Subtopics and Lessons list */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Subtopics Grid */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm flex flex-col gap-4">
                <h2 className="text-base font-extrabold text-zinc-800 tracking-tight">
                  {selectedTopic?.name || "Core Concepts"} Topics
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subtopicsList.map((sub) => {
                    const isSelected = sub.subtopicId === selectedSubtopicId;
                    const isTopic = sub.type.toLowerCase() === "topic";
                    return (
                      <div
                        key={sub.subtopicId}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedSubtopicId(sub.subtopicId)}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedSubtopicId(sub.subtopicId)}
                        className={cn(
                          "text-left p-3 rounded-2xl border transition-all duration-200 flex flex-col min-h-[120px] shadow-sm select-none justify-between group cursor-pointer",
                          isSelected
                            ? "border-2 border-[#01696F] bg-[#E6F0F1] ring-1 ring-[#01696F]/10"
                            : "border-transparent bg-[#F5F3EE] hover:bg-zinc-100 hover:shadow-md"
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
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
                            <button
                              onClick={(e) => handleToggleBookmark(e, sub.subtopicId)}
                              className="p-1 rounded-lg text-[#01696F] hover:text-zinc-400 transition-all active:scale-95"
                              title="Remove bookmark"
                            >
                              <Bookmark size={14} fill="currentColor" />
                            </button>
                          </div>
                          <h4 className="font-semibold text-zinc-800 text-lg leading-snug group-hover:text-[#01696F] transition-colors line-clamp-2">
                            {sub.name}
                          </h4>
                        </div>
                        {sub.description && (
                          <p className="text-[12px] text-zinc-500 line-clamp-2 leading-relaxed font-semibold">
                            {sub.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lessons Table Card */}
              {selectedSubtopicId && (
                <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
                  
                  {/* Subtext description */}
                  <p className="text-xs text-zinc-600 leading-relaxed font-semibold">
                    <strong className="text-zinc-800 font-extrabold">
                      {selectedSubtopic?.name}
                    </strong>{" "}
                    lessons ordered from learn to apply.
                  </p>

                  {/* Table */}
                  <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
                    <table className="w-full border-collapse text-left bg-white">
                      <thead>
                        <tr className="bg-[#005B60] text-white select-none">
                          <th className="px-6 py-4 font-bold text-sm">Lessons</th>
                          <th className="px-6 py-4 font-bold text-sm">Format</th>
                          <th className="px-6 py-4 font-bold text-sm">Status</th>

                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {lessonsToDisplay.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-zinc-400 text-sm font-medium">
                              No lessons assigned to this subtopic yet.
                            </td>
                          </tr>
                        ) : (
                          lessonsToDisplay.map((lesson, idx) => {
                            const formatType = lesson.activityTypes.includes("quantus") ? "Quantus" :
                                               lesson.activityTypes.includes("mcq") ? "MCQ" : "Simulation";
                            const isCompleted = lesson.status === "completed";
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
                                    {isCompleted ? "Completed" : isInProgress ? "In Progress" : "-"}
                                  </span>
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
