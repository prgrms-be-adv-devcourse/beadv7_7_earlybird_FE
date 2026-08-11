import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmPayment, preparePayment } from "./api";
import type { PaymentConfirmRequest, PaymentPrepareRequest } from "./types";

export function usePreparePayment() {
  return useMutation({
    mutationFn: (request: PaymentPrepareRequest) => preparePayment(request),
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: PaymentConfirmRequest) => confirmPayment(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

