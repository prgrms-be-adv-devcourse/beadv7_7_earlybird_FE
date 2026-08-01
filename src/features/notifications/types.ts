// notification-service NotificationController 실제 응답 DTO 확인 완료.
// NotificationResponse(Long id, Long userId, String type, String message, boolean isRead, LocalDateTime createdAt)
export interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
