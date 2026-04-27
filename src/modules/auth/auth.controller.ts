import { NextRequest } from "next/server";
import { registerUser, loginUser, getUserById } from "@/modules/auth/auth.service";
import { registerSchema, loginSchema } from "@/modules/tasks/task.schema";
import { successResponse, errorResponse, formatZodError } from "@/lib/response";

export async function handleRegister(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(formatZodError(parsed.error.issues), 400);
    }

    const { user, token } = await registerUser(parsed.data);

    return successResponse({ user, token }, "Registration successful", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return errorResponse(message, 400);
  }
}

export async function handleLogin(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(formatZodError(parsed.error.issues), 400);
    }

    const { user, token } = await loginUser(parsed.data);

    return successResponse({ user, token }, "Login successful");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return errorResponse(message, 401);
  }
}

export async function handleGetMe(userId: string): Promise<Response> {
  try {
    const user = await getUserById(userId);
    return successResponse(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch user";
    return errorResponse(message, 404);
  }
}
