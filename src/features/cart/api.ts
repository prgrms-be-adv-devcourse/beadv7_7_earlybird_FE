import { apiClient } from "../../shared/api/client";
import { CART_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { AddCartItemsPayload, Cart } from "./types";

export async function fetchCart(userId: number): Promise<Cart> {
  const response = await apiClient.get<ApiResponse<Cart>>(CART_SERVICE.cart(userId));
  return response.data.data as Cart;
}

export async function addCartItems(userId: number, payload: AddCartItemsPayload): Promise<Cart> {
  const response = await apiClient.post<ApiResponse<Cart>>(CART_SERVICE.items(userId), payload);
  return response.data.data as Cart;
}

export async function removeCartItem(userId: number, rewardId: number): Promise<Cart> {
  const response = await apiClient.delete<ApiResponse<Cart>>(CART_SERVICE.item(userId, rewardId));
  return response.data.data as Cart;
}

export async function clearCart(userId: number): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(CART_SERVICE.cart(userId));
}

