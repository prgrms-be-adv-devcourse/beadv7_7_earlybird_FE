import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { fetchCart } from "./api";

export function useCart() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ["cart", userId],
    queryFn: () => fetchCart(userId as number),
    enabled: !!userId,
  });
}
