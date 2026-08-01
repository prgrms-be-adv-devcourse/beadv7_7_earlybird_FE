import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { CART_SERVICE } from "../../shared/api/endpoints";
import { fetchCart } from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn() },
}));

describe("cart api", () => {
  it("fetchCart는 CART_SERVICE.cart(userId)를 GET한다", async () => {
    const cart = {
      cartId: 1,
      userId: 1,
      itemCount: 0,
      items: [],
      projects: [],
      totalItemsAmount: 0,
      totalShippingFee: 0,
      totalAmount: 0,
    };
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: cart, error: null } });
    const result = await fetchCart(1);
    expect(apiClient.get).toHaveBeenCalledWith(CART_SERVICE.cart(1));
    expect(result).toEqual(cart);
  });
});
