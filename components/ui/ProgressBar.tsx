import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility to merge tailwind classes */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  colorClass?: string;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  colorClass = 'bg-[#01696F]',
  className,
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full flex items-center gap-3', className)}>
      <div className={cn('w-full bg-zinc-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-zinc-700 w-9 text-right">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
