import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  FileUp,
  HeartPulse,
  MapPinned,
  PackageSearch,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Truck,
} from "lucide-react";
import { SearchBar } from "@/components/common/SearchBar";
import { AppButton } from "@/components/common/AppButton";
import { env } from "@/utils/env";

const features = [
  {
    icon: Truck,
    title: "Fast, reliable delivery",
    description: "Track every order in real time, from preparation to your door.",
  },
  {
    icon: ShieldCheck,
    title: "Pharmacist reviewed",
    description: "Every prescription is checked by a qualified pharmacist before dispensing.",
  },
  {
    icon: PackageSearch,
    title: "Wide product range",
    description: "Medicines, first aid, personal care, baby care, wellness and equipment.",
  },
  {
    icon: Stethoscope,
    title: "Pharmacist support",
    description: "Request a callback any time you have a medicine-related question.",
  },
];

const steps = [
  { title: "Browse or upload", description: "Search products or upload a prescription for pharmacist review." },
  { title: "We prepare your order", description: "Your pharmacy prepares and quality-checks every item." },
  { title: "Track your delivery", description: "Watch your order move from pharmacy to your doorstep." },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col gap-16 pb-10">
      <section className="grid gap-8 pt-6 md:grid-cols-2 md:items-center md:pt-12">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-ink dark:text-slate-100 md:text-4xl">
            Order healthcare products safely
          </h1>
          <p className="mt-3 max-w-md text-ink-muted">
            Browse trusted pharmacy products, upload prescriptions for pharmacist review, and track every delivery
            in real time with MediCall Care.
          </p>
          <div className="mt-5">
            <SearchBar
              value={search}
              onChange={setSearch}
              onSubmit={() => navigate(`/products?search=${encodeURIComponent(search)}`)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/products">
              <AppButton size="lg">Browse Products</AppButton>
            </Link>
            <Link to="/prescriptions/upload">
              <AppButton size="lg" variant="secondary">
                <FileUp className="h-4 w-4" /> Upload Prescription
              </AppButton>
            </Link>
            <Link to="/orders">
              <AppButton size="lg" variant="outline">
                Track My Order
              </AppButton>
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-primary-light to-white p-10 dark:from-teal-950 dark:to-slate-900">
          <HeartPulse className="h-32 w-32 text-primary-dark/70 dark:text-teal-300" strokeWidth={1.2} aria-hidden="true" />
        </div>
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="mb-4 text-lg font-semibold text-ink dark:text-slate-100">
          Why choose MediCall Care
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-900">
              <feature.icon className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-ink dark:text-slate-100">{feature.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="delivery-heading" className="rounded-3xl bg-primary-light/50 p-6 dark:bg-teal-950/40">
        <div className="flex flex-col items-center gap-3 text-center">
          <MapPinned className="h-8 w-8 text-primary-dark dark:text-teal-300" aria-hidden="true" />
          <h2 id="delivery-heading" className="text-lg font-semibold text-ink dark:text-slate-100">
            Delivery across your city
          </h2>
          <p className="max-w-xl text-sm text-ink-muted">
            Choose standard, express, scheduled delivery or pharmacy collection - whatever suits you best. Track
            your driver live once your order is on its way.
          </p>
        </div>
      </section>

      <section aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="mb-4 text-lg font-semibold text-ink dark:text-slate-100">
          How it works
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="text-sm font-semibold text-ink dark:text-slate-100">{step.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="pharmacist-heading" className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="pharmacist-heading" className="text-lg font-semibold text-ink dark:text-slate-100">
              Need help with a medicine-related question?
            </h2>
            <p className="mt-1 max-w-xl text-sm text-ink-muted">
              Our AI assistant can help with orders and delivery, but it never gives medical advice. For anything
              medical, request a pharmacist callback.
            </p>
          </div>
          <Link to="/support/new">
            <AppButton variant="secondary">Request pharmacist callback</AppButton>
          </Link>
        </div>
      </section>

      <section aria-labelledby="trust-heading">
        <h2 id="trust-heading" className="mb-4 text-lg font-semibold text-ink dark:text-slate-100">
          Trust and safety
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <ShieldCheck className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium text-ink dark:text-slate-100">Licensed pharmacies only</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <Clock className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium text-ink dark:text-slate-100">Pharmacist review before dispatch</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <Stethoscope className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium text-ink dark:text-slate-100">No AI medical advice, ever</p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="pwa-heading"
        className="flex flex-col items-center gap-3 rounded-3xl bg-ink px-6 py-10 text-center text-white dark:bg-slate-900"
      >
        <Smartphone className="h-8 w-8" aria-hidden="true" />
        <h2 id="pwa-heading" className="text-lg font-semibold">
          Install MediCall Care on your phone
        </h2>
        <p className="max-w-md text-sm text-slate-200">
          Add MediCall Care to your home screen for a faster, app-like experience with offline access to your
          recent orders.
        </p>
      </section>

      <footer className="border-t border-slate-200 pt-6 text-sm text-ink-muted dark:border-slate-700">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} MediCall Care. All rights reserved.</p>
          <p>
            Support: {env.supportPhone} · {env.supportEmail}
          </p>
        </div>
      </footer>
    </div>
  );
}
