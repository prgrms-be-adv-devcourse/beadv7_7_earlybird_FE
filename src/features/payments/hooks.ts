import {useMutation, useQueryClient} from "@tanstack/react-query";
import {confirmPayment} from "./api";
import type {PaymentConfirmRequest} from "./types";
import {clearCart} from "../cart/api";

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: PaymentConfirmRequest) => confirmPayment(request),
    onSuccess: async () => {
      try {
        await clearCart(); // <-- 결제 완료 후 서버 장바구니를 비웁니다.
      } catch (error) {
        console.error("Cart clear error after payment:", error); // <-- 장바구니 삭제 실패가 결제 성공을 실패 처리하지 않게 합니다.
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
