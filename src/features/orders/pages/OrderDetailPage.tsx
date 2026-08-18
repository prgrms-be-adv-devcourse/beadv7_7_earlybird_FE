import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Star } from "lucide-react";
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
import { useCancelOrder, useOrder, useOrders } from "../hooks";
import { useConfirmPayment } from "../../payments/hooks";
import { getOrderStatusBadgeTone, getOrderStatusLabel, getOrderDisplayNumber } from "../utils";
import { OrderReviewModal } from "../components/OrderReviewModal";

export function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orderId = Number(id);
  const { data: order, isPending, isError } = useOrder(orderId);
  const { data: myOrders } = useOrders();
  const displayNumber = getOrderDisplayNumber(orderId, myOrders?.map((o) => o.id) ?? [orderId]);
  const cancelMutation = useCancelOrder(orderId);
  const { mutate: confirmPayment } = useConfirmPayment();
  const hasRequestedConfirmation = useRef(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRewardIdForReview, setSelectedRewardIdForReview] = useState<number | undefined>(undefined);

  const handleOpenReview = (rewardId?: number) => {
    setSelectedRewardIdForReview(rewardId);
    setReviewModalOpen(true);
  };

  const searchParams = new URLSearchParams(location.search);
  const paymentKeyParam = searchParams.get("paymentKey");
  const pgOrderIdParam = searchParams.get("orderId");
  const amountParam = searchParams.get("amount");
  const isRedirectingFromToss = Boolean(paymentKeyParam && pgOrderIdParam && amountParam);

  useEffect(() => {
    if (isRedirectingFromToss && !hasRequestedConfirmation.current) {
      hasRequestedConfirmation.current = true; // <-- 동일 Toss 콜백 중복 승인 방지
      confirmPayment(
        {
          paymentKey: paymentKeyParam!,
          pgOrderId: pgOrderIdParam!,
          amount: Number(amountParam!),
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            navigate(`/orders/${orderId}`, { replace: true, state: { paymentSuccess: true } });
          },
          onError: (err) => {
            console.error("Payment confirm error:", err);
          },
        }
      );
    }
  }, [isRedirectingFromToss, paymentKeyParam, pgOrderIdParam, amountParam, orderId, navigate, confirmPayment, queryClient]);

  const isPaymentSuccess = Boolean(
    (location.state as any)?.paymentSuccess ||
    location.search.includes("payment=success") ||
    isRedirectingFromToss ||
    order?.status === "PAID"
  );
  const effectiveStatus = isPaymentSuccess ? "PAID" : order?.status;

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

      {/* Payment Failure / Timeout Alert Banner */}
      {(effectiveStatus === "PAYMENT_FAILED" || effectiveStatus === "STOCK_FAILED") && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-4 text-red-700 shadow-stamp-sm">
          <div>
            <h2 className="font-bold text-sm">⚠️ 결제를 완료할 수 없는 주문입니다</h2>
            <p className="text-xs text-red-600 mt-0.5">
              {effectiveStatus === "STOCK_FAILED"
                ? "리워드 재고 부족으로 인해 주문이 실패 처리되었습니다."
                : "결제 타임아웃(시간 초과) 또는 결제 승인 실패로 인해 처리할 수 없는 주문입니다. 다시 시도하려면 새로 주문해 주세요."}
            </p>
          </div>
        </div>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between border-b border-ink/10 pb-3">
          <h1 className="font-display text-2xl font-bold text-ink">주문 상세 정보 #{displayNumber}</h1>
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
            <li
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-sm border border-ink/20 p-3 bg-surface/50"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-ink">
                  {item.name} <span className="text-mist font-normal">x {item.quantity}개</span>
                </span>
                <Link
                  to={`/projects/${item.projectId}`}
                  className="text-[11px] font-semibold text-brand hover:underline self-start"
                >
                  프로젝트 바로가기 ➔
                </Link>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="tabular-nums font-bold text-ink">{item.subtotal.toLocaleString()}원</span>
                {effectiveStatus === "PAID" && (
                  <Button
                    type="button"
                    variant="primary"
                    className="text-xs font-bold py-1 px-2.5 flex items-center gap-1 shadow-none"
                    onClick={() => handleOpenReview(item.rewardId)}
                  >
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span>후기 쓰기</span>
                  </Button>
                )}
              </div>
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
          {effectiveStatus === "PAID" && (
            <Button
              type="button"
              onClick={() => handleOpenReview()}
              className="flex-1 py-3 text-sm font-bold text-white shadow-stamp hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
            >
              <Star className="h-4 w-4 fill-current" />
              <span>✍️ 리워드 후기 작성하기</span>
            </Button>
          )}

          {effectiveStatus !== "PAID" &&
            effectiveStatus !== "CANCELLED" &&
            effectiveStatus !== "PAYMENT_FAILED" &&
            effectiveStatus !== "STOCK_FAILED" && (
              <Button
                type="button"
                onClick={() => navigate(`/checkout/${order.id}`)}
                className="flex-1 py-3 text-sm font-bold text-white shadow-stamp hover:scale-[1.01] transition-transform"
              >
                💳 {order.totalAmount.toLocaleString()}원 결제하기
              </Button>
            )}

          {effectiveStatus !== "CANCELLED" &&
            effectiveStatus !== "PAYMENT_FAILED" &&
            effectiveStatus !== "STOCK_FAILED" && (
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

      {/* Order Review Modal */}
      {order && (
        <OrderReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          orderItems={order.orderItems}
          defaultRewardId={selectedRewardIdForReview}
        />
      )}
    </div>
  );
}
