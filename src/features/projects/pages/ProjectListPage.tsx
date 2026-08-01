import { Link } from "react-router-dom";
import { Badge, Card, EmptyState, ErrorState, Spinner } from "../../../shared/ui";
import { useProjects } from "../hooks";

export function ProjectListPage() {
  const { data: projects, isPending, isError } = useProjects();

  if (isPending) return <Spinner label="프로젝트 불러오는 중..." />;
  if (isError) return <ErrorState error={{ message: "프로젝트 목록을 불러오지 못했습니다.", errors: null }} />;
  if (projects.length === 0) return <EmptyState message="아직 등록된 프로젝트가 없어요." />;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {projects.map((project) => (
        <Link key={project.projectId} to={`/projects/${project.projectId}`}>
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-jua text-lg">{project.title}</h2>
              <Badge tone="mint">{project.status}</Badge>
            </div>
            <p className="text-sm text-slate-500">
              {project.fundedAmount.toLocaleString()}원 / {project.goalAmount.toLocaleString()}원
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
