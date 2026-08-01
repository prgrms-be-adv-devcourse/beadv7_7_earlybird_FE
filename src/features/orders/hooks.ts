import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrders, fetchOrder, cancelOrder } from "./api";

export function useOrders() {
  return useQuery({ queryKey: ["orders"], queryFn: fetchOrders });
}

export function useOrder(id: number) {
  return useQuery({ queryKey: ["orders", id], queryFn: () => fetchOrder(id) });
}

export function useCancelOrder(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", id] }),
  });
}
