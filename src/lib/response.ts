import { ApiResponse } from "@/types";

export function successResponse(data?: unknown, message?: string, status = 200): Response {
  const body: ApiResponse = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  return Response.json(body, { status });
}

export function errorResponse(error: string, status = 400): Response {
  return Response.json({ success: false, error }, { status });
}

export function formatZodError(issues: Array<{ message: string }>): string {
  return issues.map((i) => i.message).join(", ");
}
