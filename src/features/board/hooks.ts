import { useQuery } from "@tanstack/react-query";
import { fetchNotices, fetchReviews } from "./api";

export function useNotices(projectId: number) {
  return useQuery({ queryKey: ["projects", projectId, "notices"], queryFn: () => fetchNotices(projectId) });
}

export function useReviews(projectId: number) {
  return useQuery({ queryKey: ["projects", projectId, "reviews"], queryFn: () => fetchReviews(projectId) });
}
