import { ApiResponse } from "@/types";

const API_BASE = "";

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  token: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    executions: number;
  };
}

interface TaskListResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AssistantResponse {
  intent: string;
  reply: string;
  executionId?: string;
  queued?: boolean;
  tasks?: Task[];
}

interface TaskCreateInput {
  title: string;
  description?: string;
  isActive?: boolean;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges?: Array<{
    id: string;
    source: string;
    target: string;
    animated?: boolean;
  }>;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
}

function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const authApi = {
  async login(data: LoginRequest) {
    const result = await fetchApi<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (result.data?.token) {
      setToken(result.data.token);
    }
    return result;
  },

  async register(data: RegisterRequest) {
    const result = await fetchApi<LoginResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (result.data?.token) {
      setToken(result.data.token);
    }
    return result;
  },

  async getMe() {
    return fetchApi<{ id: string; email: string; name: string | null; createdAt: string }>("/api/auth/me");
  },

  logout() {
    removeToken();
  },
};

export const tasksApi = {
  async list(page = 1, limit = 20) {
    return fetchApi<TaskListResponse>(`/api/tasks?page=${page}&limit=${limit}`);
  },

  async create(data: TaskCreateInput) {
    return fetchApi<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getById(id: string) {
    return fetchApi<Task>(`/api/tasks/${id}`);
  },

  async update(id: string, data: Partial<TaskCreateInput>) {
    return fetchApi<Task>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return fetchApi<null>(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  },

  async execute(id: string, input?: Record<string, unknown>) {
    return fetchApi<{ executionId: string; status: string; queued: boolean }>(`/api/tasks/${id}/execute`, {
      method: "POST",
      body: JSON.stringify({ input }),
    });
  },
};

export const assistantApi = {
  async send(message: string) {
    return fetchApi<AssistantResponse>("/api/assistant", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
};

export { getToken };
