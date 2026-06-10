"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { PencilRuler, Sparkles, X, Pencil, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Whiteboard } from "@/components/exercise/Whiteboard";
import { ScratchSheet } from "@/components/scratchpad/ScratchSheet";

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const TEAL = "#01696F";
const CREAM = "#FAF7F2";

// Rotating nudges shown by the floating launcher to keep drawing the user's
// attention without repeating the same line. Each carries an accent colour that
// drives the bubble glow, the title shimmer and the Sparkles icon.
type Hint = { title: string; body: string; glow: string };

const SCRATCH_HINTS: Hint[] = [
  { title: "Wanna take help?", body: "Open the scratchpad to sketch, jot rough work & practice your thinking — it's never graded.", glow: "#fcd34d" },
  { title: "Stuck on this one?", body: "Map it out on the scratchpad before you commit to an answer.", glow: "#7dd3fc" },
  { title: "Think it through ✏️", body: "Sketch your logic on the scratchpad — rough work, zero pressure.", glow: "#c4b5fd" },
  { title: "Try another angle", body: "Jot numbers or a quick diagram to test your idea first.", glow: "#6ee7b7" },
];

const HINT_SEEN_KEY = "scratchpad-hint-seen";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;

// ─── Idle-nudge hook ──────────────────────────────────────────────────────────
// After `idleMs` of no user activity it surfaces a rotating hint; any activity
// hides it and restarts the countdown. Disabled once permanently dismissed
// (persisted to localStorage) or while `paused` (e.g. the board is open).
//
// Visibility + timer live in refs so high-frequency events (mousemove/scroll)
// never trigger needless React re-renders — the page flow stays smooth.

function useIdleNudge({ idleMs, paused, storageKey }: {
  idleMs: number;
  paused: boolean;
  storageKey: string;
}) {
  const [seen, setSeen] = useState(true);        // permanently dismissed
  const [visible, setVisible] = useState(false);  // shown right now
  const [idx, setIdx] = useState(0);              // active hint index
  const visibleRef = useRef(false);

  // Only re-render when visibility actually flips.
  const show = useCallback((next: boolean) => {
    if (visibleRef.current === next) return;
    visibleRef.current = next;
    setVisible(next);
  }, []);

  // Hydrate dismissal state on mount (client-only).
  useEffect(() => {
    try { setSeen(localStorage.getItem(storageKey) === "1"); } catch { /* ignore */ }
  }, [storageKey]);

  const dismiss = useCallback(() => {
    setSeen(true);
    show(false);
    try { localStorage.setItem(storageKey, "1"); } catch { /* ignore */ }
  }, [show, storageKey]);

  useEffect(() => {
    if (seen || paused) { show(false); return; }
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      show(false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIdx((i) => (i + 1) % SCRATCH_HINTS.length);
        show(true);
      }, idleMs);
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();
    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [seen, paused, idleMs, show]);

  return { visible, hint: SCRATCH_HINTS[idx], dismiss };
}

// ─── Floating launcher + idle nudge ───────────────────────────────────────────
// Absolutely positioned in the top-right of its nearest positioned ancestor, so
// drop it inside a `relative` container. The wrapper is click-through
// (pointer-events-none) — only the button and bubble are interactive, so it
// never blocks the underlying activity.

export function ScratchpadLauncher({
  open,
  onOpen,
  idleMs = 5_000,
  hintKey = HINT_SEEN_KEY,
  className,
}: {
  /** Whether the scratchpad it controls is currently open (hides the launcher). */
  open: boolean;
  /** Opens the scratchpad. */
  onOpen: () => void;
  /** Idle delay before the nudge appears, in ms. */
  idleMs?: number;
  /** localStorage key tracking permanent dismissal. */
  hintKey?: string;
  className?: string;
}) {
  const { visible, hint, dismiss } = useIdleNudge({ idleMs, paused: open, storageKey: hintKey });

  if (open) return null;

  return (
    <div className={cn("absolute top-5 right-5 z-40 flex items-center gap-3 pointer-events-none", className)}>
      {/* Appealing coachmark to the LEFT of the launcher, drifting left-right */}
      {visible && (
        <div
          className="max-w-[248px] pointer-events-auto animate-coach-float-x motion-reduce:animate-none"
          style={{ ["--coach-glow" as any]: `${hint.glow}66`, ["--text-glow" as any]: hint.glow }}
          role="status"
        >
          <div className="relative animate-coach-pop motion-reduce:animate-none">
            {/* Tail pointing right toward the launcher */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 rotate-45 rounded-[2px] border-t border-r"
              style={{ backgroundColor: CREAM, borderColor: `${TEAL}26` }}
            />
            <div
              className="relative rounded-2xl rounded-br-md px-4 py-3 border shadow-lg animate-coach-glow motion-reduce:animate-none"
              style={{ backgroundColor: CREAM, borderColor: `${TEAL}26` }}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${hint.glow}33` }}>
                  <Sparkles size={14} style={{ color: hint.glow }} />
                </div>
                <div className="flex flex-col gap-0.5 pr-3">
                  <p className="text-xs font-extrabold leading-snug animate-text-glow motion-reduce:animate-none" style={{ color: TEAL }}>
                    {hint.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium leading-snug">{hint.body}</p>
                </div>
                <button
                  onClick={dismiss}
                  className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition"
                  aria-label="Dismiss hint"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* The launcher button — bobs up/down on a 5s-float / 5s-hold loop */}
      <button
        onClick={() => { onOpen(); dismiss(); }}
        title="Open scratchpad — rough work"
        aria-label="Open scratchpad"
        className={cn(
          "pointer-events-auto relative w-14 h-14 rounded-full bg-[#01696F] text-white shadow-xl flex items-center justify-center hover:bg-[#01696F]/90 transition-all active:scale-95 group shrink-0 animate-scratch-bob-cycle motion-reduce:animate-none",
          visible && "ring-4 ring-[#01696F]/30 shadow-[0_0_24px_4px_rgba(1,105,111,0.55)]"
        )}
      >
        {visible && <span className="absolute inset-0 rounded-full bg-[#01696F] opacity-30 animate-ping motion-reduce:animate-none" />}
        <PencilRuler size={20} className="relative group-hover:scale-110 transition-transform duration-200" />
      </button>
    </div>
  );
}

// ─── Scratchpad panel ─────────────────────────────────────────────────────────
// The white card: header + Whiteboard surface. Layout-agnostic — drop it in a
// docked column, an overlay, or a modal. Fills its parent's height.

type ScratchTab = "draw" | "sheet";

export function ScratchpadPanel({
  storageKey,
  refreshKey,
  onClose,
  className,
}: {
  /** localStorage key the whiteboard scene persists under. The sheet uses
   *  `${storageKey}-sheet`, so both surfaces persist independently. */
  storageKey: string;
  /** Bump to force the whiteboard to re-fit after a layout/visibility change. */
  refreshKey?: string | number;
  onClose?: () => void;
  className?: string;
}) {
  const [tab, setTab] = useState<ScratchTab>("draw");

  return (
    <div className={cn("bg-white flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-100 shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-200 flex-shrink-0 bg-[#FAF7F2]">
        <div className="w-8 h-8 rounded-full bg-[#01696F]/10 flex items-center justify-center flex-shrink-0">
          <PencilRuler size={16} className="text-[#01696F]" />
        </div>
        <h3 className="font-black text-zinc-800 text-base tracking-tight">Scratchpad</h3>
        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest hidden lg:inline">Rough work
          
        </span>

        {/* Draw / Sheet toggle */}
        <div className="ml-auto flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
          {([
            { id: "draw", label: "Draw", icon: Pencil },
            { id: "sheet", label: "Sheet", icon: Table2 },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all",
                tab === id ? "bg-white text-[#01696F] shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
              aria-pressed={tab === id}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition group"
            aria-label="Close scratchpad"
          >
            <X size={16} className="text-zinc-500 group-hover:text-zinc-800 transition" />
          </button>
        )}
      </div>

      {/* Surfaces. The whiteboard stays mounted (just hidden) so its canvas
          isn't torn down on every toggle; it re-fits via the tab-aware refreshKey. */}
      <div className="flex-1 min-h-0 relative">
        <div className={cn("absolute inset-0", tab !== "draw" && "hidden")}>
          <Whiteboard storageKey={storageKey} refreshKey={`${refreshKey ?? ""}-${tab}`} />
        </div>
        {tab === "sheet" && (
          <div className="absolute inset-0">
            <ScratchSheet storageKey={`${storageKey}-sheet`} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Self-contained floating scratchpad ───────────────────────────────────────
// Drop-in for any page: the launcher plus an overlay panel it opens. Render it
// inside a `relative` container. For docked / resizable layouts, compose
// ScratchpadLauncher + ScratchpadPanel directly instead.

export default function FloatingScratchpad({
  storageKey,
  idleMs,
  hintKey,
  className,
}: {
  storageKey: string;
  idleMs?: number;
  hintKey?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ScratchpadLauncher
        open={open}
        onOpen={() => setOpen(true)}
        idleMs={idleMs}
        hintKey={hintKey}
        className={className}
      />
      {open && (
        <div className="absolute bottom-5 right-5 z-50 w-[min(460px,calc(100%-2.5rem))] h-[min(560px,calc(100%-3rem))] animate-coach-pop motion-reduce:animate-none">
          <ScratchpadPanel
            storageKey={storageKey}
            refreshKey={open ? "open" : "closed"}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
