import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import {
  fetchAllSettlements,
  fetchMySettlements,
  fetchSettlementDetail,
  runPgReconciliation,
  runProjectPayout,
} from "./api";

export function useMySettlements() {
  const user = useAuthStore((state) => state.user);
  const isCreator = user?.role === "CREATOR";
  return useQuery({
    queryKey: ["settlements", "list", user?.id],
    queryFn: fetchMySettlements,
    enabled: !!user?.id && isCreator,
  });
}

export function useAllSettlements() {
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  return useQuery({
    queryKey: ["settlements", "all"],
    queryFn: fetchAllSettlements,
    enabled: isAdmin,
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

