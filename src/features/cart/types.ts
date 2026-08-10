// cart-service CartController(cart-service/.../presentation/CartController.java)의 실제 응답 DTO
// (presentation/dto/CartResponse.java)를 기준으로 검증/수정함.
// - 최상위 응답은 CartResponse{cartId, userId, itemCount, items, projects, totalItemsAmount, totalShippingFee, totalAmount}.
// - 평면 items[]는 {rewardId, quantity}뿐이며 rewardName/unitPrice가 없다.
// - rewardName/unitPrice/totalPrice는 projects[].rewards[]에만 들어있다(프로젝트별로 그룹핑됨).
export interface CartItem {
  rewardId: number;
  quantity: number;
}

export interface CartReward {
  cartItemId: number;
  rewardId: number;
  rewardName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CartProject {
  projectId: number;
  projectName: string;
  rewards: CartReward[];
  itemsAmount: number;
  shippingFee: number;
  totalAmount: number;
}

export interface Cart {
  cartId: number;
  userId: number;
  itemCount: number;
  items: CartItem[];
  projects: CartProject[];
  totalItemsAmount: number;
  totalShippingFee: number;
  totalAmount: number;
}

// cart-service AddCartItemsRequest(presentation/dto/AddCartItemsRequest.java)와 동일한 shape.
export interface AddCartItemsPayload {
  projectId: number;
  items: { rewardId: number; quantity: number }[];
}
