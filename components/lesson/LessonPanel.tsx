import React from 'react';
import { Megaphone, CheckCircle2 } from 'lucide-react';
import { DragCategory } from '@/data/financeData';
import { CanvasToolkit } from '@/components/exercise/CanvasToolkit';

interface LessonPanelProps {
  title: string;
  explanation: string;
  definitions: { term: string; definition: string }[];
  instructions: string;
  toolkitElements?: DragCategory[];
}

export const LessonPanel = ({
  title,
  explanation,
  definitions,
  instructions,
  toolkitElements,
}: LessonPanelProps) => {
  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex flex-col gap-6 overflow-y-auto pr-4 custom-scrollbar flex-1">
        {/* Title with Megaphone Icon */}
        <div className="flex items-start gap-4 group">
          <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center rounded-full shadow-xl transform group-hover:rotate-6 transition-transform shrink-0">
             <Megaphone size={20} className="text-zinc-100 fill-zinc-100" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 leading-tight">
            {title}
          </h1>
        </div>

        {/* Explanation with Yellow Accents */}
        <div className="space-y-2">
          <p className="text-zinc-700 leading-relaxed text-[17px] font-medium border-l-1 border-[#7C5DFA] pl-4 py-1">
            {explanation}
          </p>
        </div>

        {/* Bullet Points / Definitions */}
        <div className="space-y-4">
           {definitions.map((def, idx) => (
             <div key={idx} className="flex gap-3">
                <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                <div className="text-[16px] leading-relaxed text-zinc-600">
                   <span className="font-black text-zinc-900 border-b-2 border-yellow-300">
                      {def.term}
                   </span>: {def.definition}
                </div>
             </div>
           ))}
        </div>

        {/* Instructions / Tasks Section */}
        <div className="mt-2 pt-2 border-t border-zinc-200">
           <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} className="text-[#7C5DFA]" />
              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest">Exercise Task</h3>
           </div>
           <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-2xl text-[16px] text-yellow-900  font-medium italic">
              {instructions}
           </div>
        </div>

        {/* Integrated Toolkit */}
        {toolkitElements && (
          <CanvasToolkit draggableElements={toolkitElements} />
        )}
      </div>
    </div>
  );
};
