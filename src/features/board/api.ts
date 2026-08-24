import { apiClient } from "../../shared/api/client";
import { BOARD_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type {
  ProjectNotice,
  ProjectReview,
  CreateNoticePayload,
  CreateReviewPayload,
  UpdateNoticePayload,
  UpdateReviewPayload,
  ProjectComment,
  CommentTargetType,
} from "./types";

export async function fetchNotices(projectId: number): Promise<ProjectNotice[]> {
  const response = await apiClient.get<ApiResponse<ProjectNotice[]>>(BOARD_SERVICE.notices(projectId));
  return response.data.data ?? [];
}

export async function createNotice(payload: CreateNoticePayload): Promise<ProjectNotice> {
  const response = await apiClient.post<ApiResponse<ProjectNotice>>(
    BOARD_SERVICE.createNotice,
    payload,
    { params: { projectId: payload.projectId } }
  );
  return response.data.data as ProjectNotice;
}

export async function updateNotice(noticeId: number, payload: UpdateNoticePayload): Promise<ProjectNotice> {
  const response = await apiClient.patch<ApiResponse<ProjectNotice>>(BOARD_SERVICE.notice(noticeId), payload);
  return response.data.data as ProjectNotice;
}

export async function deleteNotice(noticeId: number): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(BOARD_SERVICE.notice(noticeId));
}

export async function fetchReviews(projectId: number): Promise<ProjectReview[]> {
  const response = await apiClient.get<ApiResponse<ProjectReview[]>>(BOARD_SERVICE.reviews(projectId));
  return response.data.data ?? [];
}

export async function createReview(payload: CreateReviewPayload): Promise<ProjectReview> {
  const response = await apiClient.post<ApiResponse<ProjectReview>>(
    BOARD_SERVICE.createReview,
    payload,
    { params: { projectId: payload.projectId } }
  );
  return response.data.data as ProjectReview;
}

export async function updateReview(reviewId: number, payload: UpdateReviewPayload): Promise<ProjectReview> {
  const response = await apiClient.patch<ApiResponse<ProjectReview>>(BOARD_SERVICE.review(reviewId), payload);
  return response.data.data as ProjectReview;
}

export async function deleteReview(reviewId: number): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(BOARD_SERVICE.review(reviewId));
}

export async function fetchComments(targetType: CommentTargetType, targetId: number): Promise<ProjectComment[]> {
  const response = await apiClient.get<ApiResponse<ProjectComment[]>>(BOARD_SERVICE.comments(targetType, targetId));
  return response.data.data ?? [];
}

export async function createComment(
  targetType: CommentTargetType,
  targetId: number,
  content: string
): Promise<ProjectComment> {
  const response = await apiClient.post<ApiResponse<ProjectComment>>(
    BOARD_SERVICE.comments(targetType, targetId),
    { content }
  );
  return response.data.data as ProjectComment;
}

export async function replyToComment(commentId: number, content: string): Promise<ProjectComment> {
  const response = await apiClient.post<ApiResponse<ProjectComment>>(BOARD_SERVICE.commentReplies(commentId), {
    content,
  });
  return response.data.data as ProjectComment;
}

export async function updateComment(commentId: number, content: string): Promise<ProjectComment> {
  const response = await apiClient.patch<ApiResponse<ProjectComment>>(BOARD_SERVICE.comment(commentId), {
    content,
  });
  return response.data.data as ProjectComment;
}

export async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(BOARD_SERVICE.comment(commentId));
}
