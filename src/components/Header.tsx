import React from "react";

export default function Header({ onRun }: { onRun?: () => void }) {
  return (
    <header className="header">
      <div className="flex items-center gap-3">
        <div className="brand-mark">V</div>
        <h1 className="text-xl font-semibold">Visual Node Automation Studio</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={() => onRun?.()}>▶ Run</button>
        <button className="btn-ghost">Save</button>
      </div>
    </header>
  );
}
