import React from "react";

export default function Sidebar({ onPlay }: { onPlay?: () => void }) {
  function onDragStart(e: React.DragEvent, type: string) {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside className="sidebar">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="sidebar-heading">Nodes</h2>
        <button className="btn-primary text-sm" onClick={() => onPlay?.()}>Play</button>
      </div>

      <div className="mt-2 grid gap-2">
        <div draggable onDragStart={(e) => onDragStart(e, "log")} className="component-btn">Log Node</div>
        <div draggable onDragStart={(e) => onDragStart(e, "color")} className="component-btn">Color Node</div>
      </div>

    </aside>
  );
}
