import { apiClient } from "../../shared/api/client";
import { SETTLEMENT_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { Settlement } from "./types";

export async function fetchMySettlements(): Promise<Settlement[]> {
  const response = await apiClient.get<ApiResponse<Settlement[]>>(SETTLEMENT_SERVICE.mySettlements);
  return response.data.data ?? [];
}

export async function fetchAllSettlements(): Promise<Settlement[]> {
  const response = await apiClient.get<ApiResponse<Settlement[]>>(SETTLEMENT_SERVICE.allSettlements, {
    headers: { "X-User-Role": "ADMIN" },
  });
  return response.data.data ?? [];
}
