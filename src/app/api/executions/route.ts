import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { handleListExecutions } from "@/modules/executions/execution.controller";

export const GET = withAuth(async (userId, _email, request) => {
  return handleListExecutions(userId, request);
});
