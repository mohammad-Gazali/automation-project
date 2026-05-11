"use client";

import React, { useState } from "react";
import { NODE_TYPES } from "./nodeRegistry";
import { NODE_CATEGORIES } from "@/lib/automationCatalog";

interface FlowSidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

export default function FlowSidebar({ onDragStart }: FlowSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = NODE_TYPES.filter((node) =>
    `${node.label} ${node.description} ${node.category}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="flex h-full w-full flex-col border-r border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] lg:w-72">
      <div className="border-b border-[var(--outline-variant)] p-4">
        <h2 className="kicker mb-1">
          Workflow Nodes
        </h2>
        <p className="mb-3 text-[11px] leading-4 text-[var(--on-surface-variant)]">
          Drag actions, triggers, and data tools into the canvas.
        </p>
        <input
          type="text"
          placeholder="Search nodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-control text-xs"
        />
      </div>

      <div className="premium-scrollbar flex-1 overflow-y-auto p-3">
        {NODE_CATEGORIES.map((category) => {
          const nodes = filtered.filter((node) => node.category === category);
          if (nodes.length === 0) return null;

          return (
            <section key={category} className="mb-4">
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
                {category}
              </h3>
              <div className="space-y-2">
                {nodes.map((node) => (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(event) => onDragStart(event, node.type)}
                    className="group cursor-grab rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:bg-[var(--surface-container-low)] active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`flex h-7 min-w-8 items-center justify-center rounded-sm px-1.5 text-[9px] font-bold text-white ${node.color}`}>
                        {node.icon}
                      </div>
                      <span className="text-sm font-medium text-[var(--on-surface)]">{node.label}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-4 text-[var(--on-surface-variant)]">
                      {node.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-4 text-center text-xs text-[var(--on-surface-variant)]">
            No nodes found
          </div>
        )}
      </div>

      <div className="border-t border-[var(--outline-variant)] p-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-[var(--outline-variant)] bg-[var(--surface)] p-2">
            <div className="text-sm font-semibold text-[var(--on-surface)]">{NODE_TYPES.length}</div>
            <div className="text-[10px] text-[var(--on-surface-variant)]">Nodes</div>
          </div>
          <div className="rounded-md border border-[var(--outline-variant)] bg-[var(--surface)] p-2">
            <div className="text-sm font-semibold text-[var(--on-surface)]">{NODE_CATEGORIES.length}</div>
            <div className="text-[10px] text-[var(--on-surface-variant)]">Groups</div>
          </div>
          <div className="rounded-md border border-[var(--outline-variant)] bg-[var(--surface)] p-2">
            <div className="text-sm font-semibold text-[var(--on-surface)]">AI</div>
            <div className="text-[10px] text-[var(--on-surface-variant)]">Assist</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
