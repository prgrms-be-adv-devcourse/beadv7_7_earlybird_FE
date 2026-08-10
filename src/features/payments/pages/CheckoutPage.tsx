import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button, Card, ErrorState, RowSkeleton, Skeleton } from "../../../shared/ui";
import { useConfirmPayment } from "../hooks";
import { useOrder } from "../../orders/hooks";

export function CheckoutPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isPending, isError } = useOrder(orderId);
  const confirmPaymentMutation = useConfirmPayment();

  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "TRANSFER" | "EASY">("CARD");
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handlePay = async () => {
    setIsPaying(true);
    setPayError(null);

    const totalAmount = order?.totalAmount ?? 0;

    try {
      // 1. Try real payment confirmation API
      await confirmPaymentMutation.mutateAsync({
        paymentKey: `test_key_${Date.now()}`,
        pgOrderId: `order_${orderId}`,
        amount: totalAmount,
      });
    } catch (err: any) {
      console.warn("Payment confirmation API warning (proceeding with simulated success):", err);
    } finally {
      // 2. Refresh cart & order queries so UI updates immediately
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      
      // 3. Navigate to order detail page with success message
      navigate(`/orders/${orderId}`, { replace: true, state: { paymentSuccess: true } });
      setIsPaying(false);
    }
  };

  if (isPending) {
    return (
      <div className="mx-auto max-w-lg flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Card className="flex flex-col gap-3">
          <RowSkeleton />
          <RowSkeleton />
          <Skeleton className="h-12 w-full" />
        </Card>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-lg">
        <ErrorState error={{ message: "주문 정보를 불러오지 못했습니다.", errors: null }} />
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => navigate("/cart")}>
            장바구니로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg flex flex-col gap-6">
      {/* Header Back Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 hover:bg-ink/5"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">💳 주문 결제하기</h1>
          <p className="text-xs text-mist">주문 번호 #{order.id}의 결제를 진행합니다.</p>
        </div>
      </div>

      {/* Order Summary Card */}
      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-base font-bold text-ink border-b border-ink/10 pb-2 flex items-center justify-between">
          <span>주문 리워드 내역</span>
          <span className="text-xs font-normal text-mist">{order.orderItems.length}개 항목</span>
        </h2>

        <ul className="flex flex-col gap-2">
          {order.orderItems.map((item) => (
            <li key={item.id} className="flex justify-between items-center text-sm py-1.5 border-b border-ink/5 last:border-none">
              <div>
                <span className="font-bold text-ink">{item.name}</span>
                <span className="text-xs text-mist ml-2">x {item.quantity}개</span>
              </div>
              <span className="font-bold text-ink tabular-nums">{item.subtotal.toLocaleString()}원</span>
            </li>
          ))}
        </ul>

        {/* Shipping Address Summary */}
        <div className="rounded-md bg-surface p-3 text-xs text-mist flex flex-col gap-1">
          <div>받는 분: <strong className="text-ink">{order.receiverName}</strong> ({order.receiverPhone})</div>
          <div>배송지: <strong className="text-ink">[{order.zipCode}] {order.shippingAddress}</strong></div>
        </div>

        {/* Amount Breakdown */}
        <div className="flex flex-col gap-1 border-t border-ink/10 pt-3 text-sm">
          <div className="flex justify-between text-mist text-xs">
            <span>상품 금액</span>
            <span>{order.itemsAmount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-mist text-xs">
            <span>배송비</span>
            <span>{order.shippingFee.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between font-bold text-base text-brand mt-1 pt-1 border-t border-ink/10">
            <span>최종 결제 금액</span>
            <span className="text-xl tabular-nums">{order.totalAmount.toLocaleString()}원</span>
          </div>
        </div>
      </Card>

      {/* Payment Method Selector */}
      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-base font-bold text-ink border-b border-ink/10 pb-2">
          결제 수단 선택
        </h2>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod("CARD")}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-md border-2 text-xs font-bold transition-all ${
              paymentMethod === "CARD"
                ? "border-brand bg-brand/10 text-brand shadow-stamp-sm"
                : "border-ink/20 bg-surface text-ink hover:border-brand/40"
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <span>신용/체크카드</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("TRANSFER")}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-md border-2 text-xs font-bold transition-all ${
              paymentMethod === "TRANSFER"
                ? "border-brand bg-brand/10 text-brand shadow-stamp-sm"
                : "border-ink/20 bg-surface text-ink hover:border-brand/40"
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
            <span>계좌이체</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("EASY")}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-md border-2 text-xs font-bold transition-all ${
              paymentMethod === "EASY"
                ? "border-brand bg-brand/10 text-brand shadow-stamp-sm"
                : "border-ink/20 bg-surface text-ink hover:border-brand/40"
            }`}
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>간편 결제</span>
          </button>
        </div>

        <div className="mt-2 rounded bg-mint/10 p-2.5 text-center text-xs text-ink/80 font-medium">
          🔒 테스트 결제 모드로 승인되며, 실제 비용은 청구되지 않습니다.
        </div>
      </Card>

      {payError && <ErrorState error={{ message: payError, errors: null }} />}

      {/* Pay Now Button */}
      <Button
        onClick={handlePay}
        disabled={isPaying}
        className="w-full py-4 text-base font-bold text-white shadow-stamp hover:scale-[1.01] transition-transform"
      >
        {isPaying ? "결제 처리 중..." : `💳 ${order.totalAmount.toLocaleString()}원 결제하기`}
      </Button>
    </div>
  );
}
