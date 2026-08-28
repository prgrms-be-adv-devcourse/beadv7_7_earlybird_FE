import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import axios from "axios";
import { Pencil, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
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
import { useAddCartItems, useCart } from "../../cart/hooks";
import { useAuthStore } from "../../../shared/auth/authStore";
import { useFilesByOwner } from "../../files/hooks";
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
import {
  getStatusLabel,
  getStatusBadgeTone,
  getOrderClosedMessage,
  formatDateKorean,
  getCreatorDisplayName,
  getCategoryPathString,
  maxExtendedEndAt,
} from "../utils";

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

function FundingRewardItem({
  reward,
  selected,
  isOrderable,
  onSelectReward,
}: {
  reward: Reward;
  selected: boolean;
  isOrderable: boolean;
  onSelectReward: (id: number) => void;
}) {
  const { data: rewardFiles } = useFilesByOwner("REWARD", reward.rewardId, true);
  const rewardThumbnailUrl = rewardFiles && rewardFiles.length > 0 ? rewardFiles[0].storedUrl : null;
  const isRewardSoldOut = reward.remainingQuantity != null && reward.remainingQuantity <= 0;
  const isRewardDeactivated = reward.active === false;
  const isItemAvailable = isOrderable && !isRewardDeactivated && !isRewardSoldOut;

  return (
    <li>
      <button
        type="button"
        onClick={() => isItemAvailable && onSelectReward(reward.rewardId)}
        disabled={!isItemAvailable}
        aria-pressed={selected}
        className={`flex w-full items-start gap-3 rounded-sm border-2 p-3 text-left transition-colors ${
          !isItemAvailable
            ? "cursor-not-allowed border-ink/10 opacity-50 bg-paper/40"
            : selected
              ? "border-brand bg-brand/5"
              : "border-ink/20 hover:border-ink/40"
        }`}
      >
        {rewardThumbnailUrl ? (
          <img
            src={rewardThumbnailUrl}
            alt={reward.name}
            className="h-14 w-14 shrink-0 rounded-sm border border-ink/20 object-cover bg-paper"
          />
        ) : (
          <div className="h-10 w-10 shrink-0 rounded-sm border border-ink/15 bg-paper/60 flex items-center justify-center">
            <TicketStubIcon className={`h-5 w-5 ${selected ? "text-brand" : "text-ink/40"}`} />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className={`font-bold text-sm leading-snug break-keep ${isRewardDeactivated ? "text-mist line-through" : "text-ink"}`}>
            {reward.name}
          </span>
          {reward.description && (
            <p className="text-xs text-mist leading-normal break-keep whitespace-pre-line">
              {reward.description}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right whitespace-nowrap flex flex-col items-end gap-1">
          <span className="tabular-nums text-sm font-extrabold text-ink">{reward.price.toLocaleString()}원</span>
          <span
            className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
              isRewardDeactivated
                ? "bg-ink/5 text-mist border-ink/20 font-bold"
                : isRewardSoldOut
                  ? "bg-red-50 text-red-600 border-red-200 font-bold"
                  : "text-mist bg-surface border-ink/15"
            }`}
          >
            {isRewardDeactivated
              ? "판매 종료"
              : isRewardSoldOut
                ? "품절 (재고 0개)"
                : reward.remainingQuantity != null
                  ? `재고 ${reward.remainingQuantity.toLocaleString()}개 남음`
                  : "수량 무제한"}
          </span>
        </div>
      </button>
    </li>
  );
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
  categoryPath,
  currentUser,
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
  categoryPath?: string;
  currentUser?: { id?: number; name?: string } | null;
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
          {categoryPath && (
            <div>
              📁 카테고리:{" "}
              <Link
                to={`/projects?category=${project.categoryId}`}
                className="font-bold text-brand hover:underline"
              >
                {categoryPath}
              </Link>
            </div>
          )}
          <div>🗓️ 시작일: <strong className="text-ink">{formatDateKorean(project.startAt)}</strong></div>
          <div>⏰ 마감일: <strong className="text-ink">{formatDateKorean(project.endAt)} ({remaining > 0 ? `${remaining}일 남음` : "마감"})</strong></div>
          <div>
            👤 창작자:{" "}
            {project.creatorId ? (
              <Link
                to={`/projects?creatorId=${project.creatorId}`}
                className="font-bold text-brand hover:underline"
              >
                {getCreatorDisplayName(project.creatorId, currentUser)}
              </Link>
            ) : (
              <strong className="text-ink">{getCreatorDisplayName(project.creatorId, currentUser)}</strong>
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
            {rewards.map((reward) => (
              <FundingRewardItem
                key={reward.rewardId}
                reward={reward}
                selected={reward.rewardId === selectedRewardId}
                isOrderable={isOrderable}
                onSelectReward={onSelectReward}
              />
            ))}
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

      {(() => {
        const isSoldOut = selectedReward && selectedReward.remainingQuantity != null && selectedReward.remainingQuantity <= 0;
        const isDeactivated = selectedReward && selectedReward.active === false;
        return (
          <SupportButton
            label={
              !isOrderable
                ? getOrderClosedMessage(project.status)
                : isDeactivated
                  ? "판매 종료된 리워드입니다"
                  : isSoldOut
                    ? "품절된 리워드입니다"
                    : isAddingToCart
                      ? "장바구니에 담는 중..."
                      : selectedReward
                        ? `장바구니에 담기 (${selectedQuantity}개)`
                        : "리워드를 선택해주세요"
            }
            disabled={!isOrderable || !selectedReward || Boolean(isSoldOut) || Boolean(isDeactivated) || isAddingToCart}
            onClick={onAddToCart}
            trigger={flightTrigger}
          />
        );
      })()}
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
  const { data: projectFiles } = useFilesByOwner("PROJECT", projectId, true);
  const categoryPath = getCategoryPathString(categories, project?.categoryId);
  const projectThumbnailUrl = projectFiles && projectFiles.length > 0 ? projectFiles[0].storedUrl : null;

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
  const [decreaseAmount, setDecreaseAmount] = useState<number | string>(10);
  const [decreaseErrorMsg, setDecreaseErrorMsg] = useState<string | null>(null);

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
  const [extendErrorMsg, setExtendErrorMsg] = useState<string | null>(null);

  // Admin project reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Other project cart replacement confirmation modal
  const [cartConfirmModalOpen, setCartConfirmModalOpen] = useState(false);
  const [pendingCartSource, setPendingCartSource] = useState<"panel" | "footer">("panel");

  const addCartItems = useAddCartItems();
  const { data: cart } = useCart();

  const selectedReward = rewards?.find((reward) => reward.rewardId === selectedRewardId);

  // Reset selected reward state when route projectId changes
  useEffect(() => {
    setSelectedRewardId(null);
    setSelectedQuantity(1);
    setFeedback(null);
  }, [projectId]);

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
    if (selectedReward.remainingQuantity != null && selectedReward.remainingQuantity <= 0) {
      setFeedback("품절된 리워드는 장바구니에 담을 수 없습니다.");
      return;
    }
    if (!user) {
      navigate("/login");
      return;
    }
    const targetProjectId =
      selectedReward.projectId && selectedReward.projectId > 0
        ? selectedReward.projectId
        : projectId;

    // 장바구니는 단일 프로젝트 정책(BE: cart.retainProjectItems)이라 다른 프로젝트 리워드를 담으면
    // 기존 장바구니 항목이 교체된다 — 사용자에게 확인 모달(AlertDialog)로 명확히 안내한다.
    const hasOtherProjectItems = cart?.projects.some(
      (p) => p.projectId !== targetProjectId && p.rewards && p.rewards.length > 0
    );
    if (hasOtherProjectItems) {
      setPendingCartSource(source);
      setCartConfirmModalOpen(true);
      return;
    }

    executeAddToCart(source);
  }

  function executeAddToCart(source: "panel" | "footer") {
    if (!selectedReward) return;
    const targetProjectId =
      selectedReward.projectId && selectedReward.projectId > 0
        ? selectedReward.projectId
        : projectId;

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
              friendlyMsg = "프로젝트에 포함되지 않은 리워드입니다.";
            } else if (serverMsg.includes("not orderable")) {
              friendlyMsg = "현재 구매 신청할 수 없는 리워드입니다.";
            } else if (serverMsg.includes("insufficient") || serverMsg.includes("stock") || serverMsg.includes("재고")) {
              friendlyMsg = "리워드 재고가 부족합니다.";
            } else if (serverMsg.includes("exceed 99")) {
              friendlyMsg = "장바구니 수량은 최대 99개까지 가능합니다.";
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
        {project.status === "REJECTED" && (
          <div className="rounded-sm border-2 border-red-300 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
            {isAdmin ? "❌ 심사가 반려된 프로젝트예요. (관리자 열람 모드)" : "❌ 심사가 반려됐어요. 창작자 본인에게만 보이는 미리보기입니다."}
            {project.rejectReason && <div className="mt-1 font-normal">반려 사유: {project.rejectReason}</div>}
          </div>
        )}
        {project.status === "PENDING_REVIEW" && (
          <div className="rounded-sm border-2 border-amber-300 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
            {isAdmin ? "⌛ 심사 대기 중인 프로젝트예요. (관리자 심사 모드)" : "⌛ 심사 대기 중인 프로젝트예요. 창작자 본인에게만 보이는 미리보기입니다."}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
          <Card className="!p-0 overflow-hidden">
            <Thumbnail
              src={projectThumbnailUrl}
              alt={project.title}
              className="w-full aspect-[16/9] max-h-[580px] bg-paper/40 transition-all duration-300"
              objectFit="contain"
            />
            <div className="p-6">
              <div className="mb-2 flex flex-col gap-1.5">
                {categoryPath && (
                  <Link
                    to={`/projects?category=${project.categoryId}`}
                    className="w-fit inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                  >
                    📁 {categoryPath}
                  </Link>
                )}
                <div className="flex items-center justify-between gap-3">
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
              </div>
              <p className="text-mist">{project.summary}</p>
              {project.status === "REJECTED" && (
                <div className="mt-3 rounded-sm border-2 border-red-300 bg-red-50 p-3.5 text-xs text-red-800 flex flex-col gap-1">
                  <div className="flex items-center gap-1 font-bold text-red-900 text-sm">
                    <span>❌ 프로젝트 심사 반려 안내</span>
                  </div>
                  <p className="text-red-950 font-medium whitespace-pre-line leading-relaxed">
                    {project.rejectReason || "관리자에 의해 심사가 반려되었습니다. 프로젝트 정보를 수정한 후 다시 등록해주세요."}
                  </p>
                </div>
              )}
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
                    onClick={() =>
                      approveMutation.mutate(projectId, {
                        onSuccess: () =>
                          showAdminMsg("✅ 프로젝트 심사가 승인되어 공개(IN_PROGRESS) 상태로 전환되었습니다."),
                        onError: (error) =>
                          showAdminMsg(`❌ ${getAdminErrorMsg(error)}`),
                      })
                    }
                    disabled={approveMutation.isPending}
                    className="py-1 px-3 text-xs"
                  >
                    {approveMutation.isPending ? "승인 처리 중..." : "심사 승인"}
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
                    onClick={() => {
                      if (
                        window.confirm(
                          "정말 이 프로젝트를 관리자 권한으로 강제 취소하시겠습니까?\n\n취소 후에는 복구할 수 없으며, 후원자들에게 환불 절차가 진행됩니다."
                        )
                      ) {
                        adminCancelMutation.mutate(projectId, {
                          onSuccess: () =>
                            showAdminMsg("✅ 프로젝트가 관리자에 의해 강제 취소되었습니다."),
                          onError: (error) =>
                            showAdminMsg(`❌ ${getAdminErrorMsg(error)}`),
                        });
                      }
                    }}
                    disabled={adminCancelMutation.isPending}
                  >
                    {adminCancelMutation.isPending ? "취소 처리 중..." : "프로젝트 강제 취소"}
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
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`truncate ${r.active === false ? "line-through text-mist" : ""}`}>
                          {r.name} (남은 수량: {r.remainingQuantity ?? "무제한"})
                        </span>
                        {r.active === false && (
                          <span className="rounded bg-ink/10 px-1 text-[10px] font-bold text-mist shrink-0">
                            비활성화됨
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="secondary"
                          className="py-0.5 px-2 text-[11px]"
                          onClick={() => setTargetRewardId(r.rewardId)}
                          disabled={r.active === false}
                        >
                          수량 축소
                        </Button>
                        <Button
                          variant="secondary"
                          className={`py-0.5 px-2 text-[11px] ${
                            r.active === false
                              ? "opacity-50 cursor-not-allowed text-mist border-ink/10"
                              : "border-red-300 text-red-600 hover:bg-red-50"
                          }`}
                          onClick={() => {
                            if (
                              window.confirm(
                                `"${r.name}" 리워드를 비활성화하시겠습니까?\n\n비활성화 후에는 후원자가 더 이상 해당 리워드를 선택하거나 구매할 수 없습니다.`
                              )
                            ) {
                              deactivateRewardMutation.mutate(r.rewardId, {
                                onSuccess: () => showAdminMsg(`✅ "${r.name}" 리워드가 비활성화 되었습니다.`),
                                onError: (error) => showAdminMsg(`❌ ${getAdminErrorMsg(error)}`),
                              });
                            }
                          }}
                          disabled={deactivateRewardMutation.isPending || r.active === false}
                        >
                          {r.active === false ? "비활성화됨" : "비활성화"}
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
          currentUser={user}
          isOrderable={isPublished}
          categoryPath={categoryPath}
        />
      </div>

      {/* Admin extend deadline dialog */}
      <Dialog
        open={extendModalOpen}
        onOpenChange={(v) => {
          setExtendModalOpen(v);
          if (v) setExtendErrorMsg(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogTitle>마감일 연장 (관리자 전용)</DialogTitle>
          <DialogDescription>
            새로운 마감 날짜를 지정하세요. (프로젝트 시작일로부터 최대 3개월까지 가능)
          </DialogDescription>
          {(() => {
            const maxEndAt = project.startAt ? maxExtendedEndAt(project.startAt) : undefined;

            return (
              <>
                <input
                  type="date"
                  value={newEndAt}
                  max={maxEndAt}
                  onChange={(e) => setNewEndAt(e.target.value)}
                  className="mt-3 w-full rounded-sm border border-ink/30 px-3 py-2 text-ink"
                />
                {extendErrorMsg && (
                  <div className="mt-3 flex items-start gap-2 rounded-md border-2 border-red-400 bg-red-50 p-2.5 text-xs font-bold text-red-900 shadow-sm">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{extendErrorMsg}</span>
                  </div>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setExtendModalOpen(false)}>
                    취소
                  </Button>
                  <Button
                    onClick={() => {
                      setExtendErrorMsg(null);
                      if (maxEndAt && newEndAt > maxEndAt) {
                        setExtendErrorMsg(`마감일은 시작일 기준 최대 3개월(${maxEndAt})을 초과할 수 없습니다.`);
                        return;
                      }
                      extendDeadlineMutation.mutate(
                        { id: projectId, endAt: newEndAt },
                        {
                          onSuccess: () => {
                            setExtendModalOpen(false);
                            setExtendErrorMsg(null);
                            showAdminMsg("✅ 마감일이 성공적으로 연장되었습니다.");
                          },
                          onError: (error) => {
                            const msg = getAdminErrorMsg(error);
                            setExtendErrorMsg(msg);
                          },
                        }
                      );
                    }}
                    disabled={extendDeadlineMutation.isPending}
                  >
                    {extendDeadlineMutation.isPending ? "연장 중..." : "마감일 연장 적용"}
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Admin decrease reward quantity dialog */}
      <Dialog
        open={!!targetRewardId}
        onOpenChange={(open) => {
          if (!open) {
            setTargetRewardId(null);
            setDecreaseErrorMsg(null);
          } else {
            setDecreaseAmount(10);
            setDecreaseErrorMsg(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogTitle>리워드 수량 축소 (관리자 전용)</DialogTitle>
          <DialogDescription>축소할 수량을 입력하세요 (이미 판매된 수량 밑으로는 축소 불가).</DialogDescription>
          <input
            type="number"
            min={1}
            value={decreaseAmount}
            placeholder="축소할 수량 입력"
            onChange={(e) => setDecreaseAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-3 w-full rounded-sm border border-ink/30 px-3 py-2 text-ink tabular-nums"
          />

          {decreaseErrorMsg && (
            <div className="mt-3 flex items-start gap-2 rounded-md border-2 border-red-400 bg-red-50 p-3 text-xs font-bold text-red-900 shadow-sm">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-tight">{decreaseErrorMsg}</span>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setTargetRewardId(null);
                setDecreaseErrorMsg(null);
              }}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                if (targetRewardId) {
                  const numAmount = Number(decreaseAmount);
                  if (!numAmount || numAmount <= 0) {
                    setDecreaseErrorMsg("1개 이상의 축소할 수량을 입력해주세요.");
                    return;
                  }
                  setDecreaseErrorMsg(null);
                  decreaseRewardQtyMutation.mutate(
                    { rewardId: targetRewardId, amount: numAmount },
                    {
                      onSuccess: () => {
                        setTargetRewardId(null);
                        setDecreaseErrorMsg(null);
                        showAdminMsg("✅ 리워드 수량이 성공적으로 축소되었습니다.");
                      },
                      onError: (error) => {
                        const msg = getAdminErrorMsg(error);
                        setDecreaseErrorMsg(msg);
                      },
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
                      showAdminMsg("✅ 프로젝트 심사가 반려 처리되었습니다.");
                    },
                    onError: (error) => {
                      showAdminMsg(`❌ ${getAdminErrorMsg(error)}`);
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
                : selectedReward?.active === false
                  ? "판매 종료된 리워드입니다"
                  : selectedReward && selectedReward.remainingQuantity != null && selectedReward.remainingQuantity <= 0
                    ? "품절된 리워드입니다"
                    : addCartItems.isPending
                      ? "담는 중..."
                      : "후원하기"
            }
            disabled={
              !isPublished ||
              !selectedReward ||
              selectedReward.active === false ||
              (selectedReward.remainingQuantity != null && selectedReward.remainingQuantity <= 0) ||
              addCartItems.isPending
            }
            onClick={() => handleAddToCart("footer")}
            trigger={footerFlight}
            compact
          />
        </div>
      </div>

      {/* Other Project Cart Replacement Confirmation Modal */}
      <AlertDialog open={cartConfirmModalOpen} onOpenChange={setCartConfirmModalOpen}>
        <AlertDialogContent>
          <AlertDialogTitle className="font-display text-lg font-bold text-ink">
            장바구니를 비우고 새로 담을까요?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-mist leading-relaxed mt-2">
            장바구니에는 한 번에 하나의 프로젝트 리워드만 담을 수 있어요.
            <br />
            이 리워드를 담으면 기존 장바구니에 담겨 있던 다른 프로젝트의 리워드가 모두 삭제됩니다.
          </AlertDialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialogCancel asChild>
              <Button variant="secondary">취소</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={() => {
                  setCartConfirmModalOpen(false);
                  executeAddToCart(pendingCartSource);
                }}
              >
                기존 항목 비우고 담기
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

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
