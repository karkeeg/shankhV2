"use client";

import React, { useMemo, useState } from "react";
import { useToastStore } from "@/lib/toast-store";
import { cn } from "@/lib/utils";
import {
  PaletteItem, SolutionSnapshot, FrameworkStructure, DEFAULT_COLOR,
  buildFrameworkStructure,
} from "@/lib/canvasAdapter";
import { FrameworkCanvas } from "@/components/exercise/FrameworkCanvas";
import { Logo } from "@/components/layout/Logo";
import {
  Loader2, ArrowLeft, Plus, Trash2, Save, RotateCcw, Lock, PenLine,
  Eye, Pencil, RefreshCw, ChevronRight, X, Network,
} from "lucide-react";

// Fixed framework palette — locked nodes are dark blue, blanks are light blue.
const LOCKED_SWATCH = "#1e3a8a";
const BLANK_SWATCH = "#dbeafe";

interface NodeMeta {
  id: string;
  label: string;
  shape: PaletteItem["shape"];
  color: string;
  isBlank: boolean;
}

// structure → editor state (nodeMeta + snapshot)
function decompose(structure: FrameworkStructure | null | undefined): { nodeMeta: NodeMeta[]; snapshot: SolutionSnapshot } {
  const nodes = structure?.nodes ?? [];
  return {
    nodeMeta: nodes.map((n) => ({
      id: n.id, label: n.label, shape: n.shape, color: n.color || DEFAULT_COLOR, isBlank: !!n.isBlank,
    })),
    snapshot: {
      edges: (structure?.edges ?? []).map((e) => ({ sourceId: e.sourceId, targetId: e.targetId })),
      nodePositions: nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })),
    },
  };
}

export interface FrameworkBuilderSavePayload {
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  structure: FrameworkStructure;
}

export interface FrameworkBuilderProps {
  /** Diagram to edit (library framework structure, or a case's snapshot copy). */
  initialStructure: FrameworkStructure | null | undefined;
  initialMeta?: { name?: string; description?: string; category?: string; isActive?: boolean };
  /** Show the Active checkbox in the header (library only). */
  showActive?: boolean;
  /** Require a non-empty name before saving (library yes; case copy already named). */
  requireName?: boolean;
  /** Header back-link. */
  backLabel: string;
  onBack: () => void;
  /** Persist — parent does the actual API call. */
  onSave: (payload: FrameworkBuilderSavePayload) => Promise<void> | void;
  /** Optional small note shown under the title (e.g. case context). */
  scopeNote?: string;
}

/**
 * Full 3-panel framework builder (Preview/Edit). Shared by the framework library
 * page and the per-case framework builder so both edit diagrams identically.
 * Self-contained: owns all editor state and validation; the parent only loads the
 * structure, supplies `onSave`, and handles navigation.
 */
export function FrameworkBuilder({
  initialStructure, initialMeta, showActive = false, requireName = true,
  backLabel, onBack, onSave, scopeNote,
}: FrameworkBuilderProps) {
  const showToast = useToastStore((s) => s.showToast);

  const seed = useMemo(() => decompose(initialStructure), [initialStructure]);
  const [meta, setMeta] = useState({
    name: initialMeta?.name ?? "",
    description: initialMeta?.description ?? "",
    category: initialMeta?.category ?? "",
    isActive: initialMeta?.isActive ?? true,
  });
  const [nodeMeta, setNodeMeta] = useState<NodeMeta[]>(seed.nodeMeta);
  const [snapshot, setSnapshot] = useState<SolutionSnapshot>(seed.snapshot);

  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [revealAnswers, setRevealAnswers] = useState(true);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // ── Node list ──────────────────────────────────────────────────────────────
  const addNode = () =>
    setNodeMeta((prev) => [...prev, { id: crypto.randomUUID(), label: "", shape: "rectangle", color: DEFAULT_COLOR, isBlank: false }]);
  const updateNode = (idx: number, patch: Partial<NodeMeta>) =>
    setNodeMeta((prev) => prev.map((n, i) => (i === idx ? { ...n, ...patch } : n)));
  const removeNode = (idx: number) =>
    setNodeMeta((prev) => prev.filter((_, i) => i !== idx));

  // ── Canvas plumbing ──────────────────────────────────────────────────────────
  const previewStructure = useMemo<FrameworkStructure>(
    () => buildFrameworkStructure(nodeMeta, snapshot),
    [nodeMeta, snapshot],
  );

  const handlePositionsChange = (pos: Record<string, { x: number; y: number }>) =>
    setSnapshot((s) => ({ ...s, nodePositions: Object.entries(pos).map(([id, p]) => ({ id, x: p.x, y: p.y })) }));
  const handleEdgesChange = (edges: { sourceId: string; targetId: string }[]) =>
    setSnapshot((s) => ({ ...s, edges }));
  const handleClearConnections = () => setSnapshot((s) => ({ ...s, edges: [] }));

  const handleSave = async () => {
    if (requireName && !meta.name.trim()) return showToast("Name is required.", "error");
    const blanksMissingLabel = nodeMeta.some((n) => n.isBlank && !n.label.trim());
    if (blanksMissingLabel) return showToast("Every blank node needs an expected answer (its label).", "error");
    setSaving(true);
    try {
      await onSave({
        name: meta.name, description: meta.description, category: meta.category, isActive: meta.isActive,
        structure: buildFrameworkStructure(nodeMeta, snapshot),
      });
      showToast("Saved.", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };

  const placedIds = new Set((snapshot.nodePositions ?? []).map((p) => p.id));
  const blanks = nodeMeta.filter((n) => n.isBlank);

  // ── Shared header (back · name · Preview/Edit toggle · Active · Save) ─────────
  const PageHeader = (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 bg-white shrink-0">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[#01696F] transition-colors shrink-0">
        <ArrowLeft size={14} /> {backLabel}
      </button>
      <div className="h-4 w-px bg-zinc-200" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-zinc-800 truncate">{meta.name || "Untitled framework"}</p>
        <p className="text-[10px] text-zinc-400 font-semibold truncate">
          {scopeNote ? `${scopeNote} · ` : meta.category ? `${meta.category} · ` : ""}
          {nodeMeta.length} nodes · {blanks.length} blank · {snapshot.edges.length} connections
        </p>
      </div>

      <div className="flex gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-xl shrink-0">
        <button onClick={() => setViewMode("preview")}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all",
            viewMode === "preview" ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
          <Eye size={12} /> Preview
        </button>
        <button onClick={() => setViewMode("edit")}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all",
            viewMode === "edit" ? "bg-[#01696F] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
          <Pencil size={11} /> Edit
        </button>
      </div>

      {showActive && (
        <label className="flex items-center gap-2 cursor-pointer shrink-0">
          <input type="checkbox" checked={meta.isActive} onChange={(e) => setMeta((m) => ({ ...m, isActive: e.target.checked }))} className="w-4 h-4 accent-[#01696F] rounded" />
          <span className="text-xs font-bold text-zinc-600">Active</span>
        </label>
      )}
      <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-[#01696F] text-white text-xs font-black rounded-xl hover:bg-[#01696F]/90 active:scale-95 disabled:opacity-60 shadow-sm shrink-0">
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
      </button>
    </header>
  );

  // ── PREVIEW MODE (learner-style 3-panel) ──────────────────────────────────────
  if (viewMode === "preview") {
    return (
      <div className="flex flex-col h-screen overflow-hidden font-sans bg-white text-zinc-800">
        {PageHeader}

        {nodeMeta.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-600 p-8 text-center">
            <Network size={36} className="text-[#01696F] opacity-40" />
            <p className="font-extrabold text-lg text-zinc-800">Nothing to preview yet</p>
            <p className="text-sm text-zinc-500 max-w-sm">Switch to Edit mode and add some nodes to build the framework.</p>
            <button onClick={() => setViewMode("edit")} className="px-6 py-2.5 bg-[#01696F] text-white text-sm font-black rounded-2xl hover:bg-[#01696F]/90 shadow-sm transition-all active:scale-95">
              Switch to Edit
            </button>
          </div>
        ) : (
          <div className="flex flex-row flex-1 overflow-hidden p-2 sm:p-3 gap-0">

            {/* ══ LEFT PANEL ══ */}
            <div className={cn("flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden", leftOpen ? "w-60 xl:w-64" : "w-0")}>
              <div className="w-60 xl:w-64 h-full flex flex-col justify-between pr-2">
                <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-3">
                  <div className="flex flex-col items-center gap-2 border-b border-zinc-100 pb-3 pt-1">
                    <Logo variant="full" width={110} height={32} className="object-contain" style={{ width: "auto", height: "auto" }} />
                  </div>

                  <div className="bg-[#FAF7F2] shadow-[0_2px_4px_0_#0000001F_inset] border border-[#F0EDE7] rounded-2xl p-3 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2 border-b border-zinc-200/50 pb-2">
                      <h3 className="font-extrabold text-zinc-900 text-xs leading-tight tracking-tight">{meta.name || "Framework"}</h3>
                      {meta.category && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest shrink-0 bg-amber-100 text-amber-700 border-amber-200">
                          {meta.category}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70 block mb-1">Instructions</span>
                      <p className="text-xs text-zinc-700 leading-relaxed font-semibold whitespace-pre-line">
                        {meta.description || "Fill in the blank nodes to complete the framework."}
                      </p>
                    </div>

                    <div className="border-t border-zinc-200/50 pt-2 flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#01696F]/60">Legend</span>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-md border border-white shadow-sm shrink-0" style={{ backgroundColor: LOCKED_SWATCH }} />
                        <span className="text-[10px] font-bold text-zinc-600">Locked — shown to the learner</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-md border border-blue-300 shadow-sm shrink-0" style={{ backgroundColor: BLANK_SWATCH }} />
                        <span className="text-[10px] font-bold text-zinc-600">Blank — the learner fills in</span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-200/50 pt-2">
                      <p className="text-[10px] text-zinc-500 font-medium">
                        {nodeMeta.length} nodes · {blanks.length} blank · {snapshot.edges.length} connections
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 flex items-center gap-2 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Eye size={14} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-amber-800">Admin Preview</p>
                    <p className="text-[9px] text-amber-600 font-bold uppercase tracking-wider">Read-only mode</p>
                  </div>
                </div>
              </div>
            </div>

            {!leftOpen && (
              <button onClick={() => setLeftOpen(true)} className="self-center z-20 flex-shrink-0 w-8 h-40 bg-white border border-zinc-200 shadow-md rounded-full flex items-center justify-center hover:bg-[#E6F0F1] hover:border-[#01696F]/30 transition-all duration-200 active:scale-95 group">
                <ChevronRight size={14} className="text-zinc-500 group-hover:text-[#01696F]" />
              </button>
            )}

            {/* ══ MAIN WORKSPACE ══ */}
            <div className="flex-1 min-w-0 flex flex-col bg-[#F0EDE7] shadow-[0px_4px_8px_0px_#0000003D_inset] border border-[#F0EDE7] rounded-2xl overflow-hidden mx-1.5">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200 bg-[#F0EDE7]/60 shrink-0 gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setPreviewValues({})} className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0">
                    <RefreshCw size={11} /> Reset
                  </button>
                  <button onClick={() => setRevealAnswers((r) => !r)}
                    className={cn("px-3 py-1.5 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0 border",
                      revealAnswers ? "bg-[#E6F0F1] text-[#01696F] border-[#01696F]/20" : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50")}>
                    <Eye size={12} /> {revealAnswers ? "Answers shown" : "Show answers"}
                  </button>
                </div>
                <span className="px-3 sm:px-4 py-2 bg-zinc-200 text-zinc-500 font-extrabold text-xs rounded-xl flex items-center gap-1.5 flex-shrink-0">
                  <Eye size={13} /> Preview Only
                </span>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <FrameworkCanvas
                  key={`fw-preview-${revealAnswers}`}
                  structure={previewStructure}
                  revealAnswers={revealAnswers}
                  disabled={revealAnswers}
                  values={previewValues}
                  onValuesChange={setPreviewValues}
                  nodesDraggable
                  backgroundText={meta.name || "Framework"}
                />
              </div>
            </div>

            {!rightOpen && (
              <button onClick={() => setRightOpen(true)} className="self-center z-20 flex-shrink-0 w-8 h-40 bg-white border border-zinc-200 shadow-md rounded-full flex items-center justify-center hover:bg-[#E6F0F1] hover:border-[#01696F]/30 transition-all duration-200 active:scale-95 group">
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="text-[11px] font-bold text-[#01696F] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">Blanks</span>
                  <PenLine size={14} className="text-[#01696F] group-hover:scale-110 transition-transform duration-200" />
                </div>
              </button>
            )}

            {/* ══ RIGHT PANEL — blanks inspector ══ */}
            <div className={cn("flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden", rightOpen ? "w-72 xl:w-80" : "w-0")}>
              <div className="w-72 xl:w-80 h-full flex flex-col pl-2">
                <div className="bg-white flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-100 shadow-sm">
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-200 flex-shrink-0 bg-[#FAF7F2]">
                    <div className="w-8 h-8 rounded-full bg-[#01696F]/10 flex items-center justify-center flex-shrink-0">
                      <PenLine size={16} className="text-[#01696F]" />
                    </div>
                    <h3 className="font-black text-zinc-800 text-base tracking-tight">Blanks</h3>
                    <span className="ml-1 text-[10px] font-black text-[#01696F] bg-[#E6F0F1] px-2 py-0.5 rounded-full">{blanks.length}</span>
                    <button onClick={() => setRightOpen(false)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition group">
                      <X size={16} className="text-zinc-500 group-hover:text-zinc-800 transition" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-[#F0EDE7]">
                    {blanks.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 font-semibold italic text-center py-8">No blank nodes — every node is shown to the learner.</p>
                    ) : (
                      blanks.map((n, i) => (
                        <div key={n.id} className="bg-white rounded-xl p-3 border border-zinc-100 shadow-sm flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full border border-blue-300 text-[9px] flex items-center justify-center shrink-0 font-black text-blue-600" style={{ backgroundColor: BLANK_SWATCH }}>{i + 1}</span>
                          <span className="flex-1 text-[11px] font-bold text-zinc-700 truncate">{n.label || "(no expected answer)"}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── EDIT MODE (same 3-panel chrome as preview) ────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-white text-zinc-800">
      {PageHeader}

      <div className="flex flex-row flex-1 overflow-hidden p-2 sm:p-3 gap-0">

        {/* ══ LEFT PANEL — framework details ══ */}
        <div className={cn("flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden", leftOpen ? "w-60 xl:w-64" : "w-0")}>
          <div className="w-60 xl:w-64 h-full flex flex-col justify-between pr-2">
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-3">
              <div className="flex flex-col items-center gap-2 border-b border-zinc-100 pb-3 pt-1">
                <Logo variant="full" width={110} height={32} className="object-contain" style={{ width: "auto", height: "auto" }} />
              </div>

              <div className="bg-[#FAF7F2] shadow-[0_2px_4px_0_#0000001F_inset] border border-[#F0EDE7] rounded-2xl p-3 flex flex-col gap-3">
                <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70">Framework Details</span>
                <LabeledInput label="Name" value={meta.name} onChange={(v) => setMeta((m) => ({ ...m, name: v }))} />
                <LabeledInput label="Category" value={meta.category} onChange={(v) => setMeta((m) => ({ ...m, category: v }))} />
                <LabeledInput label="Description" value={meta.description} onChange={(v) => setMeta((m) => ({ ...m, description: v }))} multiline />

                <div className="border-t border-zinc-200/50 pt-2 flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#01696F]/60">Legend</span>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-md border border-white shadow-sm shrink-0" style={{ backgroundColor: LOCKED_SWATCH }} />
                    <span className="text-[10px] font-bold text-zinc-600">Locked — shown to the learner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-md border border-blue-300 shadow-sm shrink-0" style={{ backgroundColor: BLANK_SWATCH }} />
                    <span className="text-[10px] font-bold text-zinc-600">Blank — the learner fills in</span>
                  </div>
                </div>

                <div className="border-t border-zinc-200/50 pt-2">
                  <p className="text-[10px] text-zinc-500 font-medium">
                    {nodeMeta.length} nodes · {blanks.length} blank · {placedIds.size}/{nodeMeta.length} placed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#E6F0F1] border border-[#01696F]/20 rounded-2xl p-2.5 flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#01696F]/10 flex items-center justify-center flex-shrink-0">
                <Pencil size={14} className="text-[#01696F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-[#01696F]">Edit Mode</p>
                <p className="text-[9px] text-[#01696F]/70 font-bold uppercase tracking-wider">Drag to arrange · connect</p>
              </div>
            </div>
          </div>
        </div>

        {!leftOpen && (
          <button onClick={() => setLeftOpen(true)} className="self-center z-20 flex-shrink-0 w-8 h-40 bg-white border border-zinc-200 shadow-md rounded-full flex items-center justify-center hover:bg-[#E6F0F1] hover:border-[#01696F]/30 transition-all duration-200 active:scale-95 group">
            <ChevronRight size={14} className="text-zinc-500 group-hover:text-[#01696F]" />
          </button>
        )}

        {/* ══ MAIN WORKSPACE — editable canvas ══ */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#F0EDE7] shadow-[0px_4px_8px_0px_#0000003D_inset] border border-[#F0EDE7] rounded-2xl overflow-hidden mx-1.5">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200 bg-[#F0EDE7]/60 shrink-0 gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">
              Drag to arrange · drag from a node edge to connect
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[12px] font-semibold text-[#01696F] bg-[#E6F0F1] px-3 py-1.5 rounded-xl shadow-sm border border-[#01696F]/10 select-none whitespace-nowrap">
                {snapshot.edges.length} connection{snapshot.edges.length !== 1 ? "s" : ""}
              </span>
              <button onClick={handleClearConnections} disabled={snapshot.edges.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-500 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none">
                <RotateCcw size={11} /> Clear connections
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {previewStructure.nodes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-sm font-semibold">Add a node to start building the framework.</div>
            ) : (
              <FrameworkCanvas
                structure={previewStructure}
                revealAnswers
                disabled
                nodesDraggable
                editable
                onPositionsChange={handlePositionsChange}
                onEdgesChange={handleEdgesChange}
                backgroundText={meta.name || "Framework"}
              />
            )}
          </div>
        </div>

        {!rightOpen && (
          <button onClick={() => setRightOpen(true)} className="self-center z-20 flex-shrink-0 w-8 h-40 bg-white border border-zinc-200 shadow-md rounded-full flex items-center justify-center hover:bg-[#E6F0F1] hover:border-[#01696F]/30 transition-all duration-200 active:scale-95 group">
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-[11px] font-bold text-[#01696F] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">Nodes</span>
              <Network size={14} className="text-[#01696F] group-hover:scale-110 transition-transform duration-200" />
            </div>
          </button>
        )}

        {/* ══ RIGHT PANEL — nodes editor ══ */}
        <div className={cn("flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden", rightOpen ? "w-80 xl:w-96" : "w-0")}>
          <div className="w-80 xl:w-96 h-full flex flex-col pl-2">
            <div className="bg-white flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-200 flex-shrink-0 bg-[#FAF7F2]">
                <div className="w-8 h-8 rounded-full bg-[#01696F]/10 flex items-center justify-center flex-shrink-0">
                  <Network size={16} className="text-[#01696F]" />
                </div>
                <h3 className="font-black text-zinc-800 text-base tracking-tight">Nodes</h3>
                <span className="ml-1 text-[10px] font-black text-[#01696F] bg-[#E6F0F1] px-2 py-0.5 rounded-full">{nodeMeta.length}</span>
                <button onClick={addNode} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#01696F] text-white text-[11px] font-black rounded-xl hover:bg-[#01696F]/90 active:scale-95 shrink-0">
                  <Plus size={12} /> Add
                </button>
                <button onClick={() => setRightOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition group shrink-0">
                  <X size={16} className="text-zinc-500 group-hover:text-zinc-800 transition" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-[#F0EDE7]">
                <p className="text-[10px] text-zinc-400 font-medium px-1">Define every node. Mark a node <b>Blank</b> for the learner to fill — its label is the expected answer.</p>

                {nodeMeta.length === 0 && (
                  <div className="py-8 text-center text-zinc-400 text-xs font-semibold border border-dashed border-zinc-200 rounded-xl bg-white">No nodes yet.</div>
                )}

                {nodeMeta.map((n, idx) => (
                  <div key={n.id} className={cn("flex flex-col gap-2 border rounded-xl p-2.5 shadow-sm", n.isBlank ? "border-blue-200 bg-blue-50/40" : "border-zinc-200 bg-white")}>
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", placedIds.has(n.id) ? "bg-emerald-500" : "bg-zinc-300")} title={placedIds.has(n.id) ? "Placed on canvas" : "Not placed yet"} />
                      <input
                        value={n.label}
                        onChange={(e) => updateNode(idx, { label: e.target.value })}
                        placeholder={n.isBlank ? "Expected answer" : "Node label"}
                        className="flex-1 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs text-zinc-800 bg-white placeholder:text-zinc-400 outline-none focus:border-[#01696F] min-w-0"
                      />
                      <select value={n.shape} onChange={(e) => updateNode(idx, { shape: e.target.value as PaletteItem["shape"] })}
                        className="border border-zinc-200 rounded-lg px-2 py-1.5 text-xs text-zinc-800 bg-white outline-none focus:border-[#01696F]">
                        <option value="rectangle">Rect</option>
                        <option value="ellipse">Oval</option>
                        <option value="diamond">Diamond</option>
                      </select>
                      <button onClick={() => removeNode(idx)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                        <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: n.isBlank ? BLANK_SWATCH : LOCKED_SWATCH }} />
                        {n.isBlank ? "Light blue (blank)" : "Dark blue (locked)"}
                      </span>
                      <div className="flex-1" />
                      <button
                        onClick={() => updateNode(idx, { isBlank: !n.isBlank })}
                        className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border",
                          n.isBlank ? "bg-blue-500 text-white border-blue-500" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300")}
                      >
                        {n.isBlank ? <><PenLine size={11} /> Blank (learner fills)</> : <><Lock size={11} /> Locked (shown)</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-800 bg-white placeholder:text-zinc-400 outline-none focus:border-[#01696F] w-full";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={cn(cls, "resize-none")} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />}
    </div>
  );
}
