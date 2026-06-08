"use client";

import React, { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Node,
  Edge,
  Connection,
  NodeTypes,
  MarkerType,
  useReactFlow,
  NodeProps,
  Panel,
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
  ConnectionMode,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

// ─── Excalidraw colour palette ────────────────────────────────────────────────
const SHAPE_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  rectangle: { bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a" },
  ellipse:   { bg: "#dcfce7", border: "#22c55e", text: "#14532d" },
  diamond:   { bg: "#f3e8ff", border: "#a855f7", text: "#581c87" },
  equation:  { bg: "#fef9c3", border: "#eab308", text: "#713f12" },
  shape:     { bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a" },
  pill:      { bg: "#ffe4e6", border: "#f43f5e", text: "#881337" },
};

// ─── Token node ───────────────────────────────────────────────────────────────
function TokenNode({ data, selected }: NodeProps) {
  const shape  = (data.shape as string) || "rectangle";
  const st     = SHAPE_STYLE[shape] ?? SHAPE_STYLE.rectangle;
  const isDiam = shape === "diamond";
  const shadow = selected
    ? `0 0 0 3px ${st.border}55, 0 4px 12px rgba(0,0,0,0.12)`
    : "0 2px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)";

  // All four handles are source type with ConnectionMode.Loose — any handle
  // can be either end of a connection, exactly like Excalidraw/Figma.
  const hStyle: React.CSSProperties = {
    width: 10, height: 10,
    backgroundColor: "#22c55e",
    border: "2px solid white",
    opacity: 0,
    transition: "opacity 0.12s ease, transform 0.12s ease",
    borderRadius: "50%",
  };

  return (
    <div className="rf-node" style={{ position: "relative", width: isDiam ? 108 : 156, height: isDiam ? 108 : 54 }}>
      <Handle type="source" position={Position.Top}    style={hStyle} id="t" />
      <Handle type="source" position={Position.Bottom} style={hStyle} id="b" />
      <Handle type="source" position={Position.Left}   style={hStyle} id="l" />
      <Handle type="source" position={Position.Right}  style={hStyle} id="r" />

      {isDiam ? (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 80, height: 80,
            backgroundColor: st.bg,
            border: `2.5px solid ${st.border}`,
            borderRadius: 5,
            transform: "rotate(45deg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: shadow,
            transition: "box-shadow 0.15s ease",
          }}>
            <span style={{
              transform: "rotate(-45deg)",
              color: st.text, fontSize: 10, fontWeight: 800,
              textAlign: "center", lineHeight: 1.25,
              maxWidth: 56, display: "block",
              wordBreak: "break-word", padding: "0 4px",
            }}>
              {data.label as string}
            </span>
          </div>
        </div>
      ) : (
        <div style={{
          width: "100%", height: "100%",
          backgroundColor: st.bg,
          border: `2.5px solid ${st.border}`,
          borderRadius: shape === "ellipse" ? 9999 : 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: shadow,
          transition: "box-shadow 0.15s ease",
        }}>
          <span style={{
            color: st.text, fontSize: 11, fontWeight: 800,
            textAlign: "center", lineHeight: 1.3,
            padding: "0 12px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          } as React.CSSProperties}>
            {data.label as string}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Deletable straight-step edge ─────────────────────────────────────────────
function DeletableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style }: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 6,
  });
  const { setEdges } = useReactFlow();

  return (
    <>
      {/* Wide transparent hit-area so the edge is easy to hover */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={16} style={{ pointerEvents: "stroke" }} />
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="rf-edge-del nodrag nopan"
          style={{
            position: "absolute",
            transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            opacity: 0,
            transition: "opacity 0.12s ease",
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setEdges(eds => eds.filter(ed => ed.id !== id)); }}
            className="w-5 h-5 rounded-full bg-white border border-zinc-300 shadow-md flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:border-rose-300 transition-all"
          >
            <X size={9} strokeWidth={3} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// ─── Zoom controls (styled to match Excalidraw) ───────────────────────────────
function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const btnCls = "w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 active:scale-95 transition-all";
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 shadow-md">
      <button className={`${btnCls} border-b`} onClick={() => zoomIn({ duration: 150 })} title="Zoom in"><ZoomIn size={14} /></button>
      <button className={`${btnCls} border-b`} onClick={() => zoomOut({ duration: 150 })} title="Zoom out"><ZoomOut size={14} /></button>
      <button className={btnCls} onClick={() => fitView({ duration: 200, padding: 0.3 })} title="Fit view"><Maximize2 size={13} /></button>
    </div>
  );
}

// ─── Statics (defined outside component so identity is stable) ────────────────
const nodeTypes: NodeTypes = { tokenNode: TokenNode };
const edgeTypes = { deletable: DeletableEdge };
const defaultEdgeOptions = {
  type: "deletable",
  markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8", width: 14, height: 14 },
  style: { stroke: "#94a3b8", strokeWidth: 2 },
};
const connectionLineStyle: React.CSSProperties = { stroke: "#22c55e", strokeWidth: 2, strokeDasharray: "6 3" };

// ─── Public types ─────────────────────────────────────────────────────────────
export interface CanvasGraph { nodes: Node[]; edges: Edge[]; }
export interface CanvasExerciseProps {
  canvasBackgroundText?: string;
  onElementsChange?: (graph: CanvasGraph) => void;
  initialElements?: CanvasGraph | null | any[];
  tokens?: any[];
  assemblyMode?: "sequence" | "graph";
  disabled?: boolean;
}

// ─── Inner canvas ─────────────────────────────────────────────────────────────
function InnerCanvas({ canvasBackgroundText, onElementsChange, initialElements, disabled }: CanvasExerciseProps) {
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Ignore legacy Excalidraw arrays
  const initData = (!Array.isArray(initialElements) && (initialElements as any)?.nodes)
    ? initialElements as CanvasGraph
    : null;

  const [nodes, setNodes, onNodesChange] = useNodesState(initData?.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initData?.edges ?? []);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fit view once on mount if initial nodes exist
  useEffect(() => {
    if ((initData?.nodes?.length ?? 0) > 0) {
      const t = setTimeout(() => fitView({ duration: 400, padding: 0.25 }), 80);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Report changes (debounced 300 ms)
  useEffect(() => {
    if (!onElementsChange) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onElementsChange({ nodes, edges }), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [nodes, edges, onElementsChange]);

  const onConnect = useCallback((conn: Connection) => {
    setEdges(eds => addEdge({ ...conn, ...defaultEdgeOptions }, eds));
  }, [setEdges]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("canvas/flow-item");
    if (!raw) return;
    const item = JSON.parse(raw) as { id: string; type: string; label: string; content: string };
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setNodes(prev => [...prev, {
      id: `${item.id}-${Date.now()}`,
      type: "tokenNode",
      position,
      data: { tokenId: item.id, label: item.label || item.content || item.id, shape: item.type },
    }]);
  }, [screenToFlowPosition, setNodes]);

  const isEmpty = nodes.length === 0;

  return (
    <div className="shankh-canvas w-full h-full" style={{ background: "#f8f5f0" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={connectionLineStyle}
        connectionRadius={36}
        deleteKeyCode={["Backspace", "Delete"]}
        // Zoom: Ctrl/Cmd+scroll or pinch to zoom; plain scroll pans
        zoomOnScroll={false}
        zoomOnPinch
        zoomOnDoubleClick={false}
        zoomActivationKeyCode="Control"
        // Pan: scroll pans naturally; left/middle/right drag also pans
        panOnScroll
        panOnScrollSpeed={1.4}
        panOnScrollMode={"free" as any}
        panOnDrag={[0, 1, 2]}
        // Zoom range — tighter range feels more controlled
        minZoom={0.2}
        maxZoom={2.5}
        // Disable default Controls — we render our own
        proOptions={{ hideAttribution: true }}
        nodesDraggable={!disabled}
        nodesConnectable={!disabled}
        elementsSelectable={!disabled}
        snapToGrid={false}
        style={{ background: "transparent" }}
      >
        {/* Excalidraw-style dot grid */}
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#c8c8cc" />

        {/* Custom zoom controls — bottom-left like Excalidraw */}
        <Panel position="bottom-left" style={{ margin: "0 0 16px 16px" }}>
          <ZoomControls />
        </Panel>

        {/* Watermark */}
        {canvasBackgroundText && (
          <Panel position="top-center" style={{ marginTop: 12 }}>
            <div className="px-4 py-1.5 bg-white/70 backdrop-blur-sm rounded-full border border-zinc-200/80 text-[10px] font-bold text-zinc-400 uppercase tracking-widest shadow-sm pointer-events-none select-none">
              {canvasBackgroundText}
            </div>
          </Panel>
        )}

        {/* Empty-state hint */}
        {isEmpty && (
          <Panel position="top-center" style={{ marginTop: 72 }}>
            <div className="flex flex-col items-center gap-3 pointer-events-none select-none">
              <div className="flex items-center gap-3">
                {[
                  { s: "rectangle", w: 76, h: 34, r: 8 },
                  { s: "ellipse",   w: 76, h: 34, r: 9999 },
                  { s: "diamond",   w: 36, h: 36, r: 4, rotate: true },
                ].map(({ s, w, h, r, rotate }) => {
                  const st = SHAPE_STYLE[s];
                  return (
                    <div key={s} style={{
                      width: w, height: h,
                      backgroundColor: st.bg,
                      border: `2px dashed ${st.border}60`,
                      borderRadius: r,
                      transform: rotate ? "rotate(45deg)" : undefined,
                    }} />
                  );
                })}
              </div>
              <p className="text-[11px] font-semibold text-zinc-400 text-center max-w-[280px] leading-relaxed">
                Drag tokens from the panel onto the canvas<br />
                <span className="text-zinc-300">Hover a node to see handles · Scroll to pan · Ctrl+Scroll to zoom</span>
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Scoped styles — prefixed with .shankh-canvas to avoid bleed */}
      <style>{`
        .shankh-canvas .react-flow__viewport {
          transition: transform 80ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform;
        }
        .shankh-canvas .react-flow__viewport.react-flow__viewport--dragging {
          transition: none;
        }
        .shankh-canvas .rf-node:hover .react-flow__handle {
          opacity: 1 !important;
        }
        .shankh-canvas .react-flow__handle:hover {
          opacity: 1 !important;
          transform: scale(1.5) !important;
        }
        .shankh-canvas .react-flow__edge:hover .rf-edge-del,
        .shankh-canvas .react-flow__edge.selected .rf-edge-del {
          opacity: 1 !important;
        }
        .shankh-canvas .react-flow__node {
          transition: filter 0.15s ease;
        }
        .shankh-canvas .react-flow__node:hover {
          filter: brightness(1.03);
        }
        .shankh-canvas .react-flow__node.selected {
          filter: brightness(1.0);
        }
        .shankh-canvas .react-flow__connection-line {
          animation: rf-dash 0.5s linear infinite;
        }
        @keyframes rf-dash {
          to { stroke-dashoffset: -18; }
        }
      `}</style>
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────
export const CanvasExercise = (props: CanvasExerciseProps) => (
  <ReactFlowProvider>
    <InnerCanvas {...props} />
  </ReactFlowProvider>
);
