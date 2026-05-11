"use client";

import React from "react";
import { Handle, Position } from "reactflow";

interface ConditionNodeProps {
  data: {
    condition?: string;
    field?: string;
    operator?: string;
    value?: string;
    label?: string;
  };
  selected?: boolean;
}

const operatorLabels: Record<string, string> = {
  equals: "equals",
  notEquals: "not equals",
  contains: "contains",
  exists: "exists",
};

export default function ConditionNode({ data, selected }: ConditionNodeProps) {
  const field = data.field || "status";
  const operator = operatorLabels[data.operator || "equals"] || data.operator || "equals";
  const value = data.value || "ready";
  const expression = data.condition || `${field} ${operator} ${value}`;

  return (
    <div
      className={`relative min-w-[240px] overflow-hidden rounded-lg border bg-white shadow-sm transition-all ${
        selected ? "border-[var(--primary)] shadow-md ring-4 ring-blue-50" : "border-[var(--outline-variant)]"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-slate-400" />

      <div className="border-b border-[var(--outline-variant)] bg-gradient-to-r from-rose-50 to-white px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-500 text-[10px] font-bold text-white">
              IF
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--on-surface)]">Condition</div>
              <div className="text-[10px] text-[var(--on-surface-variant)]">True / false router</div>
            </div>
          </div>
          <span className="rounded-full bg-rose-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-rose-700">
            Logic
          </span>
        </div>
      </div>

      <div className="space-y-2 px-3 py-3">
        <div className="rounded-md border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-2.5 py-2">
          <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--on-surface-variant)]">Expression</div>
          <div className="mt-1 truncate font-mono text-[11px] text-[var(--on-surface)]" title={expression}>
            {expression}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
          <div className="rounded bg-white px-2 py-1 text-[var(--on-surface-variant)] ring-1 ring-[var(--outline-variant)]">
            {field}
          </div>
          <div className="rounded bg-white px-2 py-1 text-[var(--on-surface-variant)] ring-1 ring-[var(--outline-variant)]">
            {operator}
          </div>
          <div className="rounded bg-white px-2 py-1 text-[var(--on-surface-variant)] ring-1 ring-[var(--outline-variant)]">
            {value}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-[var(--outline-variant)] text-[10px] font-semibold">
        <div className="bg-emerald-50 px-3 py-2 text-emerald-700">TRUE path</div>
        <div className="bg-red-50 px-3 py-2 text-right text-red-700">FALSE path</div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!left-[25%] !h-3.5 !w-3.5 !border-2 !border-white !bg-emerald-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!left-[75%] !h-3.5 !w-3.5 !border-2 !border-white !bg-red-500"
      />
    </div>
  );
}
