import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import axios from "axios";
import { Pencil } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  ErrorState,
  ProgressMeter,
  Skeleton,
  SupportButton,
  Thumbnail,
  TicketStubIcon,
  EmptyState,
} from "../../../shared/ui";
import { useProject, useRewards } from "../hooks";
import { useCategories } from "../../admin/hooks";
import { useAddCartItems } from "../../cart/hooks";
import { useAuthStore } from "../../../shared/auth/authStore";
import { ProjectBoardTabs } from "../../board/components/ProjectBoardTabs";
import { ProjectEditModal } from "../components/ProjectEditModal";
import { RewardEditModal } from "../components/RewardEditModal";
import {
  useApproveProject,
  useRejectProject,
  useExtendProjectDeadline,
  useCancelProjectByAdmin,
  useDecreaseRewardQuantity,
  useDeactivateReward,
} from "../../admin/hooks";
import type { ProjectDetail, Reward } from "../types";
import { getStatusLabel, getStatusBadgeTone, getOrderClosedMessage, formatDateKorean, getCreatorDisplayName } from "../utils";

function daysLeft(endAt: string): number {
  const end = new Date(`${endAt}T23:59:59`);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function fundedPercent(funded: number, goal: number): number {
  if (!goal) return 0;
  return (funded / goal) * 100;
}

function NestStatus({ percent }: { percent: number }) {
  let statusText = "🪺 알 준비 단계 (0%)";
  if (percent >= 100) statusText = "🐣 부화 성공! (100% 이상)";
  else if (percent >= 75) statusText = "🪺 알 깨어나는 중 (75%+)";
  else if (percent >= 50) statusText = "🪺 알 온기 가득 (50%+)";
  else if (percent >= 25) statusText = "🪺 알 품기 시작 (25%+)";

  return <div className="text-xs font-semibold text-brand">{statusText}</div>;
}

function FundingPanel({
  project,
  rewards,
  selectedRewardId,
  onSelectReward,
  selectedReward,
  selectedQuantity,
  onChangeQuantity,
  onAddToCart,
  isAddingToCart,
  flightTrigger,
  feedback,
  isOrderable,
}: {
  project: ProjectDetail;
  rewards: Reward[] | undefined;
  selectedRewardId: number | null;
  onSelectReward: (id: number) => void;
  selectedReward: Reward | undefined;
  selectedQuantity: number;
  onChangeQuantity: (qty: number) => void;
  onAddToCart: () => void;
  isAddingToCart: boolean;
  flightTrigger: number;
  feedback: string | null;
  isOrderable: boolean;
}) {
  const percent = fundedPercent(project.fundedAmount, project.goalAmount);
  const remaining = daysLeft(project.endAt);

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

        <div className="mt-3 flex flex-col gap-1 border-t border-ink/10 pt-2 text-xs text-mist">
          <div>🗓️ 시작일: <strong className="text-ink">{formatDateKorean(project.startAt)}</strong></div>
          <div>⏰ 마감일: <strong className="text-ink">{formatDateKorean(project.endAt)} ({remaining > 0 ? `${remaining}일 남음` : "마감"})</strong></div>
          <div>
            👤 창작자:{" "}
            {project.creatorId ? (
              <Link
                to={`/projects?creatorId=${project.creatorId}`}
                className="font-bold text-brand hover:underline"
              >
                {getCreatorDisplayName(project.creatorId)}
              </Link>
            ) : (
              <strong className="text-ink">{getCreatorDisplayName(project.creatorId)}</strong>
            )}
          </div>
        </div>

        <div className="mt-2">
          <NestStatus percent={percent} />
        </div>
      </div>

      <div className="border-t-2 border-ink/10 pt-4">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">리워드 선택</h2>
        {!rewards || rewards.length === 0 ? (
          <EmptyState message="등록된 리워드가 없어요." />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {rewards.map((reward) => {
              const selected = reward.rewardId === selectedRewardId;
              return (
                <li key={reward.rewardId}>
                  <button
                    type="button"
                    onClick={() => isOrderable && onSelectReward(reward.rewardId)}
                    disabled={!isOrderable}
                    aria-pressed={selected}
                    className={`flex w-full items-center justify-between gap-3 rounded-sm border-2 p-3 text-left transition-colors ${
                      !isOrderable
                        ? "cursor-not-allowed border-ink/10 opacity-50"
                        : selected
                          ? "border-brand bg-brand/5"
                          : "border-ink/20 hover:border-ink/40"
                    }`}
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <TicketStubIcon
                          className={`h-4 w-4 shrink-0 ${selected ? "text-brand" : "text-ink/40"}`}
                        />
                        <span className="font-bold text-ink text-sm leading-snug break-keep">{reward.name}</span>
                      </div>
                      {reward.description && (
                        <p className="pl-6 text-xs text-mist leading-normal break-keep whitespace-pre-line">
                          {reward.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right whitespace-nowrap flex flex-col items-end gap-1">
                      <span className="tabular-nums text-sm font-extrabold text-ink">{reward.price.toLocaleString()}원</span>
                      <span className="text-[11px] font-semibold text-mist bg-surface px-1.5 py-0.5 rounded border border-ink/15">
                        {reward.remainingQuantity != null ? `재고 ${reward.remainingQuantity.toLocaleString()}개 남음` : "수량 무제한"}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selectedReward && (
        <div className="flex flex-col gap-2 rounded-sm bg-brand/5 border border-brand/20 p-3">
          <div className="text-xs flex items-center justify-between">
            <span className="font-bold text-brand shrink-0">선택된 리워드:</span>
            <span className="font-bold text-ink truncate ml-2">{selectedReward.name}</span>
          </div>
          {selectedReward.description && (
            <p className="text-xs text-mist leading-relaxed whitespace-pre-line border-t border-brand/10 pt-1.5 mt-0.5">
              {selectedReward.description}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-brand/10 pt-2 text-xs">
            <span className="font-semibold text-ink">수량 선택:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChangeQuantity(Math.max(1, selectedQuantity - 1))}
                disabled={selectedQuantity <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-sm border border-ink/20 font-bold text-ink hover:bg-ink/10 active:scale-95 disabled:opacity-30"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={selectedReward.remainingQuantity ?? 999}
                value={selectedQuantity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const max = selectedReward.remainingQuantity ?? 999;
                  if (!isNaN(val) && val >= 1) {
                    onChangeQuantity(Math.min(val, max));
                  }
                }}
                className="h-7 w-12 text-center font-bold tabular-nums text-ink border border-ink/20 rounded-sm focus:border-brand focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const max = selectedReward.remainingQuantity ?? 999;
                  onChangeQuantity(Math.min(max, selectedQuantity + 1));
                }}
                disabled={selectedReward.remainingQuantity != null && selectedQuantity >= selectedReward.remainingQuantity}
                className="flex h-7 w-7 items-center justify-center rounded-sm border border-ink/20 font-bold text-ink hover:bg-ink/10 active:scale-95 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-ink border-t border-brand/10 pt-2 mt-1">
            <span>총 후원 금액:</span>
            <span className="text-sm font-extrabold text-brand tabular-nums">
              {(selectedReward.price * selectedQuantity).toLocaleString()}원
            </span>
          </div>
        </div>
      )}

      <SupportButton
        label={
          !isOrderable
            ? getOrderClosedMessage(project.status)
            : isAddingToCart
              ? "장바구니에 담는 중..."
              : selectedReward
                ? `장바구니에 담기 (${selectedQuantity}개)`
                : "리워드를 선택해주세요"
        }
        disabled={!isOrderable || !selectedReward || isAddingToCart}
        onClick={onAddToCart}
        trigger={flightTrigger}
      />
      {feedback && <p className="text-center text-xs font-semibold text-brand">{feedback}</p>}
    </Card>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const { data: project, isPending, isError } = useProject(projectId);
  const { data: rewards } = useRewards(projectId);
  const { data: categories } = useCategories();
  const categoryName = categories?.find((c) => c.id === project?.categoryId)?.name;

  const [selectedRewardId, setSelectedRewardId] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [panelFlight, setPanelFlight] = useState(0);
  const [footerFlight, setFooterFlight] = useState(0);

  // Admin / Creator permission mutations
  const approveMutation = useApproveProject();
  const rejectMutation = useRejectProject();
  const extendDeadlineMutation = useExtendProjectDeadline();
  const adminCancelMutation = useCancelProjectByAdmin();
  const decreaseRewardQtyMutation = useDecreaseRewardQuantity();
  const deactivateRewardMutation = useDeactivateReward();

  // Owner (creator) inline edit — pencil button reveals per-section edit buttons
  const [ownerEditMode, setOwnerEditMode] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Admin decrease reward modal
  const [targetRewardId, setTargetRewardId] = useState<number | null>(null);
  const [decreaseAmount, setDecreaseAmount] = useState<number>(10);

  // Admin panel success/error feedback (deactivate, decrease qty, extend deadline)
  const [adminMsg, setAdminMsg] = useState<string | null>(null);
  const showAdminMsg = (msg: string) => {
    setAdminMsg(msg);
    setTimeout(() => setAdminMsg(null), 4000);
  };
  const getAdminErrorMsg = (error: unknown) =>
    axios.isAxiosError(error)
      ? error.response?.data?.error?.message ?? error.message
      : "요청에 실패했습니다.";

  // Admin extend deadline modal
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [newEndAt, setNewEndAt] = useState("2026-12-31");

  // Admin project reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const addCartItems = useAddCartItems();

  const selectedReward = rewards?.find((reward) => reward.rewardId === selectedRewardId);

  useEffect(() => {
    if (rewards && selectedRewardId !== null) {
      const exists = rewards.some((r) => r.rewardId === selectedRewardId);
      if (!exists) {
        setSelectedRewardId(null);
        setSelectedQuantity(1);
      }
    }
  }, [rewards, selectedRewardId]);

  const handleSelectReward = (rewardId: number) => {
    setSelectedRewardId(rewardId);
    setSelectedQuantity(1);
  };

  function handleAddToCart(source: "panel" | "footer") {
    if (!selectedReward || project?.status !== "IN_PROGRESS") return;
    if (!user) {
      navigate("/login");
      return;
    }
    const targetProjectId = selectedReward.projectId ?? projectId;
    addCartItems.mutate(
      { projectId: targetProjectId, items: [{ rewardId: selectedReward.rewardId, quantity: selectedQuantity }] },
      {
        onSuccess: () => {
          if (source === "panel") setPanelFlight((k) => k + 1);
          else setFooterFlight((k) => k + 1);
          setTimeout(() => {
            setFeedback(`장바구니에 ${selectedQuantity}개 담았어요!`);
            setTimeout(() => setFeedback(null), 2500);
          }, 900);
        },
        onError: (error) => {
          console.error("Cart add error:", error);
          queryClient.invalidateQueries({ queryKey: ["rewards", "list", projectId] });

          if (axios.isAxiosError(error) && error.response?.status === 401) {
            logout();
            navigate("/login");
            return;
          }

          let serverMsg: string | null = null;
          if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            if (data?.error?.message) {
              serverMsg = data.error.message;
            } else if (data?.message) {
              serverMsg = data.message;
            } else if (error.message) {
              serverMsg = error.message;
            }
          }

          let friendlyMsg = "담기에 실패했어요. 다시 시도해주세요.";
          if (serverMsg) {
            if (serverMsg.includes("does not belong to the project")) {
              friendlyMsg = "장바구니 연동 정보를 확인 중입니다. 잠시 후 다시 시도해 주세요.";
            } else if (serverMsg.includes("not orderable")) {
              friendlyMsg = "현재 구매 신청할 수 없는 리워드입니다.";
            } else if (serverMsg.includes("insufficient")) {
              friendlyMsg = "리워드 재고가 부족합니다.";
            } else {
              friendlyMsg = serverMsg;
            }
          }

          setFeedback(friendlyMsg);
          setTimeout(() => setFeedback(null), 5000);
        },
      },
    );
  }

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
  const isAdmin = user?.role === "ADMIN";
  // 다른 창작자의 프로젝트가 아니라 "본인" 프로젝트일 때만 창작자 패널을 보여준다.
  const isCreator = user?.role === "CREATOR" && project.creatorId === user?.id;
  const isPublished = project.status === "IN_PROGRESS";
  const isPendingReview = project.status === "PENDING_REVIEW";

  return (
    <div className="flex flex-col gap-6 pb-24 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8 lg:pb-0">
      <div className="flex flex-col gap-6">
        {project.isOwnerPreview && project.status === "REJECTED" && (
          <div className="rounded-sm border-2 border-red-300 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
            ❌ 심사가 반려됐어요. 창작자 본인에게만 보이는 미리보기입니다.
            {project.rejectReason && <div className="mt-1 font-normal">반려 사유: {project.rejectReason}</div>}
          </div>
        )}
        {project.isOwnerPreview && project.status !== "REJECTED" && (
          <div className="rounded-sm border-2 border-amber-300 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
            ⌛ 심사 대기 중인 프로젝트예요. 창작자 본인에게만 보이는 미리보기입니다.
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
          <Card className="!p-0">
            <Thumbnail className="aspect-[16/9] w-full" />
            <div className="p-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-ink">{project.title}</h1>
                  {isCreator && (
                    <button
                      type="button"
                      aria-label="프로젝트 정보 수정"
                      onClick={() => setOwnerEditMode((v) => !v)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border ${ownerEditMode ? "border-brand bg-brand/10 text-brand" : "border-ink/20 text-mist hover:border-brand hover:text-brand"}`}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
                <Badge tone={getStatusBadgeTone(project.status)}>{getStatusLabel(project.status)}</Badge>
              </div>
              {categoryName && <p className="mb-1 text-xs font-medium text-brand">📁 {categoryName}</p>}
              <p className="text-mist">{project.summary}</p>
            </div>
          </Card>
        </motion.div>

        {/* ADMIN Control Panel */}
        {isAdmin && (
          <Card className="border-2 border-brand/40 bg-brand/5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-ink">🛡️ 관리자(ADMIN) 운영 패널</span>
              <span className="text-xs text-mist font-mono">Status: {project.status}</span>
            </div>
            <p className="text-xs text-mist">
              공개 후 리워드 수량 축소 및 비활성화, 마감일 연장, 프로젝트 취소는 관리자 전용 권한입니다.
            </p>
            {adminMsg && <p className="text-xs font-semibold text-brand">{adminMsg}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              {isPendingReview && (
                <>
                  <Button
                    onClick={() => approveMutation.mutate(projectId)}
                    disabled={approveMutation.isPending}
                    className="py-1 px-3 text-xs"
                  >
                    심사 승인
                  </Button>
                  <Button
                    variant="secondary"
                    className="py-1 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => setRejectModalOpen(true)}
                    disabled={rejectMutation.isPending}
                  >
                    심사 반려
                  </Button>
                </>
              )}

              {isPublished && (
                <>
                  <Button
                    variant="secondary"
                    className="py-1 px-3 text-xs border-brand text-brand hover:bg-brand/10"
                    onClick={() => setExtendModalOpen(true)}
                  >
                    마감일 연장
                  </Button>
                  <Button
                    variant="secondary"
                    className="py-1 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => adminCancelMutation.mutate(projectId)}
                    disabled={adminCancelMutation.isPending}
                  >
                    프로젝트 강제 취소
                  </Button>
                </>
              )}
            </div>

            {/* Admin Reward Management */}
            {rewards && rewards.length > 0 && isPublished && (
              <div className="mt-2 border-t border-brand/20 pt-3 flex flex-col gap-2">
                <span className="text-xs font-bold text-ink">리워드 관리 (수량 축소 / 비활성화)</span>
                <ul className="flex flex-col gap-1.5">
                  {rewards.map((r) => (
                    <li key={r.rewardId} className="flex items-center justify-between rounded border border-ink/10 bg-surface p-2 text-xs">
                      <span>{r.name} (남은 수량: {r.remainingQuantity ?? "무제한"})</span>
                      <div className="flex gap-1">
                        <Button
                          variant="secondary"
                          className="py-0.5 px-2 text-[11px]"
                          onClick={() => setTargetRewardId(r.rewardId)}
                        >
                          수량 축소
                        </Button>
                        <Button
                          variant="secondary"
                          className="py-0.5 px-2 text-[11px] border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() =>
                            deactivateRewardMutation.mutate(r.rewardId, {
                              onSuccess: () => showAdminMsg(`✅ "${r.name}" 리워드가 비활성화 되었습니다.`),
                              onError: (error) => showAdminMsg(`❌ ${getAdminErrorMsg(error)}`),
                            })
                          }
                          disabled={deactivateRewardMutation.isPending}
                        >
                          비활성화
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* CREATOR Control Panel */}
        {isCreator && ownerEditMode && (
          <Card className="border-2 border-peach/40 bg-peach/5 flex flex-col gap-3">
            <span className="font-bold text-sm text-ink">🛠️ 창작자(CREATOR) 전용 패널</span>
            {isPublished ? (
              <p className="text-xs text-mist">
                공개 후에는 후원자 보호를 위해 **수량 증가만** 가능합니다. (수량 축소 및 비활성화는 관리자에게 문의하세요)
              </p>
            ) : (
              <p className="text-xs text-mist">
                공개 전 상태이므로 프로젝트 및 리워드를 자유롭게 수정/삭제할 수 있습니다.
              </p>
            )}

            <Button
              variant="secondary"
              className="w-fit py-1 px-3 text-xs border-brand text-brand hover:bg-brand/10"
              onClick={() => setEditingProject(true)}
            >
              ✏️ 프로젝트 정보 수정
            </Button>

            {rewards && rewards.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-ink">리워드 ({rewards.length}개)</span>
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
          </Card>
        )}

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
          onSelectReward={handleSelectReward}
          selectedReward={selectedReward}
          selectedQuantity={selectedQuantity}
          onChangeQuantity={setSelectedQuantity}
          onAddToCart={() => handleAddToCart("panel")}
          isAddingToCart={addCartItems.isPending}
          flightTrigger={panelFlight}
          feedback={feedback}
          isOrderable={isPublished}
        />
      </div>

      {/* Admin extend deadline dialog */}
      <Dialog open={extendModalOpen} onOpenChange={setExtendModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>마감일 연장 (관리자 전용)</DialogTitle>
          <DialogDescription>새로운 마감 날짜를 지정하세요.</DialogDescription>
          <input
            type="date"
            value={newEndAt}
            onChange={(e) => setNewEndAt(e.target.value)}
            className="mt-3 w-full rounded-sm border border-ink/30 px-3 py-2 text-ink"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setExtendModalOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                extendDeadlineMutation.mutate(
                  { id: projectId, endAt: newEndAt },
                  {
                    onSuccess: () => setExtendModalOpen(false),
                    onError: (error) => showAdminMsg(`❌ ${getAdminErrorMsg(error)}`),
                  }
                );
              }}
              disabled={extendDeadlineMutation.isPending}
            >
              {extendDeadlineMutation.isPending ? "연장 중..." : "마감일 연장 적용"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin decrease reward quantity dialog */}
      <Dialog open={!!targetRewardId} onOpenChange={(open) => !open && setTargetRewardId(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>리워드 수량 축소 (관리자 전용)</DialogTitle>
          <DialogDescription>축소할 수량을 입력하세요 (이미 판매된 수량 밑으로는 축소 불가).</DialogDescription>
          <input
            type="number"
            min={1}
            value={decreaseAmount}
            onChange={(e) => setDecreaseAmount(Number(e.target.value))}
            className="mt-3 w-full rounded-sm border border-ink/30 px-3 py-2 text-ink tabular-nums"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTargetRewardId(null)}>
              취소
            </Button>
            <Button
              onClick={() => {
                if (targetRewardId) {
                  decreaseRewardQtyMutation.mutate(
                    { rewardId: targetRewardId, amount: decreaseAmount },
                    {
                      onSuccess: () => setTargetRewardId(null),
                      onError: (error) => showAdminMsg(`❌ ${getAdminErrorMsg(error)}`),
                    }
                  );
                }
              }}
              disabled={decreaseRewardQtyMutation.isPending}
            >
              {decreaseRewardQtyMutation.isPending ? "축소 중..." : "수량 축소 적용"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin project reject dialog */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>프로젝트 심사 반려 (관리자 전용)</DialogTitle>
          <DialogDescription>
            반려 사유를 입력하세요. 입력하신 사유는 창작자 본인에게 전달됩니다. (필수 입력)
          </DialogDescription>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="예: 리워드 상세 정보가 부족하거나, 목표 금액/마감일 설정에 보완이 필요합니다."
            rows={4}
            className="mt-3 w-full rounded-sm border-2 border-ink/20 bg-surface p-3 text-sm text-ink outline-none focus:border-brand"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
              취소
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
              onClick={() => {
                if (!rejectReason.trim()) return;
                rejectMutation.mutate(
                  { id: projectId, reason: rejectReason.trim() },
                  {
                    onSuccess: () => {
                      setRejectModalOpen(false);
                      setRejectReason("");
                    },
                  }
                );
              }}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "반려 처리 중..." : "반려 확정"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 border-t-2 border-ink bg-surface px-4 py-3 lg:hidden">
        <div className="tabular-nums text-sm font-bold text-ink">{Math.round(percent)}% 달성</div>
        <div className="max-w-[220px] flex-1">
          <SupportButton
            label={
              !isPublished
                ? getOrderClosedMessage(project.status)
                : addCartItems.isPending
                  ? "담는 중..."
                  : "후원하기"
            }
            disabled={!isPublished || !selectedReward || addCartItems.isPending}
            onClick={() => handleAddToCart("footer")}
            trigger={footerFlight}
            compact
          />
        </div>
      </div>

      {/* Owner inline edit modals */}
      {editingProject && (
        <ProjectEditModal
          project={project}
          open={editingProject}
          onOpenChange={setEditingProject}
        />
      )}
      {editingReward && (
        <RewardEditModal
          reward={editingReward}
          isPublished={isPublished}
          open={!!editingReward}
          onOpenChange={(open) => !open && setEditingReward(null)}
        />
      )}
    </div>
  );
}
