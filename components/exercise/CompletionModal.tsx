import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, BookOpen, Layers, BarChart3 } from "lucide-react";
import { Button } from "../ui/Button";

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onBackToPlan: () => void;
  title: string;
  isLastInTopic?: boolean;
  onGoToSheets?: () => void;
  onGoToMCQ?: () => void;
  onGoToCanvas?: () => void;
}

export const CompletionModal = ({
  isOpen,
  onClose,
  onNext,
  onBackToPlan,
  title,
  isLastInTopic = false,
  onGoToSheets,
  onGoToMCQ,
  onGoToCanvas,
}: CompletionModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-white rounded-[24px] shadow-2xl overflow-hidden border border-zinc-200"
          >
            {/* ── Success Header ── */}
            <div className="px-6 pt-6 pb-4 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100"
              >
                <CheckCircle2 size={32} className="text-emerald-500" />
              </motion.div>
              
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-1">Success!</h2>
              <p className="text-xs text-zinc-500 font-medium leading-tight">
                Completed: <span className="text-zinc-900 font-bold">{title}</span>
              </p>
            </div>
            
            <div className="px-6 pb-6 space-y-5">
              {/* ── XP & Stats ── */}
              <div className="flex items-center justify-center gap-3">
                <div className="px-3 py-1.5 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">+100 XP</span>
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">+5% Mastery</span>
                </div>
              </div>

              {/* ── Primary Action ── */}
              <Button 
                onClick={onNext}
                className="w-full h-12 bg-zinc-900 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-[0.98]"
              >
                {isLastInTopic ? "Next Topic" : "Next Exercise"}
                <ArrowRight size={16} />
              </Button>

              {/* ── Navigation Grid ── */}
              <div className="space-y-4">
                 {/* Secondary Jump Options */}
                 {isLastInTopic && (onGoToMCQ || onGoToSheets || onGoToCanvas) && (
                   <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Switch Stage</p>
                      <div className="grid grid-cols-3 gap-2">
                        {onGoToMCQ && (
                          <button onClick={onGoToMCQ} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-100 transition-colors group">
                            <BookOpen size={16} className="text-zinc-400 group-hover:text-zinc-900" />
                            <span className="text-[9px] font-bold text-zinc-600">MCQ</span>
                          </button>
                        )}
                        {onGoToSheets && (
                          <button onClick={onGoToSheets} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-100 transition-colors group">
                            <BarChart3 size={16} className="text-zinc-400 group-hover:text-zinc-900" />
                            <span className="text-[9px] font-bold text-zinc-600">Sheet</span>
                          </button>
                        )}
                        {onGoToCanvas && (
                          <button onClick={onGoToCanvas} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-100 transition-colors group">
                            <Layers size={16} className="text-zinc-400 group-hover:text-zinc-900" />
                            <span className="text-[9px] font-bold text-zinc-600">Canvas</span>
                          </button>
                        )}
                      </div>
                   </div>
                 )}

                 <div className="flex gap-2 pt-2 border-t border-zinc-100">
                   <Button 
                      variant="outline"
                      onClick={onBackToPlan}
                      className="flex-1 h-9 rounded-xl font-bold border-zinc-200 text-zinc-500 hover:text-zinc-900 text-[10px] uppercase tracking-widest"
                    >
                      Plan
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = '/dashboard'}
                      className="flex-1 h-9 rounded-xl font-bold border-zinc-200 text-zinc-500 hover:text-zinc-900 text-[10px] uppercase tracking-widest"
                    >
                      Exit
                    </Button>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
