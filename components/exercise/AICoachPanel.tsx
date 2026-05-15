import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AICoachPanelProps {
  onClose?: () => void;
  message?: {
    type: 'hint' | 'correct' | 'incorrect' | 'warning' | 'info';
    content: string;
  };
  notes?: string;
  activityType?: string;
}

export const AICoachPanel = ({ onClose, message, notes, activityType }: AICoachPanelProps) => {
  return (
    <div className="flex flex-col h-full bg-white border-l border-zinc-100">
      {/* Header */}
      <div className="px-8 flex items-center justify-between border-b border-zinc-50 shrink-0 h-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E6F0F1] flex items-center justify-center text-[#01696F]">
            <Sparkles size={20} />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-[#1a1a1a]">AI Coach</h2>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:text-[#01696F] hover:bg-[#E6F0F1] transition-all"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-8 custom-scrollbar">
        {/* Chat / Hint Section */}
        {message && (
          <div className="space-y-4">
            <h3 className="px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {message.type === 'hint' ? 'Instruction / Hint' : 'Feedback'}
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className={cn(
                "p-6 rounded-[2rem] rounded-tl-lg text-sm font-medium shadow-sm leading-relaxed relative border",
                message.type === 'correct' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                message.type === 'incorrect' || message.type === 'warning' ? "bg-rose-50 border-rose-100 text-rose-700" :
                message.type === 'hint' ? "bg-[#E6F0F1] border-[#01696F]/10 text-[#01696F]" :
                "bg-blue-50 border-blue-100 text-blue-700"
              )}>
                {message.content}
              </div>
            </div>
          </div>
        )}

        {/* Case Notes */}
        {notes && (
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-[#01696F]/5 border border-zinc-100">
            <h3 className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 mb-4">Case Notes</h3>
            <p className="text-sm text-zinc-600 leading-relaxed font-medium">
              {notes}
            </p>
          </div>
        )}

        {!message && !notes && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
             <div className="w-20 h-20 rounded-full bg-zinc-50 flex items-center justify-center mb-6">
                <Sparkles size={32} className="text-zinc-200" />
             </div>
             <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">Awaiting input</p>
             <p className="text-xs mt-3 font-medium text-zinc-400 leading-relaxed">
               {activityType === 'mcq' ? "Stuck on an option? I can help explain the core concepts." :
                activityType === 'spreadsheet' ? "Need a formula hint? I can help you build the correct syntax." :
                activityType === 'canvas' ? "Having trouble categorizing? Let's discuss the relationships." :
                "Click hint or check answer to receive guidance."}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};


