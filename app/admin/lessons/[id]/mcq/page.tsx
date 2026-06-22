"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { api } from "@/lib/api";
import { useToastStore } from "@/lib/toast-store";
import {
  ArrowLeft, Save, Loader2, Plus, Trash2,
  ChevronDown, ChevronUp, GripVertical, FileQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface McqOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
}

interface McqQuestion {
  id: string;
  questionText: string;
  explanation: string;
  options: McqOption[];
  collapsed: boolean;
}

function makeOption(isCorrect = false): McqOption {
  return { id: crypto.randomUUID(), optionText: "", isCorrect };
}

function makeQuestion(): McqQuestion {
  return {
    id: crypto.randomUUID(),
    questionText: "",
    explanation: "",
    collapsed: false,
    options: [
      makeOption(true),
      makeOption(),
      makeOption(),
      makeOption(),
    ],
  };
}

// ── Question card ─────────────────────────────────────────────────────────────

function QuestionCard({
  q,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  q: McqQuestion;
  index: number;
  total: number;
  onChange: (q: McqQuestion) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const setField = <K extends keyof McqQuestion>(key: K, val: McqQuestion[K]) =>
    onChange({ ...q, [key]: val });

  const setOption = (i: number, patch: Partial<McqOption>) => {
    const next = q.options.map((o, oi) => oi === i ? { ...o, ...patch } : o);
    onChange({ ...q, options: next });
  };

  const setCorrect = (i: number) =>
    onChange({ ...q, options: q.options.map((o, oi) => ({ ...o, isCorrect: oi === i })) });

  const addOption = () =>
    onChange({ ...q, options: [...q.options, makeOption()] });

  const removeOption = (i: number) =>
    onChange({ ...q, options: q.options.filter((_, oi) => oi !== i) });

  const hasCorrect = q.options.some((o) => o.isCorrect);

  return (
    <div className={cn(
      "bg-white border rounded-3xl overflow-hidden shadow-sm transition-all",
      q.collapsed ? "border-zinc-200" : "border-[#01696F]/30"
    )}>
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none"
        onClick={() => setField("collapsed", !q.collapsed)}
      >
        <div className="text-zinc-300 cursor-grab shrink-0">
          <GripVertical size={14} />
        </div>
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0">
          Q{index + 1}
        </span>
        <p className={cn(
          "flex-1 text-xs font-semibold truncate",
          q.questionText ? "text-zinc-700" : "text-zinc-400"
        )}>
          {q.questionText || "Untitled question"}
        </p>

        {/* Validity indicator */}
        {!q.collapsed && (
          <span className={cn(
            "text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0",
            hasCorrect
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-rose-50 text-rose-400 border-rose-100"
          )}>
            {hasCorrect ? "✓ answer set" : "! no answer"}
          </span>
        )}

        {/* Move / remove */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onMoveUp} disabled={index === 0}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-300 hover:text-zinc-600 disabled:opacity-20 transition-all">
            <ChevronUp size={12} />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-300 hover:text-zinc-600 disabled:opacity-20 transition-all">
            <ChevronDown size={12} />
          </button>
          <button onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-rose-50 text-zinc-300 hover:text-rose-500 transition-all">
            <Trash2 size={12} />
          </button>
        </div>

        <div className="text-zinc-300 shrink-0">
          {q.collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {/* Expanded body */}
      {!q.collapsed && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-zinc-100">

          {/* Question text */}
          <div className="flex flex-col gap-1.5 pt-4">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Question</label>
            <textarea
              value={q.questionText}
              onChange={(e) => setField("questionText", e.target.value)}
              rows={2}
              placeholder="Enter the question text..."
              className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-[#01696F] resize-none w-full"
            />
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                Options <span className="font-normal text-zinc-300 normal-case">(click radio to mark correct)</span>
              </label>
              <button
                onClick={addOption}
                className="flex items-center gap-1 text-[10px] font-bold text-[#01696F] hover:text-[#014f54]"
              >
                <Plus size={10} /> Add option
              </button>
            </div>
            {q.options.map((opt, oi) => (
              <div key={opt.id} className={cn(
                "flex items-center gap-2 rounded-2xl px-3 py-2 border transition-all",
                opt.isCorrect
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-zinc-50 border-zinc-200"
              )}>
                <button
                  onClick={() => setCorrect(oi)}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                    opt.isCorrect ? "border-emerald-500 bg-emerald-500" : "border-zinc-300 hover:border-[#01696F]"
                  )}
                >
                  {opt.isCorrect && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </button>
                <input
                  value={opt.optionText}
                  onChange={(e) => setOption(oi, { optionText: e.target.value })}
                  placeholder={`Option ${oi + 1}`}
                  className={cn(
                    "flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-400",
                    opt.isCorrect ? "text-emerald-700 font-semibold" : "text-zinc-700"
                  )}
                />
                <button
                  onClick={() => removeOption(oi)}
                  disabled={q.options.length <= 2}
                  className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-rose-100 text-zinc-300 hover:text-rose-500 disabled:opacity-20 transition-all shrink-0"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
              Explanation <span className="font-normal text-zinc-300 normal-case">(shown after answering)</span>
            </label>
            <textarea
              value={q.explanation}
              onChange={(e) => setField("explanation", e.target.value)}
              rows={2}
              placeholder="Explain why the correct answer is right..."
              className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-[#01696F] resize-none w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function McqAdminPage() {
  const params = useParams();
  const lessonId = params.id as string;
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [context, setContext] = useState("");
  const [questions, setQuestions] = useState<McqQuestion[]>([makeQuestion()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<any>(`/api/v1/admin/lessons/${lessonId}`)
      .then((data) => {
        const a = data?.mcqActivity;
        if (a) {
          setTitle(a.title || "");
          setInstructions(a.instructions || "");
          setContext(a.context || "");
          setQuestions(
            (a.questions || []).map((q: any) => ({
              id: q.id || crypto.randomUUID(),
              questionText: q.questionText || "",
              explanation: q.explanation || "",
              collapsed: false,
              options: (q.options || []).map((o: any) => ({
                id: o.id || crypto.randomUUID(),
                optionText: o.optionText || "",
                isCorrect: !!o.isCorrect,
              })),
            }))
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lessonId]);

  const updateQuestion = useCallback((i: number, q: McqQuestion) => {
    setQuestions((prev) => prev.map((old, oi) => oi === i ? q : old));
  }, []);

  const removeQuestion = useCallback((i: number) => {
    setQuestions((prev) => prev.filter((_, oi) => oi !== i));
  }, []);

  const moveQuestion = useCallback((i: number, dir: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, makeQuestion()]);
    setTimeout(() => {
      document.getElementById("q-list-bottom")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const handleSave = async () => {
    if (!instructions.trim()) {
      showToast("Instructions are required", "error");
      return;
    }
    if (questions.length === 0) {
      showToast("Add at least one question", "error");
      return;
    }
    const missingAnswer = questions.findIndex((q) => !q.options.some((o) => o.isCorrect));
    if (missingAnswer !== -1) {
      showToast(`Question ${missingAnswer + 1} has no correct answer marked`, "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        instructions,
        context,
        questions: questions.map((q, qi) => ({
          question_text: q.questionText,
          explanation: q.explanation,
          order_index: qi,
          options: q.options.map((o, oi) => ({
            option_text: o.optionText,
            is_correct: o.isCorrect,
            order_index: oi,
          })),
        })),
      };
      await api.post(`/api/v1/admin/lessons/${lessonId}/mcq`, payload);
      showToast("MCQ activity saved!", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to save", "error");
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
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#DFEAEA] text-[#01696F] border border-[#01696F]/15 rounded-full text-[10px] font-black shrink-0">
            <FileQuestion size={11} /> MCQ Quiz
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quiz title (optional)"
            className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium outline-none w-44 focus:bg-white focus:border-[#01696F]"
          />
          <input
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Instructions for students *"
            className="flex-1 min-w-[180px] px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:bg-white focus:border-[#01696F]"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[#01696F] hover:bg-[#014f54] text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-40 ml-auto shrink-0 transition-all active:scale-95"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? "Saving..." : "Save MCQ"}
          </button>
        </div>

        {/* ── Context sub-bar ── */}
        <div className="flex items-center gap-3 px-5 py-2 bg-white border-b border-zinc-100 shrink-0">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 shrink-0">Context / Scenario</span>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Optional background text shown above the questions..."
            className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:bg-white focus:border-[#01696F]"
          />
        </div>

        {/* ── Question list ── */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

          {/* Stats strip */}
          <div className="flex items-center gap-4 px-4 py-2.5 bg-white border border-zinc-200 rounded-2xl shrink-0">
            <span className="text-[10px] font-black text-[#01696F] uppercase tracking-wider">
              {questions.length} Question{questions.length !== 1 ? "s" : ""}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">
              {questions.filter((q) => q.options.some((o) => o.isCorrect)).length} with answers set
            </span>
            <button
              onClick={() => setQuestions((prev) => prev.map((q) => ({ ...q, collapsed: true })))}
              className="ml-auto text-[10px] font-bold text-zinc-400 hover:text-zinc-600"
            >
              Collapse all
            </button>
            <button
              onClick={() => setQuestions((prev) => prev.map((q) => ({ ...q, collapsed: false })))}
              className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600"
            >
              Expand all
            </button>
          </div>

          {questions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="p-4 bg-[#DFEAEA] rounded-2xl text-[#01696F]">
                <FileQuestion size={28} />
              </div>
              <p className="text-sm font-extrabold text-zinc-600">No questions yet</p>
              <p className="text-xs text-zinc-400">Click "Add Question" to get started.</p>
            </div>
          )}

          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={i}
              total={questions.length}
              onChange={(updated) => updateQuestion(i, updated)}
              onRemove={() => removeQuestion(i)}
              onMoveUp={() => moveQuestion(i, -1)}
              onMoveDown={() => moveQuestion(i, 1)}
            />
          ))}

          {/* Add question button */}
          <div id="q-list-bottom">
            <button
              onClick={addQuestion}
              className="w-full py-3.5 border-2 border-dashed border-[#01696F]/30 hover:border-[#01696F] bg-white hover:bg-[#DFEAEA]/50 rounded-3xl text-xs font-bold text-[#01696F] hover:text-[#014f54] flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={14} /> Add Question
            </button>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
