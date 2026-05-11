"use client";

import React, { useState } from "react";

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required,
}: InputFieldProps) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-semibold text-[var(--on-surface)]">
        {label} {required && <span className="text-[var(--error)]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`field-control text-sm placeholder:text-[var(--on-surface-variant)] ${
          error
            ? "!border-[var(--error)] focus:!border-[var(--error)]"
            : ""
        }`}
      />
      {error && (
        <p className="mt-1 text-xs text-[var(--error)]">{error}</p>
      )}
    </div>
  );
}

interface AuthFormProps {
  title: string;
  subtitle: string;
  onSubmit: () => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  error: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthForm({
  title,
  subtitle,
  onSubmit,
  submitLabel,
  isSubmitting,
  error,
  children,
  footer,
}: AuthFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[var(--surface)] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden min-h-screen flex-col justify-between border-r border-[var(--outline-variant)] bg-[var(--on-surface)] p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="brand-mark">V</div>
          <div>
            <div className="text-sm font-semibold">Visual Automation Studio</div>
            <div className="text-xs text-white/60">Workflow operations, redesigned</div>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="kicker !text-white/60">Automation workspace</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight">
            Build, run, and understand workflows from one focused command center.
          </h2>
          <p className="mt-5 text-sm leading-6 text-white/68">
            Manage flows, inspect execution history, and work with an AI assistant that understands your project context.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          {["Nodes", "Runs", "Assistant"].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-lg font-semibold">{item}</div>
              <div className="mt-1 text-xs text-white/56">Production ready</div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <div className="brand-mark">V</div>
              <div>
                <div className="text-sm font-semibold text-[var(--on-surface)]">Visual Automation Studio</div>
                <div className="text-xs text-[var(--on-surface-variant)]">Workflow operations</div>
              </div>
            </div>
            <p className="kicker">Secure access</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--on-surface)]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--on-surface-variant)]">{subtitle}</p>
          </div>

          <div className="panel p-6">
          {error && (
            <div className="mb-4 rounded-md border border-[#fda29b] bg-[var(--error-container)] p-3 text-sm text-[var(--on-error-container)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {children}

            <button
              type="submit"
              disabled={isSubmitting}
              className="button-primary mt-2 w-full disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                submitLabel
              )}
            </button>
          </form>
          </div>

          {footer && (
            <div className="mt-5 text-center text-sm text-[var(--on-surface-variant)]">
              {footer}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
