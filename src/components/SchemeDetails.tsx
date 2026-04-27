import React from "react";

export default function SchemeDetails({ savedFlows, onSaveFlow, onLoadFlow }: any) {
  return (
    <aside className="details">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[14px] text-[var(--on-surface)]">Saved Flows</h2>
        <button className="btn-ghost text-sm" onClick={() => onSaveFlow?.()}>Save</button>
      </div>

      <div className="mt-3">
        {savedFlows?.length === 0 ? (
          <div className="text-sm text-[var(--on-surface-variant)]">No saved flows yet.</div>
        ) : (
          <ul className="mt-2 space-y-2">
            {savedFlows.map((f: any) => (
              <li key={f.id} className="p-2 border flex items-center justify-between">
                <div className="text-sm font-medium">{f.title}</div>
                <button className="btn-ghost text-xs" onClick={() => onLoadFlow?.(f.id)}>Load</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
