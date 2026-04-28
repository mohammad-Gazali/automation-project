"use client";
import React from "react";

interface SavedFlow {
  id: string;
  title: string;
  nodes?: any[];
  edges?: any[];
}

interface SchemeDetailsProps {
  savedFlows?: SavedFlow[];
  onSaveFlow?: () => void;
  onLoadFlow?: (id: string) => void;
}

export default function SchemeDetails({ savedFlows = [], onSaveFlow, onLoadFlow }: SchemeDetailsProps) {
  return (
    <aside className="details">
      <div className="flex items-center justify-between mb-4">
        <h2 className="sidebar-heading">Saved Flows</h2>
      </div>

      <div className="mt-2">
        {savedFlows.length === 0 ? (
          <div className="text-sm text-[color:var(--on-surface-variant)] py-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[color:var(--surface-container)] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            No saved flows yet.
            <br />
            <span className="text-xs opacity-70">Create a flow and save it to see it here.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {savedFlows.map((flow) => (
              <div
                key={flow.id}
                className="p-3 rounded-xl border border-[color:var(--outline-variant)] bg-[color:var(--surface-container)] hover:border-[color:var(--primary)] transition-colors cursor-pointer"
                onClick={() => onLoadFlow?.(flow.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[color:var(--primary-container)] flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[color:var(--on-primary-container)]">
                        <polyline points="16 3 21 3 21 8"/>
                        <line x1="4" y1="20" x2="21" y2="3"/>
                        <polyline points="21 16 21 21 16 21"/>
                        <line x1="15" y1="15" x2="21" y2="21"/>
                        <line x1="4" y1="4" x2="9" y2="9"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{flow.title}</div>
                    </div>
                  </div>
                  <button
                    className="p-2 rounded-lg hover:bg-[color:var(--surface-container-high)] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadFlow?.(flow.id);
                    }}
                    title="Load flow"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="8 17 12 21 16 17"/>
                      <polyline points="12 12 12 21"/>
                      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-[color:var(--outline-variant)]">
        <button
          className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
          onClick={() => onSaveFlow?.()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Save Current Flow
        </button>
      </div>
    </aside>
  );
}