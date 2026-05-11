import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { handleGetExecutionLogs } from "@/modules/executions/execution.controller";

export const GET = withAuth(async (userId, _email, _request, context) => {
  const { id: executionId } = await context.params;
  return handleGetExecutionLogs(userId, executionId);
});
