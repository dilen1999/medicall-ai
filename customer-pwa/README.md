# MediCall Care - Customer PWA

A customer-facing pharmacy ordering and delivery Progressive Web App. Customers can browse healthcare
products, upload prescriptions for pharmacist review, manage a cart and checkout, track deliveries in real
time, and get help from AI-assisted (non-medical) support with a clear path to a human pharmacist for
anything medical.

This app is a standalone frontend inside the `medicall-ai` monorepo (`customer-pwa/`). It does not modify
the existing `backend/`, `frontend/`, or any root-level files.

## Features

- Registration, login, forgot password (mock authentication)
- Delivery location selection and multi-address management
- Product catalogue with search, filters, sorting and load-more pagination
- Product details with safety disclaimers (no dosage/treatment guidance)
- Prescription upload (drag-and-drop, camera capture, PDF) with status tracking
- Cart with quantity controls, stock validation, promotion codes and price summary
- Multi-step checkout: address, delivery method, schedule, payment, review, place order
- Order success page with a printable receipt
- Order history (active / upcoming / past / cancelled), order details, cancellation, reorder
- Live-feeling delivery tracking with simulated driver movement and ETA
- Notifications centre with read/unread state and filtering
- Support hub: AI chat (order/delivery help only), support case creation, pharmacist callback requests, FAQ
- Profile, address book, notification & theme settings
- Installable PWA with offline banner, offline fallback page, and update prompts

## Technology stack

React 19 - TypeScript - Vite - React Router - TanStack Query - Zustand - Axios - React Hook Form - Zod -
Tailwind CSS v4 - Lucide React - Framer Motion - Sonner - vite-plugin-pwa - Vitest / Testing Library

## Folder structure

```
customer-pwa/
├── public/
│   ├── icons/              # Generated PWA icons (192, 512, maskable, apple-touch)
│   └── offline.html         # Static offline fallback used by the service worker
├── src/
│   ├── api/                 # Axios client + one module per resource (auth, products, cart, orders, ...)
│   ├── components/          # common/, layout/, products/, cart/, orders/, prescription/, support/, addresses/, notifications/
│   ├── features/            # Feature hooks & schemas (react-query hooks, zod schemas, chat panel, FAQ)
│   ├── hooks/                # Cross-cutting hooks (online status, PWA install)
│   ├── layouts/              # CustomerLayout, AuthLayout
│   ├── mocks/                 # Mock data + the in-memory mock API engine
│   ├── pages/                 # Route-level page components
│   ├── providers/             # React Query provider
│   ├── routes/                 # AppRouter, ProtectedRoute, PublicRoute, ErrorBoundary
│   ├── stores/                  # Zustand stores: auth, cart, theme, language, ui
│   ├── types/                    # Shared TypeScript domain types
│   └── utils/                     # env config, formatting, order/prescription status helpers
├── .env.example
└── vite.config.ts
```

## Environment variables

Copy `.env.example` to `.env` (optional - sensible defaults are already baked in):

```
VITE_APP_NAME=MediCall Care
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_BASE_URL=ws://localhost:8000
VITE_ENABLE_MOCKS=true
VITE_DEFAULT_LANGUAGE=en
VITE_SUPPORT_PHONE=+94000000000
VITE_SUPPORT_EMAIL=support@medicall.local
```

All environment variables are read through a single typed module (`src/utils/env.ts`) - no other file reads
`import.meta.env` directly. When `VITE_ENABLE_MOCKS=true` the entire app works with no backend running. Set
it to `false` to route every API call through Axios to `VITE_API_BASE_URL`.

## Installation & development

```
cd customer-pwa
npm install
npm run dev
```

## Production build

```
npm run build
npm run preview
```

## Tests

```
npm run test        # watch mode
npm run test:run    # single run (used in CI)
```

17 tests cover the cart store, mock authentication, the prescription-required product badge, protected-route
redirects, AI-chat medical escalation, and order timeline status rendering.

## Mock login

```
Email:    customer@medicall.com
Password: Password123!
```

## Backend integration

The existing `backend/` (a FastAPI service originally built around AI voice-call delivery confirmations) has
been extended with a full storefront API - auth, product catalogue, addresses, prescriptions, cart, orders,
support/AI chat, and notifications - without touching its original voice-call-confirmation routes. See
`backend/README.md` section 16 for the full endpoint list.

To run against the real backend instead of mocks:

```
# 1. Start Postgres (from backend/)
docker compose up -d db

# 2. Install and run the backend (from backend/)
python -m venv .venv && .venv/Scripts/activate   # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Point the frontend at it (customer-pwa/.env.local, gitignored)
VITE_ENABLE_MOCKS=false
VITE_API_BASE_URL=http://localhost:8000/api
```

The product catalogue (21 products, 6 categories, 3 pharmacies) is seeded automatically on first startup.
Register a new account from the app - there is no seeded login for the real backend (the
`customer@medicall.com` demo account only exists in mock mode).

All new backend responses are camelCase (see `backend/app/schemas/base.py`), matching this frontend's
TypeScript types with zero manual field mapping. The only frontend file that needed real-backend-specific
path/payload adjustments was `src/api/orderApi.ts` (storefront orders live under `/storefront/orders`, not
`/orders`, to avoid colliding with the backend's pre-existing n8n voice-call order endpoints) - every other
`src/api/*.ts` module's mock-mode and real-mode paths already matched.

## PWA installation & offline behaviour

- Install: use the in-app "Install MediCall Care" prompt, or your browser's install icon.
- Offline: static assets, icons and the app shell are cached (cache-first); the product catalogue is
  stale-while-revalidate; orders/notifications/profile are network-first with a cache fallback. Checkout,
  prescription submission, payments and authentication are network-only and are blocked while offline, with
  a clear reconnection message shown to the customer.
- An update banner appears when a new version has been installed in the background; reload to activate it.

## Medical-safety limitations

The AI support assistant never diagnoses conditions, recommends treatments or medicines, interprets
prescriptions, or suggests/changes dosage. Any medical question is met with:

> "I'm not able to provide medical advice. I can help arrange support from a qualified pharmacist."

...and is routed to a pharmacist-callback support case instead of being answered. This applies to both the
AI chat panel and the "Medical question" category in the support-case form.
