export const USER_SERVICE = {
  login: "/api/v1/users/login",
  signup: "/api/v1/users/signup",
  refresh: "/api/v1/users/refresh",
  logout: "/api/v1/users/logout",
  me: "/api/v1/users/me",
  switchRole: "/api/v1/users/me/role",
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
  settlementDetail: (id: number | string) => `/api/v1/settlements/all/${id}`,
  runPayout: "/internal/v1/settlements/project-payouts/runs",
  runPgReconciliation: "/internal/v1/settlements/pg-reconciliations/runs",
};

// 강대혁/project/settlement-kafka-closed-event 브랜치의 실제 컨트롤러 코드로 확인 완료:
// ProjectNoticeController/ReviewController/CommentController 모두 클래스 레벨
// @RequestMapping("/api/v1/notices"), ("/api/v1/reviews"), ("/api/v1/comments")를 갖고 있어
// 아래 경로가 실제 라우트와 일치한다.
export const BOARD_SERVICE = {
  notices: (projectId: number | string) => `/api/v1/notices?projectId=${projectId}`,
  notice: (noticeId: number | string) => `/api/v1/notices/${noticeId}`,
  createNotice: "/api/v1/notices",
  reviews: (projectId: number | string) => `/api/v1/reviews?projectId=${projectId}`,
  review: (reviewId: number | string) => `/api/v1/reviews/${reviewId}`,
  createReview: "/api/v1/reviews",
  comment: (commentId: number | string) => `/api/v1/comments/${commentId}`,
  comments: (targetType: string, targetId: number | string) =>
    `/api/v1/comments?targetType=${targetType}&targetId=${targetId}`,
  commentReplies: (commentId: number | string) => `/api/v1/comments/${commentId}/replies`,
};

// file-service FileController(file/presentation/FileController.java)는 클래스 레벨
// @RequestMapping("/files")뿐이라 게이트웨이 라우트(Path=/api/v1/files/**)와 프리픽스가 어긋난다 —
// notification-service와 동일한 종류의 기존 미스매치. 팀 컨벤션(/api/v1/{svc}/xxx)대로 아래 경로를
// 쓰고, presigned-upload는 아직 백엔드에 없는 신규 엔드포인트(요청 예정, PRESIGNED_UPLOAD_SPEC 참고).
export const FILE_SERVICE = {
  presignedUpload: "/api/v1/files/presigned-upload",
  register: "/api/v1/files",
  file: (fileId: number | string) => `/api/v1/files/${fileId}`,
  filesByOwner: (ownerType: string, ownerId: number | string) =>
    `/api/v1/files?ownerType=${ownerType}&ownerId=${ownerId}`,
};
