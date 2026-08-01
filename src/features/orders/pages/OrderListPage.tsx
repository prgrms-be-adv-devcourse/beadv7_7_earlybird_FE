import { Link } from "react-router-dom";
import { Badge, Card, EmptyState, ErrorState, Spinner } from "../../../shared/ui";
import { useOrders } from "../hooks";

export function OrderListPage() {
  const { data: orders, isPending, isError } = useOrders();

  if (isPending) return <Spinner label="주문 불러오는 중..." />;
  if (isError) return <ErrorState error={{ message: "주문 목록을 불러오지 못했습니다.", errors: null }} />;
  if (orders.length === 0) return <EmptyState message="아직 주문이 없어요." />;

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <Link key={order.id} to={`/orders/${order.id}`}>
          <Card className="flex items-center justify-between">
            <span>주문 #{order.id}</span>
            <Badge tone="peach">{order.status}</Badge>
            <span>{order.totalAmount.toLocaleString()}원</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
