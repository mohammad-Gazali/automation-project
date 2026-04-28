import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { executeTaskById } from "@/modules/executions/execution.service";

const REDIS_URL = process.env.REDIS_URL;

let queue: Queue | null = null;
let worker: Worker | null = null;

// Initialize queue with Redis if available, otherwise use null (in-memory fallback)
export async function initQueue() {
  if (!REDIS_URL) {
    console.log("[Queue] Redis not configured, using in-memory execution mode");
    return null;
  }

  try {
    const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

    queue = new Queue("task-executions", { connection });

    worker = new Worker(
      "task-executions",
      async (job: Job<{ taskId: string; executionId: string; userId: string }>) => {
        console.log(`[Queue] Processing job ${job.id}: task=${job.data.taskId}`);
        await executeTaskById(job.data.taskId, job.data.executionId, job.data.userId);
      },
      {
        connection,
        concurrency: 5,
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400 },
      }
    );

    worker.on("completed", (job) => {
      console.log(`[Queue] Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[Queue] Job ${job?.id} failed:`, err.message);
    });

    console.log("[Queue] BullMQ initialized with Redis");
    return { queue, worker };
  } catch (error) {
    console.error("[Queue] Failed to initialize BullMQ, falling back to in-memory:", error);
    return null;
  }
}

// Add a task to the execution queue
export async function enqueueTaskExecution(taskId: string, executionId: string, userId: string) {
  if (queue) {
    await queue.add("execute-task", { taskId, executionId, userId }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
    });
    return { queued: true };
  }

  // Fallback: execute synchronously if no queue
  console.log(`[Queue] No Redis queue, executing task ${taskId} synchronously`);
  await executeTaskById(taskId, executionId, userId);
  return { queued: false };
}

export function getQueue() {
  return queue;
}

export function getWorker() {
  return worker;
}

// Graceful shutdown
export async function closeQueue() {
  await worker?.close();
  await queue?.close();
}
