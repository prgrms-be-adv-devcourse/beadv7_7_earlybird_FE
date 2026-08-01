import { Button, Card, EmptyState, ErrorState, Spinner } from "../../../shared/ui";
import { usePendingProjects, useApproveProject, useRejectProject } from "../hooks";

export function ProjectApprovalPage() {
  const { data: projects, isPending, isError } = usePendingProjects();
  const approveMutation = useApproveProject();
  const rejectMutation = useRejectProject();

  if (isPending) return <Spinner label="심사 대기 프로젝트 불러오는 중..." />;
  if (isError) return <ErrorState error={{ message: "목록을 불러오지 못했습니다.", errors: null }} />;
  if (projects.length === 0) return <EmptyState message="심사 대기 중인 프로젝트가 없어요." />;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-jua text-2xl">프로젝트 승인</h1>
      {projects.map((project) => (
        <Card key={project.projectId} className="flex items-center justify-between">
          <span>{project.title}</span>
          <div className="flex gap-2">
            <Button onClick={() => approveMutation.mutate(project.projectId)}>승인</Button>
            <Button variant="secondary" onClick={() => rejectMutation.mutate({ id: project.projectId, reason: "관리자 반려" })}>
              반려
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
