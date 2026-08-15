import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "./api";

export function useNotifications() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ["notifications", "list", userId],
    queryFn: () => fetchNotifications(userId as number),
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) => markNotificationRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
