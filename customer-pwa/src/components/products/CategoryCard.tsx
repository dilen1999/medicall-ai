import { Link } from "react-router-dom";
import { Baby, Cross, Droplets, HeartPulse, Pill, Stethoscope, type LucideIcon } from "lucide-react";
import type { Category } from "@/types";

const iconMap: Record<string, LucideIcon> = {
  Pill,
  Cross,
  Droplets,
  Baby,
  HeartPulse,
  Stethoscope,
};

export function CategoryCard({ category }: { category: Category }) {
  const Icon = iconMap[category.icon] ?? Pill;

  return (
    <Link
      to={`/products?category=${category.id}`}
      className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-card transition-transform hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary-dark dark:bg-teal-900/40 dark:text-teal-300">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="text-sm font-medium text-ink dark:text-slate-100">{category.name}</span>
      <span className="text-xs text-ink-muted">{category.productCount} items</span>
    </Link>
  );
}
