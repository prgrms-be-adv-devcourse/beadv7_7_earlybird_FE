import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorState,
  RowSkeleton,
} from "../../../shared/ui";
import {
  usePendingProjects,
  useApproveProject,
  useRejectProject,
  useExtendProjectDeadline,
  useTriggerCloseExpired,
  useReindexProjects,
} from "../hooks";
import { formatDateKorean, getStatusLabel, getCreatorDisplayName, maxExtendedEndAt } from "../../projects/utils";

function RejectButton({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const rejectMutation = useRejectProject();

  function handleReject() {
    rejectMutation.mutate(
      { id: projectId, reason: reason.trim() || "관리자 반려" },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="border-red-300 text-red-600 hover:bg-red-50">
          반려
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>프로젝트 반려</DialogTitle>
        <DialogDescription className="mt-1">반려 사유를 입력해주세요. 프로젝트 등록자에게 그대로 전달돼요.</DialogDescription>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="반려 사유"
          rows={3}
          className="mt-3 w-full rounded-sm border-2 border-ink/25 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
        <div className="mt-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="secondary">취소</Button>
          </DialogClose>
          <Button onClick={handleReject} disabled={rejectMutation.isPending}>
            {rejectMutation.isPending ? "반려 중..." : "반려하기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExtendDeadlineButton({
  projectId,
  currentEndAt,
  startAt,
}: {
  projectId: number;
  currentEndAt: string;
  startAt?: string;
}) {
  const [open, setOpen] = useState(false);
  const [newEndAt, setNewEndAt] = useState(currentEndAt || "2026-12-31");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const extendMutation = useExtendProjectDeadline();

  const maxEndAt = startAt ? maxExtendedEndAt(startAt) : undefined;

  function handleExtend() {
    setErrorMsg(null);
    if (maxEndAt && newEndAt > maxEndAt) {
      setErrorMsg(`마감일은 시작일 기준 최대 3개월(${maxEndAt})을 초과할 수 없습니다.`);
      return;
    }
    extendMutation.mutate(
      { id: projectId, endAt: newEndAt },
      {
        onSuccess: () => {
          setOpen(false);
          setErrorMsg(null);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.error?.message || err.message || "마감일 연장에 실패했습니다.";
          setErrorMsg(msg);
        },
      }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setErrorMsg(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" className="text-xs">
          마감 연장
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>프로젝트 마감일 연장</DialogTitle>
        <DialogDescription>
          새로운 마감 날짜를 지정해 주세요. (프로젝트 시작일로부터 최대 3개월까지 가능)
        </DialogDescription>
        <input
          type="date"
          value={newEndAt}
          max={maxEndAt}
          onChange={(e) => setNewEndAt(e.target.value)}
          className="mt-3 w-full rounded-sm border border-ink/30 px-3 py-2 text-ink"
        />

        {errorMsg && (
          <div className="mt-3 rounded-sm border-2 border-red-300 bg-red-50 p-2.5 text-xs font-bold text-red-800">
            {errorMsg}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="secondary">취소</Button>
          </DialogClose>
          <Button onClick={handleExtend} disabled={extendMutation.isPending}>
            {extendMutation.isPending ? "연장 중..." : "마감일 연장 완료"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectApprovalPage() {
  const { data: projects, isPending, isError } = usePendingProjects();
  const approveMutation = useApproveProject();
  const triggerCloseExpiredMutation = useTriggerCloseExpired();
  const reindexMutation = useReindexProjects();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">🛡️ 프로젝트 심사 및 관리 (관리자)</h1>
        {Array.from({ length: 4 }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState error={{ message: "목록을 불러오지 못했습니다.", errors: null }} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-ink/10 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">🛡️ 프로젝트 심사 및 관리 (관리자)</h1>
          <p className="text-sm text-mist">등록된 펀딩 심사를 승인/반려하거나 마감 프로젝트 일괄 정산을 트리거합니다.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="border-brand text-brand hover:bg-brand/10 text-xs font-bold"
              onClick={() => triggerCloseExpiredMutation.mutate()}
              disabled={triggerCloseExpiredMutation.isPending}
            >
              {triggerCloseExpiredMutation.isPending ? "정산 배치 실행 중..." : "⚡ 만료 프로젝트 일괄 정산"}
            </Button>
            <Button
              variant="secondary"
              className="border-brand text-brand hover:bg-brand/10 text-xs font-bold"
              onClick={() => reindexMutation.mutate()}
              disabled={reindexMutation.isPending}
            >
              {reindexMutation.isPending ? "재색인 요청 중..." : "🔎 검색 인덱스 재색인"}
            </Button>
          </div>
          {reindexMutation.isSuccess && (
            <span className="text-xs font-semibold text-brand">
              ✅ 재색인이 완료되었습니다.
            </span>
          )}
          {reindexMutation.isError && (
            <span className="text-xs font-semibold text-red-600">❌ 재색인 요청에 실패했습니다.</span>
          )}
          {triggerCloseExpiredMutation.isSuccess && (
            <span className="text-xs font-semibold text-brand">
              ✅ 만료 프로젝트 일괄 정산 요청이 완료되었습니다.
            </span>
          )}
          {triggerCloseExpiredMutation.isError && (
            <span className="text-xs font-semibold text-red-600">❌ 만료 프로젝트 일괄 정산 요청에 실패했습니다.</span>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState message="현재 심사 대기 중인 프로젝트가 없습니다." />
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((project) => (
            <Card key={project.projectId} className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/projects/${project.projectId}`}
                    className="font-display font-bold text-ink text-base hover:text-brand hover:underline transition-colors"
                  >
                    {project.title} ➔
                  </Link>
                  <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                <span className="text-xs text-mist">
                  창작자:{" "}
                  {project.creatorId ? (
                    <Link
                      to={`/projects?creatorId=${project.creatorId}`}
                      className="font-bold text-brand hover:underline"
                    >
                      {getCreatorDisplayName(project.creatorId)}
                    </Link>
                  ) : (
                    <strong className="text-ink">{getCreatorDisplayName(project.creatorId)}</strong>
                  )}{" "}
                  | 시작일/생성일: {formatDateKorean(project.startAt)} | 마감일: <strong className="text-ink">{formatDateKorean(project.endAt)}</strong> | 목표: {project.goalAmount.toLocaleString()}원
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <Link
                  to={`/projects/${project.projectId}`}
                  className="rounded-sm border border-ink/20 px-3 py-2 text-xs font-bold text-ink transition-colors hover:border-brand hover:text-brand"
                >
                  상세보기 🔍
                </Link>
                <ExtendDeadlineButton
                  projectId={project.projectId}
                  currentEndAt={project.endAt}
                  startAt={project.startAt}
                />
                <Button onClick={() => approveMutation.mutate(project.projectId)}>승인</Button>
                <RejectButton projectId={project.projectId} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
