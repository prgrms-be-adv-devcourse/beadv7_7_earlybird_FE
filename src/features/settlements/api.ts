import { apiClient } from "../../shared/api/client";
import { SETTLEMENT_SERVICE, USER_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type {
  AdminCreatorProfile,
  AdminProjectRefundDetail,
  AdminSettlementDetail,
  AdminSettlementEntry,
  AdminSettlementSort,
  Settlement,
} from "./types";

export async function fetchMySettlements(): Promise<Settlement[]> {
  const response = await apiClient.get<ApiResponse<Settlement[]>>(SETTLEMENT_SERVICE.mySettlements);
  return response.data.data ?? [];
}

export async function fetchAllSettlements(sort: AdminSettlementSort = "PUBLISHED_AT"): Promise<AdminSettlementEntry[]> {
  const response = await apiClient.get<ApiResponse<AdminSettlementEntry[]>>(SETTLEMENT_SERVICE.allSettlements, {
    params: { sort },
  });
  return response.data.data ?? [];
}

export async function fetchCreatorProfile(creatorId: number): Promise<AdminCreatorProfile> {
  const response = await apiClient.get<ApiResponse<AdminCreatorProfile>>(USER_SERVICE.creator(creatorId));
  return response.data.data as AdminCreatorProfile;
}

export async function fetchRefundDetail(refundRequestId: string): Promise<AdminProjectRefundDetail | null> {
  const response = await apiClient.get<ApiResponse<AdminProjectRefundDetail>>(
    SETTLEMENT_SERVICE.refundDetail(refundRequestId),
  );
  return response.data.data ?? null;
}

export async function registerCreatorPayoutProfile(creatorId: number): Promise<void> {
  await apiClient.post<ApiResponse<null>>(SETTLEMENT_SERVICE.registerCreatorPayoutProfile(creatorId));
}

export async function fetchSettlementDetail(settlementId: number): Promise<AdminSettlementDetail | null> {
  const response = await apiClient.get<ApiResponse<AdminSettlementDetail>>(SETTLEMENT_SERVICE.settlementDetail(settlementId));
  return response.data.data ?? null;
}

export async function runProjectPayout(payoutMonth: string): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>(SETTLEMENT_SERVICE.runPayout, { payoutMonth });
  return response.data.data;
}

export async function runPgReconciliation(settlementMonth: string): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>(SETTLEMENT_SERVICE.runPgReconciliation, { settlementMonth });
  return response.data.data;
}
