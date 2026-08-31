import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import {useQueryClient} from "@tanstack/react-query";
import {CheckCircle2, Loader2, Star} from "lucide-react";
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
import {useCancelOrder, useOrder, useOrders} from "../hooks";
import {useConfirmPayment} from "../../payments/hooks";
import {useFilesByOwner} from "../../files/hooks";
import {getOrderDisplayNumber, getOrderStatusBadgeTone, getOrderStatusLabel} from "../utils";
import {OrderReviewModal} from "../components/OrderReviewModal";
import {PaymentSuccessMascot} from "../components/PaymentSuccessMascot";
import type {OrderItem} from "../types";

// 추가 : 주문 상세 리워드의 썸네일과 주문 정보를 표시합니다.
function OrderDetailRewardItem({
  item,
  isPaid,
  onOpenReview,
}: {
  item: OrderItem;
  isPaid: boolean;
  onOpenReview: (rewardId: number) => void;
}) {
  const {data: files} = useFilesByOwner("REWARD", item.rewardId, true);
  const thumbnailUrl = files?.[0]?.storedUrl;

  return (
    <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-sm border border-ink/20 p-3 bg-surface/50">
      <div className="flex min-w-0 items-center gap-3">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={item.name}
            className="h-16 w-16 shrink-0 rounded-sm border border-ink/20 bg-paper object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm border border-dashed border-ink/40 bg-paper px-1 text-center text-[9px] leading-tight text-mist">
            이미지 준비중입니다
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
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
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        <span className="tabular-nums font-bold text-ink">{item.subtotal.toLocaleString()}원</span>
        {isPaid && (
          <Button
            type="button"
            variant="primary"
            className="text-xs font-bold py-1 px-2.5 flex items-center gap-1 shadow-none"
            onClick={() => onOpenReview(item.rewardId)}
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>후기 쓰기</span>
          </Button>
        )}
      </div>
    </li>
  );
}

export function OrderDetailPage() {
  const {id} = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orderId = Number(id);
  const {data: order, isPending, isError, refetch: refetchOrder} = useOrder(orderId);
  const {data: myOrders} = useOrders();
  const displayNumber = getOrderDisplayNumber(orderId, myOrders?.map((o) => o.id) ?? [orderId]);
  const cancelMutation = useCancelOrder(orderId);
  const {mutate: confirmPayment, isPending: isConfirmingPayment} = useConfirmPayment();
  const hasRequestedConfirmation = useRef(false);
  const previousStatusRef = useRef<string | undefined>(undefined);
  const hasCelebratedRef = useRef(false);

  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
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

  useLayoutEffect(() => {
    if (isRedirectingFromToss && !hasRequestedConfirmation.current) {
      hasRequestedConfirmation.current = true; // 동일 Toss 콜백 중복 승인 방지
      setConfirmError(null);

      navigate(`/orders/${orderId}`, {replace: true});

      confirmPayment(
          {
            paymentKey: paymentKeyParam!,
            pgOrderId: pgOrderIdParam!,
            amount: Number(amountParam!),
          },
          {
            onSuccess: async () => {
              await queryClient.invalidateQueries({queryKey: ["orders", "detail", orderId]});
              await queryClient.invalidateQueries({queryKey: ["orders"]});
              await refetchOrder();
            },
            onError: async (err: any) => {
              console.error("Payment confirm error:", err);
              const rawMsg =
                  err?.response?.data?.error?.message ||
                  err?.response?.data?.message ||
                  err?.message ||
                  "";

              // 이미 승인된 결제는 실패가 아니라 결제 완료 상태이므로 성공으로 수렴 처리
              if (rawMsg.includes("이미 승인된 결제") || rawMsg.includes("ALREADY_APPROVED")) {
                setConfirmError(null);
                await queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
                await queryClient.invalidateQueries({ queryKey: ["orders"] });
                const updated = await refetchOrder();
                if (updated.data?.status === "PAID" && !hasCelebratedRef.current) {
                  hasCelebratedRef.current = true;
                  setShowCelebration(true);
                }
                return;
              }

              const cleanMsg =
                rawMsg.replace(/\s*\(?pgOrderId\s*=\s*[a-zA-Z0-9_-]+\)?/gi, "").trim() ||
                "결제 승인 처리 중 오류가 발생했습니다.";

              setConfirmError(cleanMsg);
              await queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
              await queryClient.invalidateQueries({ queryKey: ["orders"] });
              await refetchOrder();
            },
          }
      );
    }
  }, [isRedirectingFromToss, paymentKeyParam, pgOrderIdParam, amountParam, orderId, navigate, confirmPayment, queryClient, refetchOrder]);

  // 결제 완료(PAID) 전이를 직접 감지해서 마스코트를 띄운다 — confirmPayment 응답보다 백엔드
  // Kafka 이벤트+useOrder의 1초 폴링이 먼저 PAID를 반영해버리는 경우가 있어서(레이스 컨디션),
  // "성공 콜백에서만 트리거"하면 그 케이스에서 못 뜨는 문제가 있었다. 이 세션에서 이미 PAID가
  // 아니었던 상태에서 PAID로 바뀌는 순간이거나 토스 리다이렉트로 진입해 PAID가 확인된 경우만 잡으므로,
  // 이미 결제된 주문을 나중에 다시 봐도 재생 안 됨.
  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    const transitionedToPaid = order?.status === "PAID" && previousStatus !== undefined && previousStatus !== "PAID";
    const justReturnedFromTossPaid = order?.status === "PAID" && isRedirectingFromToss;

    if ((transitionedToPaid || justReturnedFromTossPaid) && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      setShowCelebration(true);
    }
    previousStatusRef.current = order?.status;
  }, [order?.status, isRedirectingFromToss]);

  // Source of Truth: 서버에서 반환된 실제 order.status만 유일한 기준으로 사용!
  const isPaid = order?.status === "PAID";
  const effectiveStatus = order?.status;
  const isProcessingPayment = (effectiveStatus === "CREATED" || effectiveStatus === "PAYMENT_PENDING") && !confirmError && (isConfirmingPayment || isRedirectingFromToss); // <-- 결제 대기 상태에서만 확인 배너를 표시합니다.
  const isCancellingOrder = cancelMutation.isPending; // <-- 주문 취소 요청 중 상단 진행 안내를 표시합니다.

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
      {/* Payment Confirming Progress Banner */}
      {isProcessingPayment && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-brand/40 bg-brand/10 p-4 text-ink shadow-stamp-sm animate-pulse">
          <Loader2 className="h-6 w-6 animate-spin text-brand shrink-0" />
          <div>
            <h2 className="font-bold text-sm">결제 여부 확인 중...</h2>
            <p className="text-xs text-mist">오목눈이가 결제 여부를 확인하고 있습니다. 잠시만 기다려주세요.</p>
          </div>
        </div>
      )}

      {/* 추가 : 주문 취소 처리 중 안내 */}
      {isCancellingOrder && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-brand/40 bg-brand/10 p-4 text-ink shadow-stamp-sm animate-pulse">
          <Loader2 className="h-6 w-6 animate-spin text-brand shrink-0" />
          <div>
            <h2 className="font-bold text-sm">주문 취소 처리 중...</h2>
            <p className="text-xs text-mist">주문 취소와 환불 절차를 확인하고 있습니다. 잠시만 기다려주세요.</p>
          </div>
        </div>
      )}

      {/* 추가 : 주문 취소 상태 안내 */}
      {effectiveStatus === "CANCELLED" && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-brand/40 bg-brand/10 p-4 text-ink shadow-stamp-sm"> {/* <-- 결제 확인 배너와 색상을 통일합니다. */}
          <div>
            <h2 className="font-bold text-sm">주문이 취소되었습니다.</h2>
            <p className="text-xs text-mist">결제된 금액은 환불 절차에 따라 처리됩니다.</p>
          </div>
        </div>
      )}

      {/* Payment Success Toast Banner (실제 order.status === "PAID"일 때만 표시) */}
      {isPaid && !isCancellingOrder && ( // <-- 주문 취소 처리 중에는 완료 배너 대신 진행 안내를 표시합니다.
        <div className="relative flex items-center gap-3 rounded-lg border-2 border-mint bg-mint/15 p-4 text-ink shadow-stamp-sm">
          {showCelebration && <PaymentSuccessMascot />}
          <CheckCircle2 className="h-6 w-6 text-mint shrink-0" />
          <div>
            <h2 className="font-bold text-sm">🎉 후원자님의 후원이 잘 전달됐어요</h2>
            <p className="text-xs text-mist">후원자님 덕분에 프로젝트가 목표에 한 걸음 다가갔어요. 상세 내용은 마이페이지 ➔ 주문 내역에서 언제든 확인할 수 있습니다.</p>
          </div>
        </div>
      )}

      {/* Payment Confirmation Failure Banner */}
      {confirmError && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-4 text-red-700 shadow-stamp-sm">
          <div>
            <h2 className="font-bold text-sm">⚠️ 결제 승인 실패</h2>
            <p className="text-xs text-red-600 mt-0.5">{confirmError}</p>
          </div>
        </div>
      )}

      {/* Payment Failure / Timeout Alert Banner */}
      {(effectiveStatus === "PAYMENT_FAILED" || effectiveStatus === "STOCK_FAILED") && !confirmError && (
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

        <div className="mb-4 flex flex-col gap-1 rounded-sm bg-surface text-sm text-mist">
          <div>받는 분: <strong className="text-ink">{order.receiverName}</strong> ({order.receiverPhone})</div>
          <div>배송지 주소: <strong className="text-ink">[{order.zipCode}] {order.shippingAddress}</strong></div>
        </div>

        <h2 className="mb-2 font-display text-base font-bold text-ink">주문한 리워드 항목</h2>
        <ul className="mb-4 flex flex-col gap-2">
          {order.orderItems.map((item) => (
            <OrderDetailRewardItem
              key={item.id}
              item={item}
              isPaid={isPaid}
              onOpenReview={handleOpenReview}
            /> // <-- 리워드 사진을 포함한 주문 항목을 표시합니다.
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

          {(effectiveStatus === "CREATED" || effectiveStatus === "PAYMENT_PENDING") && (
            <Button
              type="button"
              disabled={isProcessingPayment}
              onClick={() => navigate(`/checkout/${order.id}`)}
              className="flex-1 py-3 text-sm font-bold text-white shadow-stamp hover:scale-[1.01] transition-transform disabled:opacity-50"
            >
              {isProcessingPayment ? "결제 승인 처리 중..." : `💳 ${order.totalAmount.toLocaleString()}원 결제하기`}
            </Button>
          )}

          {effectiveStatus === "PAID" && (
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
                      <Button onClick={async () => {
                        try {
                          await cancelMutation.mutateAsync();
                          await refetchOrder(); // <-- 취소 완료 상태를 상세 화면에 즉시 반영합니다.
                        } catch {
                          await refetchOrder(); // <-- 실패 응답 후 실제 주문 상태를 재확인합니다.
                        }
                      }}>취소하기</Button>
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
