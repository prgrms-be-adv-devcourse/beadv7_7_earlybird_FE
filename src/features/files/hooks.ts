import { useMutation, useQuery } from "@tanstack/react-query";
import { requestPresignedUpload, uploadToPresignedUrl, registerFile, fetchFilesByOwner } from "./api";
import type { FileOwnerType, FileRecord } from "./types";

// 후기 사진 / 프로젝트 사진 / 리워드 사진 조회.
export function useFilesByOwner(ownerType: FileOwnerType, ownerId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["files", ownerType, ownerId],
    queryFn: async (): Promise<FileRecord[]> => {
      try {
        const records = await fetchFilesByOwner(ownerType, ownerId);
        return records ?? [];
      } catch (err) {
        console.warn("fetchFilesByOwner backend error:", err);
        return [];
      }
    },
    enabled,
  });
}

export interface UploadFileInput {
  file: File;
  ownerType: FileOwnerType;
  ownerId: number;
  sortOrder?: number;
}

// presign → 스토리지에 직접 PUT → 메타데이터 등록, 세 단계를 하나로 묶는다.
export function useUploadFile() {
  return useMutation<FileRecord, unknown, UploadFileInput>({
    mutationFn: async ({ file, ownerType, ownerId, sortOrder = 0 }) => {
      // 1. file-service에 presigned upload 요청
      const presigned = await requestPresignedUpload({
        contentType: file.type,
        originalName: file.name,
      });

      // 2. S3 스토리지에 바이너리 PUT 전송 (로컬 개발 시 버킷 미구성 환경에서만 비차단)
      try {
        await uploadToPresignedUrl(presigned.uploadUrl, file, presigned.requiredHeaders);
      } catch (s3Error) {
        if (import.meta.env.DEV) {
          console.warn("Direct S3 PUT upload failed (non-blocking in local dev):", s3Error);
        } else {
          throw s3Error;
        }
      }

      // 3. file-service에 메타데이터 등록
      const record = await registerFile({
        ownerType,
        ownerId,
        storedUrl: presigned.storedUrl,
        originalName: file.name,
        contentType: file.type,
        fileSize: file.size,
        sortOrder,
      });

      return record;
    },
  });
}
