import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import {
  approveCreatorApplication,
  fetchCreatorApplications,
  fetchMyCreatorApplication,
  rejectCreatorApplication,
  submitCreatorApplication,
} from "./api";
import type { SubmitCreatorApplicationPayload } from "./types";

export function useMyCreatorApplication() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ["creator", "my-application", userId],
    queryFn: () => fetchMyCreatorApplication(),
    enabled: !!userId,
  });
}

export function useSubmitCreatorApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitCreatorApplicationPayload) => submitCreatorApplication(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator"] });
    },
  });
}

export function useCreatorApplications() {
  return useQuery({
    queryKey: ["creator", "admin-list"],
    queryFn: () => fetchCreatorApplications(),
  });
}

export function useApproveCreatorApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: number) => approveCreatorApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useRejectCreatorApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, rejectReason }: { applicationId: number; rejectReason: string }) =>
      rejectCreatorApplication(applicationId, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator"] });
    },
  });
}
