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
  ChevronRight,
  CheckCircle2,
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
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  const q = searchQuery.toLowerCase().trim();

  const filteredTopicsList = useMemo(() => {
    if (!q) return topicsList;
    return topicsList.filter((topic) => {
      if (topic.name.toLowerCase().includes(q)) return true;
      return topic.bookmarks.some(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.lessons.some((l) => l.name.toLowerCase().includes(q))
      );
    });
  }, [topicsList, q]);

  // Sync selectedTopicId
  useEffect(() => {
    if (filteredTopicsList.length > 0) {
      const exists = filteredTopicsList.some((t) => t.id === selectedTopicId);
      if (!exists) {
        setSelectedTopicId(filteredTopicsList[0].id);
      }
    } else {
      setSelectedTopicId("");
    }
  }, [filteredTopicsList, selectedTopicId]);

  // Subtopics for the selectedTopic
  const subtopicsList = useMemo(() => {
    if (!selectedTopicId) return [];
    return bookmarks.filter((b) => b.topicId === selectedTopicId);
  }, [bookmarks, selectedTopicId]);

  const filteredSubtopicsList = useMemo(() => {
    if (!q) return subtopicsList;
    return subtopicsList.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.lessons.some((l) => l.name.toLowerCase().includes(q))
    );
  }, [subtopicsList, q]);

  // Sync selectedSubtopicId
  useEffect(() => {
    if (filteredSubtopicsList.length > 0) {
      const exists = filteredSubtopicsList.some((s) => s.subtopicId === selectedSubtopicId);
      if (!exists) {
        setSelectedSubtopicId(filteredSubtopicsList[0].subtopicId);
      }
    } else {
      setSelectedSubtopicId("");
    }
  }, [filteredSubtopicsList, selectedSubtopicId]);

  const selectedTopic = useMemo(() => {
    return filteredTopicsList.find((t) => t.id === selectedTopicId);
  }, [filteredTopicsList, selectedTopicId]);

  const selectedSubtopic = useMemo(() => {
    return filteredSubtopicsList.find((s) => s.subtopicId === selectedSubtopicId);
  }, [filteredSubtopicsList, selectedSubtopicId]);

  const lessonsToDisplay = useMemo(() => {
    if (!selectedSubtopic) return [];
    if (!q) return selectedSubtopic.lessons;
    return selectedSubtopic.lessons.filter((l) => l.name.toLowerCase().includes(q));
  }, [selectedSubtopic, q]);

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
        ) : filteredTopicsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <Search size={40} className="opacity-30" />
            <p className="text-sm font-medium">No results for &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-xs font-semibold">Try a different keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Left Column: Topic selector */}
            <div className="bg-white rounded-3xl border border-zinc-200 p-4 shadow-sm flex flex-col gap-4">
              <h3 className="text-[12px] font-black text-zinc-400 uppercase tracking-widest px-1 select-none">
                Select Topic
              </h3>
              <div className="space-y-3">
                {filteredTopicsList.map((topic) => {
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
                  {filteredSubtopicsList.map((sub) => {
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

              {/* Lessons Card */}
              {selectedSubtopicId && (
                <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm flex flex-col gap-3">

                  {/* Subtitle */}
                  <p className="text-xs text-zinc-600 leading-relaxed font-semibold">
                    <strong className="text-zinc-800 font-extrabold">
                      {selectedSubtopic?.name}
                    </strong>{" "}
                    — lessons ordered from learn to apply.
                  </p>

                  {/* Lesson rows */}
                  <div className="space-y-3">
                    {lessonsToDisplay.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 text-sm font-medium">
                        No lessons assigned to this subtopic yet.
                      </div>
                    ) : (
                      lessonsToDisplay.map((lesson, idx) => {
                        const isCompleted = lesson.status === "completed";
                        const isInProgress = lesson.status === "in_progress";
                        return (
                          <div
                            key={lesson.lessonId}
                            onClick={() => router.push(`/activity/${lesson.lessonId}`)}
                            className="flex items-center justify-between p-4 bg-[#F5F3EE] border border-transparent rounded-2xl hover:border-[#01696F]/30 hover:bg-white transition-all cursor-pointer shadow-sm group select-none"
                          >
                            <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold text-[#01696F] block tracking-tight">
                                  Lesson {idx + 1} &middot; {lesson.name}
                                </span>
                                {isCompleted ? (
                                  <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 select-none flex items-center gap-1">
                                    <CheckCircle2 size={9} /> Completed
                                  </span>
                                ) : isInProgress ? (
                                  <span className="bg-[#E6F0F1] text-[#01696F] text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-[#01696F]/10 select-none">
                                    In Progress
                                  </span>
                                ) : null}
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

                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </MainLayout>
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
