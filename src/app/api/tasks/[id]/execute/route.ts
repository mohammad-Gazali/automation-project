import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { handleExecuteTask } from "@/modules/executions/execution.controller";

export const POST = withAuth(async (userId, _email, request, context) => {
  const { id: taskId } = await context.params;
  return handleExecuteTask(userId, taskId, request);
});
