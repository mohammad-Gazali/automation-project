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
      const adjacencyMap = new Map<string, string[]>();
      for (const edge of edges) {
        if (!adjacencyMap.has(edge.source)) {
          adjacencyMap.set(edge.source, []);
        }
        adjacencyMap.get(edge.source)!.push(edge.target);
      }

      // Find root nodes
      const targetNodes = new Set(edges.map((e) => e.target));
      const rootNodes = nodes.filter((n) => !targetNodes.has(n.id));

      // Execute in BFS order
      const visited = new Set<string>();
      const queue = [...rootNodes];

      while (queue.length > 0) {
        const node = queue.shift()!;
        if (visited.has(node.id)) continue;
        visited.add(node.id);

        const nodeType = NODE_TYPES.find((n) => n.type === node.type);
        lines.push(
          `[${new Date().toLocaleTimeString()}] Executing: ${nodeType?.label || node.type} (${node.id})`
        );

        // Simulate node execution
        if (node.type === "log") {
          lines.push(`  → LOG: ${(node.data as any).message || "(empty)"}`);
        } else if (node.type === "color") {
          lines.push(`  → COLOR: set to ${(node.data as any).color || "#000"}`);
        } else if (node.type === "http") {
          lines.push(`  → HTTP: ${(node.data as any).method || "GET"} ${(node.data as any).url || "(no URL)"}`);
        } else if (node.type === "delay") {
          const duration = (node.data as any).duration || 1000;
          lines.push(`  → DELAY: waiting ${duration}ms`);
          await new Promise((r) => setTimeout(r, Math.min(duration, 2000)));
        } else if (node.type === "condition") {
          lines.push(`  → CONDITION: ${(node.data as any).condition || "true"}`);
        } else if (node.type === "transform") {
          lines.push(`  → TRANSFORM: ${(node.data as any).expression || "data => data"}`);
        }

        // Add children to queue
        const children = adjacencyMap.get(node.id) || [];
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
          setOutput((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Task updated on server`]);
        } catch {
          setOutput((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Failed to update task on server`]);
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
      <div className="h-screen flex items-center justify-center bg-[var(--surface)]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-[var(--primary)]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-3 text-sm text-[var(--on-surface-variant)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--surface)]">
      {/* Top nav */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-container-lowest)] border-b border-[var(--outline-variant)] text-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-2 py-1 text-xs border border-[var(--outline)] bg-[var(--surface-container-lowest)] text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
          >
            ← Dashboard
          </button>
          <span className="text-xs text-[var(--on-surface-variant)]">
            {user.name || user.email}
          </span>
          {taskId && (
            <span className="text-[10px] font-mono text-[var(--on-surface-variant)] bg-[var(--surface-container)] px-1.5 py-0.5">
              ID: {taskId.slice(0, 8)}...
            </span>
          )}
        </div>
        <button
          onClick={logout}
          className="px-2 py-1 text-xs border border-[var(--outline)] bg-[var(--surface-container-lowest)] text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <FlowSidebar onDragStart={handleDragStart} />

        {/* Center canvas */}
        <div className="flex-1 flex flex-col min-h-0">
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

          {/* Bottom output panel */}
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

        {/* Right config panel */}
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
        />
      </div>
    </div>
  );
}
