"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { AdminCanvasEditor, AdminCanvasData } from "@/components/admin/AdminCanvasEditor";

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

  // Load existing canvas activity
  useEffect(() => {
    fetch(`${API}/api/v1/admin/lessons/${lessonId}`, { headers })
      .then(r => r.json())
      .then(json => {
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
          // Legacy compat fields
          tokens: data.paletteItems.map(p => ({
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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#01696F]" />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-6 max-h-[calc(100vh-24px)] overflow-y-auto">

        {/* Header */}
        <header className="flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[#01696F] transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
            <div className="h-4 w-px bg-zinc-200" />
            <div>
              <h1 className="text-xl font-black text-zinc-800">Canvas Activity Editor</h1>
              <p className="text-[10px] text-zinc-400 font-medium">Build the palette and draw the solution graph</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#01696F] text-white text-xs font-black rounded-xl hover:bg-[#01696F]/90 disabled:opacity-60 shadow-sm active:scale-95 transition-all">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save Activity
          </button>
        </header>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
            {toast.msg}
          </div>
        )}

        {/* Editor — same component used everywhere */}
        <AdminCanvasEditor value={data} onChange={setData} />
      </div>
    </MainLayout>
  );
}
