import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { fetchNotifications } from "./api";

export function useNotifications() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ["notifications", "list", userId],
    queryFn: () => fetchNotifications(userId as number),
    enabled: !!userId,
  });
}
