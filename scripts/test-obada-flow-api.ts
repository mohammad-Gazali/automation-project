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

  const execute = await fetch(`http://localhost:3000/api/tasks/${task.id}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ input: { status: "ready", customerId: "C-1001" } }),
  });
  const executeText = await execute.text();
  if (!executeText.trim().startsWith("{")) {
    throw new Error(`Expected JSON from execute API, got status ${execute.status}: ${executeText.slice(0, 240)}`);
  }
  const executeBody = JSON.parse(executeText);
  if (!execute.ok) throw new Error(JSON.stringify(executeBody));

  const executionId = executeBody.data.executionId;
  const details = await fetch(`http://localhost:3000/api/executions/${executionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const detailsText = await details.text();
  if (!detailsText.trim().startsWith("{")) {
    throw new Error(`Expected JSON from execution API, got status ${details.status}: ${detailsText.slice(0, 240)}`);
  }
  const detailsBody = JSON.parse(detailsText);
  if (!details.ok) throw new Error(JSON.stringify(detailsBody));

  console.log(
    JSON.stringify({
      task: task.title,
      executionId,
      status: detailsBody.data.status,
      outputKeys: Object.keys(detailsBody.data.output || {}),
    })
  );
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
