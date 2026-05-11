import "dotenv/config";
import jwt from "jsonwebtoken";
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

async function executeWithStatus(taskId: string, token: string, status: string) {
  const execute = await fetch(`http://localhost:3000/api/tasks/${taskId}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ input: { status, customerId: `C-${status}` } }),
  });

  const executeBody = await execute.json();
  if (!execute.ok) throw new Error(JSON.stringify(executeBody));

  const executionId = executeBody.data.executionId as string;
  const details = await fetch(`http://localhost:3000/api/executions/${executionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const detailsBody = await details.json();
  if (!details.ok) throw new Error(JSON.stringify(detailsBody));

  return {
    status,
    executionId,
    executionStatus: detailsBody.data.status,
    outputKeys: Object.keys(detailsBody.data.output || {}),
    condition: detailsBody.data.output?.["condition-1"],
  };
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "obada7174@gmail.com" } });
  if (!user) throw new Error("obada user not found");

  const task = await prisma.task.findFirst({
    where: { userId: user.id, title: "Customer Onboarding Risk Router" },
  });
  if (!task) throw new Error("test flow not found");

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || "fallback-secret-change-me",
    { expiresIn: "10m" }
  );

  const ready = await executeWithStatus(task.id, token, "ready");
  const blocked = await executeWithStatus(task.id, token, "blocked");

  console.log(JSON.stringify({ task: task.title, ready, blocked }, null, 2));
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
