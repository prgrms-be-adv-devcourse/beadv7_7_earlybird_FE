import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotices,
  fetchReviews,
  createNotice,
  updateNotice,
  deleteNotice,
  createReview,
  updateReview,
  deleteReview,
  fetchComments,
  createComment,
  replyToComment,
  updateComment,
  deleteComment,
} from "./api";
import type { CommentTargetType, CreateNoticePayload, CreateReviewPayload, UpdateNoticePayload, UpdateReviewPayload } from "./types";

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

export function useUpdateNotice(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noticeId, payload }: { noticeId: number; payload: UpdateNoticePayload }) =>
      updateNotice(noticeId, payload),
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

export function useUpdateReview(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: number; payload: UpdateReviewPayload }) =>
      updateReview(reviewId, payload),
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

export function useComments(targetType: CommentTargetType, targetId: number) {
  return useQuery({
    queryKey: ["board", "comments", targetType, targetId],
    queryFn: () => fetchComments(targetType, targetId),
  });
}

export function useCreateComment(targetType: CommentTargetType, targetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => createComment(targetType, targetId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", "comments", targetType, targetId] });
    },
  });
}

export function useReplyToComment(targetType: CommentTargetType, targetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) => replyToComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", "comments", targetType, targetId] });
    },
  });
}

export function useUpdateComment(targetType: CommentTargetType, targetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) => updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", "comments", targetType, targetId] });
    },
  });
}

export function useDeleteComment(targetType: CommentTargetType, targetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", "comments", targetType, targetId] });
    },
  });
}
