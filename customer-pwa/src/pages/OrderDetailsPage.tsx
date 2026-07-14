import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Price } from "@/components/common/Price";
import { AppButton } from "@/components/common/AppButton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { PrescriptionRequiredBadge } from "@/components/prescription/PrescriptionBadge";
import { useCancelOrder, useOrder } from "@/features/orders/useOrders";
import { useReorderToCart } from "@/features/orders/useReorderToCart";
import { ORDER_STATUS_LABELS, getOrderStatusTone } from "@/utils/orderStatus";
import { formatDateTime } from "@/utils/date";

export function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, isError, refetch } = useOrder(orderId);
  const cancelOrder = useCancelOrder();
  const { reorderToCart } = useReorderToCart();
  const [isCancelOpen, setCancelOpen] = useState(false);

  if (isLoading) return <LoadingSpinner label="Loading order" />;
  if (isError || !order) return <ErrorState message="We couldn't load this order." onRetry={() => refetch()} />;

  async function handleCancel() {
    if (!order) return;
    try {
      await cancelOrder.mutateAsync(order.id);
      toast.success("Order cancelled.");
      setCancelOpen(false);
    } catch {
      toast.error("This order could not be cancelled.");
    }
  }

  return (
    <div>
      <PageHeader title={order.reference} subtitle={formatDateTime(order.createdAt)} showBack />

      <div className="mb-4 flex items-center gap-2">
        <StatusBadge label={ORDER_STATUS_LABELS[order.status]} tone={getOrderStatusTone(order.status)} />
        <span className="text-sm text-ink-muted">{order.pharmacyName}</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink dark:text-slate-100">Order timeline</h2>
          <OrderTimeline entries={order.timeline} />
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <h2 className="mb-2 text-sm font-semibold text-ink dark:text-slate-100">Items</h2>
            <ul className="flex flex-col gap-2">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm text-ink-muted">
                  <span>
                    {item.name} x{item.quantity} {item.prescriptionRequired && <PrescriptionRequiredBadge />}
                  </span>
                  <Price amount={item.price * item.quantity} />
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <h2 className="mb-2 text-sm font-semibold text-ink dark:text-slate-100">Price breakdown</h2>
            <dl className="flex flex-col gap-1 text-sm text-ink-muted">
              <Row label="Subtotal" value={order.subtotal} />
              <Row label="Delivery fee" value={order.deliveryFee} />
              <Row label="Service fee" value={order.serviceFee} />
              {order.discount > 0 && <Row label="Discount" value={-order.discount} />}
              <Row label="Tax" value={order.tax} />
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-ink dark:border-slate-700 dark:text-slate-100">
                <span>Total</span>
                <Price amount={order.total} />
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <h2 className="mb-2 text-sm font-semibold text-ink dark:text-slate-100">Delivery & payment</h2>
            <p className="text-sm text-ink-muted">
              {order.deliveryAddress.recipientName}, {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city}
            </p>
            <p className="mt-1 text-sm text-ink-muted">Delivery method: {order.deliveryMethod.replace("_", " ")}</p>
            <p className="mt-1 text-sm text-ink-muted">Slot: {order.deliveryTimeSlot}</p>
            <p className="mt-1 text-sm text-ink-muted">
              Payment: {order.paymentMethod.replace(/_/g, " ")} · <span className="capitalize">{order.paymentStatus}</span>
            </p>
          </section>

          <div className="flex flex-wrap gap-2">
            <AppButton variant="outline" onClick={() => navigate(`/support/new?orderId=${order.id}`)}>
              Report an Issue
            </AppButton>
            <Link to="/support">
              <AppButton variant="ghost">Contact Support</AppButton>
            </Link>
            {order.cancellable && (
              <AppButton variant="danger" onClick={() => setCancelOpen(true)}>
                Cancel Order
              </AppButton>
            )}
            {order.status === "delivered" && (
              <AppButton onClick={() => reorderToCart(order.id)}>Reorder</AppButton>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isCancelOpen}
        title="Cancel this order?"
        message="This action cannot be undone. Any payment made will be refunded according to our refund policy."
        confirmLabel="Cancel Order"
        isDestructive
        isLoading={cancelOrder.isPending}
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd>
        <Price amount={value} />
      </dd>
    </div>
  );
}
