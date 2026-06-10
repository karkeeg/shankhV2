"use client";

import React, { useEffect, useRef, useState } from "react";
import { Calculator as CalcIcon, X, Delete } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Scientific calculator ────────────────────────────────────────────────────
// Expression-based: the user builds a full expression (trig, log/ln, powers,
// roots, factorial, π/e, parentheses) and it's evaluated on "=". DEG/RAD toggle
// for trig. Pure client state — nothing is persisted or graded. Shared by the
// scratchpad's Draw (Whiteboard) and Sheet surfaces.

// Trim floating-point noise and add thousands separators, like a desktop calc.
function fmt(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  const rounded = Math.round((n + Number.EPSILON) * 1e10) / 1e10;
  const [intPart, decPart] = String(rounded).split(".");
  const withCommas = Number(intPart).toLocaleString("en-US");
  return decPart ? `${withCommas}.${decPart}` : withCommas;
}

function factorial(n: number): number {
  if (n < 0 || !Number.isFinite(n)) return NaN;
  const k = Math.round(n);
  if (k > 170) return Infinity; // beyond double precision
  let r = 1;
  for (let i = 2; i <= k; i++) r *= i;
  return r;
}

// Evaluate a display expression (with friendly symbols) to a formatted string.
// Maps symbols → bound helpers, then evaluates a sanitized math expression.
function evaluateExpr(raw: string, deg: boolean): string {
  if (!raw.trim()) return "0";
  let js = raw
    .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")   // 50% → (50/100)
    .replace(/(\d+(?:\.\d+)?)!/g, "fact($1)")    // 5!  → fact(5)
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/π/g, "PI")
    .replace(/√/g, "sqrt")
    .replace(/\^/g, "**")
    .replace(/\be\b/g, "E");                      // standalone e → Euler's number

  // Allow only digits, math operators, parens, commas, dots and our helper names.
  if (/[^0-9+\-*/().,\s a-zA-Z_]/.test(js)) return "Error";

  try {
    const toRad = (x: number) => (deg ? (x * Math.PI) / 180 : x);
    const fromRad = (x: number) => (deg ? (x * 180) / Math.PI : x);
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      "sin", "cos", "tan", "asin", "acos", "atan",
      "ln", "log", "sqrt", "fact", "abs", "PI", "E",
      `"use strict"; return (${js});`
    );
    const r = fn(
      (x: number) => Math.sin(toRad(x)),
      (x: number) => Math.cos(toRad(x)),
      (x: number) => Math.tan(toRad(x)),
      (x: number) => fromRad(Math.asin(x)),
      (x: number) => fromRad(Math.acos(x)),
      (x: number) => fromRad(Math.atan(x)),
      (x: number) => Math.log(x),
      (x: number) => Math.log10(x),
      (x: number) => Math.sqrt(x),
      factorial,
      Math.abs,
      Math.PI,
      Math.E,
    );
    if (typeof r !== "number" || Number.isNaN(r)) return "Error";
    return fmt(r);
  } catch {
    return "Error";
  }
}

type Key = {
  k: string;
  kind?: "num" | "op" | "fn" | "ctrl" | "eq";
  span?: number;
  run: (api: CalcApi) => void;
};

type CalcApi = {
  insert: (token: string, startsValue: boolean) => void;
  clear: () => void;
  back: () => void;
  equals: () => void;
  toggleDeg: () => void;
};

export function MiniCalculator({ onClose }: { onClose: () => void }) {
  const [expr, setExpr] = useState("");       // expression being built (display symbols)
  const [out, setOut] = useState("");         // last evaluated result (formatted)
  const [deg, setDeg] = useState(true);       // angle mode
  const [evaluated, setEvaluated] = useState(false);

  const insert = (token: string, startsValue: boolean) => {
    setExpr((prev) => {
      let base = prev;
      if (evaluated) base = startsValue ? "" : out.replace(/,/g, "");
      return base + token;
    });
    setOut("");
    setEvaluated(false);
  };

  const clear = () => { setExpr(""); setOut(""); setEvaluated(false); };

  const back = () => { setOut(""); setEvaluated(false); setExpr((s) => s.slice(0, -1)); };

  const equals = () => {
    setExpr((cur) => {
      if (cur.trim()) { setOut(evaluateExpr(cur, deg)); setEvaluated(true); }
      return cur;
    });
  };

  const toggleDeg = () => setDeg((d) => !d);

  const api: CalcApi = { insert, clear, back, equals, toggleDeg };

  // Physical keyboard support. The handler closes over fresh state every render, so
  // we keep it in a ref and register the window listener ONCE — no add/remove churn
  // on every keystroke, and never a stale closure.
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = (e: KeyboardEvent) => {
    // Don't hijack keys while typing in a text field (e.g. a sheet cell or label)
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    const k = e.key;
    if (/[0-9]/.test(k)) insert(k, true);
    else if (k === ".") insert(".", true);
    else if (k === "(" || k === ")") insert(k, k === "(");
    else if (k === "+") insert("+", false);
    else if (k === "-") insert("−", false);
    else if (k === "*") insert("×", false);
    else if (k === "/") { e.preventDefault(); insert("÷", false); }
    else if (k === "^") insert("^", false);
    else if (k === "%") insert("%", false);
    else if (k === "!") insert("!", false);
    else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); }
    else if (k === "Backspace") back();
    else if (k === "Escape") clear();
    else return;
    e.stopPropagation();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fn = (token: string, startsValue = true): Key["run"] => (a) => a.insert(token, startsValue);

  // Button layout — scientific calculator (5 columns)
  const KEYS: Key[] = [
    { k: deg ? "DEG" : "RAD", kind: "ctrl", run: (a) => a.toggleDeg() },
    { k: "C", kind: "ctrl", run: (a) => a.clear() },
    { k: "⌫", kind: "ctrl", run: (a) => a.back() },
    { k: "(", kind: "fn", run: fn("(", true) },
    { k: ")", kind: "fn", run: fn(")", false) },

    { k: "sin", kind: "fn", run: fn("sin(") },
    { k: "cos", kind: "fn", run: fn("cos(") },
    { k: "tan", kind: "fn", run: fn("tan(") },
    { k: "√", kind: "fn", run: fn("√(") },
    { k: "xʸ", kind: "fn", run: fn("^", false) },

    { k: "ln", kind: "fn", run: fn("ln(") },
    { k: "log", kind: "fn", run: fn("log(") },
    { k: "π", kind: "fn", run: fn("π") },
    { k: "e", kind: "fn", run: fn("e") },
    { k: "n!", kind: "fn", run: fn("!", false) },

    { k: "7", run: fn("7") }, { k: "8", run: fn("8") }, { k: "9", run: fn("9") },
    { k: "÷", kind: "op", run: fn("÷", false) }, { k: "×", kind: "op", run: fn("×", false) },

    { k: "4", run: fn("4") }, { k: "5", run: fn("5") }, { k: "6", run: fn("6") },
    { k: "−", kind: "op", run: fn("−", false) }, { k: "+", kind: "op", run: fn("+", false) },

    { k: "1", run: fn("1") }, { k: "2", run: fn("2") }, { k: "3", run: fn("3") },
    { k: "%", kind: "op", run: fn("%", false) },
    { k: "=", kind: "eq", run: (a) => a.equals() },

    { k: "0", span: 2, run: fn("0") },
    { k: ".", run: fn(".") },
    { k: "Ans", kind: "fn", span: 2, run: (a) => a.insert(out.replace(/,/g, "") || "0", true) },
  ];

  return (
    <div className="w-[min(17rem,calc(100vw-1.5rem))] rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden select-none">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#01696F] text-white">
        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
          <CalcIcon size={12} /> Scientific
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/20 tracking-wider">{deg ? "DEG" : "RAD"}</span>
          <button onClick={onClose} className="w-5 h-5 rounded-md hover:bg-white/20 flex items-center justify-center">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Display */}
      <div className="px-3 pt-2 pb-2.5 bg-zinc-50 border-b border-zinc-100 text-right">
        <div className="text-[11px] text-zinc-400 font-medium h-4 truncate">{out ? expr : " "}</div>
        <div className={cn(
          "font-black tabular-nums truncate leading-tight",
          out === "Error" ? "text-rose-500 text-lg" : "text-zinc-800 text-xl sm:text-2xl"
        )}>
          {out || expr || "0"}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-5 gap-1 p-2">
        {KEYS.map(({ k, kind, span, run }) => (
          <button
            key={k}
            onClick={() => run(api)}
            style={span ? { gridColumn: `span ${span} / span ${span}` } : undefined}
            className={cn(
              "h-8 sm:h-9 rounded-lg text-xs sm:text-[13px] font-bold transition-all active:scale-90 flex items-center justify-center",
              kind === "eq" ? "bg-[#00A389] text-white hover:bg-[#00A389]/90" :
              kind === "op" ? "bg-[#E6F0F1] text-[#01696F] hover:bg-[#D7E8E9]" :
              kind === "ctrl" ? "bg-rose-50 text-rose-500 hover:bg-rose-100 text-[10px] sm:text-[11px]" :
              kind === "fn" ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-[10px] sm:text-[11px]" :
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

export default MiniCalculator;
