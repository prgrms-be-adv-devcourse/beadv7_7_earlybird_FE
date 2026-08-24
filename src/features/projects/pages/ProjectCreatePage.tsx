import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateProject, useCreateReward, useUpdateProject } from "../hooks";
import { useCategories } from "../../admin/hooks";
import { useAuthStore } from "../../../shared/auth/authStore";
import { useUploadFile } from "../../files/hooks";
import { Button, Card, ErrorState } from "../../../shared/ui";
import type { CreateRewardRequest } from "../types";
import { flattenCategories } from "../utils";

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: categories } = useCategories();

  const createProjectMutation = useCreateProject();
  const createRewardMutation = useCreateReward();
  const updateProjectMutation = useUpdateProject();
  const uploadFileMutation = useUploadFile();

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

  // Thumbnail (파일 자체는 프로젝트 생성 후 projectId를 ownerId로 삼아 업로드한다 — 생성 전엔
  // 아직 ownerId가 없다.)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setThumbnailFile(file);
    setThumbnailPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const [rewardFiles, setRewardFiles] = useState<(File | null)[]>([null]);
  const [rewardPreviews, setRewardPreviews] = useState<(string | null)[]>([null]);

  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);
  const [createdRewardIds, setCreatedRewardIds] = useState<(number | null)[]>([]);
  const [imageUploadFailed, setImageUploadFailed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const flatCategoryOptions = useMemo(
    () => flattenCategories(categories ?? []),
    [categories]
  );

  const handleAddReward = () => {
    setRewards((prev) => [
      ...prev,
      { name: "", description: "", price: 10000, totalQuantity: 50 },
    ]);
    setRewardFiles((prev) => [...prev, null]);
    setRewardPreviews((prev) => [...prev, null]);
    setCreatedRewardIds((prev) => [...prev, null]);
  };

  const handleRemoveReward = (index: number) => {
    if (rewards.length <= 1) return;
    setRewards((prev) => prev.filter((_, i) => i !== index));
    setRewardFiles((prev) => prev.filter((_, i) => i !== index));
    setRewardPreviews((prev) => prev.filter((_, i) => i !== index));
    setCreatedRewardIds((prev) => prev.filter((_, i) => i !== index));
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

    if (!createdProjectId) {
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

      if (
        !window.confirm(
          "프로젝트 심사를 신청하시겠습니까?\n\n심사 제출 후에는 프로젝트 제목, 목표 금액 등 주요 정보 수정에 제한이 있을 수 있습니다."
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);
    let projectId = createdProjectId;
    const rewardIds = [...createdRewardIds];

    try {
      // 1. Create project (if not already created)
      if (!projectId) {
        const createdProject = await createProjectMutation.mutateAsync({
          title,
          categoryId,
          summary,
          description,
          goalAmount,
          // 백엔드 startAt은 LocalDateTime(zone 없음) — toISOString()의 trailing "Z"를 붙이면 파싱
          // 에러가 난다. datetime-local 입력값(yyyy-MM-ddTHH:mm)에 초만 붙여서 그대로 보낸다.
          startAt: `${startAt}:00`,
          endAt,
        });
        projectId = createdProject.projectId;
        setCreatedProjectId(projectId);
      }

      // 2. Create rewards for project (if not already created)
      for (let i = 0; i < rewards.length; i++) {
        if (!rewardIds[i]) {
          const reward = rewards[i];
          const createdReward = await createRewardMutation.mutateAsync({
            projectId,
            data: {
              name: reward.name,
              description: reward.description,
              price: Number(reward.price),
              totalQuantity: reward.totalQuantity ? Number(reward.totalQuantity) : null,
            },
          });
          rewardIds[i] = createdReward.rewardId;
          setCreatedRewardIds([...rewardIds]);
        }
      }
    } catch (err: any) {
      console.error("Project / Reward creation error:", err);
      const msg = err.response?.data?.error?.message || err.message || "프로젝트 생성에 실패했습니다.";
      setErrorMsg(msg);
      setIsSubmitting(false);
      return;
    }

    // 3. Upload images (reward photos and project thumbnail)
    try {
      for (let i = 0; i < rewards.length; i++) {
        const rewardImg = rewardFiles[i];
        const rewardId = rewardIds[i];
        if (rewardImg && rewardId) {
          await uploadFileMutation.mutateAsync({
            file: rewardImg,
            ownerType: "REWARD",
            ownerId: rewardId,
          });
          // 업로드 완료된 파일은 비워서 재시도 시 중복 업로드 방지
          setRewardFiles((prev) => prev.map((f, idx) => (idx === i ? null : f)));
        }
      }

      if (thumbnailFile && projectId) {
        const uploaded = await uploadFileMutation.mutateAsync({
          file: thumbnailFile,
          ownerType: "PROJECT",
          ownerId: projectId,
        });
        await updateProjectMutation.mutateAsync({
          projectId,
          data: { thumbnailId: uploaded.id },
        });
        setThumbnailFile(null);
      }

      setImageUploadFailed(false);
      navigate("/projects/me");
    } catch (err: any) {
      console.error("Image upload error after project creation:", err);
      setImageUploadFailed(true);
      const msg = err.response?.data?.error?.message || err.message || "이미지 업로드에 실패했습니다.";
      setErrorMsg(`프로젝트는 정상적으로 생성되었으나 이미지 업로드에 실패했습니다 (${msg}). '내 프로젝트 관리' 화면에서 이미지를 다시 등록하시거나 아래 재시도 버튼을 눌러주세요.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role === "ADMIN") {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center gap-3">
        <h2 className="font-display text-xl font-bold text-ink">🚫 프로젝트 생성 불가</h2>
        <p className="text-sm text-mist">
          관리자(ADMIN) 계정은 프로젝트를 직접 등록할 수 없습니다. 프로젝트 등록은 창작자(CREATOR) 전용 권한입니다.
        </p>
        <Button onClick={() => navigate("/projects")} className="mt-2">
          전체 프로젝트로 돌아가기
        </Button>
      </Card>
    );
  }



  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">🚀 새 프로젝트 만들기</h1>
          <p className="text-sm text-mist">새로운 아이디어를 얼리버드 수공예/창작 펀딩으로 오픈하세요!</p>
        </div>
      </div>

      {createdProjectId && (
        <div className="rounded-md border border-brand/30 bg-brand/5 p-4 text-sm text-ink">
          <p className="font-bold text-brand">✅ 프로젝트 기본 정보와 리워드가 DB에 등록되었습니다 (ID: #{createdProjectId})</p>
          <p className="text-xs text-mist mt-1">
            프로젝트는 이미 생성되어 중복 등록되지 않습니다. 이미지 업로드를 완료하시거나 '내 프로젝트 관리'에서 확인하실 수 있습니다.
          </p>
        </div>
      )}

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
              disabled={createdProjectId !== null}
              placeholder="예: 고양이 자동 급식기 v2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink disabled:bg-surface disabled:text-mist focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">카테고리 *</label>
            <select
              disabled={createdProjectId !== null}
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink disabled:bg-surface disabled:text-mist focus:border-brand focus:outline-none bg-surface"
            >
              {flatCategoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">한 줄 요약</label>
            <input
              type="text"
              disabled={createdProjectId !== null}
              placeholder="프로젝트를 한 문장으로 소개해 주세요"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink disabled:bg-surface disabled:text-mist focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">상세 설명</label>
            <textarea
              rows={5}
              disabled={createdProjectId !== null}
              placeholder="프로젝트의 특징, 개발 스토리, 리워드 상세 구성을 적어주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink disabled:bg-surface disabled:text-mist focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">대표 이미지 (선택)</label>
            {thumbnailPreviewUrl && (
              <div className="mb-2 flex items-center justify-center w-full rounded-sm border border-ink/20 bg-paper/60 p-1">
                <img
                  src={thumbnailPreviewUrl}
                  alt="대표 이미지 미리보기"
                  className="max-h-80 w-full rounded-sm object-contain transition-all duration-300"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
              onChange={handleThumbnailChange}
              className="w-full text-sm text-ink file:mr-3 file:rounded-sm file:border file:border-ink/30 file:bg-paper file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
            />
            <p className="mt-1 text-xs text-mist">
              * 지원 형식: JPG, JPEG, PNG, WEBP, GIF (권장 크기: 1200x800px 이상)
            </p>
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
              disabled={createdProjectId !== null}
              min={10000}
              step={10000}
              value={goalAmount || ""}
              onChange={(e) => setGoalAmount(Number(e.target.value))}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink disabled:bg-surface disabled:text-mist focus:border-brand focus:outline-none tabular-nums"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">펀딩 시작 일시 *</label>
              <input
                type="datetime-local"
                required
                disabled={createdProjectId !== null}
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink disabled:bg-surface disabled:text-mist focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">펀딩 종료 날짜 *</label>
              <input
                type="date"
                required
                disabled={createdProjectId !== null}
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink disabled:bg-surface disabled:text-mist focus:border-brand focus:outline-none"
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
                    value={reward.price || ""}
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

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">리워드 사진 (선택)</label>
                {rewardPreviews[index] && (
                  <div className="mb-2 flex items-center justify-center w-full rounded-sm border border-ink/20 bg-paper/60 p-1">
                    <img
                      src={rewardPreviews[index]!}
                      alt={`리워드 #${index + 1} 미리보기`}
                      className="max-h-36 w-full rounded-sm object-contain transition-all duration-300"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setRewardFiles((prev) => prev.map((f, i) => (i === index ? file : f)));
                    setRewardPreviews((prev) =>
                      prev.map((p, i) => (i === index ? (file ? URL.createObjectURL(file) : null) : p))
                    );
                  }}
                  className="w-full text-xs text-ink file:mr-3 file:rounded file:border file:border-ink/30 file:bg-paper file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-ink hover:file:bg-paper/80"
                />
                <p className="mt-1 text-[11px] text-mist">
                  * 지원 형식: JPG, JPEG, PNG, WEBP, GIF
                </p>
              </div>
            </div>
          ))}
        </Card>

        {errorMsg && <ErrorState error={{ message: errorMsg, errors: null }} />}

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          {imageUploadFailed && createdProjectId ? (
            <>
              <Button type="button" variant="secondary" onClick={() => navigate("/projects/me")}>
                내 프로젝트 관리로 이동
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-8 text-base font-bold text-white bg-amber-600 hover:bg-amber-700"
              >
                {isSubmitting ? "이미지 업로드 중..." : "🔄 이미지 업로드 재시도"}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting} className="py-3 px-8 text-base font-bold text-white">
                {isSubmitting ? "프로젝트 오픈 중..." : "🚀 프로젝트 오픈하기"}
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
