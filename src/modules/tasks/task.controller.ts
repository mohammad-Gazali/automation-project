import { NextRequest } from "next/server";
import { createTask, getTaskById, listTasks, updateTask, deleteTask } from "@/modules/tasks/task.service";
import { createTaskSchema, updateTaskSchema } from "@/modules/tasks/task.schema";
import { successResponse, errorResponse, formatZodError } from "@/lib/response";

export async function handleCreateTask(userId: string, request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(formatZodError(parsed.error.issues), 400);
    }

    const task = await createTask(userId, parsed.data);
    return successResponse(task, "Task created successfully", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create task";
    return errorResponse(message, 500);
  }
}

export async function handleGetTask(userId: string, taskId: string): Promise<Response> {
  try {
    const task = await getTaskById(taskId, userId);
    return successResponse(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch task";
    return errorResponse(message, 404);
  }
}

export async function handleListTasks(
  userId: string,
  request: NextRequest
): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const isActive = searchParams.get("isActive");

    const result = await listTasks(userId, {
      page,
      limit,
      isActive: isActive !== null ? isActive === "true" : undefined,
    });

    return successResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list tasks";
    return errorResponse(message, 500);
  }
}

export async function handleUpdateTask(
  userId: string,
  taskId: string,
  request: NextRequest
): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(formatZodError(parsed.error.issues), 400);
    }

    const task = await updateTask(taskId, userId, parsed.data);
    return successResponse(task, "Task updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update task";
    const status = error instanceof Error && error.message === "Task not found" ? 404 : 500;
    return errorResponse(message, status);
  }
}

export async function handleDeleteTask(userId: string, taskId: string): Promise<Response> {
  try {
    await deleteTask(taskId, userId);
    return successResponse(undefined, "Task deleted successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete task";
    const status = error instanceof Error && error.message === "Task not found" ? 404 : 500;
    return errorResponse(message, status);
  }
}
