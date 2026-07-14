import { describe, expect, it } from "vitest";
import { supportApi } from "./supportApi";

describe("supportApi AI chat (mock mode)", () => {
  it("escalates medical questions to a pharmacist instead of answering them", async () => {
    const reply = await supportApi.sendChatMessage("What dosage of this medicine should I take for my fever?");
    expect(reply.isEscalation).toBe(true);
    expect(reply.message).toBe(
      "I'm not able to provide medical advice. I can help arrange support from a qualified pharmacist.",
    );
  });

  it("answers non-medical questions about orders normally", async () => {
    const reply = await supportApi.sendChatMessage("How do I track my order?");
    expect(reply.isEscalation).toBeFalsy();
    expect(reply.message.toLowerCase()).toContain("order");
  });
});
