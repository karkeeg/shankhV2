"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import {
  Loader2, ArrowLeft, ArrowRight, BookOpen,
  CheckCircle2, ChevronLeft, ChevronRight, Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export default function CaseReadingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const token = useAuthStore((s) => s.token);

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStudyIdx, setCurrentStudyIdx] = useState(0);
  const [marking, setMarking] = useState(false);

  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API}/api/v1/cases/${id}`, { headers }).then((r) => r.json()),
      fetch(`${API}/api/v1/cases/${id}/session`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" } }).then((r) => r.json()),
    ])
      .then(([detail, sessionRes]) => {
        const data = detail.data;
        setCaseData(data);
        // If the user has already read the studies, skip straight to the test
        if (sessionRes?.data?.studiesRead === true || data?.session?.studiesRead === true) {
          router.replace(`/case-simulations/${id}/test`);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleStartTest = async () => {
    if (!caseData) return;
    setMarking(true);
    try {
      await fetch(`${API}/api/v1/cases/${id}/session/mark-read`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
      });
      router.push(`/case-simulations/${id}/test`);
    } catch { } finally { setMarking(false); }
  };

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-9 h-9 animate-spin text-[#01696F]" />
      </div>
    </MainLayout>
  );

  if (!caseData) return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
        <BookOpen size={40} className="opacity-30" />
        <p className="font-semibold">Case not found.</p>
        <button onClick={() => router.push("/skill")} className="text-[#01696F] text-sm underline">Back to Skill Building</button>
      </div>
    </MainLayout>
  );

  const studies: any[] = caseData.caseStudies ?? [];
  const currentStudy = studies[currentStudyIdx];
  const isLast = currentStudyIdx === studies.length - 1;
  const allRead = currentStudyIdx >= studies.length - 1;

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-zinc-100 shrink-0">
          <button
            onClick={() => router.push("/skill")}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[#01696F] transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">Case Simulation</p>
            <h1 className="text-sm font-extrabold text-zinc-800 tracking-tight">{caseData.title}</h1>
          </div>
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border",
            caseData.difficulty === "easy" ? "bg-[#E6F0F1] text-[#01696F] border-[#01696F]/20"
              : caseData.difficulty === "medium" ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-red-50 text-red-700 border-red-200"
          )}>
            {caseData.difficulty}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row gap-0">

          {/* Left: study navigator */}
          <div className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-100 bg-white">
            <div className="p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                Case Studies · {studies.length}
              </p>
              <div className="space-y-2">
                {studies.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStudyIdx(idx)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                      idx === currentStudyIdx
                        ? "bg-[#01696F] text-white shadow-sm"
                        : idx < currentStudyIdx
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                    )}
                  >
                    {idx < currentStudyIdx ? (
                      <CheckCircle2 size={12} fill="currentColor" className="shrink-0" />
                    ) : (
                      <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0", idx === currentStudyIdx ? "bg-white/20" : "bg-zinc-200 text-zinc-500")}>
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: study content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {studies.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
                <BookOpen size={36} className="opacity-30" />
                <p className="text-sm font-semibold">No case studies added yet.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
                  <div className="mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60 mb-1">
                      Study {currentStudyIdx + 1} of {studies.length}
                    </p>
                    <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">{currentStudy?.title}</h2>
                  </div>
                  <div className="prose prose-sm max-w-none text-zinc-700 leading-relaxed font-medium whitespace-pre-line">
                    {currentStudy?.content}
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="shrink-0 border-t border-zinc-100 px-8 py-4 flex items-center justify-between gap-4 bg-white">
                  <button
                    onClick={() => setCurrentStudyIdx((p) => Math.max(0, p - 1))}
                    disabled={currentStudyIdx === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <div className="flex items-center gap-1.5">
                    {studies.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentStudyIdx(idx)}
                        className={cn("w-2 h-2 rounded-full transition-all", idx === currentStudyIdx ? "bg-[#01696F] w-5" : idx < currentStudyIdx ? "bg-emerald-400" : "bg-zinc-200")}
                      />
                    ))}
                  </div>

                  {isLast ? (
                    <button
                      onClick={handleStartTest}
                      disabled={marking || caseData.caseActivities?.length === 0}
                      className="flex items-center gap-2 px-5 py-2 bg-[#01696F] text-white rounded-xl text-xs font-black hover:bg-[#01696F]/90 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                    >
                      {marking ? <Loader2 size={13} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                      {caseData.caseActivities?.length === 0 ? "No activities yet" : "Start the Test"}
                      {!marking && <ArrowRight size={13} />}
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentStudyIdx((p) => Math.min(studies.length - 1, p + 1))}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#01696F] bg-[#E6F0F1] border border-[#01696F]/20 hover:bg-[#DFEAEA] transition-all active:scale-95"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
