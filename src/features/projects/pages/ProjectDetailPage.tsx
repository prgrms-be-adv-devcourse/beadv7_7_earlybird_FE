import { useState } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Clock } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Mascot,
  ProgressMeter,
  Skeleton,
  Thumbnail,
  TicketStubIcon,
} from "../../../shared/ui";
import { ProjectBoardTabs } from "../../board/components/ProjectBoardTabs";
import { useProject, useRewards } from "../hooks";
import { daysLeft, fundedPercent } from "../utils";

function NestStatus({ percent }: { percent: number }) {
  const stage = percent >= 200 ? "chick" : percent >= 100 ? "hatched" : "egg";
  const emoji = stage === "chick" ? "🐤" : stage === "hatched" ? "🐣" : "🥚";
  const label =
    stage === "chick" ? "새끼가 자라고 있어요" : stage === "hatched" ? "방금 부화했어요" : "알을 품고 있어요";

  return (
    <div className="flex items-center gap-1.5 text-xs text-mist">
      <span aria-hidden>{emoji}</span>
      둥지 상태: {label}
    </div>
  );
}

function MascotPreview() {
  const [playing, setPlaying] = useState(false);

  function play() {
    if (playing) return;
    setPlaying(true);
    setTimeout(() => setPlaying(false), 2300);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={play}
        disabled={playing}
        className="w-full rounded-sm border-2 border-ink/20 px-3 py-2 text-xs font-semibold text-mist transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-60"
      >
        🎬 후원 연출 미리보기 (데모)
      </button>

      <AnimatePresence>
        {playing && (
          <div className="pointer-events-none absolute inset-x-0 -top-3 z-10 h-10">
            <motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 1, 0] }}
              transition={{ duration: 0.9, times: [0, 0.45, 0.55] }}
              className="absolute left-8 top-1 text-lg"
            >
              🐛
            </motion.span>
            <motion.div
              initial={{ x: "110%", y: 0, opacity: 0 }}
              animate={{ x: ["110%", "40%", "-120%"], y: [0, -14, 6], opacity: [0, 1, 1] }}
              transition={{ duration: 0.9, ease: "easeInOut", times: [0, 0.5, 1] }}
              className="absolute top-0"
            >
              <Mascot className="h-10 w-10" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {playing && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.9, duration: 0.3 }}
            className="mt-2 text-center text-xs font-semibold text-brand"
          >
            둥지에 먹이를 가져다줬어요! (미리보기)
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function FundingPanel({
  project,
  rewards,
  selectedRewardId,
  onSelectReward,
}: {
  project: NonNullable<ReturnType<typeof useProject>["data"]>;
  rewards: ReturnType<typeof useRewards>["data"];
  selectedRewardId: number | null;
  onSelectReward: (id: number) => void;
}) {
  const percent = fundedPercent(project.fundedAmount, project.goalAmount);
  const remaining = daysLeft(project.endAt);
  const selectedReward = rewards?.find((reward) => reward.rewardId === selectedRewardId);

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <ProgressMeter percent={percent} />
        <div className="mt-2 flex items-baseline justify-between text-sm text-mist">
          <span className="font-display text-lg font-extrabold tabular-nums text-ink">
            {Math.round(percent)}%
          </span>
          <span className="tabular-nums">{project.fundedAmount.toLocaleString()}원</span>
        </div>
        <div className="tabular-nums text-xs text-mist">목표 {project.goalAmount.toLocaleString()}원</div>
        <div className="mt-2 flex items-center gap-1 text-xs text-mist">
          <Clock className="h-3.5 w-3.5" />
          {remaining > 0 ? `${remaining}일 남음` : "마감"}
        </div>
        <div className="mt-1">
          <NestStatus percent={percent} />
        </div>
      </div>

      <div className="border-t-2 border-ink/10 pt-4">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">리워드 선택</h2>
        {!rewards || rewards.length === 0 ? (
          <EmptyState message="등록된 리워드가 없어요." />
        ) : (
          <ul className="flex flex-col gap-2">
            {rewards.map((reward) => {
              const selected = reward.rewardId === selectedRewardId;
              return (
                <li key={reward.rewardId}>
                  <button
                    type="button"
                    onClick={() => onSelectReward(reward.rewardId)}
                    aria-pressed={selected}
                    className={`flex w-full items-center justify-between gap-3 rounded-sm border-2 p-3 text-left transition-colors ${
                      selected ? "border-brand bg-brand/5" : "border-ink/20 hover:border-ink/40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <TicketStubIcon
                        className={`h-5 w-5 shrink-0 ${selected ? "text-brand" : "text-ink/40"}`}
                      />
                      {reward.name}
                    </span>
                    <span className="tabular-nums text-sm font-semibold text-ink">
                      {reward.price.toLocaleString()}원 (남은 {reward.remainingQuantity ?? "무제한"})
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        disabled
        title="장바구니・결제 연동 준비 중입니다"
        className="w-full cursor-not-allowed rounded-sm border-2 border-ink bg-brand px-4 py-3 text-sm font-bold text-white opacity-40"
      >
        {selectedReward ? `${selectedReward.name} 후원하기` : "리워드를 선택해주세요"}
      </button>

      <MascotPreview />
    </Card>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const { data: project, isPending, isError } = useProject(projectId);
  const { data: rewards } = useRewards(projectId);
  const [selectedRewardId, setSelectedRewardId] = useState<number | null>(null);

  if (isPending) {
    return (
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
        <div className="flex flex-col gap-6">
          <Skeleton className="aspect-[16/9] w-full" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (isError || !project) return <ErrorState error={{ message: "프로젝트를 불러오지 못했습니다.", errors: null }} />;

  const percent = fundedPercent(project.fundedAmount, project.goalAmount);

  return (
    <div className="flex flex-col gap-6 pb-24 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8 lg:pb-0">
      <div className="flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
          <Card className="!p-0">
            <Thumbnail className="aspect-[16/9] w-full" />
            <div className="p-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h1 className="font-display text-2xl font-bold text-ink">{project.title}</h1>
                <Badge tone="mint">{project.status}</Badge>
              </div>
              <p className="text-mist">{project.summary}</p>
            </div>
          </Card>
        </motion.div>

        {project.description && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card>
              <h2 className="mb-3 font-display text-xl font-semibold text-ink">스토리</h2>
              <p className="whitespace-pre-line leading-relaxed text-ink/80">{project.description}</p>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <ProjectBoardTabs projectId={projectId} />
        </motion.div>
      </div>

      <div className="lg:sticky lg:top-24">
        <FundingPanel
          project={project}
          rewards={rewards}
          selectedRewardId={selectedRewardId}
          onSelectReward={setSelectedRewardId}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 border-t-2 border-ink bg-surface px-4 py-3 lg:hidden">
        <div className="tabular-nums text-sm font-bold text-ink">{Math.round(percent)}% 달성</div>
        <button
          type="button"
          disabled
          title="장바구니・결제 연동 준비 중입니다"
          className="flex-1 max-w-[220px] cursor-not-allowed rounded-sm border-2 border-ink bg-brand px-4 py-2 text-sm font-bold text-white opacity-40"
        >
          후원하기
        </button>
      </div>
    </div>
  );
}
