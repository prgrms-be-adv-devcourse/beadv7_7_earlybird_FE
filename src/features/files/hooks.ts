import { useMutation, useQuery } from "@tanstack/react-query";
import { requestPresignedUpload, uploadToPresignedUrl, registerFile, fetchFilesByOwner } from "./api";
import { saveLocalImage, getLocalImage, fileToDataUrl } from "./imageCache";
import type { FileOwnerType, FileRecord } from "./types";

// 후기 사진 / 프로젝트 사진 / 리워드 사진 조회.
// 로컬 개발 환경(S3 버킷 미존재 시)에서도 IndexedDB/localStorage 캐시를 확인해 실제 업로드한 사진을 선명하게 보여준다.
export function useFilesByOwner(ownerType: FileOwnerType, ownerId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["files", ownerType, ownerId],
    queryFn: async (): Promise<FileRecord[]> => {
      try {
        const records = await fetchFilesByOwner(ownerType, ownerId);
        if (records && records.length > 0) {
          const enriched = await Promise.all(
            records.map(async (record) => {
              const cached =
                (await getLocalImage(record.storedUrl)) ||
                (await getLocalImage(`${ownerType}_${ownerId}`));
              if (cached) {
                return { ...record, storedUrl: cached };
              }
              return record;
            })
          );
          return enriched;
        }
      } catch (err) {
        console.warn("fetchFilesByOwner backend error:", err);
      }

      // 백엔드에 파일이 없거나 오류 발생 시 로컬 캐시 조회
      const fallbackLocal = await getLocalImage(`${ownerType}_${ownerId}`);
      if (fallbackLocal) {
        return [
          {
            id: 0,
            ownerType,
            ownerId,
            storedUrl: fallbackLocal,
            originalName: "local_image.png",
            contentType: "image/png",
            fileSize: 0,
            sortOrder: 0,
          },
        ];
      }

      return [];
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
      // 1. 로컬 개발 환경 즉시 표시를 위해 Base64 Data URL로 로컬 캐시 저장
      let localDataUrl = "";
      try {
        localDataUrl = await fileToDataUrl(file);
        if (localDataUrl) {
          await saveLocalImage(`${ownerType}_${ownerId}`, localDataUrl);
        }
      } catch (cacheErr) {
        console.warn("Failed to cache image locally:", cacheErr);
      }

      // 2. file-service에 presigned upload 요청
      const presigned = await requestPresignedUpload({
        contentType: file.type,
        originalName: file.name,
      });

      if (localDataUrl && presigned?.storedUrl) {
        await saveLocalImage(presigned.storedUrl, localDataUrl);
      }

      // 3. S3 스토리지에 바이너리 PUT 전송 (로컬 환경 S3 버킷 미존재 시 non-blocking 처리)
      try {
        await uploadToPresignedUrl(presigned.uploadUrl, file, presigned.requiredHeaders);
      } catch (s3Error) {
        console.warn("Direct S3 PUT upload failed (non-blocking in local dev):", s3Error);
      }

      // 4. file-service에 메타데이터 등록
      const record = await registerFile({
        ownerType,
        ownerId,
        storedUrl: presigned.storedUrl,
        originalName: file.name,
        contentType: file.type,
        fileSize: file.size,
        sortOrder,
      });

      // 반환 레코드의 storedUrl도 로컬 데이터 URL로 채워 즉시 UI에 반영되도록 함
      return {
        ...record,
        storedUrl: localDataUrl || record.storedUrl,
      };
    },
  });
}
