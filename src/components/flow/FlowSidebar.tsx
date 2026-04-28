"use client";

import React, { useState, useCallback } from "react";
import { NODE_TYPES, NodeType } from "./nodeRegistry";

interface FlowSidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

export default function FlowSidebar({ onDragStart }: FlowSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = NODE_TYPES.filter((n) =>
    n.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-64 bg-[var(--surface-container-lowest)] border-r border-[var(--outline-variant)] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--outline-variant)]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)] mb-3">
          Node Palette
        </h2>
        <input
          type="text"
          placeholder="Search nodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] placeholder-[var(--on-surface-variant)] outline-none focus:border-[var(--primary)]"
        />
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className="group p-3 border border-[var(--outline-variant)] bg-[var(--surface)] cursor-grab active:cursor-grabbing hover:border-[var(--primary)] hover:bg-[var(--surface-container-low)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${node.color}`} />
              <span className="text-sm font-medium text-[var(--on-surface)]">{node.label}</span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--on-surface-variant)]">{node.description}</p>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-4 text-xs text-[var(--on-surface-variant)]">
            No nodes found
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-[var(--outline-variant)]">
        <p className="text-[10px] text-[var(--on-surface-variant)] text-center">
          Drag nodes onto the canvas
        </p>
      </div>
    </aside>
  );
}
