"use client";

import React, {
  useState, useRef, useCallback, useEffect,
  forwardRef, useImperativeHandle,
} from "react";
import { cn } from "@/lib/utils";
import {
  PaletteItem, PlacedNode, CanvasEdge, SolutionSnapshot, GradeResult,
  EdgeStatus, CanvasSnapshot, NODE_W, NODE_H, edgeKey,
  nodeCx, nodeCy, borderPoint, bezierPath,
} from "./types";

// ─── Arrow marker defs ────────────────────────────────────────────────────────

const EDGE_COLORS: Record<EdgeStatus, string> = {
  normal:  "#94a3b8",
  correct: "#22c55e",
  wrong:   "#ef4444",
  missing: "#f97316",
};

function ArrowDefs() {
  return (
    <defs>
      {(Object.entries(EDGE_COLORS) as [EdgeStatus, string][]).map(([s, c]) => (
        <marker key={s} id={`cw-arrow-${s}`} markerWidth="10" markerHeight="7"
          refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={c} />
        </marker>
      ))}
      <marker id="cw-arrow-ghost" markerWidth="10" markerHeight="7"
        refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" opacity="0.5" />
      </marker>
    </defs>
  );
}

// ─── Node shape ───────────────────────────────────────────────────────────────

function NodeShape({ node, isSource, isTarget }: {
  node: PlacedNode; isSource: boolean; isTarget: boolean;
}) {
  const ring = isSource
    ? "ring-2 ring-blue-500 ring-offset-1 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]"
    : isTarget
    ? "ring-2 ring-emerald-500 ring-offset-1 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]"
    : "";

  const label = (
    <span className="text-[11px] font-black text-center px-2 leading-tight select-none">
      {node.label}
    </span>
  );

  if (node.shape === "ellipse") {
    return (
      <div className={cn("w-full h-full rounded-full flex items-center justify-center border-2 border-white/60 shadow-sm transition-all", ring)}
        style={{ backgroundColor: node.color }}>
        {label}
      </div>
    );
  }
  if (node.shape === "diamond") {
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div className={cn("absolute border-2 border-white/60 shadow-sm transition-all", ring)}
          style={{ width: NODE_H - 4, height: NODE_H - 4, backgroundColor: node.color, transform: "rotate(45deg)" }} />
        <span className="relative z-10 text-[10px] font-black text-center px-1 leading-tight select-none">
          {node.label}
        </span>
      </div>
    );
  }
  return (
    <div className={cn("w-full h-full rounded-xl flex items-center justify-center border-2 border-white/60 shadow-sm transition-all", ring)}
      style={{ backgroundColor: node.color }}>
      {label}
    </div>
  );
}

// ─── Public handle (exposed via ref) ──────────────────────────────────────────

export interface CanvasWorkspaceHandle {
  getSnapshot: () => CanvasSnapshot;
  reset: () => void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CanvasWorkspaceProps {
  paletteItems: PaletteItem[];
  initialNodes?: PlacedNode[];
  initialEdges?: CanvasEdge[];
  solutionSnapshot?: SolutionSnapshot | null;
  gradeResult?: GradeResult | null;
  showBreakdown?: boolean;
  disabled?: boolean;
  /** Fired whenever the set of placed node IDs changes — lets parent dim palette chips */
  onPlacedIdsChange?: (ids: Set<string>) => void;
  /** Fired (debounced 400 ms) whenever nodes or edges change — use for draft persistence */
  onSnapshot?: (snapshot: CanvasSnapshot) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
// CanvasWorkspace — pure canvas area, no palette panel, no submit button
// ═════════════════════════════════════════════════════════════════════════════

export const CanvasWorkspace = forwardRef<CanvasWorkspaceHandle, CanvasWorkspaceProps>(
  function CanvasWorkspace({
    paletteItems,
    initialNodes = [],
    initialEdges = [],
    solutionSnapshot,
    gradeResult,
    showBreakdown = false,
    disabled = false,
    onPlacedIdsChange,
    onSnapshot,
  }, ref) {
    const canvasRef = useRef<HTMLDivElement>(null);

    const [nodes, setNodes] = useState<PlacedNode[]>(initialNodes);
    const [edges, setEdges] = useState<CanvasEdge[]>(initialEdges);
    const [connecting, setConnecting] = useState<string | null>(null);
    const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [dragging, setDragging] = useState<{ nodeId: string; ox: number; oy: number } | null>(null);

    // Notify parent of placed IDs whenever nodes change
    useEffect(() => {
      onPlacedIdsChange?.(new Set(nodes.map(n => n.id)));
    }, [nodes, onPlacedIdsChange]);

    // Fire onSnapshot (debounced) whenever nodes or edges change, for draft persistence
    useEffect(() => {
      if (!onSnapshot || disabled || gradeResult) return;
      const t = setTimeout(() => onSnapshot({ nodes, edges }), 400);
      return () => clearTimeout(t);
    }, [nodes, edges, onSnapshot, disabled, gradeResult]);

    // Expose handle to parent
    useImperativeHandle(ref, () => ({
      getSnapshot: () => ({ nodes, edges }),
      reset: () => {
        setNodes([]);
        setEdges([]);
        setConnecting(null);
        setHoveredTarget(null);
        onPlacedIdsChange?.(new Set());
      },
    }), [nodes, edges, onPlacedIdsChange]);

    // ── Compute grade overlay data ───────────────────────────────────────────────
    const edgeStatusMap: Record<string, EdgeStatus> = {};
    const missingEdges: CanvasEdge[] = [];
    if (gradeResult && showBreakdown) {
      const correctSet = new Set(gradeResult.correct);
      const wrongSet = new Set(gradeResult.wrong);
      edges.forEach(e => {
        const k = edgeKey(e.sourceId, e.targetId);
        edgeStatusMap[e.id] = correctSet.has(k) ? "correct" : wrongSet.has(k) ? "wrong" : "normal";
      });
      gradeResult.missing.forEach((k, i) => {
        const [src, tgt] = k.split("→");
        missingEdges.push({ id: `missing-${i}`, sourceId: src, targetId: tgt });
      });
    }

    // ── Drop from palette ──────────────────────────────────────────────────────
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled || gradeResult) return;
      const itemId = e.dataTransfer.getData("canvas/item-id");
      if (!itemId || nodes.find(n => n.id === itemId)) return;
      const item = paletteItems.find(i => i.id === itemId);
      if (!item) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      setNodes(prev => [...prev, {
        ...item,
        x: Math.max(0, e.clientX - rect.left - NODE_W / 2),
        y: Math.max(0, e.clientY - rect.top - NODE_H / 2),
      }]);
    };

    // ── Node interactions ──────────────────────────────────────────────────────
    const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled || gradeResult) return;
      if (connecting === null) {
        setConnecting(nodeId);
      } else {
        if (connecting !== nodeId) {
          const exists = edges.some(ed => ed.sourceId === connecting && ed.targetId === nodeId);
          if (!exists) setEdges(prev => [...prev, { id: crypto.randomUUID(), sourceId: connecting, targetId: nodeId }]);
        }
        setConnecting(null);
        setHoveredTarget(null);
      }
    }, [connecting, edges, disabled, gradeResult]);

    const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
      if (connecting !== null || disabled || gradeResult) return;
      e.stopPropagation(); e.preventDefault();
      const node = nodes.find(n => n.id === nodeId)!;
      const rect = canvasRef.current!.getBoundingClientRect();
      setDragging({ nodeId, ox: e.clientX - rect.left - node.x, oy: e.clientY - rect.top - node.y });
    }, [connecting, nodes, disabled, gradeResult]);

    const handleNodeDoubleClick = useCallback((nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled || gradeResult) return;
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setEdges(prev => prev.filter(ed => ed.sourceId !== nodeId && ed.targetId !== nodeId));
      if (connecting === nodeId) setConnecting(null);
    }, [connecting, disabled, gradeResult]);

    // ── Canvas mouse ────────────────────────────────────────────────────────────
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
      if (dragging) {
        setNodes(prev => prev.map(n =>
          n.id === dragging.nodeId ? { ...n, x: Math.max(0, x - dragging.ox), y: Math.max(0, y - dragging.oy) } : n
        ));
      }
    }, [dragging]);

    const handleMouseUp = useCallback(() => setDragging(null), []);
    const handleMouseLeave = useCallback(() => { setMousePos(null); setDragging(null); }, []);
    const handleCanvasClick = useCallback(() => {
      if (connecting) { setConnecting(null); setHoveredTarget(null); }
    }, [connecting]);

    const handleEdgeDelete = useCallback((edgeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled || gradeResult) return;
      setEdges(prev => prev.filter(ed => ed.id !== edgeId));
    }, [disabled, gradeResult]);

    const sourceNode = connecting ? nodes.find(n => n.id === connecting) : null;

    return (
      <div className="relative w-full h-full overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(circle, #c8c8cc 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
          backgroundColor: "#F8FBFB",
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Status hint */}
        {connecting && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm pointer-events-none">
            Click another node to connect · click canvas to cancel
          </div>
        )}

        {/* Drop hint when empty */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2 text-zinc-300">
            <div className="w-20 h-10 rounded-xl border-2 border-dashed border-zinc-200 flex items-center justify-center text-xs font-bold">Node</div>
            <p className="text-xs font-semibold">Drag nodes from the left panel</p>
          </div>
        )}

        {/* SVG edges layer */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none", zIndex: 10 }}>
          <ArrowDefs />

          {edges.map(edge => {
            const src = nodes.find(n => n.id === edge.sourceId);
            const tgt = nodes.find(n => n.id === edge.targetId);
            if (!src || !tgt) return null;
            const status: EdgeStatus = edgeStatusMap[edge.id] ?? "normal";
            const color = EDGE_COLORS[status];
            const p1 = borderPoint(src, nodeCx(tgt), nodeCy(tgt));
            const p2 = borderPoint(tgt, nodeCx(src), nodeCy(src));
            const d = bezierPath(p1, p2);
            return (
              <g key={edge.id} style={{ pointerEvents: gradeResult ? "none" : "visibleStroke" }}>
                {/* Wide transparent hit area */}
                <path d={d} stroke="transparent" strokeWidth={18} fill="none"
                  style={{ pointerEvents: "stroke", cursor: "pointer" }}
                  onClick={e => handleEdgeDelete(edge.id, e as unknown as React.MouseEvent)} />
                {/* Visual bezier path */}
                <path d={d} stroke={color} strokeWidth={2} fill="none"
                  markerEnd={`url(#cw-arrow-${status})`}
                  strokeDasharray={status === "missing" ? "8,4" : undefined} />
              </g>
            );
          })}

          {/* Missing edges (breakdown) */}
          {showBreakdown && missingEdges.map(edge => {
            const src = nodes.find(n => n.id === edge.sourceId);
            const tgt = nodes.find(n => n.id === edge.targetId);
            if (!src || !tgt) return null;
            const p1 = borderPoint(src, nodeCx(tgt), nodeCy(tgt));
            const p2 = borderPoint(tgt, nodeCx(src), nodeCy(src));
            return (
              <path key={edge.id} d={bezierPath(p1, p2)}
                stroke={EDGE_COLORS.missing} strokeWidth={2} fill="none"
                strokeDasharray="8,4" markerEnd="url(#cw-arrow-missing)" opacity={0.7} />
            );
          })}

          {/* Ghost bezier toward cursor */}
          {connecting && sourceNode && mousePos && (
            <path
              d={bezierPath(
                { x: nodeCx(sourceNode), y: nodeCy(sourceNode) },
                mousePos
              )}
              stroke="#94a3b8" strokeWidth={1.5} fill="none"
              strokeDasharray="7,5"
              markerEnd="url(#cw-arrow-ghost)"
              style={{ pointerEvents: "none" }}
            />
          )}
        </svg>

        {/* HTML nodes */}
        <div className="absolute inset-0" style={{ zIndex: 5 }}>
          {nodes.map(node => (
            <div key={node.id}
              style={{
                position: "absolute", left: node.x, top: node.y,
                width: NODE_W, height: NODE_H,
                cursor: connecting ? (connecting === node.id ? "default" : "crosshair") : dragging?.nodeId === node.id ? "grabbing" : "grab",
                zIndex: dragging?.nodeId === node.id ? 20 : 15,
                touchAction: "none",
              }}
              onClick={e => handleNodeClick(node.id, e)}
              onMouseDown={e => handleNodeMouseDown(node.id, e)}
              onMouseEnter={() => { if (connecting && connecting !== node.id) setHoveredTarget(node.id); }}
              onMouseLeave={() => setHoveredTarget(null)}
              onDoubleClick={e => handleNodeDoubleClick(node.id, e)}
            >
              <NodeShape node={node}
                isSource={connecting === node.id}
                isTarget={hoveredTarget === node.id} />
            </div>
          ))}
        </div>

        {/* Canvas drop / interaction layer */}
        <div ref={canvasRef}
          className="absolute inset-0"
          style={{ zIndex: 1, cursor: connecting ? "crosshair" : "default" }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    );
  }
);
