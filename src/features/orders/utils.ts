import type { OrderStatus } from "./types";

export function getOrderStatusLabel(status: OrderStatus | string): string {
  switch (status) {
    case "CREATED":
      return "⌛ 주문 완료 (결제 대기)";
    case "STOCK_PENDING":
      return "📦 재고 확인 중";
    case "PAYMENT_REQUEST":
      return "💳 결제 요청 중";
    case "PAYMENT_PROCESSING":
      return "⏳ 결제 처리 중";
    case "PAYMENT_PENDING":
      return "⏳ 결제 확인 중 (잠시만 기다려주세요)";
    case "PAYMENT_RECONCILIATION_REQUIRED":
      return "🔄 결제 확인 처리 중";
    case "STOCK_COMPENSATION_PENDING":
      return "↩️ 재고 복구 처리 중";
    case "PAYMENT_COMPENSATION_PENDING":
      return "↩️ 결제 취소 처리 중";
    case "PAID":
      return "🎉 결제 완료 (후원 성공)";
    case "STOCK_FAILED":
      return "😭 재고 부족 (주문 실패)";
    case "PAYMENT_FAILED":
      return "❌ 결제 실패";
    case "CANCELLED":
      return "🚫 주문 취소됨";
    default:
      return status;
  }
}

export function getOrderStatusBadgeTone(status: OrderStatus | string): "mint" | "peach" | "lavender" {
  switch (status) {
    case "PAID":
      return "mint";
    case "CREATED":
    case "STOCK_PENDING":
    case "PAYMENT_REQUEST":
    case "PAYMENT_PROCESSING":
    case "PAYMENT_PENDING":
    case "PAYMENT_RECONCILIATION_REQUIRED":
      return "peach";
    case "STOCK_FAILED":
    case "PAYMENT_FAILED":
    case "CANCELLED":
    case "STOCK_COMPENSATION_PENDING":
    case "PAYMENT_COMPENSATION_PENDING":
    default:
      return "lavender";
  }
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

