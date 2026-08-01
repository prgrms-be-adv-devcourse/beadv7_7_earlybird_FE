import { apiClient } from "../../shared/api/client";
import { PROJECT_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { ProjectSummary } from "../projects/types";
import type { ProjectCategory } from "./types";

export async function fetchCategories(): Promise<ProjectCategory[]> {
  const response = await apiClient.get<ApiResponse<ProjectCategory[]>>(PROJECT_SERVICE.categories);
  return response.data.data ?? [];
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
