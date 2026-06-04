"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2, Plus, Trash2, ArrowLeft, Save, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminCanvasEditor, AdminCanvasData } from "@/components/admin/AdminCanvasEditor";
import { QuantusActivityBuilder, QuantusActivityData } from "@/components/admin/QuantusActivityBuilder";

const uuidv4 = () => crypto.randomUUID();

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// ─── MCQ Builder ──────────────────────────────────────────────────────────────

function McqBuilder({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const addQuestion = () =>
    onChange({ ...value, questions: [...(value.questions ?? []), { id: uuidv4(), questionText: "", explanation: "", options: [{ id: uuidv4(), optionText: "", isCorrect: true }, { id: uuidv4(), optionText: "", isCorrect: false }] }] });

  const removeQuestion = (qi: number) =>
    onChange({ ...value, questions: (value.questions ?? []).filter((_: any, i: number) => i !== qi) });

  const updateQuestion = (qi: number, field: string, val: string) => {
    const qs = [...(value.questions ?? [])];
    qs[qi] = { ...qs[qi], [field]: val };
    onChange({ ...value, questions: qs });
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
    // If setting isCorrect, unset all others
    if (field === "isCorrect" && val) opts.forEach((o, i) => { if (i !== oi) opts[i] = { ...o, isCorrect: false }; });
    qs[qi] = { ...qs[qi], options: opts };
    onChange({ ...value, questions: qs });
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
        <button onClick={addQuestion} className="flex items-center gap-1.5 text-xs font-black text-[#01696F] hover:text-[#01696F]/80 transition-colors w-fit">
          <Plus size={13} /> Add Question
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-800 bg-white placeholder:text-zinc-400 outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 w-full";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={cn(cls, "resize-none")} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />}
    </div>
  );
}

// ─── Activity form ────────────────────────────────────────────────────────────

const DEFAULT_CANVAS: AdminCanvasData = {
  title: "", instructions: "", context: "",
  scoringMode: "partial",
  paletteItems: [], solutionSnapshot: null,
};
const DEFAULT_QUANTUS: QuantusActivityData = {
  title: "", instructions: "", context: "",
  gridRows: [], gridCols: [], gridValues: {}, correctAnswers: {},
};
const DEFAULT_MCQ = { instructions: "", context: "", questions: [] };

function ActivityForm({ onSave, onCancel }: { onSave: (type: string, data: any, order: number) => void; onCancel: () => void }) {
  const [type, setType] = useState<"mcq" | "canvas" | "quantus">("mcq");
  const [order, setOrder] = useState(0);
  const [mcqData, setMcqData] = useState<any>({ ...DEFAULT_MCQ });
  const [canvasData, setCanvasData] = useState<AdminCanvasData>({ ...DEFAULT_CANVAS });
  const [quantusData, setQuantusData] = useState<QuantusActivityData>({ ...DEFAULT_QUANTUS });

  const handleTypeChange = (t: "mcq" | "canvas" | "quantus") => setType(t);

  const currentData = type === "mcq" ? mcqData : type === "canvas" ? canvasData : quantusData;

  return (
    <div className="border border-[#01696F]/20 rounded-2xl p-5 bg-[#FAFFFE] flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-extrabold text-zinc-800">New Activity</span>
        <button onClick={onCancel} className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors">Cancel</button>
      </div>

      {/* Type + order */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-white border border-zinc-200 p-1 rounded-xl">
          {(["mcq", "canvas", "quantus"] as const).map((t) => (
            <button key={t} onClick={() => handleTypeChange(t)}
              className={cn("px-4 py-1.5 rounded-lg text-[11px] font-black capitalize transition-all",
                type === t ? "bg-[#01696F] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}>
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

      {/* Builder */}
      {type === "mcq" && <McqBuilder value={mcqData} onChange={setMcqData} />}
      {type === "canvas" && <AdminCanvasEditor value={canvasData} onChange={setCanvasData} />}
      {type === "quantus" && <QuantusActivityBuilder value={quantusData} onChange={setQuantusData} />}

      {/* Save */}
      <div className="flex justify-end pt-2 border-t border-zinc-100">
        <button
          onClick={() => onSave(type, currentData, order)}
          className="px-6 py-2.5 bg-[#01696F] text-white text-xs font-black rounded-xl hover:bg-[#01696F]/90 flex items-center gap-2 active:scale-95 shadow-sm"
        >
          <Save size={13} /> Save Activity
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminCaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const token = useAuthStore((s) => s.token);
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"studies" | "activities">("studies");

  // Studies state
  const [showStudyForm, setShowStudyForm] = useState(false);
  const [studyForm, setStudyForm] = useState({ title: "", content: "", orderIndex: 0 });
  const [savingStudy, setSavingStudy] = useState(false);

  // Activity state
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [savingActivity, setSavingActivity] = useState(false);

  const load = useCallback(() => {
    fetch(`${API}/api/v1/cases/admin/${id}`, { headers })
      .then((r) => r.json())
      .then((res) => setCaseData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token]);

  useEffect(() => { load(); }, [load]);

  const handleAddStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStudy(true);
    try {
      await fetch(`${API}/api/v1/cases/admin/${id}/studies`, { method: "POST", headers, body: JSON.stringify(studyForm) });
      setStudyForm({ title: "", content: "", orderIndex: 0 });
      setShowStudyForm(false);
      load();
    } finally { setSavingStudy(false); }
  };

  const handleDeleteStudy = async (studyId: string) => {
    if (!confirm("Delete this case study?")) return;
    await fetch(`${API}/api/v1/cases/admin/${id}/studies/${studyId}`, { method: "DELETE", headers });
    load();
  };

  const handleSaveActivity = async (type: string, data: any, order: number) => {
    setSavingActivity(true);
    try {
      await fetch(`${API}/api/v1/cases/admin/${id}/activities`, {
        method: "POST", headers,
        body: JSON.stringify({ activityType: type, activityData: data, orderIndex: order }),
      });
      setShowActivityForm(false);
      load();
    } finally { setSavingActivity(false); }
  };

  const handleDeleteActivity = async (actId: string) => {
    if (!confirm("Delete this activity?")) return;
    await fetch(`${API}/api/v1/cases/admin/${id}/activities/${actId}`, { method: "DELETE", headers });
    load();
  };

  if (loading) return <MainLayout><div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-[#01696F]" /></div></MainLayout>;
  if (!caseData) return <MainLayout><div className="flex items-center justify-center h-full text-zinc-500 font-semibold">Not found.</div></MainLayout>;

  const studies: any[] = caseData.caseStudies ?? [];
  const activities: any[] = caseData.caseActivities ?? [];

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-6 max-h-[calc(100vh-24px)] overflow-y-auto">

        {/* Header */}
        <header className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/cases")} className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[#01696F] transition-colors">
            <ArrowLeft size={14} /> Cases
          </button>
          <div className="h-4 w-px bg-zinc-200" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-zinc-800 truncate">{caseData.title}</h1>
            <p className="text-[10px] text-zinc-400 font-semibold">{caseData.isPublished ? "Published" : "Draft"} · {caseData.difficulty}</p>
          </div>
          <button
            onClick={() => router.push(`/admin/cases/${id}/preview`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black rounded-xl hover:bg-amber-100 transition-colors active:scale-95 shrink-0"
          >
            <Eye size={13} /> Preview
          </button>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-zinc-200 p-1.5 rounded-2xl w-fit shadow-sm">
          {(["studies", "activities"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={cn("px-5 py-2 rounded-xl text-xs font-extrabold capitalize transition-all", activeTab === t ? "bg-[#01696F] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
              {t} {t === "studies" ? `(${studies.length})` : `(${activities.length})`}
            </button>
          ))}
        </div>

        {/* Studies tab */}
        {activeTab === "studies" && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <button onClick={() => setShowStudyForm((v) => !v)} className="flex items-center gap-1.5 px-4 py-2 bg-[#01696F] text-white text-xs font-black rounded-xl hover:bg-[#01696F]/90 active:scale-95">
                <Plus size={13} /> Add Study
              </button>
            </div>

            {showStudyForm && (
              <form onSubmit={handleAddStudy} className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-700">New Case Study</h3>
                <Field label="Title *" value={studyForm.title} onChange={(v) => setStudyForm((f) => ({ ...f, title: v }))} />
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

            {studies.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 font-semibold text-sm">No case studies yet. Add one above.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {studies.map((s, idx) => (
                  <div key={s.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#E6F0F1] text-[#01696F] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-zinc-800">{s.title}</p>
                      <p className="text-[11px] text-zinc-500 font-medium mt-1 line-clamp-3 whitespace-pre-line">{s.content}</p>
                    </div>
                    <button onClick={() => handleDeleteStudy(s.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activities tab */}
        {activeTab === "activities" && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <button onClick={() => setShowActivityForm((v) => !v)} className="flex items-center gap-1.5 px-4 py-2 bg-[#01696F] text-white text-xs font-black rounded-xl hover:bg-[#01696F]/90 active:scale-95">
                <Plus size={13} /> Add Activity
              </button>
            </div>

            {showActivityForm && <ActivityForm onSave={handleSaveActivity} onCancel={() => setShowActivityForm(false)} />}

            {activities.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 font-semibold text-sm">No activities yet. Add one above.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {activities.map((a, idx) => {
                  const d = a.activityData ?? {};
                  const TYPE_COLORS: Record<string, string> = { mcq: "bg-violet-50 text-violet-700 border-violet-200", canvas: "bg-amber-50 text-amber-700 border-amber-200", quantus: "bg-sky-50 text-sky-700 border-sky-200" };
                  return (
                    <div key={a.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest", TYPE_COLORS[a.activityType] ?? "")}>{a.activityType}</span>
                        </div>
                        <p className="text-xs text-zinc-600 font-medium line-clamp-2">{d.instructions || d.title || "No description"}</p>
                        {a.activityType === "mcq" && <p className="text-[10px] text-zinc-400 font-semibold mt-1">{(d.questions ?? []).length} question{(d.questions ?? []).length !== 1 ? "s" : ""}</p>}
                      </div>
                      <button onClick={() => handleDeleteActivity(a.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
