import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { CART_SERVICE } from "../../shared/api/endpoints";
import { addCartItems, fetchCart, removeCartItem, clearCart } from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

describe("cart api", () => {
  it("fetchCart는 CART_SERVICE.cart를 GET한다", async () => {
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

  it("addCartItems는 project cart 엔드포인트에 {items}를 POST한다", async () => {
    const cart = {
      cartId: 1,
      userId: 1,
      itemCount: 1,
      items: [{ rewardId: 10, quantity: 1 }],
      projects: [],
      totalItemsAmount: 0,
      totalShippingFee: 0,
      totalAmount: 0,
    };
    (apiClient.post as any).mockResolvedValue({ data: { success: true, data: cart, error: null } });
    const payload = { projectId: 5, items: [{ rewardId: 10, quantity: 1 }] };
    const result = await addCartItems(1, payload);
    expect(apiClient.post).toHaveBeenCalledWith(CART_SERVICE.items(1), payload);
    expect(result).toEqual(cart);
  });

  it("removeCartItem은 CART_SERVICE.item(userId, rewardId)를 DELETE한다", async () => {
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
    (apiClient.delete as any).mockResolvedValue({ data: { success: true, data: cart, error: null } });
    const result = await removeCartItem(1, 10);
    expect(apiClient.delete).toHaveBeenCalledWith(CART_SERVICE.item(1, 10));
    expect(result).toEqual(cart);
  });

  it("clearCart는 CART_SERVICE.cart(userId)를 DELETE한다", async () => {
    (apiClient.delete as any).mockResolvedValue({ data: { success: true, data: null, error: null } });
    await clearCart(1);
    expect(apiClient.delete).toHaveBeenCalledWith(CART_SERVICE.cart(1));
  });
});
