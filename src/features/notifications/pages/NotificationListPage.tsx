import { Badge, Card, EmptyState, ErrorState, Spinner } from "../../../shared/ui";
import { useNotifications } from "../hooks";

export function NotificationListPage() {
  const { data: notifications, isPending, isError } = useNotifications();

  if (isPending) return <Spinner label="알림 불러오는 중..." />;
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
