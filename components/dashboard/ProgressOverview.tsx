import React from "react";

interface ModuleProgress {
  id: string;
  name: string;
  completionPct: number;
}

interface ProgressOverviewProps {
  modules: ModuleProgress[];
}

export const ProgressOverview = ({ modules }: ProgressOverviewProps) => {
  const tracks = (modules || []).map((m) => {
    let title = m.name;
    if (m.name.toLowerCase().includes("finance")) title = "Finance | Sheets";
    else if (m.name.toLowerCase().includes("strategy")) title = "Strategy | MCQ";
    else if (m.name.toLowerCase().includes("operations")) title = "Operations | Canvas";

    return {
      title,
      module: m.name,
      progress: Math.round(m.completionPct),
    };
  });

  // Fallback if empty
  const displayTracks = tracks.length > 0 ? tracks : [
    { title: "Finance | Sheets", module: "Finance Module", progress: 0 },
    { title: "Strategy | MCQ", module: "Strategy Module", progress: 0 },
    { title: "Operations | Canvas", module: "Operations Module", progress: 0 },
  ];

  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold text-[#1a1a1a]">Progress Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayTracks.map((item, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#1a1a1a]">{item.title}</h4>
              <p className="text-xs text-zinc-500 font-medium">{item.module}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-2 bg-zinc-100 rounded-sm overflow-hidden">
                <div className="h-full bg-[#01696F] rounded-sm" style={{ width: `${item.progress}%` }} />
              </div>
              <span className="text-lg font-bold text-[#1a1a1a]">{item.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
