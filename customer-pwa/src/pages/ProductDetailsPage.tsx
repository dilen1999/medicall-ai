import { useParams } from "react-router-dom";
import { ShieldAlert, Star } from "lucide-react";
import { useProduct, useProducts } from "@/features/products/useProducts";
import { ProductImagePlaceholder } from "@/components/products/ProductImagePlaceholder";
import { ProductCard } from "@/components/products/ProductCard";
import { PrescriptionRequiredBadge } from "@/components/prescription/PrescriptionBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Price } from "@/components/common/Price";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { AppButton } from "@/components/common/AppButton";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useApprovedPrescriptionId } from "@/features/prescriptions/usePrescriptions";
import { generateId } from "@/utils/id";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const availabilityLabel: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  in_stock: { label: "In Stock", tone: "success" },
  low_stock: { label: "Low Stock", tone: "warning" },
  out_of_stock: { label: "Out of Stock", tone: "danger" },
};

export function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError, refetch } = useProduct(productId);
  const { data: related } = useProducts({ pageSize: 4 });
  const addItem = useCartStore((state) => state.addItem);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const approvedPrescriptionId = useApprovedPrescriptionId();

  if (isLoading) return <LoadingSpinner label="Loading product" />;
  if (isError || !product) {
    return <ErrorState message="This product could not be loaded." onRetry={() => refetch()} />;
  }

  const currentProduct = product;
  const availability = availabilityLabel[currentProduct.availability];
  const needsPrescriptionUpload = currentProduct.prescriptionRequired && !approvedPrescriptionId;
  const relatedProducts = related?.items.filter((p) => currentProduct.relatedProductIds.includes(p.id)) ?? [];

  function handleAddToCart() {
    if (!isAuthenticated) {
      useAuthStore.getState().setRedirectPath(window.location.pathname);
      navigate("/login");
      return;
    }
    addItem({
      id: generateId("cart-item"),
      productId: currentProduct.id,
      name: currentProduct.name,
      image: currentProduct.image,
      price: currentProduct.price,
      quantity: 1,
      packSize: currentProduct.packSize,
      stockQuantity: currentProduct.stockQuantity,
      prescriptionRequired: currentProduct.prescriptionRequired,
      prescriptionId: currentProduct.prescriptionRequired ? approvedPrescriptionId : undefined,
      pharmacyId: currentProduct.pharmacyId,
      pharmacyName: currentProduct.pharmacyName,
    });
    toast.success(`${currentProduct.name} added to cart`);
  }

  return (
    <div>
      <PageHeader title="Product details" showBack />
      <div className="grid gap-6 md:grid-cols-2">
        <ProductImagePlaceholder imageKey={product.image} category={product.category} className="max-w-sm" />

        <div>
          <h1 className="text-xl font-semibold text-ink dark:text-slate-100">{product.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {product.brand} · {product.packSize}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="text-sm text-ink-muted">{product.rating.toFixed(1)} rating</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {product.prescriptionRequired && <PrescriptionRequiredBadge />}
            <StatusBadge label={availability.label} tone={availability.tone} />
          </div>
          <div className="mt-4">
            <Price amount={product.price} className="text-2xl" />
          </div>

          <div className="mt-5">
            {product.availability === "out_of_stock" ? (
              <AppButton disabled fullWidth>
                Out of Stock
              </AppButton>
            ) : needsPrescriptionUpload ? (
              <AppButton fullWidth variant="secondary" onClick={() => navigate("/prescriptions/upload")}>
                Upload Prescription
              </AppButton>
            ) : (
              <AppButton fullWidth onClick={handleAddToCart}>
                Add to Cart
              </AppButton>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {product.genericName && (
              <div>
                <dt className="text-ink-muted">Generic name</dt>
                <dd className="font-medium text-ink dark:text-slate-100">{product.genericName}</dd>
              </div>
            )}
            <div>
              <dt className="text-ink-muted">Manufacturer</dt>
              <dd className="font-medium text-ink dark:text-slate-100">{product.manufacturer}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Pharmacy</dt>
              <dd className="font-medium text-ink dark:text-slate-100">{product.pharmacyName}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-base font-semibold text-ink dark:text-slate-100">Description</h2>
          <p className="text-sm text-ink-muted">{product.description}</p>
        </div>
        <div>
          <h2 className="mb-2 text-base font-semibold text-ink dark:text-slate-100">Storage information</h2>
          <p className="text-sm text-ink-muted">{product.storageInformation}</p>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>
          This information is provided for general reference only and is not a substitute for professional medical
          advice. Always follow the product label and consult a pharmacist before use.
        </p>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-semibold text-ink dark:text-slate-100">Related products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
