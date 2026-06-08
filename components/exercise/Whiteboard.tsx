"use client";

import React, { useEffect, useRef, useState } from "react";
import "@excalidraw/excalidraw/index.css";
import { Calculator as CalcIcon, X, Eraser, Delete } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Standard calculator (Windows-calc style) ─────────────────────────────────
// Immediate-execution calculator with a running expression line, the standard
// function row (%, CE, 1/x, x², √, ±) and physical keyboard support. Pure client
// state — nothing is persisted or graded.

type Op = "+" | "−" | "×" | "÷";

const OP_SYMBOL: Record<Op, string> = { "+": "+", "−": "−", "×": "×", "÷": "÷" };

function compute(a: number, b: number, op: Op): number {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? NaN : a / b;
  }
}

// Trim floating-point noise and add thousands separators, like a desktop calc.
function fmt(n: number): string {
  if (!Number.isFinite(n)) return "Cannot divide by zero";
  const rounded = Math.round((n + Number.EPSILON) * 1e10) / 1e10;
  const [intPart, decPart] = String(rounded).split(".");
  const withCommas = Number(intPart).toLocaleString("en-US");
  return decPart ? `${withCommas}.${decPart}` : withCommas;
}

function MiniCalculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");   // current entry (raw, no commas)
  const [acc, setAcc] = useState<number | null>(null); // accumulated value
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(true);       // next digit starts a new entry
  const [history, setHistory] = useState("");     // expression line

  const current = () => parseFloat(display) || 0;
  const isError = display === "Cannot divide by zero";

  const inputDigit = (d: string) => {
    if (isError) { setDisplay(d); setFresh(false); return; }
    if (fresh) { setDisplay(d); setFresh(false); return; }
    if (display.replace(/[-.]/g, "").length >= 15) return; // cap length
    setDisplay((s) => (s === "0" ? d : s + d));
  };

  const inputDot = () => {
    if (isError) { setDisplay("0."); setFresh(false); return; }
    if (fresh) { setDisplay("0."); setFresh(false); return; }
    if (!display.includes(".")) setDisplay((s) => s + ".");
  };

  const clearAll = () => { setDisplay("0"); setAcc(null); setOp(null); setFresh(true); setHistory(""); };
  const clearEntry = () => { setDisplay("0"); setFresh(true); };
  const backspace = () => {
    if (fresh || isError) return;
    setDisplay((s) => (s.length <= 1 || (s.length === 2 && s.startsWith("-")) ? "0" : s.slice(0, -1)));
  };

  const toggleSign = () => { if (!isError) setDisplay((s) => (s.startsWith("-") ? s.slice(1) : s === "0" ? s : "-" + s)); };

  const unary = (kind: "1/x" | "x²" | "√" | "%") => {
    if (isError) return;
    const x = current();
    let r: number, label: string;
    if (kind === "1/x") { r = 1 / x; label = `1/(${fmt(x)})`; }
    else if (kind === "x²") { r = x * x; label = `sqr(${fmt(x)})`; }
    else if (kind === "√") { r = Math.sqrt(x); label = `√(${fmt(x)})`; }
    else { r = op && acc !== null ? (acc * x) / 100 : x / 100; label = ""; } // % of accumulator
    setDisplay(Number.isFinite(r) ? fmt(r).replace(/,/g, "") : "Cannot divide by zero");
    if (label) setHistory(label);
    setFresh(true);
  };

  const chooseOp = (next: Op) => {
    if (isError) return;
    if (op !== null && !fresh && acc !== null) {
      const r = compute(acc, current(), op);
      setAcc(r);
      setDisplay(Number.isFinite(r) ? fmt(r).replace(/,/g, "") : "Cannot divide by zero");
      setHistory(`${fmt(r)} ${OP_SYMBOL[next]}`);
    } else {
      setAcc(current());
      setHistory(`${fmt(current())} ${OP_SYMBOL[next]}`);
    }
    setOp(next);
    setFresh(true);
  };

  const equals = () => {
    if (op === null || acc === null || isError) return;
    const b = current();
    const r = compute(acc, b, op);
    setHistory(`${fmt(acc)} ${OP_SYMBOL[op]} ${fmt(b)} =`);
    setDisplay(Number.isFinite(r) ? fmt(r).replace(/,/g, "") : "Cannot divide by zero");
    setAcc(null); setOp(null); setFresh(true);
  };

  // Physical keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack keys while typing in a text field (e.g. an Excalidraw label)
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const k = e.key;
      if (/[0-9]/.test(k)) { inputDigit(k); }
      else if (k === ".") inputDot();
      else if (k === "+") chooseOp("+");
      else if (k === "-") chooseOp("−");
      else if (k === "*") chooseOp("×");
      else if (k === "/") { e.preventDefault(); chooseOp("÷"); }
      else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); }
      else if (k === "Backspace") backspace();
      else if (k === "Escape") clearAll();
      else if (k === "%") unary("%");
      else return;
      e.stopPropagation();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Button layout — Windows standard calculator
  const ROWS: { k: string; act: () => void; kind?: "fn" | "op" | "eq" | "clr" }[][] = [
    [
      { k: "%", act: () => unary("%"), kind: "fn" },
      { k: "CE", act: clearEntry, kind: "clr" },
      { k: "C", act: clearAll, kind: "clr" },
      { k: "⌫", act: backspace, kind: "fn" },
    ],
    [
      { k: "1/x", act: () => unary("1/x"), kind: "fn" },
      { k: "x²", act: () => unary("x²"), kind: "fn" },
      { k: "√", act: () => unary("√"), kind: "fn" },
      { k: "÷", act: () => chooseOp("÷"), kind: "op" },
    ],
    [
      { k: "7", act: () => inputDigit("7") }, { k: "8", act: () => inputDigit("8") },
      { k: "9", act: () => inputDigit("9") }, { k: "×", act: () => chooseOp("×"), kind: "op" },
    ],
    [
      { k: "4", act: () => inputDigit("4") }, { k: "5", act: () => inputDigit("5") },
      { k: "6", act: () => inputDigit("6") }, { k: "−", act: () => chooseOp("−"), kind: "op" },
    ],
    [
      { k: "1", act: () => inputDigit("1") }, { k: "2", act: () => inputDigit("2") },
      { k: "3", act: () => inputDigit("3") }, { k: "+", act: () => chooseOp("+"), kind: "op" },
    ],
    [
      { k: "±", act: toggleSign }, { k: "0", act: () => inputDigit("0") },
      { k: ".", act: inputDot }, { k: "=", act: equals, kind: "eq" },
    ],
  ];

  return (
    <div className="w-60 rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden select-none">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#01696F] text-white">
        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
          <CalcIcon size={12} /> Calculator
        </span>
        <button onClick={onClose} className="w-5 h-5 rounded-md hover:bg-white/20 flex items-center justify-center">
          <X size={12} />
        </button>
      </div>

      {/* Display */}
      <div className="px-3 pt-2 pb-2.5 bg-zinc-50 border-b border-zinc-100 text-right">
        <div className="text-[11px] text-zinc-400 font-medium h-4 truncate">{history || " "}</div>
        <div className={cn("font-black tabular-nums truncate leading-tight", isError ? "text-rose-500 text-sm" : "text-zinc-800 text-2xl")}>
          {isError ? display : fmt(current())}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-1 p-2">
        {ROWS.flat().map(({ k, act, kind }) => (
          <button
            key={k}
            onClick={act}
            className={cn(
              "h-9 rounded-lg text-sm font-bold transition-all active:scale-90 flex items-center justify-center",
              kind === "eq" ? "bg-[#00A389] text-white hover:bg-[#00A389]/90" :
              kind === "op" ? "bg-[#E6F0F1] text-[#01696F] hover:bg-[#D7E8E9]" :
              kind === "clr" ? "bg-rose-50 text-rose-500 hover:bg-rose-100 text-xs" :
              kind === "fn" ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-xs" :
              "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
            )}
          >
            {k === "⌫" ? <Delete size={14} /> : k}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Whiteboard (Excalidraw scratchpad + calculator) ──────────────────────────
// A free, disposable practice surface. Pen, shapes, text, eraser come from
// Excalidraw out of the box. State lives only in the browser session.

interface WhiteboardProps {
  /** Optional storage key — when set, the scene persists to localStorage. */
  storageKey?: string;
  /**
   * Bump this whenever the board's on-screen position or size changes due to an
   * external layout change (panel resize, sibling panel toggle, etc.). Excalidraw
   * caches its canvas offset, so we call refresh() to recompute it — otherwise
   * strokes land away from the cursor.
   */
  refreshKey?: string | number;
}

export function Whiteboard({ storageKey, refreshKey }: WhiteboardProps) {
  const [Excalidraw, setExcalidraw] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [showCalc, setShowCalc] = useState(false);
  const apiRef = useRef<any>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Excalidraw must be imported on the client only.
  useEffect(() => {
    let mounted = true;
    import("@excalidraw/excalidraw").then((mod) => {
      if (mounted) setExcalidraw(() => mod.Excalidraw);
    });
    return () => { mounted = false; };
  }, []);

  // Scroll-to-zoom: Excalidraw pans on plain wheel and zooms only on Ctrl+wheel.
  // We intercept plain wheel events and re-dispatch them with ctrlKey set, so a
  // normal scroll zooms toward the cursor and the drawing stays on the pad.
  useEffect(() => {
    if (!Excalidraw) return;
    const el = wrapRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // already a zoom gesture (or our synthetic event)
      e.preventDefault();
      e.stopPropagation();
      const synthetic = new WheelEvent("wheel", {
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        clientX: e.clientX,
        clientY: e.clientY,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      (e.target as EventTarget).dispatchEvent(synthetic);
    };

    el.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => el.removeEventListener("wheel", onWheel, { capture: true } as any);
  }, [Excalidraw]);

  // Fix pointer/stroke offset: Excalidraw caches its canvas position on mount,
  // but our panel animates open (width 0 → full), so the cached offset is stale
  // and strokes land away from the cursor. Recompute offsets on every resize.
  useEffect(() => {
    if (!Excalidraw) return;
    const el = wrapRef.current;
    if (!el) return;

    const refresh = () => apiRef.current?.refresh?.();
    const ro = new ResizeObserver(() => refresh());
    ro.observe(el);
    // Also refresh after the open animation settles.
    const t = setTimeout(refresh, 350);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, [Excalidraw]);

  // Recompute the canvas offset whenever an EXTERNAL layout change moves the board
  // without resizing it (e.g. the left sidebar splitter shifts our X position).
  // ResizeObserver above can't catch those, so the parent signals via refreshKey.
  useEffect(() => {
    if (!Excalidraw) return;
    const raf = requestAnimationFrame(() => apiRef.current?.refresh?.());
    return () => cancelAnimationFrame(raf);
  }, [refreshKey, Excalidraw]);

  const initialData = (() => {
    if (typeof window === "undefined" || !storageKey) return { elements: [], appState: { theme: "light" } };
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) return { elements: JSON.parse(raw), appState: { theme: "light" } };
    } catch { /* ignore */ }
    return { elements: [], appState: { theme: "light" } };
  })();

  const handleChange = (elements: readonly any[]) => {
    if (!storageKey) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { window.localStorage.setItem(storageKey, JSON.stringify(elements)); } catch { /* ignore */ }
    }, 500);
  };

  const clearBoard = () => {
    apiRef.current?.updateScene?.({ elements: [] });
    if (storageKey) { try { window.localStorage.removeItem(storageKey); } catch { /* ignore */ } }
  };

  if (!Excalidraw) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-zinc-50">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#01696F]" />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full h-full">
      <Excalidraw
        excalidrawAPI={(api: any) => { apiRef.current = api; }}
        initialData={initialData}
        onChange={handleChange}
        theme="light"
        UIOptions={{ canvasActions: { loadScene: false } }}
      />

      {/* Floating action buttons — top-right corner of the board */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
        <button
          onClick={clearBoard}
          title="Clear board"
          className="w-8 h-8 rounded-lg bg-white border border-zinc-200 shadow-md flex items-center justify-center text-zinc-500 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-90"
        >
          <Eraser size={15} />
        </button>
        <button
          onClick={() => setShowCalc((s) => !s)}
          title="Calculator"
          className={cn(
            "w-8 h-8 rounded-lg border shadow-md flex items-center justify-center transition-all active:scale-90",
            showCalc ? "bg-[#01696F] border-transparent text-white" : "bg-white border-zinc-200 text-zinc-500 hover:text-[#01696F] hover:border-[#01696F]/30"
          )}
        >
          <CalcIcon size={15} />
        </button>
      </div>

      {/* Calculator pop-over */}
      {showCalc && (
        <div className="absolute bottom-3 right-3 z-20 animate-fade-in-up">
          <MiniCalculator onClose={() => setShowCalc(false)} />
        </div>
      )}
    </div>
  );
}

export default Whiteboard;
