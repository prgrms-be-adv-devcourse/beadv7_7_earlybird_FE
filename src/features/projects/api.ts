import { apiClient } from "../../shared/api/client";
import { PROJECT_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type {
  ProjectDetail,
  ProjectSummary,
  Reward,
  CreateProjectRequest,
  CreateRewardRequest,
} from "./types";

export interface ProjectCategory {
  id: number;
  name: string;
}

export interface FetchProjectsParams {
  keyword?: string;
  categoryId?: number | string;
  status?: string;
  sort?: string;
}

export async function fetchProjects(
  params?: FetchProjectsParams,
  signal?: AbortSignal,
): Promise<ProjectSummary[]> {
  const searchParams = new URLSearchParams();
  if (params?.keyword) searchParams.set("keyword", params.keyword);
  if (params?.categoryId && params.categoryId !== "ALL") searchParams.set("categoryId", String(params.categoryId));
  if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);
  if (params?.sort && params.sort !== "RELEVANCE") searchParams.set("sort", params.sort);

  const queryString = searchParams.toString();
  const url = queryString ? `${PROJECT_SERVICE.projects}?${queryString}` : PROJECT_SERVICE.projects;

  // signal 전달 → 검색어가 빠르게 바뀌면 React Query가 이전 요청을 취소한다(느린 이전 응답이 최신을 덮는 것 방지).
  const response = await apiClient.get<ApiResponse<ProjectSummary[]>>(url, { signal });
  return response.data.data ?? [];
}

export async function fetchProject(id: number): Promise<ProjectDetail> {
  const response = await apiClient.get<ApiResponse<ProjectDetail>>(PROJECT_SERVICE.project(id));
  return response.data.data as ProjectDetail;
}

export async function fetchMyProjects(): Promise<ProjectSummary[]> {
  const response = await apiClient.get<ApiResponse<ProjectSummary[]>>(PROJECT_SERVICE.myProjects);
  return response.data.data ?? [];
}

export async function fetchRewards(projectId: number): Promise<Reward[]> {
  const response = await apiClient.get<ApiResponse<Reward[]>>(PROJECT_SERVICE.rewards(projectId));
  return response.data.data ?? [];
}

export async function fetchReward(rewardId: number): Promise<Reward> {
  const response = await apiClient.get<ApiResponse<Reward>>(PROJECT_SERVICE.reward(rewardId));
  return response.data.data as Reward;
}

export async function fetchCategories(): Promise<ProjectCategory[]> {
  const response = await apiClient.get<ApiResponse<ProjectCategory[]>>(PROJECT_SERVICE.categories);
  return response.data.data ?? [];
}

export async function createProject(data: CreateProjectRequest): Promise<ProjectDetail> {
  const response = await apiClient.post<ApiResponse<ProjectDetail>>(PROJECT_SERVICE.projects, data);
  return response.data.data as ProjectDetail;
}

export async function updateProject(projectId: number, data: Partial<CreateProjectRequest>): Promise<ProjectDetail> {
  const response = await apiClient.patch<ApiResponse<ProjectDetail>>(PROJECT_SERVICE.project(projectId), data);
  return response.data.data as ProjectDetail;
}

export async function deleteProject(projectId: number): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(PROJECT_SERVICE.project(projectId));
}

export async function createReward(projectId: number, data: CreateRewardRequest): Promise<Reward> {
  const response = await apiClient.post<ApiResponse<Reward>>(PROJECT_SERVICE.rewards(projectId), data);
  return response.data.data as Reward;
}

export async function updateReward(
  rewardId: number,
  data: Partial<CreateRewardRequest> & { increaseQuantity?: number }
): Promise<Reward> {
  const response = await apiClient.patch<ApiResponse<Reward>>(PROJECT_SERVICE.reward(rewardId), data);
  return response.data.data as Reward;
}

export async function deleteReward(rewardId: number): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(PROJECT_SERVICE.reward(rewardId));
}

export async function approveProject(projectId: number): Promise<ProjectDetail> {
  const response = await apiClient.post<ApiResponse<ProjectDetail>>(PROJECT_SERVICE.approve(projectId));
  return response.data.data as ProjectDetail;
}

export async function closeProjectEarly(projectId: number): Promise<ProjectDetail> {
  const response = await apiClient.post<ApiResponse<ProjectDetail>>(`${PROJECT_SERVICE.project(projectId)}/close-early`);
  return response.data.data as ProjectDetail;
}
