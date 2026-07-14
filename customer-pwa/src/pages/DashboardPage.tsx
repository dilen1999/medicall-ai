import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FileUp, Headset, MapPin, RotateCcw, Truck } from "lucide-react";
import { SearchBar } from "@/components/common/SearchBar";
import { CategoryCard } from "@/components/products/CategoryCard";
import { ProductCard } from "@/components/products/ProductCard";
import { OrderCard } from "@/components/orders/OrderCard";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AppButton } from "@/components/common/AppButton";
import { useAuthStore } from "@/stores/authStore";
import { useAddresses } from "@/features/profile/useAddresses";
import { useUiStore } from "@/stores/uiStore";
import { useOrders } from "@/features/orders/useOrders";
import { useReorderToCart } from "@/features/orders/useReorderToCart";
import { useCategories, useProducts } from "@/features/products/useProducts";
import { ACTIVE_ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE, getOrderStatusTone } from "@/utils/orderStatus";
import { formatDate } from "@/utils/date";

export function DashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const user = useAuthStore((state) => state.user);
  const { data: addresses } = useAddresses();
  const activeAddressId = useUiStore((state) => state.activeAddressId);
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: categoriesData } = useCategories();
  const { data: recommended } = useProducts({ prescriptionRequired: false, pageSize: 4 });
  const { data: frequentlyOrdered } = useProducts({ page: 1, pageSize: 4, sortBy: "rating", sortDirection: "desc" });
  const { reorderToCart } = useReorderToCart();

  const defaultAddress = addresses?.find((a) => a.id === activeAddressId) ?? addresses?.find((a) => a.isDefault);
  const activeOrder = orders?.find((o) => ACTIVE_ORDER_STATUSES.includes(o.status));
  const recentOrders = orders?.slice(0, 3) ?? [];
  const progressRatio = activeOrder
    ? (ORDER_STATUS_SEQUENCE.indexOf(activeOrder.status) + 1) / ORDER_STATUS_SEQUENCE.length
    : 0;

  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink dark:text-slate-100">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {defaultAddress ? `${defaultAddress.addressLine1}, ${defaultAddress.city}` : "Add a delivery address"}
        </p>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        onSubmit={() => navigate(`/products?search=${encodeURIComponent(search)}`)}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction icon={FileUp} label="Upload Prescription" to="/prescriptions/upload" />
        <QuickAction icon={Truck} label="Track Order" to={activeOrder ? `/orders/${activeOrder.id}/track` : "/orders"} />
        <QuickAction
          icon={RotateCcw}
          label="Reorder"
          onClick={() => recentOrders[0] && reorderToCart(recentOrders[0].id)}
        />
        <QuickAction icon={Headset} label="Contact Support" to="/support" />
      </div>

      {activeOrder && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink dark:text-slate-100">Active order · {activeOrder.reference}</p>
            <StatusBadge label={ORDER_STATUS_LABELS[activeOrder.status]} tone={getOrderStatusTone(activeOrder.status)} />
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.round(progressRatio * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Estimated delivery: {formatDate(activeOrder.estimatedDelivery)}
          </p>
          <Link to={`/orders/${activeOrder.id}/track`} className="mt-3 inline-block">
            <AppButton size="sm">Track Order</AppButton>
          </Link>
        </div>
      )}

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-3 text-base font-semibold text-ink dark:text-slate-100">
          Shop by category
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {categoriesData?.map((category) => <CategoryCard key={category.id} category={category} />)}
        </div>
      </section>

      <section aria-labelledby="frequent-heading">
        <h2 id="frequent-heading" className="mb-3 text-base font-semibold text-ink dark:text-slate-100">
          Frequently ordered
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {frequentlyOrdered?.items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section aria-labelledby="recommended-heading">
        <h2 id="recommended-heading" className="mb-3 text-base font-semibold text-ink dark:text-slate-100">
          Recommended for you
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {recommended?.items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section aria-labelledby="recent-orders-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-orders-heading" className="text-base font-semibold text-ink dark:text-slate-100">
            Recent orders
          </h2>
          <Link to="/orders" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {ordersLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : recentOrders.length === 0 ? (
          <EmptyState title="No orders yet" description="Your recent orders will appear here." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} onReorder={reorderToCart} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold text-ink dark:text-slate-100">
          Need help with a medicine-related question?
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Our AI assistant cannot give medical advice. Request a pharmacist callback instead.
        </p>
        <Link to="/support/new" className="mt-3 inline-block">
          <AppButton size="sm" variant="secondary">
            Request a pharmacist callback
          </AppButton>
        </Link>
      </section>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  to,
  onClick,
}: {
  icon: typeof FileUp;
  label: string;
  to?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      <span className="text-xs font-medium text-ink dark:text-slate-100">{label}</span>
    </>
  );
  const className =
    "flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-card dark:border-slate-700 dark:bg-slate-900";

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
