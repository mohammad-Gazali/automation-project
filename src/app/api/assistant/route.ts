import { withAuth } from "@/middleware/auth.middleware";
import { successResponse, errorResponse } from "@/lib/response";
import { AUTOMATION_NODES } from "@/lib/automationCatalog";
import { listTasks } from "@/modules/tasks/task.service";
import { createExecution } from "@/modules/executions/execution.service";
import { enqueueTaskExecution } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type AssistantAction = {
  type: "run_workflow";
  taskId?: string;
  taskTitle?: string;
  input?: Record<string, unknown>;
};

type AssistantDecision = {
  reply: string;
  action?: AssistantAction;
};

type AssistantUiAction = {
  type: "run_workflow" | "explain_workflow";
  label: string;
  taskId: string;
  taskTitle: string;
  prompt: string;
};

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
};

export const GET = withAuth(async (userId, _email, request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const conversation = await prisma.assistantConversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation) {
        return errorResponse("Conversation not found", 404);
      }

      return successResponse({
        conversation,
        messages: conversation.messages,
      });
    }

    const conversations = await prisma.assistantConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return successResponse({
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessage: conversation.messages[0] || null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load conversations";
    return errorResponse(message, 500);
  }
});

export const POST = withAuth(async (userId, _email, request) => {
  try {
    const body = await request.json().catch(() => ({}));
    const message = String(body.message || "").trim();
    const requestedConversationId = typeof body.conversationId === "string" ? body.conversationId : undefined;

    if (!message) {
      return successResponse({
        provider: "ollama",
        model: getOllamaModel(),
        reply: "اكتب سؤالك عن المشروع، العقد، الفلوهات، التنفيذات، أو اطلب تشغيل فلو محفوظ.",
      });
    }

    const conversation = await getOrCreateConversation(userId, requestedConversationId, message);
    await prisma.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: message,
      },
    });

    const chatHistory = await getRecentConversationHistory(conversation.id);
    const context = await buildAssistantContext(userId);
    const decision = await askLocalModel(message, context, chatHistory);
    const actionResult = await runAssistantAction(userId, decision.action, context.tasks);
    const suggestedActions = buildSuggestedActions(context.tasks, message, decision);
    const reply = [decision.reply, actionResult?.reply].filter(Boolean).join("\n\n");

    const assistantMessage = await prisma.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: reply,
        metadata: {
          provider: "ollama",
          model: getOllamaModel(),
          action: actionResult || null,
          suggestedActions,
          context: {
            nodeCount: context.nodes.length,
            workflowCount: context.tasks.length,
            recentExecutionCount: context.recentExecutions.length,
          },
        },
      },
    });

    return successResponse({
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      provider: "ollama",
      model: getOllamaModel(),
      reply,
      action: actionResult || null,
      suggestedActions,
      context: {
        nodeCount: context.nodes.length,
        workflowCount: context.tasks.length,
        recentExecutionCount: context.recentExecutions.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant failed";
    return errorResponse(message, 500);
  }
});

async function buildAssistantContext(userId: string) {
  const taskResult = await listTasks(userId, { page: 1, limit: 100 });

  const recentExecutions = await prisma.taskExecution.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      task: {
        select: { id: true, title: true },
      },
      _count: {
        select: { logs: true },
      },
    },
  });

  const dbStats = {
    users: await prisma.user.count(),
    tasks: await prisma.task.count({ where: { userId } }),
    executions: await prisma.taskExecution.count({ where: { userId } }),
    logs: await prisma.executionLog.count({
      where: {
        execution: { userId },
      },
    }),
  };

  return {
    assistantRuntime: {
      provider: "ollama",
      selectedModel: getOllamaModel(),
      baseUrl: getOllamaBaseUrl(),
      isCloudBacked: getOllamaModel().includes("cloud"),
    },
    nodes: AUTOMATION_NODES.map((node) => ({
      type: node.type,
      label: node.label,
      category: node.category,
      description: node.description,
      defaultData: node.defaultData,
    })),
    tasks: taskResult.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      isActive: task.isActive,
      nodeCount: Array.isArray(task.nodes) ? task.nodes.length : 0,
      edgeCount: Array.isArray(task.edges) ? task.edges.length : 0,
      nodeTypes: summarizeTaskNodes(task.nodes),
      executions: task._count.executions,
      updatedAt: task.updatedAt,
    })),
    recentExecutions: recentExecutions.map((execution) => ({
      id: execution.id,
      taskId: execution.taskId,
      taskTitle: execution.task.title,
      status: execution.status,
      error: execution.error,
      createdAt: execution.createdAt,
      startedAt: execution.startedAt,
      endedAt: execution.endedAt,
      logCount: execution._count.logs,
    })),
    dbStats,
  };
}

async function getOrCreateConversation(userId: string, conversationId: string | undefined, firstMessage: string) {
  if (conversationId) {
    const existing = await prisma.assistantConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (existing) return existing;
  }

  return prisma.assistantConversation.create({
    data: {
      userId,
      title: createConversationTitle(firstMessage),
    },
  });
}

async function getRecentConversationHistory(conversationId: string) {
  const messages = await prisma.assistantMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return messages.reverse().map((message) => ({
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content.slice(0, 1200),
  }));
}

function createConversationTitle(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (normalized.length <= 48) return normalized || "New conversation";
  return `${normalized.slice(0, 45)}...`;
}

function buildSuggestedActions(
  tasks: Awaited<ReturnType<typeof buildAssistantContext>>["tasks"],
  userMessage: string,
  decision: AssistantDecision
): AssistantUiAction[] {
  const text = normalize(`${userMessage} ${decision.reply}`);
  const matched = tasks.filter((task) => {
    const title = normalize(task.title);
    return title && (text.includes(title) || title.split(/\s+/).some((part) => part.length > 3 && text.includes(part)));
  });

  const selected = (matched.length > 0 ? matched : tasks).slice(0, 4);
  return selected.flatMap((task) => [
    {
      type: "explain_workflow" as const,
      label: `اشرح ${task.title}`,
      taskId: task.id,
      taskTitle: task.title,
      prompt: `اشرح لي الفلو "${task.title}" بالتفصيل: ما عقده، ما الهدف منه، وما التحسينات المقترحة؟`,
    },
    {
      type: "run_workflow" as const,
      label: `شغل ${task.title}`,
      taskId: task.id,
      taskTitle: task.title,
      prompt: `شغل الفلو "${task.title}" الآن`,
    },
  ]);
}

function summarizeTaskNodes(nodes: unknown) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => {
    const item = node as { id?: string; type?: string; data?: Record<string, unknown> };
    return {
      id: item.id,
      type: item.type,
      dataPreview: summarizeData(item.data || {}),
    };
  });
}

function summarizeData(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data)
      .slice(0, 4)
      .map(([key, value]) => [key, String(value).slice(0, 120)])
  );
}

async function askLocalModel(
  userMessage: string,
  context: Awaited<ReturnType<typeof buildAssistantContext>>,
  chatHistory: Array<{ role: string; content: string }>
): Promise<AssistantDecision> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getOllamaTimeoutMs());

  const response = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify({
      model: getOllamaModel(),
      stream: false,
      format: "json",
      options: {
        temperature: 0.2,
        num_ctx: 4096,
        num_predict: 700,
      },
      messages: [
        {
          role: "system",
          content: [
            "You are the AI assistant inside a mini n8n-like automation builder.",
            `The actual assistant runtime model is "${getOllamaModel()}" via Ollama.`,
            "You run through the user's Ollama app. The selected model may be local or Ollama cloud-backed.",
            "If asked what model you are, answer with the exact assistant runtime model above, not any workflow node model field.",
            "Do not claim the model is fully local when the model name contains cloud.",
            "Answer primarily in Arabic unless the user writes in another language.",
            "You can inspect the provided project snapshot: available nodes, workflows, recent executions, and database statistics.",
            "Use chatHistory to keep continuity with the user conversation.",
            "You cannot directly query arbitrary SQL. You can only use the provided safe snapshot.",
            "If the user asks to run a workflow, choose the best matching workflow from context.tasks and return an action.",
            "Return ONLY valid JSON with this shape:",
            '{"reply":"human readable answer","action":{"type":"run_workflow","taskId":"workflow id","taskTitle":"workflow title","input":{}}}',
            "Omit action when no workflow should be run.",
            "Never put a JSON object as text inside reply. The reply value must be the final clean human answer.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              userMessage,
              chatHistory,
              projectContext: context,
            },
            null,
            2
          ),
        },
      ],
    }),
  })
    .catch((error) => {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`انتهت مهلة انتظار Ollama بعد ${Math.round(getOllamaTimeoutMs() / 1000)} ثانية. جرّب سؤالًا أقصر أو زد OLLAMA_TIMEOUT_MS.`);
      }
      throw error;
    })
    .finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Ollama is not ready. تأكد أن Ollama يعمل وأن الموديل "${getOllamaModel()}" موجود. ${details}`.trim()
    );
  }

  const data = (await response.json()) as OllamaChatResponse;
  const content = data.message?.content || "";
  return parseDecision(content);
}

async function runAssistantAction(
  userId: string,
  action: AssistantAction | undefined,
  tasks: Awaited<ReturnType<typeof buildAssistantContext>>["tasks"]
) {
  if (!action || action.type !== "run_workflow") return null;

  const task = findTaskForAction(action, tasks);
  if (!task) {
    return {
      type: action.type,
      success: false,
      reply: "حاولت اختيار فلو للتشغيل، لكن لم أجد فلو مطابقًا في قاعدة البيانات.",
    };
  }

  const execution = await createExecution(task.id, userId, {
    triggeredBy: "ollama-ai-assistant",
    model: getOllamaModel(),
    input: action.input || {},
  });
  const { queued } = await enqueueTaskExecution(task.id, execution.id, userId);

  return {
    type: action.type,
    success: true,
    taskId: task.id,
    taskTitle: task.title,
    executionId: execution.id,
    queued,
    reply: `تم تشغيل الفلو "${task.title}" محليًا. رقم التنفيذ: ${execution.id}.`,
  };
}

function parseDecision(content: string): AssistantDecision {
  const cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json/gi, "```")
    .trim();

  const jsonText = extractJson(cleaned);
  try {
    const parsed = parseMaybeNestedJson(jsonText) as AssistantDecision;
    return {
      reply: normalizeAssistantReply(parsed.reply),
      action: parsed.action,
    };
  } catch {
    return {
      reply: normalizeAssistantReply(extractReplyField(cleaned) || cleaned || "لم أستطع تكوين رد واضح من النموذج المحلي."),
    };
  }
}

function parseMaybeNestedJson(value: string): unknown {
  const parsed = JSON.parse(value);
  if (typeof parsed === "string" && looksLikeJson(parsed)) {
    return JSON.parse(parsed);
  }
  return parsed;
}

function normalizeAssistantReply(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "تم تحليل الطلب.";

  if (looksLikeJson(text)) {
    try {
      const parsed = parseMaybeNestedJson(text) as { reply?: unknown };
      if (parsed && typeof parsed === "object" && "reply" in parsed) {
        return normalizeAssistantReply(parsed.reply);
      }
    } catch {
      const extracted = extractReplyField(text);
      if (extracted) return extracted;
    }
  }

  return text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function looksLikeJson(value: string) {
  const text = value.trim();
  return (text.startsWith("{") && text.endsWith("}")) || (text.startsWith('"') && text.endsWith('"'));
}

function extractReplyField(value: string) {
  const match = value.match(/"reply"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"action"|,\s*"[^"]+"\s*:|}\s*$)/);
  if (!match?.[1]) return "";
  return match[1]
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .trim();
}

function extractJson(value: string) {
  const fenced = value.match(/```([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();

  const first = value.indexOf("{");
  const last = value.lastIndexOf("}");
  if (first >= 0 && last > first) return value.slice(first, last + 1);

  return value;
}

function findTaskForAction(
  action: AssistantAction,
  tasks: Awaited<ReturnType<typeof buildAssistantContext>>["tasks"]
) {
  const requestedId = normalize(action.taskId || "");
  const requestedTitle = normalize(action.taskTitle || "");

  return (
    tasks.find((task) => normalize(task.id) === requestedId) ||
    tasks.find((task) => normalize(task.title) === requestedTitle) ||
    tasks.find((task) => requestedTitle && normalize(task.title).includes(requestedTitle)) ||
    null
  );
}

function getOllamaBaseUrl() {
  return process.env.OLLAMA_BASE_URL || "http://localhost:11434";
}

function getOllamaModel() {
  return process.env.OLLAMA_MODEL || "qwen3:8b";
}

function getOllamaTimeoutMs() {
  const timeout = Number(process.env.OLLAMA_TIMEOUT_MS);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : 120000;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
}
