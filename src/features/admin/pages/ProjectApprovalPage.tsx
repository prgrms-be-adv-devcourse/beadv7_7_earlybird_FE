import { useState } from "react";
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
import { usePendingProjects, useApproveProject, useRejectProject } from "../hooks";

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
        <Button variant="secondary">반려</Button>
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
            <Button variant="ghost">취소</Button>
          </DialogClose>
          <Button onClick={handleReject} disabled={rejectMutation.isPending}>
            {rejectMutation.isPending ? "반려 중..." : "반려하기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectApprovalPage() {
  const { data: projects, isPending, isError } = usePendingProjects();
  const approveMutation = useApproveProject();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">프로젝트 승인</h1>
        {Array.from({ length: 4 }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState error={{ message: "목록을 불러오지 못했습니다.", errors: null }} />;
  if (projects.length === 0) return <EmptyState message="심사 대기 중인 프로젝트가 없어요." />;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-2xl font-bold text-ink">프로젝트 승인</h1>
      {projects.map((project) => (
        <Card key={project.projectId} className="flex items-center justify-between">
          <span>{project.title}</span>
          <div className="flex gap-2">
            <Button onClick={() => approveMutation.mutate(project.projectId)}>승인</Button>
            <RejectButton projectId={project.projectId} />
          </div>
        </Card>
      ))}
    </div>
  );
}
