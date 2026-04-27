import { NextRequest } from "next/server";
import {
  createExecution,
  getExecutionById,
  listExecutions,
  getExecutionLogs,
} from "@/modules/executions/execution.service";
import { enqueueTaskExecution } from "@/lib/queue";
import { executeTaskSchema, listExecutionsSchema } from "@/modules/tasks/task.schema";
import { successResponse, errorResponse, formatZodError } from "@/lib/response";

export async function handleExecuteTask(
  userId: string,
  taskId: string,
  request: NextRequest
): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = executeTaskSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(formatZodError(parsed.error.issues), 400);
    }

    const execution = await createExecution(taskId, userId, parsed.data.input);
    const { queued } = await enqueueTaskExecution(taskId, execution.id, userId);

    return successResponse(
      { executionId: execution.id, status: execution.status, queued },
      queued ? "Task queued for execution" : "Task executed",
      202
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute task";
    return errorResponse(message, 500);
  }
}

export async function handleGetExecution(
  userId: string,
  executionId: string
): Promise<Response> {
  try {
    const execution = await getExecutionById(executionId, userId);
    return successResponse(execution);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution not found";
    return errorResponse(message, 404);
  }
}

export async function handleListExecutions(
  userId: string,
  request: NextRequest
): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      taskId: searchParams.get("taskId") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    };

    const parsed = listExecutionsSchema.safeParse(params);

    if (!parsed.success) {
      return errorResponse(formatZodError(parsed.error.issues), 400);
    }

    const result = await listExecutions(userId, parsed.data);
    return successResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list executions";
    return errorResponse(message, 500);
  }
}

export async function handleGetExecutionLogs(
  userId: string,
  executionId: string
): Promise<Response> {
  try {
    const logs = await getExecutionLogs(executionId, userId);
    return successResponse(logs);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch logs";
    const status = error instanceof Error && error.message === "Execution not found" ? 404 : 500;
    return errorResponse(message, status);
  }
}
