"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus, Minus } from "lucide-react";

interface ExcelGridProps {
  table: (string | number | null)[][];
  inputs?: {
    row: number;
    col: number;
    correctValue: string | number;
    placeholder?: string;
  }[];
  dropdowns?: {
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

export const ExcelGrid = ({
  table,
  inputs = [],
  dropdowns = [],
  userInputs,
  setUserInputs,
  isValidated,
  feedback,
}: ExcelGridProps) => {
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>({ row: 1, col: 1 });

  const handleInputChange = (row: number, col: number, value: string) => {
    if (isValidated) return;
    setUserInputs((prev) => ({
      ...prev,
      [`${row}-${col}`]: value,
    }));
  };

  const currentFormulaValue = selectedCell
    ? userInputs[`${selectedCell.row}-${selectedCell.col}`] ||
      table[selectedCell.row]?.[selectedCell.col]?.toString() ||
      ""
    : "";

  // Generate Column Headers (A, B, C...)
  const colHeaders = Array.from({ length: table[0]?.length || 0 }, (_, i) =>
    String.fromCharCode(65 + i),
  );

  return (
    <div className="flex flex-col h-full bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden font-sans ring-1 ring-zinc-200">
      {/* Formula Bar Section */}
      <div className="flex items-center gap-1 p-1 bg-white border-b border-zinc-200">
        <div className="w-10 h-7 flex items-center justify-center text-zinc-400 font-serif italic text-base border-r border-zinc-200">
          fx
        </div>
        <input
          type="text"
          readOnly
          value={currentFormulaValue}
          className="flex-1 px-3 py-1 bg-transparent border-none outline-none text-xs text-zinc-500 font-medium"
          placeholder=""
        />
      </div>

      {/* Spreadsheet Main Area */}
      <div className="flex-1 overflow-auto bg-zinc-50 relative">
        <table className="border-collapse table-fixed w-full">
          <thead>
            <tr>
              {/* Top-Left Empty Corner */}
              <th className="w-10 h-6 bg-zinc-100 border border-zinc-200 sticky top-0 left-0 z-20"></th>
              {colHeaders.map((header, idx) => (
                <th
                  key={idx}
                  className="w-40 h-6 bg-zinc-100 border border-zinc-200 text-zinc-500 font-normal text-[10px] uppercase sticky top-0 z-10"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((row, rowIndex) => {
              const isSectionRow =
                typeof row[0] === "string" &&
                /(Drivers|Statement|Assumptions|Cash Flow|Balance Sheet|Income Statement)/i.test(
                  row[0],
                );
              const isSubHeaderRow =
                typeof row[0] === "string" &&
                /(Historical|Projected)/i.test(row[0]);

              if (isSectionRow) {
                return (
                  <tr key={rowIndex}>
                    {/* Row Headers (1, 2, 3...) */}
                    <td className="w-10 h-8 bg-zinc-100 border border-zinc-200 text-zinc-400 text-center text-[10px] font-bold sticky left-0 z-10">
                      {rowIndex + 1}
                    </td>
                    <td
                      colSpan={colHeaders.length}
                      className="h-8 border border-zinc-100 bg-[#7C5DFA]/10 text-[#312e81] font-semibold text-center text-[13px]"
                    >
                      {row[0]}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={rowIndex}>
                  {/* Row Headers (1, 2, 3...) */}
                  <td className="w-10 h-8 bg-zinc-100 border border-zinc-200 text-zinc-400 text-center text-[10px] font-bold sticky left-0 z-10">
                    {rowIndex + 1}
                  </td>

                  {row.map((cell, colIndex) => {
                    const inputConfig = inputs.find(
                      (i) => i.row === rowIndex && i.col === colIndex,
                    );
                    const dropdownConfig = dropdowns.find(
                      (d) => d.row === rowIndex && d.col === colIndex,
                    );
                    const isSelected =
                      selectedCell?.row === rowIndex &&
                      selectedCell?.col === colIndex;
                    const key = `${rowIndex}-${colIndex}`;

                    const rowStyle = isSubHeaderRow
                      ? "bg-zinc-100 text-zinc-500 font-semibold"
                      : "";

                    return (
                      <td
                        key={colIndex}
                        onClick={() =>
                          setSelectedCell({ row: rowIndex, col: colIndex })
                        }
                        className={cn(
                          "h-8 border border-zinc-100 bg-white relative p-0 transition-all",
                          rowStyle,
                          isSelected &&
                            "outline outline-2 outline-[#7C5DFA] z-[5] shadow-inner",
                          (inputConfig || dropdownConfig) &&
                            !isValidated &&
                            "bg-blue-50/20",
                          isValidated &&
                            feedback[key] &&
                            "bg-emerald-50 text-emerald-700",
                          isValidated &&
                            feedback[key] === false &&
                            "bg-rose-50 text-rose-700",
                        )}
                      >
                        {inputConfig ? (
                          <input
                            type="text"
                            placeholder={inputConfig.placeholder || ""}
                            className="w-full h-full px-2 py-1 bg-transparent border-none outline-none text-[13px] text-zinc-800 font-semibold text-center"
                            value={userInputs[key] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                rowIndex,
                                colIndex,
                                e.target.value,
                              )
                            }
                            disabled={isValidated && feedback[key]}
                            autoFocus={isSelected}
                          />
                        ) : dropdownConfig ? (
                          <div className="w-full h-full relative group">
                            <select
                              className="w-full h-full px-2 py-1 bg-transparent border-none outline-none text-[13px] text-zinc-800 font-semibold appearance-none cursor-pointer text-center"
                              value={userInputs[key] || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  rowIndex,
                                  colIndex,
                                  e.target.value,
                                )
                              }
                              disabled={isValidated && feedback[key]}
                            >
                              <option value="">- Select -</option>
                              {dropdownConfig.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={12}
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity pointer-events-none"
                            />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "px-2 py-1 text-[13px] font-medium overflow-hidden whitespace-nowrap text-ellipsis",
                              rowIndex === 0
                                ? "text-zinc-400 font-bold uppercase text-[10px]"
                                : "text-zinc-700",
                            )}
                          >
                            {cell}
                          </div>
                        )}

                        {/* Selection Highlighting */}
                        {isSelected && !isValidated && (
                          <div className="absolute inset-0 bg-[#7C5DFA]/5 pointer-events-none" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Empty Rows Padding */}
            {Array.from({ length: Math.max(0, 10 - table.length) }).map(
              (_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="h-8 bg-zinc-100 border border-zinc-200 text-zinc-400 text-center text-[10px] sticky left-0">
                    {table.length + i + 1}
                  </td>
                  {colHeaders.map((_, idx) => (
                    <td
                      key={idx}
                      className="h-8 border border-zinc-100 bg-white"
                    ></td>
                  ))}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Bottom Tabs Bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-zinc-100 border-t border-zinc-200 text-[10px] font-bold text-zinc-400">
        <div className="flex items-center">
          <div className="p-1 hover:bg-zinc-200 rounded cursor-pointer transition-colors mr-2">
            <Plus size={10} />
          </div>
          <div className="flex items-center">
            <span className="px-4 py-1.5 bg-white border-x border-t border-zinc-200 text-[#7C5DFA] font-black -mb-[5px] rounded-t-sm shadow-sm relative z-10">
              Exercise1
            </span>
            <span className="px-4 py-1.5 hover:bg-zinc-200 transition-colors cursor-pointer">
              Example1
            </span>
            <span className="px-4 py-1.5 hover:bg-zinc-200 transition-colors cursor-pointer">
              Summary
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 px-2">
          <div className="flex items-center gap-1.5">
            <Minus size={10} className="cursor-pointer hover:text-zinc-600" />
            <div className="w-16 h-1 bg-zinc-200 rounded-full relative">
              <div className="absolute top-1/2 left-[75%] -translate-y-1/2 w-2.5 h-2.5 bg-white border border-zinc-300 rounded-full shadow-sm" />
            </div>
            <Plus size={10} className="cursor-pointer hover:text-zinc-600" />
            <span className="ml-1 tracking-tighter">125%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
