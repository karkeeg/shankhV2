"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, Calculator as CalcIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { evaluateExcelFormula } from "@/components/exercise/ExcelGrid";
import { MiniCalculator } from "@/components/exercise/MiniCalculator";

// ─── A lightweight, freeform spreadsheet for the scratchpad ────────────────────
// Unlike the graded ExcelGrid, every cell here is editable and nothing is
// checked. Users keep records, enter data and use basic formulas (=A1+B2,
// =SUM(A1:A5), =AVERAGE(...)). State persists to localStorage under `storageKey`.

const MIN_ROWS = 12;
const MIN_COLS = 6;
const MAX_ROWS = 200;
const MAX_COLS = 26;
const DEFAULT_COL_W = 88;
const MIN_COL_W = 48;
const MAX_COL_W = 480;

type SheetState = {
  rows: number;
  cols: number;
  data: Record<string, string>;
  /** Per-column pixel widths, keyed by column index. Missing → DEFAULT_COL_W. */
  widths?: Record<number, number>;
};

/** 0-based column index → spreadsheet letters (0→A, 25→Z, 26→AA). */
function colLabel(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Trim floating-point noise and add thousands separators, like a desktop sheet. */
function fmtNumber(n: number): string {
  if (!Number.isFinite(n)) return "#ERR";
  const rounded = Math.round((n + Number.EPSILON) * 1e6) / 1e6;
  const [intPart, decPart] = String(rounded).split(".");
  const withCommas = Number(intPart).toLocaleString("en-US");
  return decPart ? `${withCommas}.${decPart}` : withCommas;
}

const cellKey = (row: number, col: number) => `${row}-${col}`;

export function ScratchSheet({
  storageKey,
  className,
}: {
  storageKey: string;
  className?: string;
}) {
  const [rows, setRows] = useState(MIN_ROWS);
  const [cols, setCols] = useState(MIN_COLS);
  const [data, setData] = useState<Record<string, string>>({});
  const [widths, setWidths] = useState<Record<number, number>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [showCalc, setShowCalc] = useState(false);
  const hydrated = useRef(false);

  // Hydrate once from storage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw) as Partial<SheetState>;
        if (p.data && typeof p.data === "object") setData(p.data);
        if (p.rows) setRows(Math.min(MAX_ROWS, Math.max(1, p.rows)));
        if (p.cols) setCols(Math.min(MAX_COLS, Math.max(1, p.cols)));
        if (p.widths && typeof p.widths === "object") setWidths(p.widths);
      }
    } catch { /* ignore */ }
    hydrated.current = true;
  }, [storageKey]);

  // Persist after hydration whenever anything changes — survives until the user
  // clears the sheet or logs out (logout wipes all scratch keys).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ rows, cols, data, widths } satisfies SheetState));
    } catch { /* ignore */ }
  }, [rows, cols, data, widths, storageKey]);

  const colWidth = (c: number) => widths[c] ?? DEFAULT_COL_W;

  // ── Delete a row/column ───────────────────────────────────────────────────
  // Cell keys are `${row}-${col}`; dropping a line means deleting that index and
  // shifting every higher index down by one. (Formula text isn't rewritten — this
  // is a freeform scratch sheet, so a reference into a deleted line just errors.)
  const remapData = (axis: "row" | "col", index: number) =>
    setData((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const dash = k.indexOf("-");
        const r = Number(k.slice(0, dash));
        const c = Number(k.slice(dash + 1));
        if (axis === "row") {
          if (r === index) continue;
          next[cellKey(r > index ? r - 1 : r, c)] = v;
        } else {
          if (c === index) continue;
          next[cellKey(r, c > index ? c - 1 : c)] = v;
        }
      }
      return next;
    });

  const deleteRow = (index: number) => {
    if (rows <= 1) return;
    remapData("row", index);
    setRows((r) => r - 1);
  };

  const deleteCol = (index: number) => {
    if (cols <= 1) return;
    remapData("col", index);
    setWidths((prev) => {
      const next: Record<number, number> = {};
      for (const [k, v] of Object.entries(prev)) {
        const c = Number(k);
        if (c === index) continue;
        next[c > index ? c - 1 : c] = v;
      }
      return next;
    });
    setCols((c) => c - 1);
  };

  // ── Column resize (drag the right edge of a header) ───────────────────────
  const drag = useRef<{ c: number; startX: number; startW: number } | null>(null);
  const onResizeMove = useCallback((e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const w = Math.max(MIN_COL_W, Math.min(MAX_COL_W, d.startW + (e.clientX - d.startX)));
    setWidths((prev) => ({ ...prev, [d.c]: w }));
  }, []);
  const onResizeEnd = useCallback(() => {
    drag.current = null;
    document.body.style.cursor = "";
    window.removeEventListener("pointermove", onResizeMove);
    window.removeEventListener("pointerup", onResizeEnd);
  }, [onResizeMove]);
  const startResize = (e: React.PointerEvent, c: number) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { c, startX: e.clientX, startW: colWidth(c) };
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", onResizeMove);
    window.addEventListener("pointerup", onResizeEnd);
  };
  // Drop any live resize listeners if we unmount mid-drag.
  useEffect(() => onResizeEnd, [onResizeEnd]);

  const getKeyFn = useCallback((r: number, c: number) => cellKey(r, c), []);

  // What the cell shows: the raw text while editing, otherwise the evaluated
  // value for formulas (leading "=") or the raw text for plain entries.
  const displayValue = (r: number, c: number): string => {
    const k = cellKey(r, c);
    const raw = data[k] ?? "";
    if (editing === k) return raw;
    if (raw.trim().startsWith("=")) {
      try {
        return fmtNumber(evaluateExcelFormula(raw, data, [], getKeyFn));
      } catch {
        return "#ERR";
      }
    }
    return raw;
  };

  const setCell = (k: string, value: string) =>
    setData((prev) => {
      if (value === "") {
        if (!(k in prev)) return prev;
        const next = { ...prev };
        delete next[k];
        return next;
      }
      return { ...prev, [k]: value };
    });

  const focusCell = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return;
    document.getElementById(`scratch-cell-${cellKey(r, c)}`)?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    if (e.key === "Enter") { e.preventDefault(); focusCell(r + 1, c); }
    else if (e.key === "ArrowDown") { e.preventDefault(); focusCell(r + 1, c); }
    else if (e.key === "ArrowUp") { e.preventDefault(); focusCell(r - 1, c); }
  };

  const clearAll = () => {
    if (typeof window !== "undefined" && !window.confirm("Clear the whole sheet?")) return;
    setData({});
  };

  return (
    <div className={cn("relative flex flex-col h-full bg-white", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-200 bg-[#FAF7F2] flex-shrink-0">
        <button
          onClick={() => setRows((r) => Math.min(MAX_ROWS, r + 1))}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:text-[#01696F] hover:border-[#01696F]/30 text-[11px] font-bold transition active:scale-95"
        >
          <Plus size={12} /> Row
        </button>
        <button
          onClick={() => setCols((c) => Math.min(MAX_COLS, c + 1))}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:text-[#01696F] hover:border-[#01696F]/30 text-[11px] font-bold transition active:scale-95"
        >
          <Plus size={12} /> Column
        </button>
        <span className="ml-auto text-[10px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">
          Try =SUM(A1:A5)
        </span>
        <button
          onClick={() => setShowCalc((s) => !s)}
          aria-pressed={showCalc}
          title="Calculator"
          className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition active:scale-95",
            showCalc
              ? "bg-[#01696F] border-transparent text-white"
              : "bg-white border-zinc-200 text-zinc-600 hover:text-[#01696F] hover:border-[#01696F]/30"
          )}
        >
          <CalcIcon size={12} /> <span className="hidden sm:inline">Calc</span>
        </button>
        <button
          onClick={clearAll}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-500 hover:text-rose-600 hover:border-rose-300 text-[11px] font-bold transition active:scale-95"
        >
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="border-collapse select-none">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-20 w-10 min-w-10 h-7 bg-zinc-100 border border-zinc-200" />
              {Array.from({ length: cols }).map((_, c) => (
                <th
                  key={c}
                  style={{ width: colWidth(c), minWidth: colWidth(c) }}
                  className="group/col relative sticky top-0 z-10 h-7 bg-zinc-100 border border-zinc-200 text-[10px] font-black text-zinc-500 uppercase p-0"
                >
                  <span>{colLabel(c)}</span>
                  {cols > 1 && (
                    <button
                      onClick={() => deleteCol(c)}
                      title={`Delete column ${colLabel(c)}`}
                      className="absolute top-1/2 right-2 -translate-y-1/2 w-3.5 h-3.5 flex items-center justify-center rounded text-zinc-400 opacity-0 group-hover/col:opacity-100 hover:bg-rose-100 hover:text-rose-500 transition"
                    >
                      <X size={9} />
                    </button>
                  )}
                  {/* Drag the right edge to resize the column. */}
                  <span
                    onPointerDown={(e) => startResize(e, c)}
                    className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[#01696F]/40"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                <td className="group/row relative sticky left-0 z-10 w-10 min-w-10 h-7 bg-zinc-100 border border-zinc-200 text-center text-[10px] font-black text-zinc-500">
                  <span className={cn(rows > 1 && "group-hover/row:opacity-0")}>{r + 1}</span>
                  {rows > 1 && (
                    <button
                      onClick={() => deleteRow(r)}
                      title={`Delete row ${r + 1}`}
                      className="absolute inset-0 m-auto w-4 h-4 flex items-center justify-center rounded text-zinc-400 opacity-0 group-hover/row:opacity-100 hover:bg-rose-100 hover:text-rose-500 transition"
                    >
                      <X size={10} />
                    </button>
                  )}
                </td>
                {Array.from({ length: cols }).map((_, c) => {
                  const k = cellKey(r, c);
                  const isFormula = (data[k] ?? "").trim().startsWith("=");
                  return (
                    <td key={c} style={{ width: colWidth(c) }} className="p-0 border border-zinc-200">
                      <input
                        id={`scratch-cell-${k}`}
                        value={displayValue(r, c)}
                        onFocus={() => setEditing(k)}
                        onBlur={() => setEditing((cur) => (cur === k ? null : cur))}
                        onChange={(e) => setCell(k, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, r, c)}
                        className={cn(
                          "w-full h-7 px-2 text-[12px] bg-transparent outline-none focus:bg-[#E6F0F1] focus:ring-1 focus:ring-inset focus:ring-[#01696F]/40",
                          isFormula && editing !== k ? "text-[#01696F] font-semibold text-right" : "text-zinc-800"
                        )}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculator pop-over */}
      {showCalc && (
        <div className="absolute bottom-3 right-3 z-30 animate-fade-in-up">
          <MiniCalculator onClose={() => setShowCalc(false)} />
        </div>
      )}
    </div>
  );
}

export default ScratchSheet;
