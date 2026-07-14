import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { productApi } from "@/api/productApi";
import type { ProductFilters } from "@/types";

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => productApi.list(filters),
  });
}

const PAGE_SIZE = 12;

export function useInfiniteProducts(filters: Omit<ProductFilters, "page" | "pageSize">) {
  return useInfiniteQuery({
    queryKey: ["products", "infinite", filters],
    queryFn: ({ pageParam }) => productApi.list({ ...filters, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => productApi.categories(),
    staleTime: 5 * 60_000,
  });
}
