"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft, Plus, Trash2, Check, ChevronDown, ChevronUp,
  FileQuestion, PenLine, TableProperties, Save, AlertCircle,
  Circle, X,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// ── Types ──────────────────────────────────────────────────────────────────

interface McqOption { option_text: string; is_correct: boolean; }
interface McqQuestion {
  question_text: string; explanation: string;
  options: McqOption[];
}
interface McqForm {
  title: string; instructions: string; context: string;
  questions: McqQuestion[];
}

interface PaletteItem { item_type: string; display_text: string; is_reusable: boolean; }
interface SolutionNode { palette_item_index: number; expected_x: number; expected_y: number; position_tolerance: number; layer_index: number; }
interface SolutionEdge { from_node_index: number; to_node_index: number; edge_label: string; is_required: boolean; }
interface CanvasForm {
  title: string; instructions: string; context: string;
  canvas_width: number; canvas_height: number;
  palette_items: PaletteItem[];
  solution_nodes: SolutionNode[];
  solution_edges: SolutionEdge[];
}

interface QuantusColumn { label: string; col_index: number; width_px: number; }
interface QuantusColumnGroup { label: string; col_start: number; col_end: number; bg_color: string; text_color: string; }
interface QuantusCell {
  row_index: number; col_index: number; cell_type: string;
  display_value: string; expected_value: string; is_editable: boolean; hint_text: string;
}
interface QuantusForm {
  title: string; instructions: string; context: string; reference_url: string;
  column_groups: QuantusColumnGroup[];
  columns: QuantusColumn[];
  cells: QuantusCell[];
}

interface LessonDetail {
  id: string; name: string; difficulty: string; description: string | null;
  subtopic: { name: string; topic: { name: string; module: { name: string } } };
  lessonActivities: { activityType: string }[];
  mcqActivity: any | null;
  canvasActivity: any | null;
  quantusActivity: any | null;
}

// ── Blank form factories ───────────────────────────────────────────────────

const blankMcq = (): McqForm => ({
  title: "", instructions: "", context: "", questions: [],
});

const blankCanvas = (): CanvasForm => ({
  title: "", instructions: "", context: "",
  canvas_width: 900, canvas_height: 600,
  palette_items: [], solution_nodes: [], solution_edges: [],
});

const blankQuantus = (rows: number, cols: number): QuantusForm => ({
  title: "", instructions: "", context: "", reference_url: "",
  column_groups: [],
  columns: Array.from({ length: cols }, (_, i) => ({ label: i === 0 ? "Label" : `Col ${i}`, col_index: i, width_px: 120 })),
  cells: Array.from({ length: rows * cols }, (_, n) => ({
    row_index: Math.floor(n / cols), col_index: n % cols,
    cell_type: "prefilled", display_value: "", expected_value: "", is_editable: false, hint_text: "",
  })),
});

const blankQuestion = (): McqQuestion => ({
  question_text: "", explanation: "",
  options: [
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ],
});

// ── Cell color by type ─────────────────────────────────────────────────────

const cellTypeMeta: Record<string, { bg: string; text: string; label: string }> = {
  header:    { bg: "bg-[#01696F]/15",  text: "text-[#01696F] font-bold",  label: "Header" },
  prefilled: { bg: "bg-zinc-100",      text: "text-zinc-600",              label: "Prefilled" },
  editable:  { bg: "bg-amber-50 border border-amber-200", text: "text-zinc-800", label: "Editable" },
  formula:   { bg: "bg-blue-50 border border-blue-200",   text: "text-blue-700",  label: "Formula" },
  empty:     { bg: "bg-white",         text: "text-zinc-200",              label: "Empty" },
};

const diffColor = (d: string) =>
  d === "easy" ? "bg-emerald-50 text-emerald-600" :
  d === "medium" ? "bg-amber-50 text-amber-600" :
  "bg-rose-50 text-rose-600";

// ── Main Component ─────────────────────────────────────────────────────────

export default function LessonActivityEditor() {
  const params = useParams();
  const lessonId = params.id as string;
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const headers = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mcq" | "canvas" | "quantus">("mcq");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ── MCQ state ──
  const [mcqForm, setMcqForm] = useState<McqForm>(blankMcq());
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  // ── Canvas state ──
  const [canvasForm, setCanvasForm] = useState<CanvasForm>(blankCanvas());

  // ── Quantus state ──
  const [qRows, setQRows] = useState(6);
  const [qCols, setQCols] = useState(5);
  const [quantusForm, setQuantusForm] = useState<QuantusForm>(() => blankQuantus(6, 5));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [gridSetup, setGridSetup] = useState(false);

  // ── Toast helper ──
  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Load lesson ──
  const fetchLesson = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/admin/lessons/${lessonId}`, { headers });
      const json = await res.json();
      if (!json.data) return;
      const data = json.data as LessonDetail;
      setLesson(data);

      // Populate MCQ form if activity exists
      if (data.mcqActivity) {
        const a = data.mcqActivity;
        setMcqForm({
          title: a.title || "",
          instructions: a.instructions || "",
          context: a.context || "",
          questions: (a.questions || []).map((q: any) => ({
            question_text: q.questionText,
            explanation: q.explanation,
            options: (q.options || []).map((o: any) => ({
              option_text: o.optionText,
              is_correct: o.isCorrect,
            })),
          })),
        });
      }

      // Populate Canvas form if activity exists
      if (data.canvasActivity) {
        const a = data.canvasActivity;
        setCanvasForm({
          title: a.title || "",
          instructions: a.instructions || "",
          context: a.context || "",
          canvas_width: a.canvasWidth || 900,
          canvas_height: a.canvasHeight || 600,
          palette_items: (a.paletteItems || []).map((p: any) => ({
            item_type: p.itemType, display_text: p.displayText, is_reusable: p.isReusable,
          })),
          solution_nodes: (a.solutionNodes || []).map((n: any) => {
            const pIdx = (a.paletteItems || []).findIndex((p: any) => p.id === n.paletteItemId);
            return { palette_item_index: pIdx, expected_x: n.expectedX, expected_y: n.expectedY, position_tolerance: n.positionTolerance, layer_index: n.layerIndex };
          }),
          solution_edges: (a.solutionEdges || []).map((e: any) => {
            const nodes = a.solutionNodes || [];
            return {
              from_node_index: nodes.findIndex((n: any) => n.id === e.fromNodeId),
              to_node_index: nodes.findIndex((n: any) => n.id === e.toNodeId),
              edge_label: e.edgeLabel || "",
              is_required: e.isRequired,
            };
          }),
        });
      }

      // Populate Quantus form if activity exists
      if (data.quantusActivity) {
        const a = data.quantusActivity;
        const cols = (a.columns || []).sort((x: any, y: any) => x.colIndex - y.colIndex);
        const cells = a.quantusCells || [];
        const maxRow = cells.reduce((m: number, c: any) => Math.max(m, c.rowIndex), cells.length > 0 ? 0 : qRows - 1);
        const numRows = maxRow + 1;
        const numCols = cols.length || qCols;
        setQRows(numRows);
        setQCols(numCols);
        setGridSetup(true);

        const cellMap: Record<string, any> = {};
        cells.forEach((c: any) => { cellMap[`${c.rowIndex}-${c.colIndex}`] = c; });

        setQuantusForm({
          title: a.title || "",
          instructions: a.instructions || "",
          context: a.context || "",
          reference_url: a.referenceUrl || "",
          column_groups: (a.columnGroups || []).map((g: any) => ({
            label: g.label, col_start: g.colStart, col_end: g.colEnd,
            bg_color: g.bgColor, text_color: g.textColor,
          })),
          columns: cols.map((c: any) => ({ label: c.label, col_index: c.colIndex, width_px: c.widthPx })),
          cells: Array.from({ length: numRows * numCols }, (_, n) => {
            const r = Math.floor(n / numCols), col = n % numCols;
            const existing = cellMap[`${r}-${col}`];
            return {
              row_index: r, col_index: col,
              cell_type: existing?.cellType || "prefilled",
              display_value: existing?.displayValue || "",
              expected_value: existing?.expectedValue || "",
              is_editable: existing?.isEditable || false,
              hint_text: existing?.hintText || "",
            };
          }),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [lessonId, headers]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

  // ── Rebuild quantus grid on row/col change ──
  const applyGridSetup = () => {
    setQuantusForm(prev => {
      const existing = new Map(prev.cells.map(c => [`${c.row_index}-${c.col_index}`, c]));
      return {
        ...prev,
        columns: Array.from({ length: qCols }, (_, i) =>
          prev.columns[i] || { label: i === 0 ? "Label" : `Col ${i}`, col_index: i, width_px: 120 }
        ),
        cells: Array.from({ length: qRows * qCols }, (_, n) => {
          const r = Math.floor(n / qCols), c = n % qCols;
          return existing.get(`${r}-${c}`) || {
            row_index: r, col_index: c, cell_type: "prefilled",
            display_value: "", expected_value: "", is_editable: false, hint_text: "",
          };
        }),
      };
    });
    setGridSetup(true);
    setSelectedCell(null);
  };

  // ── MCQ helpers ──
  const addQuestion = () =>
    setMcqForm(p => ({ ...p, questions: [...p.questions, blankQuestion()] }));

  const removeQuestion = (i: number) =>
    setMcqForm(p => ({ ...p, questions: p.questions.filter((_, qi) => qi !== i) }));

  const updateQuestion = (i: number, field: keyof McqQuestion, val: any) =>
    setMcqForm(p => ({ ...p, questions: p.questions.map((q, qi) => qi === i ? { ...q, [field]: val } : q) }));

  const updateOption = (qi: number, oi: number, field: keyof McqOption, val: any) =>
    setMcqForm(p => ({
      ...p,
      questions: p.questions.map((q, qIdx) => qIdx !== qi ? q : {
        ...q,
        options: q.options.map((o, oIdx) => {
          if (field === "is_correct") return { ...o, is_correct: oIdx === oi };
          return oIdx === oi ? { ...o, [field]: val } : o;
        }),
      }),
    }));

  const addOption = (qi: number) =>
    setMcqForm(p => ({
      ...p,
      questions: p.questions.map((q, i) => i !== qi ? q : {
        ...q, options: [...q.options, { option_text: "", is_correct: false }],
      }),
    }));

  const removeOption = (qi: number, oi: number) =>
    setMcqForm(p => ({
      ...p,
      questions: p.questions.map((q, i) => i !== qi ? q : {
        ...q, options: q.options.filter((_, idx) => idx !== oi),
      }),
    }));

  // ── Canvas helpers ──
  const addPaletteItem = () =>
    setCanvasForm(p => ({ ...p, palette_items: [...p.palette_items, { item_type: "concept", display_text: "", is_reusable: false }] }));

  const removePaletteItem = (i: number) =>
    setCanvasForm(p => ({ ...p, palette_items: p.palette_items.filter((_, idx) => idx !== i) }));

  const addNode = () =>
    setCanvasForm(p => ({ ...p, solution_nodes: [...p.solution_nodes, { palette_item_index: 0, expected_x: 100, expected_y: 100, position_tolerance: 40, layer_index: 0 }] }));

  const removeNode = (i: number) =>
    setCanvasForm(p => ({ ...p, solution_nodes: p.solution_nodes.filter((_, idx) => idx !== i) }));

  const addEdge = () =>
    setCanvasForm(p => ({ ...p, solution_edges: [...p.solution_edges, { from_node_index: 0, to_node_index: 1, edge_label: "", is_required: true }] }));

  const removeEdge = (i: number) =>
    setCanvasForm(p => ({ ...p, solution_edges: p.solution_edges.filter((_, idx) => idx !== i) }));

  // ── Quantus cell helpers ──
  const cellIdx = (r: number, c: number) => r * qCols + c;

  const updateCell = (r: number, c: number, field: keyof QuantusCell, val: any) =>
    setQuantusForm(p => ({
      ...p,
      cells: p.cells.map((cell, i) => i === cellIdx(r, c) ? { ...cell, [field]: val } : cell),
    }));

  const getCell = (r: number, c: number): QuantusCell =>
    quantusForm.cells[cellIdx(r, c)] || { row_index: r, col_index: c, cell_type: "prefilled", display_value: "", expected_value: "", is_editable: false, hint_text: "" };

  // ── Save handlers ──────────────────────────────────────────────────────────

  const saveMcq = async () => {
    if (!mcqForm.instructions.trim()) { showToast("error", "Instructions are required"); return; }
    if (mcqForm.questions.length === 0) { showToast("error", "Add at least one question"); return; }
    const invalid = mcqForm.questions.find(q => !q.question_text.trim() || !q.options.some(o => o.is_correct));
    if (invalid) { showToast("error", "Each question needs text and a correct option marked"); return; }
    try {
      setSaving(true);
      const res = await fetch(`${API}/api/v1/admin/lessons/${lessonId}/mcq`, {
        method: "POST", headers,
        body: JSON.stringify({ ...mcqForm, questions: mcqForm.questions.map((q, i) => ({ ...q, order_index: i, options: q.options.map((o, oi) => ({ ...o, order_index: oi })) })) }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || "Failed"); }
      showToast("success", "MCQ activity saved");
      await fetchLesson();
    } catch (e: any) { showToast("error", e.message); }
    finally { setSaving(false); }
  };

  const saveCanvas = async () => {
    if (!canvasForm.title.trim() || !canvasForm.instructions.trim()) { showToast("error", "Title and instructions are required"); return; }
    try {
      setSaving(true);
      const res = await fetch(`${API}/api/v1/admin/lessons/${lessonId}/canvas`, {
        method: "POST", headers, body: JSON.stringify(canvasForm),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || "Failed"); }
      showToast("success", "Canvas activity saved");
      await fetchLesson();
    } catch (e: any) { showToast("error", e.message); }
    finally { setSaving(false); }
  };

  const saveQuantus = async () => {
    if (!quantusForm.title.trim() || !quantusForm.instructions.trim()) { showToast("error", "Title and instructions are required"); return; }
    if (quantusForm.columns.length === 0) { showToast("error", "Set up columns first"); return; }
    try {
      setSaving(true);
      const payload = {
        ...quantusForm,
        cells: quantusForm.cells
          .filter(c => c.cell_type !== "empty" || c.display_value.trim())
          .map(c => ({ ...c, display_value: c.display_value || null, expected_value: c.expected_value || null, hint_text: c.hint_text || null })),
      };
      const res = await fetch(`${API}/api/v1/admin/lessons/${lessonId}/quantus`, {
        method: "POST", headers, body: JSON.stringify(payload),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || "Failed"); }
      showToast("success", "Quantus activity saved");
      await fetchLesson();
    } catch (e: any) { showToast("error", e.message); }
    finally { setSaving(false); }
  };

  // ── hasActivity helper ──
  const hasActivity = (type: string) => lesson?.lessonActivities?.some(a => a.activityType === type);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#01696F] border-t-transparent rounded-full animate-spin" />
      </div>
    </MainLayout>
  );

  if (!lesson) return (
    <MainLayout>
      <div className="flex items-center justify-center h-full text-sm text-zinc-400">Lesson not found</div>
    </MainLayout>
  );

  const selCell = selectedCell ? getCell(selectedCell[0], selectedCell[1]) : null;

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-y-auto p-8 gap-5 bg-gradient-to-br from-[#fcfcfb] to-[#f5f3ee]">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2 ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
            {toast.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="shrink-0 space-y-3">
          <button onClick={() => router.push("/admin/learning")}
            className="flex items-center gap-1.5 text-xs font-bold text-[#01696F]/70 hover:text-[#01696F] w-fit group">
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Learning Pathways
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-[#01696F]/10 pb-4">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {lesson.subtopic.topic.module.name} › {lesson.subtopic.topic.name} › {lesson.subtopic.name}
              </p>
              <h1 className="text-2xl font-black text-[#01696F] tracking-tight">{lesson.name}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${diffColor(lesson.difficulty)}`}>
                {lesson.difficulty}
              </span>
              {(["mcq", "canvas", "quantus"] as const).map(t => (
                <span key={t} className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${hasActivity(t) ? "bg-[#01696F] text-white border-[#01696F]" : "bg-zinc-50 text-zinc-400 border-zinc-200"}`}>
                  {hasActivity(t) ? <Check size={9} /> : <Circle size={9} />} {t.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          {[
            { key: "mcq", label: "MCQ Builder", icon: FileQuestion },
            { key: "canvas", label: "Canvas Builder", icon: PenLine },
            { key: "quantus", label: "Quantus Builder", icon: TableProperties },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === key ? "bg-[#01696F] text-white shadow-md" : "bg-white border border-zinc-200 text-zinc-500 hover:border-[#01696F]/30"}`}>
              <Icon size={14} />
              {label}
              {hasActivity(key) && <span className={`w-1.5 h-1.5 rounded-full ${activeTab === key ? "bg-white/70" : "bg-[#01696F]"}`} />}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MCQ TAB                                                            */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "mcq" && (
          <div className="flex flex-col gap-4 flex-1">
            {/* Activity meta */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Title (optional)</label>
                <input value={mcqForm.title} onChange={e => setMcqForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Income Statement Quiz"
                  className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white" />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Instructions *</label>
                <input value={mcqForm.instructions} onChange={e => setMcqForm(p => ({ ...p, instructions: e.target.value }))}
                  placeholder="Choose the best answer for each question."
                  className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white" />
              </div>
              <div className="flex flex-col gap-1 md:col-span-3">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Context / Background Reading (optional)</label>
                <textarea value={mcqForm.context} onChange={e => setMcqForm(p => ({ ...p, context: e.target.value }))}
                  placeholder="Scenario or context shown above questions..."
                  rows={2} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none resize-none focus:bg-white" />
              </div>
            </div>

            {/* Questions */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wide">
                Questions ({mcqForm.questions.length})
              </h3>
              <button onClick={addQuestion}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-dashed border-[#01696F]/50 hover:border-[#01696F] text-[#01696F] text-xs font-bold rounded-xl transition-all">
                <Plus size={13} /> Add Question
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {mcqForm.questions.map((q, qi) => (
                <div key={qi} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                  {/* Question header */}
                  <div className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-zinc-50"
                    onClick={() => setExpandedQ(expandedQ === qi ? null : qi)}>
                    <span className="w-6 h-6 shrink-0 rounded-full bg-[#01696F]/10 text-[#01696F] text-[10px] font-black flex items-center justify-center">
                      {qi + 1}
                    </span>
                    <p className="flex-1 text-xs font-semibold text-zinc-700 line-clamp-1">
                      {q.question_text || <span className="text-zinc-300 italic">Question text...</span>}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-zinc-400">{q.options.length} opts</span>
                      {q.options.some(o => o.is_correct) && <Check size={12} className="text-emerald-500" />}
                      <button onClick={e => { e.stopPropagation(); removeQuestion(qi); }}
                        className="p-1 text-zinc-300 hover:text-rose-500 rounded-lg"><Trash2 size={12} /></button>
                      {expandedQ === qi ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
                    </div>
                  </div>

                  {/* Question body */}
                  {expandedQ === qi && (
                    <div className="px-5 pb-5 border-t border-zinc-100 space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Question Text *</label>
                          <textarea value={q.question_text}
                            onChange={e => updateQuestion(qi, "question_text", e.target.value)}
                            placeholder="What is the formula for Gross Profit?" rows={2}
                            className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none resize-none focus:bg-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Explanation (shown after answer)</label>
                          <textarea value={q.explanation}
                            onChange={e => updateQuestion(qi, "explanation", e.target.value)}
                            placeholder="Gross Profit = Revenue – COGS. This measures..." rows={2}
                            className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none resize-none focus:bg-white" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Options — click ✓ to mark correct</label>
                          <button onClick={() => addOption(qi)}
                            className="text-[10px] font-bold text-[#01696F] hover:underline">+ Add option</button>
                        </div>
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <button onClick={() => updateOption(qi, oi, "is_correct", true)}
                              className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center border transition-all ${opt.is_correct ? "bg-emerald-500 border-emerald-500 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-300 hover:border-emerald-300"}`}>
                              <Check size={11} />
                            </button>
                            <input value={opt.option_text}
                              onChange={e => updateOption(qi, oi, "option_text", e.target.value)}
                              placeholder={`Option ${oi + 1}`}
                              className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white" />
                            <button onClick={() => removeOption(qi, oi)}
                              className="p-1.5 text-zinc-300 hover:text-rose-500 rounded-lg"><X size={12} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {mcqForm.questions.length === 0 && (
                <div className="bg-white border border-dashed border-zinc-200 rounded-2xl p-8 text-center text-zinc-400 text-xs">
                  No questions yet. Click "Add Question" to start.
                </div>
              )}
            </div>

            {/* Save MCQ */}
            <div className="flex justify-end pt-2">
              <button onClick={saveMcq} disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition-all">
                <Save size={14} />
                {saving ? "Saving..." : lesson?.mcqActivity ? "Update MCQ Activity" : "Save MCQ Activity"}
              </button>
            </div>
          </div>
        )}

     {/* ══════════════════════════════════════════════════════════════════ */}
{/* CANVAS TAB — opens dedicated Excalidraw editor                    */}
{/* ══════════════════════════════════════════════════════════════════ */}
{activeTab === "canvas" && (
  <div className="flex flex-col gap-5 flex-1">
    {lesson?.canvasActivity ? (
      /* Activity exists — show summary card */
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
              <PenLine size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Canvas Activity</p>
              <h3 className="text-base font-extrabold text-zinc-800">{lesson.canvasActivity.title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{lesson.canvasActivity.instructions}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
            ✓ Created
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Palette Items", value: lesson.canvasActivity.paletteItems?.length ?? 0 },
            { label: "Solution Nodes", value: lesson.canvasActivity.solutionNodes?.length ?? 0 },
            { label: "Solution Edges", value: lesson.canvasActivity.solutionEdges?.length ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-zinc-800">{value}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push(`/admin/lessons/${lessonId}/canvas`)}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all">
          <PenLine size={14} /> Edit in Canvas Editor →
        </button>
      </div>
    ) : (
      /* No activity yet — prompt to open editor */
      <div className="bg-white border border-zinc-200 rounded-3xl p-12 flex flex-col items-center gap-5 text-center">
        <div className="p-5 bg-indigo-50 rounded-3xl text-indigo-500">
          <PenLine size={32} />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-zinc-800">No Canvas Activity Yet</h3>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-xs">
            Open the Canvas Editor to draw your solution diagram using Excalidraw, then save it as the activity.
          </p>
        </div>
        <button
          onClick={() => router.push(`/admin/lessons/${lessonId}/canvas`)}
          className="flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all">
          <PenLine size={14} /> Open Canvas Editor →
        </button>
      </div>
    )}
  </div>
)}

{/* ══════════════════════════════════════════════════════════════════ */}
{/* QUANTUS TAB — opens dedicated Excel-style editor                  */}
{/* ══════════════════════════════════════════════════════════════════ */}
{activeTab === "quantus" && (
  <div className="flex flex-col gap-5 flex-1">
    {lesson?.quantusActivity ? (
      /* Activity exists — show summary card */
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-50 rounded-2xl text-amber-500">
              <TableProperties size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quantus Activity</p>
              <h3 className="text-base font-extrabold text-zinc-800">{lesson.quantusActivity.title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{lesson.quantusActivity.instructions}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
            ✓ Created
          </span>
        </div>

        {/* Stats row */}
        {(() => {
          const cells = lesson.quantusActivity.quantusCells ?? [];
          const editableCells = cells.filter((c: any) => c.isEditable).length;
          const cols = lesson.quantusActivity.columns?.length ?? 0;
          const rows = cols > 0 ? Math.ceil(cells.length / cols) : 0;
          return (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Rows", value: rows },
                { label: "Columns", value: cols },
                { label: "Editable Cells", value: editableCells },
              ].map(({ label, value }) => (
                <div key={label} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-zinc-800">{value}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          );
        })()}

        <button
          onClick={() => router.push(`/admin/lessons/${lessonId}/quantus`)}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl shadow-md transition-all">
          <TableProperties size={14} /> Edit in Quantus Editor →
        </button>
      </div>
    ) : (
      /* No activity yet */
      <div className="bg-white border border-zinc-200 rounded-3xl p-12 flex flex-col items-center gap-5 text-center">
        <div className="p-5 bg-amber-50 rounded-3xl text-amber-500">
          <TableProperties size={32} />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-zinc-800">No Quantus Activity Yet</h3>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-xs">
            Open the Quantus Editor to build your spreadsheet model — set columns, fill cells, and mark editable fields.
          </p>
        </div>
        <button
          onClick={() => router.push(`/admin/lessons/${lessonId}/quantus`)}
          className="flex items-center gap-2 px-7 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all">
          <TableProperties size={14} /> Open Quantus Editor →
        </button>
      </div>
    )}
  </div>
)}

      </div>
    </MainLayout>
  );
}