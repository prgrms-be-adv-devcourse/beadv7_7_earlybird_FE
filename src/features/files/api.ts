import axios from "axios";
import { apiClient } from "../../shared/api/client";
import { FILE_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { FileOwnerType, FileRecord, PresignedUploadRequest, PresignedUploadResponse, RegisterFilePayload } from "./types";

export async function requestPresignedUpload(
  payload: PresignedUploadRequest
): Promise<PresignedUploadResponse> {
  const response = await apiClient.post<ApiResponse<PresignedUploadResponse>>(
    FILE_SERVICE.presignedUpload,
    payload
  );
  return response.data.data as PresignedUploadResponse;
}

// 프리사인드 URL로는 우리 게이트웨이가 아니라 스토리지(S3 등)로 직접 올라가므로, Authorization/
// X-User-Id 같은 apiClient의 자동 헤더를 붙이면 안 된다 — axios를 직접 쓴다.
export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
  requiredHeaders?: Record<string, string>
): Promise<void> {
  await axios.put(uploadUrl, file, { headers: requiredHeaders });
}

export async function registerFile(payload: RegisterFilePayload): Promise<FileRecord> {
  const response = await apiClient.post<ApiResponse<FileRecord>>(FILE_SERVICE.register, payload);
  return response.data.data as FileRecord;
}

export async function deleteFile(fileId: number): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(FILE_SERVICE.file(fileId));
}

export async function fetchFilesByOwner(ownerType: FileOwnerType, ownerId: number): Promise<FileRecord[]> {
  const response = await apiClient.get<ApiResponse<FileRecord[]>>(FILE_SERVICE.filesByOwner(ownerType, ownerId));
  return response.data.data ?? [];
}
