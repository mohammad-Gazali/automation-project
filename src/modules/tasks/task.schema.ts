import { z } from "zod";

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ─── Task Schemas ────────────────────────────────────────────────────────────

export const nodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.string(), z.unknown()),
});

export const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  animated: z.boolean().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
  nodes: z.array(nodeSchema).min(1, "At least one node is required"),
  edges: z.array(edgeSchema).default([]),
  isActive: z.boolean().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ─── Execution Schemas ───────────────────────────────────────────────────────

export const executeTaskSchema = z.object({
  input: z.record(z.string(), z.unknown()).optional(),
});

export const listExecutionsSchema = z.object({
  taskId: z.string().uuid().optional(),
  status: z.enum(["PENDING", "RUNNING", "SUCCESS", "FAILED", "CANCELLED"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type ExecuteTaskInput = z.infer<typeof executeTaskSchema>;
export type ListExecutionsInput = z.infer<typeof listExecutionsSchema>;
