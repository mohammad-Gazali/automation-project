import { NextRequest } from "next/server";
import { handleRegister } from "@/modules/auth/auth.controller";

export async function POST(request: NextRequest) {
  return handleRegister(request);
}
