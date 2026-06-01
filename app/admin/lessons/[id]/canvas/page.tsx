"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft, Plus, Trash2, Save, Check, AlertCircle, Scan, Info,
} from "lucide-react";
import { CanvasExercise, ExcalidrawSceneElement } from "@/components/exercise/CanvasExercise";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface PaletteItem { displayText: string; itemType: string; isReusable: boolean; }
interface DetectedNode { paletteIdx: number; x: number; y: number; elementId: string; }
interface DetectedEdge { fromIdx: number; toIdx: number; label: string; }

export default function CanvasAdminEditor() {
  const params = useParams();
  const lessonId = params.id as string;
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const headers = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  // ── Meta ──
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [context, setContext] = useState("");
  const [canvasW, setCanvasW] = useState(900);
  const [canvasH, setCanvasH] = useState(600);

  // ── Palette ──
  const [paletteItems, setPaletteItems] = useState<PaletteItem[]>([]);
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState("concept");

  // ── Canvas elements (captured via ref to avoid re-renders) ──
  const elementsRef = useRef<ExcalidrawSceneElement[]>([]);
  const [detected, setDetected] = useState<{ nodes: DetectedNode[]; edges: DetectedEdge[] } | null>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load existing data ──
  useEffect(() => {
    fetch(`${API}/api/v1/admin/lessons/${lessonId}`, { headers })
      .then((r) => r.json())
      .then((json) => {
        const a = json.data?.canvasActivity;
        if (a) {
          setTitle(a.title || "");
          setInstructions(a.instructions || "");
          setContext(a.context || "");
          setCanvasW(a.canvasWidth || 900);
          setCanvasH(a.canvasHeight || 600);
          setPaletteItems(
            (a.paletteItems || []).map((p: any) => ({
              displayText: p.displayText, itemType: p.itemType, isReusable: p.isReusable,
            }))
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleElementsChange = useCallback((elements: ExcalidrawSceneElement[]) => {
    elementsRef.current = elements;
  }, []);

  const addPaletteItem = () => {
    if (!newText.trim()) return;
    setPaletteItems((p) => [...p, { displayText: newText.trim(), itemType: newType, isReusable: false }]);
    setNewText("");
  };

  // ── Parse Excalidraw scene into solution nodes + edges ──
  const parseCanvas = () => {
    const elements = elementsRef.current.filter((el) => !(el as any).isDeleted);

    const shapes = elements.filter((el) =>
      ["rectangle", "ellipse", "diamond"].includes(el.type)
    );
    const texts = elements.filter((el) => el.type === "text");
    const arrows = elements.filter((el) => el.type === "arrow");

    // For each shape, find its label text (grouped or nearby)
    const shapeLabels: Record<string, string> = {};
    shapes.forEach((shape) => {
      // Try same group first
      const groupIds = (shape.groupIds as string[]) || [];
      const grouped = texts.find((t) =>
        ((t.groupIds as string[]) || []).some((gid) => groupIds.includes(gid))
      );
      if (grouped) {
        shapeLabels[shape.id] = ((grouped as any).text || "").trim();
        return;
      }
      // Fallback: nearest text within the shape's bounding box
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      const nearby = texts.find((t) => {
        const tx = t.x + (t.width || 0) / 2;
        const ty = t.y + (t.height || 0) / 2;
        return Math.abs(tx - cx) < shape.width && Math.abs(ty - cy) < shape.height;
      });
      if (nearby) shapeLabels[shape.id] = ((nearby as any).text || "").trim();
    });

    // Match shapes to palette items
    const nodes: DetectedNode[] = [];
    const usedShapeIds = new Set<string>();

    paletteItems.forEach((item, pi) => {
      const match = shapes.find((s) => {
        if (usedShapeIds.has(s.id)) return false;
        const label = shapeLabels[s.id] || "";
        return (
          label.toLowerCase().includes(item.displayText.toLowerCase()) ||
          item.displayText.toLowerCase().includes(label.toLowerCase().replace(/\s+/g, " "))
        );
      });
      if (match) {
        usedShapeIds.add(match.id);
        nodes.push({
          paletteIdx: pi,
          x: Math.round(match.x + match.width / 2),
          y: Math.round(match.y + match.height / 2),
          elementId: match.id,
        });
      }
    });

    // Match arrows to node pairs
    const edges: DetectedEdge[] = [];
    arrows.forEach((arrow) => {
      const startId = (arrow as any).startBinding?.elementId;
      const endId = (arrow as any).endBinding?.elementId;
      if (!startId || !endId) return;
      const fromIdx = nodes.findIndex((n) => n.elementId === startId);
      const toIdx = nodes.findIndex((n) => n.elementId === endId);
      if (fromIdx !== -1 && toIdx !== -1) {
        edges.push({ fromIdx, toIdx, label: "" });
      }
    });

    setDetected({ nodes, edges });
  };

  const save = async () => {
    if (!title.trim() || !instructions.trim()) {
      showToast("error", "Title and instructions are required");
      return;
    }
    if (!detected) {
      showToast("error", "Parse the canvas first");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title, instructions, context,
        canvas_width: canvasW, canvas_height: canvasH,
        palette_items: paletteItems.map((p) => ({
          item_type: p.itemType, display_text: p.displayText, is_reusable: p.isReusable,
        })),
        solution_nodes: detected.nodes.map((n) => ({
          palette_item_index: n.paletteIdx,
          expected_x: n.x, expected_y: n.y,
          position_tolerance: 55, layer_index: 0,
        })),
        solution_edges: detected.edges.map((e) => ({
          from_node_index: e.fromIdx, to_node_index: e.toIdx,
          edge_label: e.label, is_required: true,
        })),
      };
      const res = await fetch(`${API}/api/v1/admin/lessons/${lessonId}/canvas`, {
        method: "POST", headers, body: JSON.stringify(payload),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || "Failed"); }
      showToast("success", "Canvas activity saved");
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#01696F] border-t-transparent rounded-full animate-spin" />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-hidden">

        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-fade-in ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
            {toast.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />} {toast.msg}
          </div>
        )}

        {/* ── Top Bar ── */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-zinc-200 shrink-0 flex-wrap">
          <button onClick={() => router.push(`/admin/lessons/${lessonId}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#01696F]/70 hover:text-[#01696F] group shrink-0">
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Lesson
          </button>
          <div className="h-5 w-px bg-zinc-200 shrink-0" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Canvas title *"
            className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium outline-none w-44 focus:bg-white" />
          <input value={instructions} onChange={(e) => setInstructions(e.target.value)}
            placeholder="Student instructions *"
            className="flex-1 min-w-[200px] px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:bg-white" />
          <input value={context} onChange={(e) => setContext(e.target.value)} placeholder="Context (optional)"
            className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none w-44 focus:bg-white" />
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button onClick={parseCanvas}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all">
              <Scan size={13} /> Parse Solution
            </button>
            <button onClick={save} disabled={saving || !detected}
              className="flex items-center gap-2 px-4 py-2 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-40 transition-all">
              <Save size={13} />
              {saving ? "Saving..." : "Save Canvas"}
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left panel */}
          <div className="w-60 shrink-0 bg-white border-r border-zinc-200 flex flex-col">

            {/* Instructions */}
            <div className="px-4 pt-4 pb-3 border-b border-zinc-100">
              <div className="flex items-start gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <Info size={13} className="text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-indigo-700 leading-relaxed">
                  <strong>How to use:</strong> Add palette items below → draw shapes on the canvas labeled with each item name → draw arrows between shapes → click <em>Parse Solution</em> → Save.
                </p>
              </div>
            </div>

            {/* Add palette item */}
            <div className="p-4 border-b border-zinc-100 space-y-2">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Palette Items</h3>
              <input value={newText} onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPaletteItem()}
                placeholder="Item name (e.g. Revenue)" 
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white" />
              <div className="flex gap-2">
                <select value={newType} onChange={(e) => setNewType(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none">
                  <option value="concept">Concept</option>
                  <option value="process">Process</option>
                  <option value="metric">Metric</option>
                  <option value="entity">Entity</option>
                </select>
                <button onClick={addPaletteItem}
                  className="px-3 py-2 bg-[#01696F] text-white text-xs font-bold rounded-xl">
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Palette list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {paletteItems.map((item, i) => {
                const isFound = detected?.nodes.some((n) => n.paletteIdx === i);
                return (
                  <div key={i}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs transition-all ${
                      isFound
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700"
                    }`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isFound ? "bg-emerald-500" : "bg-zinc-300"}`} />
                    <span className="flex-1 font-medium truncate">{item.displayText}</span>
                    <span className="text-[9px] font-bold uppercase text-zinc-400">{item.itemType}</span>
                    <button onClick={() => setPaletteItems((p) => p.filter((_, idx) => idx !== i))}
                      className="text-zinc-300 hover:text-rose-500 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
              {paletteItems.length === 0 && (
                <p className="text-[10px] text-zinc-300 text-center italic pt-4">No items added yet</p>
              )}
            </div>

            {/* Detected summary */}
            {detected && (
              <div className="p-4 border-t border-zinc-100 bg-zinc-50 space-y-2">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Detected</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Nodes matched</span>
                    <span className={`font-bold ${detected.nodes.length === paletteItems.length ? "text-emerald-600" : "text-amber-600"}`}>
                      {detected.nodes.length} / {paletteItems.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Edges detected</span>
                    <span className="font-bold text-zinc-700">{detected.edges.length}</span>
                  </div>
                </div>
                {detected.nodes.length < paletteItems.length && (
                  <p className="text-[10px] text-amber-600 leading-relaxed">
                    Some items not matched. Make sure canvas labels exactly match item names.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Excalidraw canvas */}
          <div className="flex-1 overflow-hidden">
            <CanvasExercise
              onElementsChange={handleElementsChange}
              canvasBackgroundText="Admin Setup Mode — Draw shapes labeled with palette item names, then Parse Solution"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}