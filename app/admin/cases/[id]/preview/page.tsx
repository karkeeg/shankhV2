"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  Loader2, ArrowLeft, ArrowRight, CheckCircle2,
  ChevronLeft, ChevronRight, Trophy, X, RefreshCw, Eye, Save, Plus, Trash2, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExcelGrid } from "@/components/exercise/ExcelGrid";
import { CanvasWorkspace } from "@/components/canvas/CanvasWorkspace";
import { tokensToItems } from "@/components/canvas/CanvasPalette";
import type { PlacedNode } from "@/components/canvas/types";
import Image from "next/image";
import logo from "@/public/ShankhFull.png";
import { CaseStudiesModal } from "@/components/case/CaseStudiesModal";
import { AdminCanvasEditor, AdminCanvasData } from "@/components/admin/AdminCanvasEditor";
import { QuantusActivityBuilder, QuantusActivityData } from "@/components/admin/QuantusActivityBuilder";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const uuidv4 = () => crypto.randomUUID();

const TYPE_META: Record<string, { label: string; color: string }> = {
  quantus: { label: "Spreadsheet", color: "bg-sky-100 text-sky-700 border-sky-200" },
  mcq: { label: "Multiple Choice", color: "bg-violet-100 text-violet-700 border-violet-200" },
  canvas: { label: "Framework Drill", color: "bg-amber-100 text-amber-700 border-amber-200" },
};

// ─── Shared helpers ────────────────────────────────────────────────────────────

function TypePill({ type }: { type: string }) {
  const m = TYPE_META[type] ?? { label: type, color: "bg-zinc-100 text-zinc-600 border-zinc-200" };
  return <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", m.color)}>{m.label}</span>;
}

function Field({ label, value, onChange, multiline, required }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; required?: boolean;
}) {
  const cls = "border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-800 bg-white placeholder:text-zinc-400 outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 w-full";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</label>
      {multiline
        ? <textarea required={required} value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cn(cls, "resize-none")} />
        : <input required={required} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />}
    </div>
  );
}

// ─── MCQ Builder ───────────────────────────────────────────────────────────────

function McqBuilder({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const addQuestion = () =>
    onChange({ ...value, questions: [...(value.questions ?? []), { id: uuidv4(), questionText: "", explanation: "", options: [{ id: uuidv4(), optionText: "", isCorrect: true }, { id: uuidv4(), optionText: "", isCorrect: false }] }] });
  const removeQuestion = (qi: number) =>
    onChange({ ...value, questions: (value.questions ?? []).filter((_: any, i: number) => i !== qi) });
  const updateQuestion = (qi: number, field: string, val: string) => {
    const qs = [...(value.questions ?? [])]; qs[qi] = { ...qs[qi], [field]: val }; onChange({ ...value, questions: qs });
  };
  const addOption = (qi: number) => {
    const qs = [...(value.questions ?? [])];
    qs[qi] = { ...qs[qi], options: [...(qs[qi].options ?? []), { id: uuidv4(), optionText: "", isCorrect: false }] };
    onChange({ ...value, questions: qs });
  };
  const updateOption = (qi: number, oi: number, field: string, val: any) => {
    const qs = [...(value.questions ?? [])];
    const opts = [...(qs[qi].options ?? [])];
    opts[oi] = { ...opts[oi], [field]: val };
    if (field === "isCorrect" && val) opts.forEach((o, i) => { if (i !== oi) opts[i] = { ...o, isCorrect: false }; });
    qs[qi] = { ...qs[qi], options: opts }; onChange({ ...value, questions: qs });
  };
  const removeOption = (qi: number, oi: number) => {
    const qs = [...(value.questions ?? [])];
    qs[qi] = { ...qs[qi], options: (qs[qi].options ?? []).filter((_: any, i: number) => i !== oi) };
    onChange({ ...value, questions: qs });
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3">
        <Field label="Instructions" value={value.instructions ?? ""} onChange={(v) => onChange({ ...value, instructions: v })} multiline />
        <Field label="Context / Scenario" value={value.context ?? ""} onChange={(v) => onChange({ ...value, context: v })} multiline />
      </div>
      <div className="flex flex-col gap-3">
        {(value.questions ?? []).map((q: any, qi: number) => (
          <div key={q.id} className="border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 bg-zinc-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Question {qi + 1}</span>
              <button onClick={() => removeQuestion(qi)} className="text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
            </div>
            <Field label="Question text" value={q.questionText} onChange={(v) => updateQuestion(qi, "questionText", v)} multiline />
            <Field label="Explanation" value={q.explanation} onChange={(v) => updateQuestion(qi, "explanation", v)} multiline />
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Options (tick the correct one)</span>
              {(q.options ?? []).map((opt: any, oi: number) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input type="radio" checked={opt.isCorrect} onChange={() => updateOption(qi, oi, "isCorrect", true)} className="accent-[#01696F] w-4 h-4 shrink-0" />
                  <input value={opt.optionText} onChange={(e) => updateOption(qi, oi, "optionText", e.target.value)}
                    className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-800 bg-white placeholder:text-zinc-400 outline-none focus:border-[#01696F]" placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                  <button onClick={() => removeOption(qi, oi)} className="text-zinc-300 hover:text-red-400 transition-colors shrink-0"><Trash2 size={12} /></button>
                </div>
              ))}
              <button onClick={() => addOption(qi)} className="text-[10px] font-black text-[#01696F] hover:underline w-fit">+ Add option</button>
            </div>
          </div>
        ))}
        <button onClick={addQuestion} className="flex items-center gap-1.5 text-xs font-black text-[#01696F] hover:text-[#01696F]/80 w-fit">
          <Plus size={13} /> Add Question
        </button>
      </div>
    </div>
  );
}

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_CANVAS: AdminCanvasData = { title: "", instructions: "", context: "", scoringMode: "partial", paletteItems: [], solutionSnapshot: null };
const DEFAULT_QUANTUS: QuantusActivityData = { title: "", instructions: "", context: "", gridRows: [], gridCols: [], gridValues: {}, correctAnswers: {} };
const DEFAULT_MCQ = { instructions: "", context: "", questions: [] };

// ─── Activity Form (add new) ────────────────────────────────────────────────────

function ActivityForm({ onSave, onCancel, saving }: {
  onSave: (type: string, data: any, order: number) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [type, setType] = useState<"mcq" | "canvas" | "quantus">("mcq");
  const [order, setOrder] = useState(0);
  const [mcqData, setMcqData] = useState<any>({ ...DEFAULT_MCQ });
  const [canvasData, setCanvasData] = useState<AdminCanvasData>({ ...DEFAULT_CANVAS });
  const [quantusData, setQuantusData] = useState<QuantusActivityData>({ ...DEFAULT_QUANTUS });
  const currentData = type === "mcq" ? mcqData : type === "canvas" ? canvasData : quantusData;
  return (
    <div className="border border-[#01696F]/20 rounded-2xl p-5 bg-[#FAFFFE] flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-extrabold text-zinc-800">New Activity</span>
        <button onClick={onCancel} className="text-xs font-bold text-zinc-400 hover:text-zinc-600">Cancel</button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-white border border-zinc-200 p-1 rounded-xl">
          {(["mcq", "canvas", "quantus"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={cn("px-4 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all",
                type === t ? "bg-[#01696F] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
              {t === "mcq" ? "MCQ" : t === "canvas" ? "Canvas" : "Spreadsheet"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Order</label>
          <input type="number" value={order} onChange={(e) => setOrder(+e.target.value)}
            className="w-16 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-sm text-zinc-800 bg-white outline-none focus:border-[#01696F]" />
        </div>
      </div>
      {type === "mcq" && <McqBuilder value={mcqData} onChange={setMcqData} />}
      {type === "canvas" && <AdminCanvasEditor value={canvasData} onChange={setCanvasData} />}
      {type === "quantus" && <QuantusActivityBuilder value={quantusData} onChange={setQuantusData} />}
      <div className="flex justify-end pt-2 border-t border-zinc-100">
        <button onClick={() => onSave(type, currentData, order)} disabled={saving}
          className="px-6 py-2.5 bg-[#01696F] text-white text-xs font-black rounded-xl hover:bg-[#01696F]/90 flex items-center gap-2 active:scale-95 shadow-sm disabled:opacity-60">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Activity
        </button>
      </div>
    </div>
  );
}

// ─── Edit Activity Form (update existing) ──────────────────────────────────────

function EditActivityForm({ activity, onSave, onCancel, saving }: {
  activity: any;
  onSave: (type: string, data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const type = activity.activityType as "mcq" | "canvas" | "quantus";
  const [mcqData, setMcqData] = useState<any>(type === "mcq" ? { ...DEFAULT_MCQ, ...activity.activityData } : { ...DEFAULT_MCQ });
  const [canvasData, setCanvasData] = useState<AdminCanvasData>(type === "canvas" ? { ...DEFAULT_CANVAS, ...activity.activityData } : { ...DEFAULT_CANVAS });
  const [quantusData, setQuantusData] = useState<QuantusActivityData>(type === "quantus" ? { ...DEFAULT_QUANTUS, ...activity.activityData } : { ...DEFAULT_QUANTUS });
  const currentData = type === "mcq" ? mcqData : type === "canvas" ? canvasData : quantusData;
  return (
    <div className="border border-amber-200 rounded-2xl p-5 bg-amber-50/30 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pencil size={13} className="text-amber-600" />
          <span className="text-sm font-extrabold text-zinc-800">Edit Activity</span>
          <TypePill type={type} />
        </div>
        <button onClick={onCancel} className="text-xs font-bold text-zinc-400 hover:text-zinc-600">Cancel</button>
      </div>
      {type === "mcq" && <McqBuilder value={mcqData} onChange={setMcqData} />}
      {type === "canvas" && <AdminCanvasEditor value={canvasData} onChange={setCanvasData} />}
      {type === "quantus" && <QuantusActivityBuilder value={quantusData} onChange={setQuantusData} />}
      <div className="flex justify-end pt-2 border-t border-zinc-100">
        <button onClick={() => onSave(type, currentData)} disabled={saving}
          className="px-6 py-2.5 bg-amber-600 text-white text-xs font-black rounded-xl hover:bg-amber-700 flex items-center gap-2 active:scale-95 shadow-sm disabled:opacity-60">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Update Activity
        </button>
      </div>
    </div>
  );
}

// ─── Step builder ──────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSteps(rawActivities: any[]): any[] {
  const flat: any[] = [];
  for (const a of rawActivities) {
    if (a.activityType === "mcq") {
      const questions: any[] = a.activityData?.questions ?? [];
      questions.forEach((q: any, qi: number) => {
        flat.push({ id: `${a.id}-q${qi}`, activityId: a.id, stepType: "mcq-question" as const, question: q, allQuestions: questions, questionIndex: qi, activityData: a.activityData });
      });
    } else {
      flat.push({ id: a.id, activityId: a.id, stepType: a.activityType as "canvas" | "quantus", activityData: a.activityData });
    }
  }
  return shuffleArray(flat);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function AdminCasePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const token = useAuthStore((s) => s.token);

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");

  // ── Preview state ────────────────────────────────────────────────────────
  const [steps, setSteps] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [spreadsheetGrid, setSpreadsheetGrid] = useState<Record<string, string>>({});
  const [showStudies, setShowStudies] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<"instructions" | "context">("instructions");
  const [canvasPlacedIds, setCanvasPlacedIds] = useState<Set<string>>(new Set());

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editTab, setEditTab] = useState<"studies" | "activities">("studies");
  const [showStudyForm, setShowStudyForm] = useState(false);
  const [editingStudy, setEditingStudy] = useState<any>(null);
  const [studyForm, setStudyForm] = useState({ title: "", content: "", orderIndex: 0 });
  const [savingStudy, setSavingStudy] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [savingActivity, setSavingActivity] = useState(false);

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/v1/cases/admin/${id}`, { headers: headers() })
      .then((r) => r.json())
      .then((res) => {
        const data = res.data;
        if (!data) return;
        setCaseData(data);
        setSteps(buildSteps(data.caseActivities ?? []));
        setCurrentIdx(0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token]);

  useEffect(() => { load(); }, [load]);

  // ── Reset preview on step change ─────────────────────────────────────────

  const step = steps[currentIdx];
  const actData = step?.activityData ?? {};
  const isCanvasActive = step?.stepType === "canvas";
  const totalSteps = steps.length;

  useEffect(() => {
    setSelectedOption(null);
    setCanvasPlacedIds(new Set());
    if (step?.stepType === "quantus") setSpreadsheetGrid(actData?.gridValues ?? {});
  }, [currentIdx]);

  const canvasPaletteItems = useMemo(
    () => actData?.paletteItems?.length ? actData.paletteItems : tokensToItems(actData?.tokens ?? []),
    [step]
  );

  const canvasPreviewNodes: PlacedNode[] = useMemo(() => {
    if (step?.stepType !== "canvas") return [];
    const positions: { id: string; x: number; y: number }[] = actData?.solutionSnapshot?.nodePositions ?? [];
    return canvasPaletteItems.map((item: any, idx: number) => {
      const pos = positions.find((p: any) => p.id === item.id);
      return { ...item, x: pos?.x ?? (40 + (idx % 4) * 170), y: pos?.y ?? (40 + Math.floor(idx / 4) * 90) };
    });
  }, [step, canvasPaletteItems]);

  const canvasPreviewEdges = useMemo(() => {
    if (step?.stepType !== "canvas") return [];
    return (actData?.solutionSnapshot?.edges ?? []).map((e: any, i: number) => ({
      id: `preview-edge-${i}`,
      sourceId: e.sourceId,
      targetId: e.targetId,
    }));
  }, [step, actData]);

  const excelTable = useMemo(() => {
    if (!actData?.gridRows || !actData?.gridCols) return [];
    return actData.gridRows.map((row: string) =>
      actData.gridCols.map((col: string) => actData.gridValues?.[`${row}-${col}`] ?? "")
    );
  }, [step]);

  const excelInputs = useMemo(() => {
    if (!actData?.gridRows || !actData?.gridCols) return [];
    const list: any[] = [];
    actData.gridRows.forEach((row: string, rIdx: number) => {
      actData.gridCols.forEach((col: string, cIdx: number) => {
        if (cIdx === 0) return;
        const k = `${row}-${col}`;
        if (actData.correctAnswers?.[k] !== undefined)
          list.push({ row: rIdx, col: cIdx, correctValue: actData.correctAnswers[k], placeholder: "" });
      });
    });
    return list;
  }, [step]);

  const handleReset = () => {
    setSelectedOption(null);
    setCanvasPlacedIds(new Set());
    if (step?.stepType === "quantus") setSpreadsheetGrid(actData?.gridValues ?? {});
  };

  // ── Edit: Studies CRUD ────────────────────────────────────────────────────

  const startEditStudy = (s: any) => {
    setEditingStudy(s);
    setStudyForm({ title: s.title, content: s.content, orderIndex: s.orderIndex ?? 0 });
    setShowStudyForm(false);
  };

  const handleSaveNewStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStudy(true);
    try {
      await fetch(`${API}/api/v1/cases/admin/${id}/studies`, { method: "POST", headers: headers(), body: JSON.stringify(studyForm) });
      setStudyForm({ title: "", content: "", orderIndex: 0 });
      setShowStudyForm(false);
      load();
    } finally { setSavingStudy(false); }
  };

  const handleUpdateStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudy) return;
    setSavingStudy(true);
    try {
      await fetch(`${API}/api/v1/cases/admin/${id}/studies/${editingStudy.id}`, {
        method: "PUT", headers: headers(), body: JSON.stringify(studyForm),
      });
      setEditingStudy(null);
      setStudyForm({ title: "", content: "", orderIndex: 0 });
      load();
    } finally { setSavingStudy(false); }
  };

  const handleDeleteStudy = async (studyId: string) => {
    if (!confirm("Delete this case study?")) return;
    await fetch(`${API}/api/v1/cases/admin/${id}/studies/${studyId}`, { method: "DELETE", headers: headers() });
    load();
  };

  // ── Edit: Activities CRUD ─────────────────────────────────────────────────

  const handleSaveNewActivity = async (type: string, data: any, order: number) => {
    setSavingActivity(true);
    try {
      await fetch(`${API}/api/v1/cases/admin/${id}/activities`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ activityType: type, activityData: data, orderIndex: order }),
      });
      setShowActivityForm(false);
      load();
    } finally { setSavingActivity(false); }
  };

  const handleUpdateActivity = async (type: string, data: any) => {
    if (!editingActivity) return;
    setSavingActivity(true);
    try {
      await fetch(`${API}/api/v1/cases/admin/${id}/activities/${editingActivity.id}`, {
        method: "PUT", headers: headers(),
        body: JSON.stringify({ activityType: type, activityData: data }),
      });
      setEditingActivity(null);
      load();
    } finally { setSavingActivity(false); }
  };

  const handleDeleteActivity = async (actId: string) => {
    if (!confirm("Delete this activity?")) return;
    await fetch(`${API}/api/v1/cases/admin/${id}/activities/${actId}`, { method: "DELETE", headers: headers() });
    load();
  };

  // ── Loading / empty states ────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F0EDE7] text-[#01696F]">
      <Loader2 className="w-10 h-10 animate-spin" />
    </div>
  );

  if (!caseData) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F0EDE7] gap-4">
      <p className="font-semibold text-zinc-500">Case not found.</p>
      <button onClick={() => router.back()} className="text-[#01696F] underline text-sm">Back</button>
    </div>
  );

  const studies: any[] = caseData.caseStudies ?? [];
  const activities: any[] = caseData.caseActivities ?? [];

  // ── Shared page header ────────────────────────────────────────────────────

  const PageHeader = (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 bg-white shrink-0">
      <button
        onClick={() => router.push(`/admin/cases/${id}`)}
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[#01696F] transition-colors shrink-0"
      >
        <ArrowLeft size={14} /> Cases
      </button>
      <div className="h-4 w-px bg-zinc-200" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-zinc-800 truncate">{caseData.title}</p>
        <p className="text-[10px] text-zinc-400 font-semibold">{caseData.isPublished ? "Published" : "Draft"} · {caseData.difficulty}</p>
      </div>
      {/* View mode toggle */}
      <div className="flex gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-xl shrink-0">
        <button
          onClick={() => setViewMode("preview")}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all",
            viewMode === "preview" ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
        >
          <Eye size={12} /> Preview
        </button>
        <button
          onClick={() => setViewMode("edit")}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all",
            viewMode === "edit" ? "bg-[#01696F] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
        >
          <Pencil size={11} /> Edit
        </button>
      </div>
    </header>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // EDIT MODE
  // ════════════════════════════════════════════════════════════════════════════

  if (viewMode === "edit") {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#F8F8F7]">
        {PageHeader}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">

            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-zinc-200 p-1.5 rounded-2xl w-fit shadow-sm">
              {(["studies", "activities"] as const).map((t) => (
                <button key={t} onClick={() => setEditTab(t)}
                  className={cn("px-5 py-2 rounded-xl text-xs font-extrabold capitalize transition-all",
                    editTab === t ? "bg-[#01696F] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
                  {t} {t === "studies" ? `(${studies.length})` : `(${activities.length})`}
                </button>
              ))}
            </div>

            {/* ── Studies tab ── */}
            {editTab === "studies" && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-end">
                  <button onClick={() => { setShowStudyForm((v) => !v); setEditingStudy(null); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#01696F] text-white text-xs font-black rounded-xl hover:bg-[#01696F]/90 active:scale-95">
                    <Plus size={13} /> Add Study
                  </button>
                </div>

                {/* New study form */}
                {showStudyForm && (
                  <form onSubmit={handleSaveNewStudy} className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                    <h3 className="text-sm font-extrabold text-zinc-700">New Case Study</h3>
                    <Field label="Title *" value={studyForm.title} onChange={(v) => setStudyForm((f) => ({ ...f, title: v }))} required />
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Content *</label>
                      <textarea required value={studyForm.content} onChange={(e) => setStudyForm((f) => ({ ...f, content: e.target.value }))}
                        rows={6} className="border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-800 bg-white placeholder:text-zinc-400 outline-none focus:border-[#01696F] resize-none" placeholder="Write the case study content here..." />
                    </div>
                    <Field label="Order index" value={String(studyForm.orderIndex)} onChange={(v) => setStudyForm((f) => ({ ...f, orderIndex: +v }))} />
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowStudyForm(false)} className="px-4 py-2 text-xs font-bold text-zinc-500">Cancel</button>
                      <button type="submit" disabled={savingStudy} className="px-5 py-2 bg-[#01696F] text-white text-xs font-black rounded-xl hover:bg-[#01696F]/90 disabled:opacity-60 flex items-center gap-1.5">
                        {savingStudy ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                      </button>
                    </div>
                  </form>
                )}

                {/* Edit study form */}
                {editingStudy && (
                  <form onSubmit={handleUpdateStudy} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Pencil size={13} className="text-amber-600" />
                      <h3 className="text-sm font-extrabold text-zinc-700">Edit Case Study</h3>
                    </div>
                    <Field label="Title *" value={studyForm.title} onChange={(v) => setStudyForm((f) => ({ ...f, title: v }))} required />
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Content *</label>
                      <textarea required value={studyForm.content} onChange={(e) => setStudyForm((f) => ({ ...f, content: e.target.value }))}
                        rows={8} className="border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-800 bg-white placeholder:text-zinc-400 outline-none focus:border-[#01696F] resize-none" />
                    </div>
                    <Field label="Order index" value={String(studyForm.orderIndex)} onChange={(v) => setStudyForm((f) => ({ ...f, orderIndex: +v }))} />
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setEditingStudy(null)} className="px-4 py-2 text-xs font-bold text-zinc-500">Cancel</button>
                      <button type="submit" disabled={savingStudy} className="px-5 py-2 bg-amber-600 text-white text-xs font-black rounded-xl hover:bg-amber-700 disabled:opacity-60 flex items-center gap-1.5">
                        {savingStudy ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Update
                      </button>
                    </div>
                  </form>
                )}

                {studies.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 font-semibold text-sm">No case studies yet. Add one above.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {studies.map((s, idx) => (
                      <div key={s.id} className={cn("bg-white border rounded-2xl p-4 flex gap-3", editingStudy?.id === s.id ? "border-amber-300" : "border-zinc-200")}>
                        <span className="w-6 h-6 rounded-full bg-[#E6F0F1] text-[#01696F] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-extrabold text-zinc-800">{s.title}</p>
                          <p className="text-[11px] text-zinc-500 font-medium mt-1 line-clamp-3 whitespace-pre-line">{s.content}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEditStudy(s)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 text-zinc-300 hover:text-amber-500 transition-all">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDeleteStudy(s.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Activities tab ── */}
            {editTab === "activities" && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-end">
                  <button onClick={() => { setShowActivityForm((v) => !v); setEditingActivity(null); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#01696F] text-white text-xs font-black rounded-xl hover:bg-[#01696F]/90 active:scale-95">
                    <Plus size={13} /> Add Activity
                  </button>
                </div>

                {showActivityForm && (
                  <ActivityForm
                    onSave={handleSaveNewActivity}
                    onCancel={() => setShowActivityForm(false)}
                    saving={savingActivity}
                  />
                )}

                {editingActivity && (
                  <EditActivityForm
                    activity={editingActivity}
                    onSave={handleUpdateActivity}
                    onCancel={() => setEditingActivity(null)}
                    saving={savingActivity}
                  />
                )}

                {activities.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 font-semibold text-sm">No activities yet. Add one above.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activities.map((a, idx) => {
                      const d = a.activityData ?? {};
                      const TYPE_COLORS: Record<string, string> = {
                        mcq: "bg-violet-50 text-violet-700 border-violet-200",
                        canvas: "bg-amber-50 text-amber-700 border-amber-200",
                        quantus: "bg-sky-50 text-sky-700 border-sky-200",
                      };
                      const isEditing = editingActivity?.id === a.id;
                      return (
                        <div key={a.id} className={cn("bg-white border rounded-2xl p-4 flex items-start gap-3", isEditing ? "border-amber-300" : "border-zinc-200")}>
                          <span className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest", TYPE_COLORS[a.activityType] ?? "")}>{a.activityType}</span>
                            </div>
                            <p className="text-xs text-zinc-600 font-medium line-clamp-2">{d.instructions || d.title || "No description"}</p>
                            {a.activityType === "mcq" && (
                              <p className="text-[10px] text-zinc-400 font-semibold mt-1">{(d.questions ?? []).length} question{(d.questions ?? []).length !== 1 ? "s" : ""}</p>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => { setEditingActivity(a); setShowActivityForm(false); }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 text-zinc-300 hover:text-amber-500 transition-all">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDeleteActivity(a.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PREVIEW MODE
  // ════════════════════════════════════════════════════════════════════════════

  if (steps.length === 0) return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8F8F7]">
      {PageHeader}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-600 p-8 text-center">
        <Eye size={36} className="text-[#01696F] opacity-40" />
        <p className="font-extrabold text-lg text-zinc-800">No activities to preview</p>
        <p className="text-sm text-zinc-500 max-w-sm">Switch to Edit mode to add activities.</p>
        <button onClick={() => setViewMode("edit")}
          className="px-6 py-2.5 bg-[#01696F] text-white text-sm font-black rounded-2xl hover:bg-[#01696F]/90 shadow-sm transition-all active:scale-95">
          Switch to Edit
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-white text-zinc-800">
      {PageHeader}

      <div className="flex flex-row flex-1 overflow-hidden p-2 sm:p-3 gap-0">

        {/* ══════════════════════ LEFT PANEL ══════════════════════ */}
        <div className={cn("flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden", leftOpen ? "w-60 xl:w-64" : "w-0")}>
          <div className="w-60 xl:w-64 h-full flex flex-col justify-between pr-2">
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-3">

              <div className="flex flex-col items-center gap-2 border-b border-zinc-100 pb-3 pt-1">
                <div className="w-full flex justify-center">
                  <Image src={logo} alt="Shankh" width={110} height={32} className="object-contain" style={{ width: "auto", height: "auto" }} />
                </div>
                <button
                  onClick={() => setShowStudies(true)}
                  className="w-full py-1.5 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-zinc-200"
                >
                  📖 View Studies
                </button>
              </div>

              <div className="flex flex-col gap-1.5 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Progress</span>
                  <span className="text-[10px] font-black text-[#01696F]">0/{totalSteps}</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                  <div className="h-full bg-[#01696F] rounded-full" style={{ width: "0%" }} />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                {step && <TypePill type={step.stepType === "mcq-question" ? "mcq" : step.stepType} />}
                <span className="text-[10px] font-bold text-zinc-400">{currentIdx + 1}/{totalSteps}</span>
              </div>

              <div className="flex bg-[#F0EDE7] p-1 rounded-full w-full border border-zinc-200/50 shadow-sm">
                {(["instructions", "context"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveLeftTab(tab)}
                    className={cn("flex-1 py-1.5 text-[10px] font-bold rounded-full transition-all duration-200 capitalize",
                      activeLeftTab === tab ? "bg-[#28251D] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800")}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="bg-[#FAF7F2] shadow-[0_2px_4px_0_#0000001F_inset] border border-[#F0EDE7] rounded-2xl p-3 flex flex-col gap-3 flex-1 overflow-y-auto">
                <div className="flex items-start justify-between gap-2 border-b border-zinc-200/50 pb-2">
                  <h3 className="font-extrabold text-zinc-900 text-xs leading-tight tracking-tight">{caseData?.title || "Case Simulation"}</h3>
                  {step && (
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest shrink-0",
                      TYPE_META[step.stepType === "mcq-question" ? "mcq" : step.stepType]?.color ?? "bg-zinc-100 text-zinc-600 border-zinc-200")}>
                      {step.stepType === "mcq-question" ? "mcq" : step.stepType}
                    </span>
                  )}
                </div>
                {activeLeftTab === "instructions" ? (
                  <div className="animate-fade-in">
                    <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70 block mb-1">Instructions</span>
                    <p className="text-xs text-zinc-700 leading-relaxed font-semibold whitespace-pre-line">
                      {actData?.instructions || "Complete the activity and submit your answer."}
                    </p>
                  </div>
                ) : actData?.context ? (
                  <div className="animate-fade-in">
                    <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70 block mb-1">Context & Scenario</span>
                    <p className="text-xs text-zinc-600 leading-relaxed font-medium whitespace-pre-line">{actData.context}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400 font-medium italic">No context provided.</p>
                )}
                {isCanvasActive && canvasPreviewEdges.length > 0 && (
                  <div className="border-t border-zinc-200/50 pt-2 flex flex-col gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#01696F]/60">Solution Preview</span>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                      {canvasPreviewEdges.length} connection{canvasPreviewEdges.length !== 1 ? "s" : ""} in the correct answer.
                    </p>
                  </div>
                )}
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

        {/* Left panel toggle */}
        {!leftOpen && (
          <button onClick={() => setLeftOpen(true)}
            className="self-center z-20 flex-shrink-0 w-8 h-40 bg-white border border-zinc-200 shadow-md rounded-full flex items-center justify-center hover:bg-[#E6F0F1] hover:border-[#01696F]/30 transition-all duration-200 active:scale-95 group">
            <ChevronRight size={14} className="text-zinc-500 group-hover:text-[#01696F]" />
          </button>
        )}

        {/* ══════════════════════ MAIN WORKSPACE ══════════════════════ */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#F0EDE7] shadow-[0px_4px_8px_0px_#0000003D_inset] border border-[#F0EDE7] rounded-2xl overflow-hidden mx-1.5">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200 bg-[#F0EDE7]/60 shrink-0 gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleReset}
                className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0">
                <RefreshCw size={11} /> Reset
              </button>
              <button onClick={() => setCurrentIdx(p => Math.max(0, p - 1))} disabled={currentIdx === 0}
                className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 flex-shrink-0">
                <ArrowLeft size={13} /> <span className="hidden sm:inline">Prev</span>
              </button>
              <span className="text-[12px] font-semibold text-[#01696F] bg-[#E6F0F1] px-3 py-1.5 rounded-xl shadow-sm border border-[#01696F]/10 select-none flex-shrink-0 whitespace-nowrap">
                {currentIdx + 1} / {totalSteps}
              </span>
              <button onClick={() => setCurrentIdx(p => Math.min(totalSteps - 1, p + 1))} disabled={currentIdx >= totalSteps - 1}
                className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 flex-shrink-0">
                <span className="hidden sm:inline">Next</span> <ArrowRight size={13} />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button disabled className="px-3 sm:px-4 py-2 bg-zinc-200 text-zinc-400 cursor-not-allowed font-extrabold text-xs rounded-xl flex items-center gap-1.5 flex-shrink-0">
                <Eye size={13} /> Preview Only
              </button>
            </div>
          </div>

          {/* Activity area */}
          <div className="flex-1 overflow-auto relative">

            {/* ── MCQ question ── */}
            {step?.stepType === "mcq-question" && (
              <div className="flex flex-col p-6 sm:p-10 justify-center max-w-3xl mx-auto space-y-8 animate-fade-in w-full min-h-full">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">
                  Q{(step.questionIndex ?? 0) + 1} of {(step.allQuestions ?? []).length} questions
                </p>
                <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 leading-snug tracking-tight">
                  {step.question.questionText}
                </h2>
                <div className="space-y-3">
                  {(step.question.options ?? []).map((opt: any, oi: number) => {
                    const isSel = selectedOption === opt.id;
                    return (
                      <button key={opt.id} onClick={() => setSelectedOption(opt.id)}
                        className={cn("w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-sm active:scale-[0.99]",
                          isSel ? "bg-[#01696F] border-transparent text-white font-bold" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 text-zinc-700 bg-white")}>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <span className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-sm",
                            isSel ? "bg-white text-[#01696F]" : "bg-white border border-zinc-200 text-zinc-700")}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="text-sm font-semibold tracking-tight">{opt.optionText}</span>
                        </div>
                        {isSel && <CheckCircle2 size={18} className="text-white shrink-0" fill="currentColor" />}
                      </button>
                    );
                  })}
                </div>
                {step.question.explanation && (
                  <p className="text-xs text-zinc-500 font-medium bg-amber-50 rounded-xl px-4 py-3 border border-amber-100 leading-relaxed">
                    💡 <span className="text-amber-700 font-bold">Explanation:</span> {step.question.explanation}
                  </p>
                )}
              </div>
            )}

            {/* ── Quantus ── */}
            {step?.stepType === "quantus" && (
              <div className="absolute inset-0 flex flex-col">
                <ExcelGrid
                  table={excelTable}
                  inputs={excelInputs}
                  userInputs={spreadsheetGrid}
                  setUserInputs={setSpreadsheetGrid}
                  isValidated={false}
                  feedback={{}}
                  sheetTabName="Case Model"
                  showToolbar
                  colLabels={actData.gridCols ?? []}
                  rowLabels={actData.gridRows ?? []}
                />
              </div>
            )}

            {/* ── Canvas ── */}
            {isCanvasActive && (
              <div className="absolute inset-0">
                <CanvasWorkspace
                  key={`canvas-preview-${step.id}`}
                  paletteItems={canvasPaletteItems}
                  initialNodes={canvasPreviewNodes}
                  initialEdges={canvasPreviewEdges}
                  solutionSnapshot={actData?.solutionSnapshot ?? null}
                  disabled
                />
              </div>
            )}
          </div>
        </div>

        {/* Right panel toggle */}
        {!rightOpen && (
          <button onClick={() => setRightOpen(true)}
            className="self-center z-20 flex-shrink-0 w-8 h-40 bg-white border border-zinc-200 shadow-md rounded-full flex items-center justify-center hover:bg-[#E6F0F1] hover:border-[#01696F]/30 transition-all duration-200 active:scale-95 group">
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-[11px] font-bold text-[#01696F] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">Activities</span>
              <Trophy size={14} className="text-[#01696F] group-hover:scale-110 transition-transform duration-200" />
            </div>
          </button>
        )}

        {/* ══════════════════════ RIGHT PANEL ══════════════════════ */}
        <div className={cn("flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden", rightOpen ? "w-72 xl:w-80" : "w-0")}>
          <div className="w-72 xl:w-80 h-full flex flex-col pl-2">
            <div className="bg-white flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-200 flex-shrink-0 bg-[#FAF7F2]">
                <div className="w-8 h-8 rounded-full bg-[#01696F]/10 flex items-center justify-center flex-shrink-0">
                  <Trophy size={16} className="text-[#01696F]" />
                </div>
                <h3 className="font-black text-zinc-800 text-base tracking-tight">Activities</h3>
                <button onClick={() => setRightOpen(false)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition group">
                  <X size={16} className="text-zinc-500 group-hover:text-zinc-800 transition" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-[#F0EDE7]">
                <div className="bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm flex flex-col gap-1.5">
                  <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Jump to Step</h4>
                  {steps.map((s, idx) => {
                    const isCurrent = idx === currentIdx;
                    const typeKey = s.stepType === "mcq-question" ? "mcq" : s.stepType;
                    const label = s.stepType === "mcq-question"
                      ? `Q${(s.questionIndex ?? 0) + 1} — ${(s.question?.questionText ?? "MCQ").slice(0, 28)}…`
                      : TYPE_META[s.stepType]?.label ?? s.stepType;
                    return (
                      <button key={s.id} onClick={() => setCurrentIdx(idx)}
                        className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[11px] font-bold transition-all border",
                          isCurrent ? "bg-[#01696F] text-white border-transparent shadow-sm" : "bg-zinc-50 text-zinc-600 border-zinc-100 hover:bg-zinc-100")}>
                        <span className={cn("w-5 h-5 rounded-full border text-[9px] flex items-center justify-center shrink-0 font-black",
                          isCurrent ? "border-white/30 text-white/80" : "border-zinc-300 text-zinc-400")}>{idx + 1}</span>
                        <span className={cn("w-2 h-2 rounded-full shrink-0",
                          typeKey === "mcq" ? "bg-violet-400" : typeKey === "canvas" ? "bg-amber-400" : "bg-sky-400")} />
                        <span className="flex-1 truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CaseStudiesModal
        studies={studies}
        caseTitle={caseData?.title ?? ""}
        isOpen={showStudies}
        onClose={() => setShowStudies(false)}
      />
    </div>
  );
}
