"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Save,
  X,
  Layers,
  Settings,
  FolderOpen,
  ChevronRight,
  TrendingUp,
  Award,
  CircleAlert,
  Play,
  Lightbulb,
  FileCode2,
  TableProperties,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// Standard Curriculum Node Types
interface Lesson {
  id: string;
  name: string;
  difficulty: "easy" | "medium" | "hard";
  description: string | null;
  orderIndex: number;
}

interface Subtopic {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  lessons: Lesson[];
}

interface Topic {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  orderIndex: number;
  subtopics: Subtopic[];
}

interface Module {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accentColor: string;
  iconKey: string | null;
  orderIndex: number;
  topics: Topic[];
}

export default function LearningPathAdmin() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  // Curriculum Data States
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<"module" | "topic" | "subtopic" | "lesson" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Creation Forms
  const [moduleForm, setModuleForm] = useState({
    name: "",
    slug: "",
    description: "",
    accentColor: "#01696F",
    iconKey: "BookOpen",
    orderIndex: 0,
  });

  const [topicForm, setTopicForm] = useState({
    name: "",
    subtitle: "",
    description: "",
    type: "topic",
    orderIndex: 0,
  });

  const [subtopicForm, setSubtopicForm] = useState({
    name: "",
    description: "",
    type: "topic",
    orderIndex: 0,
  });

  const [lessonForm, setLessonForm] = useState({
    name: "",
    description: "",
    difficulty: "easy",
    orderIndex: 0,
  });

  // Headers helper — built imperatively so no key ever holds `undefined`
  const headers = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  // Fetch full tree
  const fetchCurriculumTree = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/v1/admin/learning-tree`, { headers });
      const json = await res.json();
      if (json.data) {
        setModules(json.data);

        // Sync selection updates
        if (selectedModule) {
          const updatedMod = json.data.find((m: Module) => m.id === selectedModule.id);
          setSelectedModule(updatedMod || null);
          if (updatedMod && selectedTopic) {
            const updatedTop = updatedMod.topics.find((t: Topic) => t.id === selectedTopic.id);
            setSelectedTopic(updatedTop || null);
            if (updatedTop && selectedSubtopic) {
              const updatedSub = updatedTop.subtopics.find((s: Subtopic) => s.id === selectedSubtopic.id);
              setSelectedSubtopic(updatedSub || null);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load curriculum tree", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculumTree();
  }, [headers]);

  // Handle module name change to generate slug
  const handleModuleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setModuleForm((prev) => ({ ...prev, name: val, slug: generatedSlug }));
  };

  // Open modals with defaults
  const openModuleCreate = () => {
    setModuleForm({
      name: "",
      slug: "",
      description: "",
      accentColor: "#01696F",
      iconKey: "BookOpen",
      orderIndex: modules.length ? Math.max(...modules.map(m => m.orderIndex)) + 1 : 1,
    });
    setErrorMsg("");
    setActiveModal("module");
  };

  const openTopicCreate = () => {
    if (!selectedModule) return;
    setTopicForm({
      name: "",
      subtitle: "",
      description: "",
      type: "topic",
      orderIndex: selectedModule.topics.length ? Math.max(...selectedModule.topics.map(t => t.orderIndex)) + 1 : 1,
    });
    setErrorMsg("");
    setActiveModal("topic");
  };

  const openSubtopicCreate = (topic: Topic) => {
    setSelectedTopic(topic);
    setSubtopicForm({
      name: "",
      description: "",
      type: "topic",
      orderIndex: topic.subtopics.length ? Math.max(...topic.subtopics.map(s => s.orderIndex)) + 1 : 1,
    });
    setErrorMsg("");
    setActiveModal("subtopic");
  };

  const openLessonCreate = () => {
    if (!selectedSubtopic) return;
    setLessonForm({
      name: "",
      description: "",
      difficulty: "easy",
      orderIndex: selectedSubtopic.lessons.length ? Math.max(...selectedSubtopic.lessons.map(l => l.orderIndex)) + 1 : 1,
    });
    setErrorMsg("");
    setActiveModal("lesson");
  };

  // Submit forms
  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.name.trim() || !moduleForm.slug.trim()) {
      setErrorMsg("Name and Slug are required.");
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await fetch(`${API}/api/v1/admin/modules`, {
        method: "POST",
        headers,
        body: JSON.stringify(moduleForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create module");

      setActiveModal(null);
      await fetchCurriculumTree();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.name.trim() || !selectedModule) {
      setErrorMsg("Name and parent Module are required.");
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await fetch(`${API}/api/v1/admin/topics`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...topicForm,
          module_id: selectedModule.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create topic");

      setActiveModal(null);
      await fetchCurriculumTree();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubtopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtopicForm.name.trim() || !selectedTopic) {
      setErrorMsg("Name and parent Topic are required.");
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await fetch(`${API}/api/v1/admin/subtopics`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...subtopicForm,
          topic_id: selectedTopic.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create subtopic");

      setActiveModal(null);
      await fetchCurriculumTree();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.name.trim() || !selectedSubtopic) {
      setErrorMsg("Lesson name and Subtopic context are required.");
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await fetch(`${API}/api/v1/admin/lessons`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...lessonForm,
          subtopic_id: selectedSubtopic.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create lesson");

      setActiveModal(null);
      await fetchCurriculumTree();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-y-auto p-8 gap-6 animate-fade-in bg-gradient-to-br from-[#fcfcfb] to-[#f5f3ee]">

        {/* Navigation & Header */}
        <div className="flex flex-col gap-3 shrink-0">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-2 text-xs font-bold text-[#01696F]/80 hover:text-[#01696F] transition-colors w-fit group"
            id="back_to_admin"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#01696F]/10 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">
                Curriculum Structure
              </span>
              <h1 className="text-2xl font-black text-[#01696F] tracking-tight">
                Learning Pathways
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Configure primary student paths: Modules → Topics → Subtopics → Lessons.
              </p>
            </div>

            <button
              onClick={openModuleCreate}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
              id="add_module_btn"
            >
              <Plus size={16} />
              Create Module
            </button>
          </div>
        </div>

        {/* Triple-Column Drilling Workspace */}
        {loading && modules.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white border border-zinc-200/60 rounded-3xl p-10 min-h-[400px]">
            <div className="w-8 h-8 border-4 border-[#01696F] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-400 font-bold mt-3 animate-pulse">Loading curriculum pathways...</p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[500px]">

            {/* Column 1: Modules Selector (3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                Modules ({modules.length})
              </h3>

              <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {modules.map((m) => {
                  const isSelected = selectedModule?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedModule(m);
                        setSelectedTopic(null);
                        setSelectedSubtopic(null);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 relative ${isSelected
                          ? "bg-white border-[#01696F] shadow-md scale-[1.01]"
                          : "bg-white/80 border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50/50"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: m.accentColor || "#01696F" }}
                        />
                        <span className="text-[8px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                          Order: {m.orderIndex}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-zinc-800 tracking-tight leading-tight">
                        {m.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-medium line-clamp-2">
                        {m.description || "No description provided."}
                      </p>
                      {isSelected && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#01696F]">
                          <ChevronRight size={16} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Topics & Subtopics (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-3xl p-5 flex flex-col gap-4">
              {selectedModule ? (
                <>
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div>
                      <span className="text-[8px] font-black uppercase text-[#01696F] tracking-widest">
                        Module: {selectedModule.name}
                      </span>
                      <h3 className="text-xs font-extrabold text-zinc-800 tracking-tight mt-0.5">
                        Topics & Subtopics
                      </h3>
                    </div>
                    <button
                      onClick={openTopicCreate}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#01696F]/10 hover:bg-[#01696F] text-[#01696F] hover:text-white text-[10px] font-bold rounded-xl transition-all"
                    >
                      <Plus size={12} />
                      Add Topic
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 max-h-[55vh] pr-1">
                    {selectedModule.topics.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Layers size={24} className="text-zinc-300 mb-1" />
                        <h4 className="text-xs font-extrabold text-zinc-500">No Topics Created</h4>
                        <p className="text-[9px] text-zinc-400 max-w-[200px]">
                          Create a topic inside this module to start layering the structure.
                        </p>
                      </div>
                    ) : (
                      selectedModule.topics.map((t) => {
                        const isTopicActive = selectedTopic?.id === t.id;
                        return (
                          <div
                            key={t.id}
                            className={`p-3.5 rounded-2xl border transition-all ${isTopicActive ? "border-[#01696F]/30 bg-zinc-50/50" : "border-zinc-100 bg-white"
                              }`}
                          >
                            {/* Topic Row */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <span className="text-[8px] font-black uppercase text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                                  Topic Index: {t.orderIndex}
                                </span>
                                <h4 className="text-xs font-extrabold text-zinc-800 tracking-tight mt-1">
                                  {t.name}
                                </h4>
                                {t.subtitle && (
                                  <p className="text-[9px] text-zinc-400 font-bold">{t.subtitle}</p>
                                )}
                              </div>
                              <button
                                onClick={() => openSubtopicCreate(t)}
                                className="flex items-center gap-0.5 px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-[9px] font-bold transition-all shrink-0"
                                title="Add Subtopic"
                              >
                                <Plus size={10} />
                                Subtopic
                              </button>
                            </div>

                            {/* Subtopics Nested List */}
                            <div className="mt-3 pl-3 border-l border-zinc-200/80 space-y-2">
                              {t.subtopics.length === 0 ? (
                                <p className="text-[9px] text-zinc-400 italic">No subtopics added yet.</p>
                              ) : (
                                t.subtopics.map((sub) => {
                                  const isSubSelected = selectedSubtopic?.id === sub.id;
                                  return (
                                    <div
                                      key={sub.id}
                                      onClick={() => {
                                        setSelectedTopic(t);
                                        setSelectedSubtopic(sub);
                                      }}
                                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 ${isSubSelected
                                          ? "bg-[#E6F0F1]/50 border-[#01696F]/40 font-bold"
                                          : "bg-zinc-50/20 border-zinc-150 hover:bg-zinc-50 hover:border-zinc-250"
                                        }`}
                                    >
                                      <div className="space-y-0.5">
                                        <span className="text-[8px] font-black text-zinc-400">
                                          Order: {sub.orderIndex}
                                        </span>
                                        <h5 className="text-[10px] font-extrabold text-zinc-700 leading-tight">
                                          {sub.name}
                                        </h5>
                                      </div>
                                      <ChevronRight
                                        size={12}
                                        className={isSubSelected ? "text-[#01696F]" : "text-zinc-300"}
                                      />
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                  <BookOpen size={32} className="text-zinc-200 mb-1" />
                  <h4 className="text-xs font-extrabold text-zinc-500">Select a Module</h4>
                  <p className="text-[10px] text-zinc-400 mt-1 max-w-[200px]">
                    Choose a module on the left side to display topics and subtopics.
                  </p>
                </div>
              )}
            </div>

            {/* Column 3: Lessons (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-zinc-200/80 rounded-3xl p-5 flex flex-col gap-4">
              {selectedSubtopic ? (
                <>
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div>
                      <span className="text-[8px] font-black uppercase text-[#01696F] tracking-widest">
                        Subtopic: {selectedSubtopic.name}
                      </span>
                      <h3 className="text-xs font-extrabold text-zinc-800 tracking-tight mt-0.5">
                        Lessons ({selectedSubtopic.lessons.length})
                      </h3>
                    </div>
                    <button
                      onClick={openLessonCreate}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#01696F]/10 hover:bg-[#01696F] text-[#01696F] hover:text-white text-[10px] font-bold rounded-xl transition-all"
                    >
                      <Plus size={12} />
                      Add Lesson
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 max-h-[55vh] pr-1">
                    {selectedSubtopic.lessons.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <FolderOpen size={24} className="text-zinc-300 mb-1 animate-pulse" />
                        <h4 className="text-xs font-extrabold text-zinc-500">No Lessons Found</h4>
                        <p className="text-[9px] text-zinc-400 max-w-[180px]">
                          Create a lesson to start building questions and spreadsheet drills.
                        </p>
                      </div>
                    ) : (
                    selectedSubtopic.lessons.map((l) => (
  <div
    key={l.id}
    className="flex items-center justify-between p-3 rounded-xl bg-white border border-zinc-100 hover:border-zinc-200 transition-all group"
  >
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <span
        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
          l.difficulty === "easy"
            ? "bg-emerald-50 text-emerald-600"
            : l.difficulty === "medium"
            ? "bg-amber-50 text-amber-600"
            : "bg-rose-50 text-rose-600"
        }`}
      >
        {l.difficulty}
      </span>
      <p className="text-xs font-semibold text-zinc-700 truncate">{l.name}</p>
    </div>
    <button
      onClick={() => router.push(`/admin/lessons/${l.id}`)}
      className="flex items-center gap-1 text-[10px] font-bold text-[#01696F] opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1.5 hover:bg-[#E6F0F1] rounded-lg shrink-0"
    >
      Activities →
    </button>
  </div>
))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                  <FolderOpen size={32} className="text-zinc-200 mb-1" />
                  <h4 className="text-xs font-extrabold text-zinc-500">Select a Subtopic</h4>
                  <p className="text-[10px] text-zinc-400 mt-1 max-w-[200px]">
                    Choose a subtopic in the middle column to inspect and configure lessons.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Modal: Create Module */}
        {activeModal === "module" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-md mx-4 flex flex-col animate-scale-up">
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
                <h3 className="text-base font-extrabold text-[#01696F] tracking-tight">Create Curriculum Module</h3>
                <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400"><X size={16} /></button>
              </div>

              <form onSubmit={handleModuleSubmit} className="p-6 space-y-4">
                {errorMsg && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs">{errorMsg}</div>}

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Module Title</label>
                  <input type="text" required placeholder="e.g. Accounting Principles" value={moduleForm.name} onChange={handleModuleNameChange} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#01696F]/50 transition-all" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Slug (Auto-generated)</label>
                  <input type="text" required placeholder="accounting-principles" value={moduleForm.slug} onChange={(e) => setModuleForm(prev => ({ ...prev, slug: e.target.value }))} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono outline-none focus:bg-white focus:border-[#01696F]/50 transition-all" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                  <textarea placeholder="Describe the focus of the module..." value={moduleForm.description} onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))} rows={2} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none resize-none focus:bg-white focus:border-[#01696F]/50 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Accent Color</label>
                    <input type="color" value={moduleForm.accentColor} onChange={(e) => setModuleForm(prev => ({ ...prev, accentColor: e.target.value }))} className="w-full h-9 p-0.5 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Order Index</label>
                    <input type="number" value={moduleForm.orderIndex} onChange={(e) => setModuleForm(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#01696F] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50">{submitting ? "Creating..." : "Save Module"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Topic */}
        {activeModal === "topic" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-md mx-4 flex flex-col animate-scale-up">
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
                <h3 className="text-base font-extrabold text-[#01696F] tracking-tight">Create Curriculum Topic</h3>
                <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400"><X size={16} /></button>
              </div>

              <form onSubmit={handleTopicSubmit} className="p-6 space-y-4">
                {errorMsg && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs">{errorMsg}</div>}

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Topic Title</label>
                  <input type="text" required placeholder="e.g. Income Statement Fundamentals" value={topicForm.name} onChange={(e) => setTopicForm(prev => ({ ...prev, name: e.target.value }))} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Subtitle</label>
                  <input type="text" placeholder="e.g. Master single-step vs multi-step formatting" value={topicForm.subtitle} onChange={(e) => setTopicForm(prev => ({ ...prev, subtitle: e.target.value }))} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                  <textarea placeholder="Provide details on topic outcomes..." value={topicForm.description} onChange={(e) => setTopicForm(prev => ({ ...prev, description: e.target.value }))} rows={2} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none resize-none focus:bg-white" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Order Index</label>
                  <input type="number" value={topicForm.orderIndex} onChange={(e) => setTopicForm(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white" />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#01696F] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50">{submitting ? "Creating..." : "Save Topic"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Subtopic */}
        {activeModal === "subtopic" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-md mx-4 flex flex-col animate-scale-up">
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
                <h3 className="text-base font-extrabold text-[#01696F] tracking-tight">Create Subtopic Node</h3>
                <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400"><X size={16} /></button>
              </div>

              <form onSubmit={handleSubtopicSubmit} className="p-6 space-y-4">
                {errorMsg && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs">{errorMsg}</div>}

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Subtopic Title</label>
                  <input type="text" required placeholder="e.g. Operating Expenses Analysis" value={subtopicForm.name} onChange={(e) => setSubtopicForm(prev => ({ ...prev, name: e.target.value }))} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                  <textarea placeholder="Describe subtopic outcomes..." value={subtopicForm.description} onChange={(e) => setSubtopicForm(prev => ({ ...prev, description: e.target.value }))} rows={2} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none resize-none focus:bg-white" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Order Index</label>
                  <input type="number" value={subtopicForm.orderIndex} onChange={(e) => setSubtopicForm(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white" />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#01696F] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50">{submitting ? "Creating..." : "Save Subtopic"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Lesson */}
        {activeModal === "lesson" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-md mx-4 flex flex-col animate-scale-up">
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
                <h3 className="text-base font-extrabold text-[#01696F] tracking-tight">Create Curriculum Lesson</h3>
                <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400"><X size={16} /></button>
              </div>

              <form onSubmit={handleLessonSubmit} className="p-6 space-y-4">
                {errorMsg && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs">{errorMsg}</div>}

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Lesson Title</label>
                  <input type="text" required placeholder="e.g. Distinguishing COGS vs Operating Expenses" value={lessonForm.name} onChange={(e) => setLessonForm(prev => ({ ...prev, name: e.target.value }))} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                  <textarea placeholder="Describe lesson objectives..." value={lessonForm.description} onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))} rows={2} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none resize-none focus:bg-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Difficulty</label>
                    <select value={lessonForm.difficulty} onChange={(e) => setLessonForm(prev => ({ ...prev, difficulty: e.target.value }))} className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Order Index</label>
                    <input type="number" value={lessonForm.orderIndex} onChange={(e) => setLessonForm(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#01696F] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50">{submitting ? "Creating..." : "Save Lesson"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
