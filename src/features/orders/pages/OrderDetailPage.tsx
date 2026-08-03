import { useParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  ErrorState,
  RowSkeleton,
  Skeleton,
} from "../../../shared/ui";
import { useOrder, useCancelOrder } from "../hooks";

export function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const { data: order, isPending, isError } = useOrder(orderId);
  const cancelMutation = useCancelOrder(orderId);

  if (isPending) {
    return (
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-7 w-40" />
        <RowSkeleton />
        <RowSkeleton />
        <Skeleton className="h-6 w-32" />
      </Card>
    );
  }
  if (isError || !order) return <ErrorState error={{ message: "주문을 불러오지 못했습니다.", errors: null }} />;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">주문 #{order.id}</h1>
        <Badge tone="peach">{order.status}</Badge>
      </div>
      <ul className="mb-3 flex flex-col gap-2">
        {order.orderItems.map((item) => (
          <li key={item.id} className="flex justify-between rounded-sm border border-ink/20 p-3">
            <span>
              {item.name} x {item.quantity}
            </span>
            <span className="tabular-nums text-sm">{item.subtotal.toLocaleString()}원</span>
          </li>
        ))}
      </ul>
      <p className="mb-3 tabular-nums text-lg font-semibold text-ink">
        총 {order.totalAmount.toLocaleString()}원
      </p>
      {order.status !== "CANCELLED" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary" disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "취소 중..." : "주문 취소"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>주문을 취소할까요?</AlertDialogTitle>
            <AlertDialogDescription className="mt-1">
              취소하면 되돌릴 수 없어요. 결제된 금액은 환불 절차에 따라 처리돼요.
            </AlertDialogDescription>
            <div className="mt-4 flex justify-end gap-2">
              <AlertDialogCancel asChild>
                <Button variant="ghost">돌아가기</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button onClick={() => cancelMutation.mutate()}>취소하기</Button>
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
