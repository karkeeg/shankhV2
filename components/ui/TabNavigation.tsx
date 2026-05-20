import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TabOption {
  id: string;
  label: string;
}

interface TabNavigationProps {
  options: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabNavigation({ options, activeTab, onChange, className }: TabNavigationProps) {
  return (
    <div className={cn('flex gap-2 p-1.5 bg-[#EFECE6] rounded-full w-fit', className)}>
      {options.map((opt) => {
        const isActive = opt.id === activeTab;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200',
              isActive
                ? 'bg-[#01696F] text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-[#E5E1D8]'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
