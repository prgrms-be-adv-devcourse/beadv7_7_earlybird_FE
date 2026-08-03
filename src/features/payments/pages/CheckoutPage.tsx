import { useParams } from "react-router-dom";
import { Button, Card, ErrorState } from "../../../shared/ui";
import { useConfirmPayment } from "../hooks";

/**
 * 실제 결제 승인(POST /api/v1/payments/confirm)은 PG(Toss Payments로 보이는) 위젯이 결제를
 * 완료한 뒤 돌려주는 paymentKey/pgOrderId/amount를 그대로 요구한다. 이 값들은 프론트가 미리
 * 지어낼 수 없고, 실제 결제 위젯 SDK 연동(이 템플릿 범위 밖)이 있어야 얻을 수 있다.
 *
 * 그래서 이 페이지는 가짜 paymentKey/pgOrderId로 confirm을 호출하지 않는 정직한 스텁이다.
 * useConfirmPayment 뮤테이션은 이미 준비되어 있으니, 위젯 연동이 붙으면 결제 완료 콜백에서
 * confirmPaymentMutation.mutate({ paymentKey, pgOrderId, amount })만 호출하면 된다.
 */
export function CheckoutPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const confirmPaymentMutation = useConfirmPayment();

  return (
    <Card className="mx-auto max-w-sm text-center">
      <h1 className="mb-4 font-display text-2xl font-bold text-ink">결제하기</h1>
      <p className="mb-2 text-sm text-mist">주문 #{orderId}</p>
      <p className="mb-4 text-sm text-mist">
        실제 결제 승인에는 Toss Payments 위젯이 결제를 완료한 뒤 돌려주는 paymentKey와 amount 값이
        필요해요. 이 템플릿에는 결제 위젯 연동이 포함되어 있지 않아 지금은 결제를 진행할 수 없습니다.
      </p>
      <Button disabled title="결제 위젯 연동 후 활성화됩니다">
        {confirmPaymentMutation.isPending ? "승인 요청 중..." : "결제 승인 (위젯 연동 필요)"}
      </Button>
      {confirmPaymentMutation.isError && (
        <ErrorState error={{ message: "결제 승인에 실패했습니다.", errors: null }} />
      )}
    </Card>
  );
}
