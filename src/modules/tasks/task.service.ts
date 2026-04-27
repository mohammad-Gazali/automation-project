import { prisma } from "@/lib/prisma";
import { CreateTaskInput, UpdateTaskInput } from "@/modules/tasks/task.schema";

export async function createTask(userId: string, input: CreateTaskInput) {
  return prisma.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description || null,
      nodes: input.nodes as any,
      edges: input.edges as any,
      isActive: input.isActive ?? true,
    },
  });
}

export async function getTaskById(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    include: {
      _count: {
        select: { executions: true },
      },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  return task;
}

export async function listTasks(
  userId: string,
  options?: { page?: number; limit?: number; isActive?: boolean }
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId };
  if (options?.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: {
          select: { executions: true },
        },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
  // Verify task exists and belongs to user
  await getTaskById(taskId, userId);

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.nodes !== undefined && { nodes: input.nodes as any }),
      ...(input.edges !== undefined && { edges: input.edges as any }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export async function deleteTask(taskId: string, userId: string) {
  // Verify task exists and belongs to user
  await getTaskById(taskId, userId);

  await prisma.task.delete({
    where: { id: taskId },
  });

  return { success: true };
}
