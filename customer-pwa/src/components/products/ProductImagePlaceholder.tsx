import {
  Baby,
  Bandage,
  Droplets,
  HeartPulse,
  Pill,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";

const iconByKey: Record<string, LucideIcon> = {
  bandages: Bandage,
  thermometer: Thermometer,
  sanitiser: Droplets,
  mask: ShieldCheck,
  wipes: Baby,
  firstaidkit: Bandage,
  wipesantiseptic: ShieldCheck,
  lotion: Droplets,
  cottonpads: ShieldCheck,
  ors: HeartPulse,
  capsule: Pill,
  tablet: Pill,
  bpmonitor: Stethoscope,
  vitamins: HeartPulse,
  rashcream: Baby,
  bottle: Baby,
  crepe: Bandage,
  oximeter: Stethoscope,
};

const categoryGradient: Record<string, string> = {
  "cat-medicines": "from-teal-100 to-teal-50",
  "cat-first-aid": "from-amber-100 to-amber-50",
  "cat-personal-care": "from-sky-100 to-sky-50",
  "cat-baby-care": "from-pink-100 to-pink-50",
  "cat-wellness": "from-emerald-100 to-emerald-50",
  "cat-medical-equipment": "from-slate-200 to-slate-100",
};

interface ProductImagePlaceholderProps {
  imageKey: string;
  category?: string;
  className?: string;
}

export function ProductImagePlaceholder({ imageKey, category, className }: ProductImagePlaceholderProps) {
  const Icon = iconByKey[imageKey] ?? Pill;
  const gradient = categoryGradient[category ?? ""] ?? "from-slate-100 to-white";

  return (
    <div
      className={cn(
        "flex aspect-square w-full items-center justify-center rounded-xl bg-gradient-to-br dark:from-slate-800 dark:to-slate-900",
        gradient,
        className,
      )}
      aria-hidden="true"
    >
      <Icon className="h-10 w-10 text-primary-dark/70 dark:text-teal-300" strokeWidth={1.5} />
    </div>
  );
}
