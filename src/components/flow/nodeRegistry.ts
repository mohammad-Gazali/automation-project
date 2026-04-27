export const NODE_TYPES = [
  {
    type: "log",
    label: "Log",
    description: "Output a message to the console",
    color: "bg-blue-500",
    defaultData: { message: "Log message" },
  },
  {
    type: "color",
    label: "Color",
    description: "Set a color value",
    color: "bg-purple-500",
    defaultData: { color: "#0052ff" },
  },
  {
    type: "http",
    label: "HTTP Request",
    description: "Make an HTTP request",
    color: "bg-orange-500",
    defaultData: { url: "https://api.example.com", method: "GET" },
  },
  {
    type: "transform",
    label: "Transform",
    description: "Transform data",
    color: "bg-cyan-500",
    defaultData: { expression: "data => data" },
  },
  {
    type: "delay",
    label: "Delay",
    description: "Wait for a duration",
    color: "bg-amber-500",
    defaultData: { duration: 1000 },
  },
  {
    type: "condition",
    label: "Condition",
    description: "Branch based on a condition",
    color: "bg-rose-500",
    defaultData: { condition: "true" },
  },
] as const;

export type NodeType = (typeof NODE_TYPES)[number]["type"];
