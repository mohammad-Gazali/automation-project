import { prisma } from "@/lib/prisma";
import { LogLevel } from "@prisma/client";

export interface LogEntry {
  executionId: string;
  level: LogLevel;
  message: string;
  nodeId?: string;
  nodeType?: string;
  metadata?: Record<string, unknown>;
}

export async function createLog(entry: LogEntry) {
  return prisma.executionLog.create({
    data: {
      executionId: entry.executionId,
      level: entry.level,
      message: entry.message,
      nodeId: entry.nodeId,
      nodeType: entry.nodeType,
      metadata: entry.metadata ? (entry.metadata as any) : undefined,
    },
  });
}

export function consoleLog(entry: LogEntry) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${entry.level}]`;
  const nodeInfo = entry.nodeId ? ` [node:${entry.nodeId}]` : "";

  switch (entry.level) {
    case "ERROR":
      console.error(`${prefix}${nodeInfo} ${entry.message}`);
      break;
    case "WARN":
      console.warn(`${prefix}${nodeInfo} ${entry.message}`);
      break;
    case "DEBUG":
      console.debug(`${prefix}${nodeInfo} ${entry.message}`);
      break;
    default:
      console.log(`${prefix}${nodeInfo} ${entry.message}`);
  }
}
