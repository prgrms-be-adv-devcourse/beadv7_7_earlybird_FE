import {apiClient} from "../../shared/api/client";
import {PAYMENT_SERVICE} from "../../shared/api/endpoints";
import type {ApiResponse} from "../../shared/types/ApiResponse";
import type {Payment, PaymentConfirmRequest} from "./types";

export async function getPaymentByOrderId(orderId: number): Promise<Payment> {
  const response = await apiClient.get<ApiResponse<Payment>>(PAYMENT_SERVICE.paymentByOrder(orderId));
  return response.data.data as Payment;
}

export async function confirmPayment(request: PaymentConfirmRequest): Promise<Payment> {
  const response = await apiClient.post<ApiResponse<Payment>>(PAYMENT_SERVICE.confirm, request);
  return response.data.data as Payment;
}
