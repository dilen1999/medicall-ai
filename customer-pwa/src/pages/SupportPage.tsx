import { Link } from "react-router-dom";
import { FilePlus, Mail, MessagesSquare, Phone, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SupportOptionCard } from "@/components/support/SupportOptionCard";
import { SupportChatPanel } from "@/features/support/SupportChatPanel";
import { faqItems } from "@/features/support/faq";
import { useSupportCases } from "@/features/support/useSupport";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { env } from "@/utils/env";
import { useAuthStore } from "@/stores/authStore";

export function SupportPage() {
  const { data: cases } = useSupportCases();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div>
      <PageHeader title="Support" subtitle="We're here to help with orders and deliveries" />

      <div className="grid gap-4 md:grid-cols-2">
        <SupportOptionCard
          icon={<FilePlus className="h-5 w-5" />}
          title="Create a support case"
          description="Report an issue with an order, refund or delivery."
          href="/support/new"
        />
        <SupportOptionCard
          icon={<Stethoscope className="h-5 w-5" />}
          title="Request pharmacist callback"
          description="For anything medicine-related, talk to a qualified pharmacist."
          href="/support/new"
        />
        <SupportOptionCard
          icon={<Phone className="h-5 w-5" />}
          title="Call support"
          description={env.supportPhone}
          href={`tel:${env.supportPhone}`}
        />
        <SupportOptionCard
          icon={<Mail className="h-5 w-5" />}
          title="Email support"
          description={env.supportEmail}
          href={`mailto:${env.supportEmail}`}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink dark:text-slate-100">
          <MessagesSquare className="h-5 w-5" /> AI Support Chat
        </h2>
        <p className="mb-3 text-sm text-ink-muted">
          Our AI assistant can help with orders and delivery. It never provides medical advice.
        </p>
        <SupportChatPanel />
      </section>

      {isAuthenticated && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink dark:text-slate-100">Your support cases</h2>
          </div>
          {!cases || cases.length === 0 ? (
            <EmptyState title="No support cases yet" />
          ) : (
            <ul className="flex flex-col gap-2">
              {cases.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/support/cases/${c.id}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink dark:text-slate-100">{c.reference}</p>
                      <p className="text-xs text-ink-muted">{c.description}</p>
                    </div>
                    <StatusBadge label={c.status.replace("_", " ")} tone="info" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-ink dark:text-slate-100">Frequently asked questions</h2>
        <div className="flex flex-col gap-2">
          {faqItems.map((item) => (
            <details key={item.question} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <summary className="cursor-pointer text-sm font-medium text-ink dark:text-slate-100">
                {item.question}
              </summary>
              <p className="mt-2 text-sm text-ink-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
