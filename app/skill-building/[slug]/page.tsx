"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Loader2, Search, ChevronDown, Clock, CheckCircle2, Circle,
    BookOpen, Play, RotateCcw, AlertCircle,
} from "lucide-react";
import useSkillData from "@/hooks/useSkillData";
import { MainLayout } from "@/components/layout/MainLayout";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LessonProgress {
    isCompleted: boolean;
    bestScorePct: number | null;
    lessonCompletionPct: number;
}

interface SkillLesson {
    id: string;
    name: string;
    difficulty: "easy" | "medium" | "hard";
    activityType: string | null;
    lessonProgress: LessonProgress | null;
}

interface SkillSubtopic {
    id: string;
    name: string;
    description: string | null;
    orderIndex: number;
    lessons: SkillLesson[];
}

interface TopicUserProgress {
    completionPct: number;
    lessonsCompleted: number;
    lessonsTotal: number;
    startedAt: string | null;
    lastAccessedAt: string | null;
}

interface SkillTopic {
    id: string;
    name: string;
    description: string | null;
    level: string | null;
    durationWeeks: number | null;
    lessonsTotal: number;
    userProgress: TopicUserProgress | null;
    subtopics: SkillSubtopic[];
}

interface ProfessionGroup {
    profession: { id: string; name: string; slug: string; iconKey: string | null };
    topics: SkillTopic[];
}

interface SectionTab {
    id: string;
    name: string;
    slug: string;
    tabLabel: string;
    activityType: string | null;
    isActive: boolean;
}

interface PageData {
    section: { id: string; name: string; slug: string; activityType: string | null; tabLabel: string };
    tabs: SectionTab[];
    profession_groups: ProfessionGroup[];
    modeling_fountains: SkillTopic[];
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

const DIFF_STYLE: Record<string, string> = {
    easy: "text-emerald-700 bg-emerald-50 border-emerald-200",
    medium: "text-amber-700 bg-amber-50 border-amber-200",
    hard: "text-red-600 bg-red-50 border-red-200",
};

// ─── Lesson Row ───────────────────────────────────────────────────────────────

function LessonRow({
    lesson,
    onStart,
    isLoading,
}: {
    lesson: SkillLesson;
    onStart: () => void;
    isLoading: boolean;
}) {
    const done = lesson.lessonProgress?.isCompleted ?? false;
    const inProgress = !done && (lesson.lessonProgress?.lessonCompletionPct ?? 0) > 0;
    const score = lesson.lessonProgress?.bestScorePct;

    return (
        <button
            onClick={onStart}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f0f7f7] active:bg-[#e6f0f0] transition-colors text-left group disabled:opacity-60"
        >
            {/* Status icon */}
            {done ? (
                <CheckCircle2 size={14} className="text-[#01696F] shrink-0" />
            ) : inProgress ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-[#01696F]/60 border-t-transparent animate-spin shrink-0" />
            ) : (
                <Circle size={14} className="text-zinc-300 shrink-0 group-hover:text-zinc-400 transition-colors" />
            )}

            {/* Lesson name */}
            <span className="flex-1 text-[13px] font-semibold text-zinc-800 leading-snug truncate">
                {lesson.name}
            </span>

            {/* Difficulty badge */}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${DIFF_STYLE[lesson.difficulty] ?? "text-zinc-500 bg-zinc-50 border-zinc-200"}`}>
                {lesson.difficulty}
            </span>

            {/* Best score */}
            {done && score != null && (
                <span className="text-[10px] font-extrabold text-[#01696F] bg-[#e6f4f4] px-1.5 py-0.5 rounded shrink-0">
                    {Math.round(score)}%
                </span>
            )}
        </button>
    );
}

// ─── Subtopic Block ───────────────────────────────────────────────────────────

function SubtopicBlock({
    subtopic,
    activityType,
    onLessonStart,
    loadingLessonId,
}: {
    subtopic: SkillSubtopic;
    activityType: string | null;
    onLessonStart: (lessonId: string) => void;
    loadingLessonId: string | null;
}) {
    if (subtopic.lessons.length === 0) return null;
    return (
        <div className="border border-dashed border-[#c8d5d5] rounded-xl overflow-hidden">
            {/* Subtopic header */}
            <div className="px-3 py-2 bg-[#f8fbfb] border-b border-dashed border-[#c8d5d5]">
                <p className="text-[12px] font-bold text-zinc-700">{subtopic.name}</p>
                {subtopic.description && (
                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5 leading-relaxed">{subtopic.description}</p>
                )}
            </div>
            {/* Lesson rows */}
            <div className="p-1.5 flex flex-col gap-0.5">
                {subtopic.lessons.map((lesson) => (
                    <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        onStart={() => onLessonStart(lesson.id)}
                        isLoading={loadingLessonId === lesson.id}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Topic Card ───────────────────────────────────────────────────────────────

function TopicCard({
    topic,
    activityType,
    onStart,
    onLessonStart,
    isStarting,
    loadingLessonId,
}: {
    topic: SkillTopic;
    activityType: string | null;
    onStart: (topicId: string) => void;
    onLessonStart: (lessonId: string, topicId: string) => void;
    isStarting: boolean;
    loadingLessonId: string | null;
}) {
    const [expanded, setExpanded] = useState(false);
    const progress = topic.userProgress;
    const pct = progress?.completionPct ?? 0;
    const started = pct > 0;
    const done = pct >= 100;

    const btnLabel = done ? "Review" : started ? "Resume" : "Start";

    return (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        {done && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#01696F] bg-[#e6f4f4] px-1.5 py-0.5 rounded mb-1.5">
                                <CheckCircle2 size={9} /> Complete
                            </span>
                        )}
                        <h4 className="text-[14px] font-extrabold text-zinc-900 leading-snug">{topic.name}</h4>
                        {topic.description && (
                            <p className="text-[11px] text-zinc-500 font-medium mt-1 leading-relaxed line-clamp-2">
                                {topic.description}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => setExpanded((p) => !p)}
                        className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-zinc-500 border border-zinc-200 rounded-lg px-2.5 py-1 hover:border-[#01696F]/30 hover:text-[#01696F] transition-colors"
                    >
                        {expanded ? "Collapse" : "Expand"}
                        <ChevronDown size={12} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                    </button>
                </div>

                {/* Progress bar */}
                {started && (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#01696F] rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-extrabold text-[#01696F] shrink-0">
                            {progress?.lessonsCompleted}/{progress?.lessonsTotal}
                        </span>
                    </div>
                )}

                {/* Expanded subtopics */}
                {expanded && (
                    <div className="flex flex-col gap-2 mt-1">
                        {topic.subtopics.map((subtopic) => (
                            <SubtopicBlock
                                key={subtopic.id}
                                subtopic={subtopic}
                                activityType={activityType}
                                onLessonStart={(lessonId) => onLessonStart(lessonId, topic.id)}
                                loadingLessonId={loadingLessonId}
                            />
                        ))}
                        {topic.subtopics.length === 0 && (
                            <p className="text-[11px] text-zinc-400 text-center py-2">No lessons available for this activity type.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                    <span>{topic.level ?? ""}</span>
                    {topic.durationWeeks != null && (
                        <div className="flex items-center gap-1">
                            <Clock size={11} />
                            <span>{topic.durationWeeks} {topic.durationWeeks === 1 ? "week" : "weeks"}</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => onStart(topic.id)}
                    disabled={isStarting}
                    className="w-full bg-[#01696F] hover:bg-[#015a5f] active:scale-[0.98] disabled:opacity-60 text-white font-bold text-[13px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    {isStarting ? (
                        <Loader2 size={13} className="animate-spin" />
                    ) : done ? (
                        <RotateCcw size={12} />
                    ) : (
                        <Play size={12} fill="currentColor" />
                    )}
                    {isStarting ? "Loading…" : btnLabel}
                </button>
            </div>
        </div>
    );
}

// ─── Profession Section ───────────────────────────────────────────────────────

function ProfessionSection({
    group,
    activityType,
    searchQuery,
    onStart,
    onLessonStart,
    startingTopicId,
    loadingLessonId,
}: {
    group: ProfessionGroup;
    activityType: string | null;
    searchQuery: string;
    onStart: (topicId: string) => void;
    onLessonStart: (lessonId: string, topicId: string) => void;
    startingTopicId: string | null;
    loadingLessonId: string | null;
}) {
    const [expanded, setExpanded] = useState(true);

    const q = searchQuery.trim().toLowerCase();
    const filteredTopics = q
        ? group.topics.filter(
            (t) =>
                t.name.toLowerCase().includes(q) ||
                t.subtopics.some(
                    (st) =>
                        st.name.toLowerCase().includes(q) ||
                        st.lessons.some((l) => l.name.toLowerCase().includes(q))
                )
        )
        : group.topics;

    if (filteredTopics.length === 0) return null;

    return (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <button
                onClick={() => setExpanded((p) => !p)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors text-left"
            >
                <div>
                    <h3 className="text-[15px] font-extrabold text-zinc-900">{group.profession.name}</h3>
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                        {filteredTopics.length} {filteredTopics.length === 1 ? "topic" : "topics"}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-zinc-500 border border-zinc-200 rounded-lg px-2.5 py-1">
                        {expanded ? "Collapse" : "Expand"}
                    </span>
                    <ChevronDown
                        size={16}
                        className={`text-zinc-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                    />
                </div>
            </button>

            {expanded && (
                <div className="px-5 pb-5 border-t border-zinc-100 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredTopics.map((topic) => (
                        <TopicCard
                            key={topic.id}
                            topic={topic}
                            activityType={activityType}
                            onStart={onStart}
                            onLessonStart={onLessonStart}
                            isStarting={startingTopicId === topic.id}
                            loadingLessonId={loadingLessonId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Page Content ────────────────────────────────────────────────────────

function SkillSectionTopicsContent() {
    const router = useRouter();
    const params = useParams();
    const slug = (params?.slug as string) || "quant_lab";

    const { getSkillSectionTopics, startSkillTopic, getRecentlyActiveTopic, toApiSlug } = useSkillData();

    const [pageData, setPageData] = useState<PageData | null>(null);
    const [recentlyActive, setRecentlyActive] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startingTopicId, setStartingTopicId] = useState<string | null>(null);
    const [loadingLessonId, setLoadingLessonId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch page data when slug changes
    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [data, recent] = await Promise.all([
                    getSkillSectionTopics(slug),
                    getRecentlyActiveTopic().catch(() => null),
                ]);
                if (!cancelled) {
                    setPageData(data);
                    setRecentlyActive(recent);
                }
            } catch (e) {
                if (!cancelled) setError("Failed to load skill section. Please try again.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchData();
        return () => { cancelled = true; };
    }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

    // Tab click → navigate to that section slug
    const handleTabClick = useCallback((tabSlug: string) => {
        if (tabSlug !== toApiSlug(slug)) router.push(`/skill-building/${tabSlug}`);
    }, [slug, router, toApiSlug]);

    // Start / resume a topic
    const handleStart = useCallback(async (topicId: string) => {
        if (startingTopicId || !pageData) return;
        const activityType = pageData.section.activityType ?? "mcq";
        setStartingTopicId(topicId);
        try {
            const result = await startSkillTopic(topicId, activityType);
            if (result?.navigateTo) router.push(result.navigateTo);
        } catch (e) {
            console.error("Failed to start topic:", e);
            setError("Failed to start. Please try again.");
        } finally {
            setStartingTopicId(null);
        }
    }, [startingTopicId, pageData, startSkillTopic, router]);

    // Navigate directly to a specific lesson (from expanded subtopic list)
    const handleLessonStart = useCallback((lessonId: string, topicId: string) => {
        if (!pageData) return;
        const actType = pageData.section.activityType ?? "mcq";
        setLoadingLessonId(lessonId);
        router.push(`/activity/${lessonId}?activity=${actType}&from=skill&topic=${topicId}`);
    }, [pageData, router]);

    // Resume recently active topic
    const handleResumeRecent = useCallback(async () => {
        if (!recentlyActive || startingTopicId) return;
        setStartingTopicId(recentlyActive.topicId);
        try {
            const result = await startSkillTopic(recentlyActive.topicId, recentlyActive.activityType);
            if (result?.navigateTo) router.push(result.navigateTo);
        } catch (e) {
            console.error("Failed to resume topic:", e);
        } finally {
            setStartingTopicId(null);
        }
    }, [recentlyActive, startingTopicId, startSkillTopic, router]);

    const activityType = pageData?.section?.activityType ?? null;
    const pageTitle = pageData?.section?.name ?? "Skill Building";

    const profGroups = pageData?.profession_groups || [];
    const modFountains = pageData?.modeling_fountains || [];

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-hidden bg-[#f5f3ef]">

            {/* ── Top bar ───────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-8 pt-7 pb-0 shrink-0">
                <h1 className="text-[26px] font-extrabold text-[#01696F] tracking-tight">{pageTitle}</h1>
                <div className="relative w-[300px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                    <input
                        type="text"
                        placeholder="Search topics, subtopics or lessons"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-full py-2 pl-10 pr-4 text-[12px] font-medium placeholder:text-zinc-400 text-zinc-700 outline-none focus:border-[#01696F]/40 focus:ring-2 focus:ring-[#01696F]/10 shadow-sm transition-all"
                    />
                </div>
            </div>

            {/* ── Activity-type tabs ────────────────────────────────────────────── */}
            {pageData?.tabs && pageData.tabs.length > 0 && (
                <div className="flex items-center gap-1 px-8 pt-5 shrink-0 border-b border-zinc-200 pb-0">
                    {pageData.tabs.map((tab) => (
                        <button
                            key={tab.slug}
                            onClick={() => handleTabClick(tab.slug)}
                            className={`relative px-4 py-2.5 text-[13px] font-bold transition-colors rounded-t-lg ${tab.isActive
                                    ? "text-[#01696F] bg-white border border-b-white border-zinc-200 -mb-px z-10"
                                    : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
                                }`}
                        >
                            {tab.tabLabel}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Scrollable content ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-8">

                {/* Resume banner */}
                {recentlyActive && recentlyActive.sectionSlug === toApiSlug(slug) && (
                    <div className="bg-gradient-to-r from-[#01696F] to-[#0d878f] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-md shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
                                <BookOpen className="w-5 h-5 text-white/80" />
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold text-white/60 uppercase tracking-widest">
                                    Resume where you left off
                                </p>
                                <p className="text-[14px] font-bold text-white mt-0.5">{recentlyActive.topicName}</p>
                                <p className="text-[11px] text-white/70 font-medium mt-0.5">
                                    {recentlyActive.lessonsCompleted} of {recentlyActive.lessonsTotal} lessons complete
                                    {recentlyActive.nextLesson && ` · Next: ${recentlyActive.nextLesson.lessonName}`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleResumeRecent}
                            disabled={!!startingTopicId}
                            className="shrink-0 bg-white text-[#01696F] font-bold text-[12px] px-5 py-2 rounded-xl hover:bg-zinc-50 active:scale-95 transition-all flex items-center gap-1.5 shadow disabled:opacity-60"
                        >
                            {startingTopicId ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} fill="currentColor" />}
                            Resume Practice
                        </button>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 shrink-0">
                        <AlertCircle size={16} />
                        <p className="text-[13px] font-semibold">{error}</p>
                    </div>
                )}

                {/* Loading state */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px] gap-2 text-zinc-400">
                        <Loader2 className="w-7 h-7 animate-spin" />
                        <span className="text-[12px] font-bold">Loading exercises…</span>
                    </div>
                ) : !pageData ? null : (
                    <>
                        {/* ── Search by Profession ──────────────────────────────────── */}
                        {profGroups.length > 0 && (
                            <section className="flex flex-col gap-4">
                                <h2 className="text-[16px] font-extrabold text-zinc-900 shrink-0">
                                    Search by Profession
                                </h2>
                                <div className="flex flex-col gap-4">
                                    {profGroups.map((group) => (
                                        <ProfessionSection
                                            key={group.profession.id}
                                            group={group}
                                            activityType={activityType}
                                            searchQuery={searchQuery}
                                            onStart={handleStart}
                                            onLessonStart={handleLessonStart}
                                            startingTopicId={startingTopicId}
                                            loadingLessonId={loadingLessonId}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── Modeling Fountains ────────────────────────────────────── */}
                        {modFountains.length > 0 && (() => {
                            const q = searchQuery.trim().toLowerCase();
                            const filteredMf = q
                                ? modFountains.filter(
                                    (t) =>
                                        t.name.toLowerCase().includes(q) ||
                                        t.subtopics.some(
                                            (st) =>
                                                st.name.toLowerCase().includes(q) ||
                                                st.lessons.some((l) => l.name.toLowerCase().includes(q))
                                        )
                                )
                                : modFountains;
                            if (filteredMf.length === 0) return null;
                            return (
                                <section className="flex flex-col gap-4">
                                    <h2 className="text-[16px] font-extrabold text-zinc-900 shrink-0">
                                        Modeling Fountains
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {filteredMf.map((topic) => (
                                            <TopicCard
                                                key={topic.id}
                                                topic={topic}
                                                activityType={activityType}
                                                onStart={handleStart}
                                                onLessonStart={handleLessonStart}
                                                isStarting={startingTopicId === topic.id}
                                                loadingLessonId={loadingLessonId}
                                            />
                                        ))}
                                    </div>
                                </section>
                            );
                        })()}

                        {/* Empty state */}
                        {profGroups.length === 0 && modFountains.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-zinc-300 rounded-2xl bg-white/40 text-center p-8">
                                <p className="text-sm font-bold text-zinc-600">No content found</p>
                                <p className="text-xs text-zinc-400 mt-1">
                                    {searchQuery ? "Try clearing your search." : "No exercises available for this section yet."}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function SkillSectionTopics() {
    return (
        <MainLayout>
            <Suspense
                fallback={
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-[#01696F]" />
                    </div>
                }
            >
                <SkillSectionTopicsContent />
            </Suspense>
        </MainLayout>
    );
}