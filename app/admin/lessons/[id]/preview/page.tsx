"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  Loader2, ArrowLeft, ArrowRight, CheckCircle2,
  ChevronRight, Trophy, X, RefreshCw, Eye, Pencil,
  FileQuestion, PenLine, TableProperties, Check, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExcelGrid } from "@/components/exercise/ExcelGrid";
import { CanvasWorkspace } from "@/components/canvas/CanvasWorkspace";
import { tokensToItems } from "@/components/canvas/CanvasPalette";
import type { PlacedNode } from "@/components/canvas/types";
import Image from "next/image";
import logo from "@/public/ShankhFull.png";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const TYPE_META: Record<string, { label: string; color: string }> = {
  quantus: { label: "Spreadsheet", color: "bg-sky-100 text-sky-700 border-sky-200" },
  mcq: { label: "Multiple Choice", color: "bg-violet-100 text-violet-700 border-violet-200" },
  canvas: { label: "Framework Drill", color: "bg-amber-100 text-amber-700 border-amber-200" },
};

function TypePill({ type }: { type: string }) {
  const m = TYPE_META[type] ?? { label: type, color: "bg-zinc-100 text-zinc-600 border-zinc-200" };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", m.color)}>
      {m.label}
    </span>
  );
}

function buildLessonSteps(lesson: any): any[] {
  const steps: any[] = [];

  if (lesson.mcqActivity) {
    const questions = lesson.mcqActivity.questions ?? [];
    questions.forEach((q: any, qi: number) => {
      steps.push({
        id: `mcq-${q.id}-${qi}`,
        activityId: lesson.mcqActivity.id,
        stepType: "mcq-question",
        question: q,
        allQuestions: questions,
        questionIndex: qi,
        activityData: {
          instructions: lesson.mcqActivity.instructions,
          context: lesson.mcqActivity.context,
        },
      });
    });
  }

  if (lesson.canvasActivity) {
    const ca = lesson.canvasActivity;
    const edges = (ca.solutionEdges ?? []).map((e: any) => ({
      sourceId: e.fromTokenId,
      targetId: e.toTokenId,
    }));
    steps.push({
      id: ca.id,
      activityId: ca.id,
      stepType: "canvas",
      activityData: {
        instructions: ca.instructions,
        context: ca.context,
        tokens: ca.tokens ?? [],
        paletteItems: ca.paletteItems ?? [],
        solutionSnapshot: edges.length > 0 ? { edges, nodePositions: [] } : null,
      },
    });
  }

  if (lesson.quantusActivity) {
    const qa = lesson.quantusActivity;
    const cols = [...(qa.columns ?? [])].sort((a: any, b: any) => a.colIndex - b.colIndex);
    const cells = qa.quantusCells ?? [];
    const rowIndices = [...new Set<number>(cells.map((c: any) => c.rowIndex as number))].sort(
      (a, b) => a - b
    );
    const gridRows = rowIndices.map(String);
    const gridCols = cols.map((c: any) => c.label);
    const gridValues: Record<string, string> = {};
    const correctAnswers: Record<string, any> = {};
    cells.forEach((cell: any) => {
      const rowLabel = String(cell.rowIndex);
      const colLabel = cols[cell.colIndex]?.label ?? String(cell.colIndex);
      const key = `${rowLabel}-${colLabel}`;
      gridValues[key] = String(cell.displayValue ?? "");
      if (cell.isEditable && cell.expectedValue !== null && cell.expectedValue !== undefined) {
        correctAnswers[key] = cell.expectedValue;
      }
    });
    steps.push({
      id: qa.id,
      activityId: qa.id,
      stepType: "quantus",
      activityData: {
        instructions: qa.instructions,
        context: qa.context,
        gridRows,
        gridCols,
        gridValues,
        correctAnswers,
      },
    });
  }

  return steps;
}

const ACTIVITY_CFG = {
  mcq: {
    label: "MCQ Quiz",
    Icon: FileQuestion,
    route: "mcq",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    btnCls: "bg-violet-600 hover:bg-violet-700",
  },
  canvas: {
    label: "Canvas Drill",
    Icon: PenLine,
    route: "canvas",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    btnCls: "bg-indigo-600 hover:bg-indigo-700",
  },
  quantus: {
    label: "Quantus Lab",
    Icon: TableProperties,
    route: "quantus",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    btnCls: "bg-amber-500 hover:bg-amber-600",
  },
} as const;

export default function LessonPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const token = useAuthStore((s) => s.token);

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");

  const [steps, setSteps] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [spreadsheetGrid, setSpreadsheetGrid] = useState<Record<string, string>>({});
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<"instructions" | "context">("instructions");

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/v1/admin/lessons/${id}`, { headers: headers() })
      .then((r) => r.json())
      .then((res) => {
        const data = res.data;
        if (!data) return;
        setLesson(data);
        setSteps(buildLessonSteps(data));
        setCurrentIdx(0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  const step = steps[currentIdx];
  const actData = step?.activityData ?? {};
  const isCanvasActive = step?.stepType === "canvas";
  const totalSteps = steps.length;

  useEffect(() => {
    setSelectedOption(null);
    if (step?.stepType === "quantus") {
      // Pre-fill editable cells with their correct values so the admin can verify answers.
      const prefilled: Record<string, string> = {};
      Object.entries(actData?.correctAnswers ?? {}).forEach(([k, v]) => {
        prefilled[k] = String(v ?? "");
      });
      setSpreadsheetGrid(prefilled);
    }
  }, [currentIdx]);

  const canvasPaletteItems = useMemo(
    () => actData?.paletteItems?.length ? actData.paletteItems : tokensToItems(actData?.tokens ?? []),
    [step]
  );

  const canvasPreviewNodes: PlacedNode[] = useMemo(() => {
    if (step?.stepType !== "canvas") return [];
    const positions: { id: string; x: number; y: number }[] =
      actData?.solutionSnapshot?.nodePositions ?? [];
    return canvasPaletteItems.map((item: any, idx: number) => {
      const pos = positions.find((p: any) => p.id === item.id);
      return {
        ...item,
        x: pos?.x ?? 40 + (idx % 4) * 170,
        y: pos?.y ?? 40 + Math.floor(idx / 4) * 90,
      };
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
    if (step?.stepType === "quantus") setSpreadsheetGrid(actData?.gridValues ?? {});
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-[#F0EDE7] text-[#01696F]">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );

  if (!lesson)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F0EDE7] gap-4">
        <p className="font-semibold text-zinc-500">Lesson not found.</p>
        <button onClick={() => router.back()} className="text-[#01696F] underline text-sm">
          Back
        </button>
      </div>
    );

  const PageHeader = (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 bg-white shrink-0">
      <button
        onClick={() => router.push(`/admin/lessons/${id}`)}
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[#01696F] transition-colors shrink-0"
      >
        <ArrowLeft size={14} /> Lesson
      </button>
      <div className="h-4 w-px bg-zinc-200" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-zinc-800 truncate">{lesson.name}</p>
        <p className="text-[10px] text-zinc-400 font-semibold">
          {lesson.subtopic?.topic?.module?.name} › {lesson.subtopic?.topic?.name} ›{" "}
          {lesson.subtopic?.name}
        </p>
      </div>
      <div className="flex gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-xl shrink-0">
        <button
          onClick={() => setViewMode("preview")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all",
            viewMode === "preview"
              ? "bg-white text-zinc-800 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <Eye size={12} /> Preview
        </button>
        <button
          onClick={() => setViewMode("edit")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all",
            viewMode === "edit"
              ? "bg-[#01696F] text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <Pencil size={11} /> Edit
        </button>
      </div>
    </header>
  );

  // ── EDIT MODE ─────────────────────────────────────────────────────────────────

  if (viewMode === "edit") {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#F8F8F7]">
        {PageHeader}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {(["mcq", "canvas", "quantus"] as const).map((type) => {
                const cfg = ACTIVITY_CFG[type];
                const { Icon } = cfg;
                const hasAct = !!lesson[`${type}Activity`];
                return (
                  <div
                    key={type}
                    className="bg-white border border-zinc-200 rounded-3xl p-7 flex flex-col gap-5 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-3.5 rounded-2xl", cfg.iconBg, cfg.iconColor)}>
                          <Icon size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            Activity Type
                          </p>
                          <h3 className="text-base font-extrabold text-zinc-900 leading-tight">
                            {cfg.label}
                          </h3>
                        </div>
                      </div>
                      {hasAct ? (
                        <span className="shrink-0 text-[10px] font-black px-3 py-1.5 rounded-full border flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border-emerald-200">
                          <Check size={10} /> Created
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border bg-zinc-50 text-zinc-400 border-zinc-200 flex items-center gap-1.5">
                          <Circle size={10} /> Not yet
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => router.push(`/admin/lessons/${id}/${cfg.route}`)}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-3 text-white text-xs font-black rounded-2xl shadow-sm transition-all active:scale-[0.98]",
                        cfg.btnCls
                      )}
                    >
                      {hasAct ? (
                        <>
                          <Pencil size={13} /> Edit Activity <ChevronRight size={13} />
                        </>
                      ) : (
                        <>
                          <Icon size={13} /> Create Activity <ChevronRight size={13} />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PREVIEW MODE (empty) ──────────────────────────────────────────────────────

  if (steps.length === 0)
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#F8F8F7]">
        {PageHeader}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-600 p-8 text-center">
          <Eye size={36} className="text-[#01696F] opacity-40" />
          <p className="font-extrabold text-lg text-zinc-800">No activities to preview</p>
          <p className="text-sm text-zinc-500 max-w-sm">Switch to Edit mode to add activities.</p>
          <button
            onClick={() => setViewMode("edit")}
            className="px-6 py-2.5 bg-[#01696F] text-white text-sm font-black rounded-2xl hover:bg-[#01696F]/90 shadow-sm transition-all active:scale-95"
          >
            Switch to Edit
          </button>
        </div>
      </div>
    );

  // ── PREVIEW MODE (3-panel) ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-white text-zinc-800">
      {PageHeader}

      <div className="flex flex-row flex-1 overflow-hidden p-2 sm:p-3 gap-0">

        {/* ══ LEFT PANEL ══ */}
        <div
          className={cn(
            "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
            leftOpen ? "w-60 xl:w-64" : "w-0"
          )}
        >
          <div className="w-60 xl:w-64 h-full flex flex-col justify-between pr-2">
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-3">
              <div className="flex flex-col items-center gap-2 border-b border-zinc-100 pb-3 pt-1">
                <div className="w-full flex justify-center">
                  <Image
                    src={logo}
                    alt="Shankh"
                    width={110}
                    height={32}
                    className="object-contain"
                    style={{ width: "auto", height: "auto" }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Progress
                  </span>
                  <span className="text-[10px] font-black text-[#01696F]">
                    0/{totalSteps}
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                  <div className="h-full bg-[#01696F] rounded-full" style={{ width: "0%" }} />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                {step && (
                  <TypePill type={step.stepType === "mcq-question" ? "mcq" : step.stepType} />
                )}
                <span className="text-[10px] font-bold text-zinc-400">
                  {currentIdx + 1}/{totalSteps}
                </span>
              </div>

              <div className="flex bg-[#F0EDE7] p-1 rounded-full w-full border border-zinc-200/50 shadow-sm">
                {(["instructions", "context"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveLeftTab(tab)}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold rounded-full transition-all duration-200 capitalize",
                      activeLeftTab === tab
                        ? "bg-[#28251D] text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="bg-[#FAF7F2] shadow-[0_2px_4px_0_#0000001F_inset] border border-[#F0EDE7] rounded-2xl p-3 flex flex-col gap-3 flex-1 overflow-y-auto">
                <div className="flex items-start justify-between gap-2 border-b border-zinc-200/50 pb-2">
                  <h3 className="font-extrabold text-zinc-900 text-xs leading-tight tracking-tight">
                    {lesson?.name || "Lesson"}
                  </h3>
                  {step && (
                    <span
                      className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest shrink-0",
                        TYPE_META[step.stepType === "mcq-question" ? "mcq" : step.stepType]
                          ?.color ?? "bg-zinc-100 text-zinc-600 border-zinc-200"
                      )}
                    >
                      {step.stepType === "mcq-question" ? "mcq" : step.stepType}
                    </span>
                  )}
                </div>
                {activeLeftTab === "instructions" ? (
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70 block mb-1">
                      Instructions
                    </span>
                    <p className="text-xs text-zinc-700 leading-relaxed font-semibold whitespace-pre-line">
                      {actData?.instructions || "Complete the activity and submit your answer."}
                    </p>
                  </div>
                ) : actData?.context ? (
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70 block mb-1">
                      Context & Scenario
                    </span>
                    <p className="text-xs text-zinc-600 leading-relaxed font-medium whitespace-pre-line">
                      {actData.context}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400 font-medium italic">
                    No context provided.
                  </p>
                )}
                {isCanvasActive && canvasPreviewEdges.length > 0 && (
                  <div className="border-t border-zinc-200/50 pt-2 flex flex-col gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#01696F]/60">
                      Solution Preview
                    </span>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                      {canvasPreviewEdges.length} connection
                      {canvasPreviewEdges.length !== 1 ? "s" : ""} in the correct answer.
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
                <p className="text-[9px] text-amber-600 font-bold uppercase tracking-wider">
                  Read-only mode
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Left toggle */}
        {!leftOpen && (
          <button
            onClick={() => setLeftOpen(true)}
            className="self-center z-20 flex-shrink-0 w-8 h-40 bg-white border border-zinc-200 shadow-md rounded-full flex items-center justify-center hover:bg-[#E6F0F1] hover:border-[#01696F]/30 transition-all duration-200 active:scale-95 group"
          >
            <ChevronRight size={14} className="text-zinc-500 group-hover:text-[#01696F]" />
          </button>
        )}

        {/* ══ MAIN WORKSPACE ══ */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#F0EDE7] shadow-[0px_4px_8px_0px_#0000003D_inset] border border-[#F0EDE7] rounded-2xl overflow-hidden mx-1.5">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200 bg-[#F0EDE7]/60 shrink-0 gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
              >
                <RefreshCw size={11} /> Reset
              </button>
              <button
                onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                disabled={currentIdx === 0}
                className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 flex-shrink-0"
              >
                <ArrowLeft size={13} /> <span className="hidden sm:inline">Prev</span>
              </button>
              <span className="text-[12px] font-semibold text-[#01696F] bg-[#E6F0F1] px-3 py-1.5 rounded-xl shadow-sm border border-[#01696F]/10 select-none flex-shrink-0 whitespace-nowrap">
                {currentIdx + 1} / {totalSteps}
              </span>
              <button
                onClick={() => setCurrentIdx((p) => Math.min(totalSteps - 1, p + 1))}
                disabled={currentIdx >= totalSteps - 1}
                className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 flex-shrink-0"
              >
                <span className="hidden sm:inline">Next</span> <ArrowRight size={13} />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                disabled
                className="px-3 sm:px-4 py-2 bg-zinc-200 text-zinc-400 cursor-not-allowed font-extrabold text-xs rounded-xl flex items-center gap-1.5 flex-shrink-0"
              >
                <Eye size={13} /> Preview Only
              </button>
            </div>
          </div>

          {/* Activity area */}
          <div className="flex-1 overflow-auto relative">

            {/* MCQ question */}
            {step?.stepType === "mcq-question" && (
              <div className="flex flex-col p-6 sm:p-10 justify-center max-w-3xl mx-auto space-y-8 w-full min-h-full">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">
                  Q{(step.questionIndex ?? 0) + 1} of {(step.allQuestions ?? []).length} questions
                </p>
                <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 leading-snug tracking-tight">
                  {step.question.questionText}
                </h2>
                <div className="space-y-3">
                  {(step.question.options ?? []).map((opt: any, oi: number) => {
                    const isSel = selectedOption === opt.id;
                    const isCorrect = !!opt.isCorrect;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedOption(opt.id)}
                        className={cn(
                          "w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-sm active:scale-[0.99]",
                          isCorrect
                            ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-1 ring-emerald-300"
                            : isSel
                            ? "bg-[#01696F] border-transparent text-white font-bold"
                            : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 text-zinc-700 bg-white"
                        )}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <span
                            className={cn(
                              "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-sm",
                              isCorrect
                                ? "bg-emerald-500 text-white"
                                : isSel
                                ? "bg-white text-[#01696F]"
                                : "bg-white border border-zinc-200 text-zinc-700"
                            )}
                          >
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="text-sm font-semibold tracking-tight">
                            {opt.optionText}
                          </span>
                        </div>
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 shrink-0">
                            <CheckCircle2 size={16} className="shrink-0" /> Correct
                          </span>
                        ) : (
                          isSel && (
                            <CheckCircle2 size={18} className="text-white shrink-0" fill="currentColor" />
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
                {step.question.explanation && (
                  <p className="text-xs text-zinc-500 font-medium bg-amber-50 rounded-xl px-4 py-3 border border-amber-100 leading-relaxed">
                    💡{" "}
                    <span className="text-amber-700 font-bold">Explanation:</span>{" "}
                    {step.question.explanation}
                  </p>
                )}
              </div>
            )}

            {/* Quantus */}
            {step?.stepType === "quantus" && (
              <div className="absolute inset-0 flex flex-col">
                <ExcelGrid
                  table={excelTable}
                  inputs={excelInputs}
                  userInputs={spreadsheetGrid}
                  setUserInputs={setSpreadsheetGrid}
                  isValidated={false}
                  feedback={{}}
                  sheetTabName={lesson?.quantusActivity?.title || "Sheet"}
                  showToolbar
                  colLabels={actData.gridCols ?? []}
                  rowLabels={actData.gridRows ?? []}
                />
              </div>
            )}

            {/* Canvas */}
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

        {/* Right toggle */}
        {!rightOpen && (
          <button
            onClick={() => setRightOpen(true)}
            className="self-center z-20 flex-shrink-0 w-8 h-40 bg-white border border-zinc-200 shadow-md rounded-full flex items-center justify-center hover:bg-[#E6F0F1] hover:border-[#01696F]/30 transition-all duration-200 active:scale-95 group"
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-[11px] font-bold text-[#01696F] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
                Activities
              </span>
              <Trophy size={14} className="text-[#01696F] group-hover:scale-110 transition-transform duration-200" />
            </div>
          </button>
        )}

        {/* ══ RIGHT PANEL ══ */}
        <div
          className={cn(
            "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
            rightOpen ? "w-72 xl:w-80" : "w-0"
          )}
        >
          <div className="w-72 xl:w-80 h-full flex flex-col pl-2">
            <div className="bg-white flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-200 flex-shrink-0 bg-[#FAF7F2]">
                <div className="w-8 h-8 rounded-full bg-[#01696F]/10 flex items-center justify-center flex-shrink-0">
                  <Trophy size={16} className="text-[#01696F]" />
                </div>
                <h3 className="font-black text-zinc-800 text-base tracking-tight">Activities</h3>
                <button
                  onClick={() => setRightOpen(false)}
                  className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition group"
                >
                  <X size={16} className="text-zinc-500 group-hover:text-zinc-800 transition" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-[#F0EDE7]">
                <div className="bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm flex flex-col gap-1.5">
                  <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                    Jump to Step
                  </h4>
                  {steps.map((s, idx) => {
                    const isCurrent = idx === currentIdx;
                    const typeKey = s.stepType === "mcq-question" ? "mcq" : s.stepType;
                    const label =
                      s.stepType === "mcq-question"
                        ? `Q${(s.questionIndex ?? 0) + 1} — ${(
                            s.question?.questionText ?? "MCQ"
                          ).slice(0, 28)}…`
                        : TYPE_META[s.stepType]?.label ?? s.stepType;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[11px] font-bold transition-all border",
                          isCurrent
                            ? "bg-[#01696F] text-white border-transparent shadow-sm"
                            : "bg-zinc-50 text-zinc-600 border-zinc-100 hover:bg-zinc-100"
                        )}
                      >
                        <span
                          className={cn(
                            "w-5 h-5 rounded-full border text-[9px] flex items-center justify-center shrink-0 font-black",
                            isCurrent
                              ? "border-white/30 text-white/80"
                              : "border-zinc-300 text-zinc-400"
                          )}
                        >
                          {idx + 1}
                        </span>
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            typeKey === "mcq"
                              ? "bg-violet-400"
                              : typeKey === "canvas"
                              ? "bg-amber-400"
                              : "bg-sky-400"
                          )}
                        />
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
    </div>
  );
}
