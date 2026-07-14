import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { useOrder, useOrderTracking } from "@/features/orders/useOrders";
import { ORDER_STATUS_LABELS, getOrderStatusTone, isTerminalStatus } from "@/utils/orderStatus";
import { formatDateTime, formatTime } from "@/utils/date";
import { toast } from "sonner";

export function OrderTrackingPage() {
  const { orderId } = useParams();
  const { data: order, isLoading: orderLoading, isError: orderError, refetch: refetchOrder } = useOrder(orderId);
  const { data: tracking, isLoading: trackingLoading } = useOrderTracking(orderId);

  if (orderLoading || trackingLoading) return <LoadingSpinner label="Loading tracking information" />;
  if (orderError || !order) return <ErrorState message="We couldn't load tracking for this order." onRetry={() => refetchOrder()} />;

  return (
    <div>
      <PageHeader title="Track Order" subtitle={order.reference} showBack />

      <div className="mb-4 flex items-center justify-between">
        <StatusBadge label={ORDER_STATUS_LABELS[order.status]} tone={getOrderStatusTone(order.status)} />
        {tracking && !isTerminalStatus(order.status) && (
          <p className="text-sm text-ink-muted">ETA {formatTime(tracking.estimatedArrival)}</p>
        )}
      </div>

      <div className="relative mb-6 flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-100 to-slate-100 dark:from-teal-950 dark:to-slate-900">
        <MapPin className="h-8 w-8 text-primary-dark" aria-hidden="true" />
        {tracking?.driverLocation && !isTerminalStatus(order.status) && (
          <motion.span
            className="absolute h-3 w-3 rounded-full bg-primary"
            animate={{ x: [0, 10, -10, 0], y: [0, -6, 6, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            style={{ left: "60%", top: "45%" }}
            aria-hidden="true"
          />
        )}
        <p className="absolute bottom-2 text-xs text-ink-muted">Live map integration coming soon</p>
      </div>

      {tracking?.driver && !isTerminalStatus(order.status) && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary-dark">
            {tracking.driver.name.charAt(0)}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink dark:text-slate-100">{tracking.driver.name}</p>
            <p className="text-xs text-ink-muted">{tracking.driver.vehicleNumber}</p>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {tracking.driver.rating.toFixed(1)}
            </div>
          </div>
          <a
            href={`tel:${tracking.driver.phoneNumber}`}
            aria-label="Call driver"
            className="rounded-full bg-primary-light p-2.5 text-primary-dark"
          >
            <Phone className="h-4 w-4" />
          </a>
          <button
            type="button"
            aria-label="Message driver"
            onClick={() => toast.info("Driver messaging is coming soon.")}
            className="rounded-full bg-primary-light p-2.5 text-primary-dark"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <p className="text-sm font-medium text-ink dark:text-slate-100">Delivery address</p>
        <p className="mt-1 text-sm text-ink-muted">
          {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city}
        </p>
        {(tracking?.deliveryInstructions ?? order.deliveryAddress.deliveryInstructions) && (
          <p className="mt-1 text-xs text-ink-muted italic">
            "{tracking?.deliveryInstructions ?? order.deliveryAddress.deliveryInstructions}"
          </p>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink dark:text-slate-100">Delivery timeline</h2>
        <OrderTimeline entries={order.timeline} />
      </section>

      {tracking && (
        <p className="mt-4 text-xs text-ink-muted">Last updated {formatDateTime(tracking.lastUpdated)}</p>
      )}
    </div>
  );
}
