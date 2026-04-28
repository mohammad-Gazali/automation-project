"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import BuilderCanvas from "../components/BuilderCanvas";
import SchemeDetails from "../components/SchemeDetails";
import { useNodesState, useEdgesState, addEdge } from "reactflow";

const calculateScore = (nodeCount: number) => {
  const baseScore = 100;
  const multiplier = 50;
  return baseScore + (nodeCount * multiplier);
};

const getGrade = (score: number) => {
  if (score >= 500) return { grade: "S", color: "#FFD700" };
  if (score >= 400) return { grade: "A", color: "#22C55E" };
  if (score >= 300) return { grade: "B", color: "#3B82F6" };
  if (score >= 200) return { grade: "C", color: "#F59E0B" };
  return { grade: "D", color: "#EF4444" };
};

export default function Home() {
  const [title, setTitle] = useState("Untitled flow");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [output, setOutput] = useState<string[]>([]);
  const [savedFlows, setSavedFlows] = useState<any[]>([]);
  const [theme, setTheme] = useState("dark");
  const [isRunning, setIsRunning] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output]);

  const addNode = useCallback(
    (type: string, position: any) => {
      const id = `${type}-${Date.now()}`;
      const node = {
        id,
        type,
        position,
        data: {
          props: type === "log" ? { message: "Log message" } : { color: "#6366F1" },
        },
      };
      setNodes((nds: any[]) => {
        const last = nds.length > 0 ? nds[nds.length - 1] : null;
        const newNodes = nds.concat(node);
        if (last) {
          const newEdge = {
            id: `e-${last.id}-${id}`,
            source: last.id,
            target: id,
            animated: true,
          };
          setEdges((eds: any[]) => eds.concat(newEdge));
        }
        return newNodes;
      });
    },
    [setNodes, setEdges]
  );

  const onConnect = useCallback(
    (params: any) => setEdges((eds: any[]) => addEdge(params, eds)),
    [setEdges]
  );

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds: any[]) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds: any[]) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const score = useMemo(() => calculateScore(nodes.length), [nodes.length]);
  const { grade, color: gradeColor } = useMemo(() => getGrade(score), [score]);

  const runFlow = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const lines: string[] = [];
      lines.push(`[${new Date().toLocaleTimeString()}] ▷ Running flow: "${title}"`);
      lines.push(`[SCORE] Current score: ${score} pts (Grade: ${grade})`);
      lines.push("────────────────────────");
      for (const n of nodes) {
        if (n.type === "log")
          lines.push(`[LOG] ${n.data?.props?.message ?? "(empty)"}`);
        if (n.type === "color")
          lines.push(`[COLOR] Set to ${n.data?.props?.color ?? "#000"}`);
      }
      if (nodes.length === 0) lines.push("(no nodes to run)");
      lines.push("────────────────────────");
      lines.push(`[${new Date().toLocaleTimeString()}] ✓ Flow completed! Score: ${score} pts`);
      setOutput(lines);
      setIsRunning(false);
    }, 500);
  }, [nodes, title, score, grade]);

  const saveFlow = useCallback(() => {
    const id = `flow-${Date.now()}`;
    setSavedFlows((s) => [...s, { id, title, nodes, edges }]);
    setOutput((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ✓ Flow "${title}" saved`,
    ]);
  }, [title, nodes, edges]);

  const loadFlow = useCallback(
    (id: string) => {
      const f = savedFlows.find((sf) => sf.id === id);
      if (f) {
        setTitle(f.title);
        setNodes(f.nodes || []);
        setEdges(f.edges || []);
        setOutput([]);
        setOutput((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✓ Flow "${f.title}" loaded`,
        ]);
      }
    },
    [savedFlows, setNodes, setEdges]
  );

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Header onRun={runFlow} theme={theme} onThemeChange={setTheme} score={score} grade={grade} gradeColor={gradeColor} nodeCount={nodes.length} isRunning={isRunning} />
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
            onDeleteNode={deleteNode}
            theme={theme}
          />

          <div
            ref={consoleRef}
            className="console-panel"
            style={{
              background: theme === "dark" ? "#0D1117" : "#1E293B",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-[color:var(--on-surface)]">
                  Output Console
                </h3>
              </div>
              <button
                className="text-xs text-[color:var(--on-surface-variant)] hover:text-[color:var(--on-surface)] transition-colors"
                onClick={() => setOutput([])}
              >
                Clear
              </button>
            </div>

            <div className="space-y-1">
              {output.length === 0 ? (
                <div className="text-sm text-[color:var(--on-surface-variant)] font-mono">
                  <span className="opacity-50">$</span> Ready. Run the flow to see output.
                </div>
              ) : (
                output.map((line: string, idx: number) => {
                  let lineClass = "console-line";
                  if (line.includes("Error") || line.includes("error"))
                    lineClass += " error";
                  else if (
                    line.includes("✓") ||
                    line.includes("completed")
                  )
                    lineClass += " success";

                  return (
                    <div key={idx} className={lineClass}>
                      {line}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <SchemeDetails
          savedFlows={savedFlows}
          onSaveFlow={saveFlow}
          onLoadFlow={loadFlow}
        />
      </div>
    </div>
  );
}