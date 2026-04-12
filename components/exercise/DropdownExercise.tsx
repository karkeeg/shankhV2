"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, X } from "lucide-react";

interface DropdownExerciseProps {
  table: (string | number | null)[][];
  dropdowns: {
    row: number;
    col: number;
    options: string[];
    correctValue: string;
  }[];
  userInputs: Record<string, string>;
  setUserInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isValidated: boolean;
  feedback: Record<string, boolean>;
}

export const DropdownExercise = ({
  table,
  dropdowns,
  userInputs,
  setUserInputs,
  isValidated,
  feedback,
}: DropdownExerciseProps) => {
  const handleDropdownChange = (row: number, col: number, value: string) => {
    if (isValidated) return;
    setUserInputs((prev) => ({
      ...prev,
      [`${row}-${col}`]: value,
    }));
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
      <table className="w-full border-collapse text-base">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-900/50">
            {table[0]?.map((header, idx) => (
              <th
                key={idx}
                className="border-b border-r border-zinc-200 dark:border-zinc-800 p-4 text-left font-bold text-zinc-900 dark:text-zinc-100 first:border-l-0 last:border-r-0"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.slice(1).map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
            >
              {row.map((cell, colIndex) => {
                const actualRow = rowIndex + 1;
                const dropdownConfig = dropdowns.find(
                  (d) => d.row === actualRow && d.col === colIndex,
                );

                return (
                  <td
                    key={colIndex}
                    className="border-r border-zinc-200 dark:border-zinc-800 p-0 first:border-l-0 last:border-r-0"
                  >
                    {dropdownConfig ? (
                      <div className="relative group p-2">
                        <div className="relative">
                          <select
                            className={cn(
                              "w-full appearance-none p-3 pr-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border-2 border-transparent outline-none focus:border-blue-500/50 transition-all font-semibold",
                              isValidated &&
                                feedback[`${actualRow}-${colIndex}`] &&
                                "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
                              isValidated &&
                                feedback[`${actualRow}-${colIndex}`] ===
                                  false &&
                                "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-500/30",
                            )}
                            value={userInputs[`${actualRow}-${colIndex}`] || ""}
                            onChange={(e) =>
                              handleDropdownChange(
                                actualRow,
                                colIndex,
                                e.target.value,
                              )
                            }
                            disabled={isValidated}
                          >
                            <option value="" disabled>
                              Select...
                            </option>
                            {dropdownConfig.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                            {isValidated ? (
                              feedback[`${actualRow}-${colIndex}`] ? (
                                <Check size={18} className="text-emerald-500" />
                              ) : (
                                <X size={18} className="text-rose-500" />
                              )
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-zinc-700 dark:text-zinc-300 font-medium">
                        {cell === null ? "" : cell}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
