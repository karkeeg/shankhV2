"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/public/ShankhFull.png";
import {
  RefreshCw, ChevronLeft, ChevronRight,
  Lightbulb, CheckCircle2, X, ZoomIn, Undo, Redo, Printer,
  Bold, Italic, Strikethrough, Underline, ThumbsUp, ThumbsDown, Play,
  BookMarked, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { useAuthStore } from "@/lib/auth-store";
import { CanvasExercise } from "@/components/exercise/CanvasExercise";
import { ExcelGrid } from "@/components/exercise/ExcelGrid";
import { CanvasToolkit } from "@/components/exercise/CanvasToolkit";

const defaultCanvasElements = [
  {
    category: "Drivers & Inputs",
    items: [
      { id: "rev-acv", type: "rectangle" as const, label: "Average Contract Value (ACV)", content: "ACV: $12,500" },
      { id: "rev-win", type: "rectangle" as const, label: "New Logo Win Rate", content: "Win Rate: 24%" },
      { id: "rev-churn", type: "rectangle" as const, label: "Customer Churn Rate", content: "Churn: 8% p.a." },
    ],
  },
  {
    category: "Outputs & Statements",
    items: [
      { id: "stmt-is", type: "diamond" as const, label: "Income Statement", content: "Income Statement" },
      { id: "stmt-cf", type: "diamond" as const, label: "Cash Flow Statement", content: "Cash Flow Statement" },
      { id: "stmt-bs", type: "diamond" as const, label: "Balance Sheet", content: "Balance Sheet" },
    ],
  },
  {
    category: "Metrics & Calculations",
    items: [
      { id: "eq-gm", type: "equation" as const, label: "Gross Margin %", content: "Gross Margin = Gross Profit / Revenue" },
      { id: "eq-ebitda", type: "equation" as const, label: "EBITDA Summary", content: "EBITDA = EBIT + D&A" },
      { id: "eq-fcf", type: "equation" as const, label: "Free Cash Flow (FCF)", content: "FCF = Cash from Ops - CapEx" },
    ],
  },
];

export default function UnifiedActivityPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "les-1-1";

  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [activeLeftTab, setActiveLeftTab] = useState<"instructions" | "context">("instructions");
  const [aiCoachOpen, setAiCoachOpen] = useState(true);

  // MCQ selections state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  // Hints state
  const [hintsUnlocked, setHintsUnlocked] = useState<number>(1);

  // Grid values state
  const [spreadsheetGrid, setSpreadsheetGrid] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    setLoading(true);
    fetch(`${backendUrl}/api/v1/activities/${id}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch activity");
        return res.json();
      })
      .then((data) => {
        const actData = data.data || data;
        setActivity(actData);

        // Recover saved step index from localStorage if exists
        const savedIdx = localStorage.getItem(`currentStepIdx_${id}`);
        const initialIdx = savedIdx !== null ? parseInt(savedIdx, 10) : (actData?.startIndex ?? 0);
        setCurrentStepIdx(initialIdx);

        setHintsUnlocked(1);
        setSelectedOption(null);
      })
      .catch((err) => console.error("Error loading activity:", err))
      .finally(() => setLoading(false));
  }, [id, token]);

  // Persist step index on local step index change
  useEffect(() => {
    if (id && currentStepIdx !== undefined) {
      localStorage.setItem(`currentStepIdx_${id}`, String(currentStepIdx));
    }
  }, [id, currentStepIdx]);

  const step = activity?.steps?.[currentStepIdx];

  // Dynamically build 2D table matrix for ExcelGrid component
  const excelTable = React.useMemo(() => {
    if (!step?.gridRows || !step?.gridCols) return [];
    return step.gridRows.map((row: string) => {
      return step.gridCols.map((col: string) => {
        const cellKey = `${row}-${col}`;
        return step.gridValues?.[cellKey] || "";
      });
    });
  }, [step]);

  // Dynamically build inputs configuration array
  const excelInputs = React.useMemo(() => {
    if (!step?.gridRows || !step?.gridCols) return [];
    const list: any[] = [];
    step.gridRows.forEach((row: string, rIdx: number) => {
      step.gridCols.forEach((col: string, cIdx: number) => {
        const cellKey = `${row}-${col}`;
        const isHeaderColumn = cIdx === 0;
        if (!isHeaderColumn) {
          list.push({
            row: rIdx,
            col: cIdx,
            correctValue: step.correctAnswers?.[cellKey] || "",
            placeholder: "",
          });
        }
      });
    });
    return list;
  }, [step]);

  // Dynamically compute cell feedback mappings for correct/incorrect inputs
  const excelFeedback = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    if (feedback && step?.gridRows && step?.gridCols) {
      step.gridRows.forEach((row: string) => {
        step.gridCols.forEach((col: string) => {
          const cellKey = `${row}-${col}`;
          const userVal = spreadsheetGrid[cellKey]?.toString().trim() || "";
          const correctVal = step.correctAnswers?.[cellKey]?.toString().trim() || "";
          map[cellKey] = userVal === correctVal;
        });
      });
    }
    return map;
  }, [feedback, step, spreadsheetGrid]);

  // Group consecutive MCQ questions into 1 unified Activity index
  const logicalActivities: { type: string; stepIndices: number[] }[] = [];
  if (activity?.steps) {
    let mcqIndices: number[] = [];
    activity.steps.forEach((st: any, idx: number) => {
      if (st.type === "mcq") {
        mcqIndices.push(idx);
      } else {
        if (mcqIndices.length > 0) {
          logicalActivities.push({ type: "mcq", stepIndices: mcqIndices });
          mcqIndices = [];
        }
        logicalActivities.push({ type: st.type, stepIndices: [idx] });
      }
    });
    if (mcqIndices.length > 0) {
      logicalActivities.push({ type: "mcq", stepIndices: mcqIndices });
    }
  }

  const activeActivityIdx = logicalActivities.findIndex(act => act.stepIndices.includes(currentStepIdx));
  const activeActivity = logicalActivities[activeActivityIdx];
  const subIdx = activeActivity ? activeActivity.stepIndices.indexOf(currentStepIdx) + 1 : 1;
  const totalSub = activeActivity ? activeActivity.stepIndices.length : 1;

  // Sync values and show completion status when step changes
  useEffect(() => {
    if (!step) return;

    setSelectedOption(null);
    setFeedback(null);

    if (step.type === "quantus") {
      setSpreadsheetGrid(step.submittedGrid || step.gridValues || {});
      if (step.completed) {
        setFeedback({
          isError: false,
          message: "Activity Completed! You already filled this spreadsheet correctly.",
          metrics: {},
        });
      }
    } else if (step.type === "mcq") {
      if (step.submittedOptionId) {
        setSelectedOption(step.submittedOptionId);
      }
      if (step.completed) {
        setFeedback({
          isError: false,
          message: "Activity Completed! You already answered this question correctly.",
          metrics: {},
        });
      }
    } else if (step.type === "canvas") {
      if (step.submittedCanvasData) {
        setSpreadsheetGrid(step.submittedCanvasData);
      }
      if (step.completed) {
        setFeedback({
          isError: false,
          message: "Activity Completed! You already categorized this framework correctly.",
          metrics: {},
        });
      }
    }
  }, [step]);

  const handleCheckAnswer = async () => {
    if (!step) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    setSubmitting(true);
    setFeedback(null);

    const payload: any = { activityId: id };
    if (step.type === "mcq") {
      if (!selectedOption) {
        setFeedback({ isError: true, message: "Please select an option first!" });
        setSubmitting(false);
        return;
      }
      payload.answers = [{
        questionId: step.id || "",
        selectedOptionId: selectedOption,
      }];
    } else if (step.type === "quantus") {
      payload.cells = spreadsheetGrid;
    } else if (step.type === "canvas") {
      payload.canvasData = spreadsheetGrid;
    }

    try {
      const attemptRes = await fetch(`${backendUrl}/api/v1/attempts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ activityId: id }),
      });
      const attemptJson = await attemptRes.json();
      const newAttemptId = attemptJson?.data?.attemptId;
      if (!attemptRes.ok || !newAttemptId) {
        throw new Error(attemptJson?.error || "Unable to start attempt");
      }
      setAttemptId(newAttemptId);

      const submitRes = await fetch(`${backendUrl}/api/v1/attempts/${newAttemptId}/submit`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const submitJson = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(submitJson?.error || "Submission failed");
      }

      const resData = submitJson.data || {};
      const correct = resData.isCorrect !== false; // quantus and canvas default to true

      if (correct) {
        if (activity?.steps) {
          activity.steps[currentStepIdx].completed = true;
        }
        setFeedback({
          isError: false,
          message: "Excellent! Correct answer.",
          metrics: resData,
        });
      } else {
        setFeedback({
          isError: true,
          message: "Incorrect! Please try again.",
          metrics: resData,
        });
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ isError: true, message: err?.message || "Network error submitting results." });
    } finally {
      setSubmitting(false);
      setAiCoachOpen(true);
    }
  };

  const handleGridChange = (cellKey: string, val: string) => {
    setSpreadsheetGrid((prev) => ({ ...prev, [cellKey]: val }));
  };

  const unlockNextHint = () => {
    if (activity?.hints && hintsUnlocked < activity.hints.length) {
      setHintsUnlocked((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleNextStep = () => {
    if (activity?.steps && currentStepIdx < activity.steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };


  const handleClose = () => {
    if (activity?.moduleSlug) {
      router.push(`/learning/${activity.moduleSlug}`);
    } else {
      router.push("/learning/finance");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F0EDE7] text-[#01696F] gap-2">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-sm font-semibold">Loading financial model activity...</span>
      </div>
    );
  }

  if (!activity || !step) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F0EDE7] text-zinc-600 gap-4">
        <span className="font-semibold text-lg">Failed to load this learning activity.</span>
        <button onClick={() => router.push("/learning/finance")} className="px-4 py-2 bg-[#01696F] text-white rounded-xl shadow">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-white text-zinc-800 p-3 gap-3">

      {/* Left Panel */}
      <div className="w-64 flex flex-col justify-between h-full shrink-0 animate-slide-in">
        <div className="flex flex-col gap-4 overflow-y-auto flex-1 pb-4">
          {/* Brand Header & Back Button */}
          <div className="flex flex-col items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="w-full flex justify-center py-2">
              <Image src={logo} alt="Shankh Logo" width={120} height={35} className="object-contain" />
            </div>
            <button
              onClick={handleClose}
              className="w-36 py-1.5 bg-[#DFEAEA] text-[#01696F] hover:bg-[#D7E8E9] font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-[#01696F]/10"
            >
              ← Back to content
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex bg-[#F0EDE7] p-1.5 rounded-full w-full border border-zinc-200/50 shadow-sm shrink-0">
            <button
              onClick={() => setActiveLeftTab("instructions")}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-full transition-all duration-200 select-none",
                activeLeftTab === "instructions" ? "bg-[#28251D] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              Instructions
            </button>
            <button
              onClick={() => setActiveLeftTab("context")}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-full transition-all duration-200 select-none",
                activeLeftTab === "context" ? "bg-[#28251D] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              Context
            </button>
          </div>

          {/* Skin/Cream/Peach colored instruction card */}
          <div className="bg-[#FAF7F2] shadow-[0_2px_4px_0_#0000001F_inset] border border-[#F0EDE7] rounded-2xl p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200/50 pb-2">
              <h3 className="font-extrabold text-zinc-900 text-sm leading-tight tracking-tight">{activity.title}</h3>
              <DifficultyBadge difficulty={activity.difficulty} />
            </div>

            {activeLeftTab === "instructions" ? (
              /* Instruction Part */
              <div className="flex flex-col gap-1 animate-fade-in">
                <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70">
                  Instructions
                </span>
                <div className="text-xs text-zinc-700 leading-relaxed font-semibold whitespace-pre-line">
                  {step.instructions}
                </div>
              </div>
            ) : (
              /* Context Part */
              step.contextText && (
                <div className="flex flex-col gap-1 animate-fade-in">
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70">
                    Context & Scenario
                  </span>
                  <div className="text-xs text-zinc-600 leading-relaxed font-medium whitespace-pre-line">
                    {step.contextText}
                  </div>
                </div>
              )
            )}

            {step.type === "canvas" && (
              <CanvasToolkit draggableElements={step.draggableElements || defaultCanvasElements} />
            )}
          </div>


        </div>

        {/* Andrew Smith Profile Card */}
        <div className="bg-[#DFEAEA] border border-[#01696F]/10 rounded-2xl p-3 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#01696F] font-bold shadow-sm shrink-0 border border-zinc-200">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-zinc-800 truncate">Andrew Smith</p>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Free Plan</p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 justify-end">
              <ThumbsUp size={10} /> 4 <ThumbsDown size={10} /> 2
            </div>
            <p className="text-[9px] text-[#01696F] font-extrabold uppercase tracking-tight mt-0.5">53.47% Success</p>
          </div>
        </div>
      </div>

      {/* Middle Workspace */}
      <div className="flex-1 flex flex-col bg-[#F0EDE7] shadow-[0px_4px_8px_0px_#0000003D_inset] border border-[#F0EDE7] rounded-2xl overflow-hidden h-full">

        {/* Toolbar */}
        <div className="flex items-center justify-between p-3.5 border-b border-zinc-200 bg-[#F0EDE7]/40 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (step.type === "quantus") {
                  setSpreadsheetGrid(step.gridValues || {});
                } else if (step.type === "mcq") {
                  setSelectedOption(null);
                } else if (step.type === "canvas") {
                  setSpreadsheetGrid({});
                }
                setFeedback(null);
              }}
              className="px-3.5 py-1.5 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw size={12} className="text-zinc-500" /> Reset
            </button>
            <button
              onClick={handlePrevStep}
              disabled={currentStepIdx === 0}
              className="px-3.5 py-1.5 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95"
            >
              ⟨ Previous
            </button>

            <div className="shrink-0">
              <span className="text-[14px] font-semibold text-[#01696F] uppercase bg-[#E6F0F1] px-3.5 py-1.5 rounded-xl shadow-sm border border-[#01696F]/10 select-none">
                {step.type === "mcq" && `MCQ (Question ${subIdx} of ${totalSub})`}
                {step.type === "quantus" && `Quant Lab`}
                {step.type === "canvas" && `Framework`}
              </span>
            </div>

            <button
              onClick={handleNextStep}
              disabled={activity?.steps && currentStepIdx === activity.steps.length - 1}
              className="px-3.5 py-1.5 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95"
            >
              Next ⟩
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={unlockNextHint}
              className="px-3 py-1.5 text-[#01696F] hover:text-[#01696F]/80 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Lightbulb size={14} className="text-[#01696F]" fill="currentColor" /> Hint
            </button>
            <button
              onClick={handleCheckAnswer}
              disabled={submitting}
              className="px-4 py-2 bg-[#00A389] text-white hover:bg-[#00A389]/90 disabled:opacity-50 font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...
                </>
              ) : "Check Answer"}
            </button>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full border border-zinc-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center bg-white shadow-sm transition-all active:scale-90"
            >
              <X size={14} className="stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Inner Question Area */}
        <div className="flex-1 overflow-auto flex flex-col animate-fade-in">

          {step.type === "quantus" ? (
            /* Spreadsheet view using modular ExcelGrid component */
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
              <ExcelGrid
                table={excelTable}
                inputs={excelInputs}
                userInputs={spreadsheetGrid}
                setUserInputs={setSpreadsheetGrid}
                isValidated={feedback !== null}
                feedback={excelFeedback}
                sheetTabName="Model assumptions"
                showToolbar={true}
                colLabels={step.gridCols}
                rowLabels={step.gridRows}
              />
            </div>
          ) : step.type === "canvas" ? (
            /* Canvas/Flowchart view */
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
              <CanvasExercise
                canvasBackgroundText={step.questionText || "Flowchart Editor"}
              />
            </div>
          ) : (
            /* MCQ view */
            <div className="flex-1 flex flex-col p-10 justify-center max-w-4xl mx-auto space-y-10 animate-fade-in bg-zinc-50/20 w-full h-full rounded-2xl">
              <h2 className="text-xl font-extrabold text-zinc-900 leading-snug tracking-tight max-w-3xl">
                {step.questionText}
              </h2>

              <div className="space-y-4 max-w-3xl">
                {step.options?.map((opt: any) => {
                  const isSelected = selectedOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOption(opt.id)}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-sm active:scale-[0.99] group",
                        isSelected
                          ? "bg-[#01696F] border-transparent text-white font-bold"
                          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 text-zinc-700 bg-white"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-sm transition-all duration-200",
                            isSelected
                              ? "bg-white text-[#01696F]"
                              : "bg-white border border-zinc-200 text-zinc-700 group-hover:border-zinc-300"
                          )}
                        >
                          {opt.id}
                        </span>
                        <span className="text-sm font-semibold tracking-tight">{opt.label}</span>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#01696F] shrink-0 shadow-sm animate-scale-in">
                          <CheckCircle2 size={18} className="text-[#01696F]" fill="currentColor" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Right AI Coach Sidebar */}
      {aiCoachOpen ? (
        <div className="w-[300px] flex flex-col gap-3 h-full shrink-0 animate-slide-in">

          {/* Hints Card Container */}
          <div className="bg-white p-2 flex flex-col h-full flex-1 overflow-hidden">
            <div className="flex items-center border-b border-zinc-400 justify-between pb-3 mb-4 shrink-0">
              <h3 className="font-bold text-zinc-800 text-2xl flex items-center gap-2">
                AI Coach
              </h3>
              <button onClick={() => setAiCoachOpen(false)} className="p-1 hover:bg-zinc-100 rounded text-zinc-400">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 bg-[#F0EDE7] rounded-2xl p-4 shadow-[inset_0px_2px_4px_rgba(0,0,0,0.02)]">
              {/* Dynamic feedback card displayed directly inside the AI Coach sidebar */}
              {feedback && (
                <div className={cn(
                  "p-3.5 border rounded-2xl mb-4 animate-fade-in flex flex-col gap-2 relative shadow-sm shrink-0",
                  feedback.isError
                    ? "bg-rose-50 border-rose-100 text-rose-800"
                    : "bg-emerald-50 border-emerald-100 text-emerald-800"
                )}>
                  <button
                    onClick={() => setFeedback(null)}
                    className="absolute top-2 right-2 p-0.5 hover:bg-black/5 rounded text-zinc-500 hover:text-zinc-700"
                  >
                    <X size={14} />
                  </button>
                  <p className="text-xs font-bold leading-relaxed pr-4">{feedback.message}</p>
                  {feedback.metrics && (
                    <div className="flex flex-col gap-1 text-[10px] font-extrabold uppercase tracking-wide opacity-90 border-t border-black/5 pt-1.5 mt-0.5">
                      <span>Accuracy: {Math.round(feedback.metrics.conceptAccuracy)}%</span>
                      <span>Recall: {Math.round(feedback.metrics.recallStrength)}%</span>
                      <span>Application: {Math.round(feedback.metrics.applicationScore)}%</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                {activity.hints?.slice(0, hintsUnlocked).map((hint: string, idx: number) => (
                  <div
                    key={idx}
                    className="bg-[#E6F0F1] border border-[#01696F]/10 rounded-2xl p-3 text-xs font-semibold text-[#01696F] leading-relaxed shadow-sm relative group animate-fade-in"
                  >
                    {hint}
                  </div>
                ))}

                {activity?.hints && hintsUnlocked < activity.hints.length && (
                  <button
                    onClick={unlockNextHint}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#01696F]/30 hover:bg-[#E6F0F1]/20 text-[#01696F] text-xs font-bold rounded-2xl transition-all active:scale-95 animate-pulse"
                  >
                    <Lightbulb size={14} className="text-amber-500" /> Reveal next hint
                  </button>
                )}
              </div>

              {/* Case Notes footer */}
              <div className="pt-4 border-t border-zinc-100 shrink-0 space-y-2 bg-[#FDFCFA] rounded-xl p-3 border border-zinc-100 shadow-[inset_0px_2px_4px_rgba(0,0,0,0.02)]">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Case Notes</h4>
                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                  {activity.caseNotes}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAiCoachOpen(true)}
          className="w-12 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-2xl h-full flex flex-col items-center justify-center gap-4 shadow-sm shrink-0 transition-all duration-200 group active:scale-95 animate-slide-out"
        >
          <span className="text-[10px] font-bold text-[#01696F] uppercase tracking-widest [writing-mode:vertical-lr] transform rotate-180">
            Open AI Coach
          </span>
          <Lightbulb size={16} className="text-[#01696F] animate-pulse" fill="currentColor" />
        </button>
      )}

    </div>
  );
}
