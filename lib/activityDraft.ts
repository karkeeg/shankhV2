/**
 * Client-side draft persistence for Quantus (spreadsheet) and Canvas activities.
 *
 * Drafts are stored in localStorage under keys:
 *   shankh_draft_q_{activityId}   — spreadsheet grid (Record<string,string>)
 *   shankh_draft_c_{activityId}   — canvas snapshot ({ nodes, edges })
 *
 * All drafts are cleared on logout via clearAllDrafts().
 */

const PREFIX = "shankh_draft_";

function key(type: "q" | "c", activityId: string): string {
  return `${PREFIX}${type}_${activityId}`;
}

function save(storageKey: string, data: unknown): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

function load<T>(storageKey: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function remove(storageKey: string): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(storageKey);
  } catch {}
}

// ── Public API ────────────────────────────────────────────────────────────────

export function saveQuantusDraft(activityId: string, grid: Record<string, string>): void {
  if (!activityId || Object.keys(grid).length === 0) return;
  save(key("q", activityId), grid);
}

export function loadQuantusDraft(activityId: string): Record<string, string> | null {
  if (!activityId) return null;
  return load<Record<string, string>>(key("q", activityId));
}

export function clearQuantusDraft(activityId: string): void {
  remove(key("q", activityId));
}

// Canvas snapshot: React Flow { nodes, edges } graph
export function saveCanvasDraft(activityId: string, graph: { nodes: any[]; edges: any[] }): void {
  if (!activityId) return;
  if (!graph?.nodes?.length && !graph?.edges?.length) return;
  save(key("c", activityId), graph);
}

export function loadCanvasDraft(activityId: string): { nodes: any[]; edges: any[] } | null {
  if (!activityId) return null;
  const raw = load<any>(key("c", activityId));
  // Validate shape — ignore legacy Excalidraw arrays
  if (!raw || Array.isArray(raw) || !raw.nodes) return null;
  return raw;
}

export function clearCanvasDraft(activityId: string): void {
  remove(key("c", activityId));
}

/** Called on logout — wipes every draft for every activity. */
export function clearAllDrafts(): void {
  try {
    if (typeof window === "undefined") return;
    const toRemove = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}
