import { useParams } from "react-router-dom";
import { Badge, Button, Card, ErrorState, Spinner } from "../../../shared/ui";
import { useOrder, useCancelOrder } from "../hooks";

export function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const { data: order, isPending, isError } = useOrder(orderId);
  const cancelMutation = useCancelOrder(orderId);

  if (isPending) return <Spinner label="주문 불러오는 중..." />;
  if (isError || !order) return <ErrorState error={{ message: "주문을 불러오지 못했습니다.", errors: null }} />;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="font-jua text-2xl">주문 #{order.id}</h1>
        <Badge tone="peach">{order.status}</Badge>
      </div>
      <ul className="mb-3 flex flex-col gap-2">
        {order.orderItems.map((item) => (
          <li key={item.id} className="flex justify-between rounded-2xl bg-mint/10 p-3">
            <span>
              {item.name} x {item.quantity}
            </span>
            <span>{item.subtotal.toLocaleString()}원</span>
          </li>
        ))}
      </ul>
      <p className="mb-3 font-semibold">총 {order.totalAmount.toLocaleString()}원</p>
      {order.status !== "CANCELLED" && (
        <Button variant="secondary" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
          {cancelMutation.isPending ? "취소 중..." : "주문 취소"}
        </Button>
      )}
    </Card>
  );
}
