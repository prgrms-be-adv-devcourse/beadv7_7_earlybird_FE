import { useParams, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
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
import { getOrderStatusLabel, getOrderStatusBadgeTone } from "../utils";

export function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = Number(id);
  const { data: order, isPending, isError } = useOrder(orderId);
  const cancelMutation = useCancelOrder(orderId);

  const isPaymentSuccess = (location.state as any)?.paymentSuccess || location.search.includes("payment=success");
  const effectiveStatus = (isPaymentSuccess || order?.status === "PAID") ? "PAID" : order?.status;

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
    <div className="flex flex-col gap-4">
      {/* Payment Success Toast Banner */}
      {isPaymentSuccess && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-mint bg-mint/15 p-4 text-ink shadow-stamp-sm">
          <CheckCircle2 className="h-6 w-6 text-mint shrink-0" />
          <div>
            <h2 className="font-bold text-sm">🎉 결제가 완료되었습니다!</h2>
            <p className="text-xs text-mist">주문이 성공적으로 접수되었습니다. 마이페이지 ➔ 주문 내역에서 언제든 확인할 수 있습니다.</p>
          </div>
        </div>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between border-b border-ink/10 pb-3">
          <h1 className="font-display text-2xl font-bold text-ink">주문 상세 정보 #{order.id}</h1>
          <Badge tone={getOrderStatusBadgeTone(effectiveStatus || "CREATED")}>
            {getOrderStatusLabel(effectiveStatus || "CREATED")}
          </Badge>
        </div>

        <div className="mb-4 flex flex-col gap-1 rounded-sm bg-surface p-3 text-xs text-mist">
          <div>받는 분: <strong className="text-ink">{order.receiverName}</strong> ({order.receiverPhone})</div>
          <div>배송지 주소: <strong className="text-ink">[{order.zipCode}] {order.shippingAddress}</strong></div>
        </div>

        <h2 className="mb-2 font-display text-base font-bold text-ink">주문한 리워드 항목</h2>
        <ul className="mb-4 flex flex-col gap-2">
          {order.orderItems.map((item) => (
            <li key={item.id} className="flex justify-between rounded-sm border border-ink/20 p-3">
              <span className="font-medium text-ink">
                {item.name} <span className="text-mist">x {item.quantity}개</span>
              </span>
              <span className="tabular-nums font-bold text-ink">{item.subtotal.toLocaleString()}원</span>
            </li>
          ))}
        </ul>

        <div className="mb-6 flex flex-col gap-1 border-t border-ink/10 pt-3 text-right">
          <div className="text-xs text-mist">상품 금액: {order.itemsAmount.toLocaleString()}원 | 배송비: {order.shippingFee.toLocaleString()}원</div>
          <div className="tabular-nums text-xl font-bold text-brand">
            총 결제 금액: {order.totalAmount.toLocaleString()}원
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {effectiveStatus !== "PAID" && effectiveStatus !== "CANCELLED" && (
            <Button
              type="button"
              onClick={() => navigate(`/checkout/${order.id}`)}
              className="flex-1 py-3 text-sm font-bold text-white shadow-stamp hover:scale-[1.01] transition-transform"
            >
              💳 {order.totalAmount.toLocaleString()}원 결제하기
            </Button>
          )}

          {order.status !== "CANCELLED" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" disabled={cancelMutation.isPending} className="py-3">
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
        </div>
      </Card>
    </div>
  );
}
