import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { OrderCard } from "@/components/orders/OrderCard";
import { useOrders } from "@/features/orders/useOrders";
import { useReorderToCart } from "@/features/orders/useReorderToCart";
import { getOrderTab } from "@/utils/orderStatus";
import type { OrderTab } from "@/types";
import { cn } from "@/utils/cn";

const tabs: { value: OrderTab; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrderListPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>("active");
  const [search, setSearch] = useState("");
  const { data: orders, isLoading, isError, refetch } = useOrders();
  const { reorderToCart } = useReorderToCart();

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order) => {
      if (getOrderTab(order) !== activeTab) return false;
      if (search && !order.reference.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [orders, activeTab, search]);

  return (
    <div>
      <PageHeader title="My Orders" />
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by order reference"
        showVoiceIcon={false}
        className="mb-4"
      />

      <div role="tablist" className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium",
              activeTab === tab.value ? "bg-primary text-white" : "bg-slate-100 text-ink-muted dark:bg-slate-800",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <ErrorState message="We couldn't load your orders." onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No orders here" description="Orders matching this filter will appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onReorder={reorderToCart} />
          ))}
        </div>
      )}
    </div>
  );
}
