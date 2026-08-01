import { apiClient } from "../../shared/api/client";
import { BOARD_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { ProjectNotice, ProjectReview } from "./types";

export async function fetchNotices(projectId: number): Promise<ProjectNotice[]> {
  const response = await apiClient.get<ApiResponse<ProjectNotice[]>>(BOARD_SERVICE.notices(projectId));
  return response.data.data ?? [];
}

export async function fetchReviews(projectId: number): Promise<ProjectReview[]> {
  const response = await apiClient.get<ApiResponse<ProjectReview[]>>(BOARD_SERVICE.reviews(projectId));
  return response.data.data ?? [];
}
