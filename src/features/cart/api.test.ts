import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { CART_SERVICE } from "../../shared/api/endpoints";
import { fetchCart } from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn() },
}));

describe("cart api", () => {
  it("fetchCart는 CART_SERVICE.cart(userId)를 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: { userId: 1, items: [] }, error: null } });
    const result = await fetchCart(1);
    expect(apiClient.get).toHaveBeenCalledWith(CART_SERVICE.cart(1));
    expect(result).toEqual({ userId: 1, items: [] });
  });
});
