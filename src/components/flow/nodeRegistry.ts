import { AUTOMATION_NODES } from "@/lib/automationCatalog";

export const NODE_TYPES = AUTOMATION_NODES;

export type NodeType = (typeof NODE_TYPES)[number]["type"];
