"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { getNodeDefinition } from "@/lib/automationCatalog";

type ActionNodeProps = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  selected?: boolean;
};

function previewValue(data: Record<string, unknown>) {
  const preferred = ["message", "url", "field", "operation", "to", "table", "path", "cron", "prompt"];
  const key = preferred.find((item) => data[item] !== undefined) || Object.keys(data)[0];
  if (!key) return "Ready";
  const value = String(data[key] ?? "");
  return `${key}: ${value}`;
}

export default function ActionNode({ type, data, selected }: ActionNodeProps) {
  const definition = getNodeDefinition(type);
  const accent = definition?.accent || "#64748b";

  return (
    <div
      className={`min-w-[210px] max-w-[260px] rounded-md border bg-white shadow-sm transition-shadow ${
        selected ? "border-[var(--primary)] shadow-md" : "border-[var(--outline-variant)]"
      }`}
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[var(--outline)] !border-2 !border-white" />

      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
        <div
          className="flex h-7 min-w-7 items-center justify-center rounded-sm px-1.5 text-[9px] font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {definition?.icon || type.slice(0, 3).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-[var(--on-surface)]">
            {definition?.label || type}
          </div>
          <div className="truncate text-[10px] text-[var(--on-surface-variant)]">
            {definition?.category || "Custom"}
          </div>
        </div>
      </div>

      <div className="px-3 py-2">
        <p className="truncate text-xs text-[var(--on-surface-variant)]" title={previewValue(data)}>
          {previewValue(data)}
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[var(--outline)] !border-2 !border-white" />
    </div>
  );
}
