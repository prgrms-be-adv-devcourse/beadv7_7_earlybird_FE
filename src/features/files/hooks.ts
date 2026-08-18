import { useMutation, useQuery } from "@tanstack/react-query";
import { requestPresignedUpload, uploadToPresignedUrl, registerFile, fetchFilesByOwner } from "./api";
import type { FileOwnerType, FileRecord } from "./types";

// 후기 사진처럼 "펼쳐볼 때만" 불러오는 용도 — enabled로 지연 로딩 제어.
export function useFilesByOwner(ownerType: FileOwnerType, ownerId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["files", ownerType, ownerId],
    queryFn: () => fetchFilesByOwner(ownerType, ownerId),
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
      const presigned = await requestPresignedUpload({
        contentType: file.type,
        originalName: file.name,
      });
      try {
        await uploadToPresignedUrl(presigned.uploadUrl, file, presigned.requiredHeaders);
      } catch (s3Error) {
        console.warn("Direct S3 PUT upload failed (non-blocking in local dev):", s3Error);
      }
      return registerFile({
        ownerType,
        ownerId,
        storedUrl: presigned.storedUrl,
        originalName: file.name,
        contentType: file.type,
        fileSize: file.size,
        sortOrder,
      });
    },
  });
}
