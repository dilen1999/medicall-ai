import type {
  Address,
  AddressInput,
  AppNotification,
  CartItem,
  Category,
  CheckoutPreview,
  DeliveryMethod,
  Order,
  PaginatedResponse,
  PaymentMethod,
  Prescription,
  PrescriptionStatus,
  Product,
  ProductFilters,
  CustomerProfile,
  SupportCase,
  SupportIssueCategory,
  SupportMessage,
  ChatMessage,
  PreferredContactMethod,
} from "@/types";
import { MockApiError } from "@/api/apiError";
import { generateId } from "@/utils/id";
import { buildOrderTimeline, ACTIVE_ORDER_STATUSES, ORDER_STATUS_SEQUENCE } from "@/utils/orderStatus";
import { mockProducts } from "./mockProducts";
import { mockCategories } from "./mockCategories";
import { mockAddresses } from "./mockAddresses";
import { mockOrders } from "./mockOrders";
import { mockNotifications } from "./mockNotifications";
import { mockPrescriptions } from "./mockPrescriptions";
import { mockSupportCases } from "./mockSupportCases";
import { mockProfile } from "./mockProfile";
import { mockDeliveryTracking } from "./mockDelivery";

const clone = <T>(value: T): T => structuredClone(value);

const db = {
  products: clone(mockProducts),
  categories: clone(mockCategories),
  addresses: clone(mockAddresses),
  orders: clone(mockOrders),
  notifications: clone(mockNotifications),
  prescriptions: clone(mockPrescriptions),
  supportCases: clone(mockSupportCases),
  profile: clone(mockProfile),
  tracking: clone(mockDeliveryTracking),
};

const DEMO_EMAIL = "customer@medicall.com";
const DEMO_PASSWORD = "Password123!";

function delay<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  standard: 350,
  express: 550,
  scheduled: 300,
  pharmacy_collection: 0,
};

const PROMO_CODES: Record<string, number> = {
  WELL10: 0.1,
  SAVE100: 100,
};

function computePreview(
  items: CartItem[],
  deliveryMethod: DeliveryMethod,
  promotionCode?: string,
): CheckoutPreview {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = DELIVERY_FEES[deliveryMethod];
  const serviceFee = Math.round(subtotal * 0.02);
  const tax = Math.round(subtotal * 0.05);

  let discount = 0;
  let promotionApplied: string | undefined;
  let promotionError: string | undefined;

  if (promotionCode) {
    const rule = PROMO_CODES[promotionCode.toUpperCase()];
    if (rule === undefined) {
      promotionError = "This promotion code is not valid.";
    } else {
      discount = rule < 1 ? Math.round(subtotal * rule) : rule;
      promotionApplied = promotionCode.toUpperCase();
    }
  }

  const total = Math.max(0, subtotal + deliveryFee + serviceFee + tax - discount);

  return {
    subtotal,
    deliveryFee,
    serviceFee,
    discount,
    tax,
    total,
    promotionApplied,
    promotionError,
    estimatedDeliveryWindow:
      deliveryMethod === "express" ? "Within 90 minutes" : "Within 3-5 hours",
  };
}

export const mockApi = {
  auth: {
    async login(identifier: string, password: string) {
      if (identifier.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
        throw new MockApiError("UNAUTHORIZED", "Invalid email/phone number or password.");
      }
      const token = generateId("mock-token");
      return delay({ user: clone(db.profile), token });
    },
    async register(input: { fullName: string; email: string; phoneNumber: string }) {
      const token = generateId("mock-token");
      const user: CustomerProfile = {
        ...clone(db.profile),
        id: generateId("cust"),
        fullName: input.fullName,
        email: input.email,
        phoneNumber: input.phoneNumber,
      };
      return delay({ user, token });
    },
    async forgotPassword(_email: string) {
      return delay({ message: "If an account exists for this email, a reset link has been sent." });
    },
  },

  products: {
    async list(filters: ProductFilters): Promise<PaginatedResponse<Product>> {
      let items = [...db.products];

      if (filters.search) {
        const q = filters.search.trim().toLowerCase();
        items = items.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            (p.genericName ?? "").toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q),
        );
      }
      if (filters.category) items = items.filter((p) => p.category === filters.category);
      if (filters.brand) items = items.filter((p) => p.brand === filters.brand);
      if (filters.availability) items = items.filter((p) => p.availability === filters.availability);
      if (filters.prescriptionRequired !== undefined) {
        items = items.filter((p) => p.prescriptionRequired === filters.prescriptionRequired);
      }
      if (filters.minPrice !== undefined) items = items.filter((p) => p.price >= filters.minPrice!);
      if (filters.maxPrice !== undefined) items = items.filter((p) => p.price <= filters.maxPrice!);

      if (filters.sortBy) {
        const dir = filters.sortDirection === "desc" ? -1 : 1;
        items.sort((a, b) => {
          if (filters.sortBy === "price") return (a.price - b.price) * dir;
          if (filters.sortBy === "rating") return (a.rating - b.rating) * dir;
          return a.name.localeCompare(b.name) * dir;
        });
      }

      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 12;
      const total = items.length;
      const start = (page - 1) * pageSize;
      const pageItems = items.slice(start, start + pageSize);

      return delay({
        items: pageItems,
        total,
        page,
        pageSize,
        hasMore: start + pageItems.length < total,
      });
    },
    async get(id: string): Promise<Product> {
      const product = db.products.find((p) => p.id === id);
      if (!product) throw new MockApiError("NOT_FOUND", "This product could not be found.");
      return delay(clone(product));
    },
    async categories(): Promise<Category[]> {
      return delay(clone(db.categories));
    },
  },

  prescriptions: {
    async list(): Promise<Prescription[]> {
      return delay(clone(db.prescriptions).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
    },
    async get(id: string): Promise<Prescription> {
      const found = db.prescriptions.find((p) => p.id === id);
      if (!found) throw new MockApiError("NOT_FOUND", "Prescription not found.");
      return delay(clone(found));
    },
    async submit(input: { fileName: string; fileType: Prescription["fileType"]; note?: string }): Promise<Prescription> {
      const prescription: Prescription = {
        id: generateId("presc"),
        fileName: input.fileName,
        fileType: input.fileType,
        note: input.note,
        status: "under_pharmacist_review" as PrescriptionStatus,
        submittedAt: new Date().toISOString(),
      };
      db.prescriptions.unshift(prescription);
      db.notifications.unshift({
        id: generateId("notif"),
        type: "prescription_submitted",
        title: "Prescription received",
        message: "Your prescription has been submitted for pharmacist review.",
        createdAt: new Date().toISOString(),
        read: false,
      });
      return delay(clone(prescription), 900);
    },
  },

  cart: {
    async validate(items: CartItem[]): Promise<{ valid: boolean; errors: string[] }> {
      const errors: string[] = [];
      if (items.length === 0) errors.push("Your cart is empty.");
      for (const item of items) {
        const product = db.products.find((p) => p.id === item.productId);
        if (!product) {
          errors.push(`${item.name} is no longer available.`);
          continue;
        }
        if (product.stockQuantity < item.quantity) {
          errors.push(`Only ${product.stockQuantity} units of ${item.name} are in stock.`);
        }
        if (item.prescriptionRequired) {
          const prescription = db.prescriptions.find((p) => p.id === item.prescriptionId);
          if (!prescription || !["approved", "partially_approved"].includes(prescription.status)) {
            errors.push(`${item.name} needs an approved prescription before checkout.`);
          }
        }
      }
      return delay({ valid: errors.length === 0, errors });
    },
    async checkoutPreview(
      items: CartItem[],
      deliveryMethod: DeliveryMethod,
      promotionCode?: string,
    ): Promise<CheckoutPreview> {
      return delay(computePreview(items, deliveryMethod, promotionCode));
    },
  },

  orders: {
    async list(): Promise<Order[]> {
      return delay(clone(db.orders).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    async get(id: string): Promise<Order> {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw new MockApiError("NOT_FOUND", "Order not found.");
      return delay(clone(order));
    },
    async create(input: {
      items: CartItem[];
      address: Address;
      deliveryMethod: DeliveryMethod;
      deliveryTimeSlot: string;
      paymentMethod: PaymentMethod;
      promotionCode?: string;
    }): Promise<Order> {
      if (input.items.length === 0) {
        throw new MockApiError("VALIDATION_ERROR", "Cannot place an order with an empty cart.");
      }
      const preview = computePreview(input.items, input.deliveryMethod, input.promotionCode);
      const requiresPrescriptionReview = input.items.some((item) => item.prescriptionRequired);
      const now = new Date();
      const estimatedMinutes = input.deliveryMethod === "express" ? 60 : 180;
      const order: Order = {
        id: generateId("order"),
        reference: `MC-${Math.floor(100000 + Math.random() * 899999)}`,
        createdAt: now.toISOString(),
        status: "order_received",
        items: input.items.map((item) => ({
          id: generateId("oi"),
          productId: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          prescriptionRequired: item.prescriptionRequired,
        })),
        pharmacyId: input.items[0].pharmacyId,
        pharmacyName: input.items[0].pharmacyName,
        deliveryAddress: input.address,
        deliveryMethod: input.deliveryMethod,
        deliveryTimeSlot: input.deliveryTimeSlot,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === "cash_on_delivery" ? "pending" : "paid",
        subtotal: preview.subtotal,
        deliveryFee: preview.deliveryFee,
        serviceFee: preview.serviceFee,
        discount: preview.discount,
        tax: preview.tax,
        total: preview.total,
        estimatedDelivery: new Date(now.getTime() + estimatedMinutes * 60 * 1000).toISOString(),
        promotionCode: preview.promotionApplied,
        cancellable: true,
        timeline: buildOrderTimeline("order_received", now.toISOString(), requiresPrescriptionReview),
      };
      db.orders.unshift(order);
      db.notifications.unshift({
        id: generateId("notif"),
        type: "order_confirmed",
        title: "Order confirmed",
        message: `Your order ${order.reference} has been received.`,
        createdAt: now.toISOString(),
        read: false,
        linkTo: `/orders/${order.id}`,
      });
      return delay(clone(order), 900);
    },
    async cancel(id: string): Promise<Order> {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw new MockApiError("NOT_FOUND", "Order not found.");
      if (!order.cancellable) {
        throw new MockApiError("CONFLICT", "This order can no longer be cancelled.");
      }
      order.status = "cancelled";
      order.cancellable = false;
      order.timeline = buildOrderTimeline("cancelled", order.createdAt, false);
      return delay(clone(order));
    },
    async reorder(id: string): Promise<CartItem[]> {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw new MockApiError("NOT_FOUND", "Order not found.");
      const items: CartItem[] = order.items.map((item) => {
        const product = db.products.find((p) => p.id === item.productId);
        return {
          id: generateId("cart-item"),
          productId: item.productId,
          name: item.name,
          image: item.image,
          price: product?.price ?? item.price,
          quantity: item.quantity,
          packSize: product?.packSize ?? "",
          stockQuantity: product?.stockQuantity ?? 0,
          prescriptionRequired: item.prescriptionRequired,
          pharmacyId: order.pharmacyId,
          pharmacyName: order.pharmacyName,
        };
      });
      return delay(items);
    },
  },

  delivery: {
    async tracking(orderId: string) {
      const order = db.orders.find((o) => o.id === orderId);
      if (!order) throw new MockApiError("NOT_FOUND", "Order not found.");

      if (db.tracking.orderId !== orderId) {
        db.tracking = {
          orderId,
          status: order.status,
          estimatedArrival: order.estimatedDelivery,
          driver:
            order.status === "driver_assigned" ||
            order.status === "out_for_delivery" ||
            order.status === "nearby"
              ? db.tracking.driver
              : null,
          driverLocation: db.tracking.driverLocation,
          lastUpdated: new Date().toISOString(),
          deliveryInstructions: order.deliveryAddress.deliveryInstructions,
        };
      }

      if (ACTIVE_ORDER_STATUSES.includes(order.status) && Math.random() > 0.5) {
        const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(order.status);
        const next = ORDER_STATUS_SEQUENCE[currentIndex + 1];
        if (next) {
          order.status = next;
          order.timeline = buildOrderTimeline(next, order.createdAt, false);
          if (next === "delivered") {
            order.cancellable = false;
            db.notifications.unshift({
              id: generateId("notif"),
              type: "order_delivered",
              title: "Order delivered",
              message: `Your order ${order.reference} has been delivered.`,
              createdAt: new Date().toISOString(),
              read: false,
              linkTo: `/orders/${order.id}`,
            });
          }
        }
      }

      db.tracking.status = order.status;
      db.tracking.lastUpdated = new Date().toISOString();
      if (db.tracking.driverLocation) {
        db.tracking.driverLocation = {
          latitude: db.tracking.driverLocation.latitude + (Math.random() - 0.5) * 0.002,
          longitude: db.tracking.driverLocation.longitude + (Math.random() - 0.5) * 0.002,
          updatedAt: db.tracking.lastUpdated,
        };
      }

      return delay(clone(db.tracking), 300);
    },
  },

  support: {
    async listCases(): Promise<SupportCase[]> {
      return delay(clone(db.supportCases).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    },
    async getCase(id: string): Promise<SupportCase> {
      const found = db.supportCases.find((c) => c.id === id);
      if (!found) throw new MockApiError("NOT_FOUND", "Support case not found.");
      return delay(clone(found));
    },
    async createCase(input: {
      relatedOrderId?: string;
      category: SupportIssueCategory;
      description: string;
      preferredContactMethod: PreferredContactMethod;
      preferredCallbackTime?: string;
    }): Promise<SupportCase> {
      const now = new Date().toISOString();
      const isMedical = input.category === "medical_question";
      const supportCase: SupportCase = {
        id: generateId("case"),
        reference: `SC-${Math.floor(1000 + Math.random() * 8999)}`,
        relatedOrderId: input.relatedOrderId,
        category: input.category,
        description: input.description,
        status: "open",
        preferredContactMethod: input.preferredContactMethod,
        preferredCallbackTime: input.preferredCallbackTime,
        createdAt: now,
        updatedAt: now,
        messages: isMedical
          ? [
              {
                id: generateId("msg"),
                caseId: "",
                sender: "system",
                message:
                  "This is a medical question. A pharmacist callback has been scheduled - our AI assistant cannot provide medical advice.",
                createdAt: now,
              },
            ]
          : [
              {
                id: generateId("msg"),
                caseId: "",
                sender: "customer",
                message: input.description,
                createdAt: now,
              },
            ],
      };
      supportCase.messages = supportCase.messages.map((m) => ({ ...m, caseId: supportCase.id }));
      db.supportCases.unshift(supportCase);
      db.notifications.unshift({
        id: generateId("notif"),
        type: isMedical ? "pharmacist_callback_scheduled" : "support_case_updated",
        title: isMedical ? "Pharmacist callback scheduled" : "Support case created",
        message: isMedical
          ? "A pharmacist will call you back regarding your medical question."
          : `We've received your support case ${supportCase.reference}.`,
        createdAt: now,
        read: false,
        linkTo: `/support/cases/${supportCase.id}`,
      });
      return delay(clone(supportCase), 700);
    },
    async postMessage(caseId: string, message: string): Promise<SupportMessage> {
      const found = db.supportCases.find((c) => c.id === caseId);
      if (!found) throw new MockApiError("NOT_FOUND", "Support case not found.");
      const entry: SupportMessage = {
        id: generateId("msg"),
        caseId,
        sender: "customer",
        message,
        createdAt: new Date().toISOString(),
      };
      found.messages.push(entry);
      found.updatedAt = entry.createdAt;
      return delay(clone(entry));
    },
    async requestPharmacistCallback(input: {
      relatedOrderId?: string;
      preferredCallbackTime?: string;
      description: string;
    }): Promise<SupportCase> {
      return mockApi.support.createCase({
        relatedOrderId: input.relatedOrderId,
        category: "medical_question",
        description: input.description,
        preferredContactMethod: "phone",
        preferredCallbackTime: input.preferredCallbackTime,
      });
    },
    async sendChatMessage(message: string): Promise<ChatMessage> {
      const lower = message.toLowerCase();
      const medicalKeywords = [
        "dose",
        "dosage",
        "diagnos",
        "symptom",
        "treatment",
        "medicine for",
        "prescri",
        "should i take",
        "side effect",
        "pain",
        "fever",
        "allerg",
        "pregnan",
      ];
      const isMedical = medicalKeywords.some((keyword) => lower.includes(keyword));

      if (isMedical) {
        return delay(
          {
            id: generateId("chat"),
            sender: "assistant",
            message:
              "I'm not able to provide medical advice. I can help arrange support from a qualified pharmacist.",
            createdAt: new Date().toISOString(),
            isEscalation: true,
          },
          500,
        );
      }

      let reply =
        "I can help with order status, delivery issues, missing or damaged items, refunds, replacements, or pharmacy hours. Could you tell me a bit more?";
      if (lower.includes("order") || lower.includes("track")) {
        reply =
          "You can check your live order status any time from the Orders tab, or tap Track Order on an active order for real-time delivery updates.";
      } else if (lower.includes("refund")) {
        reply =
          "Refunds are usually processed to your original payment method within 3-5 business days once approved. Would you like me to raise a refund request for a specific order?";
      } else if (lower.includes("replace")) {
        reply =
          "For a replacement, please open a support case with the affected order and we'll arrange a free replacement delivery.";
      } else if (lower.includes("hour") || lower.includes("open")) {
        reply = "Most MediCall pharmacies are open 7:00 AM - 10:00 PM daily, with some 24-hour branches.";
      } else if (lower.includes("missing") || lower.includes("damage")) {
        reply =
          "Sorry to hear that. Please open a support case with the related order so our team can arrange a resolution.";
      }

      return delay(
        {
          id: generateId("chat"),
          sender: "assistant",
          message: reply,
          createdAt: new Date().toISOString(),
        },
        500,
      );
    },
  },

  profile: {
    async get(): Promise<CustomerProfile> {
      return delay(clone(db.profile));
    },
    async update(patch: Partial<CustomerProfile>): Promise<CustomerProfile> {
      db.profile = { ...db.profile, ...patch };
      return delay(clone(db.profile));
    },
  },

  addresses: {
    async list(): Promise<Address[]> {
      return delay(clone(db.addresses));
    },
    async create(input: AddressInput): Promise<Address> {
      const address: Address = { ...input, id: generateId("addr") };
      if (address.isDefault) {
        db.addresses.forEach((a) => (a.isDefault = false));
      }
      db.addresses.push(address);
      return delay(clone(address));
    },
    async update(id: string, patch: Partial<AddressInput>): Promise<Address> {
      const address = db.addresses.find((a) => a.id === id);
      if (!address) throw new MockApiError("NOT_FOUND", "Address not found.");
      Object.assign(address, patch);
      if (patch.isDefault) {
        db.addresses.forEach((a) => {
          if (a.id !== id) a.isDefault = false;
        });
      }
      return delay(clone(address));
    },
    async remove(id: string): Promise<void> {
      const index = db.addresses.findIndex((a) => a.id === id);
      if (index === -1) throw new MockApiError("NOT_FOUND", "Address not found.");
      db.addresses.splice(index, 1);
      return delay(undefined);
    },
  },

  notifications: {
    async list(): Promise<AppNotification[]> {
      return delay(clone(db.notifications).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    async markRead(id: string): Promise<void> {
      const notification = db.notifications.find((n) => n.id === id);
      if (notification) notification.read = true;
      return delay(undefined, 150);
    },
    async markAllRead(): Promise<void> {
      db.notifications.forEach((n) => (n.read = true));
      return delay(undefined, 150);
    },
    async remove(id: string): Promise<void> {
      const index = db.notifications.findIndex((n) => n.id === id);
      if (index !== -1) db.notifications.splice(index, 1);
      return delay(undefined, 150);
    },
  },
};
