import React from "react";

export const CategoriesSection = () => {
  const categories = [
    { title: "Finance | Sheets", desc: "Modeling fluency and investor style analysis." },
    { title: "Strategy | MCQ", desc: "Modeling fluency and investor style analysis." },
    { title: "Operations | Canvas", desc: "Modeling fluency and investor style analysis." },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-12">
      {categories.map((cat, i) => (
        <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#1a1a1a]">{cat.title}</h3>
            <p className="text-xs text-zinc-600 font-medium leading-relaxed">{cat.desc}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["2 Statement", "Valuation", "LBO"].map((tag) => (
              <span key={tag} className="bg-[#E6F0F1] text-zinc-700 px-3 py-1.5 rounded-full text-[10px] font-bold border border-[#01696F]/10">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
