import { ExecutionStatus, LogLevel } from "@prisma/client";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface TaskNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface TaskEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface ExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  output?: Record<string, unknown>;
  error?: string;
}

export type { ExecutionStatus, LogLevel };
