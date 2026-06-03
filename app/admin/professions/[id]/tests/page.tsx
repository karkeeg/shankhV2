"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import {
    ArrowLeft, Plus, Trash2, Save, X, ShieldAlert,
    ChevronRight, ChevronDown, ChevronUp, Check, Clock,
    Target, BookOpen, Search, AlertCircle, CheckCircle2,
    Layers, Send, Lock, Eye, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profession {
    id: string;
    name: string;
    slug: string;
    description: string | null;
}

interface TypeConfig {
    activityType: "mcq" | "canvas" | "quantus";
    timeLimitMins: number;
}

interface SkillTest {
    id: string;
    name: string;
    description: string | null;
    isPublished: boolean;
    isActive: boolean;
    topicId: string | null;
    orderIndex: number;
    typeConfigs: TypeConfig[];
    itemCounts: { mcq: number; canvas: number; quantus: number };
}

interface SkillTopic {
    id: string;
    name: string;
    description: string | null;
    orderIndex: number;
    tests: SkillTest[];
}

interface AvailableActivity {
    activityId: string;
    activityType: "mcq" | "canvas" | "quantus";
    lessonId: string;
    lessonName: string;
    difficulty: string;
}

interface DraftSlot {
    activityType: "mcq" | "canvas" | "quantus";
    lessonId: string;
    activityId: string;
    lessonName: string;
    difficulty: string;
}

interface DraftEntry {
    mcq: DraftSlot[];
    canvas: DraftSlot[];
    quantus: DraftSlot[];
    timeLimits: { mcq: number; canvas: number; quantus: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACT_TABS = [
    { type: "mcq" as const, label: "MCQ", color: "bg-violet-50 text-violet-700 border-violet-200", default: 20 },
    { type: "canvas" as const, label: "Canvas", color: "bg-amber-50 text-amber-700 border-amber-200", default: 30 },
    { type: "quantus" as const, label: "Quantus", color: "bg-sky-50 text-sky-700 border-sky-200", default: 45 },
];

const DIFF_COLOR: Record<string, string> = {
    easy: "bg-emerald-50 text-emerald-600",
    medium: "bg-amber-50 text-amber-600",
    hard: "bg-rose-50 text-rose-600",
};

const EMPTY_DRAFT: DraftEntry = {
    mcq: [], canvas: [], quantus: [],
    timeLimits: { mcq: 20, canvas: 30, quantus: 45 },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfessionTestsAdmin() {
    const router = useRouter();
    const params = useParams();
    const professionId = params?.id as string;
    const token = useAuthStore((s) => s.token);

    const headers = useMemo<Record<string, string>>(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (token) h["Authorization"] = `Bearer ${token}`;
        return h;
    }, [token]);

    // ── Data ──────────────────────────────────────────────────────────────────
    const [profession, setProfession] = useState<Profession | null>(null);
    const [topics, setTopics] = useState<SkillTopic[]>([]);
    const [selectedTest, setSelectedTest] = useState<SkillTest | null>(null);

    // ── Draft state (frontend only — never written to DB until publish) ───────
    const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({});

    // ── UI ────────────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
    const [pickerType, setPickerType] = useState<"mcq" | "canvas" | "quantus">("mcq");

    // ── Modals ────────────────────────────────────────────────────────────────
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showDeleteTopic, setShowDeleteTopic] = useState<string | null>(null);
    const [showDeleteTest, setShowDeleteTest] = useState<string | null>(null);

    // ── Forms ─────────────────────────────────────────────────────────────────
    const [topicForm, setTopicForm] = useState({ name: "", description: "", orderIndex: 0 });
    const [testForm, setTestForm] = useState({ name: "", description: "", topicId: "", orderIndex: 0 });
    const [pickerSearch, setPickerSearch] = useState("");
    const [availableActs, setAvailableActs] = useState<AvailableActivity[]>([]);
    const [loadingPicker, setLoadingPicker] = useState(false);
    const [formError, setFormError] = useState("");

    // ── Toast ─────────────────────────────────────────────────────────────────
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const showToast = useCallback((type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        if (!professionId) return;
        setLoading(true);
        try {
            const [profRes, topicsRes] = await Promise.all([
                fetch(`${API}/api/v1/admin/professions`, { headers }),
                fetch(`${API}/api/v1/admin/skill/professions/${professionId}/topics`, { headers }),
            ]);
            const profData = await profRes.json();
            const topicsData = await topicsRes.json();

            const matched = (profData.data || []).find((p: Profession) => p.id === professionId);
            setProfession(matched || null);

            const topicList: SkillTopic[] = topicsData.data || [];
            setTopics(topicList);

            // Auto-expand first topic
            if (topicList.length > 0) {
                setExpandedTopics(new Set([topicList[0].id]));
            }

            // Keep selected test in sync after refetch
            if (selectedTest) {
                const refreshed = topicList
                    .flatMap(t => t.tests)
                    .find(t => t.id === selectedTest.id);
                setSelectedTest(refreshed || null);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [professionId, token]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Create topic ──────────────────────────────────────────────────────────
    const handleCreateTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topicForm.name.trim()) { setFormError("Name is required"); return; }
        setSaving(true); setFormError("");
        try {
            const res = await fetch(`${API}/api/v1/admin/skill/topics`, {
                method: "POST", headers,
                body: JSON.stringify({ professionId, ...topicForm }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || "Failed");
            setShowTopicModal(false);
            setTopicForm({ name: "", description: "", orderIndex: 0 });
            await fetchAll();
            showToast("success", "Topic created");
        } catch (e: any) { setFormError(e.message); }
        finally { setSaving(false); }
    };

    // ── Create test ───────────────────────────────────────────────────────────
    const handleCreateTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testForm.name.trim()) { setFormError("Test name is required"); return; }
        if (!testForm.topicId) { setFormError("Please select a topic"); return; }
        setSaving(true); setFormError("");
        try {
            const res = await fetch(`${API}/api/v1/admin/skill/tests`, {
                method: "POST", headers,
                body: JSON.stringify({ professionId, ...testForm }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || "Failed");
            setShowTestModal(false);
            setTestForm({ name: "", description: "", topicId: "", orderIndex: 0 });
            await fetchAll();
            showToast("success", "Test created — add activities and publish");
        } catch (e: any) { setFormError(e.message); }
        finally { setSaving(false); }
    };

    // ── Delete topic ──────────────────────────────────────────────────────────
    const handleDeleteTopic = async (id: string) => {
        try {
            await fetch(`${API}/api/v1/admin/skill/topics/${id}`, { method: "DELETE", headers });
            setShowDeleteTopic(null);
            if (selectedTest?.topicId === id) setSelectedTest(null);
            await fetchAll();
            showToast("success", "Topic deactivated");
        } catch (e: any) { showToast("error", e.message); }
    };

    // ── Delete test ───────────────────────────────────────────────────────────
    const handleDeleteTest = async (id: string) => {
        try {
            await fetch(`${API}/api/v1/admin/skill/tests/${id}`, { method: "DELETE", headers });
            setShowDeleteTest(null);
            if (selectedTest?.id === id) setSelectedTest(null);
            await fetchAll();
            showToast("success", "Test deactivated");
        } catch (e: any) { showToast("error", e.message); }
    };

    // ── Open picker ───────────────────────────────────────────────────────────
    const openPicker = async (type: "mcq" | "canvas" | "quantus") => {
        setPickerType(type);
        setPickerSearch("");
        setShowPickerModal(true);
        setLoadingPicker(true);
        try {
            const res = await fetch(
                `${API}/api/v1/admin/skill/professions/${professionId}/available-activities?activityType=${type}`,
                { headers }
            );
            const j = await res.json();
            setAvailableActs(j.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingPicker(false); }
    };

    // ── Draft: add activity (modal stays open for multi-add) ──────────────────
    const handleDraftAdd = (act: AvailableActivity) => {
        if (!selectedTest) return;
        setDrafts(prev => {
            const existing: DraftEntry = prev[selectedTest.id] || { ...EMPTY_DRAFT };
            // Prevent duplicate
            if (existing[act.activityType].some(s => s.activityId === act.activityId)) {
                return prev;
            }
            return {
                ...prev,
                [selectedTest.id]: {
                    ...existing,
                    [act.activityType]: [
                        ...existing[act.activityType],
                        {
                            activityType: act.activityType,
                            lessonId: act.lessonId,
                            activityId: act.activityId,
                            lessonName: act.lessonName,
                            difficulty: act.difficulty,
                        },
                    ],
                },
            };
        });
        // Remove from picker list to show it's been added
        setAvailableActs(prev => prev.filter(a => a.activityId !== act.activityId));
        showToast("success", `${act.lessonName} added`);
        // Modal stays open — admin can keep adding
    };

    // ── Draft: remove a specific activity ────────────────────────────────────
    const handleDraftRemove = (type: "mcq" | "canvas" | "quantus", activityId: string) => {
        if (!selectedTest) return;
        setDrafts(prev => {
            const existing = prev[selectedTest.id];
            if (!existing) return prev;
            return {
                ...prev,
                [selectedTest.id]: {
                    ...existing,
                    [type]: existing[type].filter(s => s.activityId !== activityId),
                },
            };
        });
    };

    // ── Draft: update shared time limit for a type ────────────────────────────
    const handleDraftTime = (type: "mcq" | "canvas" | "quantus", mins: number) => {
        if (!selectedTest) return;
        setDrafts(prev => {
            const existing = prev[selectedTest.id] || { ...EMPTY_DRAFT };
            return {
                ...prev,
                [selectedTest.id]: {
                    ...existing,
                    timeLimits: { ...existing.timeLimits, [type]: mins },
                },
            };
        });
    };

    // ── Publish ───────────────────────────────────────────────────────────────
    const handlePublish = async () => {
        if (!selectedTest) return;
        const draft = drafts[selectedTest.id] || EMPTY_DRAFT;
        const totalCount = draft.mcq.length + draft.canvas.length + draft.quantus.length;

        if (totalCount === 0) {
            showToast("error", "Add at least one activity before publishing");
            return;
        }

        setPublishing(true);
        try {
            // Flatten all slots into the items array with per-type timeLimitMins
            const items = [
                ...draft.mcq.map(s => ({ ...s, timeLimitMins: draft.timeLimits.mcq })),
                ...draft.canvas.map(s => ({ ...s, timeLimitMins: draft.timeLimits.canvas })),
                ...draft.quantus.map(s => ({ ...s, timeLimitMins: draft.timeLimits.quantus })),
            ];

            const res = await fetch(`${API}/api/v1/admin/skill/tests/${selectedTest.id}/publish`, {
                method: "POST", headers,
                body: JSON.stringify({ items }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || "Failed to publish");

            // Clear draft for this test
            setDrafts(prev => {
                const copy = { ...prev };
                delete copy[selectedTest.id];
                return copy;
            });
            setShowPublishModal(false);
            await fetchAll();
            showToast("success", "Test published and locked");
        } catch (e: any) {
            showToast("error", e.message);
        } finally {
            setPublishing(false);
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const selectedDraft: DraftEntry = selectedTest
        ? (drafts[selectedTest.id] || EMPTY_DRAFT)
        : EMPTY_DRAFT;

    const draftCount = selectedDraft.mcq.length + selectedDraft.canvas.length + selectedDraft.quantus.length;
    const filteredPicker = availableActs.filter(a =>
        a.lessonName.toLowerCase().includes(pickerSearch.toLowerCase())
    );

    const toggleTopic = (id: string) => {
        setExpandedTopics(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <MainLayout>
            <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-y-auto p-8 gap-6 animate-fade-in bg-gradient-to-br from-[#fcfcfb] to-[#f5f3ee]">

                {/* ── Toast ── */}
                {toast && (
                    <div className={cn(
                        "fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-fade-in",
                        toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                    )}>
                        {toast.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                        {toast.msg}
                    </div>
                )}

                {/* ── Header ── */}
                <div className="flex flex-col gap-3 shrink-0">
                    <button
                        onClick={() => router.push("/admin/professions")}
                        className="flex items-center gap-2 text-xs font-bold text-[#01696F]/80 hover:text-[#01696F] transition-colors w-fit group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to Professions
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#01696F]/10 pb-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">
                                Skill Building
                            </span>
                            <h1 className="text-2xl font-black text-[#01696F] tracking-tight">
                                {profession?.name || "…"} — Topics & Tests
                            </h1>
                            <p className="text-xs text-zinc-500 font-medium">
                                Create topics, add tests, pick activities per type, then publish.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setTopicForm({ name: "", description: "", orderIndex: topics.length });
                                    setFormError("");
                                    setShowTopicModal(true);
                                }}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#01696F]/30 text-[#01696F] text-xs font-bold rounded-xl shadow-sm transition-all hover:bg-[#E6F0F1] active:scale-[0.98]"
                            >
                                <Plus size={14} /> Add Topic
                            </button>
                            <button
                                onClick={() => {
                                    setTestForm({ name: "", description: "", topicId: topics[0]?.id || "", orderIndex: 0 });
                                    setFormError("");
                                    setShowTestModal(true);
                                }}
                                disabled={topics.length === 0}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Plus size={14} /> Create Test
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Two-column layout ── */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[500px]">

                    {/* ── LEFT: Topics + Tests tree (5 cols) ── */}
                    <div className="lg:col-span-5 flex flex-col gap-3">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                            Topics ({topics.length})
                        </h3>

                        {loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center bg-white border border-zinc-200/60 rounded-3xl p-10 min-h-[300px]">
                                <div className="w-6 h-6 border-4 border-[#01696F] border-t-transparent rounded-full animate-spin" />
                                <p className="text-[11px] text-zinc-400 font-bold mt-2 animate-pulse">Loading…</p>
                            </div>
                        ) : topics.length === 0 ? (
                            <div className="flex flex-col items-center justify-center bg-white border border-dashed border-zinc-200 rounded-3xl p-10 text-center min-h-[300px]">
                                <Layers size={28} className="text-zinc-300 mb-2" />
                                <h4 className="text-xs font-extrabold text-zinc-500">No Topics Yet</h4>
                                <p className="text-[10px] text-zinc-400 mt-1 max-w-[180px]">
                                    Create a topic first, then add tests inside it.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1">
                                {topics.map(topic => {
                                    const isExpanded = expandedTopics.has(topic.id);
                                    const publishedCount = topic.tests.filter(t => t.isPublished).length;

                                    return (
                                        <div key={topic.id} className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden">

                                            {/* Topic header */}
                                            <div
                                                onClick={() => toggleTopic(topic.id)}
                                                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50/50 transition-colors select-none"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {isExpanded
                                                        ? <ChevronUp size={14} className="text-zinc-400 shrink-0" />
                                                        : <ChevronDown size={14} className="text-zinc-400 shrink-0" />
                                                    }
                                                    <span className="text-xs font-extrabold text-zinc-800 truncate">{topic.name}</span>
                                                    <span className="text-[9px] font-black text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full shrink-0">
                                                        {publishedCount}/{topic.tests.length}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={e => { e.stopPropagation(); setShowDeleteTopic(topic.id); }}
                                                    className="p-1 hover:bg-rose-50 rounded-lg text-zinc-300 hover:text-rose-500 transition-colors shrink-0"
                                                    title="Deactivate topic"
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>

                                            {/* Tests list inside topic */}
                                            {isExpanded && (
                                                <div className="border-t border-zinc-100 px-3 py-2 flex flex-col gap-1.5 bg-zinc-50/30">
                                                    {topic.tests.length === 0 ? (
                                                        <p className="text-[10px] text-zinc-400 italic py-2 text-center">
                                                            No tests — click "Create Test" and select this topic
                                                        </p>
                                                    ) : (
                                                        topic.tests.map(test => {
                                                            const isSelected = selectedTest?.id === test.id;
                                                            const draftEntry = drafts[test.id];
                                                            const hasDraft = !test.isPublished && draftEntry
                                                                ? (draftEntry.mcq.length + draftEntry.canvas.length + draftEntry.quantus.length) > 0
                                                                : false;
                                                            const ic = test.itemCounts ?? { mcq: 0, canvas: 0, quantus: 0 };
                                                            const totalItems = ic.mcq + ic.canvas + ic.quantus;
                                                            return (
                                                                <div
                                                                    key={test.id}
                                                                    onClick={() => setSelectedTest(test)}
                                                                    className={cn(
                                                                        "flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all group",
                                                                        isSelected
                                                                            ? "bg-[#E6F0F1]/60 border-[#01696F]/40 shadow-sm"
                                                                            : "border-zinc-200/60 hover:border-zinc-300 hover:bg-white/60"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                        {test.isPublished
                                                                            ? <Lock size={10} className="text-emerald-500 shrink-0" />
                                                                            : <Eye size={10} className="text-amber-500 shrink-0" />
                                                                        }
                                                                        <span className="text-xs font-semibold text-zinc-700 truncate">
                                                                            {test.name}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        {hasDraft && (
                                                                            <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                                                                Draft
                                                                            </span>
                                                                        )}
                                                                        {test.isPublished && (
                                                                            <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                                                                Live · {totalItems}
                                                                            </span>
                                                                        )}
                                                                        <button
                                                                            onClick={e => { e.stopPropagation(); setShowDeleteTest(test.id); }}
                                                                            className="p-1 hover:bg-rose-50 rounded-lg text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                                                        >
                                                                            <Trash2 size={10} />
                                                                        </button>
                                                                        {isSelected && (
                                                                            <ChevronRight size={13} className="text-[#01696F]" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Test detail / draft builder (7 cols) ── */}
                    <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-3xl p-6 flex flex-col gap-5 min-h-[400px]">

                        {!selectedTest ? (
                            /* Empty state */
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <Target size={36} className="text-zinc-200 mb-2" />
                                <h4 className="text-xs font-extrabold text-zinc-500">Select a Test</h4>
                                <p className="text-[10px] text-zinc-400 mt-1 max-w-[200px]">
                                    Choose a test from the left panel to manage its activities.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Test header */}
                                <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-4 shrink-0">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {selectedTest.isPublished
                                                ? <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><Lock size={9} /> Published</span>
                                                : <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><Eye size={9} /> Draft</span>
                                            }
                                        </div>
                                        <h2 className="text-base font-extrabold text-zinc-800 tracking-tight">{selectedTest.name}</h2>
                                        {selectedTest.description && (
                                            <p className="text-xs text-zinc-400 font-medium mt-0.5">{selectedTest.description}</p>
                                        )}
                                    </div>

                                    {!selectedTest.isPublished && draftCount > 0 && (
                                        <button
                                            onClick={() => setShowPublishModal(true)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 shrink-0"
                                        >
                                            <Send size={13} /> Publish
                                        </button>
                                    )}
                                </div>

                                {selectedTest.isPublished ? (
                                    /* ── PUBLISHED VIEW: read-only ── */
                                    <div className="flex flex-col gap-4 flex-1">
                                        <div className="grid grid-cols-3 gap-3">
                                            {ACT_TABS.map(({ type, label, color }) => {
                                                const count = selectedTest.itemCounts[type];
                                                const cfg = selectedTest.typeConfigs.find(c => c.activityType === type);
                                                return (
                                                    <div key={type} className={cn("border rounded-2xl p-4 text-center", count === 0 ? "bg-zinc-50 border-zinc-100 opacity-40" : "bg-zinc-50 border-zinc-100")}>
                                                        <span className={cn("inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border mb-2", color)}>
                                                            {label}
                                                        </span>
                                                        <p className="text-xl font-black text-zinc-800">{count}</p>
                                                        <p className="text-[9px] text-zinc-400 font-bold mt-0.5">
                                                            {count === 0 ? "not included" : `${cfg?.timeLimitMins ?? "—"}m timer`}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-start gap-3">
                                            <Lock size={14} className="text-zinc-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-zinc-700">Test is live and locked</p>
                                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                                    Users can start sessions. Activities and timers cannot be changed.
                                                    Deactivate the test and create a new one to make changes.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── DRAFT VIEW: activity builder ── */
                                    <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between shrink-0">
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                                Add activities — multiple per type
                                            </p>
                                            <p className="text-[10px] text-[#01696F] font-bold">
                                                {draftCount} added
                                            </p>
                                        </div>

                                        {/* Activity type sections */}
                                        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
                                            {ACT_TABS.map(({ type, label, color, default: defMins }) => {
                                                const slots = selectedDraft[type];
                                                const timeLimit = selectedDraft.timeLimits[type];

                                                return (
                                                    <div
                                                        key={type}
                                                        className={cn(
                                                            "border rounded-2xl p-4 transition-all",
                                                            slots.length > 0
                                                                ? "border-[#01696F]/25 bg-[#E6F0F1]/15"
                                                                : "border-zinc-200 bg-zinc-50/30"
                                                        )}
                                                    >
                                                        {/* Type header */}
                                                        <div className="flex items-center justify-between gap-3 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border", color)}>
                                                                    {label}
                                                                </span>
                                                                <span className="text-[9px] text-zinc-400 font-bold">
                                                                    {slots.length} {slots.length === 1 ? "activity" : "activities"}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                {/* Shared time limit for this type */}
                                                                <div className="flex items-center gap-1.5">
                                                                    <Clock size={11} className="text-zinc-400" />
                                                                    <input
                                                                        type="number" min={1} max={180}
                                                                        value={timeLimit}
                                                                        onChange={e => handleDraftTime(type, parseInt(e.target.value) || defMins)}
                                                                        className="w-14 px-2 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-center outline-none focus:border-[#01696F]/40"
                                                                        title="Timer for all activities of this type"
                                                                    />
                                                                    <span className="text-[9px] text-zinc-400 font-bold">mins</span>
                                                                </div>

                                                                <button
                                                                    onClick={() => openPicker(type)}
                                                                    className="flex items-center gap-1 px-3 py-1.5 bg-[#01696F]/10 hover:bg-[#01696F] text-[#01696F] hover:text-white text-[10px] font-black rounded-xl transition-all active:scale-95"
                                                                >
                                                                    <Plus size={11} /> Add
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Activity slots */}
                                                        {slots.length === 0 ? (
                                                            <p className="text-[10px] text-zinc-400 italic">
                                                                No {label} activities yet — click Add
                                                            </p>
                                                        ) : (
                                                            <div className="flex flex-col gap-1.5">
                                                                {slots.map((slot, idx) => (
                                                                    <div
                                                                        key={slot.activityId}
                                                                        className="flex items-center gap-3 px-3 py-2 bg-white border border-zinc-100 rounded-xl group"
                                                                    >
                                                                        <span className="text-[9px] font-black text-zinc-400 w-4 shrink-0 text-center">
                                                                            {idx + 1}
                                                                        </span>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-bold text-zinc-800 truncate">{slot.lessonName}</p>
                                                                            <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full", DIFF_COLOR[slot.difficulty])}>
                                                                                {slot.difficulty}
                                                                            </span>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleDraftRemove(type, slot.activityId)}
                                                                            className="p-1 hover:bg-rose-50 rounded-lg text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Publish CTA */}
                                        {draftCount > 0 && (
                                            <button
                                                onClick={() => setShowPublishModal(true)}
                                                className="w-full py-3 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-black rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 shrink-0"
                                            >
                                                <Send size={14} />
                                                Publish Test ({draftCount} {draftCount === 1 ? "activity" : "activities"})
                                            </button>
                                        )}

                                        <p className="text-[10px] text-zinc-400 text-center leading-relaxed shrink-0">
                                            Draft is not saved to DB — refreshing clears it.<br />
                                            Once published, activities are locked.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════════════
            MODAL: Create Topic
        ════════════════════════════════════════════════════════════════════ */}
                {showTopicModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-md mx-4">
                            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                                <h3 className="text-base font-extrabold text-[#01696F] tracking-tight">Create Skill Topic</h3>
                                <button onClick={() => setShowTopicModal(false)} className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleCreateTopic} className="p-6 space-y-4">
                                {formError && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                                        <ShieldAlert size={13} /> {formError}
                                    </div>
                                )}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Topic Name *</label>
                                    <input
                                        type="text" required
                                        placeholder="e.g. Financial Statements"
                                        value={topicForm.name}
                                        onChange={e => setTopicForm(p => ({ ...p, name: e.target.value }))}
                                        className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#01696F]/50 transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                                    <textarea
                                        placeholder="What this topic covers…"
                                        value={topicForm.description}
                                        onChange={e => setTopicForm(p => ({ ...p, description: e.target.value }))}
                                        rows={2}
                                        className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none resize-none focus:bg-white focus:border-[#01696F]/50 transition-all"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                                    <button type="button" onClick={() => setShowTopicModal(false)} className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500">Cancel</button>
                                    <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#01696F] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50">
                                        <Save size={13} /> {saving ? "Creating…" : "Create Topic"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════════
            MODAL: Create Test
        ════════════════════════════════════════════════════════════════════ */}
                {showTestModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-md mx-4">
                            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                                <h3 className="text-base font-extrabold text-[#01696F] tracking-tight">Create Skill Test</h3>
                                <button onClick={() => setShowTestModal(false)} className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleCreateTest} className="p-6 space-y-4">
                                {formError && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                                        <ShieldAlert size={13} /> {formError}
                                    </div>
                                )}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Test Name *</label>
                                    <input
                                        type="text" required
                                        placeholder="e.g. FS Fundamentals Test"
                                        value={testForm.name}
                                        onChange={e => setTestForm(p => ({ ...p, name: e.target.value }))}
                                        className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#01696F]/50 transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Topic *</label>
                                    <select
                                        value={testForm.topicId}
                                        onChange={e => setTestForm(p => ({ ...p, topicId: e.target.value }))}
                                        className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#01696F]/50"
                                    >
                                        <option value="">Select a topic…</option>
                                        {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                                    <textarea
                                        placeholder="What this test covers…"
                                        value={testForm.description}
                                        onChange={e => setTestForm(p => ({ ...p, description: e.target.value }))}
                                        rows={2}
                                        className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none resize-none focus:bg-white focus:border-[#01696F]/50 transition-all"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                                    <button type="button" onClick={() => setShowTestModal(false)} className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500">Cancel</button>
                                    <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#01696F] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50">
                                        <Save size={13} /> {saving ? "Creating…" : "Create Test"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════════
            MODAL: Activity Picker
        ════════════════════════════════════════════════════════════════════ */}
                {showPickerModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
                            <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
                                <div>
                                    <h3 className="text-base font-extrabold text-[#01696F] tracking-tight">
                                        Add {ACT_TABS.find(t => t.type === pickerType)?.label} Activities
                                    </h3>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">
                                        Tagged to {profession?.name} · not in any published test
                                    </p>
                                </div>
                                <button onClick={() => setShowPickerModal(false)} className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400"><X size={16} /></button>
                            </div>

                            {/* Type tabs inside picker */}
                            <div className="flex gap-2 px-6 pt-4 shrink-0">
                                {ACT_TABS.map(({ type, label }) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setPickerSearch("");
                                            openPicker(type);
                                        }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                                            pickerType === type
                                                ? "bg-[#01696F] text-white shadow-sm"
                                                : "bg-zinc-50 border border-zinc-200 text-zinc-500 hover:border-[#01696F]/30"
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            <div className="px-6 py-3 shrink-0">
                                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                                    <Search size={13} className="text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Search lessons…"
                                        value={pickerSearch}
                                        onChange={e => setPickerSearch(e.target.value)}
                                        className="flex-1 bg-transparent text-xs font-medium outline-none placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>

                            {/* Already added notice */}
                            {selectedTest && (drafts[selectedTest.id]?.[pickerType]?.length ?? 0) > 0 && (
                                <div className="px-6 pb-2 shrink-0">
                                    <p className="text-[10px] text-[#01696F] font-bold bg-[#E6F0F1]/50 border border-[#01696F]/10 rounded-xl px-3 py-2">
                                        {drafts[selectedTest.id]?.[pickerType]?.length} already added to this test
                                    </p>
                                </div>
                            )}

                            {/* Activity list */}
                            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
                                {loadingPicker ? (
                                    <div className="flex items-center justify-center py-12 gap-2 text-zinc-400">
                                        <div className="w-5 h-5 border-4 border-[#01696F] border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs font-bold">Loading activities…</span>
                                    </div>
                                ) : filteredPicker.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <CheckCircle2 size={24} className="text-zinc-300 mb-2" />
                                        <p className="text-xs font-bold text-zinc-500">
                                            {availableActs.length === 0
                                                ? "All activities for this profession are in published tests"
                                                : "No matches for your search"
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    filteredPicker.map(act => {
                                        const alreadyInDraft = selectedTest
                                            ? (drafts[selectedTest.id]?.[act.activityType] || []).some(s => s.activityId === act.activityId)
                                            : false;

                                        return (
                                            <div
                                                key={act.activityId}
                                                className={cn(
                                                    "flex items-center justify-between gap-3 p-3 border rounded-xl transition-all",
                                                    alreadyInDraft
                                                        ? "bg-emerald-50/50 border-emerald-200 opacity-60"
                                                        : "bg-zinc-50/50 border-zinc-200/80 hover:border-[#01696F]/30 hover:bg-[#E6F0F1]/20"
                                                )}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-zinc-800 truncate">{act.lessonName}</p>
                                                    <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full", DIFF_COLOR[act.difficulty])}>
                                                        {act.difficulty}
                                                    </span>
                                                </div>
                                                {alreadyInDraft ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 shrink-0">
                                                        <CheckCircle2 size={12} /> Added
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDraftAdd(act)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-[#01696F] hover:bg-[#015257] text-white text-[10px] font-black rounded-xl transition-all active:scale-95 shrink-0"
                                                    >
                                                        <Plus size={11} /> Add
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════════
            MODAL: Publish Confirm
        ════════════════════════════════════════════════════════════════════ */}
                {showPublishModal && selectedTest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white border border-zinc-200 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#E6F0F1] rounded-xl shrink-0"><Send size={20} className="text-[#01696F]" /></div>
                                <div>
                                    <h3 className="text-base font-black text-zinc-900 leading-tight">Publish "{selectedTest.name}"?</h3>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">This cannot be undone</p>
                                </div>
                            </div>

                            {/* Summary of what's being published */}
                            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 space-y-3">
                                {ACT_TABS.map(({ type, label, color }) => {
                                    const slots = selectedDraft[type];
                                    if (slots.length === 0) return null;
                                    return (
                                        <div key={type}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase border", color)}>
                                                    {label}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 font-bold">
                                                    {selectedDraft.timeLimits[type]}m · {slots.length} {slots.length === 1 ? "activity" : "activities"}
                                                </span>
                                            </div>
                                            {slots.map(s => (
                                                <div key={s.activityId} className="flex items-center gap-2 pl-2 py-0.5">
                                                    <div className="w-1 h-1 rounded-full bg-zinc-300 shrink-0" />
                                                    <span className="text-[10px] text-zinc-600 font-semibold truncate">{s.lessonName}</span>
                                                    <span className={cn("text-[9px] font-black uppercase shrink-0", DIFF_COLOR[s.difficulty].split(" ")[1])}>
                                                        {s.difficulty}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                Once published, this test is <strong>locked</strong>. Activities and time limits cannot be changed. Users can start sessions immediately.
                            </p>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowPublishModal(false)}
                                    className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePublish}
                                    disabled={publishing}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition-all"
                                >
                                    {publishing
                                        ? <><Loader2 size={13} className="animate-spin" /> Publishing…</>
                                        : <><Send size={13} /> Publish & Lock</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════════
            MODAL: Delete Topic Confirm
        ════════════════════════════════════════════════════════════════════ */}
                {showDeleteTopic && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white border border-zinc-200 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-rose-600">
                                <div className="p-2.5 bg-rose-50 rounded-xl"><ShieldAlert size={20} /></div>
                                <h3 className="text-base font-black">Deactivate Topic?</h3>
                            </div>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                All tests under this topic will be hidden. Existing user sessions and progress are preserved.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button onClick={() => setShowDeleteTopic(null)} className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500">Cancel</button>
                                <button onClick={() => handleDeleteTopic(showDeleteTopic)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all">Deactivate</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════════
            MODAL: Delete Test Confirm
        ════════════════════════════════════════════════════════════════════ */}
                {showDeleteTest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white border border-zinc-200 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-rose-600">
                                <div className="p-2.5 bg-rose-50 rounded-xl"><ShieldAlert size={20} /></div>
                                <h3 className="text-base font-black">Deactivate Test?</h3>
                            </div>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                This hides the test from users. Existing sessions and scores are preserved.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button onClick={() => setShowDeleteTest(null)} className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500">Cancel</button>
                                <button onClick={() => handleDeleteTest(showDeleteTest)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all">Deactivate</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </MainLayout>
    );
}