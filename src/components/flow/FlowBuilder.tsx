"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAuth } from "@/context/AuthContext";
import { tasksApi } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import FlowSidebar from "./FlowSidebar";
import FlowCanvas from "./FlowCanvas";
import NodeConfigPanel from "./NodeConfigPanel";
import OutputPanel from "./OutputPanel";
import { NODE_TYPES } from "./nodeRegistry";
import AssistantPanel from "@/components/AssistantPanel";

export default function FlowBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, isLoading: authLoading } = useAuth();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [title, setTitle] = useState("Untitled flow");
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing task if editing
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      loadTask(editId);
    }
  }, [searchParams]);

  async function loadTask(id: string) {
    setIsLoading(true);
    try {
      const res = await tasksApi.getById(id);
      if (res.data) {
        setTaskId(res.data.id);
        setTitle(res.data.title);
        setNodes((res.data as any).nodes || []);
        setEdges((res.data as any).edges || []);
      }
    } catch (err) {
      console.error("Failed to load task:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
    },
    []
  );

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, data: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data } : n))
    );
    setSelectedNode((prev) => (prev && prev.id === nodeId ? { ...prev, data } : prev));
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, []);

  async function handleRun() {
    if (nodes.length === 0) return;

    setIsRunning(true);
    setOutput([]);

    try {
      const lines: string[] = [];
      lines.push(`[${new Date().toLocaleTimeString()}] Starting flow execution...`);
      lines.push(`[${new Date().toLocaleTimeString()}] Nodes: ${nodes.length}, Connections: ${edges.length}`);

      // Build adjacency map
      const adjacencyMap = new Map<string, Array<{ target: string; sourceHandle?: string | null }>>();
      for (const edge of edges) {
        if (!adjacencyMap.has(edge.source)) {
          adjacencyMap.set(edge.source, []);
        }
        adjacencyMap.get(edge.source)!.push({ target: edge.target, sourceHandle: edge.sourceHandle });
      }

      // Find root nodes
      const targetNodes = new Set(edges.map((e) => e.target));
      const rootNodes = nodes.filter((n) => !targetNodes.has(n.id));

      // Execute in BFS order
      const visited = new Set<string>();
      const queue = [...rootNodes];
      const previewOutput: Record<string, unknown> = {};

      while (queue.length > 0) {
        const node = queue.shift()!;
        if (visited.has(node.id)) continue;
        visited.add(node.id);

        const nodeType = NODE_TYPES.find((n) => n.type === node.type);
        lines.push(
          `[${new Date().toLocaleTimeString()}] Executing: ${nodeType?.label || node.type} (${node.id})`
        );

        // Simulate node execution
        let previewResult: Record<string, unknown> = { type: node.type || "unknown" };

        if (node.type === "log") {
          lines.push(`  → LOG: ${(node.data as any).message || "(empty)"}`);
          previewResult = { type: "log", message: (node.data as any).message || "" };
        } else if (node.type === "color") {
          lines.push(`  → COLOR: set to ${(node.data as any).color || "#000"}`);
          previewResult = { type: "color", color: (node.data as any).color || "#000" };
        } else if (node.type === "http") {
          lines.push(`  → HTTP: ${(node.data as any).method || "GET"} ${(node.data as any).url || "(no URL)"}`);
          previewResult = { type: "http", status: 200 };
        } else if (node.type === "delay") {
          const duration = (node.data as any).duration || 1000;
          lines.push(`  → DELAY: waiting ${duration}ms`);
          await new Promise((r) => setTimeout(r, Math.min(duration, 2000)));
          previewResult = { type: "delay", duration };
        } else if (node.type === "condition") {
          const result = evaluatePreviewCondition(node.data as Record<string, unknown>, previewOutput);
          previewResult = { type: "condition", ...result };
          lines.push(`  → CONDITION: ${result.actual} ${result.operator} ${result.expected} = ${result.result ? "TRUE" : "FALSE"}`);
        } else if (node.type === "transform") {
          lines.push(`  → TRANSFORM: ${(node.data as any).expression || "data => data"}`);
          previewResult = { type: "transform", result: { ...previewOutput } };
        } else if (node.type === "set") {
          const key = String((node.data as any).key || "value");
          const value = (node.data as any).value ?? "";
          lines.push(`  → SET: ${key}=${String(value)}`);
          previewResult = { type: "set", data: { [key]: value } };
        } else {
          const preview = Object.entries(node.data || {})
            .slice(0, 3)
            .map(([key, value]) => `${key}=${String(value)}`)
            .join(", ");
          lines.push(`  → ${nodeType?.label?.toUpperCase() || node.type}: ${preview || "ready"}`);
          previewResult = { type: node.type || "unknown", data: node.data };
        }

        previewOutput[node.id] = previewResult;

        // Add children to queue
        const children = getPreviewChildren(node, previewResult, adjacencyMap);
        for (const childId of children) {
          const childNode = nodes.find((n) => n.id === childId);
          if (childNode && !visited.has(childId)) {
            queue.push(childNode);
          }
        }
      }

      lines.push(`[${new Date().toLocaleTimeString()}] Flow execution complete`);
      setOutput(lines);

      // If we have a saved task, execute it on the backend
      if (taskId) {
        lines.push(`[${new Date().toLocaleTimeString()}] Sending to backend for execution...`);
        try {
          await tasksApi.update(taskId, { title, nodes: nodes as any, edges: edges as any });
          const execution = await tasksApi.execute(taskId, { source: "builder-run" });
          setOutput((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] Backend execution started: ${execution.data?.executionId || "unknown"}`,
          ]);
        } catch (error) {
          setOutput((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] Backend execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          ]);
        }
      }
    } catch (err) {
      setOutput((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ERROR: ${err instanceof Error ? err.message : "Unknown error"}`,
      ]);
    } finally {
      setIsRunning(false);
    }
  }

  async function handleSave() {
    if (nodes.length === 0) {
      throw new Error("Add at least one node before saving");
    }

    if (taskId) {
      await tasksApi.update(taskId, {
        title,
        nodes: nodes as any,
        edges: edges as any,
      });
    } else {
      const res = await tasksApi.create({
        title,
        nodes: nodes as any,
        edges: edges as any,
      });
      if (res.data) {
        setTaskId(res.data.id);
      }
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--surface)]">
        <div className="panel px-8 py-7 text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-[var(--primary)]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-3 text-sm text-[var(--on-surface-variant)]">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--surface)]">
      <header className="app-topbar !static !px-4 !py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="button-secondary !px-3 !py-2 text-xs"
          >
            Back
          </button>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[var(--on-surface)]">{title}</div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--on-surface-variant)]">
              <span>{nodes.length} nodes</span>
              <span>{edges.length} connections</span>
              {taskId && <span className="font-mono">ID {taskId.slice(0, 8)}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <div className="text-xs font-medium text-[var(--on-surface)]">{user.name || user.email}</div>
            <div className="text-[11px] text-[var(--on-surface-variant)]">Builder session</div>
          </div>
          {taskId && (
            <span className="status-pill status-pill-success hidden sm:inline-flex">
              Saved
            </span>
          )}
          <button onClick={logout} className="button-secondary !px-3 !py-2 text-xs">
            Sign out
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="border-b border-[var(--outline-variant)] bg-[var(--primary-container)] px-4 py-2 text-xs font-medium text-[var(--primary)]">
          Loading workflow...
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[288px_minmax(0,1fr)_360px]">
        <div className="max-h-64 min-h-0 overflow-hidden border-b border-[var(--outline-variant)] lg:max-h-none lg:border-b-0">
          <FlowSidebar onDragStart={handleDragStart} />
        </div>

        <div className="flex min-h-0 flex-col">
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onDrop={handleDragStart as any}
            onDragOver={handleDragOver}
          />

          <OutputPanel
            output={output}
            isRunning={isRunning}
            onRun={handleRun}
            onSave={handleSave}
            title={title}
            onTitleChange={setTitle}
            nodeCount={nodes.length}
            edgeCount={edges.length}
          />
        </div>

        <aside className="hidden min-h-0 border-l border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] xl:flex xl:flex-col">
          <div className="min-h-0 flex-1">
            <NodeConfigPanel
              node={selectedNode}
              onUpdate={handleNodeUpdate}
              onDelete={handleNodeDelete}
            />
          </div>
        </aside>
      </div>

      <AssistantPanel />
    </div>
  );
}

function getPreviewChildren(
  node: Node,
  nodeResult: Record<string, unknown>,
  adjacencyMap: Map<string, Array<{ target: string; sourceHandle?: string | null }>>
) {
  const children = adjacencyMap.get(node.id) || [];
  if (node.type !== "condition") return children.map((child) => child.target);

  const result = Boolean(nodeResult.result);
  const desiredHandle = result ? "true" : "false";
  const matched = children.filter((child) => child.sourceHandle === desiredHandle);
  if (matched.length > 0) return matched.map((child) => child.target);

  const unlabeled = children.filter((child) => !child.sourceHandle);
  if (unlabeled.length > 1) {
    const branchIndex = result ? 0 : 1;
    return [unlabeled[Math.min(branchIndex, unlabeled.length - 1)].target];
  }

  return result ? unlabeled.map((child) => child.target) : [];
}

function evaluatePreviewCondition(data: Record<string, unknown>, previousOutput: Record<string, unknown>) {
  const field = String(data.field || "");
  const condition = String(data.condition || "");
  const parsed = field ? null : parsePreviewCondition(condition);
  const resolvedField = field || parsed?.field || "";
  const operator = normalizePreviewOperator(String(data.operator || parsed?.operator || "equals"));
  const expected = field ? String(data.value ?? "") : parsed?.expected ?? String(data.value ?? "");
  const source = flattenPreviewOutput(previousOutput);
  const hasField = resolvedField ? Object.prototype.hasOwnProperty.call(source, resolvedField) : false;
  const actual = resolvedField ? String(source[resolvedField] ?? "") : condition;

  if (!resolvedField) {
    const literal = condition.trim().toLowerCase();
    return { actual, operator, expected, result: literal === "true" || literal === "1" };
  }

  if (operator === "exists") {
    return { actual, operator, expected, result: hasField && actual.length > 0 };
  }

  if (!hasField) return { actual, operator, expected, result: false };
  return { actual, operator, expected, result: comparePreviewCondition(actual, operator, expected) };
}

function flattenPreviewOutput(previousOutput: Record<string, unknown>) {
  return Object.values(previousOutput).reduce<Record<string, unknown>>((acc, value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      assignPreviewMissing(acc, value as Record<string, unknown>);
      const data = (value as Record<string, unknown>).data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        assignPreviewMissing(acc, data as Record<string, unknown>);
      }
    }
    return acc;
  }, {});
}

function assignPreviewMissing(target: Record<string, unknown>, source: Record<string, unknown>) {
  for (const [key, value] of Object.entries(source)) {
    if (target[key] === undefined) target[key] = value;
  }
}

function parsePreviewCondition(condition: string) {
  const match = condition.trim().match(/^([\w.-]+)\s*(===|==|!==|!=|>=|<=|>|<|equals|notEquals|contains|exists)\s*(.*)$/i);
  if (!match) return null;
  return {
    field: match[1],
    operator: match[2],
    expected: stripPreviewQuotes(match[3] || ""),
  };
}

function normalizePreviewOperator(operator: string) {
  const normalized = operator.trim();
  if (["==", "===", "equals"].includes(normalized)) return "equals";
  if (["!=", "!==", "notEquals"].includes(normalized)) return "notEquals";
  return normalized;
}

function comparePreviewCondition(actual: string, operator: string, expected: string) {
  if (operator === "contains") return actual.includes(expected);
  if (operator === "notEquals") return actual !== expected;
  if ([">", "<", ">=", "<="].includes(operator)) {
    const left = Number(actual);
    const right = Number(expected);
    if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
    if (operator === ">") return left > right;
    if (operator === "<") return left < right;
    if (operator === ">=") return left >= right;
    return left <= right;
  }
  return actual === expected;
}

function stripPreviewQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
