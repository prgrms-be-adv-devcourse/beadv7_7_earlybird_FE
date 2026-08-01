import { useQuery } from "@tanstack/react-query";
import { fetchProjects, fetchProject, fetchRewards } from "./api";

export function useProjects() {
  return useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
}

export function useProject(id: number) {
  return useQuery({ queryKey: ["projects", id], queryFn: () => fetchProject(id) });
}

export function useRewards(projectId: number) {
  return useQuery({ queryKey: ["projects", projectId, "rewards"], queryFn: () => fetchRewards(projectId) });
}
