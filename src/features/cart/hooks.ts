import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { addCartItems, fetchCart, removeCartItem, clearCart, updateCartItems } from "./api";
import type { AddCartItemsPayload, UpdateCartItemsPayload } from "./types";

export function useCart() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ["cart", "detail", userId],
    queryFn: () => {
      if (!userId) throw new Error("로그인이 필요합니다.");
      return fetchCart();
    },
    enabled: !!userId,
  });
}

export function useAddCartItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddCartItemsPayload) => {
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error("로그인이 필요한 서비스입니다.");
      }
      return addCartItems(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useUpdateCartItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCartItemsPayload) => {
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error("로그인이 필요한 서비스입니다.");
      }
      return updateCartItems(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: number) => {
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error("로그인이 필요한 서비스입니다.");
      }
      return removeCartItem(rewardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error("로그인이 필요한 서비스입니다.");
      }
      return clearCart();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
