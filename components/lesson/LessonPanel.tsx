import React from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
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
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-500 bg-white">
      <div className="flex flex-col gap-8 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-10">
        {/* Title Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-zinc-100 text-zinc-500 flex items-center justify-center rounded-lg">
                <Target size={18} />
             </div>
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Curriculum Module</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 leading-tight tracking-tight">
            {title}
          </h1>
        </div>

        {/* Primary Explanation */}
        <div className="space-y-4">
          <p className="text-zinc-600 leading-relaxed text-[16px] font-medium border-l-2 border-zinc-200 pl-4 py-1">
            {explanation}
          </p>
        </div>

        {/* Definitions Section */}
        <div className="space-y-6">
           <h3 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">Key Terminology</h3>
           <div className="space-y-5">
              {definitions.map((def, idx) => (
                <div key={idx} className="group">
                   <div className="flex flex-col gap-1.5 transition-all duration-300 group-hover:translate-x-1">
                      <span className="font-bold text-zinc-900 text-sm tracking-tight border-b border-zinc-100 self-start">
                         {def.term}
                      </span>
                      <span className="text-sm leading-relaxed text-zinc-500">
                         {def.definition}
                      </span>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Task Objective */}
        <div className="space-y-4 pt-4">
           <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-zinc-400" />
              <h3 className="font-bold text-zinc-900 text-[10px] uppercase tracking-wider">Instructions</h3>
           </div>
           <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-xl text-[14px] text-zinc-700 font-medium leading-relaxed">
              {instructions}
           </div>
        </div>

        {/* Modeling Toolkit (Canvas specific) */}
        {toolkitElements && (
          <div className="pt-8">
            <CanvasToolkit draggableElements={toolkitElements} />
          </div>
        )}
      </div>
    </div>
  );
};

