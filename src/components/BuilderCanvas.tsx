"use client";
import React, { useRef, useCallback, useState, useEffect } from "react";
import ReactFlow, { Controls, Background, BackgroundVariant, useReactFlow } from "reactflow";
import "reactflow/dist/style.css";

interface BuilderCanvasProps {
  title: string;
  setTitle: (title: string) => void;
  nodes: any[];
  edges: any[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  onAddNode: any;
  onDeleteNode?: (nodeId: string) => void;
  theme?: string;
}

const LogNodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const ColorNodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r="2.5"/>
    <circle cx="17.5" cy="10.5" r="2.5"/>
    <circle cx="8.5" cy="7.5" r="2.5"/>
    <circle cx="6.5" cy="12.5" r="2.5"/>
  </svg>
);

export default function BuilderCanvas({
  title,
  setTitle,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
  onDeleteNode,
  theme = "dark",
}: BuilderCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const reactFlowInstance = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const onInit = (instance: any) => {
    reactFlowInstance.current = instance;
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const bounds = reactFlowWrapper.current!.getBoundingClientRect();
      const position = reactFlowInstance.current.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      onAddNode(type, position);
    },
    [onAddNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleConnect = useCallback(
    (params: any) => {
      onConnect(params);
    },
    [onConnect]
  );

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNode) {
        if (document.activeElement?.tagName !== "INPUT") {
          onDeleteNode?.(selectedNode);
          setSelectedNode(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, onDeleteNode]);

  const gridColor = theme === "dark" ? "#1E293B" : "#E2E8F0";

  const nodeTypes = React.useMemo(
    () => ({
      log: ({ data, selected }: any) => (
        <div className={`node-card ${selected ? "node-selected" : ""}`}>
          <div className="node-header flex items-center gap-2">
            <LogNodeIcon />
            <span>LOG</span>
          </div>
          <div className="node-body">{data.props?.message || "Log message"}</div>
        </div>
      ),
      color: ({ data, selected }: any) => (
        <div className={`node-card ${selected ? "node-selected" : ""}`}>
          <div className="node-header flex items-center gap-2">
            <ColorNodeIcon />
            <span>COLOR</span>
          </div>
          <div className="node-body flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg shadow-inner"
              style={{ background: data.props?.color || "#6366F1" }}
            />
            <div className="text-sm font-mono">{data.props?.color || "#0052ff"}</div>
          </div>
        </div>
      ),
    }),
    []
  );

  return (
    <main className="canvas">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <input
            className="text-lg font-semibold bg-transparent border-none outline-none text-[color:var(--on-surface)] placeholder-[color:var(--on-surface-variant)] w-full max-w-md"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Flow"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[color:var(--surface-container)] text-sm text-[color:var(--on-surface-variant)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
            <span>{nodes.length} nodes</span>
          </div>
        </div>
      </div>

      <div
        ref={reactFlowWrapper}
        className="canvas-box"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          onInit={onInit}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          defaultEdgeOptions={{
            animated: true,
            style: {
              stroke: theme === "dark" ? "#6366F1" : "#4338CA",
              strokeWidth: 2,
            },
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Controls
            className="!bg-[color:var(--surface-container-lowest)] !border-[color:var(--outline-variant)] !rounded-lg !shadow-lg"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={gridColor}
          />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[color:var(--surface-container)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[color:var(--on-surface-variant)]">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="text-xl font-semibold text-[color:var(--on-surface)]">
                Automation Builder
              </div>
              <div className="text-sm text-[color:var(--on-surface-variant)] mt-2 max-w-xs">
                Drag nodes from the sidebar to compose your workflow
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}