"use client";
import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import BuilderCanvas from "../components/BuilderCanvas";
import SchemeDetails from "../components/SchemeDetails";
import { useNodesState, useEdgesState, addEdge } from "reactflow";

export default function Home() {
  const [title, setTitle] = React.useState("Untitled flow");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [output, setOutput] = React.useState<string[]>([]);
  const [savedFlows, setSavedFlows] = React.useState<any[]>([]);

  const addNode = React.useCallback((type: string, position: any) => {
    const id = `${type}-${Date.now()}`;
    const node = {
      id,
      type,
      position,
      data: {
        props: type === "log" ? { message: "Log message" } : { color: "#0052ff" },
      },
    };
    setNodes((nds: any[]) => {
      const last = nds.length > 0 ? nds[nds.length - 1] : null;
      const newNodes = nds.concat(node);
      if (last) {
        const newEdge = { id: `e-${last.id}-${id}`, source: last.id, target: id, animated: true };
        setEdges((eds: any[]) => eds.concat(newEdge));
      }
      return newNodes;
    });
  }, [setNodes, setEdges]);

  const onConnect = React.useCallback((params: any) => setEdges((eds: any[]) => addEdge(params, eds)), [setEdges]);

  const runFlow = React.useCallback(() => {
    const lines: string[] = [];
    for (const n of nodes) {
      if (n.type === "log") lines.push(`LOG: ${n.data?.props?.message ?? "(empty)"}`);
      if (n.type === "color") lines.push(`COLOR: set to ${n.data?.props?.color ?? "#000"}`);
    }
    if (lines.length === 0) lines.push("(no nodes to run)");
    setOutput(lines);
  }, [nodes]);

  const saveFlow = React.useCallback(() => {
    const id = `flow-${Date.now()}`;
    setSavedFlows((s) => [...s, { id, title, nodes, edges }]);
  }, [title, nodes, edges]);

  const loadFlow = React.useCallback((id: string) => {
    const f = savedFlows.find((sf) => sf.id === id);
    if (f) {
      setTitle(f.title);
      setNodes(f.nodes || []);
      setEdges(f.edges || []);
      setOutput([]);
    }
  }, [savedFlows, setNodes, setEdges]);

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header onRun={runFlow} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onPlay={runFlow} />
        <div className="flex-1 flex flex-col min-h-0">
          <BuilderCanvas
            title={title}
            setTitle={setTitle}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onAddNode={addNode}
          />

          <div className="h-48 p-4 border-t bg-[var(--surface-container-lowest)] overflow-auto">
            <h3 className="font-semibold">Output</h3>
            <div className="mt-2">
              {output.length === 0 ? (
                <div className="text-sm text-[var(--on-surface-variant)]">No output yet. Run the flow.</div>
              ) : (
                output.map((l: any, idx: number) => (
                  <div key={idx} className="text-sm font-mono text-[var(--on-surface)]">{l}</div>
                ))
              )}
            </div>
          </div>
        </div>

        <SchemeDetails savedFlows={savedFlows} onSaveFlow={saveFlow} onLoadFlow={loadFlow} />
      </div>
    </div>
  );
}
