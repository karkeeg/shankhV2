"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { adminApi, type CurriculumEntity } from "@/lib/api";
import { useToastStore } from "@/lib/toast-store";
import {
  AdminPageHeader,
  AdminButton,
  Modal,
  Field,
  Input,
  Textarea,
  Select,
  ColorInput,
  FormAlert,
  EmptyState,
  ConfirmDialog,
  DifficultyBadge,
} from "@/components/admin/ui";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  BookOpen,
  Layers,
  FolderOpen,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
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

type FormValues = Record<string, string>;

// Per-entity form configuration — collapses the four near-identical modals into one.
interface EntityConfig {
  label: string;
  fields: string[];
  initial: FormValues;
}
const ENTITY: Record<CurriculumEntity, EntityConfig> = {
  module: {
    label: "Module",
    fields: ["name", "slug", "description", "accentColor"],
    initial: { name: "", slug: "", description: "", accentColor: "#01696F" },
  },
  topic: {
    label: "Topic",
    fields: ["name", "subtitle", "description"],
    initial: { name: "", subtitle: "", description: "" },
  },
  subtopic: {
    label: "Subtopic",
    fields: ["name", "description"],
    initial: { name: "", description: "" },
  },
  lesson: {
    label: "Lesson",
    fields: ["name", "description", "difficulty"],
    initial: { name: "", description: "", difficulty: "easy" },
  },
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

// ── Reorderable list (native HTML5 drag-and-drop) ───────────────────────────────
function Reorderable<T extends { id: string }>({
  items,
  onReorder,
  children,
  className,
}: {
  items: T[];
  onReorder: (ordered: T[]) => void;
  children: (item: T, dragHandleProps: React.HTMLAttributes<HTMLElement>) => React.ReactNode;
  className?: string;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = items.findIndex((i) => i.id === dragId);
    const to = items.findIndex((i) => i.id === targetId);
    if (from === -1 || to === -1) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
    setDragId(null);
  };

  return (
    <div className={className}>
      {items.map((item) => (
        <div
          key={item.id}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(item.id)}
          className={cn(dragId === item.id && "opacity-40")}
        >
          {children(item, {
            draggable: true,
            onDragStart: () => setDragId(item.id),
            onDragEnd: () => setDragId(null),
          })}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
export default function LearningPathAdmin() {
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | null>(null);

  const selectedModule = modules.find((m) => m.id === selectedModuleId) ?? null;
  const selectedTopic = selectedModule?.topics.find((t) => t.id === selectedTopicId) ?? null;
  const selectedSubtopic = selectedTopic?.subtopics.find((s) => s.id === selectedSubtopicId) ?? null;

  // Form modal state
  const [form, setForm] = useState<{
    entity: CurriculumEntity;
    mode: "create" | "edit";
    id?: string;
    parentId?: string;
    values: FormValues;
  } | null>(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm state
  const [confirm, setConfirm] = useState<{ entity: CurriculumEntity; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────────
  const fetchTree = useCallback(async () => {
    try {
      const data = await adminApi.learningTree<Module[]>();
      setModules(data ?? []);
    } catch (e: any) {
      showToast(e?.message || "Failed to load curriculum", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // ── Create / Edit ───────────────────────────────────────────────────────────
  const openCreate = (entity: CurriculumEntity, parentId?: string) => {
    setFormError("");
    setForm({ entity, mode: "create", parentId, values: { ...ENTITY[entity].initial } });
  };

  const openEdit = (entity: CurriculumEntity, item: any) => {
    setFormError("");
    const values: FormValues = {};
    for (const f of ENTITY[entity].fields) values[f] = item[f] ?? "";
    setForm({ entity, mode: "edit", id: item.id, values });
  };

  const setValue = (key: string, val: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const values = { ...prev.values, [key]: val };
      // Auto-generate slug from the module name while creating.
      if (prev.entity === "module" && key === "name" && prev.mode === "create") {
        values.slug = slugify(val);
      }
      return { ...prev, values };
    });
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const { entity, mode, id, parentId, values } = form;
    if (!values.name?.trim()) return setFormError("Name is required.");
    if (entity === "module" && !values.slug?.trim()) return setFormError("Slug is required.");

    // Build payload: backend expects snake_case parent keys on create.
    const payload: Record<string, unknown> = { ...values };
    if (mode === "create") {
      if (entity === "topic") payload.module_id = parentId;
      if (entity === "subtopic") payload.topic_id = parentId;
      if (entity === "lesson") payload.subtopic_id = parentId;
    }

    try {
      setSubmitting(true);
      setFormError("");
      if (mode === "create") {
        if (entity === "module") await adminApi.createModule(payload);
        else if (entity === "topic") await adminApi.createTopic(payload);
        else if (entity === "subtopic") await adminApi.createSubtopic(payload);
        else await adminApi.createLesson(payload);
      } else {
        if (entity === "module") await adminApi.updateModule(id!, payload);
        else if (entity === "topic") await adminApi.updateTopic(id!, payload);
        else if (entity === "subtopic") await adminApi.updateSubtopic(id!, payload);
        else await adminApi.updateLesson(id!, payload);
      }
      showToast(`${ENTITY[entity].label} ${mode === "create" ? "created" : "updated"}.`, "success");
      setForm(null);
      await fetchTree();
    } catch (err: any) {
      setFormError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const doDelete = async () => {
    if (!confirm) return;
    try {
      setDeleting(true);
      const { entity, id } = confirm;
      if (entity === "module") await adminApi.deleteModule(id);
      else if (entity === "topic") await adminApi.deleteTopic(id);
      else if (entity === "subtopic") await adminApi.deleteSubtopic(id);
      else await adminApi.deleteLesson(id);
      showToast(`${ENTITY[entity].label} deleted.`, "success");
      // Clear stale selections.
      if (entity === "module" && id === selectedModuleId) setSelectedModuleId(null);
      if (entity === "topic" && id === selectedTopicId) setSelectedTopicId(null);
      if (entity === "subtopic" && id === selectedSubtopicId) setSelectedSubtopicId(null);
      setConfirm(null);
      await fetchTree();
    } catch (err: any) {
      showToast(err?.message || "Failed to delete.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Reorder ─────────────────────────────────────────────────────────────────
  const persistOrder = async (entity: CurriculumEntity, ordered: { id: string }[], optimistic: Module[]) => {
    setModules(optimistic);
    try {
      await adminApi.reorder(entity, ordered.map((i) => i.id));
    } catch (err: any) {
      showToast(err?.message || "Failed to save order.", "error");
      fetchTree();
    }
  };

  const reorderModules = (ordered: Module[]) => persistOrder("module", ordered, ordered);
  const reorderTopics = (ordered: Topic[]) =>
    persistOrder("topic", ordered, modules.map((m) => (m.id === selectedModuleId ? { ...m, topics: ordered } : m)));
  const reorderSubtopics = (topic: Topic, ordered: Subtopic[]) =>
    persistOrder(
      "subtopic",
      ordered,
      modules.map((m) =>
        m.id === selectedModuleId
          ? { ...m, topics: m.topics.map((t) => (t.id === topic.id ? { ...t, subtopics: ordered } : t)) }
          : m,
      ),
    );
  const reorderLessons = (ordered: Lesson[]) =>
    persistOrder(
      "lesson",
      ordered,
      modules.map((m) =>
        m.id === selectedModuleId
          ? {
              ...m,
              topics: m.topics.map((t) =>
                t.id === selectedTopicId
                  ? { ...t, subtopics: t.subtopics.map((s) => (s.id === selectedSubtopicId ? { ...s, lessons: ordered } : s)) }
                  : t,
              ),
            }
          : m,
      ),
    );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-y-auto p-8 gap-6 animate-fade-in bg-gradient-to-br from-[#fcfcfb] to-[#f5f3ee]">
        <AdminPageHeader
          back={{ label: "Back to Dashboard", href: "/admin" }}
          eyebrow="Curriculum Structure"
          title="Learning Pathways"
          subtitle="Configure primary student paths: Modules → Topics → Subtopics → Lessons. Drag to reorder."
          actions={
            <AdminButton icon={Plus} onClick={() => openCreate("module")}>
              Create Module
            </AdminButton>
          }
        />

        {loading && modules.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white border border-zinc-200/60 rounded-3xl min-h-[400px]">
            <div className="w-8 h-8 border-4 border-[#01696F] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-400 font-bold mt-3 animate-pulse">Loading curriculum pathways…</p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[500px]">
            {/* Column 1: Modules */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Modules ({modules.length})</h3>
              <Reorderable
                items={modules}
                onReorder={reorderModules}
                className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1"
              >
                {(m, drag) => {
                  const isSelected = selectedModuleId === m.id;
                  return (
                    <div
                      onClick={() => {
                        setSelectedModuleId(m.id);
                        setSelectedTopicId(null);
                        setSelectedSubtopicId(null);
                      }}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 group",
                        isSelected
                          ? "bg-white border-[#01696F] shadow-md"
                          : "bg-white/80 border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50/50",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          {...drag}
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500"
                        >
                          <GripVertical size={14} />
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: m.accentColor || "#01696F" }}
                        />
                      </div>
                      <h4 className="text-xs font-black text-zinc-800 tracking-tight leading-tight">{m.name}</h4>
                      <p className="text-[10px] text-zinc-400 font-medium line-clamp-2">
                        {m.description || "No description provided."}
                      </p>
                      <RowActions
                        onEdit={() => openEdit("module", m)}
                        onDelete={() => setConfirm({ entity: "module", id: m.id, name: m.name })}
                      />
                    </div>
                  );
                }}
              </Reorderable>
            </div>

            {/* Column 2: Topics & Subtopics */}
            <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-3xl p-5 flex flex-col gap-4">
              {selectedModule ? (
                <>
                  <ColumnHeader
                    eyebrow={`Module: ${selectedModule.name}`}
                    title="Topics & Subtopics"
                    action={
                      <AdminButton size="sm" variant="soft" icon={Plus} onClick={() => openCreate("topic", selectedModule.id)}>
                        Add Topic
                      </AdminButton>
                    }
                  />
                  <div className="flex-1 overflow-y-auto max-h-[55vh] pr-1">
                    {selectedModule.topics.length === 0 ? (
                      <EmptyState icon={Layers} size="sm" title="No Topics Created" description="Create a topic inside this module to start layering the structure." />
                    ) : (
                      <Reorderable items={selectedModule.topics} onReorder={reorderTopics} className="space-y-4">
                        {(t, drag) => (
                          <div className="p-3.5 rounded-2xl border border-zinc-100 bg-white">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2 min-w-0">
                                <span {...drag} className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 mt-0.5">
                                  <GripVertical size={14} />
                                </span>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-extrabold text-zinc-800 tracking-tight truncate">{t.name}</h4>
                                  {t.subtitle && <p className="text-[9px] text-zinc-400 font-bold">{t.subtitle}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <IconBtn title="Edit topic" onClick={() => openEdit("topic", t)}><Pencil size={12} /></IconBtn>
                                <IconBtn title="Delete topic" danger onClick={() => setConfirm({ entity: "topic", id: t.id, name: t.name })}><Trash2 size={12} /></IconBtn>
                                <AdminButton size="sm" variant="ghost" icon={Plus} onClick={() => openCreate("subtopic", t.id)}>
                                  Subtopic
                                </AdminButton>
                              </div>
                            </div>

                            {/* Subtopics */}
                            <div className="mt-3 pl-3 border-l border-zinc-200/80">
                              {t.subtopics.length === 0 ? (
                                <p className="text-[9px] text-zinc-400 italic">No subtopics added yet.</p>
                              ) : (
                                <Reorderable items={t.subtopics} onReorder={(o) => reorderSubtopics(t, o)} className="space-y-2">
                                  {(sub, subDrag) => {
                                    const isSubSelected = selectedSubtopicId === sub.id;
                                    return (
                                      <div
                                        onClick={() => {
                                          setSelectedTopicId(t.id);
                                          setSelectedSubtopicId(sub.id);
                                        }}
                                        className={cn(
                                          "p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 group",
                                          isSubSelected
                                            ? "bg-[#E6F0F1]/60 border-[#01696F]/40"
                                            : "bg-zinc-50/30 border-zinc-150 hover:bg-zinc-50",
                                        )}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span {...subDrag} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500">
                                            <GripVertical size={12} />
                                          </span>
                                          <h5 className="text-[10px] font-extrabold text-zinc-700 leading-tight truncate">{sub.name}</h5>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <IconBtn title="Edit subtopic" onClick={(e) => { e.stopPropagation(); openEdit("subtopic", sub); }}><Pencil size={11} /></IconBtn>
                                          <IconBtn title="Delete subtopic" danger onClick={(e) => { e.stopPropagation(); setConfirm({ entity: "subtopic", id: sub.id, name: sub.name }); }}><Trash2 size={11} /></IconBtn>
                                          <ChevronRight size={12} className={isSubSelected ? "text-[#01696F]" : "text-zinc-300"} />
                                        </div>
                                      </div>
                                    );
                                  }}
                                </Reorderable>
                              )}
                            </div>
                          </div>
                        )}
                      </Reorderable>
                    )}
                  </div>
                </>
              ) : (
                <EmptyState icon={BookOpen} title="Select a Module" description="Choose a module on the left to display topics and subtopics." className="flex-1" />
              )}
            </div>

            {/* Column 3: Lessons */}
            <div className="lg:col-span-4 bg-white border border-zinc-200/80 rounded-3xl p-5 flex flex-col gap-4">
              {selectedSubtopic ? (
                <>
                  <ColumnHeader
                    eyebrow={`Subtopic: ${selectedSubtopic.name}`}
                    title={`Lessons (${selectedSubtopic.lessons.length})`}
                    action={
                      <AdminButton size="sm" variant="soft" icon={Plus} onClick={() => openCreate("lesson", selectedSubtopic.id)}>
                        Add Lesson
                      </AdminButton>
                    }
                  />
                  <div className="flex-1 overflow-y-auto max-h-[55vh] pr-1">
                    {selectedSubtopic.lessons.length === 0 ? (
                      <EmptyState icon={FolderOpen} size="sm" title="No Lessons Found" description="Create a lesson to start building questions and spreadsheet drills." />
                    ) : (
                      <Reorderable items={selectedSubtopic.lessons} onReorder={reorderLessons} className="space-y-3">
                        {(l, drag) => (
                          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white border border-zinc-100 hover:border-zinc-200 transition-all group">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span {...drag} className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500">
                                <GripVertical size={13} />
                              </span>
                              <DifficultyBadge difficulty={l.difficulty} className="shrink-0 !px-2 !py-0.5 !text-[9px]" />
                              <p className="text-xs font-semibold text-zinc-700 truncate">{l.name}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <IconBtn title="Edit lesson" onClick={() => openEdit("lesson", l)}><Pencil size={12} /></IconBtn>
                              <IconBtn title="Delete lesson" danger onClick={() => setConfirm({ entity: "lesson", id: l.id, name: l.name })}><Trash2 size={12} /></IconBtn>
                              <button
                                onClick={() => router.push(`/admin/lessons/${l.id}`)}
                                className="text-[10px] font-bold text-[#01696F] px-2.5 py-1.5 hover:bg-[#E6F0F1] rounded-lg"
                              >
                                Activities →
                              </button>
                            </div>
                          </div>
                        )}
                      </Reorderable>
                    )}
                  </div>
                </>
              ) : (
                <EmptyState icon={FolderOpen} title="Select a Subtopic" description="Choose a subtopic in the middle column to inspect and configure lessons." className="flex-1" />
              )}
            </div>
          </div>
        )}

        {/* Create / Edit modal */}
        {form && (
          <Modal
            open
            onClose={() => setForm(null)}
            dismissable={!submitting}
            title={`${form.mode === "create" ? "Create" : "Edit"} ${ENTITY[form.entity].label}`}
            footer={
              <>
                <AdminButton variant="ghost" onClick={() => setForm(null)} disabled={submitting}>Cancel</AdminButton>
                <AdminButton type="submit" form="entity-form" loading={submitting}>
                  {form.mode === "create" ? "Create" : "Save changes"}
                </AdminButton>
              </>
            }
          >
            <form id="entity-form" onSubmit={submitForm} className="space-y-4">
              <FormAlert message={formError} />
              {form.entity === "module" ? (
                <>
                  <Field label="Module Title" required>
                    <Input value={form.values.name} onChange={(e) => setValue("name", e.target.value)} placeholder="e.g. Accounting Principles" autoFocus />
                  </Field>
                  <Field label="Slug" required>
                    <Input className="font-mono" value={form.values.slug} onChange={(e) => setValue("slug", e.target.value)} placeholder="accounting-principles" />
                  </Field>
                  <Field label="Description">
                    <Textarea value={form.values.description} onChange={(e) => setValue("description", e.target.value)} placeholder="Describe the focus of the module…" />
                  </Field>
                  <Field label="Accent Color" className="max-w-[140px]">
                    <ColorInput value={form.values.accentColor} onChange={(e) => setValue("accentColor", e.target.value)} />
                  </Field>
                </>
              ) : form.entity === "topic" ? (
                <>
                  <Field label="Topic Title" required>
                    <Input value={form.values.name} onChange={(e) => setValue("name", e.target.value)} placeholder="e.g. Income Statement Fundamentals" autoFocus />
                  </Field>
                  <Field label="Subtitle">
                    <Input value={form.values.subtitle} onChange={(e) => setValue("subtitle", e.target.value)} placeholder="Short supporting line" />
                  </Field>
                  <Field label="Description">
                    <Textarea value={form.values.description} onChange={(e) => setValue("description", e.target.value)} placeholder="Provide details on topic outcomes…" />
                  </Field>
                </>
              ) : form.entity === "subtopic" ? (
                <>
                  <Field label="Subtopic Title" required>
                    <Input value={form.values.name} onChange={(e) => setValue("name", e.target.value)} placeholder="e.g. Operating Expenses Analysis" autoFocus />
                  </Field>
                  <Field label="Description">
                    <Textarea value={form.values.description} onChange={(e) => setValue("description", e.target.value)} placeholder="Describe subtopic outcomes…" />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Lesson Title" required>
                    <Input value={form.values.name} onChange={(e) => setValue("name", e.target.value)} placeholder="e.g. Distinguishing COGS vs Operating Expenses" autoFocus />
                  </Field>
                  <Field label="Description">
                    <Textarea value={form.values.description} onChange={(e) => setValue("description", e.target.value)} placeholder="Describe lesson objectives…" />
                  </Field>
                  <Field label="Difficulty" className="max-w-[160px]">
                    <Select value={form.values.difficulty} onChange={(e) => setValue("difficulty", e.target.value)}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </Select>
                  </Field>
                </>
              )}
            </form>
          </Modal>
        )}

        {/* Delete confirm */}
        <ConfirmDialog
          open={!!confirm}
          loading={deleting}
          title={`Delete ${confirm ? ENTITY[confirm.entity].label : ""}`}
          message={
            <>
              Delete <span className="font-bold text-zinc-800">{confirm?.name}</span>? This also hides everything nested
              inside it. You can ask a developer to restore it later.
            </>
          }
          onConfirm={doDelete}
          onClose={() => setConfirm(null)}
        />
      </div>
    </MainLayout>
  );
}

// ── Small local presentational helpers ──────────────────────────────────────────
function ColumnHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 gap-3">
      <div className="min-w-0">
        <span className="text-[8px] font-black uppercase text-[#01696F] tracking-widest block truncate">{eyebrow}</span>
        <h3 className="text-xs font-extrabold text-zinc-800 tracking-tight mt-0.5">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        danger ? "text-zinc-400 hover:bg-rose-50 hover:text-rose-600" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700",
      )}
    >
      {children}
    </button>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <IconBtn title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(); }}><Pencil size={12} /></IconBtn>
      <IconBtn title="Delete" danger onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 size={12} /></IconBtn>
    </div>
  );
}
