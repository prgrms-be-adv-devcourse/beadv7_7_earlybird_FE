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
      return fetchCart(userId);
    },
    enabled: !!userId,
  });
}

export function useAddCartItems() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddCartItemsPayload) => {
      const currentUserId = userId ?? useAuthStore.getState().user?.id;
      if (!currentUserId) {
        throw new Error("로그인이 필요한 서비스입니다.");
      }
      return addCartItems(currentUserId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useUpdateCartItems() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCartItemsPayload) => {
      const currentUserId = userId ?? useAuthStore.getState().user?.id;
      if (!currentUserId) {
        throw new Error("로그인이 필요한 서비스입니다.");
      }
      return updateCartItems(currentUserId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useRemoveCartItem() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: number) => {
      const currentUserId = userId ?? useAuthStore.getState().user?.id;
      if (!currentUserId) {
        throw new Error("로그인이 필요한 서비스입니다.");
      }
      return removeCartItem(currentUserId, rewardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useClearCart() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const currentUserId = userId ?? useAuthStore.getState().user?.id;
      if (!currentUserId) {
        throw new Error("로그인이 필요한 서비스입니다.");
      }
      return clearCart(currentUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
