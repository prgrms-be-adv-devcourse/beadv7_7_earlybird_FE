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

// 한 owner에 파일이 여러 개 쌓일 수 있으므로(수정 시 새 파일이 추가됨) 표시용 썸네일은
// 항상 project.thumbnailId가 가리키는 파일을 쓴다. thumbnailId가 없는 레거시 프로젝트만
// 첫 파일로 폴백한다. (files[0]만 쓰면 이미지를 바꿔도 예전 파일이 계속 보인다.)
export function resolveThumbnailUrl(
  files: FileRecord[] | undefined,
  thumbnailId?: number | null,
): string | null {
  if (!files || files.length === 0) return null;
  if (thumbnailId != null) {
    const match = files.find((f) => f.id === thumbnailId);
    if (match) return match.storedUrl;
  }
  return files[0].storedUrl;
}

export interface UploadFileInput {
  file: File;
  ownerType: FileOwnerType;
  ownerId: number;
  sortOrder?: number;
}

export function resolveImageContentType(file: File): string {
  if (file.type && file.type.trim().length > 0) {
    const lower = file.type.toLowerCase().trim();
    if (lower === "image/jpg" || lower === "image/pjpeg") return "image/jpeg";
    if (lower.startsWith("image/")) return lower;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
    case "img":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "bmp":
      return "image/bmp";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return "image/jpeg";
  }
}

// presign → 스토리지에 직접 PUT → 메타데이터 등록, 세 단계를 하나로 묶는다.
export function useUploadFile() {
  return useMutation<FileRecord, unknown, UploadFileInput>({
    mutationFn: async ({ file, ownerType, ownerId, sortOrder = 0 }) => {
      const contentType = resolveImageContentType(file);

      // 1. file-service에 presigned upload 요청
      const presigned = await requestPresignedUpload({
        contentType,
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
        contentType,
        fileSize: file.size,
        sortOrder,
      });

      return record;
    },
  });
}
