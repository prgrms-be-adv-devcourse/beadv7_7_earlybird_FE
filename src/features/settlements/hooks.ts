import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { fetchMySettlements } from "./api";

export function useMySettlements() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ["settlements", "list", userId],
    queryFn: fetchMySettlements,
    enabled: !!userId,
  });
}
