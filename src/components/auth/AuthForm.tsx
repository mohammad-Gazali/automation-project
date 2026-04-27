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
      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)] mb-1.5">
        {label} {required && <span className="text-[var(--error)]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border bg-[var(--surface-container-lowest)] text-[var(--on-surface)] placeholder-[var(--on-surface-variant)] outline-none transition-colors ${
          error
            ? "border-[var(--error)] focus:border-[var(--error)]"
            : "border-[var(--outline)] focus:border-[var(--primary)]"
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--primary)] text-[var(--on-primary)] font-bold text-lg mb-4">
            V
          </div>
          <h1 className="text-2xl font-semibold text-[var(--on-surface)]">{title}</h1>
          <p className="mt-2 text-sm text-[var(--on-surface-variant)]">{subtitle}</p>
        </div>

        <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] p-6">
          {error && (
            <div className="mb-4 p-3 bg-[var(--error-container)] border border-[var(--error)] text-[var(--on-error-container)] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {children}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 px-4 py-2.5 text-sm font-medium bg-[var(--primary)] text-[var(--on-primary)] border-none cursor-pointer transition-opacity disabled:opacity-50 hover:opacity-90"
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
          <div className="mt-4 text-center text-sm text-[var(--on-surface-variant)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
