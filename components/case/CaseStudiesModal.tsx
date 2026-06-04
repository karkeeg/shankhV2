"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface Study {
  id: string;
  title: string;
  content: string;
}

interface CaseStudiesModalProps {
  studies: Study[];
  caseTitle: string;
  isOpen: boolean;
  onClose: () => void;
  /** When provided, replaces "Close & Continue" on the last study with a "Start Activities" CTA */
  onStartActivities?: () => Promise<void>;
  /** Show loading skeleton while studies are being fetched */
  loading?: boolean;
}

export function CaseStudiesModal({ studies, caseTitle, isOpen, onClose, onStartActivities, loading }: CaseStudiesModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [starting, setStarting] = useState(false);

  // Reset to first study whenever modal opens
  useEffect(() => { if (isOpen) setCurrentIdx(0); }, [isOpen]);

  if (!isOpen) return null;

  // Loading state — studies not yet fetched
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-4 min-w-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#01696F]" />
          <p className="text-sm font-semibold text-zinc-500">Loading case studies…</p>
        </div>
      </div>
    );
  }

  const current = studies[currentIdx];
  const isLast = currentIdx === studies.length - 1;

  if (studies.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-4 text-zinc-400">
          <BookOpen size={36} className="opacity-30" />
          <p className="text-sm font-semibold">No case studies for this simulation.</p>
          <button onClick={onClose} className="px-5 py-2 text-xs font-black text-[#01696F] bg-[#E6F0F1] rounded-xl hover:bg-[#DFEAEA] transition-all">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 flex flex-col w-full max-w-5xl h-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E6F0F1] flex items-center justify-center shrink-0">
              <BookOpen size={15} className="text-[#01696F]" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#01696F]/60">Case Studies</p>
              <h2 className="text-sm font-extrabold text-zinc-800 tracking-tight leading-tight">{caseTitle}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-all active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

          {/* Left — study navigator */}
          <div className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-100 bg-[#FAFAF9]">
            <div className="p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                {studies.length} {studies.length === 1 ? "Study" : "Studies"}
              </p>
              <div className="space-y-1.5">
                {studies.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                      idx === currentIdx
                        ? "bg-[#01696F] text-white shadow-sm"
                        : idx < currentIdx
                          ? "bg-[#01696F]/10 text-[#01696F] border border-[#01696F]/20"
                          : "bg-white text-zinc-500 border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50"
                    )}
                  >
                    {idx < currentIdx ? (
                      <CheckCircle2 size={12} fill="currentColor" className="shrink-0" />
                    ) : (
                      <span className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0",
                        idx === currentIdx ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-400"
                      )}>
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — content */}    
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-3xl mx-auto w-full">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#01696F]/60 mb-1">
                Study {currentIdx + 1} of {studies.length}
              </p>
              <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight mb-5">{current?.title}</h3>
              <div className="text-sm text-zinc-700 leading-relaxed font-medium whitespace-pre-line">
                {current?.content}
              </div>
            </div>

            {/* Bottom nav */}
            <div className="shrink-0 border-t border-zinc-100 px-6 py-4 flex items-center justify-between gap-4 bg-white">
              <button
                onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <div className="flex items-center gap-1.5">
                {studies.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      idx === currentIdx ? "bg-[#01696F] w-5" : idx < currentIdx ? "bg-[#01696F]/40 w-2" : "bg-zinc-200 w-2"
                    )}
                  />
                ))}
              </div>

              {isLast ? (
                onStartActivities ? (
                  <button
                    onClick={async () => {
                      setStarting(true);
                      await onStartActivities();
                      setStarting(false);
                    }}
                    disabled={starting}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white bg-[#01696F] hover:bg-[#01696F]/90 disabled:opacity-60 transition-all active:scale-95 shadow-sm"
                  >
                    {starting ? <Loader2 size={13} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                    {starting ? "Starting…" : "Start Activities"}
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white bg-[#01696F] hover:bg-[#01696F]/90 transition-all active:scale-95 shadow-sm"
                  >
                    Close & Continue
                  </button>
                )
              ) : (
                <button
                  onClick={() => setCurrentIdx((p) => Math.min(studies.length - 1, p + 1))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#01696F] bg-[#E6F0F1] border border-[#01696F]/20 hover:bg-[#DFEAEA] transition-all active:scale-95"
                >
                  Next <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
