"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Search, Bell, ChevronDown, ChevronUp, Play, Award, HelpCircle } from "lucide-react";
import { TabNavigation } from "@/components/ui/TabNavigation";
import { cn } from "@/lib/utils";

// Mock Data for Profession Cards
const PROFESSION_CARDS = [
  {
    id: "ca",
    title: "Chartered Accountant",
    subtitle: "Master individual financial statements",
    slug: "financial-statement-fundamentals",
    level: "Beginners / Intermediate",
    duration: "1.5 weeks",
    modules: [
      { name: "P&L Forecast", items: ["Simple P&L Forecast", "P&L Forecast with Historical Growth Rates", "Advanced P&L Modeling"] },
      { name: "Balance Sheet Forecast", items: ["Simple Balance Sheet", "Balance Sheet with Debt Schedule"] },
      { name: "Cash Flow Forecast", items: ["Indirect Method Cash Flow", "Direct Method Cash Flow"] }
    ]
  },
  {
    id: "ah",
    title: "Account Head",
    subtitle: "Master corporate financial statements",
    slug: "corporate-statement-modeling",
    level: "Beginners / Intermediate",
    duration: "1.5 weeks",
    modules: [
      { name: "P&L Forecast", items: ["Corporate P&L", "Multi-segment P&L"] },
      { name: "Balance Sheet Forecast", items: ["Working Capital Modeling", "Asset Depreciation Schedule"] },
      { name: "Cash Flow Forecast", items: ["Free Cash Flow reconciliation"] }
    ]
  }
];

const FOUNTAIN_CARDS = [
  {
    id: "f1",
    title: "Financial Statement Fundamentals",
    subtitle: "Master individual financial statements",
    slug: "financial-statement-fundamentals",
    level: "Beginners / Intermediate",
    duration: "1.5 weeks"
  },
  {
    id: "f2",
    title: "Financial Statement Fundamentals",
    subtitle: "Master individual financial statements",
    slug: "financial-statement-fundamentals",
    level: "Beginners / Intermediate",
    duration: "1.5 weeks"
  }
];

export default function QuantLabPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("quantus");
  const [expandedProf, setExpandedProf] = useState<Record<string, boolean>>({ ca: true, ah: true });
  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({});

  const toggleProf = (id: string) => {
    setExpandedProf(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSub = (key: string) => {
    setExpandedSub(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStart = (slug: string) => {
    router.push(`/skill-building/quant-lab/${slug}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-full mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#01696F]">Quant Lab</h2>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#01696F]" size={20} />
            <input
              type="text"
              placeholder="Search topics, cases and formulas"
              className="w-full bg-white border border-[#01696F]/30 rounded-full py-2.5 pl-10 pr-4 outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 transition-all text-xs font-medium placeholder:text-zinc-400 shadow-sm"
            />
          </div>
          <button className="w-9 h-9 flex items-center justify-center bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors relative shadow-sm">
            <Bell size={20} className="text-[#01696F]" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex justify-start">
        <TabNavigation
          options={[
            { id: "quantus", label: "Quantus Sheets" },
            { id: "mcq", label: "Multiple Choice Questions" },
            { id: "canvas", label: "Canvas" }
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab)}
        />
      </div>

      {activeTab === "quantus" ? (
        <div className="space-y-8">
          {/* Search by Profession Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#01696F]">Search by Profession</h3>
              <div className="relative w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="text"
                  placeholder="Search topics, cases and formulas"
                  className="w-full bg-white border border-zinc-200 rounded-full py-2 pl-9 pr-4 outline-none focus:border-[#01696F] text-xs"
                />
              </div>
            </div>

            {/* Profession Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {PROFESSION_CARDS.map((prof) => (
                <div key={prof.id} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-zinc-800">{prof.title}</h4>
                      <p className="text-xs text-zinc-500 font-medium">{prof.subtitle}</p>
                    </div>
                    <button
                      onClick={() => toggleProf(prof.id)}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1.5"
                    >
                      {expandedProf[prof.id] ? "Collapse" : "Expand"}{" "}
                      {expandedProf[prof.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {expandedProf[prof.id] && (
                    <div className="bg-[#FDFCFA] border border-dashed border-zinc-200 rounded-2xl p-5 space-y-4">
                      <div className="space-y-1">
                        <h5 className="font-bold text-zinc-800 text-sm">Individual Financial Statement Modeling</h5>
                        <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                          Build a strong foundation in financial modeling by practicing individual financial statements.
                        </p>
                      </div>

                      {/* Dropdowns */}
                      <div className="space-y-2">
                        {prof.modules.map((mod, mIdx) => {
                          const key = `${prof.id}-${mIdx}`;
                          const isSubExpanded = expandedSub[key];
                          return (
                            <div key={mIdx} className="border-b border-zinc-100 pb-2">
                              <button
                                onClick={() => toggleSub(key)}
                                className="w-full flex items-center justify-between text-xs font-bold text-zinc-700 py-1.5 hover:text-[#01696F]"
                              >
                                <span>{mod.name}</span>
                                <ChevronDown
                                  size={16}
                                  className={cn("transition-transform duration-200", isSubExpanded && "transform rotate-180")}
                                />
                              </button>
                              {isSubExpanded && (
                                <ul className="pl-3 mt-1.5 space-y-1 text-xs text-zinc-500 font-medium list-disc list-inside">
                                  {mod.items.map((item, iIdx) => (
                                    <li key={iIdx}>{item}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                        <div className="flex gap-4 text-xs font-bold text-zinc-500 uppercase tracking-tight">
                          <span>{prof.level}</span>
                          <span>&middot;</span>
                          <span>{prof.duration}</span>
                        </div>
                        <button
                          onClick={() => handleStart(prof.slug)}
                          className="bg-[#01696F] text-white hover:opacity-90 transition-opacity font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs shadow-[#01696F]/10 active:scale-95"
                        >
                          <Play size={12} fill="currentColor" /> Start
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Modeling Fountains Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-800">Modeling Fountains</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {FOUNTAIN_CARDS.map((fount) => (
                <div key={fount.id} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[180px]">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-bold text-zinc-800 leading-snug">{fount.title}</h4>
                      <button
                        onClick={() => toggleProf(fount.id)}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 text-[10px] font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1"
                      >
                        Expand <ChevronDown size={10} />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">{fount.subtitle}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                    <div className="flex gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                      <span>{fount.level}</span>
                      <span>&middot;</span>
                      <span>{fount.duration}</span>
                    </div>
                    <button
                      onClick={() => handleStart(fount.slug)}
                      className="bg-[#01696F] text-white hover:opacity-90 transition-opacity font-bold px-4 py-2 rounded-xl shadow-sm text-xs"
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center py-20 text-zinc-400 font-medium">
          {activeTab === "mcq" ? "Multiple Choice Questions Library is loading..." : "Canvas Draw & Drop Playground is loading..."}
        </div>
      )}
    </div>
  );
}
