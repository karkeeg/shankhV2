"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
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

const nodeTypes: NodeTypes = { lockedNode: LockedNode, inputNode: InputNode };

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
      <button className={`${btn} border-b`} onClick={() => zoomIn({ duration: 150 })}><ZoomIn size={14} /></button>
      <button className={`${btn} border-b`} onClick={() => zoomOut({ duration: 150 })}><ZoomOut size={14} /></button>
      <button className={btn} onClick={() => fitView({ duration: 200, padding: 0.25 })}><Maximize2 size={13} /></button>
    </div>
  );
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
}

function InnerFrameworkCanvas({ structure, values, onValuesChange, disabled, review, revealAnswers, backgroundText, nodesDraggable = false, editable = false, onEdgesChange, positions, onPositionsChange }: FrameworkCanvasProps) {
  const { fitView } = useReactFlow();

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

  const setNodeValue = useCallback((nodeId: string, v: string) => {
    onChangeRef.current?.({ ...valuesRef.current, [nodeId]: v });
  }, []);

  // ── Nodes ─────────────────────────────────────────────────────────────────
  // Build the React Flow nodes from the framework structure. Reads the latest
  // typed values from the ref so a rebuild doesn't clobber in-progress input.
  const buildNodes = useCallback((): Node[] =>
    (structure?.nodes ?? []).map((n) => {
      const saved = positionsRef.current[n.id];
      const base = {
        id: n.id,
        position: { x: saved?.x ?? n.x, y: saved?.y ?? n.y },
        draggable: nodesDraggable,
        connectable: editable,
        selectable: nodesDraggable || editable,
        deletable: false, // nodes are defined in the side panel, never via canvas Delete
      };
      if (n.isBlank) {
        return {
          ...base,
          type: "inputNode",
          data: {
            // admin preview: prefill the box with the expected answer so it's visible
            value: revealAnswers ? n.label : (valuesRef.current[n.id] ?? ""),
            disabled, canDrag: nodesDraggable, connectable: editable,
            shape: n.shape, color: n.color,
            review: review?.[n.id],
            onChange: (v: string) => setNodeValue(n.id, v),
          },
        };
      }
      return {
        ...base,
        type: "lockedNode",
        data: { label: n.label, shape: n.shape, color: n.color, connectable: editable },
      };
    }),
    [structure, nodesDraggable, editable, disabled, review, revealAnswers, setNodeValue],
  );

  // React Flow owns node state so drags persist (positions aren't graded — the
  // grader compares the picked framework + typed values — so this is purely a
  // nicer working layout for the learner/admin).
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const nodesRef = useRef<Node[]>(rfNodes);
  nodesRef.current = rfNodes;

  // After a drag, publish the new layout so the parent can persist it.
  const handleNodeDragStop = useCallback(() => {
    const map: Record<string, { x: number; y: number }> = {};
    for (const n of nodesRef.current) map[n.id] = { x: n.position.x, y: n.position.y };
    onPositionsChangeRef.current?.(map);
  }, []);

  // Full rebuild only when the node set (id + blank/locked kind + draggability)
  // actually changes — a signature avoids resetting positions on every keystroke.
  const structureSig = useMemo(
    () => `${(structure?.nodes ?? []).map((n) => `${n.id}:${n.isBlank ? 1 : 0}`).join("|")}::${nodesDraggable}::${editable}`,
    [structure, nodesDraggable, editable],
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
  const buildEdges = useCallback((): Edge[] =>
    (structure?.edges ?? []).map((e, i) => ({
      id: e.id || `fw-${i}`, source: e.sourceId, target: e.targetId,
      // Top-down tree: leave each parent from its bottom handle into the child's top.
      sourceHandle: "b", targetHandle: "t",
      ...EDGE_OPTS, ...(editable ? { type: "fwDeletable" } : {}),
    })),
    [structure, editable],
  );

  const [rfEdges, setRfEdges, onEdgesChangeRF] = useEdgesState<Edge>(buildEdges());
  // Signature of the edge set, so external changes (e.g. a node deletion pruning
  // its edges) reseed, while local connect/delete don't get echoed back & clobbered.
  const edgeSig = useMemo(
    () => (structure?.edges ?? []).map((e) => `${e.sourceId}>${e.targetId}`).sort().join("|"),
    [structure],
  );
  const lastEdgeSeedSig = useRef(edgeSig);
  const lastReportedSig = useRef(edgeSig);
  useEffect(() => {
    if (lastEdgeSeedSig.current === edgeSig) return;
    lastEdgeSeedSig.current = edgeSig;
    lastReportedSig.current = edgeSig; // external change — don't report it back
    setRfEdges(buildEdges());
  }, [edgeSig, buildEdges, setRfEdges]);

  // Report local connect/delete up (edit mode only), skipping echoes of the seed.
  useEffect(() => {
    if (!editable) return;
    const sig = rfEdges.map((e) => `${e.source}>${e.target}`).sort().join("|");
    if (sig === lastReportedSig.current) return;
    lastReportedSig.current = sig;
    onEdgesReportRef.current?.(rfEdges.map((e) => ({ sourceId: e.source as string, targetId: e.target as string })));
  }, [rfEdges, editable]);

  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return;
    setRfEdges((eds) => addEdge(
      { source: c.source!, target: c.target!, sourceHandle: "b", targetHandle: "t", id: `${c.source}->${c.target}`, ...EDGE_OPTS, type: "fwDeletable" },
      eds,
    ));
  }, [setRfEdges]);

  useEffect(() => {
    if ((structure?.nodes?.length ?? 0) > 0) {
      const t = setTimeout(() => fitView({ duration: 350, padding: 0.25 }), 80);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structure]);

  return (
    <div className={`shankh-fw-canvas w-full h-full${editable ? " editable" : ""}`} style={{ background: "#f8f5f0" }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChangeRF}
        onConnect={editable ? onConnect : undefined}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={connectionLineStyle}
        connectionRadius={36}
        nodesDraggable={nodesDraggable}
        nodesConnectable={editable}
        elementsSelectable={nodesDraggable || editable}
        deleteKeyCode={editable ? ["Backspace", "Delete"] : null}
        zoomOnScroll={false}
        zoomOnPinch
        zoomOnDoubleClick={false}
        zoomActivationKeyCode="Control"
        panOnScroll
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
