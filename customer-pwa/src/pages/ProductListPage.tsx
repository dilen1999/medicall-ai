import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { SearchBar } from "@/components/common/SearchBar";
import { ProductCard } from "@/components/products/ProductCard";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { AppButton } from "@/components/common/AppButton";
import { AppSelect } from "@/components/common/AppSelect";
import { AppDrawer } from "@/components/common/AppDrawer";
import { useCategories, useInfiniteProducts } from "@/features/products/useProducts";
import type { ProductFilters } from "@/types";

const sortOptions = [
  { label: "Most relevant", value: "" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Highest rated", value: "rating-desc" },
];

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [isFilterOpen, setFilterOpen] = useState(false);
  const { data: categories } = useCategories();

  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const prescriptionOnly = searchParams.get("rx") === "true";
  const availabilityOnly = searchParams.get("inStock") === "true";

  const filters: Omit<ProductFilters, "page" | "pageSize"> = useMemo(() => {
    const [sortBy, sortDirection] = sort ? (sort.split("-") as ["price" | "rating", "asc" | "desc"]) : [undefined, undefined];
    return {
      search: search || undefined,
      category: category || undefined,
      prescriptionRequired: prescriptionOnly ? true : undefined,
      availability: availabilityOnly ? "in_stock" : undefined,
      sortBy,
      sortDirection,
    };
  }, [search, category, prescriptionOnly, availabilityOnly, sort]);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteProducts(filters);
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <SearchBar
          value={search}
          onChange={setSearch}
          onSubmit={() => updateParam("search", search)}
          showVoiceIcon={false}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label="Open filters"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        >
          <SlidersHorizontal className="h-5 w-5 text-ink-muted" />
        </button>
      </div>

      <div className="hidden flex-wrap items-center gap-3 md:flex">
        <AppSelect
          aria-label="Category"
          options={[{ label: "All categories", value: "" }, ...(categories?.map((c) => ({ label: c.name, value: c.id })) ?? [])]}
          value={category}
          onChange={(e) => updateParam("category", e.target.value)}
          className="max-w-xs"
        />
        <AppSelect
          aria-label="Sort by"
          options={sortOptions}
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={prescriptionOnly}
            onChange={(e) => updateParam("rx", e.target.checked ? "true" : "")}
          />
          Prescription only
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={availabilityOnly}
            onChange={(e) => updateParam("inStock", e.target.checked ? "true" : "")}
          />
          In stock only
        </label>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="We couldn't load products right now." onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No products found" description="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <AppButton variant="outline" isLoading={isFetchingNextPage} onClick={() => fetchNextPage()}>
                Load more
              </AppButton>
            </div>
          )}
        </>
      )}

      <AppDrawer isOpen={isFilterOpen} onClose={() => setFilterOpen(false)} title="Filters" side="bottom">
        <div className="flex flex-col gap-4">
          <AppSelect
            label="Category"
            options={[{ label: "All categories", value: "" }, ...(categories?.map((c) => ({ label: c.name, value: c.id })) ?? [])]}
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
          />
          <AppSelect
            label="Sort by"
            options={sortOptions}
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={prescriptionOnly}
              onChange={(e) => updateParam("rx", e.target.checked ? "true" : "")}
            />
            Prescription only
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={availabilityOnly}
              onChange={(e) => updateParam("inStock", e.target.checked ? "true" : "")}
            />
            In stock only
          </label>
          <AppButton onClick={() => setFilterOpen(false)}>Show results</AppButton>
        </div>
      </AppDrawer>
    </div>
  );
}
