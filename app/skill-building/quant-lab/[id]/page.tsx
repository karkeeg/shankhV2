"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { BarChart, Clock, FileText, ChevronDown, ChevronUp, Play, ArrowLeft } from "lucide-react";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { cn } from "@/lib/utils";

// Mock Detailed Data for Quant Lab ID
const QUANT_LAB_DETAILS: Record<string, {
  title: string;
  description: string;
  skillLevel: string;
  timeToComplete: string;
  numPractices: number;
  completedPractices: number;
  prerequisites: string[];
  sections: Array<{
    title: string;
    items: Array<{
      id: string;
      name: string;
      difficulty: "easy" | "medium" | "hard";
    }>;
  }>;
}> = {
  "financial-statement-fundamentals": {
    title: "Financial Statement Fundamentals",
    description: "Learn the core principles of financial analysis and how to evaluate business performance.",
    skillLevel: "Beginners / Intermediate",
    timeToComplete: "8 Hours",
    numPractices: 9,
    completedPractices: 4,
    prerequisites: ["Financial Statements", "Financial Analysis"],
    sections: [
      {
        title: "P&L Forecast",
        items: [
          { id: "pl-1", name: "Simple P&L Forecast", difficulty: "easy" },
          { id: "pl-2", name: "P&L Forecast with Historical Growth Rates", difficulty: "medium" },
          { id: "pl-3", name: "Advanced P&L Modeling", difficulty: "hard" }
        ]
      },
      {
        title: "Balance Sheet Forecast",
        items: [
          { id: "bs-1", name: "Simple Balance Sheet Forecast", difficulty: "easy" },
          { id: "bs-2", name: "Balance Sheet Forecast with Historical Growth Rates", difficulty: "medium" },
          { id: "bs-3", name: "Balance Sheet Forecast - Apple", difficulty: "hard" }
        ]
      },
      {
        title: "Cash Flow Forecast",
        items: [
          { id: "cf-1", name: "Simple Cash Flow Forecast", difficulty: "easy" },
          { id: "cf-2", name: "Indirect Cash Flow Model", difficulty: "medium" },
          { id: "cf-3", name: "Direct Cash Flow Statement", difficulty: "hard" }
        ]
      }
    ]
  }
};

export default function QuantLabDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "financial-statement-fundamentals";

  const data = QUANT_LAB_DETAILS[id] || QUANT_LAB_DETAILS["financial-statement-fundamentals"];
  
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: false
  });

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const progressPercentage = Math.round((data.completedPractices / data.numPractices) * 100);

  const handleBack = () => {
    router.push("/skill-building/quant-lab");
  };

  const handleStartActivity = (activityId: string) => {
    router.push(`/activity/${activityId}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-full mx-auto">
      {/* Back Button & Title Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-colors shadow-sm"
        >
          <ArrowLeft size={16} className="text-[#01696F]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 leading-tight">{data.title}</h1>
          <p className="text-xs text-zinc-500 font-medium">{data.description}</p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#E6F0F1] flex items-center justify-center text-[#01696F] shrink-0">
            <BarChart size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Skill Level</p>
            <p className="text-sm font-extrabold text-zinc-800 mt-1">{data.skillLevel}</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#E6F0F1] flex items-center justify-center text-[#01696F] shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Time to Complete</p>
            <p className="text-sm font-extrabold text-zinc-800 mt-1">{data.timeToComplete}</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#E6F0F1] flex items-center justify-center text-[#01696F] shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Number of Practices</p>
            <p className="text-sm font-extrabold text-zinc-800 mt-1">{data.numPractices} Practices</p>
          </div>
        </div>
      </div>

      {/* Prerequisites Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-2 shadow-sm text-xs font-bold text-zinc-700">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-2">Prerequisites</span>
        {data.prerequisites.map((prereq, index) => (
          <span key={index} className="flex items-center gap-1 text-[#01696F] bg-[#E6F0F1] px-3 py-1 rounded-full font-bold">
            &bull; {prereq}
          </span>
        ))}
      </div>

      {/* Progress Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
          <span>Progress</span>
          <span>{data.completedPractices}/{data.numPractices} Complete</span>
        </div>
        <div className="relative w-full bg-zinc-200 rounded-full h-8 overflow-hidden shadow-[inset_0px_2px_4px_rgba(0,0,0,0.06)] flex items-center justify-center">
          <div
            className="absolute left-0 top-0 h-full bg-[#01696F] transition-all duration-700 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
          <span className="z-10 text-xs font-extrabold text-white">{progressPercentage}% Completed</span>
        </div>
      </div>

      {/* Accordion Group Container */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-800">Individual Financial Statement Modeling</h3>
            <p className="text-xs text-zinc-500 font-medium">Master individual financial statements</p>
          </div>
          <button
            onClick={() => handleStartActivity(data.sections[0]?.items[0]?.id || "pl-1")}
            className="bg-[#01696F] text-white hover:opacity-90 transition-opacity font-bold px-6 py-2.5 rounded-xl shadow-md text-xs shadow-[#01696F]/10 active:scale-95"
          >
            Start
          </button>
        </div>

        {/* Section Accordions */}
        <div className="space-y-4">
          {data.sections.map((section, sIdx) => {
            const isExpanded = expandedSections[sIdx];
            return (
              <div key={sIdx} className="border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleSection(sIdx)}
                  className="w-full flex items-center justify-between p-4 bg-[#FDFCFA] font-bold text-zinc-700 hover:bg-zinc-50 border-b border-zinc-100 transition-colors"
                >
                  <span className="text-sm">{section.title}</span>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {isExpanded && (
                  <div className="bg-white divide-y divide-zinc-50">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleStartActivity(item.id)}
                        className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors cursor-pointer group"
                      >
                        <span className="text-xs font-bold text-zinc-600 group-hover:text-[#01696F] transition-colors">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <DifficultyBadge difficulty={item.difficulty} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
