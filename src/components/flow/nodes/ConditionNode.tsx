"use client";

import React from "react";
import { Handle, Position } from "reactflow";

interface ConditionNodeProps {
  data: {
    condition: string;
    label?: string;
  };
  selected?: boolean;
}

export default function ConditionNode({ data, selected }: ConditionNodeProps) {
  return (
    <div
      className={`min-w-[200px] rounded-lg border-2 bg-white shadow-sm transition-shadow ${
        selected ? "border-[var(--primary)] shadow-md" : "border-[var(--outline-variant)]"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[var(--outline)] !border-2 !border-white" />

      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-container-low)] border-b border-[var(--outline-variant)]">
        <div className="w-2 h-2 rounded-full bg-rose-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">Condition</span>
      </div>

      <div className="px-3 py-2">
        <code className="text-xs bg-[var(--surface-container)] px-1.5 py-0.5 rounded text-[var(--on-surface)] block truncate">
          {data.condition || "true"}
        </code>
      </div>

      <Handle type="source" position={Position.Bottom} id="true" className="!w-3 !h-3 !bg-green-500 !border-2 !border-white" />
      <div className="absolute -right-1 bottom-4 text-[9px] text-green-600 font-medium">T</div>

      <Handle type="source" position={Position.Bottom} id="false" className="!w-3 !h-3 !bg-red-500 !border-2 !border-white !left-8" />
      <div className="absolute left-6 bottom-4 text-[9px] text-red-600 font-medium">F</div>
    </div>
  );
}
