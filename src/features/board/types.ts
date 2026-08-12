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
