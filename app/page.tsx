"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  ChevronDown,
  Book,
  Play,
} from "lucide-react";
import Link from "next/link";
import { financeData } from "@/data/financeData";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "balance-sheet",
  );

  const categories = [
    { name: "Balance Sheet", id: "balance-sheet" },
    { name: "Income Statement", id: "income-statement" },
    { name: "Cash Flow Statement", id: "cash-flow" },
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Clean Header */}
        <header className="bg-white border-b border-zinc-200 px-6 py-4 relative shrink-0">
          <div className="max-w-6xl mx-auto flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Financial Statements
              </h1>
              <p className="text-zinc-500 text-sm">
                Select a topic to begin learning.
              </p>
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="max-w-6xl w-full mx-auto px-6 py-8 pb-20 space-y-6">
          {/* Module List Section */}
          <div className="space-y-3">
            {categories.map((cat) => {
              const lessons = financeData.filter((l) => l.category === cat.id);
              const isExpanded = expandedCategory === cat.id;

              return (
                <div key={cat.id}>
                  <div
                    onClick={() =>
                      setExpandedCategory(isExpanded ? null : cat.id)
                    }
                    className={cn(
                      "bg-white px-6 py-4 rounded-lg border border-zinc-200 shadow-sm flex items-center justify-between cursor-pointer transition-all duration-300 hover:border-zinc-300 hover:shadow-md",
                      isExpanded && "border-zinc-300 shadow-md",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <ChevronDown
                        size={20}
                        className={cn(
                          "text-zinc-400 transition-transform duration-300",
                          isExpanded ? "rotate-180" : "rotate-0",
                        )}
                      />
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                          <Book size={18} />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900">
                          {cat.name}
                        </h3>
                      </div>
                    </div>

                    <Link
                      href={
                        lessons.length > 0
                          ? `/finance/${cat.id}/${lessons[0].slug}`
                          : "#"
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2 rounded-lg font-bold text-xs transition-colors"
                    >
                      START
                    </Link>
                  </div>

                  {/* Accordion Content: Sub-topics */}
                  {isExpanded && (
                    <div className="mt-2 animate-in slide-in-from-top-4 fade-in duration-300">
                      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
                        {lessons.map((lesson, idx) => (
                          <Link
                            key={lesson.id}
                            href={`/finance/${lesson.category}/${lesson.slug}`}
                            className={cn(
                              "flex items-center justify-between p-4 px-6 hover:bg-zinc-50 transition-colors group/item",
                              idx !== lessons.length - 1
                                ? "border-b border-zinc-100"
                                : "",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600 group-hover/item:bg-zinc-900 group-hover/item:text-white transition-all">
                                {idx + 1}
                              </div>
                              <span className="font-medium text-zinc-700 group-hover/item:text-zinc-900 transition-colors">
                                {lesson.title}
                              </span>
                            </div>
                            <Play
                              size={14}
                              className="text-zinc-400 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all"
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
