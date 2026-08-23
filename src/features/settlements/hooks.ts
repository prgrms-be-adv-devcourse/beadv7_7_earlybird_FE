import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import {
  fetchAllSettlements,
  fetchCreatorProfile,
  fetchCreatorSettlementDetail,
  fetchMySettlements,
  fetchRefundDetail,
  fetchSettlementDetail,
  runPgReconciliation,
  runProjectPayout,
  registerCreatorPayoutProfile,
} from "./api";
import type { AdminSettlementSort } from "./types";

export function useMySettlements() {
  const user = useAuthStore((state) => state.user);
  const isCreator = user?.role === "CREATOR";
  return useQuery({
    queryKey: ["settlements", "list", user?.id],
    queryFn: fetchMySettlements,
    enabled: !!user?.id && isCreator,
  });
}

export function useAllSettlements(sort: AdminSettlementSort = "PUBLISHED_AT") {
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  return useQuery({
    queryKey: ["settlements", "all", sort],
    queryFn: () => fetchAllSettlements(sort),
    enabled: isAdmin,
  });
}

export function useCreatorProfile(creatorId: number | null) {
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  return useQuery({
    queryKey: ["users", "creator", creatorId],
    queryFn: () => fetchCreatorProfile(creatorId as number),
    enabled: isAdmin && creatorId !== null,
  });
}

export function useRefundDetail(refundRequestId: string | null) {
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  return useQuery({
    queryKey: ["settlements", "refund-detail", refundRequestId],
    queryFn: () => fetchRefundDetail(refundRequestId as string),
    enabled: isAdmin && refundRequestId !== null,
  });
}

export function useRegisterCreatorPayoutProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerCreatorPayoutProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements", "all"] });
    },
  });
}

export function useSettlementDetail(settlementId: number | null) {
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  return useQuery({
    queryKey: ["settlements", "detail", settlementId],
    queryFn: () => (settlementId ? fetchSettlementDetail(settlementId) : Promise.resolve(null)),
    enabled: isAdmin && !!settlementId,
  });
}

export function useCreatorSettlementDetail(settlementId: number | null) {
  const isCreator = useAuthStore((state) => state.user?.role === "CREATOR");
  return useQuery({
    queryKey: ["settlements", "creator-detail", settlementId],
    queryFn: () => (settlementId ? fetchCreatorSettlementDetail(settlementId) : Promise.resolve(null)),
    enabled: isCreator && !!settlementId,
  });
}

export function useRunProjectPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payoutMonth: string) => runProjectPayout(payoutMonth),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
}

export function useRunPgReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settlementMonth: string) => runPgReconciliation(settlementMonth),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
}
