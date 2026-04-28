import { NextRequest } from "next/server";
import { handleLogin } from "@/modules/auth/auth.controller";

export async function POST(request: NextRequest) {
  return handleLogin(request);
}
