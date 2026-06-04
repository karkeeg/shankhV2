"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const DIFF_OPTS = ["easy", "medium", "hard"];

export default function AdminCasesPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", difficulty: "medium", isPublished: false, orderIndex: 0 });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/v1/cases/admin/list`, { headers })
      .then((r) => r.json())
      .then((res) => setCases(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/v1/cases/admin/create`, { method: "POST", headers, body: JSON.stringify(form) });
      const rj = await res.json();
      if (res.ok) { setShowForm(false); setForm({ title: "", description: "", difficulty: "medium", isPublished: false, orderIndex: 0 }); load(); }
    } finally { setSaving(false); }
  };

  const handleTogglePublish = async (c: any) => {
    await fetch(`${API}/api/v1/cases/admin/${c.id}`, { method: "PUT", headers, body: JSON.stringify({ ...c, isPublished: !c.isPublished }) });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this case simulation?")) return;
    await fetch(`${API}/api/v1/cases/admin/${id}`, { method: "DELETE", headers });
    load();
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-6 max-h-[calc(100vh-24px)] overflow-y-auto">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-800">Case Simulations</h1>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">Manage case simulations for the Skill Building section</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[#01696F] text-white text-xs font-black rounded-xl shadow-sm hover:bg-[#01696F]/90 transition-all active:scale-95"
          >
            <Plus size={14} /> New Case
          </button>
        </header>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-extrabold text-zinc-800">New Case Simulation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Title *</label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10" placeholder="e.g. DCF Valuation Case" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Difficulty</label>
                <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                  className="border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#01696F]">
                  {DIFF_OPTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2} className="border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#01696F] resize-none" placeholder="Brief description..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={form.orderIndex} onChange={(e) => setForm((f) => ({ ...f, orderIndex: +e.target.value }))}
                  className="w-20 border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#01696F]" placeholder="0" />
                <label className="text-xs text-zinc-500 font-semibold">Order index</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pub" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} className="w-4 h-4 accent-[#01696F]" />
                <label htmlFor="pub" className="text-xs text-zinc-600 font-semibold">Publish immediately</label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-[#01696F] text-white text-xs font-black rounded-xl hover:bg-[#01696F]/90 disabled:opacity-60 flex items-center gap-1.5 active:scale-95">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create
              </button>
            </div>
          </form>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#01696F]" /></div>
        ) : cases.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 font-semibold text-sm">No case simulations yet. Create one above.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {cases.map((c) => (
              <div key={c.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-zinc-800 truncate">{c.title}</p>
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border uppercase", c.isPublished ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-zinc-100 text-zinc-400 border-zinc-200")}>
                      {c.isPublished ? "Published" : "Draft"}
                    </span>
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border uppercase",
                      c.difficulty === "easy" ? "bg-[#E6F0F1] text-[#01696F] border-[#01696F]/20" : c.difficulty === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-600 border-red-200"
                    )}>{c.difficulty}</span>
                  </div>
                  {c.description && <p className="text-[11px] text-zinc-500 font-medium truncate">{c.description}</p>}
                  <p className="text-[10px] text-zinc-400 font-semibold">{c._count?.caseStudies ?? 0} studies · {c._count?.caseActivities ?? 0} activities</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleTogglePublish(c)} title={c.isPublished ? "Unpublish" : "Publish"}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-all">
                    {c.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => router.push(`/admin/cases/${c.id}`)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 text-zinc-400 hover:text-[#01696F] transition-all">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => router.push(`/admin/cases/${c.id}`)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#E6F0F1] text-[#01696F] text-[10px] font-black rounded-xl border border-[#01696F]/20 hover:bg-[#DFEAEA] transition-all active:scale-95">
                    Manage <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
