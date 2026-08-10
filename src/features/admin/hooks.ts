import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  fetchPendingProjects,
  approveProject,
  rejectProject,
  extendProjectDeadline,
  triggerCloseExpiredProjects,
  cancelProjectByAdmin,
  decreaseRewardQuantityByAdmin,
  deactivateRewardByAdmin,
} from "./api";

export function useCategories() {
  return useQuery({ queryKey: ["admin", "categories"], queryFn: fetchCategories });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; parentProjectCategoryId?: number | null }) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "list"] });
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
      queryClient.invalidateQueries({ queryKey: ["categories", "list"] });
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
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
    },
  });
}

export function useRejectProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectProject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pendingProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
    },
  });
}

export function useExtendProjectDeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, endAt }: { id: number; endAt: string }) => extendProjectDeadline(id, endAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pendingProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
    },
  });
}

export function useTriggerCloseExpired() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => triggerCloseExpiredProjects(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pendingProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
    },
  });
}

export function useCancelProjectByAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelProjectByAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pendingProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
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
