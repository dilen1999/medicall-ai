export interface Pharmacy {
  id: string;
  name: string;
  city: string;
  openingHours: string;
  phoneNumber: string;
  isOpenNow: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  productCount: number;
}

export type ProductAvailability = "in_stock" | "low_stock" | "out_of_stock";

export interface Product {
  id: string;
  name: string;
  brand: string;
  genericName?: string;
  manufacturer: string;
  category: string;
  description: string;
  storageInformation: string;
  image: string;
  price: number;
  packSize: string;
  stockQuantity: number;
  prescriptionRequired: boolean;
  pharmacyId: string;
  pharmacyName: string;
  rating: number;
  availability: ProductAvailability;
  relatedProductIds: string[];
}

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  prescriptionRequired?: boolean;
  availability?: ProductAvailability;
  sortBy?: "price" | "name" | "rating";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
