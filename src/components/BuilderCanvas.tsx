"use client";
import React, { useRef, useCallback } from "react";
import ReactFlow, { Controls, Background } from "reactflow";
import "reactflow/dist/style.css";

export default function BuilderCanvas({ title, setTitle, nodes, edges, onNodesChange, onEdgesChange, onConnect, onAddNode }: any) {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const reactFlowInstance = useRef<any>(null);

  const onInit = (instance: any) => {
    reactFlowInstance.current = instance;
  };

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/reactflow");
    if (!type) return;
    const bounds = reactFlowWrapper.current!.getBoundingClientRect();
    const position = reactFlowInstance.current.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
    onAddNode(type, position);
  }, [onAddNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const nodeTypes = React.useMemo(() => ({
    log: ({ data }: any) => (
      <div className="node-card">
        <div className="node-header">LOG</div>
        <div className="node-body">{data.props?.message}</div>
      </div>
    ),
    color: ({ data }: any) => (
      <div className="node-card">
        <div className="node-header">COLOR</div>
        <div className="node-body flex items-center gap-2">
          <div style={{ width: 20, height: 14, background: data.props?.color }} />
          <div>{data.props?.color}</div>
        </div>
      </div>
    ),
  }), []);

  return (
    <main className="canvas flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4">
        <input className="border px-3 py-2 mr-4" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Flow title" />
        <div className="text-sm text-[var(--on-surface-variant)]">Nodes: {nodes.length}</div>
      </div>

      <div ref={reactFlowWrapper} className="canvas-box flex-1 min-h-0 relative" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onInit={onInit}
          fitView
          style={{ width: "100%", height: "100%" }}
        >
          <Controls />
          <Background gap={12} color="#f5f7fb" />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center">
              <div className="text-[var(--on-surface)] font-semibold text-lg">Automation Builder</div>
              <div className="text-[var(--on-surface-variant)] text-sm mt-2">Drag nodes here to compose a workflow</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
