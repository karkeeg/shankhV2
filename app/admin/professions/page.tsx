"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { adminApi } from "@/lib/api";
import { useToastStore } from "@/lib/toast-store";
import { ProfessionAdminCardSkeleton } from "@/components/ui/Skeletons";
import {
  AdminPageHeader,
  AdminButton,
  Modal,
  Field,
  Input,
  Textarea,
  FormAlert,
  EmptyState,
  ConfirmDialog,
  Badge,
} from "@/components/admin/ui";
import {
  Briefcase, Plus, Pencil, Trash2, X, Search, ChevronRight,
  TrendingUp, Globe, Award, BookOpen, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AVAILABLE_ICONS = [
  { key: "Briefcase", icon: Briefcase, label: "Business" },
  { key: "TrendingUp", icon: TrendingUp, label: "Finance" },
  { key: "Globe", icon: Globe, label: "Global" },
  { key: "Award", icon: Award, label: "Expertise" },
  { key: "BookOpen", icon: BookOpen, label: "Education" },
  { key: "Layers", icon: Layers, label: "Architecture" },
];

const iconFor = (key: string | null) =>
  AVAILABLE_ICONS.find((i) => i.key === key)?.icon ?? Briefcase;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

interface Profession {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconKey: string | null;
  orderIndex: number;
  isActive: boolean;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  iconKey: string;
  orderIndex: number;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "", slug: "", description: "", iconKey: "Briefcase", orderIndex: 1, isActive: true,
};

export default function ProfessionsAdmin() {
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profession | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [confirm, setConfirm] = useState<Profession | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProfessions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.professions<Profession[]>();
      setProfessions(data ?? []);
    } catch (e: any) {
      showToast(e?.message || "Failed to load professions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessions();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      orderIndex: professions.length ? Math.max(...professions.map((p) => p.orderIndex)) + 1 : 1,
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (p: Profession) => {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      iconKey: p.iconKey ?? "Briefcase",
      orderIndex: p.orderIndex,
      isActive: p.isActive,
    });
    setFormError("");
    setModalOpen(true);
  };

  const setName = (name: string) =>
    setForm((prev) => ({ ...prev, name, slug: editing ? prev.slug : slugify(name) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return setFormError("Name and slug are required.");
    try {
      setSubmitting(true);
      setFormError("");
      const payload = { ...form, orderIndex: Number(form.orderIndex) };
      if (editing) await adminApi.updateProfession(editing.id, payload);
      else await adminApi.createProfession(payload);
      showToast(`Profession ${editing ? "updated" : "created"}.`, "success");
      setModalOpen(false);
      fetchProfessions();
    } catch (err: any) {
      setFormError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    try {
      setDeleting(true);
      await adminApi.deleteProfession(confirm.id);
      setProfessions((prev) => prev.filter((p) => p.id !== confirm.id));
      showToast("Profession deleted.", "success");
      setConfirm(null);
    } catch (err: any) {
      showToast(err?.message || "Failed to delete.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return professions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [professions, search]);

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-y-auto p-8 gap-6 animate-fade-in">
        <AdminPageHeader
          back={{ label: "Back to Dashboard", href: "/admin" }}
          eyebrow="Profession Setup"
          title="Corporate Professions"
          subtitle="Configure professional career tracks and connect them to custom corporate skill-building curricula."
          actions={<AdminButton icon={Plus} onClick={openCreate}>Create Profession</AdminButton>}
        />

        {/* Search */}
        <div className="flex items-center gap-3 bg-white border border-zinc-200/80 rounded-2xl px-4 py-3 shadow-sm shrink-0">
          <Search size={18} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search professions by name, slug, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium text-zinc-700 bg-transparent outline-none placeholder:text-zinc-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <ProfessionAdminCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-zinc-200/60 rounded-3xl p-12 shadow-sm">
            <EmptyState
              icon={Briefcase}
              title="No Professions Found"
              description={search ? "Try a different search keyword." : "Add your first career track, like Investment Banker or Auditor."}
              action={!search && <AdminButton icon={Plus} onClick={openCreate}>Add First Profession</AdminButton>}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => {
              const Icon = iconFor(p.iconKey);
              return (
                <div
                  key={p.id}
                  className={cn(
                    "bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between group min-h-[220px] transition-all",
                    p.isActive ? "border-zinc-200/80 hover:border-[#01696F]/30" : "border-zinc-200/50 opacity-75",
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="p-3.5 bg-[#E6F0F1] text-[#01696F] rounded-2xl group-hover:scale-105 transition-transform">
                        <Icon size={22} />
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(p)} title="Edit" className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-[#01696F]">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setConfirm(p)} title="Delete" className="p-2 hover:bg-rose-50 rounded-xl text-zinc-500 hover:text-rose-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge tone="neutral" className="!px-2 !py-0.5 !text-[9px] !rounded-full">Order: {p.orderIndex}</Badge>
                        {!p.isActive && <Badge tone="amber" className="!px-2 !py-0.5 !text-[9px] !rounded-full">Draft</Badge>}
                      </div>
                      <h3 className="text-base font-extrabold text-zinc-900 leading-snug">{p.name}</h3>
                      <p className="text-xs text-zinc-500 font-medium line-clamp-2">{p.description || "No description provided."}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 lowercase select-all">slug: {p.slug}</span>
                    <AdminButton size="sm" variant="soft" onClick={() => router.push(`/admin/professions/${p.id}/tests`)}>
                      Skill Topics <ChevronRight size={14} />
                    </AdminButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create / Edit modal */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          dismissable={!submitting}
          size="lg"
          title={editing ? "Edit Profession" : "Create Career Profession"}
          footer={
            <>
              <AdminButton variant="ghost" onClick={() => setModalOpen(false)} disabled={submitting}>Cancel</AdminButton>
              <AdminButton type="submit" form="profession-form" loading={submitting}>
                {editing ? "Save changes" : "Create Profession"}
              </AdminButton>
            </>
          }
        >
          <form id="profession-form" onSubmit={submit} className="space-y-5">
            <FormAlert message={formError} />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Profession Name" required>
                <Input value={form.name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chartered Accountant" autoFocus />
              </Field>
              <Field label="Slug" required>
                <Input className="font-mono" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="chartered-accountant" />
              </Field>
            </div>

            <Field label="Description">
              <Textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Provide a concise description of the career path…" />
            </Field>

            {/* Icon picker grid */}
            <Field label="Icon">
              <div className="grid grid-cols-6 gap-2">
                {AVAILABLE_ICONS.map(({ key, icon: Icon, label }) => {
                  const active = form.iconKey === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      title={label}
                      onClick={() => setForm((p) => ({ ...p, iconKey: key }))}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all",
                        active ? "bg-[#E6F0F1] border-[#01696F] text-[#01696F]" : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300",
                      )}
                    >
                      <Icon size={18} />
                      <span className="text-[8px] font-bold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="flex items-center justify-between gap-4">
              <Field label="Order Index" className="max-w-[120px]">
                <Input type="number" value={form.orderIndex} onChange={(e) => setForm((p) => ({ ...p, orderIndex: parseInt(e.target.value) || 0 }))} />
              </Field>
              <label className="flex items-center gap-2.5 cursor-pointer pt-4">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-[#01696F] rounded"
                />
                <span className="text-xs font-bold text-zinc-600">Active &amp; available for students</span>
              </label>
            </div>
          </form>
        </Modal>

        {/* Delete confirm */}
        <ConfirmDialog
          open={!!confirm}
          loading={deleting}
          title="Delete Career Track?"
          confirmLabel="Delete Forever"
          message={
            <>
              Delete <span className="font-bold text-zinc-800">{confirm?.name}</span>? This cascades and removes all child
              skill topics, skill lessons, and user progress records.
            </>
          }
          onConfirm={doDelete}
          onClose={() => setConfirm(null)}
        />
      </div>
    </MainLayout>
  );
}
