import { useParams } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AppButton } from "@/components/common/AppButton";
import { useSupportCase, usePostSupportMessage } from "@/features/support/useSupport";
import { formatDateTime } from "@/utils/date";
import { cn } from "@/utils/cn";

export function SupportCaseDetailsPage() {
  const { caseId } = useParams();
  const { data: supportCase, isLoading, isError, refetch } = useSupportCase(caseId);
  const postMessage = usePostSupportMessage(caseId ?? "");
  const [message, setMessage] = useState("");

  if (isLoading) return <LoadingSpinner label="Loading support case" />;
  if (isError || !supportCase) {
    return <ErrorState message="We couldn't load this support case." onRetry={() => refetch()} />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    await postMessage.mutateAsync(message.trim());
    setMessage("");
  }

  return (
    <div>
      <PageHeader title={supportCase.reference} showBack />
      <div className="mb-4 flex items-center gap-2">
        <StatusBadge label={supportCase.status.replace("_", " ")} tone="info" />
        <span className="text-sm text-ink-muted capitalize">{supportCase.category.replace(/_/g, " ")}</span>
      </div>

      <div className="flex flex-col gap-3">
        {supportCase.messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
              msg.sender === "customer"
                ? "self-end bg-primary text-white"
                : msg.sender === "system"
                  ? "self-start bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                  : "self-start bg-slate-100 text-ink dark:bg-slate-800 dark:text-slate-100",
            )}
          >
            <p>{msg.message}</p>
            <p className="mt-1 text-[10px] opacity-70">{formatDateTime(msg.createdAt)}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <label htmlFor="case-message" className="sr-only">
          Add a message
        </label>
        <input
          id="case-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message"
          className="h-11 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
        <AppButton type="submit" isLoading={postMessage.isPending}>
          Send
        </AppButton>
      </form>
    </div>
  );
}
