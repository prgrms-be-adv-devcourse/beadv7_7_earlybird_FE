import { useMutation } from "@tanstack/react-query";
import { confirmPayment } from "./api";
import type { PaymentConfirmRequest } from "./types";

export function useConfirmPayment() {
  return useMutation({ mutationFn: (request: PaymentConfirmRequest) => confirmPayment(request) });
}
