"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { casesApi } from "@/lib/api";
import { useToastStore } from "@/lib/toast-store";
import {
  AdminPageHeader, AdminButton, Modal, Field, Input, Textarea, Select, FormAlert, ConfirmDialog, EmptyState, Badge,
} from "@/components/admin/ui";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, ArrowRight, FileText } from "lucide-react";

const DIFF_OPTS = ["easy", "medium", "hard"];
const DIFF_TONE: Record<string, "teal" | "amber" | "rose"> = { easy: "teal", medium: "amber", hard: "rose" };

interface CaseRow {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  isPublished: boolean;
  orderIndex: number;
  _count?: { caseStudies: number; caseActivities: number };
}

const EMPTY_FORM = { title: "", description: "", difficulty: "medium", isPublished: false, orderIndex: 0 };

export default function AdminCasesPage() {
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmDel, setConfirmDel] = useState<CaseRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    casesApi
      .adminList<CaseRow[]>()
      .then((data) => setCases(data ?? []))
      .catch((e: any) => showToast(e?.message || "Failed to load cases", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, orderIndex: cases.length });
    setFormError("");
    setShowForm(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setFormError("Title is required.");
    setSaving(true); setFormError("");
    try {
      await casesApi.adminCreate(form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
      showToast("Case created.", "success");
    } catch (e: any) {
      setFormError(e?.message || "Failed to create case.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (c: CaseRow) => {
    try {
      await casesApi.adminUpdate(c.id, { ...c, isPublished: !c.isPublished });
      showToast(c.isPublished ? "Case unpublished." : "Case published.", "success");
      load();
    } catch (e: any) {
      showToast(e?.message || "Failed to update.", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      setDeleting(true);
      await casesApi.adminDelete(confirmDel.id);
      setCases((prev) => prev.filter((c) => c.id !== confirmDel.id));
      showToast("Case deleted.", "success");
      setConfirmDel(null);
    } catch (e: any) {
      showToast(e?.message || "Failed to delete.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-8 max-h-[calc(100vh-24px)] overflow-y-auto animate-fade-in">
        <AdminPageHeader
          back={{ label: "Back to Dashboard", href: "/admin" }}
          eyebrow="Skill Building"
          title="Case Simulations"
          subtitle="Manage case simulations with reading material and manual test activities."
          actions={<AdminButton icon={Plus} onClick={openCreate}>New Case</AdminButton>}
        />

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#01696F]" /></div>
        ) : cases.length === 0 ? (
          <div className="bg-white border border-zinc-200/60 rounded-3xl p-12 shadow-sm">
            <EmptyState
              icon={FileText}
              title="No case simulations yet"
              description="Create your first case to add reading studies and test activities."
              action={<AdminButton icon={Plus} onClick={openCreate}>New Case</AdminButton>}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cases.map((c) => (
              <div key={c.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-zinc-800 truncate">{c.title}</p>
                    <Badge tone={c.isPublished ? "green" : "neutral"} className="!px-2 !py-0.5 !text-[9px]">{c.isPublished ? "Published" : "Draft"}</Badge>
                    <Badge tone={DIFF_TONE[c.difficulty] ?? "neutral"} className="!px-2 !py-0.5 !text-[9px]">{c.difficulty}</Badge>
                  </div>
                  {c.description && <p className="text-[11px] text-zinc-500 font-medium truncate">{c.description}</p>}
                  <p className="text-[10px] text-zinc-400 font-semibold">{c._count?.caseStudies ?? 0} studies · {c._count?.caseActivities ?? 0} activities</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleTogglePublish(c)} title={c.isPublished ? "Unpublish" : "Publish"} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-all">
                    {c.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => router.push(`/admin/cases/${c.id}/preview`)} title="Edit" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 text-zinc-400 hover:text-[#01696F] transition-all">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDel(c)} title="Delete" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                  <AdminButton size="sm" variant="soft" onClick={() => router.push(`/admin/cases/${c.id}/preview`)}>
                    Manage <ArrowRight size={11} />
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create modal */}
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          dismissable={!saving}
          size="lg"
          title="New Case Simulation"
          footer={
            <>
              <AdminButton variant="ghost" onClick={() => setShowForm(false)} disabled={saving}>Cancel</AdminButton>
              <AdminButton type="submit" form="case-form" loading={saving}>Create Case</AdminButton>
            </>
          }
        >
          <form id="case-form" onSubmit={handleCreate} className="space-y-4">
            <FormAlert message={formError} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Title" required>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. DCF Valuation Case" autoFocus />
              </Field>
              <Field label="Difficulty">
                <Select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                  {DIFF_OPTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description…" />
            </Field>
            <div className="flex items-center justify-between gap-4">
              <Field label="Order Index" className="max-w-[120px]">
                <Input type="number" value={form.orderIndex} onChange={(e) => setForm((f) => ({ ...f, orderIndex: +e.target.value }))} />
              </Field>
              <label className="flex items-center gap-2.5 cursor-pointer pt-4">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} className="w-4 h-4 accent-[#01696F] rounded" />
                <span className="text-xs font-bold text-zinc-600">Publish immediately</span>
              </label>
            </div>
          </form>
        </Modal>

        {/* Delete confirm */}
        <ConfirmDialog
          open={!!confirmDel}
          loading={deleting}
          title="Delete Case Simulation?"
          message={
            <>
              Delete <span className="font-bold text-zinc-800">{confirmDel?.title}</span>? This removes its studies and
              activities. Existing user sessions are preserved.
            </>
          }
          onConfirm={handleDelete}
          onClose={() => setConfirmDel(null)}
        />
      </div>
    </MainLayout>
  );
}
