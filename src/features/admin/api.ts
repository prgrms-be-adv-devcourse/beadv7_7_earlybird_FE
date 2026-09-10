import { apiClient } from "../../shared/api/client";
import { PROJECT_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { Page } from "../../shared/types/Page";
import type { ProjectListItem } from "../projects/api";
import type { ProjectCategory } from "./types";

const ADMIN_HEADER = { headers: { "X-User-Role": "ADMIN" } };

export async function fetchCategories(): Promise<ProjectCategory[]> {
  const response = await apiClient.get<ApiResponse<ProjectCategory[]>>(PROJECT_SERVICE.categories, ADMIN_HEADER);
  return response.data.data ?? [];
}

export async function createCategory(data: {
  name: string;
  parentProjectCategoryId?: number | null;
}): Promise<ProjectCategory> {
  const response = await apiClient.post<ApiResponse<ProjectCategory>>(PROJECT_SERVICE.categories, data, ADMIN_HEADER);
  return response.data.data as ProjectCategory;
}

export async function updateCategory(
  id: number,
  data: { name: string; parentProjectCategoryId?: number | null }
): Promise<ProjectCategory> {
  const response = await apiClient.put<ApiResponse<ProjectCategory>>(`${PROJECT_SERVICE.categories}/${id}`, data, ADMIN_HEADER);
  return response.data.data as ProjectCategory;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(`${PROJECT_SERVICE.categories}/${id}`, ADMIN_HEADER);
}

export async function fetchPendingProjects(): Promise<ProjectListItem[]> {
  const response = await apiClient.get<ApiResponse<Page<ProjectListItem> | ProjectListItem[]>>(
    `${PROJECT_SERVICE.projects}?status=PENDING_REVIEW&size=100`,
    ADMIN_HEADER
  );
  const data = response.data.data;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.content ?? [];
}

export async function approveProject(id: number): Promise<void> {
  await apiClient.post<ApiResponse<null>>(`${PROJECT_SERVICE.project(id)}/approve`, {}, ADMIN_HEADER);
}

export async function rejectProject(id: number, reason: string): Promise<void> {
  await apiClient.post<ApiResponse<null>>(`${PROJECT_SERVICE.project(id)}/reject`, { reason }, ADMIN_HEADER);
}

export async function extendProjectDeadline(id: number, endAt: string): Promise<void> {
  await apiClient.patch<ApiResponse<null>>(`${PROJECT_SERVICE.project(id)}/deadline`, { endAt }, ADMIN_HEADER);
}

export async function triggerCloseExpiredProjects(): Promise<void> {
  await apiClient.post<ApiResponse<null>>(`${PROJECT_SERVICE.projects}/close-expired`, {}, ADMIN_HEADER);
}

export async function reindexAllProjects(): Promise<void> {
  await apiClient.post<ApiResponse<null>>(`${PROJECT_SERVICE.projects}/reindex`, {}, ADMIN_HEADER);
}

export async function cancelProjectByAdmin(id: number): Promise<void> {
  await apiClient.post<ApiResponse<null>>(`${PROJECT_SERVICE.project(id)}/cancel`, {}, ADMIN_HEADER);
}

export async function decreaseRewardQuantityByAdmin(rewardId: number, amount: number): Promise<void> {
  await apiClient.patch<ApiResponse<null>>(`${PROJECT_SERVICE.reward(rewardId)}/quantity`, { amount }, ADMIN_HEADER);
}

export async function deactivateRewardByAdmin(rewardId: number): Promise<void> {
  await apiClient.post<ApiResponse<null>>(`${PROJECT_SERVICE.reward(rewardId)}/deactivate`, {}, ADMIN_HEADER);
}
