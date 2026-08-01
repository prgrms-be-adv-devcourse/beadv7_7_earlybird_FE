import { apiClient } from "../../shared/api/client";
import { CART_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { Cart } from "./types";

export async function fetchCart(userId: number): Promise<Cart> {
  const response = await apiClient.get<ApiResponse<Cart>>(CART_SERVICE.cart(userId));
  return response.data.data as Cart;
}
