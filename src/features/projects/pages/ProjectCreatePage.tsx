import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCategories, useCreateProject, useCreateReward, useApproveProject } from "../hooks";
import { useAuthStore } from "../../../shared/auth/authStore";
import { Button, Card, ErrorState } from "../../../shared/ui";
import type { CreateRewardRequest } from "../types";

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: categories } = useCategories();

  const createProjectMutation = useCreateProject();
  const createRewardMutation = useCreateReward();
  const approveProjectMutation = useApproveProject();

  // Form states
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number>(1);
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState<number>(1000000);

  // Default dates: start today, end in 30 days
  const nowStr = new Date().toISOString().slice(0, 16);
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [startAt, setStartAt] = useState(nowStr);
  const [endAt, setEndAt] = useState(thirtyDaysLater);

  // Rewards list state
  const [rewards, setRewards] = useState<CreateRewardRequest[]>([
    { name: "[얼리버드] 기본 팩", description: "선착순 한정 혜택", price: 30000, totalQuantity: 100 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddReward = () => {
    setRewards((prev) => [
      ...prev,
      { name: "", description: "", price: 10000, totalQuantity: 50 },
    ]);
  };

  const handleRemoveReward = (index: number) => {
    if (rewards.length <= 1) return;
    setRewards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRewardChange = (index: number, field: keyof CreateRewardRequest, value: any) => {
    setRewards((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      navigate("/login");
      return;
    }

    if (!title.trim()) {
      setErrorMsg("프로젝트 제목을 입력해주세요.");
      return;
    }
    if (goalAmount <= 0) {
      setErrorMsg("목표 금액은 0원보다 커야 합니다.");
      return;
    }
    if (rewards.length === 0 || rewards.some((r) => !r.name.trim() || r.price <= 0)) {
      setErrorMsg("최소 1개 이상의 리워드를 입력해야 하며, 이름과 가격은 필수입니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create project
      const createdProject = await createProjectMutation.mutateAsync({
        title,
        categoryId,
        summary,
        description,
        goalAmount,
        startAt: new Date(startAt).toISOString(),
        endAt,
      });

      const projectId = createdProject.projectId;

      // 2. Create rewards for project
      for (const reward of rewards) {
        await createRewardMutation.mutateAsync({
          projectId,
          data: {
            name: reward.name,
            description: reward.description,
            price: Number(reward.price),
            totalQuantity: reward.totalQuantity ? Number(reward.totalQuantity) : null,
          },
        });
      }

      // 3. Approve project so it becomes IN_PROGRESS immediately
      try {
        await approveProjectMutation.mutateAsync(projectId);
      } catch (appErr) {
        console.warn("Auto-approval failed (will remain PENDING_REVIEW):", appErr);
      }

      // 4. Navigate to new project detail page
      navigate(`/projects/${projectId}`);
    } catch (err: any) {
      console.error("Project creation error:", err);
      const msg = err.response?.data?.error?.message || err.message || "프로젝트 생성에 실패했습니다.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">🚀 새 프로젝트 만들기</h1>
          <p className="text-sm text-mist">새로운 아이디어를 얼리버드 수공예/창작 펀딩으로 오픈하세요!</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Section 1: Basic Info */}
        <Card className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-bold text-ink border-b border-ink/10 pb-2">
            1. 프로젝트 기본 정보
          </h2>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">프로젝트 제목 *</label>
            <input
              type="text"
              required
              placeholder="예: 고양이 자동 급식기 v2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">카테고리 *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none bg-surface"
            >
              {categories && categories.length > 0 ? (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              ) : (
                <>
                  <option value={1}>테크 / 가전</option>
                  <option value={2}>패션 / 잡화</option>
                  <option value={3}>푸드</option>
                  <option value={4}>홈 / 리빙</option>
                  <option value={5}>뷰티</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">한 줄 요약</label>
            <input
              type="text"
              placeholder="프로젝트를 한 문장으로 소개해 주세요"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">상세 설명</label>
            <textarea
              rows={5}
              placeholder="프로젝트의 특징, 개발 스토리, 리워드 상세 구성을 적어주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
            />
          </div>
        </Card>

        {/* Section 2: Funding Goal */}
        <Card className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-bold text-ink border-b border-ink/10 pb-2">
            2. 펀딩 목표 및 기간
          </h2>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">목표 금액 (원) *</label>
            <input
              type="number"
              required
              min={10000}
              step={10000}
              value={goalAmount}
              onChange={(e) => setGoalAmount(Number(e.target.value))}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none tabular-nums"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">펀딩 시작 일시 *</label>
              <input
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">펀딩 종료 날짜 *</label>
              <input
                type="date"
                required
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Reward Options */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-2">
            <h2 className="font-display text-lg font-bold text-ink">
              3. 리워드 구성 (최소 1개)
            </h2>
            <Button type="button" variant="secondary" onClick={handleAddReward} className="text-xs">
              + 리워드 추가
            </Button>
          </div>

          {rewards.map((reward, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-sm border border-ink/20 p-4 bg-paper/50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-ink">리워드 #{index + 1}</span>
                {rewards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveReward(index)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    삭제
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">리워드 이름 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: [얼리버드] 급식기 1대"
                    value={reward.name}
                    onChange={(e) => handleRewardChange(index, "name", e.target.value)}
                    className="w-full rounded-sm border border-ink/30 px-3 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">가격 (원) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={reward.price}
                    onChange={(e) => handleRewardChange(index, "price", Number(e.target.value))}
                    className="w-full rounded-sm border border-ink/30 px-3 py-1.5 text-sm text-ink focus:border-brand focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">설명</label>
                  <input
                    type="text"
                    placeholder="리워드 구성품 상세 설명"
                    value={reward.description}
                    onChange={(e) => handleRewardChange(index, "description", e.target.value)}
                    className="w-full rounded-sm border border-ink/30 px-3 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">한정 수량 (선택)</label>
                  <input
                    type="number"
                    placeholder="비워두면 무제한"
                    value={reward.totalQuantity ?? ""}
                    onChange={(e) =>
                      handleRewardChange(
                        index,
                        "totalQuantity",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="w-full rounded-sm border border-ink/30 px-3 py-1.5 text-sm text-ink focus:border-brand focus:outline-none tabular-nums"
                  />
                </div>
              </div>
            </div>
          ))}
        </Card>

        {errorMsg && <ErrorState error={{ message: errorMsg, errors: null }} />}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting} className="py-3 px-8 text-base font-bold text-white">
            {isSubmitting ? "프로젝트 오픈 중..." : "🚀 프로젝트 오픈하기"}
          </Button>
        </div>
      </form>
    </div>
  );
}
