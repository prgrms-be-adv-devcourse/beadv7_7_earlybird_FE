import { apiClient } from "../../shared/api/client";
import { CART_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { AddCartItemsPayload, Cart, UpdateCartItemsPayload } from "./types";

export async function fetchCart(): Promise<Cart> {
  const response = await apiClient.get<ApiResponse<Cart>>(CART_SERVICE.cart);
  return response.data.data as Cart;
}

export async function addCartItems(payload: AddCartItemsPayload): Promise<Cart> {
  const response = await apiClient.post<ApiResponse<Cart>>(CART_SERVICE.items, payload);
  return response.data.data as Cart;
}

export async function updateCartItems(payload: UpdateCartItemsPayload): Promise<Cart> {
  const response = await apiClient.patch<ApiResponse<Cart>>(CART_SERVICE.items, payload);
  return response.data.data as Cart;
}

export async function removeCartItem(rewardId: number): Promise<Cart> {
  const response = await apiClient.delete<ApiResponse<Cart>>(CART_SERVICE.item(rewardId));
  return response.data.data as Cart;
}

export async function clearCart(): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(CART_SERVICE.cart);
}


