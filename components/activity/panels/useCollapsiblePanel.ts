"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Collapsible + resizable panel state, persisted per id ────────────────────
// Owns one activity side-panel's open/closed flag and pixel width, restoring
// both from localStorage on mount and saving on change. Used by the activity
// screens so a user's panel layout survives reloads.
//
// `storageKey` should identify the panel uniquely, e.g. `case:${id}:left`. The
// value is persisted under `panel:${storageKey}`.

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

interface Options {
  defaultOpen: boolean;
  defaultWidth: number;
  min: number;
  max: number;
}

interface PanelState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  width: number;
  setWidth: React.Dispatch<React.SetStateAction<number>>;
  /** Apply a drag delta (px), clamped to [min, max]. */
  resize: (delta: number) => void;
}

export function useCollapsiblePanel(storageKey: string, opts: Options): PanelState {
  const { defaultOpen, defaultWidth, min, max } = opts;
  const [open, setOpenState] = useState(defaultOpen);
  const [width, setWidth] = useState(defaultWidth);
  const hydrated = useRef(false);

  const key = `panel:${storageKey}`;

  // Restore on mount (client-only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const p = JSON.parse(raw) as Partial<{ open: boolean; width: number }>;
        if (typeof p.open === "boolean") setOpenState(p.open);
        if (typeof p.width === "number") setWidth(clamp(p.width, min, max));
      }
    } catch { /* ignore */ }
    hydrated.current = true;
  }, [key, min, max]);

  // Persist after hydration whenever state changes.
  useEffect(() => {
    if (!hydrated.current) return;
    try { window.localStorage.setItem(key, JSON.stringify({ open, width })); } catch { /* ignore */ }
  }, [key, open, width]);

  const setOpen = useCallback((next: boolean) => setOpenState(next), []);
  const toggle = useCallback(() => setOpenState((o) => !o), []);
  const resize = useCallback((delta: number) => setWidth((w) => clamp(w + delta, min, max)), [min, max]);

  return { open, setOpen, toggle, width, setWidth, resize };
}

export default useCollapsiblePanel;
