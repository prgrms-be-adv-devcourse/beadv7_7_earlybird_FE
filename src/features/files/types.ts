// file-service File 도메인(file/domain/File.java) 기준. 현재 백엔드 enum(FileOwnerType.java)엔
// PROJECT만 있고, REVIEW는 주석에 "향후 확장" 대상으로만 적혀 있다 — 후기 사진을 쓰려면 백엔드에
// REVIEW 값 추가를 요청해야 한다(PRESIGNED_UPLOAD_SPEC 참고).
export type FileOwnerType = "PROJECT" | "REVIEW";

// PRESIGNED_UPLOAD_SPEC.md에서 백엔드팀에 요청하는 신규 엔드포인트의 응답 shape (아직 미구현 —
// 존재한다고 가정하고 FE를 먼저 짠 것).
export interface PresignedUploadRequest {
  contentType: string;
  originalName: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  storedUrl: string;
  requiredHeaders?: Record<string, string>;
}

// file-service RegisterFileRequest(file/presentation/dto/RegisterFileRequest.java)와 동일한 shape.
export interface RegisterFilePayload {
  ownerType: FileOwnerType;
  ownerId: number;
  storedUrl: string;
  originalName: string;
  contentType: string;
  fileSize: number;
  sortOrder: number;
}

// file-service FileResponse(file/presentation/dto/FileResponse.java) 기준.
export interface FileRecord {
  id: number;
  ownerType: FileOwnerType;
  ownerId: number;
  storedUrl: string;
  originalName: string;
  contentType: string;
  fileSize: number;
  sortOrder: number;
}
