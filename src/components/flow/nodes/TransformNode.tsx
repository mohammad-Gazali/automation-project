"use client";

import React from "react";
import { Handle, Position } from "reactflow";

interface TransformNodeProps {
  data: {
    expression: string;
    label?: string;
  };
  selected?: boolean;
}

export default function TransformNode({ data, selected }: TransformNodeProps) {
  return (
    <div
      className={`min-w-[200px] rounded-lg border-2 bg-white shadow-sm transition-shadow ${
        selected ? "border-[var(--primary)] shadow-md" : "border-[var(--outline-variant)]"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[var(--outline)] !border-2 !border-white" />

      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-container-low)] border-b border-[var(--outline-variant)]">
        <div className="w-2 h-2 rounded-full bg-cyan-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">Transform</span>
      </div>

      <div className="px-3 py-2">
        <code className="text-xs bg-[var(--surface-container)] px-1.5 py-0.5 rounded text-[var(--on-surface)]">
          {data.expression || "data => data"}
        </code>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[var(--outline)] !border-2 !border-white" />
    </div>
  );
}
