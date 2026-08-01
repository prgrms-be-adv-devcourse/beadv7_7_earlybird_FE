import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCategories, fetchPendingProjects, approveProject, rejectProject } from "./api";

export function useCategories() {
  return useQuery({ queryKey: ["admin", "categories"], queryFn: fetchCategories });
}

export function usePendingProjects() {
  return useQuery({ queryKey: ["admin", "pendingProjects"], queryFn: fetchPendingProjects });
}

export function useApproveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => approveProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "pendingProjects"] }),
  });
}

export function useRejectProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectProject(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "pendingProjects"] }),
  });
}
