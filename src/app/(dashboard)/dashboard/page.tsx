"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { tasksApi } from "@/lib/api";

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

  async function loadTasks() {
    try {
      const res = await tasksApi.list();
      if (res.data) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this task?")) return;
    try {
      await tasksApi.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-[var(--surface-container-lowest)] border-b border-[var(--outline)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--primary)] text-[var(--on-primary)] flex items-center justify-center font-bold text-sm">
            V
          </div>
          <h1 className="text-lg font-semibold text-[var(--on-surface)]">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--on-surface-variant)]">
            {user?.name || user?.email}
          </span>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm border border-[var(--outline)] bg-[var(--surface-container-lowest)] text-[var(--on-surface)] cursor-pointer hover:bg-[var(--surface-container-low)] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--on-surface)]">
            Welcome, {user?.name || "User"}
          </h2>
          <p className="mt-1 text-sm text-[var(--on-surface-variant)]">
            Manage and monitor your automation tasks
          </p>
        </div>

        {/* Success banner */}
        {showSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between">
            <span>Task created successfully! You can now edit it in the builder.</span>
            <button
              onClick={() => setShowSuccess(false)}
              className="ml-4 text-green-600 hover:text-green-800 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
              Total Tasks
            </p>
            <p className="mt-1 text-3xl font-semibold text-[var(--on-surface)]">
              {tasks.length}
            </p>
          </div>
          <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
              Active
            </p>
            <p className="mt-1 text-3xl font-semibold text-[var(--on-surface)]">
              {tasks.filter((t) => t.isActive).length}
            </p>
          </div>
          <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
              Total Executions
            </p>
            <p className="mt-1 text-3xl font-semibold text-[var(--on-surface)]">
              {tasks.reduce((sum, t) => sum + t._count.executions, 0)}
            </p>
          </div>
        </div>

        {/* Tasks list */}
        <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--outline-variant)]">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
              Your Tasks
            </h3>
            <button
              onClick={() => router.push("/tasks/create")}
              className="px-3 py-1.5 text-sm bg-[var(--primary)] text-[var(--on-primary)] border-none cursor-pointer hover:opacity-90 transition-opacity"
            >
              + New Task
            </button>
          </div>

          {error && (
            <div className="mx-4 mt-4 p-3 bg-[var(--error-container)] text-[var(--on-error-container)] text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-sm text-[var(--on-surface-variant)]">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--on-surface-variant)]">No tasks yet</p>
              <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                Go to the builder to create your first automation
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--outline-variant)]">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-container-low)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--on-surface)] truncate">
                        {task.title}
                      </span>
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          task.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-[var(--surface-container)] text-[var(--on-surface-variant)]"
                        }`}
                      >
                        {task.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-0.5 text-xs text-[var(--on-surface-variant)] truncate">
                        {task.description}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-[var(--on-surface-variant)]">
                      {task._count.executions} execution{task._count.executions !== 1 ? "s" : ""}
                      {" · "}Updated {formatDate(task.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/tasks/create?edit=${task.id}`)}
                      className="px-2 py-1 text-xs border border-[var(--outline)] bg-[var(--surface-container-lowest)] text-[var(--on-surface)] cursor-pointer hover:bg-[var(--surface-container-low)] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="px-2 py-1 text-xs border border-[var(--error)] text-[var(--error)] bg-[var(--surface-container-lowest)] cursor-pointer hover:bg-[var(--error-container)] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
