import { apiClient } from "../../shared/api/client";
import { BOARD_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { ProjectNotice, ProjectReview, CreateNoticePayload, CreateReviewPayload } from "./types";

export async function fetchNotices(projectId: number): Promise<ProjectNotice[]> {
  const response = await apiClient.get<ApiResponse<ProjectNotice[]>>(BOARD_SERVICE.notices(projectId));
  return response.data.data ?? [];
}

export async function createNotice(payload: CreateNoticePayload): Promise<ProjectNotice> {
  const response = await apiClient.post<ApiResponse<ProjectNotice>>(BOARD_SERVICE.createNotice, payload);
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
  const response = await apiClient.post<ApiResponse<ProjectReview>>(BOARD_SERVICE.createReview, payload);
  return response.data.data as ProjectReview;
}

export async function deleteReview(reviewId: number): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(BOARD_SERVICE.review(reviewId));
}
