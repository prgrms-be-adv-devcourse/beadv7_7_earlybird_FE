// Cross-checked against board-service ProjectNoticeResponse
// (notice/presentation/dto/ProjectNoticeResponse.java): id, projectId, authorName, title,
// content, viewCount, createdAt — brief's guess omitted authorName/viewCount/createdAt.
export interface ProjectNotice {
  id: number;
  projectId: number;
  authorName: string;
  title: string;
  content: string;
  viewCount: number;
  createdAt: string;
}

// Cross-checked against board-service ReviewResponse
// (review/presentation/dto/ReviewResponse.java): id, projectId, rewardId, rewardName,
// authorName, rating, content, createdAt — brief's guess omitted everything but id/projectId/content.
export interface ProjectReview {
  id: number;
  projectId: number;
  rewardId?: number;
  rewardName?: string;
  authorName?: string;
  rating: number;
  content: string;
  createdAt?: string;
}

export interface CreateNoticePayload {
  projectId: number;
  title: string;
  content: string;
}

export interface CreateReviewPayload {
  projectId: number;
  rewardId?: number;
  rating: number;
  content: string;
}

export interface UpdateNoticePayload {
  title: string;
  content: string;
}

export interface UpdateReviewPayload {
  rating: number;
  content: string;
}

// board-service CommentController(comment/presentation/CommentController.java) 기준.
// PROJECT/PROJECT_NOTICE/REVIEW 세 대상에 공통으로 달리는 의견·문의 댓글. CommentResponse에는
// authorId가 없고 authorName만 내려온다 — notice/review와 동일한 제약.
export type CommentTargetType = "PROJECT" | "PROJECT_NOTICE" | "REVIEW";

export interface ProjectComment {
  id: number;
  targetType: CommentTargetType;
  targetId: number;
  authorName: string;
  parentId: number | null;
  content: string;
  createdAt: string;
  replies: ProjectComment[];
}
