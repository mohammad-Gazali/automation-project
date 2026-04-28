"use client";
import React, { useState } from "react";

interface NodeItem {
  type: string;
  label: string;
  category: "basic" | "advanced";
  icon: React.ReactNode;
  description: string;
}

const nodeTypes: NodeItem[] = [
  {
    type: "log",
    label: "Log Node",
    category: "basic",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    description: "Output a message to console",
  },
  {
    type: "color",
    label: "Color Node",
    category: "basic",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="13.5" cy="6.5" r="2.5"/>
        <circle cx="17.5" cy="10.5" r="2.5"/>
        <circle cx="8.5" cy="7.5" r="2.5"/>
        <circle cx="6.5" cy="12.5" r="2.5"/>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>
      </svg>
    ),
    description: "Define and preview colors",
  },
];

export default function Sidebar({ onPlay }: { onPlay?: () => void }) {
  const [search, setSearch] = useState("");

  function onDragStart(e: React.DragEvent, type: string) {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
  }

  const filteredNodes = nodeTypes.filter(
    (node) =>
      node.label.toLowerCase().includes(search.toLowerCase()) ||
      node.type.toLowerCase().includes(search.toLowerCase())
  );

  const basicNodes = filteredNodes.filter((n) => n.category === "basic");
  const advancedNodes = filteredNodes.filter((n) => n.category === "advanced");

  return (
    <aside className="sidebar">
      <div className="flex items-center justify-between mb-4">
        <h2 className="sidebar-heading">Nodes</h2>
      </div>

      <input
        type="text"
        placeholder="Search nodes..."
        className="sidebar-search mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-4">
        {basicNodes.length > 0 && (
          <div>
            <div className="node-category">Basic</div>
            <div className="grid gap-2">
              {basicNodes.map((node) => (
                <div
                  key={node.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type)}
                  className="component-btn flex items-center gap-3 group"
                >
                  <div className="text-[color:var(--primary)] group-hover:scale-110 transition-transform">
                    {node.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{node.label}</div>
                    <div className="text-xs text-[color:var(--on-surface-variant)] mt-0.5">{node.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {advancedNodes.length > 0 && (
          <div>
            <div className="node-category">Advanced</div>
            <div className="grid gap-2">
              {advancedNodes.map((node) => (
                <div
                  key={node.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type)}
                  className="component-btn flex items-center gap-3 group"
                >
                  <div className="text-[color:var(--secondary)] group-hover:scale-110 transition-transform">
                    {node.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{node.label}</div>
                    <div className="text-xs text-[color:var(--on-surface-variant)] mt-0.5">{node.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredNodes.length === 0 && (
          <div className="text-sm text-[color:var(--on-surface-variant)] text-center py-4">
            No nodes found
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-[color:var(--outline-variant)]">
        <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => onPlay?.()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Run Flow
        </button>
      </div>
    </aside>
  );
}