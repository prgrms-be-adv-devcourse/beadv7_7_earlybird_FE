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
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

