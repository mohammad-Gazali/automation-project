"use client";

import React, { useState } from "react";

interface OutputPanelProps {
  output: string[];
  isRunning: boolean;
  onRun: () => Promise<void>;
  onSave: () => Promise<void>;
  title: string;
  onTitleChange: (title: string) => void;
  nodeCount: number;
  edgeCount: number;
}

export default function OutputPanel({
  output,
  isRunning,
  onRun,
  onSave,
  title,
  onTitleChange,
  nodeCount,
  edgeCount,
}: OutputPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSave() {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      await onSave();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex h-60 flex-col border-t border-[var(--outline-variant)] bg-[var(--surface-container-lowest)]">
      <div className="flex flex-col gap-3 border-b border-[var(--outline-variant)] px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Flow title"
            className="field-control w-full text-sm sm:w-64"
          />
          <div className="flex items-center gap-3 text-[11px] text-[var(--on-surface-variant)]">
            <span className="rounded-full bg-[var(--surface-container)] px-2 py-1">{nodeCount} nodes</span>
            <span className="rounded-full bg-[var(--surface-container)] px-2 py-1">{edgeCount} connections</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {saveStatus === "success" && (
            <span className="text-xs text-green-600">Saved!</span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-[var(--error)]">Save failed</span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="button-secondary !px-3 !py-2 text-xs disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save to DB"}
          </button>

          <button
            onClick={onRun}
            disabled={isRunning || nodeCount === 0}
            className="button-primary !px-3 !py-2 text-xs disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running...
              </>
            ) : (
              <>
                Run Flow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output content */}
      <div className="premium-scrollbar flex-1 overflow-y-auto bg-[#0b1220] p-3 font-mono text-xs">
        {output.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-400">
            {isRunning ? "Executing flow..." : "No output yet. Run the flow to see results."}
          </div>
        ) : (
          <div className="space-y-1">
            {output.map((line, idx) => {
              const isError = line.startsWith("ERROR") || line.startsWith("[ERROR]");
              const isWarn = line.startsWith("WARN") || line.startsWith("[WARN]");
              return (
                <div
                  key={idx}
                  className={`py-0.5 ${
                    isError
                      ? "text-red-300"
                      : isWarn
                      ? "text-amber-300"
                      : "text-slate-200"
                  }`}
                >
                  <span className="mr-2 text-slate-500">{String(idx + 1).padStart(2, "0")}</span>
                  {line}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
