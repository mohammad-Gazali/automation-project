import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

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
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@automation.local" },
    update: {},
    create: {
      email: "demo@automation.local",
      password: hashedPassword,
      name: "Demo User",
    },
  });

  console.log(`Created user: ${user.email}`);

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title: "Sample Workflow",
      description: "A demo workflow with log and color nodes",
      isActive: true,
      nodes: [
        {
          id: "node-1",
          type: "log",
          position: { x: 100, y: 100 },
          data: { message: "Starting workflow..." },
        },
        {
          id: "node-2",
          type: "color",
          position: { x: 300, y: 100 },
          data: { color: "#0052ff" },
        },
        {
          id: "node-3",
          type: "log",
          position: { x: 500, y: 100 },
          data: { message: "Workflow completed!" },
        },
      ] as any,
      edges: [
        { id: "e-1-2", source: "node-1", target: "node-2", animated: true },
        { id: "e-2-3", source: "node-2", target: "node-3", animated: true },
      ] as any,
    },
  });

  console.log(`Created task: ${task.title}`);

  console.log("Seeding complete!");
  console.log("\nDemo credentials:");
  console.log(`  Email: demo@automation.local`);
  console.log(`  Password: demo1234`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
