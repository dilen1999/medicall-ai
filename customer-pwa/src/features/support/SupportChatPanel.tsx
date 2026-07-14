import { useRef, useState, type FormEvent } from "react";
import { Send, ShieldAlert } from "lucide-react";
import type { ChatMessage } from "@/types";
import { useSendChatMessage } from "./useSupport";
import { AppButton } from "@/components/common/AppButton";
import { cn } from "@/utils/cn";

const welcomeMessage: ChatMessage = {
  id: "welcome",
  sender: "assistant",
  message:
    "Hi! I can help with order status, delivery issues, refunds, replacements and pharmacy hours. I can't provide medical advice - for medicine questions I'll connect you with a pharmacist.",
  createdAt: new Date().toISOString(),
};

export function SupportChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const sendMessage = useSendChatMessage();
  const listRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "customer",
      message: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const reply = await sendMessage.mutateAsync(text);
    setMessages((prev) => [...prev, reply]);
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }));
  }

  return (
    <div className="flex h-[28rem] flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.sender === "customer" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                message.sender === "customer"
                  ? "bg-primary text-white"
                  : message.isEscalation
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                    : "bg-slate-100 text-ink dark:bg-slate-800 dark:text-slate-100",
              )}
            >
              {message.isEscalation && <ShieldAlert className="mb-1 h-4 w-4" aria-hidden="true" />}
              {message.message}
            </div>
          </div>
        ))}
        {sendMessage.isPending && <p className="text-xs text-ink-muted">MediCall Assistant is typing...</p>}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
        <label htmlFor="chat-input" className="sr-only">
          Message MediCall assistant
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your order, delivery or refunds"
          className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <AppButton type="submit" size="sm" aria-label="Send message" isLoading={sendMessage.isPending}>
          <Send className="h-4 w-4" />
        </AppButton>
      </form>
    </div>
  );
}
