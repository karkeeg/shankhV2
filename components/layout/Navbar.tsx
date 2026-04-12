'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Flame, 
  Settings, 
  ChevronLeft, 
  LayoutGrid,
  TrendingUp
} from 'lucide-react';
import Image from 'next/image';

export const Navbar = () => {
  return (
    <nav className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 text-zinc-900 z-50 shrink-0">
      {/* Left: Logo & Module Outline */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
             <TrendingUp size={22} strokeWidth={3} />
          </div>
          <span className="text-xl font-bold tracking-tight">quantus</span>
        </Link>
        
        <button className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-zinc-200 text-zinc-700">
           <LayoutGrid size={16} />
           Module Outline
        </button>
      </div>

      {/* Center: AI Assistant */}
      <div className="hidden md:flex items-center">
         <button className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 px-6 py-2 rounded-lg transition-colors border border-zinc-200 text-zinc-700 font-medium">
            <Bot size={18} />
            <span className="text-sm">Ask AI Assistant</span>
         </button>
      </div>

      {/* Right: Stats & Profile */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 border-r border-zinc-200 pr-6">
           <div className="flex items-center gap-1">
              <Flame size={18} className="text-orange-500" />
              <span className="font-semibold text-zinc-900">1</span>
           </div>
           
           {/* Progress Indicator */}
           <div className="hidden lg:flex flex-col gap-1 w-32">
              <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                 <div className="h-full bg-zinc-900 w-2/3 rounded-full" />
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <button className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-600 hover:text-zinc-900">
              <Settings size={18} />
           </button>
           <Link href="/" className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1">
              <ChevronLeft size={16} />
              Back
           </Link>
           <div className="w-9 h-9 rounded-lg bg-zinc-200 border border-zinc-300 overflow-hidden">
              <Image src="https://ui-avatars.com/api/?name=User&background=e4e4e7&color=27272a" alt="Profile" width={36} height={36} className="w-full h-full object-cover" />
           </div>
        </div>
      </div>
    </nav>
  );
};