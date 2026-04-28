"use client";
import React from "react";

interface HeaderProps {
  onRun?: () => void;
  theme?: string;
  onThemeChange?: (theme: string) => void;
  score?: number;
  grade?: string;
  gradeColor?: string;
  nodeCount?: number;
  isRunning?: boolean;
}

export default function Header({ onRun, theme = "dark", onThemeChange, score = 0, grade = "D", gradeColor = "#EF4444", nodeCount = 0, isRunning = false }: HeaderProps) {
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    onThemeChange?.(newTheme);
  };

  return (
    <header className="header">
      <div className="flex items-center gap-3">
        <div className="brand-mark">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-[color:var(--on-surface)]">Visual Automation</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[color:var(--surface-container)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83"/>
          </svg>
          <span className="text-sm text-[color:var(--on-surface-variant)]">{nodeCount} nodes</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[color:var(--surface-container)] border border-[color:var(--outline-variant)]">
          <span className="text-sm text-[color:var(--on-surface-variant)]">Score:</span>
          <span className="text-sm font-bold" style={{ color: gradeColor }}>{score}</span>
          <span className="text-lg font-bold" style={{ color: gradeColor }}>{grade}</span>
        </div>
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2"/>
              <path d="M12 21v2"/>
              <path d="M4.22 4.22l1.42 1.42"/>
              <path d="M18.36 18.36l1.42 1.42"/>
              <path d="M1 12h2"/>
              <path d="M21 12h2"/>
              <path d="M4.22 19.78l1.42-1.42"/>
              <path d="M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
        <button className="btn-ghost flex items-center gap-2" onClick={() => {}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Save
        </button>
        <button 
          className={`btn-primary flex items-center gap-2 ${isRunning ? "opacity-75 cursor-wait" : ""}`} 
          onClick={() => onRun?.()}
          disabled={isRunning}
        >
          {isRunning ? (
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
          {isRunning ? "Running..." : "Run"}
        </button>
      </div>
    </header>
  );
}