import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { createExecution, executeTaskById } from "../src/modules/executions/execution.service";

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

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title: "Condition Routing Smoke Test",
      description: "Temporary condition routing verification",
      nodes: [
        {
          id: "condition-1",
          type: "condition",
          position: { x: 0, y: 0 },
          data: { field: "status", operator: "equals", value: "ready", condition: "status equals ready" },
        },
        { id: "true-log", type: "log", position: { x: -120, y: 180 }, data: { message: "TRUE branch" } },
        { id: "false-log", type: "log", position: { x: 120, y: 180 }, data: { message: "FALSE branch" } },
      ],
      edges: [
        { id: "true-edge", source: "condition-1", target: "true-log", sourceHandle: "true", animated: true },
        { id: "false-edge", source: "condition-1", target: "false-log", sourceHandle: "false", animated: true },
      ],
    },
  });

  try {
    const trueExecution = await createExecution(task.id, user.id, { status: "ready" });
    const trueResult = await executeTaskById(task.id, trueExecution.id, user.id);

    const falseExecution = await createExecution(task.id, user.id, { status: "blocked" });
    const falseResult = await executeTaskById(task.id, falseExecution.id, user.id);

    console.log(
      JSON.stringify({
        trueKeys: Object.keys(trueResult.output),
        falseKeys: Object.keys(falseResult.output),
        trueCondition: (trueResult.output["condition-1"] as Record<string, unknown>).result,
        falseCondition: (falseResult.output["condition-1"] as Record<string, unknown>).result,
      })
    );
  } finally {
    await prisma.task.delete({ where: { id: task.id } }).catch(() => null);
  }
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
