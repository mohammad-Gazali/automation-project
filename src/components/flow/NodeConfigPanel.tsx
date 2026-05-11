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
  const [hasChanges, setHasChanges] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  useEffect(() => {
    if (node) {
      setLocalData(node.data);
      setHasChanges(false);
      setSaveState("idle");
    }
  }, [node]);

  if (!node) {
    return (
      <div className="flex h-full w-full flex-col bg-[var(--surface-container-lowest)]">
        <div className="border-b border-[var(--outline-variant)] p-4">
          <h2 className="kicker">
            Node Config
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="rounded-lg border border-dashed border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-4 text-center text-sm leading-6 text-[var(--on-surface-variant)]">
            Select a node to inspect and edit its properties.
          </p>
        </div>
      </div>
    );
  }

  const nodeType = NODE_TYPES.find((n) => n.type === (node?.type || ""));

  function updateField(key: string, value: unknown) {
    if (!node) return;
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    setHasChanges(true);
    setSaveState("idle");
  }

  function handleSave() {
    if (!node) return;
    onUpdate(node.id, localData);
    setHasChanges(false);
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 1600);
  }

  function renderFields() {
    const fields = Object.entries(localData);

    return fields.map(([key, value]) => {
      if (["body", "prompt", "where"].includes(key)) {
        return (
          <div key={key} className="mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)] mb-1">
              {key}
            </label>
            <textarea
              value={String(value ?? "")}
              onChange={(e) => updateField(key, e.target.value)}
              rows={4}
              className="field-control resize-none text-xs"
            />
          </div>
        );
      }

      if (key === "operator") {
        return renderSelect(key, String(value), ["equals", "notEquals", "contains"]);
      }

      if (key === "operation") {
        return renderSelect(key, String(value), ["add", "subtract", "multiply", "divide"]);
      }

      if (key === "action") {
        return renderSelect(key, String(value), ["select", "insert", "update", "delete"]);
      }

      if (key === "mode") {
        return renderSelect(key, String(value), ["combine", "inputOnly", "outputsOnly"]);
      }

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
                className="field-control flex-1 py-1 text-xs"
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
                className="field-control w-20 py-1 text-xs"
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
              className="field-control text-xs font-mono"
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
              className="field-control text-xs"
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
              className="field-control text-xs"
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
            className="field-control text-xs"
          />
        </div>
      );
    });
  }

  function renderSelect(key: string, value: string, options: string[]) {
    return (
      <div key={key} className="mb-3">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)] mb-1">
          {key}
        </label>
        <select
          value={value}
          onChange={(e) => updateField(key, e.target.value)}
          className="field-control text-xs"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-[var(--surface-container-lowest)]">
      <div className="flex items-center justify-between border-b border-[var(--outline-variant)] p-4">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${nodeType?.color || "bg-gray-500"}`} />
          <div>
            <h2 className="kicker">
              {nodeType?.label || node.type}
            </h2>
            <p className="mt-1 text-[10px] text-[var(--on-surface-variant)]">
              {hasChanges ? "Unsaved changes" : saveState === "saved" ? "Saved" : "Edit node data"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="button-primary !px-3 !py-1.5 text-[10px] disabled:border-[var(--outline-variant)] disabled:bg-[var(--surface-container)] disabled:text-[var(--on-surface-variant)]"
          >
            Save
          </button>
          <button
            onClick={() => onDelete(node.id)}
            className="button-danger !px-2 !py-1 text-[10px]"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Node ID */}
      <div className="border-b border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-2">
        <span className="text-[10px] font-mono text-[var(--on-surface-variant)]">ID: {node.id}</span>
      </div>

      {node.type === "email" && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          The <span className="font-semibold">to</span> field is only the recipient. Real sending requires SMTP settings in
          <span className="font-mono"> .env</span>: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and optionally SMTP_FROM.
          Restart the dev server after changing them.
        </div>
      )}

      {/* Fields */}
      <div className="premium-scrollbar flex-1 overflow-y-auto p-4">
        {renderFields()}
      </div>

      <div className="border-t border-[var(--outline-variant)] bg-white p-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="button-primary w-full disabled:border-[var(--outline-variant)] disabled:bg-[var(--surface-container)] disabled:text-[var(--on-surface-variant)]"
        >
          {hasChanges ? "Save node settings" : saveState === "saved" ? "Saved" : "No changes to save"}
        </button>
      </div>
    </div>
  );
}
