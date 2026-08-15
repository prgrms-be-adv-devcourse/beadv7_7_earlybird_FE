import { apiClient } from "../../shared/api/client";
import { NOTIFICATION_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { Notification } from "./types";

export async function fetchNotifications(userId: number): Promise<Notification[]> {
  const response = await apiClient.get<ApiResponse<Notification[]>>(NOTIFICATION_SERVICE.notifications, {
    params: { userId },
  });
  return response.data.data ?? [];
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  await apiClient.patch<ApiResponse<null>>(NOTIFICATION_SERVICE.read(notificationId));
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch<ApiResponse<null>>(NOTIFICATION_SERVICE.readAll);
}
