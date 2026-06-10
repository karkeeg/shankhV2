"use client";

import React, { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  PaletteItem, SolutionSnapshot, PALETTE_COLORS, DEFAULT_COLOR,
  paletteToDragCategories, solutionToGraph, graphToSolution,
} from "@/lib/canvasAdapter";
import { CanvasExercise, CanvasGraph } from "@/components/exercise/CanvasExercise";
import { CanvasToolkit } from "@/components/exercise/CanvasToolkit";
import { Plus, Trash2, Save, RotateCcw, Maximize2, X } from "lucide-react";

export interface AdminCanvasData {
  title: string;
  instructions: string;
  context: string;
  scoringMode: "partial" | "exact";
  paletteItems: PaletteItem[];
  solutionSnapshot: SolutionSnapshot | null;
}

interface Props {
  value: AdminCanvasData;
  onChange: (v: AdminCanvasData) => void;
  /** When true, hides the title/instructions/context/scoring fields (page handles them in its own top bar) */
  compact?: boolean;
}

export function AdminCanvasEditor({ value, onChange, compact = false }: Props) {
  const [tab, setTab] = useState<"palette" | "solution">("palette");
  const [modalOpen, setModalOpen] = useState(false);
  // Latest graph emitted by the canvas; null until the admin edits something.
  const graphRef = useRef<CanvasGraph | null>(null);
  // Bumped to remount the canvas blank when the admin clears the solution.
  const [canvasNonce, setCanvasNonce] = useState(0);

  const set = <K extends keyof AdminCanvasData>(key: K, val: AdminCanvasData[K]) =>
    onChange({ ...value, [key]: val });

  // ── Palette editor ────────────────────────────────────────────────────────────
  const addItem = () => {
    const item: PaletteItem = { id: crypto.randomUUID(), label: "", shape: "rectangle", color: DEFAULT_COLOR };
    set("paletteItems", [...value.paletteItems, item]);
  };

  const updateItem = (idx: number, patch: Partial<PaletteItem>) => {
    const next = [...value.paletteItems];
    next[idx] = { ...next[idx], ...patch };
    set("paletteItems", next);
  };

  const removeItem = (idx: number) => {
    set("paletteItems", value.paletteItems.filter((_, i) => i !== idx));
  };

  // ── Palette → toolkit + initial graph (reconstructed from saved snapshot) ─────
  const dragCategories = useMemo(
    () => paletteToDragCategories(value.paletteItems),
    [value.paletteItems],
  );

  // Reconstructed once per modal open / clear, so it reflects the latest palette
  // and saved layout. CanvasExercise reads initialElements only on mount.
  const initialGraph = useMemo(
    () => solutionToGraph(value.paletteItems, value.solutionSnapshot),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modalOpen, canvasNonce],
  );

  // ── Save solution (token-pair edges + node positions for layout reload) ───────
  const handleSaveSolution = () => {
    const graph = graphRef.current ?? initialGraph;
    onChange({ ...value, solutionSnapshot: graphToSolution(graph) });
  };

  const handleClearSolution = () => {
    graphRef.current = { nodes: [], edges: [] };
    setCanvasNonce(n => n + 1); // remount the canvas blank
    onChange({ ...value, solutionSnapshot: null });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Metadata — hidden when compact=true (page handles meta in its own top bar) */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Title" value={value.title} onChange={v => set("title", v)} />
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Scoring</label>
            <select value={value.scoringMode} onChange={e => set("scoringMode", e.target.value as "partial" | "exact")}
              className="border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-800 bg-white outline-none focus:border-[#01696F]">
              <option value="partial">Partial credit</option>
              <option value="exact">Exact match only</option>
            </select>
          </div>
          <FormField label="Instructions" value={value.instructions} onChange={v => set("instructions", v)} multiline />
          <FormField label="Context / Scenario" value={value.context} onChange={v => set("context", v)} multiline />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        {(["palette", "solution"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all",
              tab === t ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
            {t === "palette" ? `Edit Palette (${value.paletteItems.length})` : `Draw Solution (${value.solutionSnapshot?.edges?.length ?? 0} edges)`}
          </button>
        ))}
      </div>

      {/* ── Palette tab ── */}
      {tab === "palette" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-zinc-400 font-medium">Add nodes students will drag onto the canvas.</p>
            <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#01696F] text-white text-[11px] font-black rounded-xl hover:bg-[#01696F]/90 active:scale-95">
              <Plus size={12} /> Add Node
            </button>
          </div>

          {value.paletteItems.length === 0 && (
            <div className="py-8 text-center text-zinc-400 text-xs font-semibold border border-dashed border-zinc-200 rounded-xl">
              No nodes yet.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {value.paletteItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5">
                <div className="w-20 h-9 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-bold border border-white/60"
                  style={{ backgroundColor: item.color }}>
                  {item.label || "…"}
                </div>
                <input value={item.label} onChange={e => updateItem(idx, { label: e.target.value })}
                  className="flex-1 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs text-zinc-800 bg-white placeholder:text-zinc-400 outline-none focus:border-[#01696F] min-w-0"
                  placeholder="Node label" />
                <select value={item.shape} onChange={e => updateItem(idx, { shape: e.target.value as PaletteItem["shape"] })}
                  className="border border-zinc-200 rounded-lg px-2 py-1.5 text-xs text-zinc-800 bg-white outline-none focus:border-[#01696F]">
                  <option value="rectangle">Rect</option>
                  <option value="ellipse">Oval</option>
                  <option value="diamond">Diamond</option>
                </select>
                <div className="flex gap-0.5">
                  {PALETTE_COLORS.map(c => (
                    <button key={c} onClick={() => updateItem(idx, { color: c })}
                      className={cn("w-5 h-5 rounded-full border-2 transition-all", item.color === c ? "border-zinc-600 scale-110" : "border-transparent")}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button onClick={() => removeItem(idx)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Solution drawing tab ── */}
      {tab === "solution" && (
        <div className="flex flex-col gap-3">
          {value.solutionSnapshot ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
              <p className="text-[11px] text-emerald-700 font-bold">
                ✓ Solution saved — {value.solutionSnapshot.edges.length} connection{value.solutionSnapshot.edges.length !== 1 ? "s" : ""} · {value.solutionSnapshot.nodePositions?.length ?? 0} node positions
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onChange({ ...value, solutionSnapshot: null }); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-zinc-500 border border-zinc-200 rounded-xl hover:bg-zinc-50 active:scale-95 bg-white"
                >
                  <RotateCcw size={11} /> Clear
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#01696F] text-white text-[11px] font-black rounded-xl hover:bg-[#01696F]/90 active:scale-95"
                >
                  <Maximize2 size={11} /> Edit Solution
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3">
              <p className="text-[11px] text-zinc-500 font-medium">
                {value.paletteItems.length === 0
                  ? "Add nodes in the Palette tab first, then draw the solution."
                  : "No solution drawn yet. Open the editor to place nodes and draw connections."}
              </p>
              <button
                onClick={() => setModalOpen(true)}
                disabled={value.paletteItems.length === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#01696F] text-white text-[11px] font-black rounded-xl hover:bg-[#01696F]/90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Maximize2 size={11} /> Open Editor
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Fullscreen canvas modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F0EDE7]">
          {/* Modal toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 shrink-0 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-extrabold text-zinc-800">
                Solution Editor{value.title ? ` — ${value.title}` : ""}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                {value.paletteItems.length} nodes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { handleClearSolution(); }}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-zinc-500 border border-zinc-200 rounded-xl hover:bg-zinc-50 active:scale-95"
              >
                <RotateCcw size={11} /> Clear
              </button>
              <button
                onClick={() => { handleSaveSolution(); setModalOpen(false); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#01696F] text-white text-xs font-black rounded-xl hover:bg-[#01696F]/90 active:scale-95 shadow-sm"
              >
                <Save size={13} /> Save & Close
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Modal body — palette left, canvas right */}
          <div className="flex-1 overflow-hidden flex">
            {/* Palette panel */}
            <div className="w-60 shrink-0 bg-white border-r border-zinc-200 p-4 overflow-y-auto flex flex-col gap-3">
              <CanvasToolkit draggableElements={dragCategories} />
              <div className="mt-auto pt-3 border-t border-zinc-100">
                <p className="text-[9px] text-zinc-400 font-medium leading-relaxed">
                  Drag nodes onto the canvas. Hover a node and drag from a handle to another node to connect them. Select a node or edge and press Delete to remove it.
                </p>
              </div>
            </div>

            {/* Canvas area */}
            <div className="flex-1 relative">
              <CanvasExercise
                key={`admin-modal-canvas-${canvasNonce}-${value.paletteItems.map(p => p.id).join(",")}`}
                initialElements={initialGraph}
                onElementsChange={(g) => { graphRef.current = g; }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-800 bg-white placeholder:text-zinc-400 outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 w-full";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className={cn(cls, "resize-none")} />
        : <input value={value} onChange={e => onChange(e.target.value)} className={cls} />}
    </div>
  );
}
