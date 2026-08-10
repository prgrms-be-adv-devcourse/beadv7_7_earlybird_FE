import { useState, useMemo } from "react";
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
  const { data: categories } = useCategories();
  const updateProjectMutation = useUpdateProject();

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

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const data: any = isPublished
      ? {
          summary,
          description,
        }
      : {
          title,
          categoryId,
          summary,
          description,
          goalAmount,
          startAt: startAt ? new Date(startAt).toISOString() : undefined,
          endAt,
        };

    updateProjectMutation.mutate(
      { projectId: project.projectId, data },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err: any) => {
          const msg = err.response?.data?.error?.message || err.message || "프로젝트 수정에 실패했습니다.";
          setErrorMsg(msg);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
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

          {!isPublished && (
            <>
              <div>
                <label className="mb-1 block font-semibold text-ink">목표 금액 (원)</label>
                <input
                  type="number"
                  value={goalAmount}
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
            <Button type="submit" disabled={updateProjectMutation.isPending}>
              {updateProjectMutation.isPending ? "저장 중..." : "수정 완료"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
