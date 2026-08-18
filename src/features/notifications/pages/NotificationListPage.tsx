import { Badge, Button, Card, EmptyState, ErrorState, RowSkeleton } from "../../../shared/ui";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "../hooks";

export function NotificationListPage() {
  const { data: notifications, isPending, isError } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  if (isPending) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState error={{ message: "알림을 불러오지 못했습니다.", errors: null }} />;
  if (notifications.length === 0) return <EmptyState message="새 알림이 없어요." />;

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex flex-col gap-2">
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="py-1.5 px-3 text-xs"
          >
            {markAllReadMutation.isPending ? "처리 중..." : "모두 읽음으로 표시"}
          </Button>
        </div>
      )}
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`flex items-center justify-between ${!notification.isRead ? "cursor-pointer" : ""}`}
          onClick={() => {
            if (!notification.isRead) markReadMutation.mutate(notification.id);
          }}
        >
          <span>{notification.message}</span>
          {!notification.isRead && <Badge tone="peach">NEW</Badge>}
        </Card>
      ))}
    </div>
  );
}
