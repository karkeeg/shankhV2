"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { api } from "@/lib/api";
import { useToastStore } from "@/lib/toast-store";
import { ArrowLeft, Save, Plus, Trash2, Grid3X3, TableProperties, Loader2 } from "lucide-react";
import { ExcelGrid } from "@/components/exercise/ExcelGrid";

// ── Cell type metadata ────────────────────────────────────────────────────────

type CellType = "header" | "prefilled" | "editable" | "formula" | "empty";

interface CellMeta {
  cellType: CellType;
  expectedValue: string;
  hintText: string;
  isEditable: boolean;
}

interface ColumnGroup {
  label: string;
  col_start: number;
  col_end: number;
  bg_color: string;
  text_color: string;
}

const DEFAULT_META: CellMeta = {
  cellType: "prefilled",
  expectedValue: "",
  hintText: "",
  isEditable: false,
};

const CELL_COLORS: Record<CellType, { ring: string; label: string; dot: string }> = {
  header:    { ring: "ring-[#7C5DFA]/40",  label: "Header",    dot: "bg-[#7C5DFA]" },
  prefilled: { ring: "ring-zinc-300",       label: "Prefilled", dot: "bg-zinc-400" },
  editable:  { ring: "ring-amber-400",      label: "Editable",  dot: "bg-amber-400" },
  formula:   { ring: "ring-blue-400",       label: "Formula",   dot: "bg-blue-400" },
  empty:     { ring: "ring-transparent",    label: "Empty",     dot: "bg-zinc-200" },
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function QuantusAdminEditor() {
  const params = useParams();
  const lessonId = params.id as string;
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  // ── Meta ──
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [context, setContext] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [sheetName, setSheetName] = useState("Sheet1");

  // ── Grid dimensions ──
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(5);
  const [gridReady, setGridReady] = useState(false);

  // ── Grid data ──
  // table[r][c] = display value (what student sees)
  const [table, setTable] = useState<(string | number | null)[][]>([]);
  // cellMeta[`r-c`] = admin metadata
  const [cellMeta, setCellMeta] = useState<Record<string, CellMeta>>({});
  // selected cell
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);

  // ── Column groups ──
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([]);

  // ── UI ──
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Build empty grid ──
  const buildGrid = useCallback((r: number, c: number) => {
    setTable(Array.from({ length: r }, () => Array.from({ length: c }, () => null)));
    setCellMeta({});
    setGridReady(true);
    setSelected(null);
  }, []);

  // ── Load existing data ──
  useEffect(() => {
    api.get<any>(`/api/v1/admin/lessons/${lessonId}`)
      .then((res) => {
        const a = res?.quantusActivity;
        if (a) {
          setTitle(a.title || "");
          setInstructions(a.instructions || "");
          setContext(a.context || "");
          setReferenceUrl(a.referenceUrl || "");

          const cols_ = (a.columns || []).sort((x: any, y: any) => x.colIndex - y.colIndex);
          const cells = a.quantusCells || [];
          const maxRow = cells.reduce((m: number, c: any) => Math.max(m, c.rowIndex), 0);
          const numRows = maxRow + 1;
          const numCols = cols_.length || 5;

          setRows(numRows);
          setCols(numCols);

          // Build table + cellMeta from DB cells
          const tbl: (string | null)[][] = Array.from({ length: numRows }, () =>
            Array.from({ length: numCols }, () => null)
          );
          const meta: Record<string, CellMeta> = {};

          cells.forEach((c: any) => {
            if (c.rowIndex < numRows && c.colIndex < numCols) {
              tbl[c.rowIndex][c.colIndex] = c.displayValue ?? null;
              meta[`${c.rowIndex}-${c.colIndex}`] = {
                cellType: (c.cellType as CellType) || "prefilled",
                expectedValue: c.expectedValue || "",
                hintText: c.hintText || "",
                isEditable: c.isEditable || false,
              };
            }
          });

          setTable(tbl);
          setCellMeta(meta);
          setColumnGroups(
            (a.columnGroups || []).map((g: any) => ({
              label: g.label, col_start: g.colStart, col_end: g.colEnd,
              bg_color: g.bgColor, text_color: g.textColor,
            }))
          );
          setGridReady(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lessonId]);

  // ── Cell helpers ──
  const getMeta = (r: number, c: number): CellMeta =>
    cellMeta[`${r}-${c}`] || DEFAULT_META;

  const setMeta = (r: number, c: number, updates: Partial<CellMeta>) => {
    setCellMeta((prev) => ({
      ...prev,
      [`${r}-${c}`]: { ...getMeta(r, c), ...updates },
    }));
  };

  const setCellValue = (r: number, c: number, val: string) => {
    setTable((prev) => prev.map((row, ri) =>
      ri === r ? row.map((cell, ci) => ci === c ? val : cell) : row
    ));
  };

  // Build the `inputs` array for ExcelGrid — all cells with editable=true get input treatment
  // Admin sees all cells as inputs so they can type display values
  const inputs = useMemo(() => {
    if (!gridReady) return [];
    const result: { row: number; col: number; correctValue: string | number; formula?: string }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const meta = getMeta(r, c);
        // In admin mode, ALL cells are inputs so admin can type in them
        result.push({
          row: r, col: c,
          correctValue: meta.expectedValue || "",
          formula: meta.cellType === "formula" ? (table[r]?.[c] as string || "") : undefined,
        });
      }
    }
    return result;
  }, [gridReady, rows, cols, cellMeta, table]);

  // ExcelGrid userInputs — mirror the table values
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});

  // Sync table → userInputs whenever table changes (so ExcelGrid shows correct values)
  useEffect(() => {
    if (!gridReady) return;
    const newInputs: Record<string, string> = {};
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = table[r]?.[c];
        if (val !== null && val !== undefined) {
          newInputs[`${r}-${c}`] = String(val);
        }
      }
    }
    setUserInputs(newInputs);
  }, [table, gridReady, rows, cols]);

  // When ExcelGrid updates, sync back to our table
  const handleInputsChange: React.Dispatch<React.SetStateAction<Record<string, string>>> = useCallback(
    (updater) => {
      setUserInputs((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        // Sync changes back to table
        setTable((tbl) => {
          const newTbl = tbl.map((row) => [...row]);
          Object.entries(next).forEach(([key, val]) => {
            const parts = key.split("-");
            if (parts.length >= 2) {
              const r = parseInt(parts[0]);
              const c = parseInt(parts[1]);
              if (!isNaN(r) && !isNaN(c) && r < newTbl.length && c < (newTbl[r]?.length || 0)) {
                newTbl[r][c] = val;
              }
            }
          });
          return newTbl;
        });
        return next;
      });
    },
    []
  );

  // ── Add row / col ──
  const addRow = () => {
    setRows((r) => r + 1);
    setTable((prev) => [...prev, Array.from({ length: cols }, () => null)]);
  };

  const addCol = () => {
    setCols((c) => c + 1);
    setTable((prev) => prev.map((row) => [...row, null]));
  };

  const removeLastRow = () => {
    if (rows <= 1) return;
    setRows((r) => r - 1);
    setTable((prev) => prev.slice(0, -1));
  };

  const removeLastCol = () => {
    if (cols <= 1) return;
    setCols((c) => c - 1);
    setTable((prev) => prev.map((row) => row.slice(0, -1)));
  };

  // ── Save ──
  const save = async () => {
    if (!title.trim() || !instructions.trim()) {
      showToast("Title and instructions are required", "error");
      return;
    }
    try {
      setSaving(true);
      const columns = Array.from({ length: cols }, (_, ci) => ({
        label: (table[0]?.[ci] as string) || `Col ${ci}`,
        col_index: ci,
        width_px: ci === 0 ? 160 : 120,
      }));

      const cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const meta = getMeta(r, c);
          const displayVal = table[r]?.[c];
          cells.push({
            row_index: r, col_index: c,
            cell_type: meta.cellType,
            display_value: displayVal !== null && displayVal !== undefined ? String(displayVal) : null,
            expected_value: meta.expectedValue || null,
            hint_text: meta.hintText || null,
            is_editable: meta.isEditable,
            formula: meta.cellType === "formula" ? (displayVal as string || null) : null,
          });
        }
      }

      const payload = {
        title, instructions, context, reference_url: referenceUrl,
        column_groups: columnGroups,
        columns,
        cells,
      };

      await api.post(`/api/v1/admin/lessons/${lessonId}/quantus`, payload);
      showToast("Quantus activity saved", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Selected cell meta ──
  const selMeta = selected ? getMeta(selected.r, selected.c) : null;

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#01696F] border-t-transparent rounded-full animate-spin" />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-hidden bg-zinc-100">

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-zinc-200 shrink-0 flex-wrap">
          <button onClick={() => router.push(`/admin/lessons/${lessonId}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#01696F]/70 hover:text-[#01696F] group shrink-0">
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Lesson
          </button>
          <div className="h-5 w-px bg-zinc-200 shrink-0" />
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black shrink-0">
            <TableProperties size={11} /> Quantus Lab
          </span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Spreadsheet title *"
            className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium outline-none w-44 focus:bg-white focus:border-amber-300" />
          <input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions for students *"
            className="flex-1 min-w-[180px] px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:bg-white focus:border-amber-300" />
          <input value={sheetName} onChange={(e) => setSheetName(e.target.value)} placeholder="Sheet tab name"
            className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none w-32 focus:bg-white" />
          <button onClick={save} disabled={saving || !gridReady}
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-40 ml-auto shrink-0 transition-all active:scale-95">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? "Saving..." : "Save Quantus"}
          </button>
        </div>

        {/* ── Context sub-bar ── */}
        <div className="flex items-center gap-3 px-5 py-2 bg-white border-b border-zinc-100 shrink-0">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 shrink-0">Context / Scenario</span>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Optional background text shown above the spreadsheet..."
            className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:bg-white focus:border-amber-300"
          />
        </div>

        {/* ── Grid setup (if not ready) ── */}
        {!gridReady && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm flex flex-col items-center gap-6 w-80">
              <div className="p-4 bg-amber-50 rounded-2xl text-amber-500"><Grid3X3 size={32} /></div>
              <div className="text-center">
                <h3 className="text-sm font-extrabold text-zinc-800 mb-1">Set Grid Size</h3>
                <p className="text-xs text-zinc-400">You can add more rows and columns later.</p>
              </div>
              <div className="w-full grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Rows</label>
                  <input type="number" min={1} max={50} value={rows} onChange={(e) => setRows(+e.target.value)}
                    className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold outline-none text-center" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Columns</label>
                  <input type="number" min={1} max={20} value={cols} onChange={(e) => setCols(+e.target.value)}
                    className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold outline-none text-center" />
                </div>
              </div>
              <button onClick={() => buildGrid(rows, cols)}
                className="w-full py-3 bg-[#01696F] text-white text-xs font-bold rounded-xl shadow-md">
                Create Spreadsheet →
              </button>
            </div>
          </div>
        )}

        {/* ── Main editor ── */}
        {gridReady && (
          <div className="flex flex-1 overflow-hidden">

            {/* Spreadsheet area */}
            <div className="flex-1 overflow-hidden flex flex-col">

              {/* Cell type legend + add row/col controls */}
              <div className="flex items-center gap-4 px-4 py-2 bg-zinc-50 border-b border-zinc-200 shrink-0 flex-wrap">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">Cell Types:</span>
                {(Object.entries(CELL_COLORS) as [CellType, typeof CELL_COLORS[CellType]][]).map(([type, meta]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-sm ${meta.dot}`} />
                    <span className="text-[10px] font-medium text-zinc-500">{meta.label}</span>
                  </div>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400">{rows}r × {cols}c</span>
                  <button onClick={addRow}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-zinc-200 hover:border-[#01696F]/40 rounded-lg text-[10px] font-bold text-zinc-600 transition-all">
                    <Plus size={10} /> Row
                  </button>
                  <button onClick={addCol}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-zinc-200 hover:border-[#01696F]/40 rounded-lg text-[10px] font-bold text-zinc-600 transition-all">
                    <Plus size={10} /> Col
                  </button>
                  <button onClick={removeLastRow}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-zinc-200 hover:border-rose-300 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-rose-500 transition-all">
                    <Trash2 size={10} /> Row
                  </button>
                  <button onClick={removeLastCol}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-zinc-200 hover:border-rose-300 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-rose-500 transition-all">
                    <Trash2 size={10} /> Col
                  </button>
                </div>
              </div>

              {/* ExcelGrid wrapper */}
              <div className="flex-1 overflow-hidden relative">
                <ExcelGrid
                  table={table}
                  inputs={inputs}
                  userInputs={userInputs}
                  setUserInputs={handleInputsChange}
                  isValidated={false}
                  feedback={{}}
                  showToolbar={true}
                  sheetTabName={sheetName}
                  selectedCell={selected ? { row: selected.r, col: selected.c } : null}
                  onSelectCell={(cell) => {
                    if (cell) {
                      setSelected({ r: cell.row, c: cell.col });
                    } else {
                      setSelected(null);
                    }
                  }}
                />
              </div>
            </div>

            {/* ── Right panel: Cell Properties ── */}
            <div className="w-64 shrink-0 bg-white border-l border-zinc-200 flex flex-col overflow-y-auto">

              {/* Cell selector — click a cell by coordinates */}
              <div className="p-4 border-b border-zinc-100 space-y-3">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Select Cell</h3>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Click a cell in the grid, or enter coordinates manually.
                </p>
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase">Row (0-based)</label>
                    <input
                      type="number" min={0} max={rows - 1}
                      value={selected?.r ?? ""}
                      onChange={(e) => setSelected((s) => ({ r: +e.target.value, c: s?.c ?? 0 }))}
                      className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold outline-none text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase">Col (0-based)</label>
                    <input
                      type="number" min={0} max={cols - 1}
                      value={selected?.c ?? ""}
                      onChange={(e) => setSelected((s) => ({ r: s?.r ?? 0, c: +e.target.value }))}
                      className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold outline-none text-center"
                    />
                  </div>
                </div>
              </div>

              {selMeta && selected ? (
                <div className="flex-1 p-4 space-y-4">
                  {/* Cell address badge */}
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${CELL_COLORS[selMeta.cellType].dot}`} />
                    <span className="text-xs font-extrabold text-zinc-700">
                      Row {selected.r}, Col {selected.c}
                    </span>
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500`}>
                      {CELL_COLORS[selMeta.cellType].label}
                    </span>
                  </div>

                  {/* Cell Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Cell Type</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["header", "prefilled", "editable", "formula", "empty"] as CellType[]).map((type) => (
                        <button key={type}
                          onClick={() => setMeta(selected.r, selected.c, { cellType: type, isEditable: type === "editable" })}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                            selMeta.cellType === type
                              ? "bg-[#01696F] text-white border-[#01696F]"
                              : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-[#01696F]/30"
                          }`}>
                          <div className={`w-2 h-2 rounded-sm ${CELL_COLORS[type].dot} ${selMeta.cellType === type ? "opacity-70" : ""}`} />
                          {CELL_COLORS[type].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Display Value (what student sees) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                      Display Value
                      <span className="ml-1 text-zinc-300 font-normal normal-case">(shown to student)</span>
                    </label>
                    <input
                      value={(table[selected.r]?.[selected.c] as string) || ""}
                      onChange={(e) => setCellValue(selected.r, selected.c, e.target.value)}
                      placeholder={selMeta.cellType === "formula" ? "=B1+C1" : "e.g. Revenue"}
                      className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#01696F]/40"
                    />
                  </div>

                  {/* Expected Value (for editable/formula cells) */}
                  {(selMeta.cellType === "editable" || selMeta.cellType === "formula") && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                        Expected Value
                        <span className="ml-1 text-zinc-300 font-normal normal-case">(correct answer)</span>
                      </label>
                      <input
                        value={selMeta.expectedValue}
                        onChange={(e) => setMeta(selected.r, selected.c, { expectedValue: e.target.value })}
                        placeholder="e.g. 400"
                        className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs outline-none focus:bg-white"
                      />
                    </div>
                  )}

                  {/* Hint */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                      Hint Text
                      <span className="ml-1 text-zinc-300 font-normal normal-case">(optional)</span>
                    </label>
                    <textarea
                      value={selMeta.hintText}
                      onChange={(e) => setMeta(selected.r, selected.c, { hintText: e.target.value })}
                      placeholder="Shown when student asks for a hint..."
                      rows={2}
                      className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none resize-none focus:bg-white"
                    />
                  </div>

                  {/* Is Editable toggle */}
                  <label className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-100 transition-all">
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${selMeta.isEditable ? "bg-[#01696F]" : "bg-zinc-300"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${selMeta.isEditable ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                    <input type="checkbox" className="hidden" checked={selMeta.isEditable}
                      onChange={(e) => setMeta(selected.r, selected.c, { isEditable: e.target.checked })} />
                    <div>
                      <p className="text-[10px] font-bold text-zinc-700">Student Editable</p>
                      <p className="text-[9px] text-zinc-400">Student can type in this cell</p>
                    </div>
                  </label>

                  {/* Quick navigate: prev/next cells */}
                  <div className="flex gap-2 pt-2 border-t border-zinc-100">
                    <button
                      onClick={() => setSelected((s) => s ? { r: s.r, c: Math.max(0, s.c - 1) } : s)}
                      className="flex-1 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] font-bold text-zinc-500 hover:border-zinc-300">
                      ← Prev Col
                    </button>
                    <button
                      onClick={() => setSelected((s) => s ? { r: s.r, c: Math.min(cols - 1, s.c + 1) } : s)}
                      className="flex-1 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] font-bold text-zinc-500 hover:border-zinc-300">
                      Next Col →
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelected((s) => s ? { r: Math.max(0, s.r - 1), c: s.c } : s)}
                      className="flex-1 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] font-bold text-zinc-500 hover:border-zinc-300">
                      ↑ Prev Row
                    </button>
                    <button
                      onClick={() => setSelected((s) => s ? { r: Math.min(rows - 1, s.r + 1), c: s.c } : s)}
                      className="flex-1 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] font-bold text-zinc-500 hover:border-zinc-300">
                      ↓ Next Row
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
                  <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center">
                    <Grid3X3 size={18} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-600">No cell selected</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Enter row/col above or use the navigation buttons to select a cell.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}