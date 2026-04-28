"use client";

import React from "react";
import { Handle, Position } from "reactflow";

interface HttpNodeProps {
  data: {
    url: string;
    method: string;
    label?: string;
  };
  selected?: boolean;
}

export default function HttpNode({ data, selected }: HttpNodeProps) {
  const methodColors: Record<string, string> = {
    GET: "bg-green-500",
    POST: "bg-blue-500",
    PUT: "bg-yellow-500",
    DELETE: "bg-red-500",
    PATCH: "bg-orange-500",
  };

  const method = (data.method || "GET").toUpperCase();

  return (
    <div
      className={`min-w-[200px] rounded-lg border-2 bg-white shadow-sm transition-shadow ${
        selected ? "border-[var(--primary)] shadow-md" : "border-[var(--outline-variant)]"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[var(--outline)] !border-2 !border-white" />

      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-container-low)] border-b border-[var(--outline-variant)]">
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">HTTP</span>
      </div>

      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className={`px-1.5 py-0.5 text-[10px] font-bold text-white rounded ${methodColors[method] || "bg-gray-500"}`}>
            {method}
          </span>
          <span className="text-xs text-[var(--on-surface)] truncate" title={data.url}>
            {data.url || "No URL"}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[var(--outline)] !border-2 !border-white" />
    </div>
  );
}
