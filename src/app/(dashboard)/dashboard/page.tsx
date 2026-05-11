"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { tasksApi } from "@/lib/api";
import AssistantPanel from "@/components/AssistantPanel";

interface Task {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    executions: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("created") === "true") {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter((task) => `${task.title} ${task.description || ""}`.toLowerCase().includes(term));
  }, [query, tasks]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter((task) => task.isActive).length,
      executions: tasks.reduce((sum, task) => sum + task._count.executions, 0),
    }),
    [tasks]
  );

  async function loadTasks() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await tasksApi.list();
      if (res.data) setTasks(res.data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this workflow?")) return;
    try {
      await tasksApi.delete(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="flex min-w-0 items-center gap-3">
          <div className="brand-mark">V</div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-[var(--on-surface)]">Visual Automation Studio</h1>
            <p className="truncate text-xs text-[var(--on-surface-variant)]">Dashboard and workflow operations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-xs font-medium text-[var(--on-surface)]">{user?.name || "User"}</div>
            <div className="text-[11px] text-[var(--on-surface-variant)]">{user?.email}</div>
          </div>
          <button onClick={logout} className="button-secondary !px-3 !py-2 text-xs">
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6">
        <section className="min-w-0 space-y-6">
          <div className="panel overflow-hidden">
            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="kicker">Workspace overview</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--on-surface)] sm:text-3xl">
                  Welcome back, {user?.name || "User"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--on-surface-variant)]">
                  Monitor automations, inspect execution activity, and ask the assistant to explain or run workflows.
                </p>
              </div>
              <button onClick={() => router.push("/tasks/create")} className="button-primary">
                New workflow
              </button>
            </div>
          </div>

          {showSuccess && (
            <div className="rounded-lg border border-[#abefc6] bg-[var(--success-container)] px-4 py-3 text-sm text-[var(--success)]">
              Workflow created successfully. You can edit and run it from the list below.
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-[#fda29b] bg-[var(--error-container)] px-4 py-3 text-sm text-[var(--on-error-container)]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Total workflows" value={stats.total} detail="Saved in your workspace" />
            <MetricCard label="Active workflows" value={stats.active} detail="Ready to execute" />
            <MetricCard label="Executions" value={stats.executions} detail="Across all workflows" />
          </div>

          <section className="panel overflow-hidden">
            <div className="panel-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="kicker">Workflow library</p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--on-surface)]">Your workflows</h3>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search workflows..."
                  className="field-control min-w-0 text-sm sm:w-64"
                />
                <button onClick={loadTasks} className="button-secondary">
                  Refresh
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-3 p-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-lg bg-[var(--surface-container)]" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary-container)] text-sm font-bold text-[var(--primary)]">
                  WF
                </div>
                <h4 className="mt-4 text-base font-semibold text-[var(--on-surface)]">No workflows found</h4>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--on-surface-variant)]">
                  Create your first automation or clear the search query to see existing workflows.
                </p>
                <button onClick={() => router.push("/tasks/create")} className="button-primary mt-5">
                  Create workflow
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--outline-variant)]">
                {filteredTasks.map((task) => (
                  <article
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/tasks/create?edit=${task.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/tasks/create?edit=${task.id}`);
                      }
                    }}
                    className="grid cursor-pointer gap-4 px-4 py-4 transition-colors hover:bg-[var(--surface-container-low)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-sm font-semibold text-[var(--on-surface)]">{task.title}</h4>
                        <span className={`status-pill ${task.isActive ? "status-pill-success" : "status-pill-muted"}`}>
                          {task.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-[var(--on-surface-variant)]">
                        {task.description || "No description provided"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--on-surface-variant)]">
                        <span>{task._count.executions} executions</span>
                        <span>Updated {formatDate(task.updatedAt)}</span>
                        <span>ID {task.id.slice(0, 8)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push(`/tasks/create?edit=${task.id}`);
                        }}
                        className="button-secondary !px-3 !py-2 text-xs"
                      >
                        Open
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(task.id);
                        }}
                        className="button-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>

      <AssistantPanel />
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="panel p-4">
      <p className="kicker">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-3xl font-semibold tracking-tight text-[var(--on-surface)]">{value}</span>
        <span className="rounded-full bg-[var(--primary-container)] px-2 py-1 text-[10px] font-semibold text-[var(--primary)]">Live</span>
      </div>
      <p className="mt-2 text-xs text-[var(--on-surface-variant)]">{detail}</p>
    </div>
  );
}
