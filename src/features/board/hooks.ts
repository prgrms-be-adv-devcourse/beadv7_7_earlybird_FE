import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNotices, fetchReviews, createNotice, deleteNotice, createReview, deleteReview } from "./api";
import type { CreateNoticePayload, CreateReviewPayload } from "./types";

export function useNotices(projectId: number) {
  return useQuery({ queryKey: ["board", "notices", projectId], queryFn: () => fetchNotices(projectId) });
}

export function useCreateNotice(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<CreateNoticePayload, "projectId">) =>
      createNotice({ ...payload, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", "notices", projectId] });
    },
  });
}

export function useDeleteNotice(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noticeId: number) => deleteNotice(noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", "notices", projectId] });
    },
  });
}

export function useReviews(projectId: number) {
  return useQuery({ queryKey: ["board", "reviews", projectId], queryFn: () => fetchReviews(projectId) });
}

export function useCreateReview(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<CreateReviewPayload, "projectId">) =>
      createReview({ ...payload, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", "reviews", projectId] });
    },
  });
}

export function useDeleteReview(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", "reviews", projectId] });
    },
  });
}
