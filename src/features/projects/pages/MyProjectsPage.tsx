import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import { PROJECT_SERVICE } from "../../../shared/api/endpoints";
import type { ApiResponse } from "../../../shared/types/ApiResponse";
import type { ProjectSummary, Reward } from "../types";
import { fetchMyProjects } from "../api";
import { useCreateReward, useDeleteProject, useRewards } from "../hooks";
import { formatDateKorean } from "../utils";
import { ProjectEditModal } from "../components/ProjectEditModal";
import { RewardEditModal } from "../components/RewardEditModal";
import { useFilesByOwner } from "../../files/hooks";
import {
  Button,
  Card,
  CardSkeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  ErrorState,
  Thumbnail,
} from "../../../shared/ui";

export async function cancelMyProject(projectId: number): Promise<void> {
  await apiClient.post<ApiResponse<null>>(`${PROJECT_SERVICE.project(projectId)}/cancel`);
}

function MyProjectCard({ project }: { project: ProjectSummary }) {
  const queryClient = useQueryClient();
  const { data: rewards } = useRewards(project.projectId);
  const { data: projectFiles } = useFilesByOwner("PROJECT", project.projectId, true);
  const thumbnailUrl = projectFiles && projectFiles.length > 0 ? projectFiles[0].storedUrl : null;

  const [editingProject, setEditingProject] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelMyProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", "me"] }),
  });

  const deleteProjectMutation = useDeleteProject();

  const isPublished = project.status === "IN_PROGRESS";
  const isPrePublish = project.status === "PENDING_REVIEW" || project.status === "REJECTED";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_REVIEW":
        return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">⌛ 심사 대기</span>;
      case "IN_PROGRESS":
        return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">🔥 펀딩 진행중</span>;
      case "REJECTED":
        return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">❌ 심사 반려</span>;
      case "SUCCEEDED":
        return <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">🎉 펀딩 성공</span>;
      case "FAILED":
        return <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">종료 (미달)</span>;
      case "CANCELLED":
        return <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800">취소됨</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">{status}</span>;
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <Thumbnail
          src={thumbnailUrl}
          alt={project.title}
          className="w-full sm:w-36 h-28 aspect-[16/10] sm:aspect-auto rounded-sm shrink-0"
          objectFit="cover"
        />
        <div className="flex-1 w-full flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusBadge(project.status)}
              <h2 className="font-display text-lg font-bold text-ink">{project.title}</h2>
            </div>
            <span className="text-xs text-mist font-mono">Project ID: #{project.projectId}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-sm bg-surface p-3 text-xs text-mist">
            <div>
              <span className="block font-semibold text-ink">목표 금액</span>
              <span className="tabular-nums font-bold text-ink">{project.goalAmount.toLocaleString()}원</span>
            </div>
            <div>
              <span className="block font-semibold text-ink">현재 달성액</span>
              <span className="tabular-nums font-bold text-brand">{project.fundedAmount.toLocaleString()}원</span>
            </div>
            <div>
              <span className="block font-semibold text-ink">시작일 / 생성일</span>
              <span>{formatDateKorean(project.startAt)}</span>
            </div>
            <div>
              <span className="block font-semibold text-ink">마감일</span>
              <span className="font-bold text-ink">{formatDateKorean(project.endAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards List & Quick Edit */}
      {rewards && rewards.length > 0 && (
        <div className="rounded-sm border border-ink/10 bg-paper/40 p-2.5 flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink">등록된 리워드 ({rewards.length}개)</span>
          <div className="flex flex-wrap gap-2">
            {rewards.map((r) => (
              <div
                key={r.rewardId}
                className="flex items-center gap-2 rounded border border-ink/15 bg-surface px-2 py-1 text-xs text-ink"
              >
                <span>
                  {r.name} ({r.price.toLocaleString()}원)
                  {r.totalQuantity != null && (
                    <span className="text-mist"> · 잔여 {r.remainingQuantity ?? 0}/{r.totalQuantity}개</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingReward(r)}
                  className="font-bold text-brand hover:underline text-[11px]"
                >
                  수정
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-3">
        <Link
          to={`/projects/${project.projectId}`}
          className="rounded-sm border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
        >
          상세보기
        </Link>

        <Button
          variant="secondary"
          className="py-1 px-3 text-xs border-ink/20"
          onClick={() => setEditingProject(true)}
        >
          수정
        </Button>

        {isPrePublish && (
          <Button
            variant="secondary"
            className="py-1 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50"
            disabled={deleteProjectMutation.isPending}
            onClick={() => deleteProjectMutation.mutate(project.projectId)}
          >
            삭제
          </Button>
        )}

        {isPublished && (
          <Button
            variant="secondary"
            className="py-1 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50"
            disabled={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate(project.projectId)}
          >
            자진 취소
          </Button>
        )}
      </div>

      {/* Project Edit Modal */}
      {editingProject && (
        <ProjectEditModal
          project={project as any}
          open={editingProject}
          onOpenChange={setEditingProject}
        />
      )}

      {/* Reward Edit Modal */}
      {editingReward && (
        <RewardEditModal
          reward={editingReward}
          isPublished={isPublished}
          open={!!editingReward}
          onOpenChange={(open) => !open && setEditingReward(null)}
        />
      )}
    </Card>
  );
}

export function MyProjectsPage() {
  const { data: myProjects, isPending, isError } = useQuery({
    queryKey: ["projects", "me"],
    queryFn: fetchMyProjects,
  });

  const createRewardMutation = useCreateReward();

  // Add Reward modal state
  const [targetProjectId, setTargetProjectId] = useState<number | null>(null);
  const [rewardName, setRewardName] = useState("");
  const [rewardPrice, setRewardPrice] = useState<number>(10000);
  const [rewardDesc, setRewardDesc] = useState("");
  const [rewardQty, setRewardQty] = useState<number | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);

  const handleAddReward = () => {
    if (!targetProjectId) return;
    setRewardError(null);

    if (!rewardName.trim()) {
      setRewardError("리워드 이름을 입력해 주세요.");
      return;
    }
    if (rewardPrice <= 0) {
      setRewardError("가격은 0원보다 커야 합니다.");
      return;
    }

    createRewardMutation.mutate(
      {
        projectId: targetProjectId,
        data: {
          name: rewardName.trim(),
          price: rewardPrice,
          description: rewardDesc,
          totalQuantity: rewardQty,
        },
      },
      {
        onSuccess: () => {
          setTargetProjectId(null);
          setRewardName("");
          setRewardPrice(10000);
          setRewardDesc("");
          setRewardQty(null);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.error?.message || err.message || "리워드 추가에 실패했습니다.";
          setRewardError(msg);
        },
      }
    );
  };

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">🛠️ 내 프로젝트 관리</h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !myProjects) return <ErrorState error={{ message: "내 프로젝트 목록을 불러오지 못했습니다.", errors: null }} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-ink/10 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">🛠️ 내 프로젝트 관리 (창작자)</h1>
          <p className="text-sm text-mist">내가 개설한 펀딩 프로젝트의 진행 상태를 확인하고 리워드를 관리합니다.</p>
        </div>
        <Link
          to="/projects/new"
          className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white shadow-stamp transition-transform hover:scale-105"
        >
          + 새 프로젝트 오픈
        </Link>
      </div>

      {myProjects.length === 0 ? (
        <EmptyState message="아직 등록하신 프로젝트가 없습니다." />
      ) : (
        <div className="flex flex-col gap-4">
          {myProjects.map((project) => (
            <MyProjectCard key={project.projectId} project={project} />
          ))}
        </div>
      )}

      {/* Add Reward Dialog */}
      <Dialog open={!!targetProjectId} onOpenChange={(open) => !open && setTargetProjectId(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>리워드 추가</DialogTitle>
          <DialogDescription>프로젝트 #{targetProjectId}에 새로운 후원 리워드를 추가합니다.</DialogDescription>

          <div className="my-4 flex flex-col gap-3 text-sm">
            <div>
              <label className="mb-1 block font-semibold text-ink">리워드 이름 *</label>
              <input
                type="text"
                placeholder="예: [얼리버드] 특별 한정 팩"
                value={rewardName}
                onChange={(e) => setRewardName(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink">가격 (원) *</label>
              <input
                type="number"
                min={1000}
                value={rewardPrice || ""}
                onChange={(e) => setRewardPrice(Number(e.target.value))}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink">구성 설명</label>
              <input
                type="text"
                placeholder="리워드 구성 요소"
                value={rewardDesc}
                onChange={(e) => setRewardDesc(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink">총 수량 (선택)</label>
              <input
                type="number"
                placeholder="비워두면 무제한"
                value={rewardQty ?? ""}
                onChange={(e) => setRewardQty(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none tabular-nums"
              />
            </div>

            {rewardError && <ErrorState error={{ message: rewardError, errors: null }} />}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTargetProjectId(null)}>
              취소
            </Button>
            <Button onClick={handleAddReward} disabled={createRewardMutation.isPending}>
              {createRewardMutation.isPending ? "추가 중..." : "리워드 등록"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
