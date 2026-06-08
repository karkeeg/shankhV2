"use client";

import React, { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ExcelGrid } from "@/components/exercise/ExcelGrid";
import { Plus, Trash2, Info, Eye, Pencil } from "lucide-react";

export interface QuantusActivityData {
  title: string;
  instructions: string;
  context: string;
  gridRows: string[];
  gridCols: string[];
  gridValues: Record<string, string>;    // prefilled static values
  correctAnswers: Record<string, string>; // cells students must answer correctly
  cellHints?: Record<string, string>;    // formula hints shown on hover
}

interface Props {
  value: QuantusActivityData;
  onChange: (v: QuantusActivityData) => void;
}

export function QuantusActivityBuilder({ value, onChange }: Props) {
  const [adminGrid, setAdminGrid] = useState<Record<string, string>>(() => ({
    ...value.gridValues,
    ...value.correctAnswers,
  }));
  const [answerCells, setAnswerCells] = useState<Set<string>>(
    () => new Set(Object.keys(value.correctAnswers))
  );
  const [cellHints, setCellHints] = useState<Record<string, string>>(
    () => value.cellHints ?? {}
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [studentPreview, setStudentPreview] = useState(false);

  const set = useCallback(<K extends keyof QuantusActivityData>(key: K, val: QuantusActivityData[K]) => {
    onChange({ ...value, [key]: val });
  }, [value, onChange]);

  const syncParent = useCallback((grid: Record<string, string>, answers: Set<string>, rows: string[], cols: string[], hints?: Record<string, string>) => {
    const gridValues: Record<string, string> = {};
    const correctAnswers: Record<string, string> = {};
    rows.forEach((row) => {
      cols.forEach((col) => {
        const k = `${row}-${col}`;
        const v = grid[k] ?? "";
        if (answers.has(k)) {
          correctAnswers[k] = v;
        } else if (v !== "") {
          gridValues[k] = v;
        }
      });
    });
    const resolvedHints = hints ?? cellHints;
    const filteredHints: Record<string, string> = {};
    Object.entries(resolvedHints).forEach(([k, v]) => { if (v) filteredHints[k] = v; });
    onChange({ ...value, gridRows: rows, gridCols: cols, gridValues, correctAnswers, cellHints: filteredHints });
  }, [value, onChange, cellHints]);

  const handleGridChange: React.Dispatch<React.SetStateAction<Record<string, string>>> = useCallback((updater) => {
    setAdminGrid((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncParent(next, answerCells, value.gridRows, value.gridCols);
      return next;
    });
  }, [answerCells, value.gridRows, value.gridCols, syncParent]);

  const toggleAnswerCell = useCallback((row?: number, col?: number) => {
    const target = row !== undefined && col !== undefined ? { row, col } : selectedCell;
    if (!target) return;
    const k = cellKey(target.row, target.col, value.gridRows, value.gridCols);
    if (!k) return;
    setAnswerCells((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      syncParent(adminGrid, next, value.gridRows, value.gridCols);
      return next;
    });
  }, [selectedCell, value.gridRows, value.gridCols, adminGrid, syncParent]);

  // Toggle ALL data-column cells in a row at once (primary UX for answer designation)
  const toggleAnswerRow = useCallback((rowIdx: number) => {
    const dataCols = value.gridCols.slice(1); // skip col-0 (label column)
    if (dataCols.length === 0) return;
    const rowLabel = value.gridRows[rowIdx];
    if (!rowLabel) return;
    const rowKeys = dataCols.map((col) => `${rowLabel}-${col}`);
    setAnswerCells((prev) => {
      const next = new Set(prev);
      const allAnswer = rowKeys.every((k) => next.has(k));
      if (allAnswer) {
        rowKeys.forEach((k) => next.delete(k)); // mark as static
      } else {
        rowKeys.forEach((k) => next.add(k));    // mark all as answer
      }
      syncParent(adminGrid, next, value.gridRows, value.gridCols);
      return next;
    });
  }, [value.gridRows, value.gridCols, adminGrid, syncParent]);

  // Derived: is every data-column cell in this row an answer cell?
  const isRowAnswer = useCallback((rowIdx: number): boolean => {
    const dataCols = value.gridCols.slice(1);
    if (dataCols.length === 0) return false;
    const rowLabel = value.gridRows[rowIdx];
    if (!rowLabel) return false;
    return dataCols.every((col) => answerCells.has(`${rowLabel}-${col}`));
  }, [value.gridRows, value.gridCols, answerCells]);

  // ── Row / col editors ──────────────────────────────────────────────────────
  const addRow = () => {
    const next = [...value.gridRows, `Row ${value.gridRows.length + 1}`];
    set("gridRows", next);
    syncParent(adminGrid, answerCells, next, value.gridCols);
  };
  const removeRow = (i: number) => {
    const next = value.gridRows.filter((_, idx) => idx !== i);
    set("gridRows", next);
    syncParent(adminGrid, answerCells, next, value.gridCols);
  };
  const updateRow = (i: number, v: string) => {
    const next = [...value.gridRows]; next[i] = v;
    set("gridRows", next);
    syncParent(adminGrid, answerCells, next, value.gridCols);
  };

  const addCol = () => {
    const next = [...value.gridCols, `Col ${value.gridCols.length}`];
    set("gridCols", next);
    syncParent(adminGrid, answerCells, value.gridRows, next);
  };
  const removeCol = (i: number) => {
    if (i === 0) return;
    const next = value.gridCols.filter((_, idx) => idx !== i);
    set("gridCols", next);
    syncParent(adminGrid, answerCells, value.gridRows, next);
  };
  const updateCol = (i: number, v: string) => {
    const next = [...value.gridCols]; next[i] = v;
    set("gridCols", next);
    syncParent(adminGrid, answerCells, value.gridRows, next);
  };

  // ── ExcelGrid props ─────────────────────────────────────────────────────────

  const table = useMemo(() => {
    return value.gridRows.map((row) =>
      value.gridCols.map((col) => {
        const k = `${row}-${col}`;
        return adminGrid[k] ?? "";
      })
    );
  }, [value.gridRows, value.gridCols, adminGrid]);

  // Admin mode: only answer cells show the editable teal input.
  // Static cells appear locked (white) — admin edits them via the formula bar.
  // This matches exactly what students see, so admin knows the visual before publishing.
  const adminInputs = useMemo(() => {
    const list: { row: number; col: number; correctValue: string; placeholder: string; formula?: string }[] = [];
    value.gridRows.forEach((row, rIdx) => {
      value.gridCols.forEach((col, cIdx) => {
        if (cIdx === 0) return;
        const k = `${row}-${col}`;
        if (answerCells.has(k)) {
          list.push({ row: rIdx, col: cIdx, correctValue: adminGrid[k] ?? "", placeholder: "Enter answer…", formula: cellHints[k] || undefined });
        }
      });
    });
    return list;
  }, [value.gridRows, value.gridCols, answerCells, adminGrid, cellHints]);

  // Student preview: only answer cells are editable, pre-filled values shown
  const previewInputs = useMemo(() => {
    const list: { row: number; col: number; correctValue: string; placeholder: string; formula?: string }[] = [];
    value.gridRows.forEach((row, rIdx) => {
      value.gridCols.forEach((col, cIdx) => {
        if (cIdx === 0) return;
        const k = `${row}-${col}`;
        if (answerCells.has(k)) {
          list.push({ row: rIdx, col: cIdx, correctValue: adminGrid[k] ?? "", placeholder: "Type answer…", formula: cellHints[k] || undefined });
        }
      });
    });
    return list;
  }, [value.gridRows, value.gridCols, answerCells, adminGrid, cellHints]);

  // Student preview table: answer cells show blank
  const previewTable = useMemo(() => {
    return value.gridRows.map((row) =>
      value.gridCols.map((col) => {
        const k = `${row}-${col}`;
        return answerCells.has(k) ? "" : (adminGrid[k] ?? "");
      })
    );
  }, [value.gridRows, value.gridCols, adminGrid, answerCells]);

  // Feedback map: in admin mode, highlight answer cells green for distinction
  const adminFeedback = useMemo(() => {
    const map: Record<string, boolean> = {};
    answerCells.forEach((k) => { map[k] = true; });
    return map;
  }, [answerCells]);

  const selectedKey = selectedCell ? cellKey(selectedCell.row, selectedCell.col, value.gridRows, value.gridCols) : null;
  const selectedIsAnswer = selectedKey ? answerCells.has(selectedKey) : false;
  const selectedIsFirstCol = selectedCell?.col === 0;
  const hasStructure = value.gridRows.length > 0 && value.gridCols.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label="Title" value={value.title} onChange={(v) => set("title", v)} />
        <FormField label="Instructions" value={value.instructions} onChange={(v) => set("instructions", v)} multiline />
        <FormField label="Context / Scenario" value={value.context} onChange={(v) => set("context", v)} multiline />
      </div>

      {/* Structure builder — hidden in preview mode */}
      {!studentPreview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rows */}
          <div className="flex flex-col gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Rows</p>
              <button onClick={addRow} className="flex items-center gap-1 text-[10px] font-black text-[#01696F] hover:underline">
                <Plus size={11} /> Add Row
              </button>
            </div>
            {value.gridRows.length === 0 && <p className="text-[10px] text-zinc-400 font-medium">No rows yet.</p>}
            {value.gridRows.map((row, i) => {
              const answer = isRowAnswer(i);
              return (
                <div key={i} className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all",
                  answer
                    ? "bg-[#E8F5F5] border-[#01696F]/30"
                    : "bg-white border-zinc-200"
                )}>
                  <input value={row} onChange={(e) => updateRow(i, e.target.value)}
                    className="flex-1 border-none bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 outline-none min-w-0"
                    placeholder={`Row ${i + 1} label`} />
                  {value.gridCols.length > 1 && (
                    <button
                      onClick={() => toggleAnswerRow(i)}
                      title={answer ? "Click to make static (pre-filled)" : "Click to make answer row (students fill in)"}
                      className={cn(
                        "shrink-0 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all border",
                        answer
                          ? "bg-[#01696F] text-white border-transparent"
                          : "bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-200 hover:text-zinc-600"
                      )}
                    >
                      {answer ? "Answer" : "Static"}
                    </button>
                  )}
                  <button onClick={() => removeRow(i)} className="text-zinc-300 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cols */}
          <div className="flex flex-col gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Columns</p>
              <button onClick={addCol} className="flex items-center gap-1 text-[10px] font-black text-[#01696F] hover:underline">
                <Plus size={11} /> Add Column
              </button>
            </div>
            {value.gridCols.length === 0 && <p className="text-[10px] text-zinc-400 font-medium">No columns yet.</p>}
            {value.gridCols.map((col, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={col} onChange={(e) => updateCol(i, e.target.value)}
                  className="flex-1 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 bg-white placeholder:text-zinc-400 outline-none focus:border-[#01696F]"
                  placeholder={i === 0 ? "Label column (e.g. Metric)" : `Column ${i} header`} />
                {i > 0 && (
                  <button onClick={() => removeCol(i)} className="text-zinc-300 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      {hasStructure && (
        <div className="flex items-center justify-between gap-3 flex-wrap bg-[#FAFFFE] border border-[#01696F]/20 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-4 flex-wrap">
            {!studentPreview ? (
              <>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-zinc-100 text-zinc-400 border border-zinc-200">Static</span>
                  Pre-filled, students read only
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-[#01696F] text-white">Answer</span>
                  Students must fill in (graded)
                </div>
              </>
            ) : (
              <span className="text-[10px] font-semibold text-amber-700 flex items-center gap-1.5">
                <Eye size={11} /> Previewing as student — answer rows appear blank and editable
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* One-click answer toggle (edit mode only) */}
            {!studentPreview && selectedCell && !selectedIsFirstCol && (
              <button
                onClick={() => toggleAnswerCell()}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all active:scale-95",
                  selectedIsAnswer
                    ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                    : "bg-[#E6F0F1] text-[#01696F] border border-[#01696F]/20 hover:bg-[#DFEAEA]"
                )}
              >
                {selectedIsAnswer ? "Unmark this cell" : "Mark this cell only"}
              </button>
            )}
            {/* Formula hint input for selected answer cell */}
            {!studentPreview && selectedCell && selectedIsAnswer && selectedKey && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider whitespace-nowrap">💡 Hint:</span>
                <input
                  type="text"
                  value={cellHints[selectedKey] ?? ""}
                  onChange={(e) => {
                    const next = { ...cellHints, [selectedKey]: e.target.value };
                    setCellHints(next);
                    syncParent(adminGrid, answerCells, value.gridRows, value.gridCols, next);
                  }}
                  placeholder="e.g. =Revenue*(1+Growth)"
                  className="border border-zinc-200 rounded-lg px-2.5 py-1 text-[11px] text-zinc-800 bg-white placeholder:text-zinc-400 outline-none focus:border-[#01696F] w-52"
                />
              </div>
            )}
            {!studentPreview && !selectedCell && (
              <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                <Info size={11} /> Toggle rows to mark answers · click any cell then type in the formula bar to edit values
              </span>
            )}
            {/* Student preview toggle */}
            <button
              onClick={() => setStudentPreview((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black border transition-all active:scale-95",
                studentPreview
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              )}
            >
              {studentPreview ? <><Pencil size={11} /> Edit Mode</> : <><Eye size={11} /> Student Preview</>}
            </button>
          </div>
        </div>
      )}

      {/* The live grid */}
      {hasStructure ? (
        <div className="rounded-2xl border border-zinc-200 overflow-hidden" style={{ minHeight: "320px" }}>
          {studentPreview ? (
            // Student preview — answer cells blank + editable (no-op setter)
            <ExcelGrid
              table={previewTable}
              inputs={previewInputs}
              userInputs={{}}
              setUserInputs={() => {}}
              isValidated={false}
              feedback={{}}
              sheetTabName={value.title || "Preview"}
              showToolbar
              colLabels={value.gridCols}
              rowLabels={value.gridRows}
              showProgress
            />
          ) : (
            // Admin edit mode — all cells editable, answer cells highlighted
            <ExcelGrid
              table={table}
              inputs={adminInputs}
              userInputs={adminGrid}
              setUserInputs={handleGridChange}
              isValidated={false}
              feedback={adminFeedback}
              sheetTabName={value.title || "Model"}
              showToolbar
              colLabels={value.gridCols}
              rowLabels={value.gridRows}
              selectedCell={selectedCell}
              onSelectCell={(cell) => {
                setSelectedCell(cell);
                // One-click double-click on a data cell toggles answer status
              }}
            />
          )}
        </div>
      ) : (
        <div className="py-10 text-center text-zinc-400 text-xs font-semibold border border-dashed border-zinc-200 rounded-xl">
          Add rows and columns above to start building the spreadsheet.
        </div>
      )}

      {/* Summary */}
      {hasStructure && (
        <div className="flex items-center gap-4 text-[10px] font-semibold text-zinc-500 flex-wrap">
          <span>{value.gridRows.length} rows × {value.gridCols.length} cols</span>
          <span>·</span>
          <span className="text-[#01696F] font-bold">
            {value.gridRows.filter((_, i) => isRowAnswer(i)).length} answer {value.gridRows.filter((_, i) => isRowAnswer(i)).length === 1 ? "row" : "rows"}
          </span>
          <span>·</span>
          <span>{answerCells.size} answer {answerCells.size === 1 ? "cell" : "cells"} total</span>
          <span>·</span>
          <span>{Object.keys(value.gridValues).length} static values</span>
        </div>
      )}
    </div>
  );
}

function cellKey(row: number, col: number, rows: string[], cols: string[]): string | null {
  if (row < 0 || col < 0 || row >= rows.length || col >= cols.length) return null;
  return `${rows[row]}-${cols[col]}`;
}

function FormField({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-800 bg-white placeholder:text-zinc-400 outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 w-full";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={cn(cls, "resize-none")} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />}
    </div>
  );
}
