"use client";

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { DragCategory } from '@/types/exercise';

import { CanvasToolkit } from '@/components/exercise/CanvasToolkit';
import { cn } from '@/lib/utils';
import { SidebarBrand } from '../sidebar/SidebarBrand';
import { SidebarUserCard } from '../sidebar/SidebarUserCard';
import { useAppStore } from '@/lib/store';



interface WorkspaceSidebarProps {
  title: string;
  explanation: string;
  instructions: string;
  caseContext?: string;
  overview?: string;
  learningGoals?: string[];
  keyConcepts?: { term: string; description: string }[];
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  successRate?: number;
  thumbsUp?: number;
  thumbsDown?: number;
  userName?: string;
  planName?: string;
  toolkitElements?: DragCategory[];
  activityType?: string;
  vocabulary?: string[];
  formulas?: string[];
  lessonId: string;
  totalSteps: number;
}


export const WorkspaceSidebar = ({
  title,
  explanation,
  instructions,
  caseContext,
  overview,
  learningGoals,
  keyConcepts,
  difficulty = 'Easy',
  successRate = 53.47,
  thumbsUp = 4,
  thumbsDown = 2,
  userName = 'Bibek Karki',
  planName = 'Free Plan',
  toolkitElements,
  activityType,
  vocabulary,
  formulas,
  lessonId,
  totalSteps,
  onBack,
}: WorkspaceSidebarProps & { onBack?: () => void }) => {
  const [activeTab, setActiveTab] = useState<'Instructions' | 'Context'>('Instructions');
  const { completedLessons } = useAppStore();


  const getDefaultInstructions = () => {
    if (instructions) return instructions;
    switch (activityType) {
      case 'mcq': return "Carefully read the question and select the most appropriate option. You can use the AI Coach if you need help reasoning through the options.";
      case 'spreadsheet': return "Use formulas to calculate the required cells. Do not hardcode numbers unless instructed.";
      case 'canvas': return "Drag and drop the elements into the correct drop zones to map out the framework.";
      default: return "Complete the tasks in the main workspace.";
    }
  };

  const getGuideLabel = () => {
    switch (activityType) {
      case 'mcq': return "Multiple Choice";
      case 'spreadsheet': return "Financial Modeling";
      case 'canvas': return "Visual Framework";
      default: return "Guide";
    }
  };

  return (
    <div className="flex flex-col h-full w-80 shrink-0 bg-white border-r border-zinc-100 overflow-hidden">
      {/* Top Header */}
      <div className="px-8 h-20 flex items-center border-b border-zinc-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#01696F] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl leading-none">S</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-[#01696F]">Shankh</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-8 custom-scrollbar">
        {/* Toggle Pills */}
        <div className="bg-zinc-50 flex p-1.5 rounded-2xl border border-zinc-100 shrink-0">
          <button
            onClick={() => setActiveTab('Instructions')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              activeTab === 'Instructions'
                ? 'bg-[#01696F] text-white shadow-lg shadow-[#01696F]/20'
                : 'text-zinc-500 hover:text-[#1a1a1a] hover:bg-white'
            )}
          >
            {getGuideLabel()}
          </button>
          <button
            onClick={() => setActiveTab('Context')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              activeTab === 'Context'
                ? 'bg-[#01696F] text-white shadow-lg shadow-[#01696F]/20'
                : 'text-zinc-500 hover:text-[#1a1a1a] hover:bg-white'
            )}
          >
            Context
          </button>
        </div>

        {/* Instruction Card */}
        {activeTab === 'Instructions' && (
          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-[2rem] p-8 flex flex-col gap-6 shadow-xl shadow-[#01696F]/5 border border-zinc-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#E6F0F1] rounded-full -mr-12 -mt-12 opacity-50" />
              
              <div className="relative z-10 space-y-4">
                <div className={cn(
                  "self-start px-3 py-1 rounded-full text-white text-[9px] font-bold uppercase tracking-widest",
                  difficulty === 'Easy' ? 'bg-emerald-500' : difficulty === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                )}>
                  {difficulty}
                </div>

                <h2 className="text-2xl font-bold tracking-tight leading-tight text-[#1a1a1a]">
                  {title}
                </h2>

                <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                  {explanation}
                </p>
              </div>

              {/* Exercise Task Warning Box */}
              <div className="space-y-3 relative z-10">
                <h3 className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Mission Objective</h3>
                <div className="bg-[#E6F0F1] border border-[#01696F]/10 rounded-2xl p-5 text-[#01696F] text-sm font-bold leading-relaxed italic relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-[#01696F] rounded-l-2xl" />
                  {getDefaultInstructions()}
                </div>
              </div>

              {/* Vocabulary Section */}
              {vocabulary && vocabulary.length > 0 && (
                <div className="space-y-3 relative z-10">
                  <h3 className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Vocabulary</h3>
                  <div className="flex flex-wrap gap-2">
                    {vocabulary.map(term => (
                      <span key={term} className="px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-full text-[10px] font-bold text-zinc-600">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulas Section */}
              {formulas && formulas.length > 0 && (
                <div className="space-y-3 relative z-10">
                  <h3 className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Key Formulas</h3>
                  <div className="flex flex-col gap-2">
                    {formulas.map((formula, idx) => (
                      <div key={idx} className="p-4 bg-[#1a1a1a] rounded-2xl text-[11px] font-mono text-[#E6F0F1] border border-zinc-800">
                        {formula}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Canvas Toolkit (Only visible if toolkitElements exist) */}
              {toolkitElements && (
                <div className="mt-2 border-t border-zinc-100 pt-8">
                  <CanvasToolkit draggableElements={toolkitElements} />
                </div>
              )}

              {/* Progress Tracker */}
              <div className="mt-2 border-t border-zinc-100 pt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Activity Progress</h3>
                  <span className="text-[10px] font-bold text-[#01696F] bg-[#E6F0F1] px-3 py-1 rounded-full">
                    {Math.round((completedLessons[lessonId]?.answers?.filter((a: any) => a.correct).length || 0) / (totalSteps || 1) * 100)}%
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                   {Array.from({ length: totalSteps }).map((_, idx) => {
                     const isDone = completedLessons[lessonId]?.answers?.some((a: any) => a.taskIndex === idx && a.correct);
                     return (
                       <div key={idx} className={cn(
                         "flex items-center gap-4 p-3 rounded-2xl border transition-all",
                         isDone ? "bg-emerald-50 border-emerald-100" : "bg-zinc-50 border-zinc-100"
                       )}>
                         <div className={cn(
                           "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                           isDone ? "bg-emerald-500 text-white" : "bg-zinc-200 text-zinc-500"
                         )}>
                           {isDone ? "✓" : idx + 1}
                         </div>
                         <span className={cn(
                           "text-xs font-bold",
                           isDone ? "text-emerald-700" : "text-zinc-500"
                         )}>
                           {isDone ? "Completed" : `Task ${idx + 1}`}
                         </span>
                       </div>
                     );
                   })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Context Tab */}
        {activeTab === 'Context' && (
          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-[2rem] p-8 flex flex-col gap-8 shadow-xl shadow-[#01696F]/5 border border-zinc-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#E6F0F1] rounded-full -mr-12 -mt-12 opacity-50" />
              
              <div className="relative z-10 space-y-3">
                <h2 className="text-xl font-bold tracking-tight leading-tight text-[#1a1a1a]">
                  {overview ? "Overview" : "Case Context"}
                </h2>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                  {overview || caseContext || "This task is part of the broader curriculum. Use the context provided to solve the exercise."}
                </p>
              </div>

              {learningGoals && learningGoals.length > 0 && (
                <div className="space-y-4 relative z-10">
                  <h3 className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Learning Goals</h3>
                  <div className="flex flex-col gap-3">
                    {learningGoals.map((goal, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#01696F] mt-2 shrink-0" />
                        <span className="text-xs font-bold text-zinc-600 leading-relaxed">{goal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {keyConcepts && keyConcepts.length > 0 && (
                <div className="space-y-4 relative z-10">
                  <h3 className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Key Concepts</h3>
                  <div className="flex flex-col gap-4">
                    {keyConcepts.map((concept, idx) => (
                      <div key={idx} className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 space-y-1">
                        <div className="text-[11px] font-bold text-[#01696F] uppercase tracking-wider">{concept.term}</div>
                        <div className="text-xs font-medium text-zinc-500 leading-relaxed">{concept.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile & Stats Section */}
      <div className="p-6 border-t border-zinc-50">
        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl">
          <div className="w-10 h-10 bg-[#01696F] rounded-xl flex items-center justify-center text-white font-bold text-lg">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1a1a1a] truncate">{userName}</p>
            <p className="text-[10px] font-bold text-[#01696F] uppercase tracking-widest">{planName}</p>
          </div>
        </div>
      </div>
    </div>

  );
};
