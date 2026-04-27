import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { handleGetMe } from "@/modules/auth/auth.controller";

export const GET = withAuth(async (userId) => {
  return handleGetMe(userId);
});
