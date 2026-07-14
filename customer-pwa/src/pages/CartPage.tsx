import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { AppButton } from "@/components/common/AppButton";
import { AppInput } from "@/components/common/AppInput";
import { Price } from "@/components/common/Price";
import { QuantitySelector } from "@/components/cart/QuantitySelector";
import { ProductImagePlaceholder } from "@/components/products/ProductImagePlaceholder";
import { PrescriptionRequiredBadge } from "@/components/prescription/PrescriptionBadge";
import { useCartStore } from "@/stores/cartStore";
import { useCartValidation } from "@/features/cart/useCartValidation";
import { useCheckoutPreview } from "@/features/cart/useCheckoutPreview";

export function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, increment, decrement, promotionCode, setPromotionCode } = useCartStore();
  const [promoInput, setPromoInput] = useState(promotionCode ?? "");
  const { data: validation } = useCartValidation(items);
  const { data: preview, isLoading: previewLoading } = useCheckoutPreview(items, "standard", promotionCode);

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Cart" />
        <EmptyState
          title="Your cart is empty"
          description="Browse products to add items to your cart."
          action={
            <Link to="/products">
              <AppButton>Browse Products</AppButton>
            </Link>
          }
        />
      </div>
    );
  }

  const canCheckout = Boolean(validation?.valid);

  return (
    <div>
      <PageHeader title="Cart" />

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <ProductImagePlaceholder imageKey={item.image} className="h-20 w-20 shrink-0" />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink dark:text-slate-100">{item.name}</p>
                  <p className="text-xs text-ink-muted">
                    {item.pharmacyName} · {item.packSize}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name} from cart`}
                  className="rounded-full p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {item.prescriptionRequired && (
                <div className="mt-1">
                  {item.prescriptionId ? (
                    <span className="text-xs text-success">Linked to an approved prescription</span>
                  ) : (
                    <PrescriptionRequiredBadge />
                  )}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <QuantitySelector
                  quantity={item.quantity}
                  max={item.stockQuantity}
                  onIncrement={() => increment(item.id)}
                  onDecrement={() => decrement(item.id)}
                  label={item.name}
                />
                <Price amount={item.price * item.quantity} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {validation && !validation.valid && (
        <div role="alert" className="mt-4 rounded-2xl border border-danger/30 bg-red-50 p-3 text-sm text-danger dark:bg-red-950/30">
          <ul className="list-inside list-disc">
            {validation.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <AppInput
          placeholder="Promotion code"
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value)}
          className="flex-1"
        />
        <AppButton variant="outline" onClick={() => setPromotionCode(promoInput || undefined)}>
          Apply
        </AppButton>
      </div>
      {preview?.promotionError && <p className="mt-1 text-xs text-danger">{preview.promotionError}</p>}
      {preview?.promotionApplied && (
        <p className="mt-1 text-xs text-success">Promotion {preview.promotionApplied} applied</p>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-ink dark:text-slate-100">Price summary</h2>
        {previewLoading || !preview ? (
          <p className="text-sm text-ink-muted">Calculating...</p>
        ) : (
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Subtotal" value={preview.subtotal} />
            <Row label="Delivery fee (estimate)" value={preview.deliveryFee} />
            <Row label="Service fee" value={preview.serviceFee} />
            {preview.discount > 0 && <Row label="Discount" value={-preview.discount} />}
            <Row label="Tax" value={preview.tax} />
            <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-ink dark:border-slate-700 dark:text-slate-100">
              <span>Total (estimate)</span>
              <Price amount={preview.total} />
            </div>
          </dl>
        )}
        <p className="mt-2 text-xs text-ink-muted">
          Delivery fee will be finalised at checkout based on your delivery method.
        </p>
      </div>

      <AppButton className="mt-4" fullWidth disabled={!canCheckout} onClick={() => navigate("/checkout")}>
        Proceed to Checkout ({items.length} item{items.length > 1 ? "s" : ""})
      </AppButton>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-ink-muted">
      <dt>{label}</dt>
      <dd>
        <Price amount={value} />
      </dd>
    </div>
  );
}
