import { prisma } from "@/lib/prisma";
import { createLog, consoleLog } from "@/lib/logger";
import { ExecutionStatus } from "@prisma/client";
import nodemailer from "nodemailer";

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
      sourceHandle?: string | null;
    }>;

    // Build adjacency map for traversal
    const adjacencyMap = new Map<string, Array<{ target: string; sourceHandle?: string | null }>>();
    for (const edge of edges) {
      if (!adjacencyMap.has(edge.source)) {
        adjacencyMap.set(edge.source, []);
      }
      adjacencyMap.get(edge.source)!.push({ target: edge.target, sourceHandle: edge.sourceHandle });
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
      const children = getExecutableChildren(node, nodeResult, adjacencyMap);
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

    case "set":
      return executeSetNode(node);

    case "filter":
      return executeFilterNode(node, input, previousOutput);

    case "math":
      return executeMathNode(node);

    case "merge":
      return executeMergeNode(node, input, previousOutput);

    case "email":
      return executeEmailNode(node);

    case "database":
      return executeDatabaseNode(node);

    case "webhook":
      return executeWebhookNode(node);

    case "schedule":
      return executeScheduleNode(node);

    case "aiPrompt":
      return executeAiPromptNode(node, input, previousOutput);

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
  const condition = String(node.data.condition || "");
  const field = String(node.data.field || "");
  const operator = String(node.data.operator || "");
  const expected = String(node.data.value ?? "");
  const source = { ...flattenNodeOutputs(previousOutput), ...(input || {}) };
  const evaluation = evaluateCondition({ condition, field, operator, expected, source });

  return {
    type: "condition",
    condition,
    field: evaluation.field,
    operator: evaluation.operator,
    expected: evaluation.expected,
    actual: evaluation.actual,
    result: evaluation.result,
    reason: evaluation.reason,
  };
}

async function executeSetNode(node: { data: Record<string, unknown> }) {
  const key = String(node.data.key || "value");
  const value = node.data.value ?? "";
  return { type: "set", data: { [key]: value } };
}

async function executeFilterNode(
  node: { data: Record<string, unknown> },
  input: Record<string, unknown> | null,
  previousOutput: Record<string, unknown>
) {
  const field = String(node.data.field || "");
  const operator = String(node.data.operator || "equals");
  const expected = String(node.data.value ?? "");
  const source = { ...flattenNodeOutputs(previousOutput), ...(input || {}) };
  const actual = String(source[field] ?? "");

  const passed =
    operator === "contains"
      ? actual.includes(expected)
      : operator === "notEquals"
        ? actual !== expected
        : actual === expected;

  return { type: "filter", field, operator, expected, actual, passed };
}

async function executeMathNode(node: { data: Record<string, unknown> }) {
  const left = Number(node.data.left) || 0;
  const right = Number(node.data.right) || 0;
  const operation = String(node.data.operation || "add");
  const result =
    operation === "subtract"
      ? left - right
      : operation === "multiply"
        ? left * right
        : operation === "divide"
          ? right === 0 ? null : left / right
          : left + right;

  return { type: "math", operation, left, right, result };
}

async function executeMergeNode(
  node: { data: Record<string, unknown> },
  input: Record<string, unknown> | null,
  previousOutput: Record<string, unknown>
) {
  const mode = String(node.data.mode || "combine");
  return {
    type: "merge",
    mode,
    result: {
      input: input || {},
      previousNodeIds: Object.keys(previousOutput),
      flattened: flattenNodeOutputs(previousOutput),
    },
  };
}

async function executeEmailNode(node: { data: Record<string, unknown> }) {
  const to = String(node.data.to || "").trim();
  const subject = String(node.data.subject || "").trim();
  const body = String(node.data.body || "");
  const from = String(node.data.from || process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();

  if (!to) {
    throw new Error("Send Email node requires a recipient in the `to` field");
  }

  if (!subject) {
    throw new Error("Send Email node requires a subject");
  }

  const smtp = getSmtpConfig();
  if (!smtp) {
    throw new Error(
      "Send Email node cannot send yet: SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and optionally SMTP_FROM to .env, then restart the dev server."
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  const result = await transporter.sendMail({
    from: from || smtp.from,
    to,
    subject,
    text: body,
    html: body.includes("<") ? body : undefined,
  });

  return {
    type: "email",
    sent: true,
    to,
    from: from || smtp.from,
    subject,
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
  };
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass || !Number.isFinite(port)) return null;

  return {
    host,
    port,
    user,
    pass,
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465,
    from: process.env.SMTP_FROM || user,
  };
}

async function executeDatabaseNode(node: { data: Record<string, unknown> }) {
  return {
    type: "database",
    simulated: true,
    action: String(node.data.action || "select"),
    table: String(node.data.table || ""),
    where: String(node.data.where || ""),
    rows: [],
  };
}

async function executeWebhookNode(node: { data: Record<string, unknown> }) {
  return {
    type: "webhook",
    trigger: "manual",
    method: String(node.data.method || "POST"),
    path: String(node.data.path || "/webhook"),
  };
}

async function executeScheduleNode(node: { data: Record<string, unknown> }) {
  return {
    type: "schedule",
    trigger: "manual-preview",
    cron: String(node.data.cron || ""),
    timezone: String(node.data.timezone || "UTC"),
  };
}

async function executeAiPromptNode(
  node: { data: Record<string, unknown> },
  input: Record<string, unknown> | null,
  previousOutput: Record<string, unknown>
) {
  const prompt = String(node.data.prompt || "");
  return {
    type: "aiPrompt",
    model: String(node.data.model || "local-assistant"),
    prompt,
    response: `Prepared AI prompt with ${Object.keys(previousOutput).length} previous node outputs.`,
    context: { input: input || {}, previousNodeIds: Object.keys(previousOutput) },
  };
}

function flattenNodeOutputs(previousOutput: Record<string, unknown>) {
  return Object.values(previousOutput).reduce<Record<string, unknown>>((acc, value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      assignMissing(acc, value as Record<string, unknown>);
      const data = (value as Record<string, unknown>).data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        assignMissing(acc, data as Record<string, unknown>);
      }
    }
    return acc;
  }, {});
}

function assignMissing(target: Record<string, unknown>, source: Record<string, unknown>) {
  for (const [key, value] of Object.entries(source)) {
    if (target[key] === undefined) {
      target[key] = value;
    }
  }
}

function getExecutableChildren(
  node: { id: string; type: string },
  nodeResult: unknown,
  adjacencyMap: Map<string, Array<{ target: string; sourceHandle?: string | null }>>
) {
  const children = adjacencyMap.get(node.id) || [];
  if (node.type !== "condition") {
    return children.map((child) => child.target);
  }

  const result =
    nodeResult && typeof nodeResult === "object" && "result" in nodeResult
      ? Boolean((nodeResult as { result: unknown }).result)
      : false;
  const desiredHandle = result ? "true" : "false";
  const matched = children.filter((child) => child.sourceHandle === desiredHandle);
  if (matched.length > 0) {
    return matched.map((child) => child.target);
  }

  const unlabeled = children.filter((child) => !child.sourceHandle);
  if (unlabeled.length > 1) {
    const branchIndex = result ? 0 : 1;
    return [unlabeled[Math.min(branchIndex, unlabeled.length - 1)].target];
  }

  return result ? unlabeled.map((child) => child.target) : [];
}

function evaluateCondition({
  condition,
  field,
  operator,
  expected,
  source,
}: {
  condition: string;
  field: string;
  operator: string;
  expected: string;
  source: Record<string, unknown>;
}) {
  const parsed = field ? null : parseConditionExpression(condition);
  const resolvedField = field || parsed?.field || "";
  const resolvedOperator = normalizeConditionOperator(operator || parsed?.operator || "equals");
  const resolvedExpected = field ? expected : parsed?.expected ?? expected;
  const hasField = resolvedField ? Object.prototype.hasOwnProperty.call(source, resolvedField) : false;
  const actual = resolvedField ? String(source[resolvedField] ?? "") : "";

  if (!resolvedField) {
    const normalizedCondition = condition.trim().toLowerCase();
    return {
      field: resolvedField,
      operator: resolvedOperator,
      expected: resolvedExpected,
      actual: condition,
      result: normalizedCondition === "true" || normalizedCondition === "1",
      reason: "literal-condition",
    };
  }

  if (resolvedOperator === "exists") {
    return {
      field: resolvedField,
      operator: resolvedOperator,
      expected: resolvedExpected,
      actual,
      result: hasField && actual.length > 0,
      reason: hasField ? "field-exists" : "field-missing",
    };
  }

  if (!hasField) {
    return {
      field: resolvedField,
      operator: resolvedOperator,
      expected: resolvedExpected,
      actual,
      result: false,
      reason: "field-missing",
    };
  }

  return {
    field: resolvedField,
    operator: resolvedOperator,
    expected: resolvedExpected,
    actual,
    result: compareCondition(actual, resolvedOperator, resolvedExpected),
    reason: "field-comparison",
  };
}

function parseConditionExpression(condition: string) {
  const trimmed = condition.trim();
  const match = trimmed.match(/^([\w.-]+)\s*(===|==|!==|!=|>=|<=|>|<|equals|notEquals|contains|exists)\s*(.*)$/i);
  if (!match) return null;

  return {
    field: match[1],
    operator: match[2],
    expected: stripConditionQuotes(match[3] || ""),
  };
}

function normalizeConditionOperator(operator: string) {
  const normalized = operator.trim();
  if (["==", "===", "equals"].includes(normalized)) return "equals";
  if (["!=", "!==", "notEquals"].includes(normalized)) return "notEquals";
  return normalized;
}

function compareCondition(actual: string, operator: string, expected: string) {
  if (operator === "contains") return actual.includes(expected);
  if (operator === "notEquals") return actual !== expected;
  if ([">", "<", ">=", "<="].includes(operator)) {
    const left = Number(actual);
    const right = Number(expected);
    if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
    if (operator === ">") return left > right;
    if (operator === "<") return left < right;
    if (operator === ">=") return left >= right;
    return left <= right;
  }
  return actual === expected;
}

function stripConditionQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
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
