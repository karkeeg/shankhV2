import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AccordionItemProps {
  title: React.ReactNode;
  children: React.ReactNode;
  isOpenDefault?: boolean;
}

export function AccordionItem({ title, children, isOpenDefault = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  return (
    <div className="border border-zinc-200 bg-white rounded-xl overflow-hidden shadow-sm mb-3">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 text-left">{title}</div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-zinc-500 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'transition-all duration-200 overflow-hidden',
          isOpen ? 'max-h-[1000px] border-t border-zinc-100' : 'max-h-0'
        )}
      >
        <div className="p-4 bg-[#FDFCFA]">{children}</div>
      </div>
    </div>
  );
}

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

export function Accordion({ children, className }: AccordionProps) {
  return <div className={cn('w-full', className)}>{children}</div>;
}
