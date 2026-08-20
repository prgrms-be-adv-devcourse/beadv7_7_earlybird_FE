import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle, Sparkles, Building2, User, FileText, ArrowRight } from "lucide-react";
import { useAuthStore } from "../../../shared/auth/authStore";
import { useMyCreatorApplication, useSubmitCreatorApplication, useCancelCreatorApplication } from "../hooks";
import { BANK_LIST } from "../types";
import { Button, Card, Badge, Mascot, Dialog, DialogContent, DialogTitle, DialogDescription } from "../../../shared/ui";

const CATEGORIES = [
  "패션",
  "전자기기",
  "도서·출판",
  "반려동물",
  "라이프스타일",
  "홈·리빙",
  "푸드",
  "예술·디자인",
  "기타",
];

export function CreatorApplyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: application, isLoading } = useMyCreatorApplication();
  const submitMutation = useSubmitCreatorApplication();
  const cancelMutation = useCancelCreatorApplication();

  const [creatorName, setCreatorName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [introduction, setIntroduction] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState(BANK_LIST[0].code);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState(user?.name || "");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeHonesty, setAgreeHonesty] = useState(false);

  const [isEditingRejected, setIsEditingRejected] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (application) {
      setCreatorName(application.creatorName || "");
      setCategory(application.category || CATEGORIES[0]);
      setIntroduction(application.introduction || "");
      setBusinessNumber(application.businessNumber || "");
      setPortfolioUrl(application.portfolioUrl || "");
      setSelectedBankCode(application.bankCode || BANK_LIST[0].code);
      setAccountNumber(application.accountNumber || "");
      setAccountHolder(application.accountHolder || user?.name || "");
    }
  }, [application, user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Mascot variant="face" className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-bold text-ink">로그인이 필요합니다</h2>
        <p className="mt-2 text-sm text-mist">창작자 신청은 얼리버드 회원만 가능합니다.</p>
        <Button onClick={() => navigate("/login")} className="mt-6">
          로그인하러 가기
        </Button>
      </div>
    );
  }

  if (user.role === "CREATOR") {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card className="flex flex-col items-center text-center p-8 border-2 border-brand/20 bg-mint/5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <Badge tone="mint" className="mb-2">창작자 인증 완료</Badge>
          <h1 className="font-display text-2xl font-black text-ink">
            {user.name}님은 이미 얼리버드의 창작자입니다! 🎉
          </h1>
          <p className="mt-2 text-sm text-mist max-w-md">
            멋진 아이디어가 준비되셨나요? 지금 바로 새로운 펀딩 프로젝트를 개설하고 후원자들을 만나보세요.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate("/projects/new")} className="gap-2">
              + 새 프로젝트 만들기 <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={() => navigate("/projects/me")}>
              내 프로젝트 관리
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="text-sm text-mist">창작자 신청 정보를 불러오는 중...</div>
      </div>
    );
  }

  // 심사 대기 중 상태
  if (application && application.status === "PENDING") {
    return (
      <div className="mx-auto max-w-2xl py-12">
        {submitSuccess && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border-2 border-mint bg-mint/20 p-4 text-ink shadow-stamp-sm animate-pulse">
            <Sparkles className="h-6 w-6 text-brand shrink-0" />
            <div>
              <h2 className="font-bold text-sm">🎉 창작자 등록 신청이 성공적으로 완료되었습니다!</h2>
              <p className="text-xs text-mist">관리자 심사가 완료되면 창작자(CREATOR) 권한으로 전환됩니다.</p>
            </div>
          </div>
        )}
        <Card className="flex flex-col p-8 border-2 border-amber-300 bg-amber-50/40">
          <div className="flex items-center gap-3 border-b border-ink/10 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-ink">창작자 전환 심사가 진행 중입니다</h1>
                <Badge tone="peach">심사 대기</Badge>
              </div>
              <p className="text-xs text-mist mt-0.5">
                신청 일시: {new Date(application.appliedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          <div className="my-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div className="rounded-sm bg-white p-4 border border-ink/10">
              <span className="text-xs text-mist block">창작자 / 팀명</span>
              <span className="font-bold text-ink text-base">{application.creatorName}</span>
              <span className="mt-1 inline-block text-xs text-brand font-semibold">분야: {application.category}</span>
              {application.businessNumber && (
                <span className="text-xs text-mist block mt-1">사업자번호: {application.businessNumber}</span>
              )}
            </div>
            <div className="rounded-sm bg-white p-4 border border-ink/10">
              <span className="text-xs text-mist block">정산 계좌 정보</span>
              <span className="font-bold text-ink text-base">{application.bankName}</span>
              <span className="text-xs text-mist block mt-0.5">{application.accountNumber} (예금주: {application.accountHolder})</span>
            </div>
            <div className="col-span-full rounded-sm bg-white p-4 border border-ink/10">
              <span className="text-xs text-mist block">소개 및 계획</span>
              <p className="mt-1 text-sm text-ink/80 whitespace-pre-wrap">{application.introduction}</p>
              {application.portfolioUrl && (
                <div className="mt-2 text-xs text-mist">
                  참고 링크: <a href={application.portfolioUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">{application.portfolioUrl}</a>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-sm bg-amber-100/60 p-4 text-xs text-amber-900 leading-relaxed mb-6">
            💡 <strong>관리자 심사 안내</strong>: 영업일 기준 통상 1~2일 내에 심사가 완료됩니다. 심사가 승인되면 별도의 재로그인 없이 즉시 창작자(CREATOR) 권한으로 전환되어 프로젝트를 등록하실 수 있습니다.
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => setIsCancelConfirmOpen(true)}
              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              신청 취소하기
            </Button>
            <Button onClick={() => navigate("/")}>
              홈으로 돌아가기
            </Button>
          </div>
        </Card>

        <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
          <DialogContent className="max-w-sm">
            <DialogTitle>창작자 신청 취소</DialogTitle>
            <DialogDescription>
              정말 창작자 등록 신청을 취소하시겠습니까? 신청 내역이 삭제됩니다.
            </DialogDescription>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsCancelConfirmOpen(false)}>
                돌아가기
              </Button>
              <Button
                variant="secondary"
                disabled={cancelMutation.isPending}
                onClick={() => {
                  cancelMutation.mutate(application.id, {
                    onSuccess: () => {
                      setIsCancelConfirmOpen(false);
                    },
                  });
                }}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {cancelMutation.isPending ? "취소 중..." : "신청 취소 확정"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // 반려된 상태 안내
  if (application && application.status === "REJECTED" && !isEditingRejected && !submitSuccess) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card className="flex flex-col p-8 border-2 border-red-300 bg-red-50/40">
          <div className="flex items-center gap-3 border-b border-ink/10 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-ink">창작자 전환 심사가 반려되었습니다</h1>
                <Badge tone="peach" className="bg-red-100 text-red-700 border-red-300">심사 반려</Badge>
              </div>
              <p className="text-xs text-mist mt-0.5">
                신청일: {new Date(application.appliedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="my-6 rounded-sm bg-white p-5 border border-red-200">
            <span className="text-xs font-bold text-red-700 block mb-1">반려 사유</span>
            <p className="text-sm font-medium text-ink">
              {application.rejectReason || "정산 계좌 정보 불일치 또는 활동 계획 보완이 필요합니다."}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => navigate("/")}>
              홈으로
            </Button>
            <Button onClick={() => setIsEditingRejected(true)} className="gap-2">
              신청서 수정 후 재신청하기 <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!agreeTerms || !agreeHonesty) {
      setErrorMsg("필수 약관 및 서약에 모두 동의해 주세요.");
      return;
    }

    if (!creatorName.trim()) {
      setErrorMsg("창작자 / 팀명을 입력해 주세요.");
      return;
    }

    if (!introduction.trim()) {
      setErrorMsg("창작자 소개 및 펀딩 프로젝트 계획을 입력해 주세요.");
      return;
    }

    if (!accountNumber.trim()) {
      setErrorMsg("정산 계좌번호를 정확히 입력해 주세요.");
      return;
    }

    if (!accountHolder.trim()) {
      setErrorMsg("정산 계좌 예금주명을 입력해 주세요.");
      return;
    }

    const currentBank = BANK_LIST.find((b) => b.code === selectedBankCode) || BANK_LIST[0];

    submitMutation.mutate(
      {
        creatorName: creatorName.trim(),
        category,
        introduction: introduction.trim(),
        businessNumber: businessNumber.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
        bankName: currentBank.name,
        bankCode: currentBank.code,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      },
      {
        onSuccess: () => {
          setSubmitSuccess(true);
          setIsEditingRejected(false);
        },
        onError: (err: any) => {
          const msg =
            err.response?.data?.error?.message ||
            err.response?.data?.message ||
            err.message ||
            "창작자 신청 중 오류가 발생했습니다.";
          setErrorMsg(msg);
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <Badge tone="mint" className="mb-2">Creator Onboarding</Badge>
        <h1 className="font-display text-3xl font-black text-ink">
          ✨ 창작자 등록 신청
        </h1>
        <p className="mt-2 text-sm text-mist">
          얼리버드에서 나만의 멋진 아이디어를 프로젝트로 오픈하고 후원자들과 함께 실현해 보세요.<br />
          신청서를 작성해 주시면 관리자 심사 후 창작자 권한이 부여됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Section 1: 신청자 기본 정보 */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
            <User className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-ink text-base">1. 신청자 기본 정보</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-mist">이름</label>
              <input
                type="text"
                disabled
                value={user.name}
                className="w-full rounded-sm border border-ink/20 bg-paper/60 px-3 py-2 text-xs font-bold text-ink cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-mist">이메일</label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full rounded-sm border border-ink/20 bg-paper/60 px-3 py-2 text-xs text-ink cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-mist">현재 역할</label>
              <input
                type="text"
                disabled
                value={`${user.role} (후원자)`}
                className="w-full rounded-sm border border-ink/20 bg-paper/60 px-3 py-2 text-xs text-brand font-bold cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: 창작자 활동 정보 */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
            <Sparkles className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-ink text-base">2. 창작자 활동 정보</h2>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                창작자 / 팀명 (상호명) *
              </label>
              <input
                type="text"
                required
                placeholder="예: 스튜디오 얼리, 핸드메이드랩"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-mist">프로젝트 상세 및 프로필에 노출될 브랜드/활동명입니다.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">
                  주요 활동 분야 (카테고리) *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-sm border border-ink/30 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none bg-surface"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">
                  사업자등록번호 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 000-00-00000 (개인/법인 사업자)"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value)}
                  className="w-full rounded-sm border border-ink/30 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                창작자 소개 및 펀딩 프로젝트 계획 *
              </label>
              <textarea
                required
                rows={4}
                placeholder="어떤 프로젝트를 기획 중이신지, 창작자로서의 비전이나 제작 계획을 간략히 소개해 주세요."
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                포트폴리오 / SNS / 웹사이트 링크 (선택)
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/... 또는 https://github.com/..."
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: 정산 계좌 정보 */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
            <Building2 className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-ink text-base">3. 정산 계좌 정보 (토스페이먼츠 연동 필수)</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">정산 은행 *</label>
              <select
                value={selectedBankCode}
                onChange={(e) => setSelectedBankCode(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none bg-surface"
              >
                {BANK_LIST.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">계좌번호 *</label>
              <input
                type="text"
                required
                placeholder="'-' 포함 또는 숫자만 입력"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">예금주 *</label>
              <input
                type="text"
                required
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              />
            </div>
          </div>
          <p className="text-[11px] text-mist">
            💡 펀딩 성공 시 모금액 정산이 입금될 본인 명의의 계좌 정보를 정확히 입력해 주세요. 토스페이먼츠 지급 대행 기관 코드가 함께 매핑됩니다.
          </p>
        </Card>

        {/* Section 4: 서약 및 약관 동의 */}
        <Card className="flex flex-col gap-3 bg-mint/5 border border-brand/20">
          <div className="flex items-center gap-2 border-b border-ink/10 pb-2">
            <FileText className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-ink text-sm">4. 창작자 운영 정책 동의</h2>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-ink/90 select-none">
            <input
              type="checkbox"
              required
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink/30 text-brand focus:ring-brand"
            />
            <span>
              <strong>[필수]</strong> 얼리버드 크리에이터 운영 정책 및 펀딩 수수료/정산 정책에 동의합니다.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-ink/90 select-none">
            <input
              type="checkbox"
              required
              checked={agreeHonesty}
              onChange={(e) => setAgreeHonesty(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink/30 text-brand focus:ring-brand"
            />
            <span>
              <strong>[필수]</strong> 허위 정보를 기재하지 않으며, 후원자와의 약속(리워드 발송 및 소통)을 성실히 이행할 것을 서약합니다.
            </span>
          </label>
        </Card>

        {errorMsg && (
          <div className="rounded-sm border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-700">
            ❌ {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="px-8 py-2.5 text-sm font-bold text-white shadow-stamp"
          >
            {submitMutation.isPending ? "신청서 제출 중..." : "창작자 등록 신청하기 🚀"}
          </Button>
        </div>
      </form>
    </div>
  );
}
