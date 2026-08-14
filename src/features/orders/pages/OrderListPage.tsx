import { Link } from "react-router-dom";
import { Badge, Card, EmptyState, ErrorState, RowSkeleton } from "../../../shared/ui";
import { useOrders } from "../hooks";
import { getOrderStatusLabel, getOrderStatusBadgeTone, getOrderDisplayNumber } from "../utils";

export function OrderListPage() {
  const { data: orders, isPending, isError } = useOrders();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState error={{ message: "주문 목록을 불러오지 못했습니다.", errors: null }} />;
  if (orders.length === 0) return <EmptyState message="아직 주문이 없어요." />;

  const sortedOrders = [...orders].sort((a, b) => b.id - a.id);
  const allOrderIds = orders.map((order) => order.id);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-2xl font-bold text-ink mb-2">📦 내 주문 내역</h1>
      {sortedOrders.map((order) => (
        <Link key={order.id} to={`/orders/${order.id}`}>
          <Card className="flex items-center justify-between transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-stamp-lg">
            <div className="flex items-center gap-3">
              <span className="font-bold text-ink">주문 #{getOrderDisplayNumber(order.id, allOrderIds)}</span>
              <Badge tone={getOrderStatusBadgeTone(order.status)}>{getOrderStatusLabel(order.status)}</Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="tabular-nums font-bold text-ink">{order.totalAmount.toLocaleString()}원</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
