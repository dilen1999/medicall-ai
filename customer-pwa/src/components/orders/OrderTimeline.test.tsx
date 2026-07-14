import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderTimeline } from "./OrderTimeline";
import { buildOrderTimeline, ORDER_STATUS_LABELS } from "@/utils/orderStatus";

describe("OrderTimeline", () => {
  it("displays the current status as the last completed step", () => {
    const entries = buildOrderTimeline("out_for_delivery", "2026-07-14T07:30:00.000Z", false);
    render(<OrderTimeline entries={entries} />);

    const currentLabel = screen.getByText(ORDER_STATUS_LABELS.out_for_delivery);
    expect(currentLabel).toBeInTheDocument();

    const nearbyLabel = screen.getByText(ORDER_STATUS_LABELS.nearby);
    expect(nearbyLabel.className).toContain("text-ink-muted");
  });
});
