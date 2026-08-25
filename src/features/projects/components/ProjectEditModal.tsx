import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  ErrorState,
} from "../../../shared/ui";
import { useUpdateProject } from "../hooks";
import { useCategories } from "../../admin/hooks";
import { useUploadFile, useFilesByOwner } from "../../files/hooks";
import { ACCEPTED_IMAGE_TYPES, IMAGE_FORMAT_GUIDE } from "../../files/types";
import type { ProjectDetail } from "../types";
import { flattenCategories } from "../utils";

export function ProjectEditModal({
  project,
  open,
  onOpenChange,
}: {
  project: ProjectDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const updateProjectMutation = useUpdateProject();
  const uploadFileMutation = useUploadFile();
  const { data: existingFiles } = useFilesByOwner("PROJECT", project.projectId, open);

  const flatCategoryOptions = useMemo(
    () => flattenCategories(categories ?? []),
    [categories]
  );

  const isPublished = project.status !== "PENDING_REVIEW" && project.status !== "REJECTED";

  const [title, setTitle] = useState(project.title);
  const [categoryId, setCategoryId] = useState<number>(project.categoryId);
  const [summary, setSummary] = useState(project.summary || "");
  const [description, setDescription] = useState(project.description || "");
  const [goalAmount, setGoalAmount] = useState<number>(project.goalAmount);
  const [startAt, setStartAt] = useState(
    project.startAt ? new Date(project.startAt).toISOString().slice(0, 16) : ""
  );
  const [endAt, setEndAt] = useState(project.endAt || "");

  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(project.title);
      setCategoryId(project.categoryId);
      setSummary(project.summary || "");
      setDescription(project.description || "");
      setGoalAmount(project.goalAmount);
      setStartAt(project.startAt ? new Date(project.startAt).toISOString().slice(0, 16) : "");
      setEndAt(project.endAt || "");
      setNewThumbnailFile(null);
      setThumbnailPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setErrorMsg(null);
    } else {
      setThumbnailPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);

    try {
      let uploadedThumbnailId = project.thumbnailId;

      if (newThumbnailFile) {
        const uploaded = await uploadFileMutation.mutateAsync({
          file: newThumbnailFile,
          ownerType: "PROJECT",
          ownerId: project.projectId,
        });
        uploadedThumbnailId = uploaded.id;
      }

      const data: any = isPublished
        ? {
            summary,
            description,
            ...(uploadedThumbnailId ? { thumbnailId: uploadedThumbnailId } : {}),
          }
        : {
            title,
            categoryId,
            summary,
            description,
            goalAmount,
            startAt: startAt ? new Date(startAt).toISOString() : undefined,
            endAt,
            ...(uploadedThumbnailId ? { thumbnailId: uploadedThumbnailId } : {}),
          };

      await updateProjectMutation.mutateAsync({ projectId: project.projectId, data });
      queryClient.invalidateQueries({ queryKey: ["files", "PROJECT", project.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects", project.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || "프로젝트 수정에 실패했습니다.";
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300">
        <DialogTitle>✏️ 프로젝트 정보 수정</DialogTitle>
        <DialogDescription>
          {isPublished
            ? "공개(진행중) 프로젝트는 요약 및 상세 설명만 수정 가능합니다."
            : "공개 전 프로젝트 정보를 수정합니다."}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="my-4 flex flex-col gap-4 text-sm">
          <div>
            <label className="mb-1 block font-semibold text-ink">프로젝트 제목</label>
            <input
              type="text"
              disabled={isPublished}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink disabled:bg-surface disabled:text-mist focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-ink">카테고리</label>
            <select
              disabled={isPublished}
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink disabled:bg-surface disabled:text-mist focus:border-brand focus:outline-none bg-surface"
            >
              {flatCategoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-ink">한 줄 요약</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-ink">상세 스토리</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-ink">대표 이미지 (사진 추가/변경)</label>
            {(thumbnailPreviewUrl || (existingFiles && existingFiles.length > 0)) && (
              <div className="mb-2 relative flex items-center justify-center w-full rounded-sm border border-ink/20 bg-paper/60 p-1">
                <img
                  src={thumbnailPreviewUrl || existingFiles?.[0]?.storedUrl}
                  alt="대표 이미지 미리보기"
                  className="max-h-80 w-full rounded-sm object-contain transition-all duration-300"
                />
              </div>
            )}
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setNewThumbnailFile(file);
                setThumbnailPreviewUrl((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return file ? URL.createObjectURL(file) : null;
                });
              }}
              className="w-full text-xs text-ink file:mr-3 file:rounded-sm file:border file:border-ink/30 file:bg-paper file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-ink hover:file:bg-paper/80"
            />
            <p className="mt-1 text-[11px] text-mist">
              * 지원 형식: {IMAGE_FORMAT_GUIDE} (새로운 이미지를 선택하시면 대표 이미지가 즉시 교체/등록됩니다.)
            </p>
          </div>

          {!isPublished && (
            <>
              <div>
                <label className="mb-1 block font-semibold text-ink">목표 금액 (원)</label>
                <input
                  type="number"
                  value={goalAmount || ""}
                  onChange={(e) => setGoalAmount(Number(e.target.value))}
                  className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none tabular-nums"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-ink">시작 일시</label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-ink">마감 날짜</label>
                  <input
                    type="date"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {errorMsg && <ErrorState error={{ message: errorMsg, errors: null }} />}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSaving || updateProjectMutation.isPending || uploadFileMutation.isPending}>
              {isSaving ? "저장 중..." : "수정 완료"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
