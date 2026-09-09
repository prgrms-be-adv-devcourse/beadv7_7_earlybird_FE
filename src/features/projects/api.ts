import { apiClient } from "../../shared/api/client";
import { PROJECT_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { Page } from "../../shared/types/Page";
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
  creatorId?: number | string;
  status?: string;
  sort?: string;
  page?: number; // 0-based (서버 기준). FE의 1-based 페이지와 헷갈리지 않게 여기서만 다룬다.
  size?: number; // 생략 시 서버 기본 8, 상한 100
}

/** 목록 응답에는 description이 없다(무거워서 제외됨) — 본문이 필요하면 fetchProject를 쓸 것. */
export type ProjectListItem = Omit<ProjectSummary, "description">;

export async function fetchProjects(
  params?: FetchProjectsParams,
  signal?: AbortSignal,
): Promise<Page<ProjectListItem>> {
  const searchParams = new URLSearchParams();
  if (params?.keyword) searchParams.set("keyword", params.keyword);
  if (params?.categoryId && params.categoryId !== "ALL") searchParams.set("categoryId", String(params.categoryId));
  if (params?.creatorId && params.creatorId !== "ALL") searchParams.set("creatorId", String(params.creatorId));
  if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);
  if (params?.sort && params.sort !== "RELEVANCE") searchParams.set("sort", params.sort);
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString ? `${PROJECT_SERVICE.projects}?${queryString}` : PROJECT_SERVICE.projects;

  // signal 전달 → 검색어가 빠르게 바뀌면 React Query가 이전 요청을 취소한다(느린 이전 응답이 최신을 덮는 것 방지).
  const response = await apiClient.get<ApiResponse<Page<ProjectListItem>>>(url, { signal });
  return response.data.data ?? { content: [], page: 0, size: 0, totalPages: 0, totalElements: 0 };
}

export interface ProjectSuggestion {
  projectId: number;
  title: string;
}

/** 제목 prefix 자동완성(최대 10건). 하이브리드 검색과 달리 임베딩 호출이 없다. */
export async function fetchProjectAutocomplete(keyword: string, signal?: AbortSignal): Promise<ProjectSuggestion[]> {
  const url = `${PROJECT_SERVICE.autocomplete}?keyword=${encodeURIComponent(keyword)}`;
  const response = await apiClient.get<ApiResponse<ProjectSuggestion[]>>(url, { signal });
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
