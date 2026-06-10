"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import "@excalidraw/excalidraw/index.css";
import { Calculator as CalcIcon, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";
import { MiniCalculator } from "@/components/exercise/MiniCalculator";

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

  // ─── Offset management ──────────────────────────────────────────────────────
  // Excalidraw caches its canvas position (relative to the viewport) and maps the
  // pointer through that cache. Anything that moves the board WITHOUT Excalidraw's
  // own observers noticing — an ancestor scrolling, the window resizing, or a
  // sibling panel ANIMATING the board sideways (position changes, size doesn't) —
  // leaves the cache stale, so strokes land off to the side. `refresh()` forces a
  // recompute; we call it proactively whenever the board could have moved.
  const refresh = useCallback(() => apiRef.current?.refresh?.(), []);

  // Recompute now and again after a CSS transition could have settled, so a panel
  // that slides the board over ~300ms ends up with a correct final offset.
  const refreshSettled = useCallback(() => {
    refresh();
    const t = window.setTimeout(refresh, 320);
    return () => window.clearTimeout(t);
  }, [refresh]);

  // Excalidraw must be imported on the client only.
  useEffect(() => {
    let mounted = true;
    import("@excalidraw/excalidraw").then((mod) => {
      if (mounted) setExcalidraw(() => mod.Excalidraw);
    });
    return () => { mounted = false; };
  }, []);

  // Native wheel behaviour is intentionally left intact: a plain wheel/trackpad
  // scroll PANS the canvas, and Ctrl/⌘+wheel (or trackpad pinch) ZOOMS toward the
  // cursor — the same gestures users expect everywhere else.

  // Keep the cached offset fresh against every source of staleness.
  useEffect(() => {
    if (!Excalidraw) return;
    const el = wrapRef.current;
    if (!el) return;

    // The strongest guarantee: refresh the instant the user is about to draw.
    // pointerenter fires before pointerdown (with human reaction time in between),
    // so the recomputed offset is in place before the stroke starts — this alone
    // fixes the "draws to the left" drift regardless of what moved the board.
    const onPointer = () => refresh();
    el.addEventListener("pointerenter", onPointer);
    el.addEventListener("pointerdown", onPointer, { capture: true });

    // Board resized (panel drag, window layout) — just recompute the offset. We no
    // longer re-fit on show because the saved scroll/zoom is restored on mount, so
    // the view already sits where the user left it.
    const ro = new ResizeObserver(() => refresh());
    ro.observe(el);

    // capture:true catches scrolls on any ancestor scroll container, not just the
    // window. Passive — we only read, never block the scroll.
    window.addEventListener("scroll", refresh, { capture: true, passive: true });
    window.addEventListener("resize", refresh, { passive: true });

    // Refresh after the open/relayout animation settles.
    const cancelSettle = refreshSettled();
    return () => {
      el.removeEventListener("pointerenter", onPointer);
      el.removeEventListener("pointerdown", onPointer, { capture: true } as any);
      ro.disconnect();
      cancelSettle();
      window.removeEventListener("scroll", refresh, { capture: true } as any);
      window.removeEventListener("resize", refresh);
    };
  }, [Excalidraw, refresh, refreshSettled]);

  // External layout changes that move the board WITHOUT resizing it — e.g. the
  // left/AI panels sliding it sideways — aren't seen by the ResizeObserver, so the
  // parent signals them via refreshKey. Refresh now and again after the slide
  // settles (the panels animate over ~300ms).
  useEffect(() => {
    if (!Excalidraw) return;
    return refreshSettled();
  }, [refreshKey, Excalidraw, refreshSettled]);

  // Load the persisted scene ONCE (lazy initializer). Supports the legacy format
  // where only an elements array was stored, plus the current object form that
  // also keeps the view (scroll/zoom) and embedded files (pasted/inserted images).
  const [savedScene] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return { elements: p as any[], appState: null as any, files: null as any };
      return { elements: p.elements ?? [], appState: p.appState ?? null, files: p.files ?? null };
    } catch { return null; }
  });
  const hadSavedView = !!savedScene?.appState;

  const initialData = {
    elements: savedScene?.elements ?? [],
    // Restore the user's last view (scrollX/scrollY/zoom) so reopening lands
    // exactly where they left off (#7).
    appState: { theme: "light", ...(savedScene?.appState ?? {}) },
    files: savedScene?.files ?? undefined,
  };

  // Latest scene snapshot, written to storage on a debounce and flushed on exit so
  // the final strokes are never lost (#1). We persist elements + the view + files
  // (so pasted images survive a reload — #2).
  const pending = useRef<{ elements: readonly any[]; appState: any; files: any } | null>(null);

  const flush = useCallback(() => {
    if (!storageKey || !pending.current) return;
    const { elements, appState, files } = pending.current;
    try {
      const view = appState
        ? { scrollX: appState.scrollX, scrollY: appState.scrollY, zoom: appState.zoom }
        : undefined;
      window.localStorage.setItem(storageKey, JSON.stringify({ elements, appState: view, files }));
    } catch { /* quota / private mode — ignore */ }
    pending.current = null;
  }, [storageKey]);

  const handleChange = (elements: readonly any[], appState: any, files: any) => {
    if (!storageKey) return;
    pending.current = { elements, appState, files };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, 500);
  };

  // Flush pending edits when the tab is closing or the board unmounts.
  useEffect(() => {
    const onLeave = () => flush();
    window.addEventListener("beforeunload", onLeave);
    document.addEventListener("visibilitychange", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      document.removeEventListener("visibilitychange", onLeave);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      flush();
    };
  }, [flush]);

  const clearBoard = () => {
    apiRef.current?.updateScene?.({ elements: [] });
    apiRef.current?.refresh?.();
    pending.current = null;
    if (saveTimer.current) clearTimeout(saveTimer.current);
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
    <div ref={wrapRef} className="scratch-board relative w-full h-full">
      <Excalidraw
        excalidrawAPI={(api: any) => {
          apiRef.current = api;
          // Only auto-fit legacy scenes that have elements but no saved view; when
          // a view was restored we keep the user's exact scroll/zoom (#7).
          if (!hadSavedView) {
            requestAnimationFrame(() => {
              const els = api.getSceneElements?.() ?? [];
              if (els.length > 0) api.scrollToContent?.(els, { fitToContent: true });
            });
          }
        }}
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
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-zinc-200 shadow-md flex items-center justify-center text-zinc-500 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-90"
        >
          <Eraser className="w-[13px] h-[13px] sm:w-[15px] sm:h-[15px]" />
        </button>
        <button
          onClick={() => setShowCalc((s) => !s)}
          title="Calculator"
          className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-lg border shadow-md flex items-center justify-center transition-all active:scale-90",
            showCalc ? "bg-[#01696F] border-transparent text-white" : "bg-white border-zinc-200 text-zinc-500 hover:text-[#01696F] hover:border-[#01696F]/30"
          )}
        >
          <CalcIcon className="w-[13px] h-[13px] sm:w-[15px] sm:h-[15px]" />
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
