import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Printer } from "lucide-react";
import { useOrder } from "@/features/orders/useOrders";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { AppButton } from "@/components/common/AppButton";
import { Price } from "@/components/common/Price";
import { formatDateTime } from "@/utils/date";

export function OrderSuccessPage() {
  const { orderId } = useParams();
  const { data: order, isLoading, isError, refetch } = useOrder(orderId);

  if (isLoading) return <LoadingSpinner label="Loading order" />;
  if (isError || !order) return <ErrorState message="We couldn't load this order." onRetry={() => refetch()} />;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <CheckCircle2 className="h-16 w-16 text-success" aria-hidden="true" />
      </motion.div>
      <h1 className="text-xl font-semibold text-ink dark:text-slate-100">Order placed successfully!</h1>
      <p className="text-sm text-ink-muted">Your order has been received and is being processed.</p>

      <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left dark:border-slate-700 dark:bg-slate-900 print:border-black">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">Order reference</p>
          <p className="font-semibold text-ink dark:text-slate-100">{order.reference}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-ink-muted">Order date</p>
          <p className="text-sm text-ink dark:text-slate-100">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-ink-muted">Pharmacy</p>
          <p className="text-sm text-ink dark:text-slate-100">{order.pharmacyName}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-ink-muted">Delivery address</p>
          <p className="text-sm text-ink dark:text-slate-100">
            {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-ink-muted">Estimated delivery</p>
          <p className="text-sm text-ink dark:text-slate-100">{formatDateTime(order.estimatedDelivery)}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-ink-muted">Payment status</p>
          <p className="text-sm capitalize text-ink dark:text-slate-100">{order.paymentStatus}</p>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className="font-medium text-ink dark:text-slate-100">Order total</p>
          <Price amount={order.total} />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 no-print">
        <Link to={`/orders/${order.id}/track`}>
          <AppButton>Track Order</AppButton>
        </Link>
        <Link to={`/orders/${order.id}`}>
          <AppButton variant="outline">View Order Details</AppButton>
        </Link>
        <Link to="/products">
          <AppButton variant="ghost">Continue Shopping</AppButton>
        </Link>
        <AppButton variant="ghost" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print Receipt
        </AppButton>
      </div>
    </div>
  );
}
