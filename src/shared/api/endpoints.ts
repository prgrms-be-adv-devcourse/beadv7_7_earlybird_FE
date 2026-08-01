export const USER_SERVICE = {
  login: "/api/v1/users/login",
  signup: "/api/v1/users/signup",
  refresh: "/api/v1/users/refresh",
  logout: "/api/v1/users/logout",
  me: "/api/v1/users/me",
};

export const PROJECT_SERVICE = {
  projects: "/api/v1/projects",
  project: (id: number | string) => `/api/v1/projects/${id}`,
  myProjects: "/api/v1/projects/me",
  categories: "/api/v1/project-categories",
  rewards: (projectId: number | string) => `/api/v1/projects/${projectId}/rewards`,
  reward: (rewardId: number | string) => `/api/v1/rewards/${rewardId}`,
};

export const CART_SERVICE = {
  // GET 응답 DTO는 cart-service CartResponse(presentation/dto/CartResponse.java)로 확인 완료.
  // src/features/cart/types.ts 참고 (cartId/itemCount/items/projects 등).
  cart: (userId: number | string) => `/api/v1/users/${userId}/cart`,
};

export const ORDER_SERVICE = {
  orders: "/api/v1/orders",
  myOrders: "/api/v1/orders/me",
  order: (id: number | string) => `/api/v1/orders/${id}`,
  cancel: (id: number | string) => `/api/v1/orders/${id}/cancel`,
};

export const PAYMENT_SERVICE = {
  // payment-service는 main 기준 스텁 구현(memory 참고) — 실제 PG 연동 전까지 체크아웃은 껍데기.
  payments: "/api/v1/payments",
};

export const SETTLEMENT_SERVICE = {
  mySettlements: "/api/v1/settlements",
  allSettlements: "/api/v1/settlements/all",
};

// TODO(FE): board-service 컨트롤러 코드(ProjectNoticeController/ReviewController/CommentController)엔
// 클래스 레벨 @RequestMapping이 없어 /api/v1 프리픽스가 실제로는 없다(/projects/{id}/notices 등).
// 팀 컨벤션(2026-07-16 확정, /api/v1/{svc}/xxx) 기준으로 여기서는 있다고 가정만 했다 — 배포 서버가
// 켜지면 curl로 실제 라우트를 확인하고 아래 값만 고치면 된다(다른 파일에는 영향 없음).
export const BOARD_SERVICE = {
  notices: (projectId: number | string) => `/api/v1/projects/${projectId}/notices`,
  notice: (projectId: number | string, noticeId: number | string) =>
    `/api/v1/projects/${projectId}/notices/${noticeId}`,
  reviews: (projectId: number | string) => `/api/v1/projects/${projectId}/reviews`,
  comment: (commentId: number | string) => `/api/v1/comments/${commentId}`,
};

// TODO(FE): notification-service NotificationController도 /api/v1 프리픽스 없이 /notifications뿐.
// 팀 컨벤션 기준으로 가정 — 배포 서버 켜지면 확인 후 이 값만 고치면 된다.
export const NOTIFICATION_SERVICE = {
  notifications: "/api/v1/notifications",
};
