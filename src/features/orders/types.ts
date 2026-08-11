// order-service OrderController(order-service/.../presentation/OrderController.java)의 실제 응답 DTO
// (presentation/dto/OrderResponse.java, OrderSummaryResponse.java, domain/OrderStatus.java)를
// 기준으로 검증/수정함. 브리프가 가정한 Order{id,userId,status,items,totalAmount}와는 다르다:
// - GET /api/v1/orders/me 는 OrderSummaryResponse[] 를 반환한다. 품목 배열이 아예 없고
//   (orderItems 없음), userId 필드도 없다.
// - GET /api/v1/orders/{id} (및 취소 응답)는 OrderResponse 를 반환한다. 품목 배열 필드명은
//   `items`가 아니라 `orderItems`이며, 항목 필드는 `expectedUnitPrice`가 아니라 `price`이고
//   id/name/projectId/subtotal도 함께 내려온다. 여기도 userId 필드는 없다.
// - OrderStatus 실제 값은 CREATED/STOCK_FAILED/PAYMENT_REQUEST/PAYMENT_PROCESSING/
//   PAYMENT_FAILED/PAID/CANCELLED 이다. 브리프가 가정한 "FAILED"는 존재하지 않는다.
export type OrderStatus =
  | "CREATED"
  | "STOCK_FAILED"
  | "PAYMENT_REQUEST"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_FAILED"
  | "PAID"
  | "CANCELLED";

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  projectId: number;
  rewardId: number;
  quantity: number;
  subtotal: number;
}

/** GET /api/v1/orders/me 목록 항목 (OrderSummaryResponse) — 품목 배열 없음. */
export interface OrderSummary {
  id: number;
  status: OrderStatus;
  itemsAmount: number;
  shippingFee: number;
  totalAmount: number;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  zipCode: string;
}

/** GET /api/v1/orders/{id} 및 취소 응답 상세 (OrderResponse). */
export interface Order {
  id: number;
  status: OrderStatus;
  itemsAmount: number;
  shippingFee: number;
  totalAmount: number;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  zipCode: string;
  orderItems: OrderItem[];
}

export interface OrderItemRequest {
  rewardId: number;
  quantity: number;
  expectedUnitPrice: number;
}

export interface PlaceOrderRequest {
  userId: number;
  projectId?: number;
  requests: OrderItemRequest[];
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  zipCode: string;
  expectedItemsAmount: number;
  expectedTotalAmount: number;
  orderIdempotencyKey: string;
}


