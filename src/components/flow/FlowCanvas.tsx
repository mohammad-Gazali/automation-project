"use client";

import React, { useRef, useCallback, useMemo } from "react";
import ReactFlow, {
  Controls,
  Background,
  Connection,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  EdgeChange,
  NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import * as CustomNodes from "./nodes";
import { NODE_TYPES } from "./nodeRegistry";

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onNodeClick: (_event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
}

export default function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onDrop,
  onDragOver,
}: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);

  const nodeTypes = useMemo(() => ({
    log: CustomNodes.LogNode,
    color: CustomNodes.ColorNode,
    http: CustomNodes.HttpNode,
    transform: CustomNodes.TransformNode,
    delay: CustomNodes.DelayNode,
    condition: CustomNodes.ConditionNode,
    set: CustomNodes.ActionNode,
    filter: CustomNodes.ActionNode,
    math: CustomNodes.ActionNode,
    merge: CustomNodes.ActionNode,
    email: CustomNodes.ActionNode,
    database: CustomNodes.ActionNode,
    webhook: CustomNodes.ActionNode,
    schedule: CustomNodes.ActionNode,
    aiPrompt: CustomNodes.ActionNode,
  }), []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowWrapper.current || !reactFlowInstance.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const nodeType = NODE_TYPES.find((n) => n.type === type);
      if (!nodeType) return;

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { ...nodeType.defaultData },
      };

      (onNodesChange as any)([{ type: "add", item: newNode }]);
    },
    [onNodesChange]
  );

  return (
    <div ref={reactFlowWrapper} className="relative min-h-[360px] flex-1 overflow-hidden bg-[var(--surface-container-low)]" onDragOver={onDragOver} onDrop={handleDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: "default",
          animated: true,
          style: { stroke: "var(--outline)", strokeWidth: 2 },
        }}
        className="bg-transparent"
      >
        <Controls
          className="!bg-[var(--surface-container-lowest)] !border !border-[var(--outline-variant)] !rounded-none !shadow-sm"
          showInteractive={false}
        />
        <Background
          gap={16}
          size={1}
          color="var(--outline-variant)"
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="panel max-w-sm p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary-container)] text-sm font-bold text-[var(--primary)]">
              FLOW
            </div>
            <div className="mt-4 text-lg font-semibold text-[var(--on-surface)]">Build your automation</div>
            <div className="mt-2 text-sm leading-6 text-[var(--on-surface-variant)]">
              Drag nodes from the palette, connect them, then save and run the workflow.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
