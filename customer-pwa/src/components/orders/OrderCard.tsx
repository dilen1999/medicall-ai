import { Link } from "react-router-dom";
import type { Order } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Price } from "@/components/common/Price";
import { AppButton, buttonVariants } from "@/components/common/AppButton";
import { ORDER_STATUS_LABELS, getOrderStatusTone, isTerminalStatus, ACTIVE_ORDER_STATUSES } from "@/utils/orderStatus";
import { formatDate } from "@/utils/date";

interface OrderCardProps {
  order: Order;
  onReorder?: (orderId: string) => void;
}

export function OrderCard({ order, onReorder }: OrderCardProps) {
  const isActive = ACTIVE_ORDER_STATUSES.includes(order.status);
  const isPast = order.status === "delivered";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink dark:text-slate-100">{order.reference}</p>
          <p className="text-xs text-ink-muted">
            {formatDate(order.createdAt)} · {order.pharmacyName}
          </p>
        </div>
        <StatusBadge label={ORDER_STATUS_LABELS[order.status]} tone={getOrderStatusTone(order.status)} />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-ink-muted">
        <span>{order.items.length} item(s)</span>
        <Price amount={order.total} />
      </div>

      {!isTerminalStatus(order.status) && (
        <p className="mt-1 text-xs text-ink-muted">Estimated delivery: {formatDate(order.estimatedDelivery)}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/orders/${order.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          View Details
        </Link>
        {isActive && (
          <Link
            to={`/orders/${order.id}/track`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Track Order
          </Link>
        )}
        {isPast && onReorder && (
          <AppButton variant="primary" size="sm" onClick={() => onReorder(order.id)}>
            Reorder
          </AppButton>
        )}
      </div>
    </div>
  );
}
