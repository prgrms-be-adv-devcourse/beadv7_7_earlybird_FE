import { useQuery } from "@tanstack/react-query";
import { fetchNotices, fetchReviews } from "./api";

export function useNotices(projectId: number) {
  return useQuery({ queryKey: ["board", "notices", projectId], queryFn: () => fetchNotices(projectId) });
}

export function useReviews(projectId: number) {
  return useQuery({ queryKey: ["board", "reviews", projectId], queryFn: () => fetchReviews(projectId) });
}
