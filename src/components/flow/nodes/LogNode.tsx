"use client";

import React from "react";
import { Handle, Position } from "reactflow";

interface LogNodeProps {
  data: {
    message: string;
    label?: string;
  };
  selected?: boolean;
}

export default function LogNode({ data, selected }: LogNodeProps) {
  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white shadow-sm transition-shadow ${
        selected ? "border-[var(--primary)] shadow-md" : "border-[var(--outline-variant)]"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[var(--outline)] !border-2 !border-white" />

      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-container-low)] border-b border-[var(--outline-variant)]">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">Log</span>
      </div>

      <div className="px-3 py-2">
        <p className="text-sm text-[var(--on-surface)] truncate" title={data.message}>
          {data.message || "No message"}
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[var(--outline)] !border-2 !border-white" />
    </div>
  );
}
