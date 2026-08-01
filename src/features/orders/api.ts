import { apiClient } from "../../shared/api/client";
import { ORDER_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { Order, OrderSummary } from "./types";

export async function fetchOrders(): Promise<OrderSummary[]> {
  const response = await apiClient.get<ApiResponse<OrderSummary[]>>(ORDER_SERVICE.myOrders);
  return response.data.data ?? [];
}

export async function fetchOrder(id: number): Promise<Order> {
  const response = await apiClient.get<ApiResponse<Order>>(ORDER_SERVICE.order(id));
  return response.data.data as Order;
}

export async function cancelOrder(id: number): Promise<void> {
  await apiClient.post<ApiResponse<null>>(ORDER_SERVICE.cancel(id));
}
