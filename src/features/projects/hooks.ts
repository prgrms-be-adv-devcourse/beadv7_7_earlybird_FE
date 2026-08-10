import axios from "axios";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchProjects,
  fetchProject,
  fetchMyProjects,
  fetchRewards,
  fetchReward,
  fetchCategories,
  createProject,
  updateProject,
  deleteProject,
  createReward,
  updateReward,
  deleteReward,
  approveProject,
  closeProjectEarly,
  type FetchProjectsParams,
} from "./api";
import type { CreateProjectRequest, CreateRewardRequest, ProjectDetail } from "./types";
import { useAuthStore } from "../../shared/auth/authStore";

export function useProjects(params?: FetchProjectsParams) {
  return useQuery({
    queryKey: ["projects", "list", params],
    queryFn: () => fetchProjects(params),
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: ["projects", "detail", id],
    queryFn: async (): Promise<ProjectDetail> => {
      try {
        return await fetchProject(id);
      } catch (error) {
        // Backend only serves single-project detail for publicly viewable statuses
        // (e.g. IN_PROGRESS), so an owner viewing their own PENDING_REVIEW/REJECTED
        // project 404s here. Fall back to their "my projects" list, which has no
        // such status restriction, so they can still see their own project.
        const accessToken = useAuthStore.getState().accessToken;
        if (axios.isAxiosError(error) && error.response?.status === 404 && accessToken) {
          const mine = await fetchMyProjects();
          const found = mine.find((project) => project.projectId === id);
          if (found) {
            return { ...found, summary: found.summary ?? null, description: null, isOwnerPreview: true };
          }
        }
        throw error;
      }
    },
  });
}

export function useRewards(projectId: number) {
  return useQuery({
    queryKey: ["rewards", "list", projectId],
    queryFn: () => fetchRewards(projectId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useReward(rewardId: number) {
  return useQuery({
    queryKey: ["rewards", "detail", rewardId],
    queryFn: () => fetchReward(rewardId),
    enabled: !!rewardId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories", "list"],
    queryFn: fetchCategories,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectRequest) => createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "me"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: Partial<CreateProjectRequest> }) =>
      updateProject(projectId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "detail", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects", "me"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "me"] });
    },
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: CreateRewardRequest }) =>
      createReward(projectId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rewards", "list", variables.projectId] });
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      rewardId,
      data,
    }: {
      rewardId: number;
      data: Partial<CreateRewardRequest> & { increaseQuantity?: number };
    }) => updateReward(rewardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}

export function useDeleteReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: number) => deleteReward(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}

export function useApproveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => approveProject(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "detail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects", "me"] });
    },
  });
}

export function useCloseProjectEarly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => closeProjectEarly(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "detail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects", "me"] });
    },
  });
}
