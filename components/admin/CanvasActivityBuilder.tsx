"use client";

import React, { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { CanvasExercise, ExcalidrawSceneElement } from "@/components/exercise/CanvasExercise";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";

// ─── Token types ──────────────────────────────────────────────────────────────

const TOKEN_SHAPES = ["rectangle", "ellipse", "diamond", "equation"] as const;
const TOKEN_ROLES = ["operand", "operator", "relation", "none"] as const;

type TokenShape = typeof TOKEN_SHAPES[number];
type TokenRole = typeof TOKEN_ROLES[number];

interface Token {
  id: string;
  content: string;
  type: TokenShape;
  tokenRole: TokenRole;
}

export interface CanvasActivityData {
  title: string;
  instructions: string;
  context: string;
  assemblyMode: "sequence" | "graph";
  scoringMode: "partial" | "exact";
  tokens: Token[];
  initialElements: ExcalidrawSceneElement[];
}

interface Props {
  value: CanvasActivityData;
  onChange: (v: CanvasActivityData) => void;
}

const SHAPE_COLORS: Record<TokenShape, string> = {
  rectangle: "bg-indigo-50 border-indigo-200 text-indigo-700",
  ellipse: "bg-emerald-50 border-emerald-200 text-emerald-700",
  diamond: "bg-purple-50 border-purple-200 text-purple-700",
  equation: "bg-amber-50 border-amber-200 text-amber-700",
};

function TokenPreview({ token }: { token: Token }) {
  const color = SHAPE_COLORS[token.type];
  if (token.type === "ellipse") {
    return (
      <div className={cn("flex items-center justify-center rounded-full w-16 h-10 border text-[10px] font-bold truncate px-1", color)}>
        {token.content || "…"}
      </div>
    );
  }
  if (token.type === "diamond") {
    return (
      <div className="relative w-16 h-10 flex items-center justify-center">
        <div className={cn("absolute inset-0 rotate-45 border rounded", color)} style={{ transform: "rotate(45deg) scale(0.65)" }} />
        <span className="relative text-[9px] font-bold text-zinc-700 z-10 truncate px-1">{token.content || "…"}</span>
      </div>
    );
  }
  return (
    <div className={cn("flex items-center justify-center rounded w-16 h-10 border text-[10px] font-bold truncate px-1", color)}>
      {token.content || "…"}
    </div>
  );
}

export function CanvasActivityBuilder({ value, onChange }: Props) {
  const elementsRef = useRef<ExcalidrawSceneElement[]>(value.initialElements ?? []);

  const set = useCallback(<K extends keyof CanvasActivityData>(key: K, val: CanvasActivityData[K]) => {
    onChange({ ...value, [key]: val });
  }, [value, onChange]);

  const handleElementsChange = useCallback((els: ExcalidrawSceneElement[]) => {
    elementsRef.current = els;
  }, []);

  const handleSaveCanvas = () => {
    onChange({ ...value, initialElements: elementsRef.current });
  };

  // ── Token management ─────────────────────────────────────────────────────────
  const addToken = () => {
    const newToken: Token = {
      id: crypto.randomUUID(),
      content: "",
      type: "rectangle",
      tokenRole: "operand",
    };
    set("tokens", [...value.tokens, newToken]);
  };

  const updateToken = (idx: number, patch: Partial<Token>) => {
    const next = [...value.tokens];
    next[idx] = { ...next[idx], ...patch };
    set("tokens", next);
  };

  const removeToken = (idx: number) => {
    set("tokens", value.tokens.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Metadata fields ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label="Title" value={value.title} onChange={(v) => set("title", v)} />
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Assembly Mode</label>
            <select value={value.assemblyMode} onChange={(e) => set("assemblyMode", e.target.value as "sequence" | "graph")}
              className="border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#01696F]">
              <option value="sequence">Sequence (left→right)</option>
              <option value="graph">Graph (connections)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Scoring</label>
            <select value={value.scoringMode} onChange={(e) => set("scoringMode", e.target.value as "partial" | "exact")}
              className="border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#01696F]">
              <option value="partial">Partial credit</option>
              <option value="exact">Exact match only</option>
            </select>
          </div>
        </div>
        <FormField label="Instructions" value={value.instructions} onChange={(v) => set("instructions", v)} multiline />
        <FormField label="Context / Scenario" value={value.context} onChange={(v) => set("context", v)} multiline />
      </div>

      {/* ── Token builder ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-zinc-700">Draggable Tokens</p>
            <p className="text-[10px] text-zinc-400 font-medium">These are the shapes students drag onto the canvas</p>
          </div>
          <button onClick={addToken} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#01696F] text-white text-[11px] font-black rounded-xl hover:bg-[#01696F]/90 active:scale-95 transition-all">
            <Plus size={12} /> Add Token
          </button>
        </div>

        {value.tokens.length === 0 && (
          <div className="py-6 text-center text-zinc-400 text-xs font-semibold border border-dashed border-zinc-200 rounded-xl">
            No tokens yet. Add tokens that students will drag to build the answer.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {value.tokens.map((token, idx) => (
            <div key={token.id} className="flex items-start gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
              <GripVertical size={14} className="text-zinc-300 mt-1 shrink-0" />
              <TokenPreview token={token} />
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Label</label>
                  <input value={token.content} onChange={(e) => updateToken(idx, { content: e.target.value })}
                    className="border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#01696F]"
                    placeholder="e.g. Revenue, +, →" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Shape</label>
                  <select value={token.type} onChange={(e) => updateToken(idx, { type: e.target.value as TokenShape })}
                    className="border border-zinc-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#01696F]">
                    {TOKEN_SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Role</label>
                  <select value={token.tokenRole} onChange={(e) => updateToken(idx, { tokenRole: e.target.value as TokenRole })}
                    className="border border-zinc-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#01696F]">
                    {TOKEN_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => removeToken(idx)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-all shrink-0 mt-0.5">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Excalidraw canvas ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-zinc-700">Initial Canvas State</p>
            <p className="text-[10px] text-zinc-400 font-medium">Draw background elements, zones, or guides. Students will see this as the starting canvas.</p>
          </div>
          <button
            onClick={handleSaveCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 text-white text-[11px] font-black rounded-xl hover:bg-zinc-600 active:scale-95 transition-all"
          >
            <Save size={12} /> Capture Canvas
          </button>
        </div>
        <div className="rounded-2xl border border-zinc-200 overflow-hidden" style={{ height: "480px" }}>
          <CanvasExercise
            canvasBackgroundText={value.title || "Draw initial canvas state"}
            onElementsChange={handleElementsChange}
            initialElements={value.initialElements}
            assemblyMode={value.assemblyMode}
          />
        </div>
        {elementsRef.current.length > 0 && (
          <p className="text-[10px] text-zinc-400 font-semibold text-right">
            {elementsRef.current.filter((e) => !e.isDeleted).length} elements on canvas
            {value.initialElements.length > 0 ? " · canvas saved ✓" : " · click «Capture Canvas» to save"}
          </p>
        )}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 w-full";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={cn(cls, "resize-none")} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />}
    </div>
  );
}
