"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import { ArrowLeft, Save, Loader2, PenLine, Check, AlertCircle } from "lucide-react";
import { AdminCanvasEditor, AdminCanvasData } from "@/components/admin/AdminCanvasEditor";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const DEFAULT: AdminCanvasData = {
  title: "", instructions: "", context: "",
  scoringMode: "partial", paletteItems: [], solutionSnapshot: null,
};

export default function CanvasAdminPage() {
  const params = useParams();
  const lessonId = params.id as string;
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const headers = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  const [data, setData] = useState<AdminCanvasData>({ ...DEFAULT });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/v1/admin/lessons/${lessonId}`, { headers })
      .then((r) => r.json())
      .then((json) => {
        const a = json.data?.canvasActivity;
        if (a) {
          setData({
            title: a.title || "",
            instructions: a.instructions || "",
            context: a.context || "",
            scoringMode: a.scoringMode || "partial",
            paletteItems: a.paletteItems ?? a.tokens?.map((t: any) => ({
              id: t.id || crypto.randomUUID(),
              label: t.content || t.label || t.displayText || "",
              shape: (t.type === "ellipse" ? "ellipse" : t.type === "diamond" ? "diamond" : "rectangle") as "rectangle" | "ellipse" | "diamond",
              color: t.color || "#dbeafe",
            })) ?? [],
            solutionSnapshot: a.solutionSnapshot ?? null,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleSave = async () => {
    if (!data.title.trim() || !data.instructions.trim()) {
      showToast("error", "Title and instructions are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/lessons/${lessonId}/canvas`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: data.title,
          instructions: data.instructions,
          context: data.context,
          scoringMode: data.scoringMode,
          paletteItems: data.paletteItems,
          solutionSnapshot: data.solutionSnapshot,
          tokens: data.paletteItems.map((p) => ({
            id: p.id, content: p.label, type: p.shape, tokenRole: "operand",
          })),
          assemblyMode: "graph",
        }),
      });
      if (res.ok) showToast("success", "Canvas activity saved!");
      else showToast("error", "Failed to save.");
    } catch {
      showToast("error", "Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center h-full text-[#01696F]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-hidden bg-zinc-50">

        {/* Toast */}
        {toast && (
          <div className={cn(
            "fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl",
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          )}>
            {toast.type === "success" ? <Check size={13} /> : <AlertCircle size={13} />}
            {toast.msg}
          </div>
        )}

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-zinc-200 shrink-0 flex-wrap">
          <button
            onClick={() => router.push(`/admin/lessons/${lessonId}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#01696F]/70 hover:text-[#01696F] group shrink-0"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Lesson
          </button>
          <div className="h-5 w-px bg-zinc-200 shrink-0" />
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-black shrink-0">
            <PenLine size={11} /> Canvas Drill
          </span>
          <input
            value={data.title}
            onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
            placeholder="Activity title *"
            className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium outline-none w-44 focus:bg-white focus:border-indigo-300"
          />
          <input
            value={data.instructions}
            onChange={(e) => setData((d) => ({ ...d, instructions: e.target.value }))}
            placeholder="Instructions for students *"
            className="flex-1 min-w-[180px] px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:bg-white focus:border-indigo-300"
          />
          <select
            value={data.scoringMode}
            onChange={(e) => setData((d) => ({ ...d, scoringMode: e.target.value as "partial" | "exact" }))}
            className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 outline-none focus:bg-white shrink-0"
          >
            <option value="partial">Partial credit</option>
            <option value="exact">Exact match</option>
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-40 ml-auto shrink-0 transition-all active:scale-95"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? "Saving..." : "Save Canvas"}
          </button>
        </div>

        {/* ── Context sub-bar ── */}
        <div className="flex items-center gap-3 px-5 py-2 bg-white border-b border-zinc-100 shrink-0">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 shrink-0">Context / Scenario</span>
          <input
            value={data.context}
            onChange={(e) => setData((d) => ({ ...d, context: e.target.value }))}
            placeholder="Optional background text shown above the canvas..."
            className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:bg-white focus:border-indigo-300"
          />
        </div>

        {/* ── Editor body ── */}
        <div className="flex-1 overflow-y-auto p-6">
          <AdminCanvasEditor value={data} onChange={setData} compact />
        </div>

      </div>
    </MainLayout>
  );
}
