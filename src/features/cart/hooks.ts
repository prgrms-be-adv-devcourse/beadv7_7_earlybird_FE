import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { addCartItems, fetchCart, removeCartItem, clearCart } from "./api";
import type { AddCartItemsPayload } from "./types";

export function useCart() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ["cart", "detail", userId],
    queryFn: () => fetchCart(userId as number),
    enabled: !!userId,
  });
}

export function useAddCartItems() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddCartItemsPayload) => addCartItems(userId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", "detail", userId] });
    },
  });
}

export function useRemoveCartItem() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: number) => removeCartItem(userId as number, rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", "detail", userId] });
    },
  });
}

export function useClearCart() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearCart(userId as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", "detail", userId] });
    },
  });
}

