import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { handleGetTask, handleUpdateTask, handleDeleteTask } from "@/modules/tasks/task.controller";

export const GET = withAuth(async (userId, _email, _request, context) => {
  const { id: taskId } = await context.params;
  return handleGetTask(userId, taskId);
});

export const PUT = withAuth(async (userId, _email, request, context) => {
  const { id: taskId } = await context.params;
  return handleUpdateTask(userId, taskId, request);
});

export const DELETE = withAuth(async (userId, _email, _request, context) => {
  const { id: taskId } = await context.params;
  return handleDeleteTask(userId, taskId);
});
