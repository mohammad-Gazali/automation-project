export type AutomationNodeDefinition = {
  type: string;
  label: string;
  category: "Core" | "Logic" | "Data" | "Integrations" | "AI";
  description: string;
  color: string;
  accent: string;
  icon: string;
  defaultData: Record<string, unknown>;
};

export const AUTOMATION_NODES = [
  {
    type: "log",
    label: "Log",
    category: "Core",
    description: "Write a message into the execution log.",
    color: "bg-sky-500",
    accent: "#0ea5e9",
    icon: "LOG",
    defaultData: { message: "Log message" },
  },
  {
    type: "color",
    label: "Color",
    category: "Core",
    description: "Store a color value for later steps.",
    color: "bg-violet-500",
    accent: "#8b5cf6",
    icon: "CLR",
    defaultData: { color: "#0052ff" },
  },
  {
    type: "http",
    label: "HTTP Request",
    category: "Integrations",
    description: "Call an external API and return the response.",
    color: "bg-orange-500",
    accent: "#f97316",
    icon: "HTTP",
    defaultData: { url: "https://api.example.com", method: "GET", body: "" },
  },
  {
    type: "transform",
    label: "Transform",
    category: "Data",
    description: "Merge and reshape input from previous nodes.",
    color: "bg-cyan-500",
    accent: "#06b6d4",
    icon: "FX",
    defaultData: { expression: "merge input with previous output" },
  },
  {
    type: "delay",
    label: "Delay",
    category: "Core",
    description: "Pause the workflow for a fixed duration.",
    color: "bg-amber-500",
    accent: "#f59e0b",
    icon: "WAIT",
    defaultData: { duration: 1000 },
  },
  {
    type: "condition",
    label: "Condition",
    category: "Logic",
    description: "Route execution through true or false branches.",
    color: "bg-rose-500",
    accent: "#f43f5e",
    icon: "IF",
    defaultData: { field: "status", operator: "equals", value: "ready", condition: "status equals ready" },
  },
  {
    type: "set",
    label: "Set Fields",
    category: "Data",
    description: "Create structured key-value data.",
    color: "bg-emerald-500",
    accent: "#10b981",
    icon: "SET",
    defaultData: { key: "status", value: "ready" },
  },
  {
    type: "filter",
    label: "Filter",
    category: "Logic",
    description: "Pass data only when a field matches a value.",
    color: "bg-lime-500",
    accent: "#84cc16",
    icon: "FLT",
    defaultData: { field: "status", operator: "equals", value: "ready" },
  },
  {
    type: "math",
    label: "Math",
    category: "Data",
    description: "Run a numeric operation on two values.",
    color: "bg-teal-500",
    accent: "#14b8a6",
    icon: "123",
    defaultData: { operation: "add", left: 1, right: 1 },
  },
  {
    type: "merge",
    label: "Merge",
    category: "Data",
    description: "Combine input and previous node outputs.",
    color: "bg-indigo-500",
    accent: "#6366f1",
    icon: "MRG",
    defaultData: { mode: "combine" },
  },
  {
    type: "email",
    label: "Send Email",
    category: "Integrations",
    description: "Send an email through the configured SMTP account.",
    color: "bg-pink-500",
    accent: "#ec4899",
    icon: "MAIL",
    defaultData: {
      to: "team@example.com",
      subject: "Workflow update",
      body: "Hello from automation.",
      from: "",
    },
  },
  {
    type: "database",
    label: "Database Query",
    category: "Integrations",
    description: "Mock a database read or write operation.",
    color: "bg-stone-500",
    accent: "#78716c",
    icon: "DB",
    defaultData: { action: "select", table: "users", where: "active = true" },
  },
  {
    type: "webhook",
    label: "Webhook",
    category: "Integrations",
    description: "Represent an incoming workflow trigger.",
    color: "bg-red-500",
    accent: "#ef4444",
    icon: "HOOK",
    defaultData: { path: "/webhook/new-event", method: "POST" },
  },
  {
    type: "schedule",
    label: "Schedule",
    category: "Core",
    description: "Represent a planned recurring trigger.",
    color: "bg-yellow-500",
    accent: "#eab308",
    icon: "TIME",
    defaultData: { cron: "0 9 * * 1-5", timezone: "Asia/Damascus" },
  },
  {
    type: "aiPrompt",
    label: "AI Prompt",
    category: "AI",
    description: "Prepare an AI instruction from workflow data.",
    color: "bg-fuchsia-500",
    accent: "#d946ef",
    icon: "AI",
    defaultData: { prompt: "Summarize the workflow output", model: "workflow-ai" },
  },
] as const satisfies readonly AutomationNodeDefinition[];

export const NODE_CATEGORIES = ["Core", "Logic", "Data", "Integrations", "AI"] as const;

export function getNodeDefinition(type: string) {
  return AUTOMATION_NODES.find((node) => node.type === type);
}
