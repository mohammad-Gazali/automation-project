import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";

export async function GET(_request: NextRequest) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return successResponse({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return errorResponse("Database connection failed", 503);
  }
}
