import { NextRequest } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { JwtPayload } from "@/types";

export interface AuthenticatedRequest extends NextRequest {
  userId: string;
  userEmail: string;
}

export function withAuth(
  handler: (userId: string, userEmail: string, request: NextRequest, context: any) => Promise<Response>
) {
  return async (request: NextRequest, context: any): Promise<Response> => {
    const token = extractTokenFromHeader(request.headers.get("authorization") || undefined);

    if (!token) {
      return Response.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return Response.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return handler(payload.userId, payload.email, request, context);
  };
}
