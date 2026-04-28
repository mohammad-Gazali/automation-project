"use client";

import React, { useState } from "react";
import { tasksApi } from "@/lib/api";

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
    <div className="h-52 bg-[var(--surface-container-lowest)] border-t border-[var(--outline-variant)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--outline-variant)]">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Flow title"
            className="px-2 py-1 text-sm border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] outline-none focus:border-[var(--primary)] w-48"
          />
          <div className="flex items-center gap-3 text-[11px] text-[var(--on-surface-variant)]">
            <span>{nodeCount} nodes</span>
            <span>{edgeCount} connections</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === "success" && (
            <span className="text-xs text-green-600">Saved!</span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-[var(--error)]">Save failed</span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-xs border border-[var(--outline)] bg-[var(--surface-container-lowest)] text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save to DB"}
          </button>

          <button
            onClick={onRun}
            disabled={isRunning || nodeCount === 0}
            className="px-3 py-1.5 text-xs bg-[var(--primary)] text-[var(--on-primary)] border-none hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
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
                <span>▶</span>
                Run Flow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output content */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
        {output.length === 0 ? (
          <div className="text-[var(--on-surface-variant)]">
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
                      ? "text-[var(--error)]"
                      : isWarn
                      ? "text-amber-600"
                      : "text-[var(--on-surface)]"
                  }`}
                >
                  <span className="text-[var(--on-surface-variant)] mr-2">{String(idx + 1).padStart(2, "0")}</span>
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
