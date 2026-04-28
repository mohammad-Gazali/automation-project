"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AuthForm, InputField } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  function validate(): boolean {
    const errors: typeof fieldErrors = {};

    if (!name.trim()) {
      errors.name = "Name is required";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await register(email, password, name);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthForm
      title="Create account"
      subtitle="Get started with the Automation Studio"
      onSubmit={handleSubmit}
      submitLabel="Create Account"
      isSubmitting={isSubmitting}
      error={error}
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <InputField
        label="Name"
        value={name}
        onChange={setName}
        placeholder="Your name"
        error={fieldErrors.name}
        required
      />
      <InputField
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        error={fieldErrors.email}
        required
      />
      <InputField
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="At least 8 characters"
        error={fieldErrors.password}
        required
      />
      <InputField
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Repeat your password"
        error={fieldErrors.confirmPassword}
        required
      />
    </AuthForm>
  );
}
