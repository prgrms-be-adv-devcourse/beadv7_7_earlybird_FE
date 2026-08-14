import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { fetchOrders, fetchOrder, cancelOrder, placeOrder } from "./api";
import type { PlaceOrderRequest } from "./types";

export function useOrders() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ["orders", "list", userId],
    queryFn: () => fetchOrders(userId as number),
    enabled: !!userId,
  });
}

export function useOrder(id: number) {
  return useQuery({ queryKey: ["orders", "detail", id], queryFn: () => fetchOrder(id) });
}

export function useCancelOrder(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
    },
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PlaceOrderRequest) => placeOrder(data),
    onSuccess: () => {
      // 백엔드에서 주문 생성 시 장바구니 항목이 자동 삭제되므로,
      // 프론트엔드에서는 장바구니 및 관련 쿼리 캐시만 갱신(invalidate)합니다.
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}

