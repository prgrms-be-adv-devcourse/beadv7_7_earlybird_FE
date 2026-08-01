import { useParams } from "react-router-dom";
import { Badge, Card, EmptyState, ErrorState, Spinner } from "../../../shared/ui";
import { useProject, useRewards } from "../hooks";

export function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const { data: project, isPending, isError } = useProject(projectId);
  const { data: rewards } = useRewards(projectId);

  if (isPending) return <Spinner label="프로젝트 불러오는 중..." />;
  if (isError || !project) return <ErrorState error={{ message: "프로젝트를 불러오지 못했습니다.", errors: null }} />;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h1 className="font-jua text-2xl">{project.title}</h1>
          <Badge tone="mint">{project.status}</Badge>
        </div>
        <p className="text-slate-600">{project.summary}</p>
        <p className="mt-2 text-sm text-slate-500">
          {project.fundedAmount.toLocaleString()}원 / {project.goalAmount.toLocaleString()}원
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 font-jua text-xl">리워드</h2>
        {!rewards || rewards.length === 0 ? (
          <EmptyState message="등록된 리워드가 없어요." />
        ) : (
          <ul className="flex flex-col gap-2">
            {rewards.map((reward) => (
              <li key={reward.rewardId} className="flex justify-between rounded-2xl bg-mint/10 p-3">
                <span>{reward.name}</span>
                <span>{reward.price.toLocaleString()}원 (남은 {reward.remainingQuantity ?? "무제한"})</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Task 12(board feature)가 이 자리에 공지/후기 탭을 추가한다 */}
      <section id="project-board-slot" />
    </div>
  );
}
