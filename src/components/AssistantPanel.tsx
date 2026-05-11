"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type AssistantAction = {
  type: "run_workflow" | "explain_workflow";
  label: string;
  taskId: string;
  taskTitle: string;
  prompt: string;
};

type AssistantExecutionAction = {
  success?: boolean;
  executionId?: string;
  taskTitle?: string;
} | null;

type Message = {
  id: string;
  role: "USER" | "ASSISTANT" | "user" | "assistant";
  content: string;
  createdAt?: string;
  metadata?: {
    model?: string;
    provider?: string;
    suggestedActions?: AssistantAction[];
    action?: AssistantExecutionAction;
  } | null;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  lastMessage?: Message | null;
};

type AssistantPostResponse = {
  conversationId: string;
  messageId: string;
  reply: string;
  model: string;
  provider: string;
  suggestedActions?: AssistantAction[];
  action?: AssistantExecutionAction;
};

const SUGGESTIONS = [
  "حلل فلوهاتي واقترح تحسينات",
  "اشرح آخر التنفيذات الموجودة",
  "أي فلو مناسب أبدأ بتشغيله؟",
];

export default function AssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"conversations" | "chat">("conversations");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === conversationId),
    [conversations, conversationId]
  );

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.title} ${conversation.lastMessage?.content || ""}`.toLowerCase().includes(term)
    );
  }, [conversations, search]);

  useEffect(() => {
    loadConversations(false);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, view]);

  async function loadConversations(selectFirst = false) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await assistantFetch<{ conversations: Conversation[] }>("/api/assistant");
      const list = response.data?.conversations || [];
      setConversations(list);
      if (selectFirst && list.length > 0) {
        await openConversation(list[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }

  async function openConversation(id: string) {
    setConversationId(id);
    setView("chat");
    setError(null);
    setIsLoadingMessages(true);
    try {
      const response = await assistantFetch<{ messages: Message[] }>(`/api/assistant?conversationId=${id}`);
      setMessages(response.data?.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setIsLoadingMessages(false);
    }
  }

  function openWidget() {
    setIsOpen(true);
    setView(conversationId || messages.length > 0 ? "chat" : "conversations");
  }

  function closeWidget() {
    setIsOpen(false);
  }

  function startNewConversation() {
    setConversationId(null);
    setError(null);
    setView("chat");
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "جاهز. أستطيع قراءة الفلوهات، التنفيذات، والعقد، ثم أعطيك شرحا أو أشغل فلو محفوظ عند الطلب.",
        metadata: {
          suggestedActions: SUGGESTIONS.map((suggestion, index) => ({
            type: "explain_workflow",
            label: suggestion,
            taskId: `suggestion-${index}`,
            taskTitle: suggestion,
            prompt: suggestion,
          })),
        },
      },
    ]);
  }

  async function sendMessage(text = input) {
    const message = text.trim();
    if (!message || isSending) return;

    setInput("");
    setIsSending(true);
    setError(null);
    setMessages((prev) => [
      ...prev.filter((item) => item.id !== "welcome"),
      { id: `local-${Date.now()}`, role: "USER", content: message, createdAt: new Date().toISOString() },
    ]);

    try {
      const response = await assistantFetch<AssistantPostResponse>("/api/assistant", {
        method: "POST",
        body: JSON.stringify({ message, conversationId }),
      });
      const data = response.data;
      if (!data) throw new Error("Assistant returned no data");

      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: data.messageId,
          role: "ASSISTANT",
          content: data.reply,
          createdAt: new Date().toISOString(),
          metadata: {
            model: data.model,
            provider: data.provider,
            action: data.action,
            suggestedActions: data.suggestedActions,
          },
        },
      ]);
      await loadConversations(false);
    } catch (err) {
      const content = err instanceof Error ? err.message : "حدث خطأ أثناء المحادثة.";
      setError(content);
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: "ASSISTANT", content }]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/10 backdrop-blur-[2px] sm:hidden" onClick={closeWidget} />
      )}

      <div
        className={`fixed z-50 transition-all duration-300 ease-out ${
          isOpen
            ? "bottom-4 left-3 right-3 sm:bottom-24 sm:left-auto sm:right-6 sm:w-[390px] md:w-[430px]"
            : "bottom-5 right-5"
        }`}
      >
        {isOpen ? (
          <section className="flex max-h-[calc(100vh-2rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)] ring-1 ring-white/70 sm:h-[660px] sm:max-h-[calc(100vh-7rem)]">
            {view === "conversations" ? (
              <ConversationList
                conversations={filteredConversations}
                search={search}
                isLoading={isLoading}
                error={error}
                onSearch={setSearch}
                onClose={closeWidget}
                onRefresh={() => loadConversations(false)}
                onCreate={startNewConversation}
                onOpen={openConversation}
              />
            ) : (
              <ChatWindow
                activeConversation={activeConversation}
                messages={messages}
                input={input}
                error={error}
                isSending={isSending}
                isLoadingMessages={isLoadingMessages}
                onInput={setInput}
                onBack={() => setView("conversations")}
                onClose={closeWidget}
                onCreate={startNewConversation}
                onSend={sendMessage}
                scrollRef={scrollRef}
              />
            )}
          </section>
        ) : (
          <button
            type="button"
            onClick={openWidget}
            className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.30)] ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200"
            aria-label="Open AI assistant"
          >
            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
            <svg className="h-6 w-6 transition group-hover:scale-105" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 9.5h10M7 13h6m-8.5 6 2.2-3.1H18a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v5.9a3 3 0 0 0 3 3h.2L4.5 19Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}

function ConversationList({
  conversations,
  search,
  isLoading,
  error,
  onSearch,
  onClose,
  onRefresh,
  onCreate,
  onOpen,
}: {
  conversations: Conversation[];
  search: string;
  isLoading: boolean;
  error: string | null;
  onSearch: (value: string) => void;
  onClose: () => void;
  onRefresh: () => void;
  onCreate: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">AI Assistant</div>
            <h2 className="mt-1 text-lg font-bold text-slate-950">Conversations</h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Close assistant">
            <CloseIcon />
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search conversations..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>
          <button type="button" onClick={onRefresh} className="icon-button" aria-label="Refresh conversations">
            <RefreshIcon />
          </button>
        </div>
      </header>

      <main className="premium-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3">
        {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <SparkIcon />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-950">No conversations yet</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">Start a focused chat that can read workflows, executions, and project data.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onOpen(conversation.id)}
                className="group w-full rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-[11px] font-black text-white">
                    AI
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-bold text-slate-950">{conversation.title}</h3>
                      <span className="shrink-0 text-[10px] text-slate-400">{formatRelative(conversation.updatedAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {cleanAssistantContent(conversation.lastMessage?.content || "New conversation")}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white p-3">
        <button
          type="button"
          onClick={onCreate}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
        >
          <PlusIcon />
          Create new conversation
        </button>
      </footer>
    </>
  );
}

function ChatWindow({
  activeConversation,
  messages,
  input,
  error,
  isSending,
  isLoadingMessages,
  onInput,
  onBack,
  onClose,
  onCreate,
  onSend,
  scrollRef,
}: {
  activeConversation?: Conversation;
  messages: Message[];
  input: string;
  error: string | null;
  isSending: boolean;
  isLoadingMessages: boolean;
  onInput: (value: string) => void;
  onBack: () => void;
  onClose: () => void;
  onCreate: () => void;
  onSend: (prompt?: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white px-3 py-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="icon-button" aria-label="Back to conversations">
            <BackIcon />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold text-slate-950">{activeConversation?.title || "New assistant chat"}</h2>
            <p className="truncate text-[11px] text-slate-500">Project context, DB awareness, and workflow actions</p>
          </div>
          <button type="button" onClick={onCreate} className="icon-button" aria-label="New conversation">
            <PlusIcon />
          </button>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Close assistant">
            <CloseIcon />
          </button>
        </div>
      </header>

      <main className="premium-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_50%,#f8fafc_100%)] p-3">
        {isLoadingMessages ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className={`h-16 animate-pulse rounded-2xl bg-white ${item === 2 ? "ml-auto w-3/4" : "w-5/6"}`} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyChat onPrompt={onSend} />
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} onAction={onSend} />)
        )}
        {isSending && <ThinkingBubble />}
        <div ref={scrollRef} />
      </main>

      <footer className="border-t border-slate-200 bg-white p-3">
        {error && <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSend(suggestion)}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50"
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
        >
          <textarea
            value={input}
            onChange={(event) => onInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            rows={1}
            placeholder="Ask about a workflow or request an action..."
            className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-blue-600 px-3 text-white transition hover:bg-blue-700 disabled:bg-slate-300"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </form>
      </footer>
    </>
  );
}

function EmptyChat({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-3 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-200">
        AI
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-950">Ask your automation workspace</h3>
      <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
        The assistant can inspect saved flows, recent executions, nodes, and DB snapshots.
      </p>
      <div className="mt-5 grid w-full gap-2">
        {SUGGESTIONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPrompt(item)}
            className="rounded-xl border border-slate-200 bg-white p-3 text-left text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="mr-auto flex max-w-[82%] items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
      Thinking with project context...
    </div>
  );
}

function MessageBubble({ message, onAction }: { message: Message; onAction: (prompt: string) => void }) {
  const isUser = message.role === "USER" || message.role === "user";
  const actions = !isUser ? message.metadata?.suggestedActions || [] : [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[86%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
            isUser
              ? "rounded-br-md bg-blue-600 text-white"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
          }`}
        >
          {cleanAssistantContent(message.content)}
        </div>

        {!isUser && message.metadata?.model && (
          <div className="mt-1 px-1 text-[10px] text-slate-400">
            {message.metadata.provider} / {message.metadata.model}
            {message.metadata.action?.executionId ? ` - execution ${message.metadata.action.executionId.slice(0, 8)}` : ""}
          </div>
        )}

        {actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {actions.slice(0, 5).map((action) => (
              <button
                key={`${action.type}-${action.taskId}-${action.label}`}
                type="button"
                onClick={() => onAction(action.prompt)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                  action.type === "run_workflow"
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelative(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "now";
  if (diff < hour) return `${Math.floor(diff / minute)}m`;
  if (diff < day) return `${Math.floor(diff / hour)}h`;
  return `${Math.floor(diff / day)}d`;
}

function cleanAssistantContent(value: string) {
  const text = String(value || "").trim();
  if (!text) return "";

  if (looksLikeJson(text)) {
    try {
      const parsed = parseMaybeNestedJson(text) as { reply?: unknown };
      if (parsed && typeof parsed === "object" && "reply" in parsed) {
        return cleanAssistantContent(String(parsed.reply || ""));
      }
    } catch {
      const extracted = extractReplyField(text);
      if (extracted) return extracted;
    }
  }

  return text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function parseMaybeNestedJson(value: string): unknown {
  const parsed = JSON.parse(value);
  if (typeof parsed === "string" && looksLikeJson(parsed)) {
    return JSON.parse(parsed);
  }
  return parsed;
}

function looksLikeJson(value: string) {
  const text = value.trim();
  return (text.startsWith("{") && text.endsWith("}")) || (text.startsWith('"') && text.endsWith('"'));
}

function extractReplyField(value: string) {
  const match = value.match(/"reply"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"action"|,\s*"[^"]+"\s*:|}\s*$)/);
  if (!match?.[1]) return "";
  return match[1]
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .trim();
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12 14-7-4 14-3-6-7-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 0 1-13.7 5.6M4 12A8 8 0 0 1 17.7 6.4M17 3v4h-4M7 21v-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8L18 16Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m20 20-4.2-4.2M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

async function assistantFetch<T>(url: string, options: RequestInit = {}): Promise<{ data?: T; error?: string }> {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}
