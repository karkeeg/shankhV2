import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard';
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const styles = {
    easy: 'bg-[#D2EAE8] text-[#01696F]',
    medium: 'bg-[#FDF4D5] text-[#A67C00]',
    hard: 'bg-[#FCE3E3] text-[#C53030]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider',
        styles[difficulty],
        className
      )}
    >
      {difficulty}
    </span>
  );
}
