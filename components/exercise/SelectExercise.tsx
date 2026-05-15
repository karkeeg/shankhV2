'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface SelectExerciseProps {
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
  }[];
  selectedOptions: string[];
  setSelectedOptions: React.Dispatch<React.SetStateAction<string[]>>;
  isValidated: boolean;
  feedback: Record<string, boolean>;
}

export const SelectExercise = ({
  options,
  selectedOptions,
  setSelectedOptions,
  isValidated,
  feedback,
}: SelectExerciseProps) => {
  const toggleOption = (id: string) => {
    if (isValidated) return;
    
    // For MCQ, we usually want single selection, but the state is string[].
    // If it's a single-select MCQ, we should clear previous selection.
    setSelectedOptions([id]);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {options.map((option, index) => {
        const isSelected = selectedOptions.includes(option.id);
        const isCorrectResult = feedback[option.id];
        const letter = String.fromCharCode(65 + index); // A, B, C, D

        return (
          <button
            key={option.id}
            onClick={() => toggleOption(option.id)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 transform active:scale-[0.99] group relative overflow-hidden text-left",
              isSelected 
                ? "border-[#4F6EF7] bg-[#4F6EF7] text-white shadow-lg"
                : "border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563] hover:border-[#D1D5DB] hover:bg-[#F3F4F6]",
              isValidated && isCorrectResult === true && "border-emerald-500 bg-emerald-50 text-emerald-700",
              isValidated && isCorrectResult === false && isSelected && "border-rose-500 bg-rose-50 text-rose-700"
            )}
          >
            {/* Letter Circle */}
            <div className={cn(
              "w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 font-bold text-lg transition-colors",
              isSelected 
                ? "bg-white border-white text-[#4F6EF7]"
                : "bg-white border-[#E5E7EB] text-[#9CA3AF] group-hover:border-[#D1D5DB]"
            )}>
              {letter}
            </div>

            <span className={cn(
               "text-lg font-bold flex-1",
               isSelected ? "text-white" : "text-[#4B5563]"
            )}>
              {option.label}
            </span>

            {/* Checkmark Circle (Only if selected or validated) */}
            <div className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
              isSelected ? "bg-white border-white text-[#4F6EF7]" : "opacity-0 border-[#E5E7EB]",
              isValidated && isCorrectResult === true && "opacity-100 bg-emerald-500 border-emerald-500 text-white",
              isValidated && isCorrectResult === false && isSelected && "opacity-100 bg-rose-500 border-rose-500 text-white"
            )}>
               {isValidated ? (
                 isCorrectResult ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />
               ) : (
                 isSelected && <Check size={18} strokeWidth={3} />
               )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

