import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import { renderWithProviders } from "@/test/testUtils";
import type { Product } from "@/types";

const baseProduct: Product = {
  id: "prod-11",
  name: "Amoxicillin 500mg Capsules",
  brand: "PharmaLine",
  manufacturer: "PharmaLine Laboratories",
  category: "cat-medicines",
  description: "Prescription antibiotic.",
  storageInformation: "Store below 25°C.",
  image: "capsule",
  price: 1150,
  packSize: "21 capsules",
  stockQuantity: 75,
  prescriptionRequired: true,
  pharmacyId: "pharm-01",
  pharmacyName: "MediCall Central Pharmacy",
  rating: 4.7,
  availability: "in_stock",
  relatedProductIds: [],
};

describe("ProductCard", () => {
  it("shows a prescription-required badge for prescription-only products", () => {
    renderWithProviders(<ProductCard product={baseProduct} />);
    expect(screen.getByText(/prescription required/i)).toBeInTheDocument();
  });

  it("does not show a prescription-required badge for OTC products", () => {
    renderWithProviders(<ProductCard product={{ ...baseProduct, prescriptionRequired: false }} />);
    expect(screen.queryByText(/prescription required/i)).not.toBeInTheDocument();
  });
});
