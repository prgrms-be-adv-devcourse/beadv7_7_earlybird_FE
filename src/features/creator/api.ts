import { apiClient } from "../../shared/api/client";
import { USER_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { CreatorApplication, SubmitCreatorApplicationPayload } from "./types";

export async function submitCreatorApplication(
  payload: SubmitCreatorApplicationPayload
): Promise<CreatorApplication> {
  const response = await apiClient.post<ApiResponse<CreatorApplication>>(
    USER_SERVICE.applyCreator,
    {
      creatorName: payload.creatorName,
      category: payload.category,
      introduction: payload.introduction,
      businessNumber: payload.businessNumber || null,
      portfolioUrl: payload.portfolioUrl || null,
      bankCode: payload.bankCode,
      accountNumber: payload.accountNumber,
      accountHolder: payload.accountHolder,
    }
  );
  return response.data.data as CreatorApplication;
}

export async function fetchCreatorApplications(
  status?: string
): Promise<CreatorApplication[]> {
  const response = await apiClient.get<ApiResponse<CreatorApplication[]>>(
    USER_SERVICE.creatorApplications(status)
  );
  return response.data.data || [];
}

export async function approveCreatorApplication(
  applicationId: number
): Promise<CreatorApplication> {
  const response = await apiClient.post<ApiResponse<CreatorApplication>>(
    USER_SERVICE.approveCreatorApplication(applicationId)
  );
  return response.data.data as CreatorApplication;
}

export async function rejectCreatorApplication(
  applicationId: number,
  rejectReason: string
): Promise<CreatorApplication> {
  const response = await apiClient.post<ApiResponse<CreatorApplication>>(
    USER_SERVICE.rejectCreatorApplication(applicationId),
    { reason: rejectReason }
  );
  return response.data.data as CreatorApplication;
}

export async function fetchMyCreatorApplication(): Promise<CreatorApplication | null> {
  // 백엔드에 별도의 단건 조회 엔드포인트가 없으므로 null 반환 (신청 완료 직후 로컬 state로 완료 안내 표시)
  return null;
}

