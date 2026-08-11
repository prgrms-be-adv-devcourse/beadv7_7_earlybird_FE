// payment-service PaymentController(payment-service/.../payment/presentation/PaymentController.java)의
// 실제 요청/응답 DTO(presentation/dto/PayRequest.java, PaymentResponse.java) 기준으로 검증함.
// 브리프가 가정한 PaymentRequest{orderId} / Payment{id,orderId,status}와는 다르다:
// - 결제 승인은 POST /api/v1/payments/confirm 하나뿐이고, bare POST /api/v1/payments(즉석 결제
//   요청)는 존재하지 않는다.
// - confirm 요청은 PG(Toss Payments로 보이는) 위젯이 결제 완료 후 돌려주는 paymentKey/pgOrderId/
//   amount를 그대로 받는다. orderId를 FE가 지어내서 보낼 수 있는 구조가 아니다.
// - 응답 필드는 id가 아니라 paymentId이고, amount(BigDecimal → number)도 함께 내려온다.
// - status는 payment-service domain/PaymentStatus.java의 실제 enum 값(READY/CONFIRMING/PAID/
//   FAILED/CANCELLED)으로 좁힘 — Task 14(orders)가 OrderStatus에 대해 세운 컨벤션을 따름.
export interface PaymentConfirmRequest {
  paymentKey: string;
  pgOrderId: string;
  amount: number;
}

export type PaymentStatus = "READY" | "CONFIRMING" | "PAID" | "FAILED" | "CANCELLED";

export interface Payment {
  paymentId: number;
  orderId: number;
  pgOrderId: string;
  amount: number;
  status: PaymentStatus;
}
