import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL environment variable is required");

const url = new URL(databaseUrl);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
});
const prisma = new PrismaClient({ adapter });

const ownerEmail = "obada7174@gmail.com";

type FlowNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  animated?: boolean;
};

const flows: Array<{
  title: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}> = [
  {
    title: "Customer Onboarding Risk Router",
    description: "End-to-end onboarding flow that scores a customer, branches by risk, drafts team email, and logs the outcome.",
    nodes: [
      node("webhook-1", "webhook", 80, 120, { path: "/webhook/customer-created", method: "POST" }),
      node("set-1", "set", 300, 120, { key: "status", value: "ready" }),
      node("http-1", "http", 520, 120, { method: "GET", url: "http://localhost:3000/api/health", body: "" }),
      node("transform-1", "transform", 760, 120, { expression: "Normalize customer profile, riskScore, and account tier" }),
      node("condition-1", "condition", 1000, 120, { field: "status", operator: "equals", value: "ready", condition: "status equals ready" }),
      node("email-true", "email", 1240, 40, { to: "success-team@example.com", subject: "New customer ready for onboarding", body: "Customer is ready. Start onboarding checklist." }),
      node("email-false", "email", 1240, 220, { to: "risk-team@example.com", subject: "Customer onboarding blocked", body: "Customer requires risk review before activation." }),
      node("merge-1", "merge", 1480, 120, { mode: "combine" }),
      node("ai-1", "aiPrompt", 1710, 120, { model: "workflow-ai", prompt: "Summarize onboarding decision and next best action for the operator." }),
      node("log-1", "log", 1940, 120, { message: "Customer onboarding flow completed." }),
    ],
    edges: [
      edge("e1", "webhook-1", "set-1"),
      edge("e2", "set-1", "http-1"),
      edge("e3", "http-1", "transform-1"),
      edge("e4", "transform-1", "condition-1"),
      edge("e5", "condition-1", "email-true", "true"),
      edge("e6", "condition-1", "email-false", "false"),
      edge("e7", "email-true", "merge-1"),
      edge("e8", "email-false", "merge-1"),
      edge("e9", "merge-1", "ai-1"),
      edge("e10", "ai-1", "log-1"),
    ],
  },
  {
    title: "Daily Operations Health Digest",
    description: "Scheduled operational digest that checks system health, filters for incidents, drafts alerts, and produces an AI summary.",
    nodes: [
      node("schedule-1", "schedule", 80, 120, { cron: "0 8 * * 1-5", timezone: "Asia/Damascus" }),
      node("db-1", "database", 300, 120, { action: "select", table: "task_executions", where: "createdAt >= today AND status != SUCCESS" }),
      node("math-1", "math", 520, 120, { operation: "add", left: 7, right: 3 }),
      node("condition-1", "condition", 740, 120, { field: "status", operator: "notEquals", value: "SUCCESS", condition: "status notEquals SUCCESS" }),
      node("email-incident", "email", 980, 40, { to: "ops@example.com", subject: "Incident digest needs review", body: "There are failed or pending workflow executions." }),
      node("log-clean", "log", 980, 220, { message: "No critical operation incidents detected." }),
      node("ai-1", "aiPrompt", 1220, 120, { model: "workflow-ai", prompt: "Write a concise morning operations digest with risks and next actions." }),
      node("log-1", "log", 1450, 120, { message: "Daily operations digest generated." }),
    ],
    edges: [
      edge("e1", "schedule-1", "db-1"),
      edge("e2", "db-1", "math-1"),
      edge("e3", "math-1", "condition-1"),
      edge("e4", "condition-1", "email-incident", "true"),
      edge("e5", "condition-1", "log-clean", "false"),
      edge("e6", "email-incident", "ai-1"),
      edge("e7", "log-clean", "ai-1"),
      edge("e8", "ai-1", "log-1"),
    ],
  },
  {
    title: "Lead Qualification And Follow Up",
    description: "Qualifies inbound leads, branches by fit, enriches data, and drafts a personalized follow-up.",
    nodes: [
      node("webhook-1", "webhook", 80, 140, { path: "/webhook/new-lead", method: "POST" }),
      node("set-1", "set", 300, 140, { key: "status", value: "ready" }),
      node("http-1", "http", 520, 140, { method: "GET", url: "http://localhost:3000/api/health", body: "" }),
      node("filter-1", "filter", 740, 140, { field: "status", operator: "equals", value: "ready" }),
      node("condition-1", "condition", 960, 140, { field: "status", operator: "equals", value: "ready", condition: "status equals ready" }),
      node("email-sales", "email", 1200, 60, { to: "sales@example.com", subject: "Qualified lead ready", body: "Lead passed qualification. Prepare outreach." }),
      node("delay-1", "delay", 1200, 240, { duration: 1500 }),
      node("ai-1", "aiPrompt", 1440, 140, { model: "workflow-ai", prompt: "Create a friendly follow-up message based on lead enrichment and qualification output." }),
      node("log-1", "log", 1680, 140, { message: "Lead qualification flow finished." }),
    ],
    edges: [
      edge("e1", "webhook-1", "set-1"),
      edge("e2", "set-1", "http-1"),
      edge("e3", "http-1", "filter-1"),
      edge("e4", "filter-1", "condition-1"),
      edge("e5", "condition-1", "email-sales", "true"),
      edge("e6", "condition-1", "delay-1", "false"),
      edge("e7", "email-sales", "ai-1"),
      edge("e8", "delay-1", "ai-1"),
      edge("e9", "ai-1", "log-1"),
    ],
  },
  {
    title: "Failed Execution Recovery Playbook",
    description: "Finds failed executions, classifies recovery path, drafts operator communication, and logs remediation plan.",
    nodes: [
      node("schedule-1", "schedule", 80, 140, { cron: "*/30 * * * *", timezone: "Asia/Damascus" }),
      node("db-1", "database", 300, 140, { action: "select", table: "task_executions", where: "status = FAILED" }),
      node("set-1", "set", 520, 140, { key: "status", value: "ready" }),
      node("condition-1", "condition", 740, 140, { field: "status", operator: "equals", value: "ready", condition: "status equals ready" }),
      node("transform-1", "transform", 980, 60, { expression: "Group failures by workflow, error message, and latest occurrence" }),
      node("log-none", "log", 980, 240, { message: "No failed executions require recovery." }),
      node("email-1", "email", 1220, 60, { to: "engineering@example.com", subject: "Execution recovery playbook", body: "Failed executions require review. See AI summary." }),
      node("ai-1", "aiPrompt", 1460, 140, { model: "workflow-ai", prompt: "Write a recovery playbook: probable cause, owner, priority, and next action." }),
      node("log-1", "log", 1700, 140, { message: "Recovery playbook generated." }),
    ],
    edges: [
      edge("e1", "schedule-1", "db-1"),
      edge("e2", "db-1", "set-1"),
      edge("e3", "set-1", "condition-1"),
      edge("e4", "condition-1", "transform-1", "true"),
      edge("e5", "condition-1", "log-none", "false"),
      edge("e6", "transform-1", "email-1"),
      edge("e7", "email-1", "ai-1"),
      edge("e8", "log-none", "ai-1"),
      edge("e9", "ai-1", "log-1"),
    ],
  },
];

function node(id: string, type: string, x: number, y: number, data: Record<string, unknown>): FlowNode {
  return { id, type, position: { x, y }, data };
}

function edge(id: string, source: string, target: string, sourceHandle?: string): FlowEdge {
  return { id, source, target, sourceHandle, animated: true };
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!user) throw new Error(`User not found: ${ownerEmail}`);

  for (const flow of flows) {
    const existing = await prisma.task.findFirst({
      where: { userId: user.id, title: flow.title },
    });

    if (existing) {
      await prisma.task.update({
        where: { id: existing.id },
        data: {
          description: flow.description,
          nodes: flow.nodes as any,
          edges: flow.edges as any,
          isActive: true,
        },
      });
      console.log(`Updated: ${flow.title}`);
    } else {
      await prisma.task.create({
        data: {
          userId: user.id,
          title: flow.title,
          description: flow.description,
          nodes: flow.nodes as any,
          edges: flow.edges as any,
          isActive: true,
        },
      });
      console.log(`Created: ${flow.title}`);
    }
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
