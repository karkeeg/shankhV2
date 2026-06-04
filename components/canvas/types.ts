export interface PaletteItem {
  id: string;
  label: string;
  shape: "rectangle" | "ellipse" | "diamond";
  color: string;
}

export interface PlacedNode extends PaletteItem {
  x: number;
  y: number;
}

export interface CanvasEdge {
  id: string;
  sourceId: string;
  targetId: string;
}

export type EdgeStatus = "normal" | "correct" | "wrong" | "missing";

export interface SolutionSnapshot {
  edges: { sourceId: string; targetId: string }[];
  /** Node positions saved by admin so the canvas reloads with the same layout */
  nodePositions?: { id: string; x: number; y: number }[];
}

/** Build a smooth cubic-bezier SVG path between two border points. */
export function bezierPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): string {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  // Perpendicular offset — scales with distance, capped so long edges stay graceful
  const bend = Math.min(dist * 0.22, 55);
  const px = (-dy / dist) * bend;
  const py = (dx / dist) * bend;

  const cx1 = p1.x + dx * 0.38 + px;
  const cy1 = p1.y + dy * 0.38 + py;
  const cx2 = p2.x - dx * 0.38 + px;
  const cy2 = p2.y - dy * 0.38 + py;

  return (
    `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ` +
    `C ${cx1.toFixed(1)} ${cy1.toFixed(1)} ` +
    `${cx2.toFixed(1)} ${cy2.toFixed(1)} ` +
    `${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  );
}

export interface GradeResult {
  scorePct: number;
  correct: string[];   // edge keys "sourceId→targetId"
  wrong: string[];
  missing: string[];
}

export interface CanvasSnapshot {
  nodes: PlacedNode[];
  edges: CanvasEdge[];
}

export const NODE_W = 130;
export const NODE_H = 48;

export function edgeKey(sourceId: string, targetId: string) {
  return `${sourceId}→${targetId}`;
}

export function nodeCx(n: PlacedNode) { return n.x + NODE_W / 2; }
export function nodeCy(n: PlacedNode) { return n.y + NODE_H / 2; }

/** Returns the point on the node's border in the direction of (tx, ty). */
export function borderPoint(n: PlacedNode, tx: number, ty: number) {
  const cx = nodeCx(n);
  const cy = nodeCy(n);
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hw = NODE_W / 2 + 4;
  const hh = NODE_H / 2 + 4;
  const t = Math.min(hw / (Math.abs(dx) || 0.001), hh / (Math.abs(dy) || 0.001));
  return { x: cx + dx * t, y: cy + dy * t };
}

export const PALETTE_COLORS = [
  "#dbeafe", "#d1fae5", "#fae8ff", "#fef3c7",
  "#ffe4e6", "#e0f2fe", "#f1f5f9",
];

export const DEFAULT_COLOR = "#dbeafe";
