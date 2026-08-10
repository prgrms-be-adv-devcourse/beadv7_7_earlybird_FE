import { apiClient } from "../../shared/api/client";
import { ORDER_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { Order, OrderSummary } from "./types";

export async function fetchOrders(userId: number): Promise<OrderSummary[]> {
  const response = await apiClient.get<ApiResponse<OrderSummary[]>>(ORDER_SERVICE.myOrders, {
    params: { userId },
  });
  return response.data.data ?? [];
}

export async function fetchOrder(id: number): Promise<Order> {
  const response = await apiClient.get<ApiResponse<Order>>(ORDER_SERVICE.order(id));
  return response.data.data as Order;
}

export async function cancelOrder(id: number): Promise<void> {
  await apiClient.post<ApiResponse<null>>(ORDER_SERVICE.cancel(id));
}

export async function placeOrder(data: import("./types").PlaceOrderRequest): Promise<Order> {
  const response = await apiClient.post<ApiResponse<Order>>(ORDER_SERVICE.orders, data);
  return response.data.data as Order;
}

