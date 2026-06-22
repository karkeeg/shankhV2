"use client";

import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Handle, Position,
  Node, Edge, NodeTypes, MarkerType, NodeProps, Panel, useReactFlow, ConnectionMode,
  ConnectionLineType, useNodesState, useEdgesState, addEdge, Connection,
  EdgeProps, EdgeTypes, getSmoothStepPath, BaseEdge, EdgeLabelRenderer,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ZoomIn, ZoomOut, Maximize2, X } from "lucide-react";
import type { FrameworkStructure } from "@/lib/canvasAdapter";

// ─── Framework node colours — exactly two fills, no per-shape/palette variation ──
// Locked nodes (shown to the learner) are dark blue; blank nodes (the learner
// fills them) are light blue. Nothing else.
const LOCKED_STYLE = { bg: "#1e3a8a", border: "#1e40af", text: "#ffffff" };
const BLANK_STYLE  = { bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a" };

// All four handles (so edges can attach on any side). Interactive only when the
// node is `connectable` (admin builder edit mode); otherwise inert + invisible.
function Handles({ connectable }: { connectable: boolean }) {
  const style: React.CSSProperties = {
    width: 9, height: 9,
    background: connectable ? "#01696F" : "transparent",
    border: connectable ? "2px solid white" : "none",
    borderRadius: "50%",
    opacity: 0,
    transition: "opacity 0.12s ease, transform 0.12s ease",
  };
  return (
    <>
      <Handle type="source" position={Position.Top} style={style} id="t" isConnectable={connectable} />
      <Handle type="source" position={Position.Bottom} style={style} id="b" isConnectable={connectable} />
      <Handle type="source" position={Position.Left} style={style} id="l" isConnectable={connectable} />
      <Handle type="source" position={Position.Right} style={style} id="r" isConnectable={connectable} />
    </>
  );
}

// ─── Locked node — shows its fixed label ───────────────────────────────────────
function LockedNode({ data }: NodeProps) {
  const shape = (data.shape as string) || "rectangle";
  const st = LOCKED_STYLE;
  const isDiam = shape === "diamond";
  const bg = st.bg;
  const connectable = !!data.connectable;

  return (
    <div className="rf-fw-node" style={{ position: "relative", width: isDiam ? 112 : 160, height: isDiam ? 112 : 56 }}>
      <Handles connectable={connectable} />
      {isDiam ? (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 82, height: 82, backgroundColor: bg, border: `2.5px solid ${st.border}`,
            borderRadius: 5, transform: "rotate(45deg)", display: "flex", alignItems: "center",
            justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
          }}>
            <span style={{ transform: "rotate(-45deg)", color: st.text, fontSize: 10, fontWeight: 800, textAlign: "center", lineHeight: 1.25, maxWidth: 58, wordBreak: "break-word", padding: "0 4px" }}>
              {data.label as string}
            </span>
          </div>
        </div>
      ) : (
        <div style={{
          width: "100%", height: "100%", backgroundColor: bg, border: `2.5px solid ${st.border}`,
          borderRadius: shape === "ellipse" ? 9999 : 12, display: "flex", alignItems: "center",
          justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        }}>
          <span style={{ color: st.text, fontSize: 11, fontWeight: 800, textAlign: "center", lineHeight: 1.3, padding: "0 12px", wordBreak: "break-word" }}>
            {data.label as string}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Input node — learner types the missing value ──────────────────────────────
function InputNode({ data }: NodeProps) {
  const value = (data.value as string) ?? "";
  const disabled = data.disabled as boolean;
  const canDrag = data.canDrag as boolean;
  const connectable = !!data.connectable;
  const review = data.review as { isWrong: boolean; expected: string } | undefined;
  const onChange = data.onChange as (v: string) => void;

  const borderColor = review ? (review.isWrong ? "#f43f5e" : "#10b981") : BLANK_STYLE.border;
  const bg = review ? (review.isWrong ? "#fff1f2" : "#ecfdf5") : BLANK_STYLE.bg;

  return (
    <div className="rf-fw-node" style={{ position: "relative", width: 160 }}>
      <Handles connectable={connectable} />
      <div style={{
        backgroundColor: bg, border: `2.5px solid ${borderColor}`, borderRadius: 12,
        padding: "6px 8px", boxShadow: "0 2px 4px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: 2,
      }}>
        {/* Drag grip — the input itself is `nodrag`, so this gives a clear place to move the node from. */}
        {canDrag && (
          <div title="Drag to move" style={{ display: "flex", justifyContent: "center", cursor: "grab", paddingBottom: 1 }}>
            <div style={{ width: 18, height: 3, borderRadius: 2, background: borderColor, opacity: 0.45 }} />
          </div>
        )}
        <input
          className="nodrag nopan nowheel"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Type here…"
          style={{
            width: "100%", border: "none", outline: "none", background: "transparent",
            fontSize: 11, fontWeight: 700, textAlign: "center", color: review?.isWrong ? "#9f1239" : BLANK_STYLE.text,
          }}
        />
        {review?.isWrong && (
          <span style={{ fontSize: 9, fontWeight: 800, textAlign: "center", color: "#059669" }}>
            ✓ {review.expected}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Learner-authored nodes — shape registry ────────────────────────────────────
// The learner adds these on the case canvas as a free workspace: pick a shape from
// an editor-style list, type text, drag, connect, delete. Light-blue fill matches
// the framework's blank nodes. Never graded — stored apart from the framework.
const USER_STYLE = BLANK_STYLE;

/** Every shape the learner can drop on the canvas. */
export type CanvasShape =
  | "rectangle" | "rounded" | "ellipse" | "circle" | "diamond"
  | "triangle" | "parallelogram" | "hexagon" | "pentagon" | "cylinder";

/** Palette list (order shown in the picker) + display labels. */
export const CANVAS_SHAPES: { key: CanvasShape; label: string }[] = [
  { key: "rectangle", label: "Box" },
  { key: "rounded", label: "Rounded" },
  { key: "ellipse", label: "Oval" },
  { key: "circle", label: "Circle" },
  { key: "diamond", label: "Diamond" },
  { key: "triangle", label: "Triangle" },
  { key: "parallelogram", label: "Parallelogram" },
  { key: "hexagon", label: "Hexagon" },
  { key: "pentagon", label: "Pentagon" },
  { key: "cylinder", label: "Cylinder" },
];

const CANVAS_SHAPE_KEYS = new Set<string>(CANVAS_SHAPES.map((s) => s.key));
export const isCanvasShape = (s: string): s is CanvasShape => CANVAS_SHAPE_KEYS.has(s);

// Default node footprint per shape (px). Text-friendly widths; squarer for
// shapes that read better that way (circle/diamond/triangle/pentagon).
const SHAPE_SIZES: Record<CanvasShape, { w: number; h: number }> = {
  rectangle: { w: 160, h: 64 }, rounded: { w: 160, h: 64 }, ellipse: { w: 168, h: 74 },
  circle: { w: 108, h: 108 }, diamond: { w: 138, h: 100 }, triangle: { w: 140, h: 108 },
  parallelogram: { w: 172, h: 66 }, hexagon: { w: 160, h: 84 }, pentagon: { w: 128, h: 112 },
  cylinder: { w: 132, h: 104 },
};

// Padding for the centred text overlay so it stays inside the silhouette.
const SHAPE_TEXT_PAD: Record<CanvasShape, { x: number; top: number }> = {
  rectangle: { x: 14, top: 0 }, rounded: { x: 14, top: 0 }, ellipse: { x: 20, top: 0 },
  circle: { x: 14, top: 0 }, diamond: { x: 22, top: 0 }, triangle: { x: 16, top: 34 },
  parallelogram: { x: 26, top: 0 }, hexagon: { x: 28, top: 0 }, pentagon: { x: 16, top: 18 },
  cylinder: { x: 16, top: 14 },
};

/** SVG element drawing a shape inside a W×H box (fill + stroke). */
function shapeElement(shape: CanvasShape, W: number, H: number, fill: string, stroke: string, sw: number) {
  const i = sw / 2; // stroke inset so the outline isn't clipped
  const common = { fill, stroke, strokeWidth: sw, strokeLinejoin: "round" as const };
  switch (shape) {
    case "rectangle": return <rect x={i} y={i} width={W - sw} height={H - sw} {...common} />;
    case "rounded": return <rect x={i} y={i} width={W - sw} height={H - sw} rx={16} {...common} />;
    case "ellipse": return <ellipse cx={W / 2} cy={H / 2} rx={(W - sw) / 2} ry={(H - sw) / 2} {...common} />;
    case "circle": return <circle cx={W / 2} cy={H / 2} r={(Math.min(W, H) - sw) / 2} {...common} />;
    case "diamond": return <polygon points={`${W / 2},${i} ${W - i},${H / 2} ${W / 2},${H - i} ${i},${H / 2}`} {...common} />;
    case "triangle": return <polygon points={`${W / 2},${i} ${W - i},${H - i} ${i},${H - i}`} {...common} />;
    case "parallelogram": return <polygon points={`${W * 0.22},${i} ${W - i},${i} ${W * 0.78},${H - i} ${i},${H - i}`} {...common} />;
    case "hexagon": return <polygon points={`${W * 0.25},${i} ${W * 0.75},${i} ${W - i},${H / 2} ${W * 0.75},${H - i} ${W * 0.25},${H - i} ${i},${H / 2}`} {...common} />;
    case "pentagon": return <polygon points={`${W / 2},${i} ${W - i},${H * 0.4} ${W * 0.8},${H - i} ${W * 0.2},${H - i} ${i},${H * 0.4}`} {...common} />;
    case "cylinder": {
      const ry = Math.min(13, H * 0.16);
      return (
        <g>
          <path d={`M${i},${ry} L${i},${H - ry} A ${(W - sw) / 2} ${ry} 0 0 0 ${W - i},${H - ry} L${W - i},${ry}`} {...common} />
          <ellipse cx={W / 2} cy={ry} rx={(W - sw) / 2} ry={ry} {...common} />
        </g>
      );
    }
  }
}

/** Small inline preview for the shape picker. */
export function ShapeIcon({ shape, size = 24 }: { shape: CanvasShape; size?: number }) {
  const sq = shape === "circle" || shape === "diamond" || shape === "triangle" || shape === "pentagon" || shape === "cylinder";
  const W = size, H = sq ? size : Math.round(size * 0.66);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {shapeElement(shape, W, H, USER_STYLE.bg, USER_STYLE.border, 1.75)}
    </svg>
  );
}

function UserNode({ data }: NodeProps) {
  const shape = ((data.shape as CanvasShape) && isCanvasShape(data.shape as string) ? (data.shape as CanvasShape) : "rectangle");
  const value = (data.value as string) ?? "";
  const disabled = !!data.disabled;
  const connectable = !!data.connectable;
  const onChange = data.onChange as ((v: string) => void) | undefined;
  const onDelete = data.onDelete as (() => void) | undefined;
  const st = USER_STYLE;
  const { w, h } = SHAPE_SIZES[shape];
  const pad = SHAPE_TEXT_PAD[shape];

  return (
    <div className="rf-fw-node" style={{ position: "relative", width: w, height: h, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.10))" }}>
      <Handles connectable={connectable} />
      {!disabled && onDelete && (
        <button
          className="rf-fw-node-del nodrag nopan"
          title="Delete node"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ position: "absolute", top: -8, right: -8, zIndex: 6, opacity: 0, transition: "opacity 0.12s ease", border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
        >
          <span style={{ display: "flex", width: 18, height: 18, borderRadius: 9999, background: "#fff", border: "1px solid #fda4af", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
            <X size={10} strokeWidth={3} color="#f43f5e" />
          </span>
        </button>
      )}
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        {shapeElement(shape, w, h, st.bg, st.border, 2.5)}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingLeft: pad.x, paddingRight: pad.x, paddingTop: pad.top }}>
        <textarea
          className="nodrag nopan nowheel"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Type…"
          rows={1}
          style={{
            width: "100%", border: "none", outline: "none", background: "transparent",
            resize: "none", overflow: "hidden", fontFamily: "inherit",
            fontSize: 11, fontWeight: 700, textAlign: "center", color: st.text, lineHeight: 1.3,
          }}
        />
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = { lockedNode: LockedNode, inputNode: InputNode, userNode: UserNode };

const EDGE_OPTS = {
  type: "smoothstep" as const,
  markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b", width: 16, height: 16 },
  style: { stroke: "#64748b", strokeWidth: 2 },
};

// ─── Deletable edge (edit mode only — hover to reveal an ✕ remove button) ───────
function DeletableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style }: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 6,
  });
  const { setEdges } = useReactFlow();
  return (
    <>
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={16} style={{ pointerEvents: "stroke" }} />
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="rf-fw-edge-del nodrag nopan"
          style={{ position: "absolute", transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, pointerEvents: "all", opacity: 0, transition: "opacity 0.12s ease" }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setEdges((eds) => eds.filter((ed) => ed.id !== id)); }}
            className="w-5 h-5 rounded-full bg-white border border-zinc-300 shadow-md flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:border-rose-300 transition-all"
          >
            <X size={9} strokeWidth={3} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes: EdgeTypes = { fwDeletable: DeletableEdge };
const connectionLineStyle: React.CSSProperties = { stroke: "#01696F", strokeWidth: 2, strokeDasharray: "6 3" };

function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const btn = "w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 active:scale-95 transition-all";
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 shadow-md">
      <button className={`${btn} border-b`} onClick={() => zoomIn({ duration: 260 })}><ZoomIn size={14} /></button>
      <button className={`${btn} border-b`} onClick={() => zoomOut({ duration: 260 })}><ZoomOut size={14} /></button>
      <button className={btn} onClick={() => fitView({ duration: 200, padding: 0.3 })}><Maximize2 size={13} /></button>
    </div>
  );
}

/** A learner-added node (free workspace, not graded). Stored apart from the framework. */
export interface CanvasUserNode {
  id: string;
  label: string;
  shape: CanvasShape;
  x: number;
  y: number;
}

/** Imperative handle so an external toolbar (e.g. the left panel) can add nodes. */
export interface FrameworkCanvasApi {
  addNode: (shape: CanvasUserNode["shape"]) => void;
}

export interface FrameworkCanvasProps {
  structure: FrameworkStructure | null | undefined;
  /** Learner-typed values, keyed by blank node id. */
  values?: Record<string, string>;
  onValuesChange?: (values: Record<string, string>) => void;
  /** Read-only (review or admin preview). */
  disabled?: boolean;
  /** Review map: blank node id → { isWrong, expected }. Shows correctness. */
  review?: Record<string, { isWrong: boolean; expected: string }>;
  /** Reveal blank-node expected labels (admin preview only). */
  revealAnswers?: boolean;
  backgroundText?: string;
  /** Allow the learner/admin to drag nodes into a layout they prefer. */
  nodesDraggable?: boolean;
  /** Admin edit mode: also allow drawing/deleting connections between nodes. */
  editable?: boolean;
  /** Fires (edit mode) after a connection is added/removed with the full edge list. */
  onEdgesChange?: (edges: { sourceId: string; targetId: string }[]) => void;
  /** Saved per-node position overrides (node id → {x,y}); seeds initial layout. */
  positions?: Record<string, { x: number; y: number }>;
  /** Fires after a drag with the full node id → {x,y} map, for persistence. */
  onPositionsChange?: (positions: Record<string, { x: number; y: number }>) => void;
  /** Learner authoring (case canvas): add/edit/delete/connect own nodes as a free workspace. */
  learnerAuthoring?: boolean;
  /** Learner-added nodes (seeds the canvas; persisted by the parent). */
  userNodes?: CanvasUserNode[];
  onUserNodesChange?: (nodes: CanvasUserNode[]) => void;
  /** Learner-added edges (between any nodes); persisted by the parent. */
  userEdges?: { sourceId: string; targetId: string }[];
  onUserEdgesChange?: (edges: { sourceId: string; targetId: string }[]) => void;
  /** Imperative handle for an external "add node" toolbar. */
  apiRef?: React.Ref<FrameworkCanvasApi>;
}

function InnerFrameworkCanvas({ structure, values, onValuesChange, disabled, review, revealAnswers, backgroundText, nodesDraggable = false, editable = false, onEdgesChange, positions, onPositionsChange, learnerAuthoring = false, userNodes, onUserNodesChange, userEdges, onUserEdgesChange, apiRef }: FrameworkCanvasProps) {
  const { fitView, zoomTo, getZoom, screenToFlowPosition } = useReactFlow();

  // Connecting + selecting are enabled for admin edit mode OR learner authoring.
  const canConnect = editable || learnerAuthoring;

  // ── Smooth wheel zoom ───────────────────────────────────────────────────────
  // React Flow's native wheel/pinch zoom is discrete (one jump per tick). We ease
  // toward a target zoom with rAF so zooming glides like the scroll-pan. Ctrl/⌘ +
  // wheel triggers it (trackpad pinch is delivered as ctrl+wheel); plain scroll is
  // left to panOnScroll. Cursor-position zoom is kept centred for predictability.
  const wheelWrapRef = useRef<HTMLDivElement>(null);
  const zoomTargetRef = useRef<number | null>(null);
  const zoomRafRef = useRef<number | null>(null);

  const animateZoom = useCallback(() => {
    const target = zoomTargetRef.current;
    if (target == null) { zoomRafRef.current = null; return; }
    const cur = getZoom();
    const next = cur + (target - cur) * 0.38; // easing factor (higher = snappier)
    if (Math.abs(target - cur) < 0.0015) {
      zoomTo(target);
      zoomTargetRef.current = null;
      zoomRafRef.current = null;
      return;
    }
    zoomTo(next);
    zoomRafRef.current = requestAnimationFrame(animateZoom);
  }, [getZoom, zoomTo]);

  useEffect(() => {
    const el = wheelWrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Plain scroll → let panOnScroll handle it (smooth pan in any direction).
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      e.stopPropagation();
      const base = zoomTargetRef.current ?? getZoom();
      // Exponential response → consistent feel whether zooming in or out.
      const factor = Math.exp(-e.deltaY * 0.003);
      zoomTargetRef.current = Math.min(2.5, Math.max(0.2, base * factor));
      if (zoomRafRef.current == null) zoomRafRef.current = requestAnimationFrame(animateZoom);
    };
    el.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      el.removeEventListener("wheel", onWheel, { capture: true } as any);
      if (zoomRafRef.current != null) cancelAnimationFrame(zoomRafRef.current);
    };
  }, [animateZoom, getZoom]);

  // Keep the latest callback + values without rebuilding handlers.
  const valuesRef = useRef(values ?? {});
  valuesRef.current = values ?? {};
  const onChangeRef = useRef(onValuesChange);
  onChangeRef.current = onValuesChange;
  // Seed positions (initial only) + latest persist callback, via refs.
  const positionsRef = useRef(positions ?? {});
  positionsRef.current = positions ?? {};
  const onPositionsChangeRef = useRef(onPositionsChange);
  onPositionsChangeRef.current = onPositionsChange;
  const onEdgesReportRef = useRef(onEdgesChange);
  onEdgesReportRef.current = onEdgesChange;
  // Learner-authoring: seed sources + persist callbacks via refs.
  const userNodesRef = useRef(userNodes ?? []);
  userNodesRef.current = userNodes ?? [];
  const userEdgesRef = useRef(userEdges ?? []);
  userEdgesRef.current = userEdges ?? [];
  const onUserNodesChangeRef = useRef(onUserNodesChange);
  onUserNodesChangeRef.current = onUserNodesChange;
  const onUserEdgesChangeRef = useRef(onUserEdgesChange);
  onUserEdgesChangeRef.current = onUserEdgesChange;

  const setNodeValue = useCallback((nodeId: string, v: string) => {
    onChangeRef.current?.({ ...valuesRef.current, [nodeId]: v });
  }, []);

  // Mutate a learner node's text in place (reporting effect publishes it up).
  const setUserNodeLabel = useCallback((nodeId: string, label: string) => {
    setRfNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, value: label } } : n)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remove a learner node + any edges touching it.
  const deleteUserNode = useCallback((nodeId: string) => {
    setRfNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setRfEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build a React Flow node for a learner-added node. Editable only while the
  // learner has the authoring toggle on; otherwise it's shown read-only.
  const makeUserRFNode = useCallback((un: CanvasUserNode): Node => {
    const editing = learnerAuthoring && !disabled;
    return {
      id: un.id,
      type: "userNode",
      position: { x: un.x, y: un.y },
      draggable: editing, connectable: editing, selectable: editing, deletable: editing,
      data: {
        value: un.label, shape: un.shape,
        disabled: !editing,
        connectable: canConnect && editing,
        onChange: (v: string) => setUserNodeLabel(un.id, v),
        onDelete: editing ? () => deleteUserNode(un.id) : undefined,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerAuthoring, disabled, canConnect, setUserNodeLabel, deleteUserNode]);

  // Drop a fresh node of the chosen shape. With a cursor position (drag-and-drop)
  // it lands under the cursor; without one (click) it lands near the viewport centre.
  const addUserNode = useCallback((shape: CanvasUserNode["shape"], client?: { x: number; y: number }) => {
    let x: number, y: number;
    if (client) {
      const p = screenToFlowPosition({ x: client.x, y: client.y });
      x = p.x - 80; y = p.y - 24; // centre the node under the cursor
    } else {
      const rect = wheelWrapRef.current?.getBoundingClientRect();
      const base = rect
        ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        : { x: 200, y: 200 };
      const jitter = () => Math.round((Math.random() - 0.5) * 80);
      x = base.x + jitter() - 80; y = base.y + jitter() - 28;
    }
    const un: CanvasUserNode = {
      id: `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      label: "", shape, x, y,
    };
    setRfNodes((nds) => [...nds, makeUserRFNode(un)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makeUserRFNode, screenToFlowPosition]);

  // Accept a shape dragged from the left-panel palette, dropped at the cursor.
  const onCanvasDragOver = useCallback((e: React.DragEvent) => {
    if (!learnerAuthoring || disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, [learnerAuthoring, disabled]);

  const onCanvasDrop = useCallback((e: React.DragEvent) => {
    if (!learnerAuthoring || disabled) return;
    e.preventDefault();
    const shape = e.dataTransfer.getData("application/shankh-shape");
    if (!isCanvasShape(shape)) return;
    addUserNode(shape, { x: e.clientX, y: e.clientY });
  }, [addUserNode, learnerAuthoring, disabled]);

  // Expose add-node to an external toolbar (left panel) — used for click-to-add.
  useImperativeHandle(apiRef, () => ({ addNode: addUserNode }), [addUserNode]);

  // ── Nodes ─────────────────────────────────────────────────────────────────
  // Build the React Flow nodes from the framework structure. Reads the latest
  // typed values from the ref so a rebuild doesn't clobber in-progress input.
  const buildNodes = useCallback((): Node[] => {
    const fwNodes = (structure?.nodes ?? []).map((n): Node => {
      const saved = positionsRef.current[n.id];
      const base = {
        id: n.id,
        position: { x: saved?.x ?? n.x, y: saved?.y ?? n.y },
        draggable: nodesDraggable,
        connectable: canConnect,
        selectable: nodesDraggable || canConnect,
        deletable: false, // framework nodes are defined in the side panel, never deleted on-canvas
      };
      if (n.isBlank) {
        return {
          ...base,
          type: "inputNode",
          data: {
            // admin preview: prefill the box with the expected answer so it's visible
            value: revealAnswers ? n.label : (valuesRef.current[n.id] ?? ""),
            disabled, canDrag: nodesDraggable, connectable: canConnect,
            shape: n.shape, color: n.color,
            review: review?.[n.id],
            onChange: (v: string) => setNodeValue(n.id, v),
          },
        };
      }
      return {
        ...base,
        type: "lockedNode",
        data: { label: n.label, shape: n.shape, color: n.color, connectable: canConnect },
      };
    });
    // Append the learner's own nodes (shown always; editable only when toggled on).
    const uNodes = userNodesRef.current.map(makeUserRFNode);
    return [...fwNodes, ...uNodes];
  },
    [structure, nodesDraggable, canConnect, disabled, review, revealAnswers, setNodeValue, learnerAuthoring, makeUserRFNode],
  );

  // React Flow owns node state so drags persist (positions aren't graded — the
  // grader compares the picked framework + typed values — so this is purely a
  // nicer working layout for the learner/admin).
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const nodesRef = useRef<Node[]>(rfNodes);
  nodesRef.current = rfNodes;

  // After a drag, publish the framework layout so the parent can persist it.
  // (Learner-node positions ride along via the reporting effect below.)
  const handleNodeDragStop = useCallback(() => {
    const map: Record<string, { x: number; y: number }> = {};
    for (const n of nodesRef.current) {
      if (n.type === "userNode") continue;
      map[n.id] = { x: n.position.x, y: n.position.y };
    }
    onPositionsChangeRef.current?.(map);
  }, []);

  // Publish learner nodes (add / edit / move / delete) up for persistence.
  // Signature-gated so we only fire on a real change, not every render.
  const lastUserNodeSig = useRef<string | null>(null);
  useEffect(() => {
    if (!learnerAuthoring) return;
    const uNodes: CanvasUserNode[] = rfNodes
      .filter((n) => n.type === "userNode")
      .map((n) => ({
        id: n.id,
        label: (n.data?.value as string) ?? "",
        shape: (n.data?.shape as CanvasUserNode["shape"]) ?? "rectangle",
        x: n.position.x, y: n.position.y,
      }));
    const sig = JSON.stringify(uNodes);
    if (sig === lastUserNodeSig.current) return;
    lastUserNodeSig.current = sig;
    onUserNodesChangeRef.current?.(uNodes);
  }, [rfNodes, learnerAuthoring]);

  // Full rebuild only when the node set (id + blank/locked kind + draggability)
  // actually changes — a signature avoids resetting positions on every keystroke.
  const structureSig = useMemo(
    () => `${(structure?.nodes ?? []).map((n) => `${n.id}:${n.isBlank ? 1 : 0}`).join("|")}::${nodesDraggable}::${editable}::${learnerAuthoring}`,
    [structure, nodesDraggable, editable, learnerAuthoring],
  );
  const lastSig = useRef<string | null>(null);
  useEffect(() => {
    if (lastSig.current !== structureSig) {
      lastSig.current = structureSig;
      setRfNodes(buildNodes());
    }
  }, [structureSig, buildNodes, setRfNodes]);

  // Patch node data (label/shape/colour + input value/review) in place so edits
  // and post-submit review colouring never disturb dragged positions.
  useEffect(() => {
    const byId = new Map((structure?.nodes ?? []).map((n) => [n.id, n]));
    setRfNodes((nds) => nds.map((n) => {
      const sn = byId.get(n.id);
      if (!sn) return n;
      if (n.type === "inputNode") {
        return { ...n, data: { ...n.data, value: revealAnswers ? sn.label : ((values ?? {})[n.id] ?? ""), disabled, review: review?.[n.id], shape: sn.shape, color: sn.color } };
      }
      return { ...n, data: { ...n.data, label: sn.label, shape: sn.shape, color: sn.color } };
    }));
  }, [structure, values, disabled, review, revealAnswers, setRfNodes]);

  // ── Edges ────────────────────────────────────────────────────────────────
  const buildEdges = useCallback((): Edge[] => {
    const fwEdges: Edge[] = (structure?.edges ?? []).map((e, i) => ({
      id: e.id || `fw-${i}`, source: e.sourceId, target: e.targetId,
      // Top-down tree: leave each parent from its bottom handle into the child's top.
      sourceHandle: "b", targetHandle: "t",
      ...EDGE_OPTS, ...(editable ? { type: "fwDeletable" } : {}),
    }));
    // Learner-drawn edges — shown always; deletable only while authoring is on.
    const uEdges: Edge[] = userEdgesRef.current.map((e, i) => ({
      id: `ue-${i}-${e.sourceId}-${e.targetId}`, source: e.sourceId, target: e.targetId,
      ...EDGE_OPTS, ...(learnerAuthoring ? { type: "fwDeletable" } : {}), data: { userEdge: true },
    }));
    return [...fwEdges, ...uEdges];
  },
    [structure, editable, learnerAuthoring],
  );

  const [rfEdges, setRfEdges, onEdgesChangeRF] = useEdgesState<Edge>(buildEdges());
  // Signature of the edge set, so external changes (e.g. a node deletion pruning
  // its edges) reseed, while local connect/delete don't get echoed back & clobbered.
  const edgeSig = useMemo(
    () => `${(structure?.edges ?? []).map((e) => `${e.sourceId}>${e.targetId}`).sort().join("|")}::${learnerAuthoring}`,
    [structure, learnerAuthoring],
  );
  const lastEdgeSeedSig = useRef(edgeSig);
  const lastReportedSig = useRef(edgeSig);
  const lastUserEdgeSig = useRef<string | null>(null);
  useEffect(() => {
    if (lastEdgeSeedSig.current === edgeSig) return;
    lastEdgeSeedSig.current = edgeSig;
    lastReportedSig.current = edgeSig; // external change — don't report it back
    setRfEdges(buildEdges());
  }, [edgeSig, buildEdges, setRfEdges]);

  // Report local connect/delete up, skipping echoes of the seed.
  // Admin edit mode reports ALL edges; learner authoring reports only its own.
  useEffect(() => {
    if (editable) {
      const sig = rfEdges.map((e) => `${e.source}>${e.target}`).sort().join("|");
      if (sig === lastReportedSig.current) return;
      lastReportedSig.current = sig;
      onEdgesReportRef.current?.(rfEdges.map((e) => ({ sourceId: e.source as string, targetId: e.target as string })));
      return;
    }
    if (!learnerAuthoring) return;
    const userEs = rfEdges.filter((e) => (e.data as any)?.userEdge);
    const sig = userEs.map((e) => `${e.source}>${e.target}`).sort().join("|");
    if (sig === lastUserEdgeSig.current) return;
    lastUserEdgeSig.current = sig;
    onUserEdgesChangeRef.current?.(userEs.map((e) => ({ sourceId: e.source as string, targetId: e.target as string })));
  }, [rfEdges, editable, learnerAuthoring]);

  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return;
    const isUser = learnerAuthoring && !editable;
    setRfEdges((eds) => addEdge(
      {
        source: c.source!, target: c.target!,
        sourceHandle: c.sourceHandle ?? "b", targetHandle: c.targetHandle ?? "t",
        id: isUser ? `${c.source}->${c.target}-${Date.now().toString(36)}` : `${c.source}->${c.target}`,
        ...EDGE_OPTS, type: "fwDeletable",
        ...(isUser ? { data: { userEdge: true } } : {}),
      },
      eds,
    ));
  }, [setRfEdges, learnerAuthoring, editable]);

  // Prune edges touching a node removed via the Delete key (authoring mode).
  const onNodesDelete = useCallback((deleted: Node[]) => {
    const ids = new Set(deleted.map((d) => d.id));
    setRfEdges((eds) => eds.filter((e) => !ids.has(e.source) && !ids.has(e.target)));
  }, [setRfEdges]);

  useEffect(() => {
    if ((structure?.nodes?.length ?? 0) > 0) {
      const t = setTimeout(() => fitView({ duration: 350, padding: 0.3 }), 80);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structure]);

  return (
    <div ref={wheelWrapRef} className={`shankh-fw-canvas w-full h-full${canConnect ? " editable" : ""}`} style={{ background: "#f8f5f0" }} onDragOver={onCanvasDragOver} onDrop={onCanvasDrop}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChangeRF}
        onConnect={canConnect ? onConnect : undefined}
        onNodesDelete={canConnect ? onNodesDelete : undefined}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={connectionLineStyle}
        connectionRadius={36}
        nodesDraggable={nodesDraggable}
        nodesConnectable={canConnect}
        elementsSelectable={nodesDraggable || canConnect}
        deleteKeyCode={canConnect ? ["Backspace", "Delete"] : null}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        zoomActivationKeyCode={null as any}
        panOnScroll
        panOnScrollSpeed={1.4}
        panOnScrollMode={"free" as any}
        panOnDrag={[0, 1, 2]}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#c8c8cc" />
        <Panel position="bottom-left" style={{ margin: "0 0 16px 16px" }}>
          <ZoomControls />
        </Panel>
        {backgroundText && (
          <Panel position="top-center" style={{ marginTop: 12 }}>
            <div className="px-4 py-1.5 bg-white/70 backdrop-blur-sm rounded-full border border-zinc-200/80 text-[10px] font-bold text-zinc-400 uppercase tracking-widest shadow-sm pointer-events-none select-none">
              {backgroundText}
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Scoped styles — reveal connect handles / edge-delete buttons on hover (edit mode). */}
      <style>{`
        .shankh-fw-canvas.editable .rf-fw-node:hover .react-flow__handle { opacity: 1 !important; }
        .shankh-fw-canvas.editable .react-flow__handle:hover { opacity: 1 !important; transform: scale(1.4) !important; }
        .shankh-fw-canvas.editable .rf-fw-node:hover .rf-fw-node-del,
        .shankh-fw-canvas.editable .react-flow__node.selected .rf-fw-node-del { opacity: 1 !important; }
        .shankh-fw-canvas.editable .react-flow__edge:hover .rf-fw-edge-del,
        .shankh-fw-canvas.editable .react-flow__edge.selected .rf-fw-edge-del { opacity: 1 !important; }
        .shankh-fw-canvas.editable .react-flow__connection-line { animation: rf-fw-dash 0.5s linear infinite; }
        @keyframes rf-fw-dash { to { stroke-dashoffset: -18; } }
      `}</style>
    </div>
  );
}

export const FrameworkCanvas = (props: FrameworkCanvasProps) => (
  <ReactFlowProvider>
    <InnerFrameworkCanvas {...props} />
  </ReactFlowProvider>
);
