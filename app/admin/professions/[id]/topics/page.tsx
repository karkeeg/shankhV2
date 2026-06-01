"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Search,
  ArrowLeft,
  Settings,
  ShieldAlert,
  Layers,
  ChevronRight,
  ChevronDown,
  Trash,
  FolderOpen,
  CheckSquare,
  Square,
  BookOpen,
  Calendar,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface Profession {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface SkillTopic {
  id: string;
  name: string;
  description: string | null;
  level: string | null;
  durationWeeks: number | null;
  orderIndex: number;
  isActive: boolean;
}

interface SkillLesson {
  id: string;
  lessonId: string | null;
  name: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard";
  orderIndex: number;
  estimatedMins: number | null;
  lesson?: {
    mcqActivity?: any;
    canvasActivity?: any;
    quantusActivity?: any;
  } | null;
}

// Learning Tree node interfaces
interface LearningLesson {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
}

interface LearningSubtopic {
  id: string;
  name: string;
  lessons: LearningLesson[];
}

interface LearningTopic {
  id: string;
  name: string;
  subtopics: LearningSubtopic[];
}

interface LearningModule {
  id: string;
  name: string;
  topics: LearningTopic[];
}

export default function ProfessionTopicsAdmin() {
  const router = useRouter();
  const { id: professionId } = useParams();
  const token = useAuthStore((state) => state.token);

  // Data states
  const [profession, setProfession] = useState<Profession | null>(null);
  const [topics, setTopics] = useState<SkillTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<SkillTopic | null>(null);
  const [lessons, setLessons] = useState<SkillLesson[]>([]);
  const [learningTree, setLearningTree] = useState<LearningModule[]>([]);

  // UI state
  const [loadingProfession, setLoadingProfession] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);

  // Modals
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<SkillTopic | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Forms
  const [topicFormData, setTopicFormData] = useState({
    name: "",
    description: "",
    level: "Beginner",
    durationWeeks: 1.0,
    orderIndex: 0,
    isActive: true,
  });
  const [topicError, setTopicError] = useState("");
  const [topicSubmitting, setTopicSubmitting] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  // Tree Selection States
  const [searchTreeQuery, setSearchTreeQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [selectedLessonIds, setSelectedLessonIds] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);

  // Headers helper
  const headers: HeadersInit = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  // Load profession details & topics
  useEffect(() => {
    if (!professionId) return;

    const loadData = async () => {
      try {
        setLoadingProfession(true);
        // Find profession by listing all and finding ID (no single GET route exists)
        const profRes = await fetch(`${API}/api/v1/admin/professions`, { headers });
        const profJson = await profRes.json();
        if (profJson.data) {
          const matched = profJson.data.find((p: Profession) => p.id === professionId);
          if (matched) {
            setProfession(matched);
          }
        }
      } catch (err) {
        console.error("Failed to load profession", err);
      } finally {
        setLoadingProfession(false);
      }

      await fetchTopics();
    };

    loadData();
  }, [professionId, headers]);

  // Fetch topics list
  const fetchTopics = async () => {
    try {
      setLoadingTopics(true);
      const res = await fetch(`${API}/api/v1/admin/professions/${professionId}/skill-topics`, { headers });
      const json = await res.json();
      if (json.data) {
        setTopics(json.data);
        // Default select first topic if none selected or if previously selected is missing
        if (json.data.length > 0) {
          setSelectedTopic((prev) => {
            const stillExists = json.data.find((t: SkillTopic) => t.id === prev?.id);
            return stillExists || json.data[0];
          });
        } else {
          setSelectedTopic(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch topics", err);
    } finally {
      setLoadingTopics(false);
    }
  };

  // Fetch lessons when topic changes
  useEffect(() => {
    if (!selectedTopic) {
      setLessons([]);
      return;
    }

    const fetchLessons = async () => {
      try {
        setLoadingLessons(true);
        const res = await fetch(`${API}/api/v1/admin/skill-topics/${selectedTopic.id}/lessons`, { headers });
        const json = await res.json();
        if (json.data) {
          setLessons(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch lessons", err);
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchLessons();
  }, [selectedTopic, headers]);

  // Handle open Topic Create Form
  const handleOpenCreateTopic = () => {
    setEditingTopic(null);
    setTopicFormData({
      name: "",
      description: "",
      level: "Beginner",
      durationWeeks: 1.0,
      orderIndex: topics.length ? Math.max(...topics.map(t => t.orderIndex)) + 1 : 1,
      isActive: true,
    });
    setTopicError("");
    setIsTopicModalOpen(true);
  };

  // Handle open Topic Edit Form
  const handleOpenEditTopic = (t: SkillTopic, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting topic
    setEditingTopic(t);
    setTopicFormData({
      name: t.name,
      description: t.description || "",
      level: t.level || "Beginner",
      durationWeeks: t.durationWeeks ? Number(t.durationWeeks) : 1.0,
      orderIndex: t.orderIndex,
      isActive: t.isActive,
    });
    setTopicError("");
    setIsTopicModalOpen(true);
  };

  // Handle save topic (Create/Update)
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicFormData.name.trim()) {
      setTopicError("Topic name is required.");
      return;
    }

    try {
      setTopicSubmitting(true);
      setTopicError("");

      let res;
      if (editingTopic) {
        res = await fetch(`${API}/api/v1/admin/skill-topics/${editingTopic.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            ...topicFormData,
            durationWeeks: Number(topicFormData.durationWeeks),
            orderIndex: Number(topicFormData.orderIndex),
          }),
        });
      } else {
        res = await fetch(`${API}/api/v1/admin/skill-topics`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...topicFormData,
            professionId,
            durationWeeks: Number(topicFormData.durationWeeks),
            orderIndex: Number(topicFormData.orderIndex),
          }),
        });
      }

      const json = await res.ok ? await res.json() : null;
      if (!res.ok) {
        throw new Error(json?.error || "Failed to save topic.");
      }

      setIsTopicModalOpen(false);
      await fetchTopics();
    } catch (err: any) {
      setTopicError(err.message || "An error occurred.");
    } finally {
      setTopicSubmitting(false);
    }
  };

  // Delete topic
  const handleDeleteTopic = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/v1/admin/skill-topics/${id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setTopics((prev) => prev.filter((t) => t.id !== id));
        if (selectedTopic?.id === id) {
          setSelectedTopic(null);
        }
        setDeletingTopicId(null);
        fetchTopics();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to delete topic");
      }
    } catch (err) {
      console.error("Error deleting topic", err);
    }
  };

  // Delete Skill Lesson
  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to remove this lesson from the topic? (This will not delete the original lesson from curriculum, only this reference)")) return;
    try {
      const res = await fetch(`${API}/api/v1/admin/skill-lessons/${lessonId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      } else {
        const json = await res.json();
        alert(json.error || "Failed to remove lesson");
      }
    } catch (err) {
      console.error("Error deleting lesson", err);
    }
  };

  // Load Curriculum Tree for import modal
  const openImportModal = async () => {
    setIsImportModalOpen(true);
    setSearchTreeQuery("");
    setSelectedLessonIds({});

    try {
      setLoadingTree(true);
      const res = await fetch(`${API}/api/v1/admin/learning-tree`, { headers });
      const json = await res.json();
      if (json.data) {
        setLearningTree(json.data);

        // Pre-expand modules
        const initialExpanded: Record<string, boolean> = {};
        json.data.forEach((m: LearningModule) => {
          initialExpanded[`module-${m.id}`] = true;
        });
        setExpandedNodes(initialExpanded);
      }
    } catch (err) {
      console.error("Failed to load learning tree", err);
    } finally {
      setLoadingTree(false);
    }
  };

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Check if a lesson is already in this topic
  const isLessonAlreadyImported = (lessonId: string) => {
    return lessons.some((l) => l.lessonId === lessonId);
  };

  // Toggle lesson selection in tree
  const toggleSelectLesson = (lessonId: string) => {
    if (isLessonAlreadyImported(lessonId)) return;
    setSelectedLessonIds((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  // Check/Uncheck all lessons inside a subtopic
  const toggleSelectSubtopic = (subtopic: LearningSubtopic, isChecked: boolean) => {
    const updates: Record<string, boolean> = {};
    subtopic.lessons.forEach((l) => {
      if (!isLessonAlreadyImported(l.id)) {
        updates[l.id] = isChecked;
      }
    });
    setSelectedLessonIds((prev) => ({ ...prev, ...updates }));
  };

  // Check if all available lessons in a subtopic are selected
  const isSubtopicFullySelected = (subtopic: LearningSubtopic) => {
    const unimported = subtopic.lessons.filter((l) => !isLessonAlreadyImported(l.id));
    if (unimported.length === 0) return false;
    return unimported.every((l) => selectedLessonIds[l.id]);
  };

  // Check if some available lessons in a subtopic are selected
  const isSubtopicPartiallySelected = (subtopic: LearningSubtopic) => {
    const unimported = subtopic.lessons.filter((l) => !isLessonAlreadyImported(l.id));
    if (unimported.length === 0) return false;
    const count = unimported.filter((l) => selectedLessonIds[l.id]).length;
    return count > 0 && count < unimported.length;
  };

  // Handle multi-lesson import submission
  const handleImportLessons = async () => {
    const idsToImport = Object.keys(selectedLessonIds).filter((key) => selectedLessonIds[key]);
    if (idsToImport.length === 0) {
      alert("Please select at least one lesson to import.");
      return;
    }

    if (!selectedTopic) return;

    try {
      setImporting(true);
      const res = await fetch(`${API}/api/v1/admin/skill-topics/${selectedTopic.id}/lessons/import`, {
        method: "POST",
        headers,
        body: JSON.stringify({ lessonIds: idsToImport }),
      });
      const json = await res.json();
      if (res.ok) {
        setIsImportModalOpen(false);
        // Refresh lessons
        const freshLessonsRes = await fetch(`${API}/api/v1/admin/skill-topics/${selectedTopic.id}/lessons`, { headers });
        const freshJson = await freshLessonsRes.json();
        if (freshJson.data) {
          setLessons(freshJson.data);
        }
      } else {
        alert(json.error || "Failed to import lessons");
      }
    } catch (err) {
      console.error("Error importing lessons", err);
    } finally {
      setImporting(false);
    }
  };

  // Filtering tree nodes by search query
  const filteredTree = useMemo(() => {
    if (!searchTreeQuery.trim()) return learningTree;

    const query = searchTreeQuery.toLowerCase();

    return learningTree
      .map((module) => {
        const filteredTopics = module.topics
          .map((topic) => {
            const filteredSubtopics = topic.subtopics
              .map((subtopic) => {
                const filteredLessons = subtopic.lessons.filter(
                  (l) => l.name.toLowerCase().includes(query) || (l.description && l.description.toLowerCase().includes(query))
                );
                return { ...subtopic, lessons: filteredLessons };
              })
              .filter((subtopic) => subtopic.lessons.length > 0);

            return { ...topic, subtopics: filteredSubtopics };
          })
          .filter((topic) => topic.subtopics.length > 0);

        return { ...module, topics: filteredTopics };
      })
      .filter((module) => module.topics.length > 0);
  }, [learningTree, searchTreeQuery]);

  // Selected count helper
  const selectedCount = useMemo(() => {
    return Object.values(selectedLessonIds).filter(Boolean).length;
  }, [selectedLessonIds]);

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-y-auto p-8 gap-6 animate-fade-in bg-gradient-to-br from-[#fcfcfb] to-[#f5f3ee]">

        {/* Navigation & Title */}
        <div className="flex flex-col gap-3 shrink-0">
          <button
            onClick={() => router.push("/admin/professions")}
            className="flex items-center gap-2 text-xs font-bold text-[#01696F]/80 hover:text-[#01696F] transition-colors w-fit group"
            id="back_to_professions"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Professions
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#01696F]/10 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">
                Profession curriculum
              </span>
              <h1 className="text-2xl font-black text-[#01696F] tracking-tight">
                {loadingProfession ? "Loading Profession..." : profession?.name || "Profession Not Found"}
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Manage custom skill topics and lessons for this profession. Bypass subtopics entirely.
              </p>
            </div>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[400px]">

          {/* Left Column: Topics List (4 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-zinc-800 tracking-tight flex items-center gap-2">
                <Layers size={16} className="text-[#01696F]" />
                Skill Topics ({topics.length})
              </h2>
              <button
                onClick={handleOpenCreateTopic}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#01696F]/10 hover:bg-[#01696F] text-[#01696F] hover:text-white text-xs font-bold rounded-xl transition-all"
                id="add_topic_btn"
              >
                <Plus size={14} />
                Add Topic
              </button>
            </div>

            {loadingTopics ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white border border-zinc-200/60 rounded-3xl p-10 min-h-[300px]">
                <div className="w-6 h-6 border-3 border-[#01696F] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[11px] text-zinc-400 font-bold mt-2">Loading topics...</p>
              </div>
            ) : topics.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white border border-zinc-200/60 rounded-3xl p-10 text-center min-h-[300px]">
                <Layers size={28} className="text-zinc-300 mb-2" />
                <h3 className="text-xs font-extrabold text-zinc-700">No Topics Configured</h3>
                <p className="text-[10px] text-zinc-400 mt-1 max-w-[200px]">
                  Add a skill topic to begin loading lessons.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {topics.map((t) => {
                  const isSelected = selectedTopic?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTopic(t)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group relative ${isSelected
                        ? "bg-[#E6F0F1]/40 border-[#01696F]/50 shadow-sm"
                        : "bg-white border-zinc-200/80 hover:border-[#01696F]/20 hover:bg-zinc-50/50"
                        }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                              Order: {t.orderIndex}
                            </span>
                            {t.level && (
                              <span className="text-[9px] font-black uppercase bg-[#01696F]/10 text-[#01696F] px-2 py-0.5 rounded-full">
                                {t.level}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleOpenEditTopic(t, e)}
                              className="p-1 hover:bg-zinc-200 rounded-lg text-zinc-500 hover:text-[#01696F] transition-colors"
                              title="Edit Topic"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingTopicId(t.id);
                              }}
                              className="p-1 hover:bg-rose-50 rounded-lg text-zinc-500 hover:text-rose-600 transition-colors"
                              title="Delete Topic"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-xs font-extrabold text-zinc-800 tracking-tight leading-snug">
                          {t.name}
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-medium line-clamp-1">
                          {t.description || "No description provided."}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold border-t border-zinc-100/50 pt-2 shrink-0">
                        {t.durationWeeks && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {Number(t.durationWeeks)} {Number(t.durationWeeks) === 1 ? "Week" : "Weeks"}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <BookOpen size={11} />
                          {t.isActive ? "Active" : "Draft"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Topic Lessons (8 cols) */}
          <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-3xl p-6 flex flex-col gap-5 min-h-[400px]">
            {selectedTopic ? (
              <>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-[#01696F] tracking-widest">
                      Curriculum lessons
                    </span>
                    <h2 className="text-base font-extrabold text-zinc-800 tracking-tight leading-tight">
                      Lessons in: {selectedTopic.name}
                    </h2>
                    <p className="text-[10px] text-zinc-400 font-medium">
                      Manage lessons cloned into this topic. These lessons bypass standard curriculum subtopics.
                    </p>
                  </div>

                  <button
                    onClick={openImportModal}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    <FolderOpen size={14} />
                    Import Lessons
                  </button>
                </div>

                {/* Lessons List */}
                {loadingLessons ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20">
                    <div className="w-6 h-6 border-3 border-[#01696F] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[11px] text-zinc-400 font-bold mt-2">Loading topic lessons...</p>
                  </div>
                ) : lessons.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-200 rounded-2xl">
                    <BookOpen size={32} className="text-zinc-300 mb-2 animate-bounce" />
                    <h3 className="text-xs font-extrabold text-zinc-700">No Lessons Cloned</h3>
                    <p className="text-[10px] text-zinc-400 mt-1 max-w-[280px]">
                      Cloned lessons will borrow MCQs, interactive drills, and spreadsheet templates from standard learning pathways while tracking progress separately.
                    </p>
                    <button
                      onClick={openImportModal}
                      className="mt-4 px-3.5 py-1.5 border border-[#01696F] hover:bg-[#01696F] text-[#01696F] hover:text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Import Lessons Now
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3 max-h-[50vh] pr-1">
                    {lessons.map((l, index) => {
                      // Detect activity types
                      const activities = [];
                      if (l.lesson?.mcqActivity) activities.push("MCQ Quiz");
                      if (l.lesson?.canvasActivity) activities.push("Canvas Drill");
                      if (l.lesson?.quantusActivity) activities.push("Spreadsheet Lab");

                      return (
                        <div
                          key={l.id}
                          className="p-4 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl flex items-center justify-between gap-4 hover:border-zinc-300 transition-colors"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                                Index: {l.orderIndex}
                              </span>
                              {l.difficulty && (
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${l.difficulty === "easy" ? "bg-emerald-50 text-emerald-600" :
                                  l.difficulty === "medium" ? "bg-amber-50 text-amber-600" :
                                    "bg-rose-50 text-rose-600"
                                  }`}>
                                  {l.difficulty}
                                </span>
                              )}
                              {l.estimatedMins && (
                                <span className="text-[9px] font-bold text-zinc-400">
                                  • {l.estimatedMins} mins
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-extrabold text-zinc-800 tracking-tight leading-snug">
                              {l.name}
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-medium line-clamp-1">
                              {l.description || "No description provided."}
                            </p>

                            {/* Activity Badges */}
                            {activities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {activities.map((act, i) => (
                                  <span key={i} className="text-[8px] font-bold text-zinc-500 bg-white border border-zinc-200 px-1.5 py-0.5 rounded">
                                    {act}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteLesson(l.id)}
                            className="p-2 hover:bg-rose-50 rounded-xl text-zinc-400 hover:text-rose-600 transition-colors shrink-0"
                            title="Remove Lesson"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Layers size={36} className="text-zinc-200 mb-2" />
                <h3 className="text-sm font-extrabold text-zinc-600">No Topic Selected</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-[240px]">
                  Select a skill topic on the left sidebar to edit its corresponding lessons and configurations.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Delete Topic Confirmation Modal */}
        {deletingTopicId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 bg-rose-50 rounded-xl">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="text-base font-black tracking-tight">Delete Skill Topic?</h3>
              </div>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Are you sure you want to delete this skill topic? This will also delete all cloned lesson entries and user topic progress records.
              </p>
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => setDeletingTopicId(null)}
                  className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deletingTopicId && handleDeleteTopic(deletingTopicId)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Delete Topic
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Topic Creation / Modification Modal */}
        {isTopicModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[85vh] overflow-hidden animate-scale-up">

              <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
                <h3 className="text-base font-extrabold text-[#01696F] tracking-tight">
                  {editingTopic ? "Modify Topic Properties" : "Create Skill Topic"}
                </h3>
                <button
                  onClick={() => setIsTopicModalOpen(false)}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveTopic} className="flex-1 overflow-y-auto p-6 space-y-4">
                {topicError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium flex items-center gap-2">
                    <ShieldAlert size={14} className="shrink-0" />
                    {topicError}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Topic Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Balance Sheet Auditing"
                    value={topicFormData.name}
                    onChange={(e) => setTopicFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700 outline-none focus:border-[#01696F]/50 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    placeholder="Briefly state the goal or subtopics taught..."
                    value={topicFormData.description}
                    onChange={(e) => setTopicFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700 outline-none focus:border-[#01696F]/50 focus:bg-white resize-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Difficulty Level
                    </label>
                    <select
                      value={topicFormData.level}
                      onChange={(e) => setTopicFormData((prev) => ({ ...prev, level: e.target.value }))}
                      className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700 outline-none focus:border-[#01696F]/50 focus:bg-white transition-all"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Duration (Weeks)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={topicFormData.durationWeeks}
                      onChange={(e) => setTopicFormData((prev) => ({ ...prev, durationWeeks: parseFloat(e.target.value) || 0.1 }))}
                      className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700 outline-none focus:border-[#01696F]/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Order Index
                  </label>
                  <input
                    type="number"
                    value={topicFormData.orderIndex}
                    onChange={(e) => setTopicFormData((prev) => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
                    className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700 outline-none focus:border-[#01696F]/50 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 py-1">
                  <input
                    type="checkbox"
                    id="topic_isActive_checkbox"
                    checked={topicFormData.isActive}
                    onChange={(e) => setTopicFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-[#01696F] border-zinc-300 rounded focus:ring-[#01696F]"
                  />
                  <label htmlFor="topic_isActive_checkbox" className="text-xs font-bold text-zinc-600 cursor-pointer">
                    Active & Available for Students
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 mt-5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsTopicModalOpen(false)}
                    className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={topicSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    <Save size={14} />
                    {topicSubmitting ? "Saving..." : "Save Topic"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* Tree Selector Modal (Importers) */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col h-[80vh] overflow-hidden animate-scale-up">

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
                <div>
                  <h3 className="text-base font-extrabold text-[#01696F] tracking-tight">
                    Import Lessons from Learning Curriculum
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Cloning lessons into topic: <span className="font-bold text-zinc-700">{selectedTopic?.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search bar inside modal */}
              <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center gap-3 shrink-0">
                <Search size={16} className="text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search lessons to import..."
                  value={searchTreeQuery}
                  onChange={(e) => setSearchTreeQuery(e.target.value)}
                  className="w-full text-xs font-medium text-zinc-700 bg-transparent border-none outline-none placeholder:text-zinc-400"
                />
              </div>

              {/* Tree Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingTree ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <div className="w-6 h-6 border-3 border-[#01696F] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-zinc-400 font-medium animate-pulse">Loading curriculum tree...</p>
                  </div>
                ) : filteredTree.length === 0 ? (
                  <div className="text-center py-16">
                    <HelpCircle size={28} className="text-zinc-300 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs text-zinc-500 font-bold">No matching lessons found</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Try widening your search terms.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTree.map((module) => {
                      const moduleNodeId = `module-${module.id}`;
                      const isExpanded = expandedNodes[moduleNodeId] ?? false;

                      return (
                        <div key={module.id} className="border border-zinc-100 rounded-2xl overflow-hidden bg-zinc-50/20">
                          {/* Module Bar */}
                          <div
                            onClick={() => toggleNode(moduleNodeId)}
                            className="flex items-center gap-2 p-3 bg-zinc-50 hover:bg-zinc-100/80 cursor-pointer border-b border-zinc-100 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown size={14} className="text-zinc-400 shrink-0" />
                            ) : (
                              <ChevronRight size={14} className="text-zinc-400 shrink-0" />
                            )}
                            <FolderOpen size={16} className="text-[#01696F] shrink-0" />
                            <span className="text-xs font-black text-zinc-800 tracking-tight">
                              {module.name}
                            </span>
                          </div>

                          {/* Module Children (Topics) */}
                          {isExpanded && (
                            <div className="p-3 pl-6 space-y-3">
                              {module.topics.map((topic) => {
                                const topicNodeId = `topic-${topic.id}`;
                                const isTopicExpanded = expandedNodes[topicNodeId] ?? false;

                                return (
                                  <div key={topic.id} className="border-l border-zinc-200/80 pl-3 space-y-2">
                                    {/* Topic Bar */}
                                    <div
                                      onClick={() => toggleNode(topicNodeId)}
                                      className="flex items-center gap-2 cursor-pointer py-1 text-zinc-700 hover:text-zinc-900"
                                    >
                                      {isTopicExpanded ? (
                                        <ChevronDown size={12} className="text-zinc-400 shrink-0" />
                                      ) : (
                                        <ChevronRight size={12} className="text-zinc-400 shrink-0" />
                                      )}
                                      <Layers size={13} className="text-amber-500 shrink-0" />
                                      <span className="text-[11px] font-bold">
                                        Topic: {topic.name}
                                      </span>
                                    </div>

                                    {/* Topic Children (Subtopics) */}
                                    {isTopicExpanded && (
                                      <div className="pl-4 space-y-3 pt-1">
                                        {topic.subtopics.map((subtopic) => {
                                          const isFullySelected = isSubtopicFullySelected(subtopic);
                                          const isPartiallySelected = isSubtopicPartiallySelected(subtopic);

                                          // Filter out already imported to count selection potential
                                          const unimportedCount = subtopic.lessons.filter(
                                            (l) => !isLessonAlreadyImported(l.id)
                                          ).length;

                                          return (
                                            <div key={subtopic.id} className="space-y-1.5">
                                              {/* Subtopic Header */}
                                              <div className="flex items-center justify-between gap-4 py-1 border-b border-zinc-100/50">
                                                <div className="flex items-center gap-1.5">
                                                  <BookOpen size={12} className="text-indigo-500 shrink-0" />
                                                  <span className="text-[10px] font-bold text-zinc-500">
                                                    Subtopic: {subtopic.name}
                                                  </span>
                                                </div>

                                                {/* Bulk checkbox */}
                                                {unimportedCount > 0 && (
                                                  <button
                                                    onClick={() => toggleSelectSubtopic(subtopic, !isFullySelected)}
                                                    className="flex items-center gap-1 text-[9px] font-black uppercase text-[#01696F] hover:text-[#015257]"
                                                  >
                                                    {isFullySelected ? (
                                                      <span className="flex items-center gap-0.5">
                                                        <CheckSquare size={10} /> Unselect All
                                                      </span>
                                                    ) : (
                                                      <span className="flex items-center gap-0.5">
                                                        <Square size={10} /> Select All
                                                      </span>
                                                    )}
                                                  </button>
                                                )}
                                              </div>

                                              {/* Subtopic Children (Lessons) */}
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-3 pt-1">
                                                {subtopic.lessons.map((lesson) => {
                                                  const alreadyImported = isLessonAlreadyImported(lesson.id);
                                                  const isSelected = selectedLessonIds[lesson.id] ?? false;

                                                  return (
                                                    <div
                                                      key={lesson.id}
                                                      onClick={() => toggleSelectLesson(lesson.id)}
                                                      className={`p-2.5 rounded-xl border text-left transition-colors flex items-center justify-between gap-3 ${alreadyImported
                                                        ? "bg-zinc-100/80 border-zinc-200 text-zinc-400 cursor-not-allowed select-none"
                                                        : isSelected
                                                          ? "bg-[#E6F0F1]/50 border-[#01696F]/40 cursor-pointer"
                                                          : "bg-white border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50/50 cursor-pointer"
                                                        }`}
                                                    >
                                                      <div className="space-y-0.5">
                                                        <span className="text-[8px] font-black uppercase text-zinc-400 bg-zinc-100/50 px-1 rounded">
                                                          {lesson.difficulty}
                                                        </span>
                                                        <h5 className="text-[10px] font-extrabold text-zinc-800 leading-tight">
                                                          {lesson.name}
                                                        </h5>
                                                      </div>

                                                      {alreadyImported ? (
                                                        <CheckCircle2 size={14} className="text-[#01696F] shrink-0" />
                                                      ) : isSelected ? (
                                                        <CheckSquare size={14} className="text-[#01696F] shrink-0" />
                                                      ) : (
                                                        <Square size={14} className="text-zinc-300 shrink-0" />
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-zinc-100 shrink-0 flex items-center justify-between gap-4 bg-zinc-50">
                <span className="text-xs text-zinc-500 font-bold">
                  {selectedCount} {selectedCount === 1 ? "lesson" : "lessons"} selected
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 hover:bg-zinc-200 rounded-xl text-xs font-bold text-zinc-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportLessons}
                    disabled={selectedCount === 0 || importing}
                    className="px-5 py-2.5 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {importing ? "Importing..." : `Import Selected (${selectedCount})`}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
