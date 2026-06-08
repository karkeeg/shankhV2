"use client";

import React, { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
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
  Menu,
  ChevronUp,
  AlignLeft,
  AlignCenter,
  AlignRight,
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

/* ── Formula Evaluation Engine ───────────────────────────────────── */

export function parseCellRef(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-Za-z]+)([0-9]+)$/);
  if (!match) return null;
  const colStr = match[1].toUpperCase();
  const rowStr = match[2];
  
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
  }
  col -= 1;
  
  const row = parseInt(rowStr, 10) - 1;
  return { row, col };
}

export function parseRange(rangeStr: string): { startRow: number; startCol: number; endRow: number; endCol: number } | null {
  const parts = rangeStr.split(":");
  if (parts.length !== 2) return null;
  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);
  if (!start || !end) return null;
  return {
    startRow: Math.min(start.row, end.row),
    startCol: Math.min(start.col, end.col),
    endRow: Math.max(start.row, end.row),
    endCol: Math.max(start.col, end.col),
  };
}

export function getRowIndexFromKey(key: string, table: (string | number | null)[][]): number {
  const lowerKey = key.toLowerCase();
  for (let r = 0; r < table.length; r++) {
    const cellVal = table[r]?.[0];
    if (typeof cellVal === "string") {
      const lowerCell = cellVal.toLowerCase();
      if (lowerKey === "base_val" && (lowerCell.includes("base") || lowerCell.includes("parameter"))) {
        return r;
      }
      if (lowerKey === "growth_rate" && (lowerCell.includes("growth") || lowerCell.includes("rate"))) {
        return r;
      }
      if (lowerKey === "forecast_val" && (lowerCell.includes("forecast") || lowerCell.includes("value"))) {
        return r;
      }
    }
  }
  if (lowerKey === "base_val") return 0;
  if (lowerKey === "growth_rate") return 1;
  if (lowerKey === "forecast_val") return 2;
  return -1;
}

export function evaluateSumOrAverage(
  funcName: "SUM" | "AVERAGE",
  argsStr: string,
  grid: Record<string, string>,
  table: (string | number | null)[][],
  getCellKeyFn: (row: number, col: number) => string,
  visited: Set<string>
): number {
  const parts = argsStr.split(",");
  let sum = 0;
  let count = 0;
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes(":")) {
      const range = parseRange(trimmed);
      if (range) {
        for (let r = range.startRow; r <= range.endRow; r++) {
          for (let c = range.startCol; c <= range.endCol; c++) {
            const cellKey = getCellKeyFn(r, c);
            if (!visited.has(cellKey)) {
              sum += getCellValue(r, c, grid, table, getCellKeyFn, visited);
              count++;
            }
          }
        }
      }
    } else {
      const cell = parseCellRef(trimmed);
      if (cell) {
        const cellKey = getCellKeyFn(cell.row, cell.col);
        if (!visited.has(cellKey)) {
          sum += getCellValue(cell.row, cell.col, grid, table, getCellKeyFn, visited);
          count++;
        }
      } else {
        const val = parseFloat(trimmed);
        if (!isNaN(val)) {
          sum += val;
          count++;
        }
      }
    }
  }
  return funcName === "SUM" ? sum : (count > 0 ? sum / count : 0);
}

export function getCellValue(
  row: number,
  col: number,
  grid: Record<string, string>,
  table: (string | number | null)[][],
  getCellKeyFn: (row: number, col: number) => string,
  visited: Set<string>
): number {
  const key = getCellKeyFn(row, col);
  const newVisited = new Set(visited);
  newVisited.add(key);

  let cellVal = grid[key];
  if (cellVal === undefined) {
    const tableVal = table[row]?.[col];
    cellVal = tableVal !== undefined && tableVal !== null ? String(tableVal) : "";
  }

  const trimmed = cellVal.trim();
  if (!trimmed) return 0;

  if (trimmed.startsWith("=") || trimmed.includes("[") || /[A-Za-z]+[0-9]+/.test(trimmed)) {
    return evaluateExcelFormula(trimmed, grid, table, getCellKeyFn, newVisited);
  }

  const cleanStr = trimmed.replace(/[$,₹]/g, "").replace(/,/g, "");
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return 0;
  if (cleanStr.endsWith("%")) {
    return num / 100;
  }
  return num;
}

export function evaluateExcelFormula(
  expression: string,
  grid: Record<string, string>,
  table: (string | number | null)[][],
  getCellKeyFn: (row: number, col: number) => string,
  visited: Set<string> = new Set()
): number {
  let expr = expression.trim();
  if (expr.startsWith("=")) {
    expr = expr.substring(1).trim();
  }

  // Handle SUM
  while (true) {
    const sumMatch = expr.match(/SUM\(([^)]+)\)/i);
    if (!sumMatch) break;
    const val = evaluateSumOrAverage("SUM", sumMatch[1], grid, table, getCellKeyFn, visited);
    expr = expr.replace(sumMatch[0], String(val));
  }

  // Handle AVERAGE
  while (true) {
    const avgMatch = expr.match(/AVERAGE\(([^)]+)\)/i);
    if (!avgMatch) break;
    const val = evaluateSumOrAverage("AVERAGE", avgMatch[1], grid, table, getCellKeyFn, visited);
    expr = expr.replace(avgMatch[0], String(val));
  }

  // Replace DB references e.g. base_val[1]
  expr = expr.replace(/([a-zA-Z_0-9]+)\[([0-9]+)\]/g, (match, rowKey, colStr) => {
    const col = parseInt(colStr, 10);
    const row = getRowIndexFromKey(rowKey, table);
    if (row === -1) return "0";
    const cellKey = getCellKeyFn(row, col);
    if (visited.has(cellKey)) return "0";
    return String(getCellValue(row, col, grid, table, getCellKeyFn, visited));
  });

  // Replace standard Excel cell references e.g. B1, C2
  expr = expr.replace(/\b([A-Za-z]+)([0-9]+)\b/g, (match) => {
    if (["SUM", "AVERAGE"].includes(match.toUpperCase())) return match;
    const cell = parseCellRef(match);
    if (!cell) return match;
    const cellKey = getCellKeyFn(cell.row, cell.col);
    if (visited.has(cellKey)) return "0";
    return String(getCellValue(cell.row, cell.col, grid, table, getCellKeyFn, visited));
  });

  // Safely evaluate pure math expression
  const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, "");
  if (!sanitized.trim()) return 0;
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${sanitized});`)();
    const num = parseFloat(result);
    return isFinite(num) ? num : 0;
  } catch (e) {
    console.error("Error evaluating math expression:", expr, e);
    return 0;
  }
}

/* ── ExcelGrid Component ────────────────────────────────────────── */

interface ExcelGridProps {
  table: (string | number | null)[][];
  inputs?: {
    row: number;
    col: number;
    correctValue: string | number;
    placeholder?: string;
    formula?: string;
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
  /** Optional tab index for multi-tab support */
  activeTabIndex?: number;
  /** Optional list of tab names */
  tabNames?: string[];
  /** Callback when a tab is clicked */
  onTabChange?: (index: number) => void;
  /** If true, shows the rich spreadsheet toolbar (for canvas exercises) */
  showToolbar?: boolean;
  sheetTabName?: string;
  colLabels?: string[];
  rowLabels?: string[];
  /** External selection synchronization (e.g. for admin builder) */
  selectedCell?: { row: number; col: number } | null;
  onSelectCell?: (cell: { row: number; col: number } | null) => void;
  /** Show "X / Y cells answered" progress bar below the grid */
  showProgress?: boolean;
}

interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: "left" | "center" | "right";
  bg?: string;
}

const FORMULA_COLORS = [
  "outline outline-2 outline-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] z-10",
  "outline outline-2 outline-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] z-10",
  "outline outline-2 outline-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] z-10",
  "outline outline-2 outline-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] z-10",
  "outline outline-2 outline-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)] z-10",
  "outline outline-2 outline-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] z-10",
];

export const ExcelGrid = ({
  table,
  inputs = [],
  dropdowns = [],
  userInputs,
  setUserInputs,
  isValidated,
  feedback,
  activeTabIndex = 0,
  tabNames = [],
  onTabChange,
  sheetTabName,
  showToolbar = false,
  colLabels,
  rowLabels,
  selectedCell,
  onSelectCell,
  showProgress = false,
}: ExcelGridProps) => {
  // Sync selection state locally or lift up
  const [internalSelectedCell, setInternalSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>({ row: 0, col: 0 });

  const activeSelectedCell = selectedCell !== undefined ? selectedCell : internalSelectedCell;
  
  const setActiveSelectedCell = (cell: { row: number; col: number } | null) => {
    if (onSelectCell) {
      onSelectCell(cell);
    } else {
      setInternalSelectedCell(cell);
    }
  };

  // Selection vs Edit modes
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [cellStyles, setCellStyles] = useState<Record<string, CellStyle>>({});

  // Formula tooltip (fixed-position to escape overflow-auto clipping)
  const [formulaTooltip, setFormulaTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // Reset edit mode when selection changes (inline during render to avoid useEffect warning)
  const [prevSelected, setPrevSelected] = useState<{ row: number; col: number } | null>(activeSelectedCell);
  const selectedChanged = 
    (activeSelectedCell === null && prevSelected !== null) ||
    (activeSelectedCell !== null && prevSelected === null) ||
    (activeSelectedCell !== null && prevSelected !== null && 
     (activeSelectedCell.row !== prevSelected.row || activeSelectedCell.col !== prevSelected.col));

  if (selectedChanged) {
    setPrevSelected(activeSelectedCell);
    setIsEditing(false);
  }

  const handleInputChange = (row: number, col: number, value: string) => {
    if (isValidated) return;
    const key = getCellKey(row, col);
    setUserInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getCellKey = (row: number, col: number) => {
    if (rowLabels && colLabels) {
      const rLabel = rowLabels[row] !== undefined ? String(rowLabels[row]) : String(row);
      const cLabel = colLabels[col] !== undefined ? String(colLabels[col]) : String(col);
      return `${rLabel}-${cLabel}`;
    }
    if (tabNames && tabNames.length > 0) {
      return `${activeTabIndex}-${row}-${col}`;
    }
    return `${row}-${col}`;
  };

  const getRawValue = (row: number, col: number) => {
    const key = getCellKey(row, col);
    if (userInputs[key] !== undefined) {
      return userInputs[key];
    }
    const tableVal = table[row]?.[col];
    return tableVal !== undefined && tableVal !== null ? String(tableVal) : "";
  };

  const getDisplayValue = (r: number, c: number) => {
    const key = getCellKey(r, c);
    let val = userInputs[key];
    if (val === undefined) {
      const tableVal = table[r]?.[c];
      val = tableVal !== undefined && tableVal !== null ? String(tableVal) : "";
    }
    
    const trimmed = val.trim();
    if (!trimmed) return "";
    
    // If it's a formula, evaluate it
    if (trimmed.startsWith("=") || trimmed.includes("[") || /[A-Za-z]+[0-9]+/.test(trimmed)) {
      try {
        const evaluated = evaluateExcelFormula(trimmed, userInputs, table, getCellKey);
        return String(Number(evaluated.toFixed(4)));
      } catch {
        return "#VALUE!";
      }
    }
    
    return val;
  };

  const currentFormulaValue = activeSelectedCell
    ? getRawValue(activeSelectedCell.row, activeSelectedCell.col)
    : "";

  // Dynamic formula reference parsing
  const activeFormula = isEditing && activeSelectedCell
    ? editValue
    : (activeSelectedCell ? getRawValue(activeSelectedCell.row, activeSelectedCell.col) : "");

  const referencedCells = useMemo(() => {
    if (!activeFormula || !activeFormula.trim().startsWith("=")) return [];
    const refs: { row: number; col: number; ref: string }[] = [];
    
    // Standard references A1, B2, etc.
    const matches = Array.from(activeFormula.matchAll(/\b([A-Za-z]+)([0-9]+)\b/g));
    for (const match of matches) {
      const matchStr = match[0];
      if (["SUM", "AVERAGE"].includes(matchStr.toUpperCase())) continue;
      const parsed = parseCellRef(matchStr);
      if (parsed) {
        refs.push({ row: parsed.row, col: parsed.col, ref: matchStr });
      }
    }
    
    // DB key references like revenue[2]
    const dbMatches = Array.from(activeFormula.matchAll(/([a-zA-Z_0-9]+)\[([0-9]+)\]/g));
    for (const match of dbMatches) {
      const rowKey = match[1];
      const col = parseInt(match[2], 10);
      const row = getRowIndexFromKey(rowKey, table);
      if (row !== -1) {
        refs.push({ row, col, ref: match[0] });
      }
    }
    
    return refs;
  }, [activeFormula, table]);

  // Edit Mode actions
  const startEditing = (row: number, col: number, initialChar?: string) => {
    if (isValidated) return;
    const inputConfig = inputs.find((i) => i.row === row && i.col === col);
    if (!inputConfig) return; // Only allow editing if registered in editable inputs list
    
    setIsEditing(true);
    setEditValue(initialChar !== undefined ? initialChar : getRawValue(row, col));
  };

  const commitEdit = (row: number, col: number, value: string) => {
    handleInputChange(row, col, value);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  // Keyboard navigation handler
  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!activeSelectedCell) return;
    const { row, col } = activeSelectedCell;
    const numRows = table.length;
    const numCols = table[0]?.length || 0;

    // Formatting Hotkeys
    if ((e.ctrlKey || e.metaKey) && !isEditing) {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleStyle("bold");
        return;
      }
      if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        toggleStyle("italic");
        return;
      }
      if (e.key.toLowerCase() === "u") {
        e.preventDefault();
        toggleStyle("underline");
        return;
      }
    }

    if (isEditing) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit(row, col, editValue);
        if (row + 1 < numRows) {
          setActiveSelectedCell({ row: row + 1, col });
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        commitEdit(row, col, editValue);
        if (e.shiftKey) {
          if (col - 1 >= 0) setActiveSelectedCell({ row, col: col - 1 });
        } else {
          if (col + 1 < numCols) setActiveSelectedCell({ row, col: col + 1 });
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
      return;
    }

    // Selection mode navigation
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (row - 1 >= 0) setActiveSelectedCell({ row: row - 1, col });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (row + 1 < numRows) setActiveSelectedCell({ row: row + 1, col });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (col - 1 >= 0) setActiveSelectedCell({ row, col: col - 1 });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (col + 1 < numCols) setActiveSelectedCell({ row, col: col + 1 });
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        if (col - 1 >= 0) setActiveSelectedCell({ row, col: col - 1 });
      } else {
        if (col + 1 < numCols) setActiveSelectedCell({ row, col: col + 1 });
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        if (row - 1 >= 0) setActiveSelectedCell({ row: row - 1, col });
      } else {
        startEditing(row, col);
      }
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const inputConfig = inputs.find((i) => i.row === row && i.col === col);
      if (inputConfig && !isValidated) {
        handleInputChange(row, col, "");
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const inputConfig = inputs.find((i) => i.row === row && i.col === col);
      if (inputConfig && !isValidated) {
        e.preventDefault();
        startEditing(row, col, e.key);
      }
    }
  };

  // Formatting togglers
  const toggleStyle = (styleKey: keyof Omit<CellStyle, "align" | "bg">) => {
    if (!activeSelectedCell) return;
    const key = getCellKey(activeSelectedCell.row, activeSelectedCell.col);
    setCellStyles((prev) => {
      const current = prev[key] || {};
      return {
        ...prev,
        [key]: { ...current, [styleKey]: !current[styleKey] },
      };
    });
  };

  const setAlign = (alignment: "left" | "center" | "right") => {
    if (!activeSelectedCell) return;
    const key = getCellKey(activeSelectedCell.row, activeSelectedCell.col);
    setCellStyles((prev) => {
      const current = prev[key] || {};
      return {
        ...prev,
        [key]: { ...current, align: alignment },
      };
    });
  };

  const toggleBgColor = () => {
    if (!activeSelectedCell) return;
    const key = getCellKey(activeSelectedCell.row, activeSelectedCell.col);
    const currentStyle = cellStyles[key] || {};
    setCellStyles((prev) => ({
      ...prev,
      [key]: { ...currentStyle, bg: currentStyle.bg === "#FEF3C7" ? "" : "#FEF3C7" },
    }));
  };

  const currentCellStyles = activeSelectedCell
    ? cellStyles[getCellKey(activeSelectedCell.row, activeSelectedCell.col)] || {}
    : {};

  // Generate Column Headers (A, B, C...) with a minimum of 8 columns to feel like Excel
  const colHeaders = useMemo(() => {
    const headers = colLabels ? [...colLabels] : Array.from({ length: table[0]?.length || 0 }, (_, i) => String.fromCharCode(65 + i));
    const minCols = 8;
    if (headers.length < minCols) {
      for (let i = headers.length; i < minCols; i++) {
        headers.push(String.fromCharCode(65 + i));
      }
    }
    return headers;
  }, [colLabels, table]);

  // Compute cell address label (e.g. "E5")
  const cellAddress = activeSelectedCell
    ? `${String.fromCharCode(65 + activeSelectedCell.col)}${activeSelectedCell.row + 1}`
    : "";

  // Computed value for formula bar badge (when raw value is a formula)
  const formulaComputedValue = useMemo(() => {
    if (!currentFormulaValue.trim().startsWith("=")) return null;
    try {
      const result = evaluateExcelFormula(currentFormulaValue, userInputs, table, getCellKey);
      const rounded = Number(result.toFixed(4));
      return isFinite(rounded) ? String(rounded) : null;
    } catch { return null; }
  }, [currentFormulaValue, userInputs, table]);

  // Progress stats — count non-empty answer cells vs total answer cells
  const progressStats = useMemo(() => {
    if (!showProgress || inputs.length === 0) return null;
    const answered = inputs.filter(({ row, col }) => {
      const k = getCellKey(row, col);
      return (userInputs[k] ?? "").trim() !== "";
    }).length;
    return { answered, total: inputs.length };
  }, [showProgress, inputs, userInputs, getCellKey]);

  return (
    <>
    <div className="flex flex-col h-full bg-white border border-zinc-200 shadow-xl overflow-hidden font-sans ring-1 ring-zinc-200">
      {/* Rich Toolbar (shown for canvas-style exercises or admin editing) */}
      {showToolbar && (
        <div className="flex items-center gap-1 px-4 py-1.5 m-3 rounded-3xl bg-[#EDF2FA] border-b border-zinc-300 shrink-0 overflow-x-auto h-10 shadow-sm">
          {/* Utility icons */}
          <ToolbarBtn icon={<Search size={16} />} />
          <ToolbarBtn icon={<Undo2 size={16} />} />
          <ToolbarBtn icon={<Redo2 size={16} />} />
          <ToolbarBtn icon={<Printer size={16} />} />
          
          <button
            onClick={toggleBgColor}
            className={cn(
              "p-1.5 rounded hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-700 transition-colors shrink-0",
              currentCellStyles.bg && "bg-amber-100 text-amber-700 hover:bg-amber-100"
            )}
            title="Highlight Cell background"
          >
            <PaintBucket size={16} />
          </button>

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
            <button
              onClick={() => toggleStyle("bold")}
              className={cn(
                "p-1.5 rounded hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-700 transition-colors shrink-0",
                currentCellStyles.bold && "bg-zinc-300 text-zinc-900 hover:bg-zinc-300"
              )}
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => toggleStyle("italic")}
              className={cn(
                "p-1.5 rounded hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-700 transition-colors shrink-0",
                currentCellStyles.italic && "bg-zinc-300 text-zinc-900 hover:bg-zinc-300"
              )}
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => toggleStyle("strikethrough")}
              className={cn(
                "p-1.5 rounded hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-700 transition-colors shrink-0",
                currentCellStyles.strikethrough && "bg-zinc-300 text-zinc-900 hover:bg-zinc-300"
              )}
            >
              <Strikethrough size={16} />
            </button>
            <button
              onClick={() => toggleStyle("underline")}
              className={cn(
                "p-1.5 rounded hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-700 transition-colors shrink-0",
                currentCellStyles.underline && "bg-[#dbeafe] text-blue-700 font-bold"
              )}
            >
              <span className="text-xs font-bold underline decoration-2 decoration-zinc-400 underline-offset-2">A</span>
            </button>
          </div>

          <ToolbarDivider />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setAlign("left")}
              className={cn(
                "p-1.5 rounded hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-700 transition-colors shrink-0",
                currentCellStyles.align === "left" && "bg-zinc-300 text-zinc-900"
              )}
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={() => setAlign("center")}
              className={cn(
                "p-1.5 rounded hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-700 transition-colors shrink-0",
                currentCellStyles.align === "center" && "bg-zinc-300 text-zinc-900"
              )}
            >
              <AlignCenter size={16} />
            </button>
            <button
              onClick={() => setAlign("right")}
              className={cn(
                "p-1.5 rounded hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-700 transition-colors shrink-0",
                currentCellStyles.align === "right" && "bg-zinc-300 text-zinc-900"
              )}
            >
              <AlignRight size={16} />
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
      <div className="flex items-center gap-0 bg-[#F2F2F2] border-b border-zinc-300 shrink-0 h-9">
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
        <div className="flex-1 flex items-center gap-2 pr-3">
          <input
            type="text"
            value={isEditing ? editValue : currentFormulaValue}
            onChange={(e) => {
              if (activeSelectedCell && !isValidated) {
                if (!isEditing) setIsEditing(true);
                setEditValue(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && activeSelectedCell) {
                e.preventDefault();
                commitEdit(activeSelectedCell.row, activeSelectedCell.col, editValue);
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancelEdit();
              }
            }}
            disabled={isValidated}
            className="flex-1 px-4 py-1 border-none outline-none text-sm text-zinc-800 font-bold tracking-tight bg-transparent animate-fade-in"
            placeholder="Enter value or formula (e.g. =B1*(1+C2))"
          />
          {formulaComputedValue !== null && (
            <span className="shrink-0 text-[10px] font-black text-[#01696F] bg-[#E6F0F1] border border-[#01696F]/20 px-2 py-0.5 rounded-lg whitespace-nowrap select-none">
              = {formulaComputedValue}
            </span>
          )}
        </div>
      </div>

      {/* Spreadsheet Main Area */}
      <div
        tabIndex={0}
        onKeyDown={handleGridKeyDown}
        className="flex-1 overflow-auto bg-zinc-50 relative focus:outline-none [&_td]:overflow-visible"
      >
        <table className="border-collapse table-fixed w-full">
          <thead>
            <tr>
              {/* Top-Left Empty Corner */}
              <th className="w-10 h-6 bg-zinc-100 border border-zinc-200 sticky top-0 left-0 z-20"></th>
              {colHeaders.map((header, idx) => {
                const isActiveCol = activeSelectedCell?.col === idx;
                return (
                  <th
                    key={idx}
                    className={cn(
                      "h-6 bg-zinc-100 border border-zinc-200 text-zinc-500 font-normal text-[10px] uppercase sticky top-0 z-10 transition-colors",
                      isActiveCol && "bg-zinc-200/90 text-[#7C5DFA] font-bold border-b border-[#7C5DFA]",
                      idx === 0 ? "w-80" : "w-40"
                    )}
                  >
                    {header}
                  </th>
                );
              })}
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
                row.some(cell =>
                  typeof cell === "string" && /(Historical|Projected)/i.test(cell)
                );

              if (isSectionRow) {
                return (
                  <tr key={rowIndex}>
                    {/* Row Headers (1, 2, 3...) */}
                    <td className={cn(
                      "w-10 h-8 bg-zinc-100 border border-zinc-200 text-zinc-400 text-center text-[10px] font-bold sticky left-0 z-10 transition-colors",
                      activeSelectedCell?.row === rowIndex && "bg-zinc-200/90 text-[#7C5DFA] font-bold border-r border-[#7C5DFA]"
                    )}>
                      {rowIndex + 1}
                    </td>
                    {colHeaders.map((_, colIndex) => {
                      if (colIndex >= row.length) {
                        return (
                          <td 
                            key={colIndex}
                            className="h-8 border border-zinc-200 bg-[#7C5DFA]/15"
                          />
                        );
                      }
                      const cell = row[colIndex];
                      return (
                        <td
                          key={colIndex}
                          className={cn(
                            "h-8 border border-zinc-200 bg-[#7C5DFA]/15 px-2 py-1 text-[13px]",
                            colIndex === 0
                              ? "text-[#312e81] font-bold"
                              : "text-[#312e81] font-semibold text-center"
                          )}
                        >
                          {colIndex === 0 && rowLabels ? rowLabels[rowIndex] ?? cell : cell}
                        </td>
                      );
                    })}
                  </tr>
                );
              }

              return (
                <tr key={rowIndex}>
                  {/* Row Headers (1, 2, 3...) */}
                  <td className={cn(
                    "w-10 h-8 bg-zinc-100 border border-zinc-200 text-zinc-400 text-center text-[10px] font-bold sticky left-0 z-10 transition-colors",
                    activeSelectedCell?.row === rowIndex && "bg-zinc-200/90 text-[#7C5DFA] font-bold border-r border-[#7C5DFA]"
                  )}>
                    {rowIndex + 1}
                  </td>

                  {colHeaders.map((_, colIndex) => {
                    if (colIndex >= row.length) {
                      const isSelected =
                        activeSelectedCell?.row === rowIndex &&
                        activeSelectedCell?.col === colIndex;
                      return (
                        <td
                          key={colIndex}
                          onClick={() => {
                            setActiveSelectedCell({ row: rowIndex, col: colIndex });
                            setIsEditing(false);
                          }}
                          className={cn(
                            "h-8 border border-zinc-200 bg-white relative p-0 transition-all cursor-pointer",
                            isSelected &&
                            "outline outline-2 outline-[#7C5DFA] z-[5] shadow-inner"
                          )}
                        >
                          {isSelected && !isEditing && !isValidated && (
                            <div 
                              className="absolute w-2 h-2 bg-[#7C5DFA] border border-white bottom-[-4px] right-[-4px] cursor-crosshair z-[10] shadow-sm"
                            />
                          )}
                          {isSelected && !isValidated && (
                            <div className="absolute inset-0 bg-[#7C5DFA]/5 pointer-events-none" />
                          )}
                        </td>
                      );
                    }

                    const cell = row[colIndex];
                    const inputConfig = inputs.find(
                      (i) => i.row === rowIndex && i.col === colIndex,
                    );
                    const dropdownConfig = dropdowns.find(
                      (d) => d.row === rowIndex && d.col === colIndex,
                    );
                    const isSelected =
                      activeSelectedCell?.row === rowIndex &&
                      activeSelectedCell?.col === colIndex;
                    const key = getCellKey(rowIndex, colIndex);

                    // Check if cell is referenced in currently viewed formula
                    const refIndex = referencedCells.findIndex(r => r.row === rowIndex && r.col === colIndex);
                    const isReferenced = refIndex !== -1;
                    const referencedColorClass = isReferenced ? FORMULA_COLORS[refIndex % FORMULA_COLORS.length] : "";

                    const rowStyle = isSubHeaderRow
                      ? "bg-zinc-100 text-zinc-500 font-semibold"
                      : "";

                    const cellStyle = cellStyles[key] || {};
                    const customStyle: React.CSSProperties = {
                      fontWeight: cellStyle.bold ? "bold" : undefined,
                      fontStyle: cellStyle.italic ? "italic" : undefined,
                      textDecoration: cn(
                        cellStyle.underline && "underline",
                        cellStyle.strikethrough && "line-through"
                      ) || undefined,
                      textAlign: cellStyle.align || undefined,
                      backgroundColor: cellStyle.bg || undefined,
                    };

                    return (
                      <td
                        key={colIndex}
                        onClick={() => {
                          setActiveSelectedCell({ row: rowIndex, col: colIndex });
                          setIsEditing(false);
                        }}
                        onDoubleClick={() => startEditing(rowIndex, colIndex)}
                        className={cn(
                          "h-8 border border-zinc-200 bg-white relative p-0 transition-all cursor-pointer overflow-visible",
                          rowStyle,
                          // Row-label column — distinct frozen-pane look
                          colIndex === 0 && rowLabels && "bg-zinc-50 border-r-2 border-r-zinc-300",
                          // Answer cell — visible teal tint with left accent
                          (inputConfig || dropdownConfig) && !isValidated && colIndex !== 0 &&
                            "bg-[#E8F5F5] border-l-[3px] border-l-[#01696F]/40",
                          // Validated correct
                          isValidated && feedback[key] === true &&
                            "bg-emerald-50 border-l-[3px] border-l-emerald-500",
                          // Validated wrong
                          isValidated && feedback[key] === false &&
                            "bg-rose-50 border-l-[3px] border-l-rose-500",
                          isSelected && "outline outline-2 outline-[#7C5DFA] z-[5] shadow-inner",
                          isReferenced && !isSelected && referencedColorClass,
                        )}
                        style={{
                          backgroundColor: cellStyle.bg || undefined,
                        }}
                        title={inputConfig?.formula ? `Formula: ${inputConfig.formula}` : undefined}
                      >
                        {inputConfig ? (
                          <div
                            className="w-full h-full relative overflow-visible"
                            style={customStyle}
                            onMouseEnter={inputConfig.formula ? (e) => {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setFormulaTooltip({ text: inputConfig.formula!, x: rect.left + rect.width / 2, y: rect.top });
                            } : undefined}
                            onMouseLeave={inputConfig.formula ? () => setFormulaTooltip(null) : undefined}
                          >
                            {isSelected && isEditing ? (
                              <input
                                type="text"
                                placeholder={inputConfig.placeholder || ""}
                                className="w-full h-full px-2 py-1 bg-transparent border-none outline-none text-[13px] text-[#7C5DFA] font-bold text-center"
                                style={customStyle}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => commitEdit(rowIndex, colIndex, editValue)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === "Tab" || e.key === "Escape") {
                                    // Bubble up to table wrapper listener
                                  } else {
                                    e.stopPropagation();
                                  }
                                }}
                                disabled={isValidated && feedback[key]}
                                autoFocus
                              />
                            ) : (
                              <div
                                className="w-full h-full px-2 py-1 text-[13px] text-zinc-800 font-semibold text-center flex items-center justify-center cursor-pointer"
                                style={customStyle}
                              >
                                {getDisplayValue(rowIndex, colIndex)}
                              </div>
                            )}
                            {isValidated && feedback[key] === false && inputConfig.correctValue && (
                              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10">
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 border-t border-emerald-300 w-full text-center px-1 leading-tight py-0.5 truncate">
                                  ✓ {inputConfig.correctValue}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : dropdownConfig ? (
                          <div className="w-full h-full relative group" style={customStyle}>
                            <select
                              className="w-full h-full px-2 py-1 bg-transparent border-none outline-none text-[13px] text-zinc-800 font-semibold appearance-none cursor-pointer text-center"
                              style={customStyle}
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
                              (rowIndex === 0 && !rowLabels)
                                ? "text-zinc-400 font-bold uppercase text-[10px]"
                                : colIndex === 0 && rowLabels
                                  ? "text-zinc-700 font-semibold"
                                  : "text-zinc-700",
                            )}
                            style={customStyle}
                          >
                            {colIndex === 0 && rowLabels ? rowLabels[rowIndex] ?? cell : cell}
                          </div>
                        )}

                        {/* Selection border fill handle */}
                        {isSelected && !isEditing && !isValidated && (
                          <div 
                            className="absolute w-2 h-2 bg-[#7C5DFA] border border-white bottom-[-4px] right-[-4px] cursor-crosshair z-[10] shadow-sm"
                            title="Drag fill"
                          />
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
            {/* Empty Rows Padding — 3 ghost rows to keep spreadsheet feel */}
            {Array.from({ length: Math.max(0, 3 - table.length) }).map(
              (_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="h-8 bg-zinc-100 border border-zinc-200 text-zinc-400 text-center text-[10px] sticky left-0">
                    {table.length + i + 1}
                  </td>
                  {colHeaders.map((_, idx) => (
                    <td
                      key={idx}
                      className="h-8 border border-zinc-200 bg-white"
                    ></td>
                  ))}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Progress bar (shown when showProgress=true) */}
      {progressStats && (
        <div className="flex items-center gap-3 px-4 py-1.5 bg-[#F0FAFA] border-t border-[#01696F]/15 shrink-0">
          <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#01696F] rounded-full transition-all duration-500"
              style={{ width: `${progressStats.total > 0 ? Math.round((progressStats.answered / progressStats.total) * 100) : 0}%` }}
            />
          </div>
          <span className={cn(
            "text-[10px] font-black shrink-0 tabular-nums",
            progressStats.answered === progressStats.total && progressStats.total > 0
              ? "text-emerald-600"
              : "text-[#01696F]"
          )}>
            {progressStats.answered} / {progressStats.total} cells answered
          </span>
        </div>
      )}

      {/* Spreadsheet Bottom Tabs Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#d4d7db] border-t border-zinc-400/30 text-[10px] font-bold text-zinc-500 h-10 shadow-inner">
        <div className="flex items-center h-full">
          <div className="p-1.5 hover:bg-zinc-300 rounded-md cursor-pointer transition-colors mr-2">
            <Plus size={14} className="stroke-[3px]" />
          </div>
          <div className="p-1.5 hover:bg-zinc-300 rounded-md cursor-pointer transition-colors mr-4">
            <Menu size={14} className="stroke-[3px]" />
          </div>
          <div className="flex items-center h-full pt-1 overflow-x-auto max-w-[80vw] no-scrollbar">
            {tabNames.length > 0 ? (
              tabNames.map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => onTabChange?.(idx)}
                  className={cn(
                    "flex items-center gap-2 px-5 h-full border-x border-t border-zinc-400/40 font-black rounded-t-lg shadow-sm relative z-10 text-[11px] tracking-tight transition-all shrink-0",
                    activeTabIndex === idx
                      ? "bg-[#dbeafe] text-blue-700"
                      : "bg-zinc-200 text-zinc-500 hover:bg-zinc-100"
                  )}
                >
                  {name}
                  {activeTabIndex === idx && <ChevronDown size={10} className="text-blue-400" />}
                </button>
              ))
            ) : (
              <span className="flex items-center gap-2 px-5 h-full bg-[#dbeafe] border-x border-t border-zinc-400/40 text-blue-700 font-black rounded-t-lg shadow-sm relative z-10 text-[11px] tracking-tight shrink-0">
                {sheetTabName || "Income Statement"}
                <ChevronDown size={10} className="text-blue-400" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Formula hint tooltip — fixed position so it escapes overflow-auto clipping */}
    {formulaTooltip && (
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{ left: formulaTooltip.x, top: formulaTooltip.y - 8, transform: "translate(-50%, -100%)" }}
      >
        <div className="bg-[#01696F] text-white text-[11px] font-semibold px-3 py-2 rounded-xl shadow-xl max-w-[240px] text-center leading-snug whitespace-normal">
          💡 {formulaTooltip.text}
        </div>
        <div className="w-2.5 h-2.5 bg-[#01696F] rotate-45 mx-auto -mt-1.5 rounded-sm" />
      </div>
    )}
    </>
  );
};

