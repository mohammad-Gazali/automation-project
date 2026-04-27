import { prisma } from "@/lib/prisma";
import { createLog, consoleLog } from "@/lib/logger";
import { ExecutionStatus } from "@prisma/client";

// ─── Execution Creation ──────────────────────────────────────────────────────

export async function createExecution(
  taskId: string,
  userId: string,
  input?: Record<string, unknown>
) {
  return prisma.taskExecution.create({
    data: {
      taskId,
      userId,
      status: "PENDING",
      input: (input ?? null) as any,
    },
  });
}

// ─── Task Execution Engine ───────────────────────────────────────────────────

export async function executeTaskById(
  taskId: string,
  executionId: string,
  userId: string
) {
  const execution = await prisma.taskExecution.findUnique({
    where: { id: executionId },
    include: { task: true },
  });

  if (!execution) {
    throw new Error("Execution not found");
  }

  if (execution.status !== "PENDING") {
    throw new Error(`Execution is already in ${execution.status} state`);
  }

  // Mark as running
  await prisma.taskExecution.update({
    where: { id: executionId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  await createLogAndConsole({
    executionId,
    level: "INFO",
    message: `Starting execution of task: ${execution.task.title}`,
  });

  try {
    // Parse nodes and edges from the task
    const nodes = execution.task.nodes as Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: Record<string, unknown>;
    }>;

    const edges = execution.task.edges as Array<{
      id: string;
      source: string;
      target: string;
    }>;

    // Build adjacency map for traversal
    const adjacencyMap = new Map<string, string[]>();
    for (const edge of edges) {
      if (!adjacencyMap.has(edge.source)) {
        adjacencyMap.set(edge.source, []);
      }
      adjacencyMap.get(edge.source)!.push(edge.target);
    }

    // Find root nodes (nodes with no incoming edges)
    const targetNodes = new Set(edges.map((e) => e.target));
    const rootNodes = nodes.filter((n) => !targetNodes.has(n.id));

    // Execute nodes in topological order (BFS from roots)
    const output: Record<string, unknown> = {};
    const visited = new Set<string>();
    const queue = [...rootNodes];

    while (queue.length > 0) {
      const node = queue.shift()!;

      if (visited.has(node.id)) continue;
      visited.add(node.id);

      await createLogAndConsole({
        executionId,
        level: "INFO",
        message: `Executing node: ${node.type} (${node.id})`,
        nodeId: node.id,
        nodeType: node.type,
      });

      // Execute node based on type
      const nodeResult = await executeNode(node, execution.input as Record<string, unknown> | null, output);

      output[node.id] = nodeResult;

      // Add children to queue
      const children = adjacencyMap.get(node.id) || [];
      for (const childId of children) {
        const childNode = nodes.find((n) => n.id === childId);
        if (childNode && !visited.has(childId)) {
          queue.push(childNode);
        }
      }
    }

    // Mark as success
    await prisma.taskExecution.update({
      where: { id: executionId },
      data: {
        status: "SUCCESS",
        output: output as any,
        endedAt: new Date(),
      },
    });

    await createLogAndConsole({
      executionId,
      level: "INFO",
      message: "Execution completed successfully",
    });

    return { executionId, status: "SUCCESS" as ExecutionStatus, output };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await prisma.taskExecution.update({
      where: { id: executionId },
      data: {
        status: "FAILED",
        error: errorMessage,
        endedAt: new Date(),
      },
    });

    await createLogAndConsole({
      executionId,
      level: "ERROR",
      message: `Execution failed: ${errorMessage}`,
    });

    throw error;
  }
}

// ─── Node Execution Handlers ─────────────────────────────────────────────────

async function executeNode(
  node: { id: string; type: string; data: Record<string, unknown> },
  input: Record<string, unknown> | null,
  previousOutput: Record<string, unknown>
): Promise<unknown> {
  switch (node.type) {
    case "log":
      return executeLogNode(node);

    case "color":
      return executeColorNode(node);

    case "http":
      return executeHttpNode(node, input, previousOutput);

    case "transform":
      return executeTransformNode(node, input, previousOutput);

    case "delay":
      return executeDelayNode(node);

    case "condition":
      return executeConditionNode(node, input, previousOutput);

    default:
      return { type: node.type, message: `Unknown node type: ${node.type}` };
  }
}

async function executeLogNode(node: { data: Record<string, unknown> }) {
  const message = (node.data.message as string) || "Log message";
  console.log(`[Node Log] ${message}`);
  return { type: "log", message };
}

async function executeColorNode(node: { data: Record<string, unknown> }) {
  const color = (node.data.color as string) || "#000000";
  return { type: "color", color };
}

async function executeHttpNode(
  node: { data: Record<string, unknown> },
  input: Record<string, unknown> | null,
  previousOutput: Record<string, unknown>
) {
  const url = (node.data.url as string) || "";
  const method = (node.data.method as string) || "GET";

  if (!url) {
    throw new Error("HTTP node requires a URL");
  }

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: node.data.body ? JSON.stringify(node.data.body) : undefined,
    });

    const data = await response.json().catch(() => null);

    return {
      type: "http",
      status: response.status,
      data,
    };
  } catch (error) {
    throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function executeTransformNode(
  node: { data: Record<string, unknown> },
  input: Record<string, unknown> | null,
  previousOutput: Record<string, unknown>
) {
  const expression = (node.data.expression as string) || "";

  // Simple transform: merge input with previous output
  const result = {
    ...input,
    ...previousOutput,
    _transformed: expression || "no expression",
  };

  return { type: "transform", result };
}

async function executeDelayNode(node: { data: Record<string, unknown> }) {
  const ms = Math.min(Math.max(Number(node.data.duration) || 1000, 0), 30000);
  await new Promise((resolve) => setTimeout(resolve, ms));
  return { type: "delay", duration: ms };
}

async function executeConditionNode(
  node: { data: Record<string, unknown> },
  input: Record<string, unknown> | null,
  previousOutput: Record<string, unknown>
) {
  const condition = (node.data.condition as string) || "true";
  // Simple evaluation - in production, use a safe expression evaluator
  const result = condition === "true" || condition === "1";
  return { type: "condition", condition, result };
}

// ─── Execution Queries ───────────────────────────────────────────────────────

export async function getExecutionById(executionId: string, userId: string) {
  const execution = await prisma.taskExecution.findFirst({
    where: { id: executionId, userId },
    include: {
      task: {
        select: { id: true, title: true },
      },
    },
  });

  if (!execution) {
    throw new Error("Execution not found");
  }

  return execution;
}

export async function listExecutions(
  userId: string,
  options?: {
    taskId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId };
  if (options?.taskId) where.taskId = options.taskId;
  if (options?.status) where.status = options.status;

  const [executions, total] = await Promise.all([
    prisma.taskExecution.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        task: {
          select: { id: true, title: true },
        },
      },
    }),
    prisma.taskExecution.count({ where }),
  ]);

  return {
    executions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getExecutionLogs(executionId: string, userId: string) {
  // Verify execution belongs to user
  await getExecutionById(executionId, userId);

  return prisma.executionLog.findMany({
    where: { executionId },
    orderBy: { timestamp: "asc" },
  });
}

// ─── Helper ──────────────────────────────────────────────────────────────────

async function createLogAndConsole(entry: {
  executionId: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  message: string;
  nodeId?: string;
  nodeType?: string;
  metadata?: Record<string, unknown>;
}) {
  const logEntry = {
    ...entry,
    metadata: entry.metadata ?? undefined,
  };

  // Log to console immediately
  consoleLog(logEntry);

  // Persist to database
  try {
    await createLog(logEntry);
  } catch (error) {
    console.error("[Logger] Failed to persist log:", error);
  }
}
