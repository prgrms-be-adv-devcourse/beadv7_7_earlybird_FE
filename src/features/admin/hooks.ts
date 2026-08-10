import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchPendingProjects,
  approveProject,
  rejectProject,
  extendProjectDeadline,
  triggerCloseExpiredProjects,
  reindexAllProjects,
  cancelProjectByAdmin,
  decreaseRewardQuantityByAdmin,
  deactivateRewardByAdmin,
} from "./api";

export function useCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: fetchCategories,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; parentProjectCategoryId?: number | null }) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; parentProjectCategoryId?: number | null } }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function usePendingProjects() {
  return useQuery({
    queryKey: ["admin", "pendingProjects"],
    queryFn: fetchPendingProjects,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useApproveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => approveProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pendingProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useRejectProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectProject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pendingProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useExtendProjectDeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, endAt }: { id: number; endAt: string }) => extendProjectDeadline(id, endAt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pendingProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useTriggerCloseExpired() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => triggerCloseExpiredProjects(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useReindexProjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reindexAllProjects(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useCancelProjectByAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelProjectByAdmin(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pendingProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDecreaseRewardQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rewardId, amount }: { rewardId: number; amount: number }) =>
      decreaseRewardQuantityByAdmin(rewardId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}

export function useDeactivateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: number) => deactivateRewardByAdmin(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}
