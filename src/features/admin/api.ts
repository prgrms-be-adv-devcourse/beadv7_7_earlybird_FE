import { apiClient } from "../../shared/api/client";
import { PROJECT_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { ProjectSummary } from "../projects/types";
import type { ProjectCategory } from "./types";

export async function fetchCategories(): Promise<ProjectCategory[]> {
  const response = await apiClient.get<ApiResponse<ProjectCategory[]>>(PROJECT_SERVICE.categories);
  return response.data.data ?? [];
}

export async function createCategory(data: {
  name: string;
  parentProjectCategoryId?: number | null;
}): Promise<ProjectCategory> {
  const response = await apiClient.post<ApiResponse<ProjectCategory>>(PROJECT_SERVICE.categories, data);
  return response.data.data as ProjectCategory;
}

export async function updateCategory(
  id: number,
  data: { name: string; parentProjectCategoryId?: number | null }
): Promise<ProjectCategory> {
  const response = await apiClient.put<ApiResponse<ProjectCategory>>(`${PROJECT_SERVICE.categories}/${id}`, data);
  return response.data.data as ProjectCategory;
}

export async function fetchPendingProjects(): Promise<ProjectSummary[]> {
  const response = await apiClient.get<ApiResponse<ProjectSummary[]>>(
    `${PROJECT_SERVICE.projects}?status=PENDING_REVIEW`,
  );
  return response.data.data ?? [];
}

export async function approveProject(id: number): Promise<void> {
  await apiClient.post<ApiResponse<null>>(`${PROJECT_SERVICE.project(id)}/approve`);
}

export async function rejectProject(id: number, reason: string): Promise<void> {
  await apiClient.post<ApiResponse<null>>(`${PROJECT_SERVICE.project(id)}/reject`, { reason });
}

export async function extendProjectDeadline(id: number, endAt: string): Promise<void> {
  await apiClient.patch<ApiResponse<null>>(`${PROJECT_SERVICE.project(id)}/deadline`, { endAt });
}

export async function triggerCloseExpiredProjects(): Promise<void> {
  await apiClient.post<ApiResponse<null>>(`${PROJECT_SERVICE.projects}/close-expired`);
}

export async function cancelProjectByAdmin(id: number): Promise<void> {
  await apiClient.post<ApiResponse<null>>(`${PROJECT_SERVICE.project(id)}/cancel`);
}

export async function decreaseRewardQuantityByAdmin(rewardId: number, amount: number): Promise<void> {
  await apiClient.patch<ApiResponse<null>>(`${PROJECT_SERVICE.reward(rewardId)}/quantity`, { amount });
}

export async function deactivateRewardByAdmin(rewardId: number): Promise<void> {
  await apiClient.post<ApiResponse<null>>(`${PROJECT_SERVICE.reward(rewardId)}/deactivate`);
}
