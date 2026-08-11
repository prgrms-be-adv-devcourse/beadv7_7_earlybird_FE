import { apiClient } from "../../shared/api/client";
import { PAYMENT_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { Payment, PaymentConfirmRequest, PaymentPrepareRequest, PaymentPrepareResponse } from "./types";

export async function preparePayment(request: PaymentPrepareRequest): Promise<PaymentPrepareResponse> {
  const response = await apiClient.post<ApiResponse<PaymentPrepareResponse>>(PAYMENT_SERVICE.prepare, request);
  return (response.data.data ?? response.data) as PaymentPrepareResponse;
}

export async function confirmPayment(request: PaymentConfirmRequest): Promise<Payment> {
  const response = await apiClient.post<ApiResponse<Payment>>(PAYMENT_SERVICE.confirm, request);
  return response.data.data as Payment;
}

