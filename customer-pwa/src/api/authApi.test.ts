import { describe, expect, it } from "vitest";
import { authApi } from "./authApi";

describe("authApi (mock mode)", () => {
  it("logs in successfully with the demo mock credentials", async () => {
    const result = await authApi.login("customer@medicall.com", "Password123!");
    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe("customer@medicall.com");
  });

  it("rejects invalid credentials", async () => {
    await expect(authApi.login("customer@medicall.com", "wrong-password")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
