"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { api } from "@/lib/api";
import { useToastStore } from "@/lib/toast-store";
import {
  AdminPageHeader, AdminButton, Modal, Field, Input, Textarea, Select, FormAlert, ConfirmDialog, EmptyState,
} from "@/components/admin/ui";
import {
  Plus, Trash2, X, ChevronRight, ChevronDown, ChevronUp, Clock,
  Target, Search, CheckCircle2, Layers, Send, Lock, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profession { id: string; name: string; slug: string; description: string | null; }
interface TypeConfig { activityType: "mcq" | "canvas" | "quantus"; timeLimitMins: number; }
interface SkillTest {
  id: string; name: string; description: string | null; isPublished: boolean; isActive: boolean;
  topicId: string | null; orderIndex: number; typeConfigs: TypeConfig[];
  itemCounts: { mcq: number; canvas: number; quantus: number };
}
interface SkillTopic { id: string; name: string; description: string | null; orderIndex: number; tests: SkillTest[]; }
interface AvailableActivity {
  activityId: string; activityType: "mcq" | "canvas" | "quantus"; lessonId: string; lessonName: string; difficulty: string;
}
interface DraftSlot {
  activityType: "mcq" | "canvas" | "quantus"; lessonId: string; activityId: string; lessonName: string; difficulty: string;
}
interface DraftEntry {
  mcq: DraftSlot[]; canvas: DraftSlot[]; quantus: DraftSlot[];
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
const EMPTY_DRAFT: DraftEntry = { mcq: [], canvas: [], quantus: [], timeLimits: { mcq: 20, canvas: 30, quantus: 45 } };

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfessionTestsAdmin() {
  const router = useRouter();
  const params = useParams();
  const professionId = params?.id as string;
  const showToast = useToastStore((s) => s.showToast);

  const [profession, setProfession] = useState<Profession | null>(null);
  const [topics, setTopics] = useState<SkillTopic[]>([]);
  const [selectedTest, setSelectedTest] = useState<SkillTest | null>(null);

  // Draft state (frontend only — never written to DB until publish)
  const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [pickerType, setPickerType] = useState<"mcq" | "canvas" | "quantus">("mcq");

  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDeleteTopic, setShowDeleteTopic] = useState<string | null>(null);
  const [showDeleteTest, setShowDeleteTest] = useState<string | null>(null);

  const [topicForm, setTopicForm] = useState({ name: "", description: "", orderIndex: 0 });
  const [testForm, setTestForm] = useState({ name: "", description: "", topicId: "", orderIndex: 0 });
  const [pickerSearch, setPickerSearch] = useState("");
  const [availableActs, setAvailableActs] = useState<AvailableActivity[]>([]);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const [formError, setFormError] = useState("");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!professionId) return;
    setLoading(true);
    try {
      const [profs, topicList] = await Promise.all([
        api.get<Profession[]>("/api/v1/admin/professions"),
        api.get<SkillTopic[]>(`/api/v1/admin/skill/professions/${professionId}/topics`),
      ]);
      setProfession((profs ?? []).find((p) => p.id === professionId) ?? null);
      setTopics(topicList ?? []);
      if ((topicList ?? []).length > 0) setExpandedTopics((prev) => (prev.size ? prev : new Set([topicList[0].id])));
      setSelectedTest((prev) => (prev ? (topicList ?? []).flatMap((t) => t.tests).find((t) => t.id === prev.id) ?? null : null));
    } catch (e: any) {
      showToast(e?.message || "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [professionId, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Create topic / test ─────────────────────────────────────────────────────
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.name.trim()) return setFormError("Name is required");
    setSaving(true); setFormError("");
    try {
      await api.post("/api/v1/admin/skill/topics", { professionId, ...topicForm });
      setShowTopicModal(false);
      setTopicForm({ name: "", description: "", orderIndex: 0 });
      await fetchAll();
      showToast("Topic created", "success");
    } catch (e: any) { setFormError(e?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.name.trim()) return setFormError("Test name is required");
    if (!testForm.topicId) return setFormError("Please select a topic");
    setSaving(true); setFormError("");
    try {
      await api.post("/api/v1/admin/skill/tests", { professionId, ...testForm });
      setShowTestModal(false);
      setTestForm({ name: "", description: "", topicId: "", orderIndex: 0 });
      await fetchAll();
      showToast("Test created — add activities and publish", "success");
    } catch (e: any) { setFormError(e?.message || "Failed"); }
    finally { setSaving(false); }
  };

  // ── Delete topic / test ─────────────────────────────────────────────────────
  const handleDeleteTopic = async (id: string) => {
    try {
      await api.del(`/api/v1/admin/skill/topics/${id}`);
      setShowDeleteTopic(null);
      if (selectedTest?.topicId === id) setSelectedTest(null);
      await fetchAll();
      showToast("Topic deactivated", "success");
    } catch (e: any) { showToast(e?.message || "Failed", "error"); }
  };

  const handleDeleteTest = async (id: string) => {
    try {
      await api.del(`/api/v1/admin/skill/tests/${id}`);
      setShowDeleteTest(null);
      if (selectedTest?.id === id) setSelectedTest(null);
      await fetchAll();
      showToast("Test deactivated", "success");
    } catch (e: any) { showToast(e?.message || "Failed", "error"); }
  };

  // ── Picker ──────────────────────────────────────────────────────────────────
  const openPicker = async (type: "mcq" | "canvas" | "quantus") => {
    setPickerType(type);
    setPickerSearch("");
    setShowPickerModal(true);
    setLoadingPicker(true);
    try {
      const data = await api.get<AvailableActivity[]>(
        `/api/v1/admin/skill/professions/${professionId}/available-activities?activityType=${type}`,
      );
      setAvailableActs(data ?? []);
    } catch (e: any) {
      showToast(e?.message || "Failed to load activities", "error");
    } finally {
      setLoadingPicker(false);
    }
  };

  // ── Draft mutations ─────────────────────────────────────────────────────────
  const handleDraftAdd = (act: AvailableActivity) => {
    if (!selectedTest) return;
    setDrafts((prev) => {
      const existing: DraftEntry = prev[selectedTest.id] || { ...EMPTY_DRAFT };
      if (existing[act.activityType].some((s) => s.activityId === act.activityId)) return prev;
      return {
        ...prev,
        [selectedTest.id]: {
          ...existing,
          [act.activityType]: [
            ...existing[act.activityType],
            { activityType: act.activityType, lessonId: act.lessonId, activityId: act.activityId, lessonName: act.lessonName, difficulty: act.difficulty },
          ],
        },
      };
    });
    setAvailableActs((prev) => prev.filter((a) => a.activityId !== act.activityId));
    showToast(`${act.lessonName} added`, "success");
  };

  const handleDraftRemove = (type: "mcq" | "canvas" | "quantus", activityId: string) => {
    if (!selectedTest) return;
    setDrafts((prev) => {
      const existing = prev[selectedTest.id];
      if (!existing) return prev;
      return { ...prev, [selectedTest.id]: { ...existing, [type]: existing[type].filter((s) => s.activityId !== activityId) } };
    });
  };

  const handleDraftTime = (type: "mcq" | "canvas" | "quantus", mins: number) => {
    if (!selectedTest) return;
    setDrafts((prev) => {
      const existing = prev[selectedTest.id] || { ...EMPTY_DRAFT };
      return { ...prev, [selectedTest.id]: { ...existing, timeLimits: { ...existing.timeLimits, [type]: mins } } };
    });
  };

  // ── Publish ───────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!selectedTest) return;
    const draft = drafts[selectedTest.id] || EMPTY_DRAFT;
    const totalCount = draft.mcq.length + draft.canvas.length + draft.quantus.length;
    if (totalCount === 0) return showToast("Add at least one activity before publishing", "error");

    setPublishing(true);
    try {
      const items = [
        ...draft.mcq.map((s) => ({ ...s, timeLimitMins: draft.timeLimits.mcq })),
        ...draft.canvas.map((s) => ({ ...s, timeLimitMins: draft.timeLimits.canvas })),
        ...draft.quantus.map((s) => ({ ...s, timeLimitMins: draft.timeLimits.quantus })),
      ];
      await api.post(`/api/v1/admin/skill/tests/${selectedTest.id}/publish`, { items });
      setDrafts((prev) => {
        const copy = { ...prev };
        delete copy[selectedTest.id];
        return copy;
      });
      setShowPublishModal(false);
      await fetchAll();
      showToast("Test published and locked", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to publish", "error");
    } finally {
      setPublishing(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedDraft: DraftEntry = selectedTest ? drafts[selectedTest.id] || EMPTY_DRAFT : EMPTY_DRAFT;
  const draftCount = selectedDraft.mcq.length + selectedDraft.canvas.length + selectedDraft.quantus.length;
  const filteredPicker = availableActs.filter((a) => a.lessonName.toLowerCase().includes(pickerSearch.toLowerCase()));

  const toggleTopic = (id: string) =>
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-y-auto p-8 gap-6 animate-fade-in">
        <AdminPageHeader
          back={{ label: "Back to Professions", href: "/admin/professions" }}
          eyebrow="Skill Building"
          title={`${profession?.name || "…"} — Topics & Tests`}
          subtitle="Create topics, add tests, pick activities per type, then publish."
          actions={
            <>
              <AdminButton
                variant="outline"
                icon={Plus}
                onClick={() => {
                  setTopicForm({ name: "", description: "", orderIndex: topics.length });
                  setFormError("");
                  setShowTopicModal(true);
                }}
              >
                Add Topic
              </AdminButton>
              <AdminButton
                icon={Plus}
                disabled={topics.length === 0}
                onClick={() => {
                  setTestForm({ name: "", description: "", topicId: topics[0]?.id || "", orderIndex: 0 });
                  setFormError("");
                  setShowTestModal(true);
                }}
              >
                Create Test
              </AdminButton>
            </>
          }
        />

        {/* Two-column layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[500px]">
          {/* LEFT: Topics + Tests tree */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Topics ({topics.length})</h3>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white border border-zinc-200/60 rounded-3xl p-10 min-h-[300px]">
                <div className="w-6 h-6 border-4 border-[#01696F] border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] text-zinc-400 font-bold mt-2 animate-pulse">Loading…</p>
              </div>
            ) : topics.length === 0 ? (
              <div className="flex-1 bg-white border border-dashed border-zinc-200 rounded-3xl min-h-[300px] flex items-center">
                <EmptyState icon={Layers} size="sm" title="No Topics Yet" description="Create a topic first, then add tests inside it." className="w-full" />
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1">
                {topics.map((topic) => {
                  const isExpanded = expandedTopics.has(topic.id);
                  const publishedCount = topic.tests.filter((t) => t.isPublished).length;
                  return (
                    <div key={topic.id} className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden">
                      <div
                        onClick={() => toggleTopic(topic.id)}
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50/50 transition-colors select-none"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isExpanded ? <ChevronUp size={14} className="text-zinc-400 shrink-0" /> : <ChevronDown size={14} className="text-zinc-400 shrink-0" />}
                          <span className="text-xs font-extrabold text-zinc-800 truncate">{topic.name}</span>
                          <span className="text-[9px] font-black text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full shrink-0">
                            {publishedCount}/{topic.tests.length}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDeleteTopic(topic.id); }}
                          className="p-1 hover:bg-rose-50 rounded-lg text-zinc-300 hover:text-rose-500 transition-colors shrink-0"
                          title="Deactivate topic"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-zinc-100 px-3 py-2 flex flex-col gap-1.5 bg-zinc-50/30">
                          {topic.tests.length === 0 ? (
                            <p className="text-[10px] text-zinc-400 italic py-2 text-center">No tests — click "Create Test" and select this topic</p>
                          ) : (
                            topic.tests.map((test) => {
                              const isSelected = selectedTest?.id === test.id;
                              const draftEntry = drafts[test.id];
                              const hasDraft = !test.isPublished && draftEntry
                                ? draftEntry.mcq.length + draftEntry.canvas.length + draftEntry.quantus.length > 0
                                : false;
                              const ic = test.itemCounts ?? { mcq: 0, canvas: 0, quantus: 0 };
                              const totalItems = ic.mcq + ic.canvas + ic.quantus;
                              return (
                                <div
                                  key={test.id}
                                  onClick={() => setSelectedTest(test)}
                                  className={cn(
                                    "flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all group",
                                    isSelected ? "bg-[#E6F0F1]/60 border-[#01696F]/40 shadow-sm" : "border-zinc-200/60 hover:border-zinc-300 hover:bg-white/60",
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {test.isPublished ? <Lock size={10} className="text-emerald-500 shrink-0" /> : <Eye size={10} className="text-amber-500 shrink-0" />}
                                    <span className="text-xs font-semibold text-zinc-700 truncate">{test.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {hasDraft && <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">Draft</span>}
                                    {test.isPublished && <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">Live · {totalItems}</span>}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setShowDeleteTest(test.id); }}
                                      className="p-1 hover:bg-rose-50 rounded-lg text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                    {isSelected && <ChevronRight size={13} className="text-[#01696F]" />}
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

          {/* RIGHT: Test detail / draft builder */}
          <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-3xl p-6 flex flex-col gap-5 min-h-[400px]">
            {!selectedTest ? (
              <EmptyState icon={Target} title="Select a Test" description="Choose a test from the left panel to manage its activities." className="flex-1" />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-4 shrink-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {selectedTest.isPublished ? (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><Lock size={9} /> Published</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><Eye size={9} /> Draft</span>
                      )}
                    </div>
                    <h2 className="text-base font-extrabold text-zinc-800 tracking-tight">{selectedTest.name}</h2>
                    {selectedTest.description && <p className="text-xs text-zinc-400 font-medium mt-0.5">{selectedTest.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedTest.isPublished && (
                      <AdminButton variant="outline" icon={Eye} onClick={() => router.push(`/admin/professions/${professionId}/tests/${selectedTest.id}/preview`)}>
                        Preview
                      </AdminButton>
                    )}
                    {!selectedTest.isPublished && draftCount > 0 && (
                      <AdminButton icon={Send} onClick={() => setShowPublishModal(true)}>Publish</AdminButton>
                    )}
                  </div>
                </div>

                {selectedTest.isPublished ? (
                  /* PUBLISHED VIEW */
                  <div className="flex flex-col gap-4 flex-1">
                    <div className="grid grid-cols-3 gap-3">
                      {ACT_TABS.map(({ type, label, color }) => {
                        const count = selectedTest.itemCounts[type];
                        const cfg = selectedTest.typeConfigs.find((c) => c.activityType === type);
                        return (
                          <div key={type} className={cn("border rounded-2xl p-4 text-center bg-zinc-50 border-zinc-100", count === 0 && "opacity-40")}>
                            <span className={cn("inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border mb-2", color)}>{label}</span>
                            <p className="text-xl font-black text-zinc-800">{count}</p>
                            <p className="text-[9px] text-zinc-400 font-bold mt-0.5">{count === 0 ? "not included" : `${cfg?.timeLimitMins ?? "—"}m timer`}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-start gap-3">
                      <Lock size={14} className="text-zinc-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-zinc-700">Test is live and locked</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Users can start sessions. Activities and timers cannot be changed. Deactivate the test and create a new one to make changes.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* DRAFT BUILDER */
                  <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                    <div className="flex items-center justify-between shrink-0">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Add activities — multiple per type</p>
                      <p className="text-[10px] text-[#01696F] font-bold">{draftCount} added</p>
                    </div>

                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
                      {ACT_TABS.map(({ type, label, color, default: defMins }) => {
                        const slots = selectedDraft[type];
                        const timeLimit = selectedDraft.timeLimits[type];
                        return (
                          <div key={type} className={cn("border rounded-2xl p-4 transition-all", slots.length > 0 ? "border-[#01696F]/25 bg-[#E6F0F1]/15" : "border-zinc-200 bg-zinc-50/30")}>
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border", color)}>{label}</span>
                                <span className="text-[9px] text-zinc-400 font-bold">{slots.length} {slots.length === 1 ? "activity" : "activities"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={11} className="text-zinc-400" />
                                  <input
                                    type="number" min={1} max={180}
                                    value={timeLimit}
                                    onChange={(e) => handleDraftTime(type, parseInt(e.target.value) || defMins)}
                                    className="w-14 px-2 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-center outline-none focus:border-[#01696F]/40"
                                    title="Timer for all activities of this type"
                                  />
                                  <span className="text-[9px] text-zinc-400 font-bold">mins</span>
                                </div>
                                <AdminButton size="sm" variant="soft" icon={Plus} onClick={() => openPicker(type)}>Add</AdminButton>
                              </div>
                            </div>

                            {slots.length === 0 ? (
                              <p className="text-[10px] text-zinc-400 italic">No {label} activities yet — click Add</p>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                {slots.map((slot, idx) => (
                                  <div key={slot.activityId} className="flex items-center gap-3 px-3 py-2 bg-white border border-zinc-100 rounded-xl group">
                                    <span className="text-[9px] font-black text-zinc-400 w-4 shrink-0 text-center">{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-zinc-800 truncate">{slot.lessonName}</p>
                                      <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full", DIFF_COLOR[slot.difficulty])}>{slot.difficulty}</span>
                                    </div>
                                    <button onClick={() => handleDraftRemove(type, slot.activityId)} className="p-1 hover:bg-rose-50 rounded-lg text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
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

                    {draftCount > 0 && (
                      <AdminButton size="lg" icon={Send} onClick={() => setShowPublishModal(true)} className="w-full shrink-0">
                        Publish Test ({draftCount} {draftCount === 1 ? "activity" : "activities"})
                      </AdminButton>
                    )}
                    <p className="text-[10px] text-zinc-400 text-center leading-relaxed shrink-0">
                      Draft is not saved to DB — refreshing clears it.<br />Once published, activities are locked.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Create Topic */}
        <Modal
          open={showTopicModal}
          onClose={() => setShowTopicModal(false)}
          dismissable={!saving}
          title="Create Skill Topic"
          footer={
            <>
              <AdminButton variant="ghost" onClick={() => setShowTopicModal(false)} disabled={saving}>Cancel</AdminButton>
              <AdminButton type="submit" form="topic-form" loading={saving}>Create Topic</AdminButton>
            </>
          }
        >
          <form id="topic-form" onSubmit={handleCreateTopic} className="space-y-4">
            <FormAlert message={formError} />
            <Field label="Topic Name" required>
              <Input value={topicForm.name} onChange={(e) => setTopicForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Financial Statements" autoFocus />
            </Field>
            <Field label="Description">
              <Textarea value={topicForm.description} onChange={(e) => setTopicForm((p) => ({ ...p, description: e.target.value }))} placeholder="What this topic covers…" />
            </Field>
          </form>
        </Modal>

        {/* Create Test */}
        <Modal
          open={showTestModal}
          onClose={() => setShowTestModal(false)}
          dismissable={!saving}
          title="Create Skill Test"
          footer={
            <>
              <AdminButton variant="ghost" onClick={() => setShowTestModal(false)} disabled={saving}>Cancel</AdminButton>
              <AdminButton type="submit" form="test-form" loading={saving}>Create Test</AdminButton>
            </>
          }
        >
          <form id="test-form" onSubmit={handleCreateTest} className="space-y-4">
            <FormAlert message={formError} />
            <Field label="Test Name" required>
              <Input value={testForm.name} onChange={(e) => setTestForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. FS Fundamentals Test" autoFocus />
            </Field>
            <Field label="Topic" required>
              <Select value={testForm.topicId} onChange={(e) => setTestForm((p) => ({ ...p, topicId: e.target.value }))}>
                <option value="">Select a topic…</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </Field>
            <Field label="Description">
              <Textarea value={testForm.description} onChange={(e) => setTestForm((p) => ({ ...p, description: e.target.value }))} placeholder="What this test covers…" />
            </Field>
          </form>
        </Modal>

        {/* Activity Picker */}
        <Modal
          open={showPickerModal}
          onClose={() => setShowPickerModal(false)}
          size="lg"
          title={`Add ${ACT_TABS.find((t) => t.type === pickerType)?.label} Activities`}
          subtitle={`Tagged to ${profession?.name ?? "this profession"} · not in any published test`}
        >
          <div className="flex flex-col gap-3">
            {/* Type tabs */}
            <div className="flex gap-2">
              {ACT_TABS.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => { setPickerSearch(""); openPicker(type); }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                    pickerType === type ? "bg-[#01696F] text-white shadow-sm" : "bg-zinc-50 border border-zinc-200 text-zinc-500 hover:border-[#01696F]/30",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
              <Search size={13} className="text-zinc-400" />
              <input
                type="text"
                placeholder="Search lessons…"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs font-medium outline-none placeholder:text-zinc-400"
              />
            </div>

            {selectedTest && (drafts[selectedTest.id]?.[pickerType]?.length ?? 0) > 0 && (
              <p className="text-[10px] text-[#01696F] font-bold bg-[#E6F0F1]/50 border border-[#01696F]/10 rounded-xl px-3 py-2">
                {drafts[selectedTest.id]?.[pickerType]?.length} already added to this test
              </p>
            )}

            {/* List */}
            <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1">
              {loadingPicker ? (
                <div className="flex items-center justify-center py-12 gap-2 text-zinc-400">
                  <div className="w-5 h-5 border-4 border-[#01696F] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold">Loading activities…</span>
                </div>
              ) : filteredPicker.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  size="sm"
                  title={availableActs.length === 0 ? "All activities are in published tests" : "No matches for your search"}
                />
              ) : (
                filteredPicker.map((act) => {
                  const alreadyInDraft = selectedTest ? (drafts[selectedTest.id]?.[act.activityType] || []).some((s) => s.activityId === act.activityId) : false;
                  return (
                    <div
                      key={act.activityId}
                      className={cn(
                        "flex items-center justify-between gap-3 p-3 border rounded-xl transition-all",
                        alreadyInDraft ? "bg-emerald-50/50 border-emerald-200 opacity-60" : "bg-zinc-50/50 border-zinc-200/80 hover:border-[#01696F]/30 hover:bg-[#E6F0F1]/20",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-800 truncate">{act.lessonName}</p>
                        <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full", DIFF_COLOR[act.difficulty])}>{act.difficulty}</span>
                      </div>
                      {alreadyInDraft ? (
                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 shrink-0"><CheckCircle2 size={12} /> Added</span>
                      ) : (
                        <AdminButton size="sm" icon={Plus} onClick={() => handleDraftAdd(act)}>Add</AdminButton>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Modal>

        {/* Publish confirm */}
        {showPublishModal && selectedTest && (
          <Modal
            open
            onClose={() => setShowPublishModal(false)}
            dismissable={!publishing}
            title={`Publish "${selectedTest.name}"?`}
            subtitle="This cannot be undone"
            footer={
              <>
                <AdminButton variant="ghost" onClick={() => setShowPublishModal(false)} disabled={publishing}>Cancel</AdminButton>
                <AdminButton icon={Send} loading={publishing} onClick={handlePublish}>Publish &amp; Lock</AdminButton>
              </>
            }
          >
            <div className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 space-y-3">
                {ACT_TABS.map(({ type, label, color }) => {
                  const slots = selectedDraft[type];
                  if (slots.length === 0) return null;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase border", color)}>{label}</span>
                        <span className="text-[10px] text-zinc-400 font-bold">{selectedDraft.timeLimits[type]}m · {slots.length} {slots.length === 1 ? "activity" : "activities"}</span>
                      </div>
                      {slots.map((s) => (
                        <div key={s.activityId} className="flex items-center gap-2 pl-2 py-0.5">
                          <div className="w-1 h-1 rounded-full bg-zinc-300 shrink-0" />
                          <span className="text-[10px] text-zinc-600 font-semibold truncate">{s.lessonName}</span>
                          <span className={cn("text-[9px] font-black uppercase shrink-0", DIFF_COLOR[s.difficulty].split(" ")[1])}>{s.difficulty}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Once published, this test is <strong>locked</strong>. Activities and time limits cannot be changed. Users can start sessions immediately.
              </p>
            </div>
          </Modal>
        )}

        {/* Delete confirms */}
        <ConfirmDialog
          open={!!showDeleteTopic}
          title="Deactivate Topic?"
          confirmLabel="Deactivate"
          message="All tests under this topic will be hidden. Existing user sessions and progress are preserved."
          onConfirm={() => showDeleteTopic && handleDeleteTopic(showDeleteTopic)}
          onClose={() => setShowDeleteTopic(null)}
        />
        <ConfirmDialog
          open={!!showDeleteTest}
          title="Deactivate Test?"
          confirmLabel="Deactivate"
          message="This hides the test from users. Existing sessions and scores are preserved."
          onConfirm={() => showDeleteTest && handleDeleteTest(showDeleteTest)}
          onClose={() => setShowDeleteTest(null)}
        />
      </div>
    </MainLayout>
  );
}
