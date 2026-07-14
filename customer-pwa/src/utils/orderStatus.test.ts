import { describe, expect, it } from "vitest";
import { buildOrderTimeline } from "./orderStatus";

describe("buildOrderTimeline", () => {
  it("marks every step up to and including the current status as completed", () => {
    const timeline = buildOrderTimeline("preparing_order", "2026-07-14T06:10:00.000Z", false);

    const preparingIndex = timeline.findIndex((entry) => entry.status === "preparing_order");
    expect(preparingIndex).toBeGreaterThanOrEqual(0);

    timeline.slice(0, preparingIndex + 1).forEach((entry) => {
      expect(entry.completed).toBe(true);
    });
    timeline.slice(preparingIndex + 1).forEach((entry) => {
      expect(entry.completed).toBe(false);
      expect(entry.timestamp).toBeNull();
    });
  });

  it("excludes prescription review steps when no prescription is required", () => {
    const timeline = buildOrderTimeline("payment_confirmed", "2026-07-14T06:10:00.000Z", false);
    expect(timeline.some((entry) => entry.status === "prescription_reviewing")).toBe(false);
  });

  it("produces a short two-step timeline for cancelled orders", () => {
    const timeline = buildOrderTimeline("cancelled", "2026-07-14T06:10:00.000Z", false);
    expect(timeline.map((entry) => entry.status)).toEqual(["order_received", "cancelled"]);
    expect(timeline.every((entry) => entry.completed)).toBe(true);
  });
});
