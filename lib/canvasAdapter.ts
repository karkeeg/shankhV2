/**
 * Canvas adapter — bridges the on-disk admin canvas schema (palette items +
 * solution snapshot) to the System A React Flow components (CanvasExercise +
 * CanvasToolkit).
 *
 * The persisted data model is unchanged: an `AdminCanvasData` stores
 *   - paletteItems: PaletteItem[]            — the draggable nodes
 *   - solutionSnapshot: { edges, nodePositions } — the correct answer
 *
 * Backend grading compares learner edges (token-id pairs) against
 * `solutionSnapshot.edges` (also token-id pairs), so these helpers only ever
 * translate *between representations* — they never change the stored shape.
 */
import { MarkerType, type Node, type Edge } from "@xyflow/react";
import type { CanvasGraph } from "@/components/exercise/CanvasExercise";
import type { DragCategory } from "@/types/exercise";

// ─── Shared types (previously in components/canvas/types.ts) ───────────────────

export interface PaletteItem {
  id: string;
  label: string;
  shape: "rectangle" | "ellipse" | "diamond";
  color: string;
}

export interface SolutionSnapshot {
  edges: { sourceId: string; targetId: string }[];
  /** Node positions saved by admin so the canvas reloads with the same layout */
  nodePositions?: { id: string; x: number; y: number }[];
}

export const PALETTE_COLORS = [
  "#dbeafe", "#d1fae5", "#fae8ff", "#fef3c7",
  "#ffe4e6", "#e0f2fe", "#f1f5f9",
];

export const DEFAULT_COLOR = "#dbeafe";

const LEGACY_COLOR: Record<string, string> = {
  rectangle: "#dbeafe",
  ellipse:   "#d1fae5",
  diamond:   "#fae8ff",
  equation:  "#fef3c7",
};

// ─── Layout / styling constants for reconstructed graphs ──────────────────────

const COL_W = 210;
const ROW_H = 120;
const COLS = 3;
const ORIGIN = 48;

const EDGE_DEFAULTS = {
  type: "deletable",
  markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8", width: 14, height: 14 },
  style: { stroke: "#94a3b8", strokeWidth: 2 },
};

// ─── Converters ───────────────────────────────────────────────────────────────

interface LegacyToken { id: string; content?: string; label?: string; type?: string }

/** Legacy lesson canvas tokens → PaletteItem[] (fallback when no paletteItems). */
export function tokensToPaletteItems(tokens: LegacyToken[]): PaletteItem[] {
  return (tokens ?? []).map((t) => ({
    id: t.id,
    label: t.content || t.label || t.id,
    shape: (t.type === "ellipse" ? "ellipse" : t.type === "diamond" ? "diamond" : "rectangle") as PaletteItem["shape"],
    color: (t.type ? LEGACY_COLOR[t.type] : undefined) ?? DEFAULT_COLOR,
  }));
}

/** PaletteItem[] → the DragCategory[] shape CanvasToolkit expects. */
export function paletteToDragCategories(items: PaletteItem[]): DragCategory[] {
  if (!items?.length) return [];
  return [{
    category: "Nodes",
    items: items.map((p) => ({
      id: p.id,
      label: p.label,
      content: p.label,
      type: (p.shape ?? "rectangle") as DragCategory["items"][number]["type"],
    })),
  }];
}

/**
 * Rebuild a System A React Flow graph from the stored admin solution.
 * Every palette item becomes a node (id === item.id, so saved edges resolve),
 * positioned from `nodePositions` when available, otherwise auto-laid-out.
 */
export function solutionToGraph(
  items: PaletteItem[],
  snapshot: SolutionSnapshot | null | undefined,
): CanvasGraph {
  const positions = snapshot?.nodePositions ?? [];
  const nodes: Node[] = (items ?? []).map((item, idx) => {
    const pos = positions.find((p) => p.id === item.id);
    return {
      id: item.id,
      type: "tokenNode",
      position: {
        x: pos?.x ?? ORIGIN + (idx % COLS) * COL_W,
        y: pos?.y ?? ORIGIN + Math.floor(idx / COLS) * ROW_H,
      },
      data: { tokenId: item.id, label: item.label, shape: item.shape },
    };
  });

  const edges: Edge[] = (snapshot?.edges ?? []).map((e, i) => ({
    id: `sol-${i}`,
    source: e.sourceId,
    target: e.targetId,
    ...EDGE_DEFAULTS,
  }));

  return { nodes, edges };
}

/**
 * System A graph (instance node ids) → stored solution snapshot (token-id pairs).
 * Mirrors the learner-side serialization so admin solutions and learner
 * submissions are graded against the same token-pair representation.
 */
export function graphToSolution(graph: CanvasGraph | null | undefined): SolutionSnapshot {
  const nodes = graph?.nodes ?? [];
  const edgesIn = graph?.edges ?? [];

  const idToToken = new Map<string, string>(
    nodes.map((n) => [n.id, (n.data?.tokenId as string | undefined) ?? n.id]),
  );

  const seen = new Set<string>();
  const edges: SolutionSnapshot["edges"] = [];
  for (const e of edgesIn) {
    const sourceId = idToToken.get(e.source);
    const targetId = idToToken.get(e.target);
    if (!sourceId || !targetId) continue;
    const key = `${sourceId}→${targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ sourceId, targetId });
  }

  // Persist positions keyed by token id (last instance wins) for layout reload.
  const posByToken = new Map<string, { id: string; x: number; y: number }>();
  for (const n of nodes) {
    const tokenId = (n.data?.tokenId as string | undefined) ?? n.id;
    posByToken.set(tokenId, { id: tokenId, x: n.position.x, y: n.position.y });
  }

  return { edges, nodePositions: Array.from(posByToken.values()) };
}
