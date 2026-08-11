import {useMutation, useQueryClient} from "@tanstack/react-query";
import {confirmPayment} from "./api";
import type {PaymentConfirmRequest} from "./types";

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
