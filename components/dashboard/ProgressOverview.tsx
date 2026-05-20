import React from "react";

export const ProgressOverview = () => {
  const tracks = [
    { title: "Finance | Sheets", module: "Modeling Fountains", progress: 68 },
    { title: "Strategy | MCQ", module: "Modeling Fountains", progress: 68 },
    { title: "Operations | Canvas", module: "Modeling Fountains", progress: 68 },
  ];

  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold text-[#1a1a1a]">Progress Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tracks.map((item, i) => (
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
