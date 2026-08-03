import { Badge, Card, EmptyState, ErrorState, RowSkeleton } from "../../../shared/ui";
import { useNotifications } from "../hooks";

export function NotificationListPage() {
  const { data: notifications, isPending, isError } = useNotifications();

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

  return (
    <div className="flex flex-col gap-2">
      {notifications.map((notification) => (
        <Card key={notification.id} className="flex items-center justify-between">
          <span>{notification.message}</span>
          {!notification.isRead && <Badge tone="peach">NEW</Badge>}
        </Card>
      ))}
    </div>
  );
}
