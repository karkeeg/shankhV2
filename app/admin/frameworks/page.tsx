"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { frameworksApi } from "@/lib/api";
import { useToastStore } from "@/lib/toast-store";
import {
  AdminPageHeader, AdminButton, Modal, Field, Input, Textarea, FormAlert, ConfirmDialog, EmptyState, Badge,
} from "@/components/admin/ui";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, ArrowRight, Network } from "lucide-react";

interface FrameworkRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  structure?: { nodes?: { isBlank?: boolean }[]; edges?: unknown[] };
}

const EMPTY_FORM = { name: "", description: "", category: "" };

function counts(fw: FrameworkRow) {
  const nodes = fw.structure?.nodes ?? [];
  return { total: nodes.length, blanks: nodes.filter((n) => n.isBlank).length, edges: fw.structure?.edges?.length ?? 0 };
}

export default function AdminFrameworksPage() {
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [frameworks, setFrameworks] = useState<FrameworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmDel, setConfirmDel] = useState<FrameworkRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    frameworksApi
      .adminList<FrameworkRow[]>()
      .then((data) => setFrameworks(data ?? []))
      .catch((e: any) => showToast(e?.message || "Failed to load frameworks", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(""); setShowForm(true); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError("Name is required.");
    setSaving(true); setFormError("");
    try {
      const created = await frameworksApi.adminCreate<FrameworkRow>({ ...form, structure: { nodes: [], edges: [] } });
      setShowForm(false);
      setForm(EMPTY_FORM);
      showToast("Framework created.", "success");
      if (created?.id) router.push(`/admin/frameworks/${created.id}`);
      else load();
    } catch (e: any) {
      setFormError(e?.message || "Failed to create framework.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (fw: FrameworkRow) => {
    try {
      await frameworksApi.adminUpdate(fw.id, { isActive: !fw.isActive });
      showToast(fw.isActive ? "Framework deactivated." : "Framework activated.", "success");
      load();
    } catch (e: any) {
      showToast(e?.message || "Failed to update.", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      setDeleting(true);
      await frameworksApi.adminDelete(confirmDel.id);
      setFrameworks((prev) => prev.filter((f) => f.id !== confirmDel.id));
      showToast("Framework deleted.", "success");
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
          title="Framework Library"
          subtitle="Reusable consulting-style diagrams with locked and blank nodes, used by case simulation canvas activities."
          actions={<AdminButton icon={Plus} onClick={openCreate}>New Framework</AdminButton>}
        />

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#01696F]" /></div>
        ) : frameworks.length === 0 ? (
          <div className="bg-white border border-zinc-200/60 rounded-3xl p-12 shadow-sm">
            <EmptyState
              icon={Network}
              title="No frameworks yet"
              description="Create your first framework, then lay out its nodes and connections."
              action={<AdminButton icon={Plus} onClick={openCreate}>New Framework</AdminButton>}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {frameworks.map((fw) => {
              const c = counts(fw);
              return (
                <div key={fw.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-extrabold text-zinc-800 truncate">{fw.name}</p>
                      <Badge tone={fw.isActive ? "green" : "neutral"} className="!px-2 !py-0.5 !text-[9px]">{fw.isActive ? "Active" : "Inactive"}</Badge>
                      {fw.category && <Badge tone="amber" className="!px-2 !py-0.5 !text-[9px]">{fw.category}</Badge>}
                    </div>
                    {fw.description && <p className="text-[11px] text-zinc-500 font-medium truncate">{fw.description}</p>}
                    <p className="text-[10px] text-zinc-400 font-semibold">{c.total} nodes · {c.blanks} blank · {c.edges} connections</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleToggleActive(fw)} title={fw.isActive ? "Deactivate" : "Activate"} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-all">
                      {fw.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => router.push(`/admin/frameworks/${fw.id}`)} title="Edit" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 text-zinc-400 hover:text-[#01696F] transition-all">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmDel(fw)} title="Delete" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                    <AdminButton size="sm" variant="soft" onClick={() => router.push(`/admin/frameworks/${fw.id}`)}>
                      Build <ArrowRight size={11} />
                    </AdminButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          dismissable={!saving}
          size="lg"
          title="New Framework"
          footer={
            <>
              <AdminButton variant="ghost" onClick={() => setShowForm(false)} disabled={saving}>Cancel</AdminButton>
              <AdminButton type="submit" form="framework-form" loading={saving}>Create & Build</AdminButton>
            </>
          }
        >
          <form id="framework-form" onSubmit={handleCreate} className="space-y-4">
            <FormAlert message={formError} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name" required>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Market Entry Framework" autoFocus />
              </Field>
              <Field label="Category">
                <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Consulting" />
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description…" />
            </Field>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!confirmDel}
          loading={deleting}
          title="Delete Framework?"
          message={
            <>
              Delete <span className="font-bold text-zinc-800">{confirmDel?.name}</span>? Case activities that reference it
              will lose this option.
            </>
          }
          onConfirm={handleDelete}
          onClose={() => setConfirmDel(null)}
        />
      </div>
    </MainLayout>
  );
}
