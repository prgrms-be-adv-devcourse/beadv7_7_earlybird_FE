import { apiClient } from "../../shared/api/client";
import { SETTLEMENT_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { AdminSettlementDetail, Settlement } from "./types";

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

export async function fetchSettlementDetail(settlementId: number): Promise<AdminSettlementDetail | null> {
  const response = await apiClient.get<ApiResponse<AdminSettlementDetail>>(
    SETTLEMENT_SERVICE.settlementDetail(settlementId),
    { headers: { "X-User-Role": "ADMIN" } }
  );
  return response.data.data ?? null;
}

export async function runProjectPayout(payoutMonth: string): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>(
    SETTLEMENT_SERVICE.runPayout,
    { payoutMonth },
    { headers: { "X-User-Role": "ADMIN" } }
  );
  return response.data.data;
}

export async function runPgReconciliation(settlementMonth: string): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>(
    SETTLEMENT_SERVICE.runPgReconciliation,
    { settlementMonth },
    { headers: { "X-User-Role": "ADMIN" } }
  );
  return response.data.data;
}

