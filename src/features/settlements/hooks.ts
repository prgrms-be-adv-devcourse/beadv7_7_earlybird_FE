import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { fetchAllSettlements, fetchMySettlements } from "./api";

export function useMySettlements() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ["settlements", "list", userId],
    queryFn: fetchMySettlements,
    enabled: !!userId,
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
