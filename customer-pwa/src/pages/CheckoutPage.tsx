import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { AppButton } from "@/components/common/AppButton";
import { AppSelect } from "@/components/common/AppSelect";
import { Price } from "@/components/common/Price";
import { AddressCard } from "@/components/addresses/AddressCard";
import { PrescriptionRequiredBadge } from "@/components/prescription/PrescriptionBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAddresses } from "@/features/profile/useAddresses";
import { useCartStore } from "@/stores/cartStore";
import { useCheckoutPreview } from "@/features/cart/useCheckoutPreview";
import { useCreateOrder } from "@/features/orders/useOrders";
import type { Address, DeliveryMethod, PaymentMethod } from "@/types";
import { cn } from "@/utils/cn";

const steps = ["Address", "Delivery", "Schedule", "Payment", "Review"] as const;

const deliveryOptions: { value: DeliveryMethod; label: string; description: string }[] = [
  { value: "standard", label: "Standard Delivery", description: "Within 3-5 hours - Rs. 350" },
  { value: "express", label: "Express Delivery", description: "Within 90 minutes - Rs. 550" },
  { value: "scheduled", label: "Scheduled Delivery", description: "Choose a time slot - Rs. 300" },
  { value: "pharmacy_collection", label: "Pharmacy Collection", description: "Collect in person - Free" },
];

const timeSlots = [
  "Today, as soon as possible",
  "Today, 2:00 PM - 5:00 PM",
  "Today, 5:00 PM - 8:00 PM",
  "Tomorrow, 9:00 AM - 11:00 AM",
  "Tomorrow, 2:00 PM - 5:00 PM",
];

const paymentOptions: { value: PaymentMethod; label: string; description: string }[] = [
  { value: "cash_on_delivery", label: "Cash on Delivery", description: "Pay in cash when your order arrives." },
  { value: "card", label: "Card Payment", description: "Placeholder only - no card details are collected here." },
  { value: "online_payment", label: "Online Payment", description: "Placeholder only - redirect flow not implemented." },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, promotionCode, clear } = useCartStore();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState<string | undefined>();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("standard");
  const [timeSlot, setTimeSlot] = useState(timeSlots[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedAddress: Address | undefined =
    addresses?.find((a) => a.id === addressId) ?? addresses?.find((a) => a.isDefault) ?? addresses?.[0];

  const { data: preview } = useCheckoutPreview(items, deliveryMethod, promotionCode);
  const createOrder = useCreateOrder();

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Checkout" showBack />
        <EmptyState title="Your cart is empty" description="Add items to your cart before checking out." />
      </div>
    );
  }

  async function handlePlaceOrder() {
    if (!selectedAddress) return;
    setSubmitError(null);
    try {
      const order = await createOrder.mutateAsync({
        items,
        address: selectedAddress,
        deliveryMethod,
        deliveryTimeSlot: deliveryMethod === "scheduled" ? timeSlot : deliveryOptions.find((d) => d.value === deliveryMethod)?.label ?? timeSlot,
        paymentMethod,
        promotionCode,
      });
      clear();
      toast.success("Order placed successfully!");
      navigate(`/order-success/${order.id}`, { replace: true });
    } catch (error) {
      setSubmitError((error as { message?: string }).message ?? "We couldn't place your order. Please try again.");
    }
  }

  return (
    <div>
      <PageHeader title="Checkout" showBack />

      <ol className="mb-6 flex flex-wrap gap-2 text-xs">
        {steps.map((label, index) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1",
              index === step
                ? "bg-primary text-white"
                : index < step
                  ? "bg-primary-light text-primary-dark"
                  : "bg-slate-100 text-ink-muted dark:bg-slate-800",
            )}
          >
            {index < step && <Check className="h-3 w-3" />} {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink dark:text-slate-100">Choose delivery address</h2>
          {addressesLoading ? (
            <LoadingSpinner label="Loading addresses" />
          ) : !addresses || addresses.length === 0 ? (
            <EmptyState title="No saved addresses" description="Add an address to continue." />
          ) : (
            addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                isSelected={selectedAddress?.id === address.id}
                onSelect={(a) => setAddressId(a.id)}
              />
            ))
          )}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink dark:text-slate-100">Choose delivery method</h2>
          {deliveryOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-4",
                deliveryMethod === option.value ? "border-primary ring-2 ring-primary/20" : "border-slate-200 dark:border-slate-700",
              )}
            >
              <input
                type="radio"
                name="deliveryMethod"
                className="mt-1"
                checked={deliveryMethod === option.value}
                onChange={() => setDeliveryMethod(option.value)}
              />
              <span>
                <span className="block text-sm font-medium text-ink dark:text-slate-100">{option.label}</span>
                <span className="block text-xs text-ink-muted">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink dark:text-slate-100">Choose delivery time</h2>
          {deliveryMethod === "pharmacy_collection" ? (
            <p className="text-sm text-ink-muted">You'll collect this order in person - no delivery time needed.</p>
          ) : (
            <AppSelect
              label="Delivery time slot"
              options={timeSlots.map((slot) => ({ label: slot, value: slot }))}
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
            />
          )}
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink dark:text-slate-100">Choose payment method</h2>
          {paymentOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-4",
                paymentMethod === option.value ? "border-primary ring-2 ring-primary/20" : "border-slate-200 dark:border-slate-700",
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                className="mt-1"
                checked={paymentMethod === option.value}
                onChange={() => setPaymentMethod(option.value)}
              />
              <span>
                <span className="block text-sm font-medium text-ink dark:text-slate-100">{option.label}</span>
                <span className="block text-xs text-ink-muted">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-ink dark:text-slate-100">Review your order</h2>

          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="mb-2 text-sm font-medium text-ink dark:text-slate-100">Items</p>
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm text-ink-muted">
                  <span>
                    {item.name} x{item.quantity} {item.prescriptionRequired && <PrescriptionRequiredBadge />}
                  </span>
                  <Price amount={item.price * item.quantity} />
                </li>
              ))}
            </ul>
          </div>

          {selectedAddress && (
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="mb-1 text-sm font-medium text-ink dark:text-slate-100">Delivery address</p>
              <p className="text-sm text-ink-muted">
                {selectedAddress.recipientName}, {selectedAddress.addressLine1}, {selectedAddress.city}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-sm text-ink-muted">
              Delivery: <span className="font-medium text-ink dark:text-slate-100">{deliveryOptions.find((d) => d.value === deliveryMethod)?.label}</span>
              {deliveryMethod !== "pharmacy_collection" && ` - ${timeSlot}`}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Payment: <span className="font-medium text-ink dark:text-slate-100">{paymentOptions.find((p) => p.value === paymentMethod)?.label}</span>
            </p>
          </div>

          {preview && (
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="mb-2 text-sm font-medium text-ink dark:text-slate-100">Price breakdown</p>
              <dl className="flex flex-col gap-1 text-sm text-ink-muted">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>
                    <Price amount={preview.subtotal} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delivery fee</dt>
                  <dd>
                    <Price amount={preview.deliveryFee} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Service fee</dt>
                  <dd>
                    <Price amount={preview.serviceFee} />
                  </dd>
                </div>
                {preview.discount > 0 && (
                  <div className="flex justify-between">
                    <dt>Discount</dt>
                    <dd>
                      <Price amount={-preview.discount} />
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Tax</dt>
                  <dd>
                    <Price amount={preview.tax} />
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-ink dark:border-slate-700 dark:text-slate-100">
                  <dt>Total</dt>
                  <dd>
                    <Price amount={preview.total} />
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            I confirm the above details are correct and agree to the Terms of Service.
          </label>

          {submitError && (
            <p role="alert" className="text-sm text-danger">
              {submitError}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-between gap-3">
        <AppButton variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </AppButton>
        {step < steps.length - 1 ? (
          <AppButton
            disabled={(step === 0 && !selectedAddress) || createOrder.isPending}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </AppButton>
        ) : (
          <AppButton
            disabled={!acceptedTerms || createOrder.isPending}
            isLoading={createOrder.isPending}
            onClick={handlePlaceOrder}
          >
            Place Order
          </AppButton>
        )}
      </div>
    </div>
  );
}
