import { useQuery } from "@tanstack/react-query";
import { fetchMySettlements } from "./api";

export function useMySettlements() {
  return useQuery({ queryKey: ["settlements", "me"], queryFn: fetchMySettlements });
}
