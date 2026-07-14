import { Link, useNavigate } from "react-router-dom";
import { FileUp, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types";
import { ProductImagePlaceholder } from "./ProductImagePlaceholder";
import { PrescriptionRequiredBadge } from "@/components/prescription/PrescriptionBadge";
import { AppButton } from "@/components/common/AppButton";
import { Price } from "@/components/common/Price";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useApprovedPrescriptionId } from "@/features/prescriptions/usePrescriptions";
import { generateId } from "@/utils/id";

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const approvedPrescriptionId = useApprovedPrescriptionId();
  const isOutOfStock = product.availability === "out_of_stock";
  const needsPrescriptionUpload = product.prescriptionRequired && !approvedPrescriptionId;

  function handleAddToCart() {
    if (!isAuthenticated) {
      useAuthStore.getState().setRedirectPath(window.location.pathname);
      navigate("/login");
      return;
    }
    addItem({
      id: generateId("cart-item"),
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1,
      packSize: product.packSize,
      stockQuantity: product.stockQuantity,
      prescriptionRequired: product.prescriptionRequired,
      prescriptionId: product.prescriptionRequired ? approvedPrescriptionId : undefined,
      pharmacyId: product.pharmacyId,
      pharmacyName: product.pharmacyName,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-card transition-transform hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900">
      <Link to={`/products/${product.id}`} className="block">
        <ProductImagePlaceholder imageKey={product.image} category={product.category} />
      </Link>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <Link to={`/products/${product.id}`} className="line-clamp-2 text-sm font-semibold text-ink hover:underline dark:text-slate-100">
          {product.name}
        </Link>
        <p className="text-xs text-ink-muted">
          {product.brand} · {product.packSize}
        </p>
        <div className="flex items-center gap-1 text-xs text-ink-muted">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          <span>{product.rating.toFixed(1)}</span>
        </div>
        {product.prescriptionRequired && <PrescriptionRequiredBadge />}
        <div className="mt-auto flex items-center justify-between pt-2">
          <Price amount={product.price} />
        </div>
        {isOutOfStock ? (
          <AppButton variant="outline" disabled fullWidth size="sm">
            Out of Stock
          </AppButton>
        ) : needsPrescriptionUpload ? (
          <AppButton
            variant="secondary"
            fullWidth
            size="sm"
            onClick={() => navigate("/prescriptions/upload")}
          >
            <FileUp className="h-4 w-4" /> Upload Prescription
          </AppButton>
        ) : (
          <AppButton variant="primary" fullWidth size="sm" onClick={handleAddToCart}>
            <Plus className="h-4 w-4" /> Add to Cart
          </AppButton>
        )}
      </div>
    </div>
  );
}
