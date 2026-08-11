import type { OrderStatus } from "./types";

export function getOrderStatusLabel(status: OrderStatus | string): string {
  switch (status) {
    case "CREATED":
      return "⌛ 주문 완료 (결제 대기)";
    case "PAYMENT_REQUEST":
      return "💳 결제 요청 중";
    case "PAYMENT_PROCESSING":
      return "⏳ 결제 처리 중";
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
    case "PAYMENT_REQUEST":
    case "PAYMENT_PROCESSING":
      return "peach";
    case "STOCK_FAILED":
    case "PAYMENT_FAILED":
    case "CANCELLED":
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

