import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { handleCreateTask, handleListTasks } from "@/modules/tasks/task.controller";

export const POST = withAuth(async (userId, _email, request) => {
  return handleCreateTask(userId, request);
});

export const GET = withAuth(async (userId, _email, request) => {
  return handleListTasks(userId, request);
});
