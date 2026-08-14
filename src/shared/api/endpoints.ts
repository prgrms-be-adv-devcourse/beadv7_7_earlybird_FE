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
  approve: (projectId: number | string) => `/api/v1/projects/${projectId}/approve`,
  myProjects: "/api/v1/projects/me",
  categories: "/api/v1/project-categories",
  rewards: (projectId: number | string) => `/api/v1/projects/${projectId}/rewards`,
  reward: (rewardId: number | string) => `/api/v1/rewards/${rewardId}`,
};


export const CART_SERVICE = {
  cart: (userId: number | string) => `/api/v1/users/${userId}/cart`,
  items: (userId: number | string) => `/api/v1/users/${userId}/cart/items`,
  item: (userId: number | string, rewardId: number | string) => `/api/v1/users/${userId}/cart/items/${rewardId}`,
};


export const ORDER_SERVICE = {
  orders: "/api/v1/orders",
  myOrders: "/api/v1/orders/me",
  order: (id: number | string) => `/api/v1/orders/${id}`,
  cancel: (id: number | string) => `/api/v1/orders/${id}/cancel`,
};

export const PAYMENT_SERVICE = {
  confirm: "/api/v1/payments/confirm",
  payment: (id: number | string) => `/api/v1/payments/${id}`,
  paymentByOrder: (orderId: number | string) => `/api/v1/payments/orders/${orderId}`,
  cancel: (id: number | string) => `/api/v1/payments/${id}/cancel`,
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
  notices: (projectId: number | string) => `/api/v1/notices?projectId=${projectId}`,
  notice: (noticeId: number | string) => `/api/v1/notices/${noticeId}`,
  createNotice: "/api/v1/notices",
  reviews: (projectId: number | string) => `/api/v1/reviews?projectId=${projectId}`,
  review: (reviewId: number | string) => `/api/v1/reviews/${reviewId}`,
  createReview: "/api/v1/reviews",
  comment: (commentId: number | string) => `/api/v1/comments/${commentId}`,
};

// TODO(FE): notification-service NotificationController도 /api/v1 프리픽스 없이 /notifications뿐.
// 팀 컨벤션 기준으로 가정 — 배포 서버 켜지면 확인 후 이 값만 고치면 된다.
// (별개 확인 완료 사항: GET 목록 엔드포인트는 /notifications/me이고 userId가 필수 쿼리 파라미터다 —
// ORDER_SERVICE.myOrders/fetchOrders와 동일 패턴으로 params에 담아 보낸다.)
export const NOTIFICATION_SERVICE = {
  notifications: "/api/v1/notifications/me",
};
