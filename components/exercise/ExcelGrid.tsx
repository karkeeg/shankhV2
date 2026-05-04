"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Search,
  Undo2,
  Redo2,
  Printer,
  PaintBucket,
  Bold,
  Italic,
  Strikethrough,
  Palette,
  Link2,
  MessageSquare,
  Grid3X3,
  AlignLeft,
  AlignCenter,
  IndentIncrease,
  WrapText,
  MoreVertical,
  Menu,
} from "lucide-react";

/* ── Toolbar Helpers ────────────────────────────────────────────── */

function ToolbarBtn({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-700 transition-colors shrink-0">
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-zinc-200 mx-0.5 shrink-0" />;
}

/* ── ExcelGrid Component ────────────────────────────────────────── */

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
  /** Optional tab name to show in the bottom sheet bar */
  sheetTabName?: string;
  /** If true, shows the rich spreadsheet toolbar (for canvas exercises) */
  showToolbar?: boolean;
}

export const ExcelGrid = ({
  table,
  inputs = [],
  dropdowns = [],
  userInputs,
  setUserInputs,
  isValidated,
  feedback,
  sheetTabName,
  showToolbar = false,
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

  // Compute cell address label (e.g. "E5")
  const cellAddress = selectedCell
    ? `${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1}`
    : "";

  return (
    <div className="flex flex-col h-full bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden font-sans ring-1 ring-zinc-200">
      {/* Rich Toolbar (shown for canvas-style exercises) */}
      {showToolbar && (
        <div className="flex items-center gap-1 px-4 py-1.5 bg-[#f3f4f6] border-b border-zinc-300 shrink-0 overflow-x-auto h-12 shadow-sm">
          {/* Utility icons */}
          <ToolbarBtn icon={<Search size={16} />} />
          <ToolbarBtn icon={<Undo2 size={16} />} />
          <ToolbarBtn icon={<Redo2 size={16} />} />
          <ToolbarBtn icon={<Printer size={16} />} />
          <ToolbarBtn icon={<PaintBucket size={16} />} />

          <ToolbarDivider />

          {/* Zoom */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-200/70 transition-colors cursor-pointer">
            <span className="text-[11px] text-zinc-600 font-bold">100%</span>
            <ChevronDown size={10} className="text-zinc-400" />
          </div>

          <ToolbarDivider />

          {/* Font Selector */}
          <button className="flex items-center gap-2 px-3 py-1 rounded border border-zinc-300 bg-white text-[11px] text-zinc-700 font-bold hover:bg-zinc-50 transition-all shadow-sm">
            Default
            <ChevronDown size={10} />
          </button>

          <ToolbarDivider />

          {/* Font Size */}
          <div className="flex items-center gap-1 px-1">
            <button className="p-1 text-zinc-500 hover:text-zinc-800 transition-colors">
              <Minus size={14} />
            </button>
            <div className="px-2 py-0.5 rounded border border-zinc-300 bg-white text-[11px] font-bold text-zinc-700 min-w-[28px] text-center shadow-sm">
              10
            </div>
            <button className="p-1 text-zinc-500 hover:text-zinc-800 transition-colors">
              <Plus size={14} />
            </button>
          </div>

          <ToolbarDivider />

          {/* Text formatting */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn icon={<Bold size={16} />} />
            <ToolbarBtn icon={<Italic size={16} />} />
            <ToolbarBtn icon={<Strikethrough size={16} />} />
            <button className="flex items-center gap-0.5 p-1.5 rounded hover:bg-zinc-200/70 text-zinc-500 transition-colors">
               <span className="text-xs font-bold underline decoration-2 decoration-zinc-400 underline-offset-2">A</span>
               <ChevronDown size={8} />
            </button>
          </div>

          <ToolbarDivider />

          {/* Alignment & More */}
          <div className="flex items-center gap-0.5 ml-auto">
             <button className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-500 transition-colors">
                <ChevronUp size={14} className="rotate-180" />
             </button>
          </div>
        </div>
      )}

      {/* Cell Reference + Formula Bar */}
      <div className="flex items-center gap-0 bg-white border-b border-zinc-300 shrink-0 h-9">
        {/* Cell address */}
        <div className="flex items-center gap-2 px-4 py-1 border-r border-zinc-200 min-w-[70px]">
          <span className="text-xs font-bold text-zinc-700 select-none tracking-tight">{cellAddress}</span>
          <ChevronDown size={12} className="text-zinc-400" />
        </div>

        {/* Sigma / function indicator */}
        <div className="px-4 py-1 border-r border-zinc-200 flex items-center text-zinc-800">
          <span className="text-lg font-black select-none italic">Σ</span>
        </div>

        {/* Formula bar */}
        <input
          type="text"
          readOnly
          value={currentFormulaValue}
          className="flex-1 px-4 py-1 bg-transparent border-none outline-none text-sm text-zinc-800 font-bold tracking-tight"
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
      <div className="flex items-center justify-between px-3 py-1 bg-[#d4d7db] border-t border-zinc-400/30 text-[10px] font-bold text-zinc-500 h-10 shadow-inner">
        <div className="flex items-center h-full">
          <div className="p-1.5 hover:bg-zinc-300 rounded-md cursor-pointer transition-colors mr-2">
            <Plus size={14} className="stroke-[3px]" />
          </div>
          <div className="p-1.5 hover:bg-zinc-300 rounded-md cursor-pointer transition-colors mr-4">
            <Menu size={14} className="stroke-[3px]" />
          </div>
          <div className="flex items-center h-full pt-1">
            <span className="flex items-center gap-2 px-5 h-full bg-[#dbeafe] border-x border-t border-zinc-400/40 text-blue-700 font-black rounded-t-lg shadow-sm relative z-10 text-[11px] tracking-tight">
              {sheetTabName || "Income Statement"}
              <ChevronDown size={10} className="text-blue-400" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
