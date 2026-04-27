"use client";

import React, { useState, useEffect } from "react";
import { Node } from "reactflow";
import { NODE_TYPES } from "./nodeRegistry";

interface NodeConfigPanelProps {
  node: Node | null;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
}

export default function NodeConfigPanel({ node, onUpdate, onDelete }: NodeConfigPanelProps) {
  const [localData, setLocalData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (node) {
      setLocalData(node.data);
    }
  }, [node]);

  if (!node) {
    return (
      <aside className="w-72 bg-[var(--surface-container-lowest)] border-l border-[var(--outline-variant)] flex flex-col h-full">
        <div className="p-4 border-b border-[var(--outline-variant)]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
            Node Config
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-[var(--on-surface-variant)] text-center">
            Select a node to edit its properties
          </p>
        </div>
      </aside>
    );
  }

  const nodeType = NODE_TYPES.find((n) => n.type === (node?.type || ""));

  function updateField(key: string, value: unknown) {
    if (!node) return;
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    onUpdate(node.id, newData);
  }

  function renderFields() {
    const fields = Object.entries(localData);

    return fields.map(([key, value]) => {
      if (typeof value === "string" && key === "color") {
        return (
          <div key={key} className="mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)] mb-1">
              {key}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value as string}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-8 h-8 border border-[var(--outline-variant)] cursor-pointer"
              />
              <input
                type="text"
                value={value as string}
                onChange={(e) => updateField(key, e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>
        );
      }

      if (typeof value === "number") {
        return (
          <div key={key} className="mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)] mb-1">
              {key}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={key === "duration" ? 100 : 0}
                max={key === "duration" ? 10000 : 100}
                step={key === "duration" ? 100 : 1}
                value={value}
                onChange={(e) => updateField(key, Number(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                value={value}
                onChange={(e) => updateField(key, Number(e.target.value))}
                className="w-20 px-2 py-1 text-xs border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>
        );
      }

      if (typeof value === "string" && (key === "expression" || key === "condition")) {
        return (
          <div key={key} className="mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)] mb-1">
              {key}
            </label>
            <input
              type="text"
              value={value as string}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-mono border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] outline-none focus:border-[var(--primary)]"
            />
          </div>
        );
      }

      if (typeof value === "string" && key === "url") {
        return (
          <div key={key} className="mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)] mb-1">
              {key}
            </label>
            <input
              type="url"
              value={value as string}
              onChange={(e) => updateField(key, e.target.value)}
              placeholder="https://api.example.com"
              className="w-full px-2 py-1.5 text-xs border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] outline-none focus:border-[var(--primary)]"
            />
          </div>
        );
      }

      if (typeof value === "string" && key === "method") {
        return (
          <div key={key} className="mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)] mb-1">
              {key}
            </label>
            <select
              value={value as string}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] outline-none focus:border-[var(--primary)]"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
        );
      }

      return (
        <div key={key} className="mb-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)] mb-1">
            {key}
          </label>
          <input
            type="text"
            value={value as string}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] outline-none focus:border-[var(--primary)]"
          />
        </div>
      );
    });
  }

  return (
    <aside className="w-72 bg-[var(--surface-container-lowest)] border-l border-[var(--outline-variant)] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--outline-variant)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${nodeType?.color || "bg-gray-500"}`} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
            {nodeType?.label || node.type}
          </h2>
        </div>
        <button
          onClick={() => onDelete(node.id)}
          className="px-2 py-1 text-[10px] border border-[var(--error)] text-[var(--error)] hover:bg-[var(--error-container)] transition-colors"
        >
          Delete
        </button>
      </div>

      {/* Node ID */}
      <div className="px-4 py-2 border-b border-[var(--outline-variant)]">
        <span className="text-[10px] font-mono text-[var(--on-surface-variant)]">ID: {node.id}</span>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderFields()}
      </div>
    </aside>
  );
}
