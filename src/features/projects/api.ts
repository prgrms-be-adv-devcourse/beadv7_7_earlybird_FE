import { apiClient } from "../../shared/api/client";
import { PROJECT_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { ProjectDetail, ProjectSummary, Reward } from "./types";

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const response = await apiClient.get<ApiResponse<ProjectSummary[]>>(PROJECT_SERVICE.projects);
  return response.data.data ?? [];
}

export async function fetchProject(id: number): Promise<ProjectDetail> {
  const response = await apiClient.get<ApiResponse<ProjectDetail>>(PROJECT_SERVICE.project(id));
  return response.data.data as ProjectDetail;
}

export async function fetchRewards(projectId: number): Promise<Reward[]> {
  const response = await apiClient.get<ApiResponse<Reward[]>>(PROJECT_SERVICE.rewards(projectId));
  return response.data.data ?? [];
}
