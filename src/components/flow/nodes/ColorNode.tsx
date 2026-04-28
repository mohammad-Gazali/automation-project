"use client";

import React from "react";
import { Handle, Position } from "reactflow";

interface ColorNodeProps {
  data: {
    color: string;
    label?: string;
  };
  selected?: boolean;
}

export default function ColorNode({ data, selected }: ColorNodeProps) {
  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white shadow-sm transition-shadow ${
        selected ? "border-[var(--primary)] shadow-md" : "border-[var(--outline-variant)]"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[var(--outline)] !border-2 !border-white" />

      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-container-low)] border-b border-[var(--outline-variant)]">
        <div className="w-2 h-2 rounded-full bg-purple-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">Color</span>
      </div>

      <div className="px-3 py-2 flex items-center gap-2">
        <div
          className="w-6 h-6 border border-[var(--outline-variant)]"
          style={{ backgroundColor: data.color || "#000000" }}
        />
        <span className="text-xs font-mono text-[var(--on-surface)]">{data.color || "#000000"}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[var(--outline)] !border-2 !border-white" />
    </div>
  );
}
